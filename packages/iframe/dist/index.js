define("types", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Target = exports.Action = void 0;
    var Action;
    (function (Action) {
        Action["SET"] = "set";
        Action["GET"] = "get";
        Action["REMOVE"] = "remove";
        Action["CLEAR"] = "clear";
    })(Action || (exports.Action = Action = {}));
    var Target;
    (function (Target) {
        Target["REQUEST"] = "single-sign-on-request";
        Target["RESPONSE"] = "single-sign-on-response";
    })(Target || (exports.Target = Target = {}));
});
define("index", ["require", "exports", "types"], function (require, exports, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const acceptedOrigins = [];
    window.addEventListener("message", (event) => {
        var _a, _b, _c, _d, _e;
        const origin = event.origin;
        const target = (_a = event.data) === null || _a === void 0 ? void 0 : _a.target;
        const id = (_b = event.data) === null || _b === void 0 ? void 0 : _b.id;
        const action = (_c = event.data) === null || _c === void 0 ? void 0 : _c.action;
        const key = (_d = event.data) === null || _d === void 0 ? void 0 : _d.key;
        const value = (_e = event.data) === null || _e === void 0 ? void 0 : _e.value;
        const postResponse = (args) => {
            var _a;
            window.parent.postMessage({
                target: types_1.Target.RESPONSE,
                id,
                action,
                key,
                value: (_a = args.value) !== null && _a !== void 0 ? _a : value,
                error: args.error,
            });
        };
        try {
            // Ignore messages that are not intended for us.
            if (target !== types_1.Target.REQUEST) {
                return;
            }
            // Fail if the origin is not accepted.
            if (acceptedOrigins.length && !acceptedOrigins.includes(origin)) {
                throw new Error(`Origin ${origin} is not accepted`);
            }
            // Fail if the message does no have a valid id.
            if (typeof id !== "number" && typeof id !== "string") {
                throw new Error("Id is required and must be a string or number");
            }
            // Fail if the message does not have a supported action.
            if (!(action in types_1.Action)) {
                throw new Error(`Action ${action} is not supported`);
            }
            // Fails if the key provided is not a string.
            if ([types_1.Action.SET, types_1.Action.GET, types_1.Action.REMOVE].includes(action) && typeof key !== "string") {
                throw new Error("Key must be a string");
            }
            // Fails if the value provided is not a string.
            if ([types_1.Action.SET].includes(action) && typeof value !== "string") {
                throw new Error("Value must be a string");
            }
            switch (action) {
                case types_1.Action.SET: {
                    localStorage.setItem(key, value);
                    postResponse({});
                    break;
                }
                case types_1.Action.GET: {
                    const value = localStorage.getItem(key);
                    postResponse({ value });
                    break;
                }
                case types_1.Action.REMOVE: {
                    localStorage.removeItem(key);
                    postResponse({});
                    break;
                }
                case types_1.Action.CLEAR: {
                    localStorage.clear();
                    postResponse({});
                }
            }
        }
        catch (e) {
            const message = e.message;
            postResponse({ error: message });
        }
    });
});
