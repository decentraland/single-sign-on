# Single Sign On

This webapp works as a centralized storage for shared data between different decentraland applications.

It is intended to be instantiated as an iframe inside the different dapps using the [@dcl/single-sign-on-client](https://github.com/decentraland/single-sign-on-client).

## V1

Supports storing, clearing and obtaining the user identity via post messages.

Version 0.1.0 or lower of the `@dcl/single-sign-on-client` has to be used to easily communicate with it.

This version will not receive future updates. As version 2 is the recommended one.

It is still currently supported by the SSO webapp to keep support applications that have not yet migrated to V2.

Handled messages follow the schema:

```ts
type ClientMessage = {
  target: "single-sign-on";
  id: number; // Greater than 0.
  action?: "get" | "store" | "clear" | "ping";
  user?: string; // the address of the user when storing, clearing or obtaining their identity.
  identity?: AuthIdentity | null; // the identity of the user when storing it.
};
```

Responses have the schema:

```ts
type ServerMessage = {
  target: "single-sign-on";
  id: number; // Same as the client message.
  identity?: AuthIdentity | null; // The identity of the user for the "get" action.
  error?: string; // Only when there was an error on the operation.
};
```

# V2

Latest and current version to be used.

It supports storing, clearing and obtaining the user identity, as well as the same for the user's connection data.

Handled messages have to follow the schema:

```ts
type ClientMessage = {
  target: "single-sign-on";
  id: number; // Greater than 0;
  action: "get-identity" | "set-identity" | "get-connection-data" | "set-connection-data";
  payload?: ConnectionData | IdentityPayload | string | null; // Depends on the action.
};
```

Responses have the schema:

```ts
type ServerMessage = {
  target: "single-sign-on";
  id: number; // Same as the client message.
  action: "get-identity" | "set-identity" | "get-connection-data" | "set-connection-data";
  ok: boolean; // false if the operation fails for any reason.
  payload?: ConnectionData | AuthIdentity | string | null; // Depends on the action. If ok is false, the payload will be a string with the error message.
};
```

## Allowed origins

Depending on were this application is hosted, it will validate the origin of the messages received. If the application is hosted on a Decentraland subdomain (.decentraland.org, .decentraland.today, .decentraland.zone), it will validate that the origin of the received messages are from a decentraland subdomain on the same environment. For example, if this application is hosted on https://id.decentraland.org, it will only allow messages from other https://*.decentraland.org sites.

If the application is hosted on another domain, being localhost or anything else, no origin validation takes place.

Works like this for both versions of the iframe.
