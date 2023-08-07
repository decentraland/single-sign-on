import {
  Action,
  ClientMessage,
  ServerMessage,
  localStorageClearIdentity,
  localStorageGetIdentity,
  localStorageStoreIdentity,
  SINGLE_SIGN_ON_TARGET,
} from "@dcl/single-sign-on-client";

// Check if the current environment is being run in development mode.
// In development mode, the iframe will allow messages from any origin
const isDevelopment = import.meta.env.MODE === "development";

// Regex used to check if the application is hosted in a decentraland subdomain.
// Also used to check if messages come from a decentraland subdomain.
const isDclSubdomainPattern = /.\.decentraland\.(org|today|zone)$/;

// Stores if the application is hosted in a decentraland subdomain.
const isHostedInDclSubdomain = isDclSubdomainPattern.test(window.location.hostname);

// If hosted in a decentraland subdomain, store the environment (org, today or zone).
const env: string | null = isHostedInDclSubdomain ? window.location.hostname.split(".").slice(-1)[0] : null;

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
    // If the application is not being run in development mode (via npm run dev), It will check if the message comes from a decentraland subdomain.
    // It will also check that the message comes from the same environment as the application.
    // This means that if the application is running in https://id.decentraland.org, it will only accept messages from https://some-other-subdomain.decentraland.org.
    if (!isDevelopment && (!isDclSubdomainPattern.test(origin) || !origin.endsWith(`.${env}`))) {
      throw new Error(`Origin is not allowed`);
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
