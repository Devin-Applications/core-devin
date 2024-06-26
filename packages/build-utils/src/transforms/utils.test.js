"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("..");
describe('transform utils', () => {
    describe('lintTransformedFile', () => {
        // TODO: Replace `any` with type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mockESLint = {
            lintText: jest.fn(),
        };
        it('returns if linting passes with no errors', async () => {
            mockESLint.lintText.mockImplementationOnce(async () => Promise.resolve([{ errorCount: 0 }]));
            expect(await (0, __1.lintTransformedFile)(mockESLint, 'file.js', '/* JavaScript */')).toBeUndefined();
        });
        it('throws if the file is ignored by ESLint', async () => {
            mockESLint.lintText.mockImplementationOnce(async () => Promise.resolve([]));
            await expect(async () => (0, __1.lintTransformedFile)(mockESLint, 'file.js', '/* JavaScript */')).rejects.toThrow(/Transformed file "file\.js" appears to be ignored by ESLint\.$/u);
        });
        it('throws if linting produced any errors', async () => {
            const ruleId = 'some-eslint-rule';
            const message = 'You violated the rule!';
            mockESLint.lintText.mockImplementationOnce(async () => Promise.resolve([
                { errorCount: 1, messages: [{ message, ruleId, severity: 2 }] },
            ]));
            await expect(async () => (0, __1.lintTransformedFile)(mockESLint, 'file.js', '/* JavaScript */')).rejects.toThrow(/Lint errors encountered for transformed file "file\.js":\n\n {4}some-eslint-rule\n {4}You violated the rule!\n\n$/u);
        });
        // Contrived case for coverage purposes
        it('handles missing rule ids', async () => {
            const ruleId = null;
            const message = 'You violated the rule!';
            mockESLint.lintText.mockImplementationOnce(async () => Promise.resolve([
                { errorCount: 1, messages: [{ message, ruleId, severity: 2 }] },
            ]));
            await expect(async () => (0, __1.lintTransformedFile)(mockESLint, 'file.js', '/* JavaScript */')).rejects.toThrow(/Lint errors encountered for transformed file "file\.js":\n\n {4}<Unknown rule>\n {4}You violated the rule!\n\n$/u);
        });
    });
});
