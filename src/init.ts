import { Action as ActionV1 } from "@dcl/single-sign-on-client";
import { Action as ActionV2 } from "@dcl/single-sign-on-client-2";

type Handler = (event: MessageEvent) => void;

export function init(v1: Handler, v2: Handler) {
  window.addEventListener("message", (event: MessageEvent) => {
    handle(event, v1, v2);
  });
}

export function handle(event: MessageEvent, v1: Handler, v2: Handler): void {
  if (!event.data) {
    return;
  }

  const { action } = event.data;

  if (Object.values(ActionV1).includes(action)) {
    v1(event);
  } else if (Object.values(ActionV2).includes(action)) {
    v2(event);
  }
}
