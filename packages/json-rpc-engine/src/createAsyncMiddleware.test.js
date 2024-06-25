"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@metamask/utils");
const _1 = require(".");
const jsonrpc = '2.0';
describe('createAsyncMiddleware', () => {
    it('basic middleware test', async () => {
        const engine = new _1.JsonRpcEngine();
        engine.push((0, _1.createAsyncMiddleware)(async (_request, response, _next) => {
            response.result = 42;
        }));
        const payload = { id: 1, jsonrpc, method: 'hello' };
        await new Promise((resolve) => {
            engine.handle(payload, function (error, response) {
                expect(error).toBeNull();
                expect(response).toBeDefined();
                (0, utils_1.assertIsJsonRpcSuccess)(response);
                expect(response.result).toBe(42);
                resolve();
            });
        });
    });
    it('next middleware test', async () => {
        const engine = new _1.JsonRpcEngine();
        engine.push((0, _1.createAsyncMiddleware)(async (_request, response, next) => {
            expect(response.result).toBeUndefined();
            // eslint-disable-next-line n/callback-return
            await next();
            expect(response.result).toBe(1234);
            // override value
            response.result = 42; // eslint-disable-line require-atomic-updates
        }));
        engine.push(function (_request, response, _next, end) {
            response.result = 1234;
            end();
        });
        const payload = { id: 1, jsonrpc, method: 'hello' };
        await new Promise((resolve) => {
            engine.handle(payload, function (error, response) {
                expect(error).toBeNull();
                expect(response).toBeDefined();
                (0, utils_1.assertIsJsonRpcSuccess)(response);
                expect(response.result).toBe(42);
                resolve();
            });
        });
    });
    it('basic throw test', async () => {
        const engine = new _1.JsonRpcEngine();
        const thrownError = new Error('bad boy');
        engine.push((0, _1.createAsyncMiddleware)(async (_req, _res, _next) => {
            throw thrownError;
        }));
        const payload = { id: 1, jsonrpc, method: 'hello' };
        await new Promise((resolve) => {
            engine.handle(payload, function (error, _response) {
                expect(error).toBeDefined();
                expect(error).toStrictEqual(thrownError);
                resolve();
            });
        });
    });
    it('throw after next test', async () => {
        const engine = new _1.JsonRpcEngine();
        const thrownError = new Error('bad boy');
        engine.push((0, _1.createAsyncMiddleware)(async (_request, _response, next) => {
            // eslint-disable-next-line n/callback-return
            await next();
            throw thrownError;
        }));
        engine.push(function (_request, response, _next, end) {
            response.result = 1234;
            end();
        });
        const payload = { id: 1, jsonrpc, method: 'hello' };
        await new Promise((resolve) => {
            engine.handle(payload, function (error, _response) {
                expect(error).toBeDefined();
                expect(error).toStrictEqual(thrownError);
                resolve();
            });
        });
    });
    it("doesn't await next", async () => {
        const engine = new _1.JsonRpcEngine();
        engine.push((0, _1.createAsyncMiddleware)(async (_request, _response, next) => {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            next();
        }));
        engine.push(function (_request, response, _next, end) {
            response.result = 1234;
            end();
        });
        const payload = { id: 1, jsonrpc, method: 'hello' };
        await new Promise((resolve) => {
            engine.handle(payload, function (error, _response) {
                expect(error).toBeDefined();
                resolve();
            });
        });
    });
});
