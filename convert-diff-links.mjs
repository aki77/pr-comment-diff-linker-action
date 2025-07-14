#!/usr/bin/env node

import { execSync } from 'child_process';
import { convertFileReferences } from './lib/converter.mjs';

// Function to log messages to stderr
function log(message) {
    console.error(`[${new Date().toISOString()}] ${message}`);
}

// Function to handle errors
function handleError(message) {
    log(`ERROR: ${message}`);
    process.exit(1);
}

// Validate required environment variables
const prNumber = process.env.PR_NUMBER;
if (!prNumber) {
    handleError('PR_NUMBER environment variable is required');
}

log(`Starting diff link conversion for PR #${prNumber}`);

// Read comment body from stdin
let commentBody = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
    commentBody += chunk;
});

process.stdin.on('end', () => {
    processCommentBody(commentBody);
});

function processCommentBody(commentBody) {
    // Get PR files with diff URLs using gh-pr-files
    log('Getting PR files with diff URLs...');
    let prFiles;
    try {
        const prFilesOutput = execSync(`gh pr-files ${prNumber}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
        prFiles = JSON.parse(prFilesOutput);
    } catch (error) {
        handleError('Failed to get PR files. Make sure gh-pr-files extension is installed.');
    }

    // Process file references with unified patterns
    log('Processing file references...');

    const { updatedCommentBody, changesMade } = convertFileReferences(commentBody, prFiles);

    if (changesMade) {
        log('Diff link conversion completed with changes');
    }

    // Output the updated comment body
    console.log(updatedCommentBody);

    // Exit with appropriate status
    if (changesMade) {
        log('Diff link conversion completed with changes');
        process.exit(0);
    } else {
        log('Diff link conversion completed without changes');
        process.exit(1);
    }
}
