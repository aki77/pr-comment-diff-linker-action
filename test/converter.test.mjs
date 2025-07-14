import { test } from 'node:test';
import assert from 'node:assert';
import { convertFileReferences, escapeRegExp } from '../lib/converter.mjs';

// Mock PR files data
const mockPrFiles = {
    files: [
        {
            path: 'src/components/Button.tsx',
            url: 'https://github.com/owner/repo/pull/123/files#diff-abc123'
        },
        {
            path: 'utils/helper.js',
            url: 'https://github.com/owner/repo/pull/123/files#diff-xyz789'
        },
        {
            path: 'README.md',
            url: 'https://github.com/owner/repo/pull/123/files#diff-readme123'
        },
        {
            path: 'components/Modal.tsx',
            url: 'https://github.com/owner/repo/pull/123/files#diff-modal456'
        }
    ]
};

test('escapeRegExp should escape special regex characters', () => {
    assert.strictEqual(escapeRegExp('file.txt'), 'file\\.txt');
    assert.strictEqual(escapeRegExp('src/[file].js'), 'src/\\[file\\]\\.js');
    assert.strictEqual(escapeRegExp('file(1).js'), 'file\\(1\\)\\.js');
});

test('convertFileReferences should convert single line references', () => {
    const commentBody = 'Error at src/components/Button.tsx:25';
    const { updatedCommentBody, changesMade } = convertFileReferences(commentBody, mockPrFiles);
    
    assert.strictEqual(changesMade, true);
    assert.strictEqual(updatedCommentBody, 'Error at [src/components/Button.tsx:25](https://github.com/owner/repo/pull/123/files#diff-abc123R25)');
});

test('convertFileReferences should convert range references', () => {
    const commentBody = 'Check components/Modal.tsx:45-60';
    const { updatedCommentBody, changesMade } = convertFileReferences(commentBody, mockPrFiles);
    
    assert.strictEqual(changesMade, true);
    assert.strictEqual(updatedCommentBody, 'Check [components/Modal.tsx:45-60](https://github.com/owner/repo/pull/123/files#diff-modal456R45-R60)');
});

test('convertFileReferences should convert file references without line numbers', () => {
    const commentBody = 'Updated README.md';
    const { updatedCommentBody, changesMade } = convertFileReferences(commentBody, mockPrFiles);
    
    assert.strictEqual(changesMade, true);
    assert.strictEqual(updatedCommentBody, 'Updated [README.md](https://github.com/owner/repo/pull/123/files#diff-readme123)');
});

test('convertFileReferences should convert inline code references', () => {
    const commentBody = 'Check `utils/helper.js:10` function';
    const { updatedCommentBody, changesMade } = convertFileReferences(commentBody, mockPrFiles);
    
    assert.strictEqual(changesMade, true);
    assert.strictEqual(updatedCommentBody, 'Check [`utils/helper.js:10`](https://github.com/owner/repo/pull/123/files#diff-xyz789R10) function');
});

test('convertFileReferences should convert inline code file references without line numbers', () => {
    const commentBody = 'Modified `README.md` file';
    const { updatedCommentBody, changesMade } = convertFileReferences(commentBody, mockPrFiles);
    
    assert.strictEqual(changesMade, true);
    assert.strictEqual(updatedCommentBody, 'Modified [`README.md`](https://github.com/owner/repo/pull/123/files#diff-readme123) file');
});

test('convertFileReferences should not convert code blocks', () => {
    const commentBody = `Check this code:
\`\`\`js
const file = 'src/components/Button.tsx:25';
console.log(file);
\`\`\``;
    
    const { updatedCommentBody, changesMade } = convertFileReferences(commentBody, mockPrFiles);
    
    assert.strictEqual(changesMade, false);
    assert.strictEqual(updatedCommentBody, commentBody);
});

test('convertFileReferences should convert multiple references', () => {
    const commentBody = 'Error at src/components/Button.tsx:25 and utils/helper.js:10';
    const { updatedCommentBody, changesMade } = convertFileReferences(commentBody, mockPrFiles);
    
    assert.strictEqual(changesMade, true);
    assert.strictEqual(
        updatedCommentBody,
        'Error at [src/components/Button.tsx:25](https://github.com/owner/repo/pull/123/files#diff-abc123R25) and [utils/helper.js:10](https://github.com/owner/repo/pull/123/files#diff-xyz789R10)'
    );
});

test('convertFileReferences should not convert files not in PR', () => {
    const commentBody = 'Check unknown/file.js:10';
    const { updatedCommentBody, changesMade } = convertFileReferences(commentBody, mockPrFiles);
    
    assert.strictEqual(changesMade, false);
    assert.strictEqual(updatedCommentBody, commentBody);
});

test('convertFileReferences should handle mixed code blocks and regular references', () => {
    const commentBody = `Error at src/components/Button.tsx:25
\`\`\`js
const file = 'utils/helper.js:10';
\`\`\`
Also check README.md`;
    
    const { updatedCommentBody, changesMade } = convertFileReferences(commentBody, mockPrFiles);
    
    assert.strictEqual(changesMade, true);
    const expected = `Error at [src/components/Button.tsx:25](https://github.com/owner/repo/pull/123/files#diff-abc123R25)
\`\`\`js
const file = 'utils/helper.js:10';
\`\`\`
Also check [README.md](https://github.com/owner/repo/pull/123/files#diff-readme123)`;
    
    assert.strictEqual(updatedCommentBody, expected);
});

test('convertFileReferences should handle empty comment body', () => {
    const commentBody = '';
    const { updatedCommentBody, changesMade } = convertFileReferences(commentBody, mockPrFiles);
    
    assert.strictEqual(changesMade, false);
    assert.strictEqual(updatedCommentBody, '');
});

test('convertFileReferences should handle empty PR files', () => {
    const commentBody = 'Check src/components/Button.tsx:25';
    const emptyPrFiles = { files: [] };
    const { updatedCommentBody, changesMade } = convertFileReferences(commentBody, emptyPrFiles);
    
    assert.strictEqual(changesMade, false);
    assert.strictEqual(updatedCommentBody, commentBody);
});

test('convertFileReferences should not convert files inside existing markdown links', () => {
    const commentBody = 'Check [src/components/Button.tsx:25](https://example.com/existing-link) and utils/helper.js:10';
    const { updatedCommentBody, changesMade } = convertFileReferences(commentBody, mockPrFiles);
    
    assert.strictEqual(changesMade, true);
    assert.strictEqual(
        updatedCommentBody,
        'Check [src/components/Button.tsx:25](https://example.com/existing-link) and [utils/helper.js:10](https://github.com/owner/repo/pull/123/files#diff-xyz789R10)'
    );
});

test('convertFileReferences should not convert files inside existing markdown links with code formatting', () => {
    const commentBody = 'Check [`utils/helper.js:10`](https://example.com/existing-link) and src/components/Button.tsx:25';
    const { updatedCommentBody, changesMade } = convertFileReferences(commentBody, mockPrFiles);
    
    assert.strictEqual(changesMade, true);
    assert.strictEqual(
        updatedCommentBody,
        'Check [`utils/helper.js:10`](https://example.com/existing-link) and [src/components/Button.tsx:25](https://github.com/owner/repo/pull/123/files#diff-abc123R25)'
    );
});

test('convertFileReferences should handle multiple existing links', () => {
    const commentBody = 'Check [src/components/Button.tsx:25](https://example.com/link1) and [utils/helper.js:10](https://example.com/link2) and README.md';
    const { updatedCommentBody, changesMade } = convertFileReferences(commentBody, mockPrFiles);
    
    assert.strictEqual(changesMade, true);
    assert.strictEqual(
        updatedCommentBody,
        'Check [src/components/Button.tsx:25](https://example.com/link1) and [utils/helper.js:10](https://example.com/link2) and [README.md](https://github.com/owner/repo/pull/123/files#diff-readme123)'
    );
});