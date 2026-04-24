# oncall-runbook

First responder procedure for paging alerts on `billing-api`.

## Common alerts

- **high-error-rate** — elevated 5xx. Run `deploy billing-api staging` with
  the last-known-good SHA, confirm error rate drops, then promote via
  `deploy billing-api production`.
- **slow-queries** — p99 DB latency > 800ms. No ship required; file a
  follow-up and page DB oncall.
- **stuck-migration** — migration job blocked > 5 min. Rollback with the
  `deploy` alias pointing at the prior release.

## Escalation

If error rate doesn't drop after rollback, page the service owner (see
`cat /skills/oncall_runbook/references/contacts.md`) and hand off.
