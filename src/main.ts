import { Action, Payload, PostMessageExtraArgs } from "./types";

const acceptedOrigins: string[] = [];
const expectedTarget = "single-sign-on";

window.addEventListener("message", (event: MessageEvent<Payload | null | undefined>) => {
  const { origin, data } = event;

  if (!data) {
    return;
  }

  const { target, id, action, user, identity } = data;

  if (target !== expectedTarget) {
    return;
  }

  const postMessage = (extra: PostMessageExtraArgs = {}) => {
    window.parent.postMessage(
      {
        target: expectedTarget,
        id,
        ...extra,
      },
      origin
    );
  };

  try {
    if (acceptedOrigins.length && !acceptedOrigins.includes(origin)) {
      throw new Error(`Origin is not accepted`);
    }

    if (!id) {
      throw new Error("Id is required");
    }

    if (!Object.values(Action).includes(action)) {
      throw new Error(`Action is not supported`);
    }

    if (typeof user !== "string") {
      throw new Error("User is required and must be a string");
    }

    const lcUser = user.toLowerCase();

    const key = `single-sign-on-identity-${lcUser}`;

    switch (action as Action) {
      case Action.GET: {
        postMessage({ identity: localStorage.getItem(key) });
        break;
      }

      case Action.STORE: {
        localStorage.setItem(key, JSON.stringify(identity));
        postMessage();
        break;
      }

      case Action.CLEAR: {
        localStorage.removeItem(key);
        postMessage();
        break;
      }

      case Action.PING: {
        localStorage.removeItem(key);
        postMessage();
      }
    }
  } catch (e) {
    postMessage({ error: (e as Error).message });
  }
});
