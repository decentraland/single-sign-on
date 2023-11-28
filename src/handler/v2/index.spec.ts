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
let mockOrigin: string;

beforeEach(() => {
  ogWindow = global.window;
  ogLocalStorage = global.localStorage;

  mockPostMessage = jest.fn();

  global.window = {
    parent: {
      postMessage: mockPostMessage,
    },
    location: "http://localhost:3000",
  } as unknown as typeof window;

  global.localStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  } as unknown as typeof localStorage;

  mockOrigin = "https://example.com";

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

  describe("when the app is hosted on localhost", () => {
    it("should accept the message no matter were it comes from", () => {
      const origins = ["http://localhost:5000", "https://google.com", "https://play.decentraland.org"];

      for (const origin of origins) {
        handler({
          data: {
            target: SINGLE_SIGN_ON_TARGET,
            id: 1,
            action: Action.GET_CONNECTION_DATA,
          },
          origin,
        } as MessageEvent);

        expect(mockPostMessage).toHaveBeenCalled();

        jest.clearAllMocks();
      }
    });
  });

  describe("when the app location is id.decentraland.org", () => {
    beforeEach(() => {
      global.window.location = "https://id.decentraland.org" as any;
    });

    describe("and the message origin is from decentraland.org", () => {
      beforeEach(() => {
        mockOrigin = "https://decentraland.org";
      });

      it("should accept the message", () => {
        handler({
          data: {
            target: SINGLE_SIGN_ON_TARGET,
            id: 1,
            action: Action.GET_CONNECTION_DATA,
          },
          origin: mockOrigin,
        } as MessageEvent);

        expect(mockPostMessage).toHaveBeenCalled();
      });
    });

    describe("and the message origin is from play.decentraland.org", () => {
      beforeEach(() => {
        mockOrigin = "https://play.decentraland.org";
      });

      it("should accept the message", () => {
        handler({
          data: {
            target: SINGLE_SIGN_ON_TARGET,
            id: 1,
            action: Action.GET_CONNECTION_DATA,
          },
          origin: mockOrigin,
        } as MessageEvent);

        expect(mockPostMessage).toHaveBeenCalled();
      });
    });

    describe("and the message origin is from play.decentraland.zone", () => {
      beforeEach(() => {
        mockOrigin = "https://play.decentraland.zone";
      });

      it("should ignore the message", () => {
        handler({
          data: {
            target: SINGLE_SIGN_ON_TARGET,
            id: 1,
            action: Action.GET_CONNECTION_DATA,
          },
          origin: mockOrigin,
        } as MessageEvent);

        expect(mockPostMessage).not.toHaveBeenCalled();
      });
    });
  });

  describe("when the app location is example.com", () => {
    beforeEach(() => {
      global.window.location = "https://example.com" as any;
    });

    it("should accept the message no matter were it comes from", () => {
      const origins = ["http://localhost:5000", "https://google.com", "https://play.decentraland.org"];

      for (const origin of origins) {
        handler({
          data: {
            target: SINGLE_SIGN_ON_TARGET,
            id: 1,
            action: Action.GET_CONNECTION_DATA,
          },
          origin,
        } as MessageEvent);

        expect(mockPostMessage).toHaveBeenCalled();

        jest.clearAllMocks();
      }
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

      it("should clear the connection data from local storage", () => {
        handler(event);
        expect(global.localStorage.removeItem).toHaveBeenCalledWith(LocalStorageUtils.CONNECTION_DATA_KEY);
      });

      it(`should call window.parent.postMessage with an ok respose for the ${Action.SET_CONNECTION_DATA} action`, () => {
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

    describe("when the payload is null", () => {
      beforeEach(() => {
        event.data.payload = null;
      });

      it("should clear the connection data from local storage", () => {
        handler(event);
        expect(global.localStorage.removeItem).toHaveBeenCalledWith(LocalStorageUtils.CONNECTION_DATA_KEY);
      });

      it(`should call window.parent.postMessage with an ok respose for the ${Action.SET_CONNECTION_DATA} action`, () => {
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

    describe("when the payload is a valid connection data", () => {
      beforeEach(() => {
        event.data.payload = mockConnectionData;
      });

      it("should store the connection data into local storage", () => {
        handler(event);
        expect(global.localStorage.setItem).toHaveBeenCalledWith(
          LocalStorageUtils.CONNECTION_DATA_KEY,
          JSON.stringify(event.data.payload)
        );
      });

      it(`should call window.parent.postMessage with an ok respose for the ${Action.SET_CONNECTION_DATA} action`, () => {
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

    describe("when the payload has an invalid address", () => {
      beforeEach(() => {
        event.data.payload = mockConnectionData;
        event.data.payload.address = "invalid";
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

      it("should store the connection data into local storage", () => {
        handler(event);
        expect(global.localStorage.setItem).toHaveBeenCalledWith(
          `${LocalStorageUtils.IDENTITY_KEY}-${mockAddress}`,
          JSON.stringify(event.data.payload.identity)
        );
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

  describe(`when the action is ${Action.GET_CONNECTION_DATA}`, () => {
    let event: MessageEvent;

    beforeEach(() => {
      event = {
        data: { target: SINGLE_SIGN_ON_TARGET, id: 1, action: Action.GET_CONNECTION_DATA },
        origin: "https://example.com",
      } as MessageEvent;
    });

    describe("when there is no stored connection data", () => {
      beforeEach(() => {
        global.localStorage.getItem = jest.fn().mockReturnValue(null);
      });

      it("should post a message with an ok response and null payload", () => {
        handler(event);

        expect(mockPostMessage).toHaveBeenCalledWith(
          {
            target: event.data.target,
            id: event.data.id,
            action: event.data.action,
            ok: true,
            payload: null,
          },
          event.origin
        );
      });
    });

    describe("when there is a valid connection data stored", () => {
      beforeEach(() => {
        global.localStorage.getItem = jest.fn().mockReturnValue(JSON.stringify(mockConnectionData));
      });

      it("should post a message with an ok response and null payload", () => {
        handler(event);

        expect(mockPostMessage).toHaveBeenCalledWith(
          {
            target: event.data.target,
            id: event.data.id,
            action: event.data.action,
            ok: true,
            payload: mockConnectionData,
          },
          event.origin
        );
      });
    });

    describe("when there is an invalid connection data stored", () => {
      beforeEach(() => {
        global.localStorage.getItem = jest.fn().mockReturnValue("{}");
      });

      it("should post a message with an ok response and null payload", () => {
        handler(event);

        expect(mockPostMessage).toHaveBeenCalledWith(
          {
            target: event.data.target,
            id: event.data.id,
            action: event.data.action,
            ok: false,
            payload:
              'Invalid connection data: [{"instancePath":"","schemaPath":"#/required","keyword":"required","params":{"missingProperty":"address"},"message":"must have required property \'address\'"}]',
          },
          event.origin
        );
      });
    });
  });

  describe(`when the action is ${Action.GET_IDENTITY}`, () => {
    let event: MessageEvent;

    beforeEach(() => {
      event = {
        data: { target: SINGLE_SIGN_ON_TARGET, id: 1, action: Action.GET_IDENTITY, payload: mockAddress },
        origin: "https://example.com",
      } as MessageEvent;
    });

    describe("when the payload is not a valid address", () => {
      beforeEach(() => {
        event.data.payload = "invalid";
      });

      it("should post a message with a not ok response and the error in the payload", () => {
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

    describe("when there is no stored identity", () => {
      beforeEach(() => {
        global.localStorage.getItem = jest.fn().mockReturnValue(null);
      });

      it("should post a message with an ok response and null payload", () => {
        handler(event);

        expect(mockPostMessage).toHaveBeenCalledWith(
          {
            target: event.data.target,
            id: event.data.id,
            action: event.data.action,
            ok: true,
            payload: null,
          },
          event.origin
        );
      });
    });

    describe("when there is a valid identity stored", () => {
      beforeEach(() => {
        global.localStorage.getItem = jest.fn().mockReturnValue(JSON.stringify(mockIdentity));
      });

      it("should post a message with an ok response and the identity as payload", () => {
        handler(event);

        expect(mockPostMessage).toHaveBeenCalledWith(
          {
            target: event.data.target,
            id: event.data.id,
            action: event.data.action,
            ok: true,
            payload: mockIdentity,
          },
          event.origin
        );
      });
    });

    describe("when there is a invalid identity stored", () => {
      beforeEach(() => {
        global.localStorage.getItem = jest.fn().mockReturnValue("{}");
      });

      it("should post a message with a not ok response and the error in the payload", () => {
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

    describe("when there is an expired identity stored", () => {
      beforeEach(() => {
        mockIdentity.expiration = new Date(0);
        global.localStorage.getItem = jest.fn().mockReturnValue(JSON.stringify(mockIdentity));
      });

      it("should post a message with an ok response and null in the payload", () => {
        handler(event);

        expect(mockPostMessage).toHaveBeenCalledWith(
          {
            target: event.data.target,
            id: event.data.id,
            action: event.data.action,
            ok: true,
            payload: null,
          },
          event.origin
        );
      });
    });
  });
});
