import { Action as ActionV1 } from "@dcl/single-sign-on-client";
import { Action as ActionV2 } from "@dcl/single-sign-on-client-2";
import { handle } from "./init";

let v1: jest.Mock;
let v2: jest.Mock;

beforeEach(() => {
  v1 = jest.fn();
  v2 = jest.fn();
});

describe("when handling an event", () => {
  describe("when the event data is unnavailable", () => {
    it("should not call any handler", () => {
      handle({} as MessageEvent, v1, v2);

      expect(v1).not.toHaveBeenCalled();
      expect(v2).not.toHaveBeenCalled();
    });
  });

  describe("when the event data action is unnavailable", () => {
    it("should not call any handler", () => {
      handle({ data: {} } as MessageEvent, v1, v2);

      expect(v1).not.toHaveBeenCalled();
      expect(v2).not.toHaveBeenCalled();
    });
  });

  describe("when the event data action is invalid", () => {
    it("should not call any handler", () => {
      handle({ data: { action: "invalid" } } as MessageEvent, v1, v2);

      expect(v1).not.toHaveBeenCalled();
      expect(v2).not.toHaveBeenCalled();
    });
  });

  describe("when the event data action is valid for v1", () => {
    it("should call the v1 handler", () => {
      Object.values(ActionV1).forEach((action) => {
        const event = { data: { action } } as MessageEvent;
        handle(event, v1, v2);
        expect(v1).toHaveBeenLastCalledWith(event);
        expect(v2).not.toHaveBeenCalled();
      });
    });
  });

  describe("when the event data action is valid for v2", () => {
    it("should call the v2 handler", () => {
      Object.values(ActionV2).forEach((action) => {
        const event = { data: { action } } as MessageEvent;
        handle(event, v1, v2);
        expect(v1).not.toHaveBeenCalled();
        expect(v2).toHaveBeenLastCalledWith(event);
      });
    });
  });
});
