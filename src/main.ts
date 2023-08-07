import {
  Action,
  ClientMessage,
  ServerMessage,
  localStorageClearIdentity,
  localStorageGetIdentity,
  localStorageStoreIdentity,
  SINGLE_SIGN_ON_TARGET,
} from "@dcl/single-sign-on-client";

// Accepts messages only from:
// All decentraland subdomains (https://*.decentraland.org .today and .zone)
// All decentraland vercel deployments (https://*-decentraland1.vercel.app)
const allow = /^https:\/\/.+(\.decentraland.(org|today|zone)|-decentraland1.vercel.app)$/;

// Check if the current environment is being run in development mode.
// In development mode, the iframe will allow messages from any origin
const isDevelopment = import.meta.env.MODE === "development";

window.addEventListener("message", (event: MessageEvent<Partial<ClientMessage> | null>) => {
  const { origin, data } = event;

  // Ignore if there is no data in the message
  if (!data) {
    return;
  }

  const { target, id, action, user, identity } = data;

  // Ignore if target is not the expected one
  if (target !== SINGLE_SIGN_ON_TARGET) {
    return;
  }

  // Ignore if message does not have an id as it cannot be identified by the client
  if (!id) {
    return;
  }

  const postMessage = (payload: Pick<ServerMessage, "identity" | "error">) => {
    window.parent.postMessage(
      {
        target: SINGLE_SIGN_ON_TARGET,
        id,
        ...payload,
      },
      origin
    );
  };

  // If the action is a simple ping, just respond the message
  if (action === Action.PING) {
    postMessage({});
    return;
  }

  try {
    // Fail if the origin is not allowed
    if (!isDevelopment && !allow.test(origin)) {
      throw new Error(`Origin is not accepted`);
    }

    // Fail if the provided action is not supported
    if (!Object.values(Action).includes(action as any)) {
      throw new Error(`Action is not supported`);
    }

    // Fail if the user was not provided
    if (!user) {
      throw new Error("User is required");
    }

    switch (action as Action) {
      case Action.GET: {
        postMessage({ identity: localStorageGetIdentity(user) });
        break;
      }

      case Action.STORE: {
        if (!identity) {
          throw new Error("Identity is required");
        }

        localStorageStoreIdentity(user, identity);
        postMessage({});
        break;
      }

      case Action.CLEAR: {
        localStorageClearIdentity(user);
        postMessage({});
        break;
      }
    }
  } catch (e) {
    postMessage({ error: (e as Error).message });
  }
});
