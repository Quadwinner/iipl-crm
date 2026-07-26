---
inclusion: fileMatch
fileMatchPattern: '**/*.{test,spec}.{ts,tsx}'
---

# Testing Rules

Vitest as the runner. Always `--run` (never watch mode) so commands terminate.

## Property-based tests

`fast-check`, driven through `supabase-js` against the linked Postgres instance. The
atomicity and RLS guarantees only hold because of real Postgres constraints, locks and
policies — a mocked client would test a fiction, so these run against the real database.

Each property test maps to a numbered correctness property in
`.kiro/specs/office-rental-crm/design.md`. Name it after the property and assert the
behaviour stated there, not the implementation. Reference the property number and the
requirement clauses in the test description.

Mock only the third-party edges: payment gateways, email, SMS.

Generate inputs across the documented bounds *and* just outside them — the requirements
specify rejection behaviour at the edges, so both sides need coverage.

## Isolation

Each test creates its own fixtures with unique identifiers and cleans up after itself.
Never assume an empty database or a specific row count; other tests and seed data coexist.

For RLS tests, act as a specific user rather than the service role — service-role bypasses
RLS and would make the test pass regardless of whether the policy is correct. That is the
single easiest way to write a security test that proves nothing.

## Cross-tenant tests

Isolation tests need at least two distinct owners, then assert owner A cannot read, update
or download any of owner B's rows, and that owner B still can. Absence of a row and a
permission error are both acceptable denials.

## Unit tests

Cover validation bounds, error-message mapping, retry/backoff counting, and date/rounding
arithmetic with concrete examples. These complement the property tests rather than
duplicating them.
