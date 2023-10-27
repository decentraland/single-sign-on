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

  switch (event.data.action) {
    case Action.SET_CONNECTION_DATA: {
      console.log("SSO received SET_CONNECTION_DATA");
      LocalStorageUtils.setConnectionData(event.data.payload as ConnectionData | null);
      postMessage({ id: event.data.id, action: Action.SET_IDENTITY, ok: true }, event.origin);
      break;
    }

    case Action.GET_CONNECTION_DATA: {
      console.log("SSO received GET_CONNECTION_DATA");
      const connectionData = LocalStorageUtils.getConnectionData();
      postMessage(
        { id: event.data.id, action: Action.GET_CONNECTION_DATA, ok: true, payload: connectionData },
        event.origin
      );
      break;
    }

    case Action.SET_IDENTITY: {
      console.log("SSO received SET_IDENTITY");
      const { address, identity } = event.data.payload as IdentityPayload;
      LocalStorageUtils.setIdentity(address, identity);
      postMessage({ id: event.data.id, action: Action.SET_IDENTITY, ok: true }, event.origin);
      break;
    }

    case Action.GET_IDENTITY: {
      console.log("SSO received GET_IDENTITY");
      const identity = LocalStorageUtils.getIdentity(event.data.payload as string);
      postMessage({ id: event.data.id, action: Action.GET_IDENTITY, ok: true, payload: identity }, event.origin);
      break;
    }

    default: {
      console.log("SSO received unsupported action:", event.data.action);
    }
  }
};

postMessage({ id: -1, action: Action.INIT, ok: true }, "*");

function postMessage(message: Omit<ServerMessage, "target">, origin: string) {
  window.parent.postMessage({ target: SINGLE_SIGN_ON_TARGET, ...message }, origin);
}
