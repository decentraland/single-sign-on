import {
  SINGLE_SIGN_ON_TARGET,
  ClientMessage,
  ServerMessage,
  Action,
  LocalStorageUtils,
  ConnectionData,
  IdentityPayload,
} from "@dcl/single-sign-on-client-2";

export const handler = (event: MessageEvent<ClientMessage>) => {
  if (event.data.target !== SINGLE_SIGN_ON_TARGET || !event.data.id) {
    return;
  }

  let response: ServerMessage = {
    target: SINGLE_SIGN_ON_TARGET,
    id: event.data.id,
    ok: true,
    action: event.data.action,
  };

  switch (event.data.action) {
    case Action.SET_CONNECTION_DATA: {
      try {
        LocalStorageUtils.setConnectionData(event.data.payload as ConnectionData | null);
      } catch (e) {
        response.ok = false;
        response.payload = (e as Error).message;
      }
      window.parent.postMessage(response, event.origin);
      break;
    }

    case Action.GET_CONNECTION_DATA: {
      try {
        const connectionData = LocalStorageUtils.getConnectionData();
        response.payload = connectionData;
      } catch (e) {
        response.ok = false;
        response.payload = (e as Error).message;
      }
      window.parent.postMessage(response, event.origin);
      break;
    }

    case Action.SET_IDENTITY: {
      try {
        const { address, identity } = event.data.payload as IdentityPayload;
        LocalStorageUtils.setIdentity(address, identity);
      } catch (e) {
        response.ok = false;
        response.payload = (e as Error).message;
      }
      window.parent.postMessage(response, event.origin);
      break;
    }

    case Action.GET_IDENTITY: {
      const identity = LocalStorageUtils.getIdentity(event.data.payload as string);
      response.payload = identity;
      window.parent.postMessage(response, event.origin);
      break;
    }
  }
};

export function init() {
  window.parent.postMessage({ target: SINGLE_SIGN_ON_TARGET, id: -1, action: Action.INIT, ok: true }, "*");
}
