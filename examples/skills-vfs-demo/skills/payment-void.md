# payment_void

Void a customer payment with a tier-specific approval code.

## When to use

The user reports a payment void, refund reversal, or chargeback undo for a
specific `payment_id` and mentions the customer tier (STANDARD, PRO, or
ENTERPRISE).

## What you'll need

- The customer's **approval code** for their tier. Codes live under this
  skill's `references/` directory.
- The **call contract** for the void alias (its name, params, and arg
  order). That's under this skill's `scripts/` directory.

Browse those with `ls` and `cat` and you'll have everything.

## Result

On success the shell prints `voided payment <id> with code <code>`.
