# deploy

Promote a built artifact to an environment.

## When to use

The user asks to ship, publish, push live, or "deploy" a named service.

## How to run

1. `cat /skills/deploy/references/env-matrix` — check which envs are valid.
2. Dispatch via the `deploy` alias: `deploy <service-name> <env>`.
   Example: `deploy billing-api production`.
3. Full contract (params, types, defaults): `cat /skills/deploy/scripts/deploy`.

`env` defaults to `staging` when omitted. Any other value must appear in the
env-matrix sibling file.
