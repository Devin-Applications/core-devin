"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rpc_errors_1 = require("@metamask/rpc-errors");
const utils_1 = require("@metamask/utils");
const _1 = require(".");
describe('createScaffoldMiddleware', () => {
    it('basic middleware test', async () => {
        const engine = new _1.JsonRpcEngine();
        const scaffold = {
            method1: 'foo',
            method2: (_request, response, _next, end) => {
                response.result = 42;
                end();
            },
            method3: (_request, response, _next, end) => {
                response.error = rpc_errors_1.rpcErrors.internal({ message: 'method3' });
                end();
            },
        };
        engine.push((0, _1.createScaffoldMiddleware)(scaffold));
        engine.push((_request, response, _next, end) => {
            response.result = 'passthrough';
            end();
        });
        const payload = { id: 1, jsonrpc: '2.0' };
        const response1 = await engine.handle({ ...payload, method: 'method1' });
        const response2 = await engine.handle({ ...payload, method: 'method2' });
        const response3 = await engine.handle({ ...payload, method: 'method3' });
        const response4 = await engine.handle({ ...payload, method: 'unknown' });
        (0, utils_1.assertIsJsonRpcSuccess)(response1);
        expect(response1.result).toBe('foo');
        (0, utils_1.assertIsJsonRpcSuccess)(response2);
        expect(response2.result).toBe(42);
        (0, utils_1.assertIsJsonRpcFailure)(response3);
        expect(response3.error.message).toBe('method3');
        (0, utils_1.assertIsJsonRpcSuccess)(response4);
        expect(response4.result).toBe('passthrough');
    });
});
