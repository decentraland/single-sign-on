const acceptedActions: string[] = ["set", "get", "remove", "clear"];
const acceptedKeys: string[] = [];
const acceptedOrigins: string[] = [];

window.addEventListener("message", (event) => {
  console.log("message received", event.origin, JSON.stringify(event.data, null, 2));

  if (event.data?.target !== "single-sign-on") {
    return;
  }

  let id;
  let action;

  try {
    const origin = event.origin;

    if (acceptedOrigins.length && !acceptedOrigins.includes(origin)) {
      throw new Error("Origin is not accepted");
    }

    const message = event.data;

    if (!message) {
      throw new Error("Message cannot be null or undefined");
    }

    id = message.id;

    if (!id) {
      throw new Error("Message must have an id");
    }

    action = message.action;

    if (!acceptedActions.includes(action)) {
      throw new Error("Action is not supported");
    }

    switch (action) {
      case "set": {
        const { key, value } = message;

        verifyKey(key);

        if (typeof value !== "string") {
          throw new Error("Value must be a string");
        }

        localStorage.setItem(key, value);

        postResponse(origin, id, action, key);

        break;
      }
      case "get": {
        const { key } = message;

        verifyKey(key);

        postResponse(origin, id, action, key, localStorage.getItem(key) ?? undefined);

        break;
      }
      case "remove": {
        const { key } = message;

        verifyKey(key);

        localStorage.removeItem(key);

        postResponse(origin, id, action, key);

        break;
      }

      case "clear": {
        localStorage.clear();

        postResponse(origin, id, action);
      }
    }
  } catch (e) {
    postError(origin, id, action, (e as Error).message);
  }
});

function verifyKey(key: unknown) {
  if (typeof key !== "string") {
    throw new Error("Key must be a string");
  }
}

function postResponse(origin: string, id: string, action: string, key?: string, value?: string) {
  console.log("postResponse", origin, id, action, key, value);

  window.parent.postMessage(
    {
      id,
      action,
      key,
      value,
    },
    origin
  );
}

function postError(origin: string, id?: string, action?: string, error?: string) {
  console.log("postError", origin, id, action, error);

  window.parent.postMessage(
    {
      id,
      action,
      error,
    },
    origin
  );
}
