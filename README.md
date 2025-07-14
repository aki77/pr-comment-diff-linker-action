# PR Comment Diff Linker Action

A GitHub Action that automatically converts file reference patterns in PR comments to links to GitHub diff screens.

## Features

- Detects and converts multiple file reference formats in PR comments
- Uses [gh-pr-files](https://github.com/aki77/gh-pr-files) to generate diff screen URLs
- Automatically converts file references to Markdown links
- Preserves code blocks (content within ```) without conversion

## Supported Patterns

### Basic File References
- `filename:123` → `[filename:123](diff_url#R123)`
- `filename:20-30` → `[filename:20-30](diff_url#R20-R30)`
- `filename` → `[filename](diff_url)`

### Excluded from Conversion
- File references within code blocks (content within ```) remain unchanged

## Usage

### Basic Usage

```yaml
name: Link Diff in PR Comment
on:
  issue_comment:
    types: [created, edited]

jobs:
  link-diff:
    if: github.event.issue.pull_request
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Link diff files
        uses: aki77/pr-comment-diff-linker-action@v1
        with:
          pr-number: ${{ github.event.issue.number }}
          comment-id: ${{ github.event.comment.id }}
          token: ${{ secrets.GITHUB_TOKEN }}
```

## Input Parameters

| Parameter | Description | Required | Default |
|-----------|-------------|----------|---------|
| `pr-number` | Pull Request number | Yes | - |
| `comment-id` | Comment ID | Yes | - |
| `token` | GitHub Token | No | `${{ github.token }}` |

## Conversion Examples

### Single Line Reference
```
An error occurs at src/components/Button.tsx:25.
Please check the function in `utils/helper.js:10`.
```

↓

```
An error occurs at [src/components/Button.tsx:25](https://github.com/owner/repo/pull/123/files#diff-abc123...def456R25).
Please check the function in [`utils/helper.js:10`](https://github.com/owner/repo/pull/123/files#diff-xyz789...abc123R10).
```

### Range Reference
```
Please review the components/Modal.tsx:45-60 section.
```

↓

```
Please review the [components/Modal.tsx:45-60](https://github.com/owner/repo/pull/123/files#diff-def789...ghi012R45-R60) section.
```

### File Reference Only
```
Updated README.md.
```

↓

```
Updated [README.md](https://github.com/owner/repo/pull/123/files#diff-readme123...456).
```

## Permissions

This action requires the following permissions:

- `contents: read` - To read the repository
- `pull-requests: write` - To update PR comments

## Notes

- File references not included in the PR will not be converted
- File references within code blocks (content within ```) will not be converted
- Comment updates are skipped when no changes are made

## License

MIT License
