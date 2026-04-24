# release-notes

Draft a release-notes entry from a merged PR title + body.

## When to use

After a PR merges and the user asks for "release notes", "changelog line",
"draft the announcement", or similar.

## How to run

Aliased as the shell command `release-notes <pr-number>`. Full contract:
`cat /skills/release_notes/scripts/release-notes`.

The tool returns a 2-3 line markdown blurb. Paste it under the next release
header in the upstream repo.

## Conventions

- Lead with a verb ("Add", "Fix", "Remove", "Rename").
- Link the PR: `(#<pr-number>)`.
- Keep it under 120 chars on the first line.
