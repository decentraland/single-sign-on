"use strict";
const acceptedActions = ["set", "get", "remove", "clear"];
const acceptedKeys = [];
const acceptedOrigins = [];
window.addEventListener("message", (event) => {
    var _a, _b;
    console.log("message received", event.origin, JSON.stringify(event.data, null, 2));
    if (((_a = event.data) === null || _a === void 0 ? void 0 : _a.target) !== "single-sign-on") {
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
                postResponse(origin, id, action, key, (_b = localStorage.getItem(key)) !== null && _b !== void 0 ? _b : undefined);
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
    }
    catch (e) {
        postError(origin, id, action, e.message);
    }
});
function verifyKey(key) {
    if (typeof key !== "string") {
        throw new Error("Key must be a string");
    }
}
function postResponse(origin, id, action, key, value) {
    console.log("postResponse", origin, id, action, key, value);
    window.parent.postMessage({
        id,
        action,
        key,
        value,
    }, origin);
}
function postError(origin, id, action, error) {
    console.log("postError", origin, id, action, error);
    window.parent.postMessage({
        id,
        action,
        error,
    }, origin);
}
