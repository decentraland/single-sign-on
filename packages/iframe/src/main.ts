import { Action, Target } from "./types";

const acceptedOrigins: string[] = [];

window.addEventListener("message", (event) => {
  const origin = event.origin;
  const target = event.data?.target;
  const id = event.data?.id;
  const action = event.data?.action;
  const key = event.data?.key;
  const value = event.data?.value;

  const postResponse = (args: { value?: string | null; error?: string }) => {
    window.parent.postMessage({
      target: Target.RESPONSE,
      id,
      action,
      key,
      value: args.value ?? value,
      error: args.error,
    });
  };

  try {
    // Ignore messages that are not intended for us.
    if (target !== Target.REQUEST) {
      return;
    }

    // Fail if the origin is not accepted.
    if (acceptedOrigins.length && !acceptedOrigins.includes(origin)) {
      throw new Error(`Origin ${origin} is not accepted`);
    }

    // Fail if the message does no have a valid id.
    if (typeof id !== "number" && typeof id !== "string") {
      throw new Error("Id is required and must be a string or number");
    }

    // Fail if the message does not have a supported action.
    if (!(action in Action)) {
      throw new Error(`Action ${action} is not supported`);
    }

    // Fails if the key provided is not a string.
    if ([Action.SET, Action.GET, Action.REMOVE].includes(action) && typeof key !== "string") {
      throw new Error("Key must be a string");
    }

    // Fails if the value provided is not a string.
    if ([Action.SET].includes(action) && typeof value !== "string") {
      throw new Error("Value must be a string");
    }

    switch (action as Action) {
      case Action.SET: {
        localStorage.setItem(key, value);
        postResponse({});
        break;
      }

      case Action.GET: {
        const value = localStorage.getItem(key);
        postResponse({ value });
        break;
      }

      case Action.REMOVE: {
        localStorage.removeItem(key);
        postResponse({});
        break;
      }

      case Action.CLEAR: {
        localStorage.clear();
        postResponse({});
      }
    }
  } catch (e) {
    const message = (e as Error).message;
    postResponse({ error: message });
  }
});
