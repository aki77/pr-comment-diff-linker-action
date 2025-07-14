// Escape special regex characters
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Convert file references in comment body to diff links
export function convertFileReferences(commentBody, prFiles) {
    let updatedCommentBody = commentBody;
    let changesMade = false;

    // Extract and temporarily replace code blocks to avoid processing them
    const codeBlocks = [];
    const codeBlockPlaceholder = '___CODE_BLOCK_PLACEHOLDER___';

    // Find all code blocks (```...```)
    updatedCommentBody = updatedCommentBody.replace(/```[\s\S]*?```/g, (match) => {
        codeBlocks.push(match);
        return `${codeBlockPlaceholder}${codeBlocks.length - 1}`;
    });

    // Create a map for fast file lookup
    const fileMap = new Map();
    for (const file of prFiles.files) {
        fileMap.set(file.path, file);
    }

    // Create unified regex patterns for all files
    const allPaths = prFiles.files.map(file => escapeRegExp(file.path));
    const pathsPattern = allPaths.join('|');

    // Combined pattern to match all possible file references
    const unifiedPattern = new RegExp(
        `(?:` +
        `\`(${pathsPattern})(?::(\\d+(?:-\\d+)?))?\`|` +           // `path:line` or `path`
        `\\b(${pathsPattern}):(\\d+(?:-\\d+)?)\\b|` +             // path:line
        `\\b(${pathsPattern})\\b` +                                // path only
        `)`,
        'g'
    );

    updatedCommentBody = updatedCommentBody.replace(unifiedPattern, (match, inlineCodePath, inlineCodeLine, regularPath, regularLine, plainPath) => {
        let path, lineRef, isInlineCode;

        if (inlineCodePath) {
            // `path:line` or `path`
            path = inlineCodePath;
            lineRef = inlineCodeLine;
            isInlineCode = true;
        } else if (regularPath) {
            // path:line
            path = regularPath;
            lineRef = regularLine;
            isInlineCode = false;
        } else if (plainPath) {
            // path only
            path = plainPath;
            lineRef = null;
            isInlineCode = false;
        } else {
            return match; // Should not happen
        }

        const fileInfo = fileMap.get(path);
        if (!fileInfo) {
            return match; // File not found in PR files
        }

        changesMade = true;

        // Generate link based on pattern
        if (lineRef) {
            // Has line reference
            if (lineRef.includes('-')) {
                const [startLine, endLine] = lineRef.split('-');
                const anchor = `R${startLine}-R${endLine}`;
                return isInlineCode
                    ? `[\`${path}:${lineRef}\`](${fileInfo.url}${anchor})`
                    : `[${match}](${fileInfo.url}${anchor})`;
            } else {
                const anchor = `R${lineRef}`;
                return isInlineCode
                    ? `[\`${path}:${lineRef}\`](${fileInfo.url}${anchor})`
                    : `[${match}](${fileInfo.url}${anchor})`;
            }
        } else {
            // No line reference
            return isInlineCode
                ? `[\`${path}\`](${fileInfo.url})`
                : `[${path}](${fileInfo.url})`;
        }
    });

    // Restore code blocks
    updatedCommentBody = updatedCommentBody.replace(new RegExp(`${codeBlockPlaceholder}(\\d+)`, 'g'), (_, index) => {
        return codeBlocks[parseInt(index)];
    });

    return {
        updatedCommentBody,
        changesMade
    };
}

export { escapeRegExp };