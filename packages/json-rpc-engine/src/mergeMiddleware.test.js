"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@metamask/utils");
const _1 = require(".");
const jsonrpc = '2.0';
describe('mergeMiddleware', () => {
    it('basic', async () => {
        const engine = new _1.JsonRpcEngine();
        let originalRequest;
        engine.push((0, _1.mergeMiddleware)([
            function (req, res, _next, end) {
                originalRequest = req;
                res.result = 'saw merged middleware';
                end();
            },
        ]));
        const payload = { id: 1, jsonrpc, method: 'hello' };
        await new Promise((resolve) => {
            engine.handle(payload, function (error, response) {
                expect(error).toBeNull();
                expect(response).toBeDefined();
                expect(originalRequest.id).toStrictEqual(response.id);
                expect(originalRequest.jsonrpc).toStrictEqual(response.jsonrpc);
                expect((0, utils_1.hasProperty)(response, 'result')).toBe(true);
                resolve();
            });
        });
    });
    it('handles next handler correctly for multiple merged', async () => {
        const engine = new _1.JsonRpcEngine();
        engine.push((0, _1.mergeMiddleware)([
            (_request, response, next, _end) => {
                next((callback) => {
                    // TODO: Replace `any` with type
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    response.copy = response.result;
                    callback();
                });
            },
            (_req, res, _next, end) => {
                res.result = true;
                end();
            },
        ]));
        const payload = { id: 1, jsonrpc, method: 'hello' };
        await new Promise((resolve) => {
            engine.handle(payload, function (error, res) {
                expect(error).toBeNull();
                // @ts-expect-error - `copy` is not a valid property of `JsonRpcSuccess`.
                const { copy, ...rest } = res;
                (0, utils_1.assertIsJsonRpcSuccess)(rest);
                expect(rest.result).toStrictEqual(copy);
                resolve();
            });
        });
    });
    it('decorate res', async () => {
        const engine = new _1.JsonRpcEngine();
        let originalRequest;
        engine.push((0, _1.mergeMiddleware)([
            function (request, response, _next, end) {
                originalRequest = request;
                // TODO: Replace `any` with type
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                response.xyz = true;
                response.result = true;
                end();
            },
        ]));
        const payload = { id: 1, jsonrpc, method: 'hello' };
        await new Promise((resolve) => {
            engine.handle(payload, function (error, res) {
                expect(error).toBeNull();
                expect(res).toBeDefined();
                expect(originalRequest.id).toStrictEqual(res.id);
                expect(originalRequest.jsonrpc).toStrictEqual(res.jsonrpc);
                // TODO: Replace `any` with type
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                expect(res.xyz).toBe(true);
                resolve();
            });
        });
    });
    it('decorate req', async () => {
        const engine = new _1.JsonRpcEngine();
        let originalRequest;
        engine.push((0, _1.mergeMiddleware)([
            function (request, response, _next, end) {
                originalRequest = request;
                // TODO: Replace `any` with type
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                request.xyz = true;
                response.result = true;
                end();
            },
        ]));
        const payload = { id: 1, jsonrpc, method: 'hello' };
        await new Promise((resolve) => {
            engine.handle(payload, function (error, response) {
                expect(error).toBeNull();
                expect(response).toBeDefined();
                expect(originalRequest.id).toStrictEqual(response.id);
                expect(originalRequest.jsonrpc).toStrictEqual(response.jsonrpc);
                // TODO: Replace `any` with type
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                expect(originalRequest.xyz).toBe(true);
                resolve();
            });
        });
    });
    it('should not error even if end not called', async () => {
        const engine = new _1.JsonRpcEngine();
        engine.push((0, _1.mergeMiddleware)([(_request, _response, next, _end) => next()]));
        engine.push((_request, response, _next, end) => {
            response.result = true;
            end();
        });
        const payload = { id: 1, jsonrpc, method: 'hello' };
        await new Promise((resolve) => {
            engine.handle(payload, function (error, response) {
                expect(error).toBeNull();
                expect(response).toBeDefined();
                resolve();
            });
        });
    });
    it('handles next handler correctly across middleware', async () => {
        const engine = new _1.JsonRpcEngine();
        engine.push((0, _1.mergeMiddleware)([
            (_request, response, next, _end) => {
                next((callback) => {
                    // TODO: Replace `any` with type
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    response.copy = response.result;
                    callback();
                });
            },
        ]));
        engine.push((_request, response, _next, end) => {
            response.result = true;
            end();
        });
        const payload = { id: 1, jsonrpc, method: 'hello' };
        await new Promise((resolve) => {
            engine.handle(payload, function (error, response) {
                expect(error).toBeNull();
                // @ts-expect-error - `copy` is not a valid property of `JsonRpcSuccess`.
                const { copy, ...rest } = response;
                (0, utils_1.assertIsJsonRpcSuccess)(rest);
                expect(rest.result).toStrictEqual(copy);
                resolve();
            });
        });
    });
});
