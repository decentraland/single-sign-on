import { ProviderType } from "@dcl/schemas";
import { Action, LocalStorageUtils, SINGLE_SIGN_ON_TARGET } from "@dcl/single-sign-on-client-2";
import { handler } from "../v2";

let ogWindow: typeof window;
let mockPostMessage: typeof window.parent.postMessage;
let ogLocalStorage: typeof localStorage;

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
        event.data.payload = { address: "0x123", provider: ProviderType.INJECTED };
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

    describe("when the payload is an invalid connection data", () => {
      beforeEach(() => {
        event.data.payload = {
          foo: "bar",
        };
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
              'Invalid connection data: [{"instancePath":"","schemaPath":"#/required","keyword":"required","params":{"missingProperty":"address"},"message":"must have required property \'address\'"}]',
          },
          event.origin
        );
      });
    });
  });

  // describe(`when the action is ${Action.SET_IDENTITY}`, () => {
  //   let event: MessageEvent;

  //   beforeEach(() => {
  //     event = {
  //       data: { target: SINGLE_SIGN_ON_TARGET, id: 1, action: Action.SET_IDENTITY },
  //       origin: "https://example.com",
  //     } as MessageEvent;
  //   });

  //   describe("when the payload is unnavailable", () => {
  //     beforeEach(() => {
  //       delete event.data.payload;
  //     });

  //     it("should call LocalStorageUtils.setConnectionData with null", () => {
  //       const spySetIdentity = jest.spyOn(LocalStorageUtils, "setIdentity");
  //       handler(event);
  //       expect(spySetIdentity).toHaveBeenCalledWith(null);
  //     });

  //     it(`should call window.parent.postMessage with an ok respose for the ${Action.SET_CONNECTION_DATA} action`, () => {
  //       handler(event);

  //       expect(mockPostMessage).toHaveBeenCalledWith(
  //         { target: event.data.target, id: event.data.id, action: event.data.action, ok: true },
  //         event.origin
  //       );
  //     });
  //   });

  //   describe("when the payload is null", () => {
  //     beforeEach(() => {
  //       event.data.payload = null;
  //     });

  //     it("should call LocalStorageUtils.setConnectionData with null", () => {
  //       const spySetConnectionData = jest.spyOn(LocalStorageUtils, "setConnectionData");
  //       handler(event);
  //       expect(spySetConnectionData).toHaveBeenCalledWith(null);
  //     });

  //     it(`should call window.parent.postMessage with an ok respose for the ${Action.SET_CONNECTION_DATA} action`, () => {
  //       handler(event);

  //       expect(mockPostMessage).toHaveBeenCalledWith(
  //         { target: event.data.target, id: event.data.id, action: event.data.action, ok: true },
  //         event.origin
  //       );
  //     });
  //   });

  //   describe("when the payload is a valid connection data", () => {
  //     beforeEach(() => {
  //       event.data.payload = {
  //         address: "0x123",
  //         provider: ProviderType.INJECTED,
  //       };
  //     });

  //     it("should call LocalStorageUtils.setConnectionData with the valid connection data", () => {
  //       const spySetConnectionData = jest.spyOn(LocalStorageUtils, "setConnectionData");
  //       handler(event);
  //       expect(spySetConnectionData).toHaveBeenCalledWith(event.data.payload);
  //     });

  //     it(`should call window.parent.postMessage with an ok respose for the ${Action.SET_CONNECTION_DATA} action`, () => {
  //       handler(event);

  //       expect(mockPostMessage).toHaveBeenCalledWith(
  //         { target: event.data.target, id: event.data.id, action: event.data.action, ok: true },
  //         event.origin
  //       );
  //     });
  //   });

  //   describe("when the payload is an invalid connection data", () => {
  //     beforeEach(() => {
  //       event.data.payload = {
  //         foo: "bar",
  //       };
  //     });

  //     it("should call LocalStorageUtils.setConnectionData with the invalid connection data", () => {
  //       const spySetConnectionData = jest.spyOn(LocalStorageUtils, "setConnectionData");
  //       handler(event);
  //       expect(spySetConnectionData).toHaveBeenCalledWith(event.data.payload);
  //     });

  //     it(`should call window.parent.postMessage with a not ok respose for the ${Action.SET_CONNECTION_DATA} action`, () => {
  //       handler(event);

  //       expect(mockPostMessage).toHaveBeenCalledWith(
  //         {
  //           target: event.data.target,
  //           id: event.data.id,
  //           action: event.data.action,
  //           ok: false,
  //           payload:
  //             'Invalid connection data: [{"instancePath":"","schemaPath":"#/required","keyword":"required","params":{"missingProperty":"address"},"message":"must have required property \'address\'"}]',
  //         },
  //         event.origin
  //       );
  //     });
  //   });
  // });
});
