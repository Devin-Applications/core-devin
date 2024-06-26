"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _JsonRpcEngine_instances, _a, _JsonRpcEngine_isDestroyed, _JsonRpcEngine_middleware, _JsonRpcEngine_notificationHandler, _JsonRpcEngine_assertIsNotDestroyed, _JsonRpcEngine_handleBatch, _JsonRpcEngine_handle, _JsonRpcEngine_processRequest, _JsonRpcEngine_runAllMiddleware, _JsonRpcEngine_runMiddleware, _JsonRpcEngine_runReturnHandlers, _JsonRpcEngine_checkForCompletion;
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonRpcEngine = void 0;
const rpc_errors_1 = require("@metamask/rpc-errors");
const safe_event_emitter_1 = __importDefault(require("@metamask/safe-event-emitter"));
const utils_1 = require("@metamask/utils");
const DESTROYED_ERROR_MESSAGE = 'This engine is destroyed and can no longer be used.';
/**
 * A JSON-RPC request and response processor.
 * Give it a stack of middleware, pass it requests, and get back responses.
 */
class JsonRpcEngine extends safe_event_emitter_1.default {
    /**
     * Constructs a {@link JsonRpcEngine} instance.
     *
     * @param options - Options bag.
     * @param options.notificationHandler - A function for handling JSON-RPC
     * notifications. A JSON-RPC notification is defined as a JSON-RPC request
     * without an `id` property. If this option is _not_ provided, notifications
     * will be treated the same as requests. If this option _is_ provided,
     * notifications will be passed to the handler function without touching
     * the engine's middleware stack. This function should not throw or reject.
     */
    constructor({ notificationHandler } = {}) {
        super();
        _JsonRpcEngine_instances.add(this);
        /**
         * Indicating whether this engine is destroyed or not.
         */
        _JsonRpcEngine_isDestroyed.set(this, false);
        _JsonRpcEngine_middleware.set(this, void 0);
        _JsonRpcEngine_notificationHandler.set(this, void 0);
        __classPrivateFieldSet(this, _JsonRpcEngine_middleware, [], "f");
        __classPrivateFieldSet(this, _JsonRpcEngine_notificationHandler, notificationHandler, "f");
    }
    /**
     * Calls the `destroy()` function of any middleware with that property, clears
     * the middleware array, and marks this engine as destroyed. A destroyed
     * engine cannot be used.
     */
    destroy() {
        __classPrivateFieldGet(this, _JsonRpcEngine_middleware, "f").forEach((middleware) => {
            if (
            // `in` walks the prototype chain, which is probably the desired
            // behavior here.
            'destroy' in middleware &&
                typeof middleware.destroy === 'function') {
                // eslint-disable-next-line @typescript-eslint/no-floating-promises
                middleware.destroy();
            }
        });
        __classPrivateFieldSet(this, _JsonRpcEngine_middleware, [], "f");
        __classPrivateFieldSet(this, _JsonRpcEngine_isDestroyed, true, "f");
    }
    /**
     * Add a middleware function to the engine's middleware stack.
     *
     * @param middleware - The middleware function to add.
     */
    push(middleware) {
        __classPrivateFieldGet(this, _JsonRpcEngine_instances, "m", _JsonRpcEngine_assertIsNotDestroyed).call(this);
        __classPrivateFieldGet(this, _JsonRpcEngine_middleware, "f").push(middleware);
    }
    handle(req, callback) {
        __classPrivateFieldGet(this, _JsonRpcEngine_instances, "m", _JsonRpcEngine_assertIsNotDestroyed).call(this);
        if (callback && typeof callback !== 'function') {
            throw new Error('"callback" must be a function if provided.');
        }
        if (Array.isArray(req)) {
            if (callback) {
                return __classPrivateFieldGet(this, _JsonRpcEngine_instances, "m", _JsonRpcEngine_handleBatch).call(this, req, 
                // This assertion is safe because of the runtime checks validating that `req` is an array and `callback` is defined.
                // There is only one overload signature that satisfies both conditions, and its `callback` type is the one that's being asserted.
                callback);
            }
            return __classPrivateFieldGet(this, _JsonRpcEngine_instances, "m", _JsonRpcEngine_handleBatch).call(this, req);
        }
        if (callback) {
            return __classPrivateFieldGet(this, _JsonRpcEngine_instances, "m", _JsonRpcEngine_handle).call(this, req, callback);
        }
        return this._promiseHandle(req);
    }
    /**
     * Returns this engine as a middleware function that can be pushed to other
     * engines.
     *
     * @returns This engine as a middleware function.
     */
    asMiddleware() {
        __classPrivateFieldGet(this, _JsonRpcEngine_instances, "m", _JsonRpcEngine_assertIsNotDestroyed).call(this);
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        return async (req, res, next, end) => {
            try {
                const [middlewareError, isComplete, returnHandlers] = await __classPrivateFieldGet(_a, _a, "m", _JsonRpcEngine_runAllMiddleware).call(_a, req, res, __classPrivateFieldGet(this, _JsonRpcEngine_middleware, "f"));
                if (isComplete) {
                    await __classPrivateFieldGet(_a, _a, "m", _JsonRpcEngine_runReturnHandlers).call(_a, returnHandlers);
                    return end(middlewareError);
                }
                // eslint-disable-next-line @typescript-eslint/no-misused-promises
                return next(async (handlerCallback) => {
                    try {
                        await __classPrivateFieldGet(_a, _a, "m", _JsonRpcEngine_runReturnHandlers).call(_a, returnHandlers);
                    }
                    catch (error) {
                        return handlerCallback(error);
                    }
                    return handlerCallback();
                });
            }
            catch (error) {
                return end(error);
            }
        };
    }
    /**
     * A promise-wrapped _handle.
     *
     * @param request - The JSON-RPC request.
     * @returns The JSON-RPC response.
     */
    // This function is used in tests, so we cannot easily change it to use the
    // hash syntax.
    // eslint-disable-next-line no-restricted-syntax
    async _promiseHandle(request) {
        return new Promise((resolve, reject) => {
            __classPrivateFieldGet(this, _JsonRpcEngine_instances, "m", _JsonRpcEngine_handle).call(this, request, (error, res) => {
                // For notifications, the response will be `undefined`, and any caught
                // errors are unexpected and should be surfaced to the caller.
                if (error && res === undefined) {
                    reject(error);
                }
                else {
                    // Excepting notifications, there will always be a response, and it will
                    // always have any error that is caught and propagated.
                    resolve(res);
                }
            }).catch(reject);
        });
    }
}
exports.JsonRpcEngine = JsonRpcEngine;
_a = JsonRpcEngine, _JsonRpcEngine_isDestroyed = new WeakMap(), _JsonRpcEngine_middleware = new WeakMap(), _JsonRpcEngine_notificationHandler = new WeakMap(), _JsonRpcEngine_instances = new WeakSet(), _JsonRpcEngine_assertIsNotDestroyed = function _JsonRpcEngine_assertIsNotDestroyed() {
    if (__classPrivateFieldGet(this, _JsonRpcEngine_isDestroyed, "f")) {
        throw new Error(DESTROYED_ERROR_MESSAGE);
    }
}, _JsonRpcEngine_handleBatch = 
/**
 * Handles a batch of JSON-RPC requests, either in `async` or callback
 * fashion.
 *
 * @param requests - The request objects to process.
 * @param callback - The completion callback.
 * @returns The array of responses, or nothing if a callback was specified.
 */
async function _JsonRpcEngine_handleBatch(requests, callback) {
    // The order here is important
    try {
        // If the batch is an empty array, the response array must contain a single object
        if (requests.length === 0) {
            const response = [
                {
                    id: null,
                    jsonrpc: '2.0',
                    error: new rpc_errors_1.JsonRpcError(rpc_errors_1.errorCodes.rpc.invalidRequest, 'Request batch must contain plain objects. Received an empty array'),
                },
            ];
            if (callback) {
                return callback(null, response);
            }
            return response;
        }
        // 2. Wait for all requests to finish, or throw on some kind of fatal
        // error
        const responses = (await Promise.all(
        // 1. Begin executing each request in the order received
        requests.map(this._promiseHandle.bind(this)))).filter(
        // Filter out any notification responses.
        (response) => response !== undefined);
        // 3. Return batch response
        if (callback) {
            return callback(null, responses);
        }
        return responses;
    }
    catch (error) {
        if (callback) {
            return callback(error);
        }
        throw error;
    }
}, _JsonRpcEngine_handle = 
/**
 * Ensures that the request / notification object is valid, processes it, and
 * passes any error and response object to the given callback.
 *
 * Does not reject.
 *
 * @param callerReq - The request object from the caller.
 * @param callback - The callback function.
 * @returns Nothing.
 */
async function _JsonRpcEngine_handle(callerReq, callback) {
    if (!callerReq ||
        Array.isArray(callerReq) ||
        typeof callerReq !== 'object') {
        const error = new rpc_errors_1.JsonRpcError(rpc_errors_1.errorCodes.rpc.invalidRequest, `Requests must be plain objects. Received: ${typeof callerReq}`, { request: callerReq });
        return callback(error, { id: null, jsonrpc: '2.0', error });
    }
    if (typeof callerReq.method !== 'string') {
        const error = new rpc_errors_1.JsonRpcError(rpc_errors_1.errorCodes.rpc.invalidRequest, `Must specify a string method. Received: ${typeof callerReq.method}`, { request: callerReq });
        if (__classPrivateFieldGet(this, _JsonRpcEngine_notificationHandler, "f") && !(0, utils_1.isJsonRpcRequest)(callerReq)) {
            // Do not reply to notifications, even if they are malformed.
            return callback(null);
        }
        return callback(error, {
            // Typecast: This could be a notification, but we want to access the
            // `id` even if it doesn't exist.
            id: callerReq.id ?? null,
            jsonrpc: '2.0',
            error,
        });
    }
    else if (__classPrivateFieldGet(this, _JsonRpcEngine_notificationHandler, "f") &&
        (0, utils_1.isJsonRpcNotification)(callerReq) &&
        !(0, utils_1.isJsonRpcRequest)(callerReq)) {
        try {
            await __classPrivateFieldGet(this, _JsonRpcEngine_notificationHandler, "f").call(this, callerReq);
        }
        catch (error) {
            return callback(error);
        }
        return callback(null);
    }
    let error = null;
    // Handle requests.
    // Typecast: Permit missing id's for backwards compatibility.
    const req = { ...callerReq };
    const res = {
        id: req.id,
        jsonrpc: req.jsonrpc,
    };
    try {
        await __classPrivateFieldGet(_a, _a, "m", _JsonRpcEngine_processRequest).call(_a, req, res, __classPrivateFieldGet(this, _JsonRpcEngine_middleware, "f"));
    }
    catch (_error) {
        // A request handler error, a re-thrown middleware error, or something
        // unexpected.
        error = _error;
    }
    if (error) {
        // Ensure no result is present on an errored response
        delete res.result;
        if (!res.error) {
            res.error = (0, rpc_errors_1.serializeError)(error);
        }
    }
    return callback(error, res);
}, _JsonRpcEngine_processRequest = async function _JsonRpcEngine_processRequest(req, res, middlewares) {
    const [error, isComplete, returnHandlers] = await __classPrivateFieldGet(_a, _a, "m", _JsonRpcEngine_runAllMiddleware).call(_a, req, res, middlewares);
    // Throw if "end" was not called, or if the response has neither a result
    // nor an error.
    __classPrivateFieldGet(_a, _a, "m", _JsonRpcEngine_checkForCompletion).call(_a, req, res, isComplete);
    // The return handlers should run even if an error was encountered during
    // middleware processing.
    await __classPrivateFieldGet(_a, _a, "m", _JsonRpcEngine_runReturnHandlers).call(_a, returnHandlers);
    // Now we re-throw the middleware processing error, if any, to catch it
    // further up the call chain.
    if (error) {
        // eslint-disable-next-line @typescript-eslint/no-throw-literal
        throw error;
    }
}, _JsonRpcEngine_runAllMiddleware = async function _JsonRpcEngine_runAllMiddleware(req, res, middlewares) {
    const returnHandlers = [];
    let error = null;
    let isComplete = false;
    // Go down stack of middleware, call and collect optional returnHandlers
    for (const middleware of middlewares) {
        [error, isComplete] = await __classPrivateFieldGet(_a, _a, "m", _JsonRpcEngine_runMiddleware).call(_a, req, res, middleware, returnHandlers);
        if (isComplete) {
            break;
        }
    }
    return [error, isComplete, returnHandlers.reverse()];
}, _JsonRpcEngine_runMiddleware = async function _JsonRpcEngine_runMiddleware(request, response, middleware, returnHandlers) {
    return new Promise((resolve) => {
        const end = (error) => {
            const parsedError = error || response.error;
            if (parsedError) {
                response.error = (0, rpc_errors_1.serializeError)(parsedError);
            }
            // True indicates that the request should end
            resolve([parsedError, true]);
        };
        const next = (returnHandler) => {
            if (response.error) {
                end(response.error);
            }
            else {
                if (returnHandler) {
                    if (typeof returnHandler !== 'function') {
                        end(new rpc_errors_1.JsonRpcError(rpc_errors_1.errorCodes.rpc.internal, `JsonRpcEngine: "next" return handlers must be functions. ` +
                            `Received "${typeof returnHandler}" for request:\n${jsonify(request)}`, { request }));
                    }
                    returnHandlers.push(returnHandler);
                }
                // False indicates that the request should not end
                resolve([null, false]);
            }
        };
        try {
            middleware(request, response, next, end);
        }
        catch (error) {
            end(error);
        }
    });
}, _JsonRpcEngine_runReturnHandlers = async function _JsonRpcEngine_runReturnHandlers(handlers) {
    for (const handler of handlers) {
        await new Promise((resolve, reject) => {
            handler((error) => (error ? reject(error) : resolve()));
        });
    }
}, _JsonRpcEngine_checkForCompletion = function _JsonRpcEngine_checkForCompletion(request, response, isComplete) {
    if (!(0, utils_1.hasProperty)(response, 'result') && !(0, utils_1.hasProperty)(response, 'error')) {
        throw new rpc_errors_1.JsonRpcError(rpc_errors_1.errorCodes.rpc.internal, `JsonRpcEngine: Response has no error or result for request:\n${jsonify(request)}`, { request });
    }
    if (!isComplete) {
        throw new rpc_errors_1.JsonRpcError(rpc_errors_1.errorCodes.rpc.internal, `JsonRpcEngine: Nothing ended request:\n${jsonify(request)}`, { request });
    }
};
/**
 * JSON-stringifies a request object.
 *
 * @param request - The request object to JSON-stringify.
 * @returns The JSON-stringified request object.
 */
function jsonify(request) {
    return JSON.stringify(request, null, 2);
}
