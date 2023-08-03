import { Action, Payload, PostMessageExtraArgs } from "./types";

// Accepts messages only from:
// All decentraland subdomains (https://*.decentraland.org .today and .zone)
// All decentraland vercel deployments (https://*-decentraland1.vercel.app)
// All projects running on localhost (http://localhost:*)
const allow = /(^https:\/\/.+(\.decentraland.(org|today|zone)|-decentraland1.vercel.app)$|http:\/\/localhost:)/;

// What messages targeted to this iframe should include as event.data.target
// Also used for the response so the client can identify the message along the id
const expectedTarget = "single-sign-on";

window.addEventListener("message", (event: MessageEvent<Payload | null | undefined>) => {
  const { origin, data } = event;

  // Ignore if there is no data in the message
  if (!data) {
    return;
  }

  const { target, id, action, user, identity } = data;

  // Ignore if target is not the expected one
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
    // Fail if the origin is not allowed
    if (!allow.test(origin)) {
      throw new Error(`Origin is not accepted`);
    }

    // Fail if the message does not have an id
    // Required as it is used by the client to identify the response
    if (!id) {
      throw new Error("Id is required");
    }

    // Fail if the provided action is not supported
    if (!Object.values(Action).includes(action)) {
      throw new Error(`Action is not supported`);
    }

    // Fail if the user is not a string
    // Users should be the string of an ethereum address
    if (typeof user !== "string") {
      throw new Error("User is required and must be a string");
    }

    // Lowercasing the user to prevent issues with case sensitivity
    const lcUser = user.toLowerCase();

    // The key used to store the identity in localStorage
    const key = `single-sign-on-${lcUser}`;

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
