"use strict";
/* eslint-disable @typescript-eslint/no-non-null-assertion */
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require(".");
describe('idRemapMiddleware', () => {
    it('basic middleware test', async () => {
        const engine = new _1.JsonRpcEngine();
        const observedIds = {
            before: {},
            after: {},
        };
        engine.push(function (request, response, next, _end) {
            observedIds.before.request = request.id;
            observedIds.before.response = response.id;
            next();
        });
        engine.push((0, _1.createIdRemapMiddleware)());
        engine.push(function (request, response, _next, end) {
            observedIds.after.request = request.id;
            observedIds.after.response = response.id;
            // set result so it doesnt error
            response.result = true;
            end();
        });
        const payload = { id: 1, jsonrpc: '2.0', method: 'hello' };
        const payloadCopy = { ...payload };
        await new Promise((resolve) => {
            engine.handle(payload, function (error, response) {
                expect(error).toBeNull();
                expect(response).toBeDefined();
                // collected data
                expect(observedIds.before.request).toBeDefined();
                expect(observedIds.before.response).toBeDefined();
                expect(observedIds.after.request).toBeDefined();
                expect(observedIds.after.response).toBeDefined();
                // data matches expectations
                expect(observedIds.before.request).toStrictEqual(observedIds.before.response);
                expect(observedIds.after.request).toStrictEqual(observedIds.after.response);
                // correct behavior
                expect(observedIds.before.request).not.toStrictEqual(observedIds.after.request);
                expect(observedIds.before.request).toStrictEqual(response.id);
                expect(payload.id).toStrictEqual(response.id);
                expect(payloadCopy.id).toStrictEqual(response.id);
                resolve();
            });
        });
    });
});
