import { handler as handlerV1 } from "./handler/v1";
import { handler as handlerV2 } from "./handler/v2";
import { Action as ActionV1 } from "@dcl/single-sign-on-client";
import { Action as ActionV2 } from "@dcl/single-sign-on-client-2";

const actionsV1 = Object.values(ActionV1);
const actionsV2 = Object.values(ActionV2);

window.addEventListener("message", (event: MessageEvent) => {
  if (event.data) {
    const { action } = event.data;

    if (actionsV1.includes(action)) {
      handlerV1(event);
    } else if (actionsV2.includes(action)) {
      handlerV2(event);
    }
  }
});
