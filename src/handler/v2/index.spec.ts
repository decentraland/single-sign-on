import { AuthLinkType, ProviderType } from "@dcl/schemas";
import {
  Action,
  ConnectionData,
  IdentityPayload,
  LocalStorageUtils,
  SINGLE_SIGN_ON_TARGET,
} from "@dcl/single-sign-on-client-2";
import { handler } from "../v2";
import { AuthIdentity } from "@dcl/crypto";

let ogWindow: typeof window;
let mockPostMessage: typeof window.parent.postMessage;
let ogLocalStorage: typeof localStorage;
let mockAddress: string;
let mockConnectionData: ConnectionData;
let mockIdentity: AuthIdentity;
let mockIdentityPayload: IdentityPayload;

beforeEach(() => {
  ogWindow = global.window;
  ogLocalStorage = global.localStorage;

  mockPostMessage = jest.fn();

  global.window = {
    parent: {
      postMessage: mockPostMessage,
    },
  } as unknown as typeof window;

  global.localStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  } as unknown as typeof localStorage;

  mockAddress = "0x24e5f44999c151f08609f8e27b2238c773c4d020";

  mockConnectionData = { address: mockAddress, provider: ProviderType.INJECTED };

  mockIdentity = {
    ephemeralIdentity: {
      address: "address",
      publicKey: "publickey",
      privateKey: "privatekey",
    },
    expiration: (() => {
      const today = new Date();
      const tomorrow = today.getDate() + 1;
      today.setDate(tomorrow);

      return today;
    })(),
    authChain: [
      {
        type: AuthLinkType.SIGNER,
        payload: mockAddress,
        signature: "",
      },
      {
        type: AuthLinkType.ECDSA_PERSONAL_EPHEMERAL,
        payload:
          "Decentraland Login\nEphemeral address: 0xF8C8E57A279c1ACAB4d4d7828365fef634FcA15e\nExpiration: 2023-11-26T02:38:41.714Z",
        signature:
          "0xb83500e07d944387a56cd943222313cac18457d60fca2832280c0e0a9faa5a0e1714a5fd92aa3c38ca4076bc609f5ae81aaf1143af1519995027c3ac4978ce9d1b",
      },
    ],
  };

  mockIdentityPayload = {
    address: mockAddress,
    identity: mockIdentity,
  };
});

afterEach(() => {
  global.window = ogWindow;
  global.localStorage = ogLocalStorage;
  jest.clearAllMocks();
});

describe("when handling a v2 client message", () => {
  describe(`when the target is not ${SINGLE_SIGN_ON_TARGET}`, () => {
    it("should ignore the message", () => {
      handler({ data: { target: "invalid" } } as MessageEvent);
      expect(mockPostMessage).not.toHaveBeenCalled();
    });
  });

  describe("when the id is falsy", () => {
    it("should ignore the message", () => {
      handler({ data: { target: SINGLE_SIGN_ON_TARGET, id: 0 } } as MessageEvent);
      expect(mockPostMessage).not.toHaveBeenCalled();
    });
  });

  describe("when the action is invalid", () => {
    it("should ignore the message", () => {
      handler({ data: { target: SINGLE_SIGN_ON_TARGET, id: 1, action: "invalid" } } as MessageEvent);
      expect(mockPostMessage).not.toHaveBeenCalled();
    });
  });

  describe(`when the action is ${Action.SET_CONNECTION_DATA}`, () => {
    let event: MessageEvent;

    beforeEach(() => {
      event = {
        data: { target: SINGLE_SIGN_ON_TARGET, id: 1, action: Action.SET_CONNECTION_DATA },
        origin: "https://example.com",
      } as MessageEvent;
    });

    describe("when the payload is unnavailable", () => {
      beforeEach(() => {
        delete event.data.payload;
      });

      it("should call LocalStorageUtils.setConnectionData with null", () => {
        const spySetConnectionData = jest.spyOn(LocalStorageUtils, "setConnectionData");
        handler(event);
        expect(spySetConnectionData).toHaveBeenCalledWith(null);
      });

      it(`should call window.parent.postMessage with an ok respose for the ${Action.SET_CONNECTION_DATA} action`, () => {
        handler(event);

        expect(mockPostMessage).toHaveBeenCalledWith(
          { target: event.data.target, id: event.data.id, action: event.data.action, ok: true },
          event.origin
        );
      });
    });

    describe("when the payload is null", () => {
      beforeEach(() => {
        event.data.payload = null;
      });

      it("should call LocalStorageUtils.setConnectionData with null", () => {
        const spySetConnectionData = jest.spyOn(LocalStorageUtils, "setConnectionData");
        handler(event);
        expect(spySetConnectionData).toHaveBeenCalledWith(null);
      });

      it(`should call window.parent.postMessage with an ok respose for the ${Action.SET_CONNECTION_DATA} action`, () => {
        handler(event);

        expect(mockPostMessage).toHaveBeenCalledWith(
          { target: event.data.target, id: event.data.id, action: event.data.action, ok: true },
          event.origin
        );
      });
    });

    describe("when the payload is a valid connection data", () => {
      beforeEach(() => {
        event.data.payload = mockConnectionData;
      });

      it("should call LocalStorageUtils.setConnectionData with the valid connection data", () => {
        const spySetConnectionData = jest.spyOn(LocalStorageUtils, "setConnectionData");
        handler(event);
        expect(spySetConnectionData).toHaveBeenCalledWith(event.data.payload);
      });

      it(`should call window.parent.postMessage with an ok respose for the ${Action.SET_CONNECTION_DATA} action`, () => {
        handler(event);

        expect(mockPostMessage).toHaveBeenCalledWith(
          { target: event.data.target, id: event.data.id, action: event.data.action, ok: true },
          event.origin
        );
      });
    });

    describe("when the payload has an invalid address", () => {
      beforeEach(() => {
        event.data.payload = mockConnectionData;
        event.data.payload.address = "invalid";
      });

      it("should call LocalStorageUtils.setConnectionData with the invalid connection data", () => {
        const spySetConnectionData = jest.spyOn(LocalStorageUtils, "setConnectionData");
        handler(event);
        expect(spySetConnectionData).toHaveBeenCalledWith(event.data.payload);
      });

      it(`should call window.parent.postMessage with a not ok respose for the ${Action.SET_CONNECTION_DATA} action`, () => {
        handler(event);

        expect(mockPostMessage).toHaveBeenCalledWith(
          {
            target: event.data.target,
            id: event.data.id,
            action: event.data.action,
            ok: false,
            payload:
              'Invalid connection data: [{"instancePath":"/address","schemaPath":"#/properties/address/pattern","keyword":"pattern","params":{"pattern":"^0x[a-fA-F0-9]{40}$"},"message":"must match pattern \\"^0x[a-fA-F0-9]{40}$\\""}]',
          },
          event.origin
        );
      });
    });

    describe("when the payload has an invalid provider", () => {
      beforeEach(() => {
        event.data.payload = mockConnectionData;
        event.data.payload.provider = "invalid";
      });

      it("should call LocalStorageUtils.setConnectionData with the invalid connection data", () => {
        const spySetConnectionData = jest.spyOn(LocalStorageUtils, "setConnectionData");
        handler(event);
        expect(spySetConnectionData).toHaveBeenCalledWith(event.data.payload);
      });

      it(`should call window.parent.postMessage with a not ok respose for the ${Action.SET_CONNECTION_DATA} action`, () => {
        handler(event);

        expect(mockPostMessage).toHaveBeenCalledWith(
          {
            target: event.data.target,
            id: event.data.id,
            action: event.data.action,
            ok: false,
            payload:
              'Invalid connection data: [{"instancePath":"/provider","schemaPath":"#/properties/provider/enum","keyword":"enum","params":{"allowedValues":["injected","magic","formatic","network","wallet_connect","wallet_connect_v2","wallet_link","metamask_mobile"]},"message":"must be equal to one of the allowed values"}]',
          },
          event.origin
        );
      });
    });
  });

  describe(`when the action is ${Action.SET_IDENTITY}`, () => {
    let event: MessageEvent;

    beforeEach(() => {
      event = {
        data: { target: SINGLE_SIGN_ON_TARGET, id: 1, action: Action.SET_IDENTITY },
        origin: "https://example.com",
      } as MessageEvent;
    });

    describe("when the payload is unnavailable", () => {
      beforeEach(() => {
        delete event.data.payload;
      });

      it(`should call window.parent.postMessage with a not ok respose for the ${Action.SET_IDENTITY} action`, () => {
        handler(event);

        expect(mockPostMessage).toHaveBeenCalledWith(
          {
            target: event.data.target,
            id: event.data.id,
            action: event.data.action,
            ok: false,
            payload: "Cannot destructure property 'address' of 'event.data.payload' as it is undefined.",
          },
          event.origin
        );
      });
    });

    describe("when the identity in the payload is null", () => {
      beforeEach(() => {
        event.data.payload = mockIdentityPayload;
        event.data.payload.identity = null;
      });

      it("should clear the identity from the local storage", () => {
        handler(event);
        expect(global.localStorage.removeItem).toHaveBeenCalledWith(`${LocalStorageUtils.IDENTITY_KEY}-${mockAddress}`);
      });

      it(`should call window.parent.postMessage with an ok respose for the ${Action.SET_IDENTITY} action`, () => {
        handler(event);

        expect(mockPostMessage).toHaveBeenCalledWith(
          {
            target: event.data.target,
            id: event.data.id,
            action: event.data.action,
            ok: true,
          },
          event.origin
        );
      });
    });

    describe("when the address in the payload is invalid", () => {
      beforeEach(() => {
        event.data.payload = mockIdentityPayload;
        event.data.payload.address = "invalid";
      });

      it(`should call window.parent.postMessage with a not ok respose for the ${Action.SET_IDENTITY} action`, () => {
        handler(event);

        expect(mockPostMessage).toHaveBeenCalledWith(
          {
            target: event.data.target,
            id: event.data.id,
            action: event.data.action,
            ok: false,
            payload:
              'Invalid address: [{"instancePath":"","schemaPath":"#/pattern","keyword":"pattern","params":{"pattern":"^0x[a-fA-F0-9]{40}$"},"message":"must match pattern \\"^0x[a-fA-F0-9]{40}$\\""}]',
          },
          event.origin
        );
      });
    });

    describe("when the identity in the payload is invalid", () => {
      beforeEach(() => {
        event.data.payload = mockIdentityPayload;
        event.data.payload.identity = { foo: "bar" };
      });

      it(`should call window.parent.postMessage with a not ok respose for the ${Action.SET_IDENTITY} action`, () => {
        handler(event);

        expect(mockPostMessage).toHaveBeenCalledWith(
          {
            target: event.data.target,
            id: event.data.id,
            action: event.data.action,
            ok: false,
            payload:
              'Invalid auth identity: [{"instancePath":"","schemaPath":"#/required","keyword":"required","params":{"missingProperty":"ephemeralIdentity"},"message":"must have required property \'ephemeralIdentity\'"}]',
          },
          event.origin
        );
      });
    });

    describe("when the identity payload is valid", () => {
      beforeEach(() => {
        event.data.payload = mockIdentityPayload;
      });

      it(`should call window.parent.postMessage with an ok respose for the ${Action.SET_IDENTITY} action`, () => {
        handler(event);

        expect(mockPostMessage).toHaveBeenCalledWith(
          {
            target: event.data.target,
            id: event.data.id,
            action: event.data.action,
            ok: true,
          },
          event.origin
        );
      });
    });
  });
});
