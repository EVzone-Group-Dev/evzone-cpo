# Swap Stations Implementation Backlog
Date: March 29, 2026
Scope: EVzone swap-stations control tower (operations, lifecycle, economics, SLA)

## Delivery Model
- Sprint length: 2 weeks
- Horizon: 10 weeks (5 sprints)
- Estimation: Story points (SP)
- Priority scale: P0 (must), P1 (high), P2 (medium)

## Sprint Plan (High Level)
| Sprint | Objective | Target Outcome |
|---|---|---|
| Sprint 1 | Data foundation + KPI baseline | Swap dashboard with reliable operational metrics |
| Sprint 2 | Lifecycle workflows | Pack state controls, inspection, quarantine/retire logic |
| Sprint 3 | Economics and utilization | Revenue/yield/cost visibility for swap decisions |
| Sprint 4 | Rebalancing engine + dispatch | Actionable pack-move recommendations and tracking |
| Sprint 5 | SLA command center + hardening | Fleet-level risk, alerting, auditability, full QA |

## Epic A: Data Foundation (P0)
| ID | Priority | Story | Deliverables | Acceptance Criteria | Dependencies | Estimate |
|---|---|---|---|---|---|---|
| SWAP-001 | P0 | Define canonical swap domain schema | Extend swap types with `packEvents`, `swapAttempts`, `packLifecycle`, `stationCapacityProfile` | Types compile; no type regressions; docs updated | None | 5 SP |
| SWAP-002 | P0 | Add mock API endpoints for swap telemetry | New MSW routes for events, attempts, lifecycle transitions | Endpoints return tenant-scoped data; RBAC enforced | SWAP-001 | 8 SP |
| SWAP-003 | P0 | Seed realistic time-series data | Mock generator for station throughput, failures, heartbeat gaps | KPI pages render with diverse operational states | SWAP-002 | 5 SP |
| SWAP-004 | P0 | Add swap write permissions | `swapStationsWrite`, `swapInventoryWrite`, `swapLifecycleWrite` access policies | Unauthorized roles return 403; authorized roles succeed | SWAP-002 | 3 SP |

## Epic B: KPI + Alerts Workspace (P0)
| ID | Priority | Story | Deliverables | Acceptance Criteria | Dependencies | Estimate |
|---|---|---|---|---|---|---|
| SWAP-101 | P0 | Build operations KPI strip | KPIs: success rate, median/p95 turnaround, ready-pack runway, failed-swap rate | KPI formulas validated with fixture tests | SWAP-003 | 8 SP |
| SWAP-102 | P0 | Upgrade swap station list analytics | Add columns for runway hours, failed swaps 24h, utilization class | Sorting/filtering works for new fields | SWAP-101 | 5 SP |
| SWAP-103 | P0 | Implement alert rules | Rules for low ready-pack floor, heartbeat loss, repeated failed inspection | Alert cards + severity routing displayed | SWAP-003 | 8 SP |
| SWAP-104 | P1 | Add acknowledgment workflow | Alert ack/unack with actor + timestamp | Ack events visible in UI and audit trail | SWAP-103, SWAP-602 | 5 SP |

## Epic C: Battery Lifecycle Controls (P0)
| ID | Priority | Story | Deliverables | Acceptance Criteria | Dependencies | Estimate |
|---|---|---|---|---|---|---|
| SWAP-201 | P0 | Implement lifecycle state machine | Valid transitions: Ready, Charging, Reserved, Installed, Quarantined, Retired | Invalid transitions blocked with clear errors | SWAP-001, SWAP-004 | 8 SP |
| SWAP-202 | P0 | Add inspection workflow | Inspection form with result + defect codes + notes | Failed inspections auto-route to Quarantined | SWAP-201 | 8 SP |
| SWAP-203 | P1 | Retirement policy rules | Threshold-based retire suggestions (cycles/SoH) | Suggested/approved retire actions tracked | SWAP-201 | 5 SP |
| SWAP-204 | P1 | Pack timeline UI | Unified event timeline per pack | Timeline includes swaps, inspections, lifecycle events | SWAP-002, SWAP-202 | 5 SP |

## Epic D: Swap Economics (P1)
| ID | Priority | Story | Deliverables | Acceptance Criteria | Dependencies | Estimate |
|---|---|---|---|---|---|---|
| SWAP-301 | P1 | Add economics dashboard | Metrics: swaps/day, revenue/station/day, yield/pack/day, idle inventory ratio | Metrics filter by tenant, station, date range | SWAP-003 | 8 SP |
| SWAP-302 | P1 | Introduce cost model settings | Configurable assumptions for pack depreciation and carrying cost | Setting changes recalculate economics views | SWAP-301 | 5 SP |
| SWAP-303 | P2 | Add CSV exports | Export station economics and lifecycle exceptions | CSV download includes active filters | SWAP-301 | 3 SP |

## Epic E: Rebalancing Recommendations (P1)
| ID | Priority | Story | Deliverables | Acceptance Criteria | Dependencies | Estimate |
|---|---|---|---|---|---|---|
| SWAP-401 | P1 | Compute station deficit/surplus score | Rule engine using runway, demand trend, and reserve floor | Scores update with filter/date changes | SWAP-101, SWAP-301 | 8 SP |
| SWAP-402 | P1 | Recommendation queue UI | Suggested pack moves with confidence + ETA impact | Operator can accept/reject with reason | SWAP-401, SWAP-004 | 8 SP |
| SWAP-403 | P1 | Dispatch action logging | Track move action lifecycle: proposed, approved, in-transit, completed | Full status history shown in UI | SWAP-402 | 5 SP |

## Epic F: SLA Command Center (P1)
| ID | Priority | Story | Deliverables | Acceptance Criteria | Dependencies | Estimate |
|---|---|---|---|---|---|---|
| SWAP-501 | P1 | SLA policy definitions | SLA settings for turnaround and station readiness by segment | Breaches computed and surfaced consistently | SWAP-101 | 5 SP |
| SWAP-502 | P1 | Fleet risk board | Rank stations by breach risk and depletion ETA | Top-risk list updates in near real-time (mock interval) | SWAP-501, SWAP-103 | 8 SP |
| SWAP-503 | P2 | Root-cause trend analysis | Breakdown of failures by code, cabinet, station, shift | Trends visible for 7/30/90-day windows | SWAP-002 | 5 SP |

## Epic G: Hardening, Governance, QA (P0)
| ID | Priority | Story | Deliverables | Acceptance Criteria | Dependencies | Estimate |
|---|---|---|---|---|---|---|
| SWAP-601 | P0 | RBAC coverage for new swap actions | Route + API enforcement for write actions | Access tests pass for all active roles | SWAP-004 | 5 SP |
| SWAP-602 | P0 | Audit events for swap writes | Record actor, action, target, timestamp, tenant | Audit logs view includes swap actions | SWAP-201, SWAP-402 | 5 SP |
| SWAP-603 | P0 | Test suite expansion | Component tests + API tests + regression suite | `lint`, `test`, and `build` all pass in CI | All above | 8 SP |
| SWAP-604 | P1 | Performance and UX pass | Loading skeletons, empty states, table virtualization review | No blocking UX lag with seeded large datasets | SWAP-603 | 5 SP |

## Definition of Done
- Story acceptance criteria fully met.
- Unit/component/API tests added or updated.
- Lint, test, and build pass.
- RBAC and tenancy behavior validated.
- Feature documented in release notes/changelog.

## Recommended Build Order
1. Epic A -> Epic B
2. Epic C
3. Epic D
4. Epic E
5. Epic F + Epic G

## Suggested File Targets In This Repo
- Types and contracts: `src/core/types/mockApi.ts`
- Swap hooks: `src/core/hooks/useSwapping.ts`
- Mock APIs and seed data: `src/mocks/handlers.ts`, `src/mocks/data.ts`
- Swap pages: `src/pages/swapping/SwapStationsPage.tsx`, `src/pages/swapping/SwapStationDetailPage.tsx`, `src/pages/swapping/SwapSessionsPage.tsx`, `src/pages/swapping/BatteryInventoryPage.tsx`
- Access control: `src/core/auth/access.ts`
- Tests: `src/mocks/*.test.ts`, `src/pages/swapping/*.test.tsx`
