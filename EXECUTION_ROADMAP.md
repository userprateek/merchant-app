# Merchant App Execution Roadmap

## P0 (Now: Operational Correctness + Safety)
- Hard content validation before listing/relisting.
- Order pack-stage implementation end-to-end (single + bulk).
- Orders pagination for scalable operations.
- Channel sync on ship (integration event dispatch).
- Standardized integration failure handling + retry primitive.

## P1 (Next: Production Hardening)
- Soft-delete strategy for mutable entities (product/listing/order where applicable).
- Audit trail with actor metadata (`performedBy`, `performedAt`, `action`).
- Per-channel credential validation rules + connection test action.
- Manual order pull workflow with idempotency.
- Price auto-recalc for listings that follow base price.

## P2 (Then: Insights + Scale)
- Dashboard metrics expansion (sales, channel performance, valuation).
- Oversell alerts and threshold-based notifications.
- Integration sync status tracking on listing/order lifecycle.
- Background jobs for sync/pull/retry processing.
- Test suite expansion (service + integration + high-risk flows).

## Current Implementation Wave
- P0.1: Listing guard for content completeness.
- P0.2: Order pack stage (service + UI + bulk).
- P0.3: Orders pagination.
