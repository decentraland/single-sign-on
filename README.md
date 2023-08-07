# Single Sign On

Webapp intended to be used as an iframe.

Contains the logic to Get, Store and Clear the user identity.

The idea of this project is to have unified place in which the identity of the user can be stored.

This replaces the need of each application storing it by themselves, making the user have to sign a message when logging in on each app.

## Integration

The simplest way to use it is by using the corresponding client in the application it needs to be integrated in.

https://github.com/decentraland/single-sign-on-client <- Client Repo

Just check the README on that repo for instructions.

## How it works

This webapp is deployed to https://id.decentraland.org (as well as .today and .zone).

The app consists of a single message handler that picks messages intended to interact with it.

The kind of messages accepted are to operate with user identities (Get, Store, Clear). These messages will be interpreted and the application will work on its own local storage to the respond to the client.

This allows identities, which previously were store in the local storage of many different dapps, to be stored just in https://id.decentraland.org. Meaning that any dapp can consume the identity from this single place instead of making the user have their own different identity in each different decentraland dapp.

## Allowed origins

Only a couple origins are allowed to interact with this webapp through messages.

This is a safety mechanism to prevent any non decentraland app from obtaining the identity of the user.

The accepted origins are all applications deployed to the decentraland domain https://\*.decentraland.org (.today and .zone as well) and all applications deployed to vercel with the decentraland account, all of which have a https://\*-decentraland1.vercel.app url.

## Allowed messages

All messages, to be regarded as valid and not be discarded, must have the following properties:

**target** - Which should always be "single-sign-on" this is used to identify that the message is in fact, targeted to this iframe. There are cases like with metamask, that they just send messages to iframe. Those kind of messages are ignored.

**id** - Used to identify the message. This is needed so that the client can verify which message is the response of a sent message.

**action** - Can be "get", "store", "clear" or "ping". This one indicates the type of interaction had with the iframe.

**user** - Only required for "get", "store" and "clear" actions. Is the address of the user for which identity is interacted with.

**identity** - Only required for "store" actions. It is the identity of the users, as provided by `@dcl/crypto`, that will be stored.
