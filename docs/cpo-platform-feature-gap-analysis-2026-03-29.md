# CPO Platform Feature Gap Analysis - 2026-03-29

## Scope

This note compares the current EVzone platform against the baseline and forward-looking capabilities that modern Charge Point Operator (CPO) platforms are expected to support as of March 29, 2026.

This version updates the earlier frontend-heavy review by including the adjacent protocol backends as well:

- `evzone-cpo-central`
- `../ocpp-gateway`
- `../ocpi-gateway`

That changes the conclusion materially: EVzone is no longer just a product shell with mocked protocol workflows. It now has a real OCPP gateway and a partial-but-real OCPI gateway. The remaining question is less "do protocols exist?" and more "how complete and production-fit are they?"

Primary evidence used in this updated review:

- `README.md`
- `src/router/AppRoutes.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/mocks/handlers.ts`
- `src/mocks/data.ts`
- `src/pages/stations/StationsPage.tsx`
- `src/pages/stations/StationDetailPage.tsx`
- `src/pages/charge-points/ChargePointDetailPage.tsx`
- `src/pages/incidents/IncidentsPage.tsx`
- `src/pages/energy/SmartChargingPage.tsx`
- `src/pages/roaming/OCPIPartnersPage.tsx`
- `src/pages/roaming/OCPICommandsPage.tsx`
- `src/pages/roaming/OCPICDRsPage.tsx`
- `src/pages/finance/BillingPage.tsx`
- `src/pages/finance/SettlementPage.tsx`
- `src/pages/settings/SettingsPage.tsx`
- `src/pages/settings/WhiteLabelPage.tsx`
- `src/pages/swapping/SwapStationsPage.tsx`
- `src/pages/swapping/SwapStationDetailPage.tsx`
- `src/pages/swapping/BatteryInventoryPage.tsx`
- `../ocpp-gateway/README.md`
- `../ocpp-gateway/apps/gateway/src/main.ts`
- `../ocpp-gateway/apps/gateway/src/config/validate-env.ts`
- `../ocpp-gateway/apps/gateway/src/health/health.controller.ts`
- `../ocpp-gateway/apps/gateway/src/ocpp/ocpp.gateway.ts`
- `../ocpp-gateway/apps/gateway/src/ocpp/ocpp-ws.adapter.ts`
- `../ocpp-gateway/apps/gateway/src/ocpp/charger-identity.service.ts`
- `../ocpp-gateway/apps/gateway/src/ocpp/pki.service.ts`
- `../ocpp-gateway/apps/gateway/src/ocpp/command-dispatcher.service.ts`
- `../ocpp-gateway/apps/gateway/src/ocpp/versions/ocpp16.adapter.ts`
- `../ocpp-gateway/apps/gateway/src/ocpp/versions/ocpp201.adapter.ts`
- `../ocpp-gateway/apps/gateway/src/ocpp/versions/ocpp21.adapter.ts`
- `../ocpi-gateway/README.md`
- `../ocpi-gateway/docs/architecture.md`
- `../ocpi-gateway/docs/internal-ocpi-contracts.md`
- `../ocpi-gateway/docs/kafka-contracts.md`
- `../ocpi-gateway/src/main.ts`
- `../ocpi-gateway/src/app.module.ts`
- `../ocpi-gateway/src/config/configuration.ts`
- `../ocpi-gateway/src/platform/evzone-api.service.ts`
- `../ocpi-gateway/src/modules/health/health.controller.ts`
- `../ocpi-gateway/src/modules/ocpi/ocpi.service.ts`
- `../ocpi-gateway/src/modules/commands/commands.service.ts`
- `../ocpi-gateway/src/modules/charging-profiles/charging-profiles.service.ts`
- `../ocpi-gateway/src/modules/hub-client-info/hub-client-info.service.ts`

## Protocol Reality Check

### OCPP gateway

This is a real gateway, not a mock bench.

- The service supports OCPP `1.6J`, `2.0.1`, and `2.1`.
- It implements secure WebSocket handling, protocol/schema validation, charger authentication, Redis-backed session ownership, Kafka event routing, health/metrics endpoints, TLS/mTLS, and certificate-related flows.
- I verified that `https://ocpp.evzonecharging.com/` responded with HTTP `200` on March 29, 2026.
- Verification results from this review:
- `npm run build`: passed
- `npm run test`: passed
- `npm run test:contracts:cross-repo`: passed
- `npm run lint`: failed with 6 lint errors

The important caveat is feature depth, not existence. The gateway is clearly fit for a serious first production OCPP layer, but advanced 2.0.1 and 2.1 coverage is still incomplete. The outbound command dispatcher currently covers only a smaller command set such as reset, remote start/stop, unlock connector, update firmware, some 1.6-only commands, and `CertificateSigned`. Device-model and some newer 2.x flows are partly stubbed or simplified.

### OCPI gateway

This is also real code, but it is not yet a full standalone roaming backbone.

- The service supports OCPI `2.2.1` and `2.1.1`.
- It implements versions and credentials flows, partner auth guards, request context handling, Redis-backed idempotency, and functional OCPI modules for locations, tariffs, tokens, sessions, CDRs, commands, charging profiles, and hub client info.
- It is strongly dependent on backend `/internal/ocpi/*` contracts and behaves more like a protocol facade/orchestrator than an independent roaming core.
- Verification results from this review:
- `npm run build`: passed
- no automated test script was found in `package.json`
- `npm run lint`: fails because the repo has no ESLint config

The main caution here is completeness. The code is useful and materially ahead of a mock-only implementation, but the repo itself still documents "new contracts required by full OCPI scope", the health endpoint is static, Kafka contracts are documented more strongly than they appear to be exercised in the code, and there is no evidence of OCPI `2.3.0` support or conformance automation yet.

## What the market expects now

From official platform and standards sources, the common CPO feature baseline now includes:

- Hardware-agnostic charger operations, remote monitoring, real-time issue detection, remote recovery, and smart tariff/energy management.
- Billing, invoicing, settlement, payment gateways/terminals, and direct charging commerce.
- OCPP operations plus OCPI roaming, commands, CDR handling, partner onboarding, and conformance testing.
- Smart charging, dynamic load balancing, demand response, and increasingly DER/BESS/renewables integration.
- Plug & Charge / ISO 15118 readiness, V2G/V2X support, and stronger OCPP 2.x compliance.
- Open APIs, webhooks, notifications, integrations with CRM/ERP/helpdesk/BI, and enterprise security controls such as RBAC, 2FA, SSO, and logging.
- Fleet features such as scheduling, route/driver tooling, reimbursements, and reservations/booking.

## EVzone status at a glance

Legend:

- `Strong`: clearly implemented and supported by meaningful application or backend service evidence.
- `Partial`: real evidence exists, but production depth, coverage, standards support, or verification is still incomplete.
- `Missing`: no clear implementation evidence found.

| Capability area | Market expectation | EVzone status | EVzone evidence | Notes |
| --- | --- | --- | --- | --- |
| Core network operations | Station and charger inventory, telemetry, remote operations, uptime visibility | Strong | `src/pages/stations/StationsPage.tsx`, `src/pages/stations/StationDetailPage.tsx`, `src/pages/charge-points/ChargePointDetailPage.tsx`, `../ocpp-gateway/apps/gateway/src/ocpp/ocpp.gateway.ts` | EVzone now has both the operator UX and a real charger-protocol gateway behind it. |
| Device protocol plane (OCPP) | Secure charger connectivity, command routing, multi-version support, telemetry ingestion | Strong | `../ocpp-gateway/apps/gateway/src/main.ts`, `../ocpp-gateway/apps/gateway/src/config/validate-env.ts`, `../ocpp-gateway/apps/gateway/src/ocpp/ocpp-ws.adapter.ts`, `../ocpp-gateway/apps/gateway/src/ocpp/charger-identity.service.ts`, `../ocpp-gateway/apps/gateway/src/ocpp/command-dispatcher.service.ts` | This is one of EVzone's biggest upgrades versus the earlier assessment. The gateway is live and production-shaped, though still not feature-complete across all OCPP 2.x areas. |
| Incident and field operations | Ticketing, dispatch, issue triage, remote remediation | Strong | `src/pages/incidents/IncidentsPage.tsx`, `src/pages/dashboard/TechnicianDashboard.tsx` | The operator workflow shape remains strong here. |
| Multi-tenant admin and RBAC | Multi-operator scoping, tenant isolation, role-based access | Strong | `src/core/auth/access.ts`, `src/core/hooks/useTenant.ts`, `src/mocks/handlers.ts`, `src/pages/settings/SettingsPage.tsx` | Tenant-aware routing and access control are still among EVzone's strongest foundations. |
| White-label capability | Branded web/mobile experiences, operator branding control | Partial | `src/pages/settings/WhiteLabelPage.tsx` | Branding controls exist, but I still did not find evidence of tenant-branded app delivery pipelines or deployment automation. |
| Smart charging and load management | Dynamic load balancing, peak shaving, policy control | Partial | `src/pages/energy/SmartChargingPage.tsx`, `src/pages/energy/LoadPolicyPage.tsx`, `../ocpp-gateway/apps/gateway/src/ocpp/versions/ocpp21.adapter.ts`, `../ocpi-gateway/src/modules/charging-profiles/charging-profiles.service.ts` | EVzone now has protocol-side groundwork, but the end-to-end optimizer and broad smart-charging command surface are still incomplete. |
| Finance and revenue operations | Tariffs, invoicing, settlement, payout visibility | Partial | `src/pages/tariffs/TariffsPage.tsx`, `src/pages/finance/BillingPage.tsx`, `src/pages/finance/PayoutsPage.tsx`, `src/pages/finance/SettlementPage.tsx` | EVzone covers the finance workspace well, but there is still no clear direct-payment, terminal, or tax-engine workflow. |
| Roaming and interoperability (OCPI) | OCPI partners, commands, CDRs, roaming settlements, hub connectivity | Partial | `src/pages/roaming/OCPIPartnersPage.tsx`, `src/pages/roaming/OCPICommandsPage.tsx`, `src/pages/roaming/OCPICDRsPage.tsx`, `../ocpi-gateway/src/modules/ocpi/ocpi.service.ts`, `../ocpi-gateway/src/modules/commands/commands.service.ts`, `../ocpi-gateway/docs/internal-ocpi-contracts.md` | This is no longer mock-only. EVzone has a real OCPI gateway, but it is still backend-dependent, limited to `2.2.1` and `2.1.1`, and not yet proven as a fully hardened roaming platform. |
| APIs, webhooks, integrations, notifications, reporting | Extensibility, eventing, ERP/CRM/payment integrations, analytics | Partial | `src/pages/integrations/IntegrationsPage.tsx`, `src/pages/webhooks/WebhooksPage.tsx`, `src/pages/notifications/NotificationsPage.tsx`, `src/pages/reports/ReportsPage.tsx`, `../ocpp-gateway/README.md`, `../ocpi-gateway/docs/kafka-contracts.md` | EVzone has a strong admin surface and real event-oriented backend ideas, but I still did not find a clearly finished public developer ecosystem. |
| Security and compliance | RBAC, MFA/2FA, logging, SSO, enterprise IAM, protocol conformance | Partial | `src/core/auth/access.ts`, `src/pages/audit/AuditLogsPage.tsx`, `../ocpp-gateway/apps/gateway/src/ocpp/charger-identity.service.ts`, `../ocpp-gateway/apps/gateway/src/ocpp/pki.service.ts` | Protocol-side security is materially stronger than the earlier review suggested. Enterprise IAM remains the gap: I did not find clear SSO or IdP integration evidence. |
| Driver and fleet experience | Driver portal/app, route planning, loyalty, reimbursement, scheduling | Missing | Repo search found no clear implementation for driver apps, route planning, reimbursement, loyalty, or fleet scheduling flows | EVzone remains operator-centric rather than fleet-driver centric. |
| Reservations / booking | Reserve chargers ahead of arrival, reservation lifecycle, no-show handling | Partial | `src/pages/roaming/OCPICommandsPage.tsx`, `../ocpi-gateway/src/modules/commands/commands.service.ts` | EVzone now has reservation-related protocol support on the OCPI side, but I still did not find an end-to-end reservation product flow or matching OCPP command depth. |
| Plug & Charge / AutoCharge | ISO 15118 certificate-based auth, frictionless identification | Partial | `src/core/types/domain.ts`, `../ocpp-gateway/apps/gateway/src/ocpp/pki.service.ts`, `../ocpp-gateway/apps/gateway/src/ocpp/versions/ocpp16.adapter.ts`, `../ocpp-gateway/apps/gateway/src/ocpp/versions/ocpp201.adapter.ts` | This moved from `Missing` to `Partial`. EVzone has real certificate and PKI groundwork, but not yet a full end-to-end Plug & Charge product layer. |
| DER, BESS, solar, demand response | Energy orchestration beyond charger-level balancing | Missing | Repo search found no clear implementation for `OpenADR`, `BESS`, `solar`, `DER`, or utility demand-response integrations | EVzone has smart charging and some OCPP 2.1 groundwork, but not yet broader site-energy orchestration. |
| Battery swap operations | Swap inventory, pack lifecycle, rebalancing, retirement workflows | Strong | `src/pages/swapping/SwapStationsPage.tsx`, `src/pages/swapping/SwapStationDetailPage.tsx`, `src/pages/swapping/BatteryInventoryPage.tsx`, `src/core/hooks/useSwapping.ts`, `src/mocks/handlers.ts` | This remains a standout EVzone strength and still differentiates it from many generic CPO platforms. |

## Fit-For-Purpose Assessment

### OCPP gateway verdict: mostly yes

For its intended purpose as a charger-facing CSMS gateway, `ocpp-gateway` is already fit for a serious production first phase.

Why it fits:

- live deployment and reachable endpoint
- multi-version OCPP support
- strong startup validation and environment hardening
- TLS and mTLS support
- charger identity controls and certificate handling
- Redis-backed multi-node session ownership
- Kafka-based event and command routing
- health and metrics endpoints
- contract self-tests and cross-repo contract checks that currently pass

What still keeps it from "fully mature best-in-class":

- lint debt that should be cleaned up before treating the codebase as fully hardened
- limited outbound command catalog relative to broader OCPP 2.x expectations
- partial or simplified device-model and advanced smart-charging behavior
- no evidence in this review of certification, soak testing, or broad interoperability test results

### OCPI gateway verdict: useful, but only partially fit

For its intended purpose as an EVzone roaming gateway, `ocpi-gateway` is directionally correct and already useful, but not yet complete enough to be treated as a fully mature roaming backbone.

Why it fits in part:

- real versions and credentials flows
- real guarded OCPI endpoints
- idempotency and partner-context handling
- real backend integration contracts
- commands, charging profiles, and hub client info scaffolding

What currently limits it:

- it is backend-dependent by design, so much of the true roaming logic still lives elsewhere
- the repo itself documents additional backend contracts as still required for full scope
- support stops at OCPI `2.2.1` and `2.1.1`, with no `2.3.0` evidence yet
- health reporting is static rather than dependency-aware
- linting is not operational because config is missing
- I did not find a test suite or stronger verification path in this review
- Kafka is present architecturally, but not clearly exercised throughout functional flows

## What EVzone already does unusually well

EVzone is not just another generic charging dashboard. It now has several advanced characteristics:

- Strong tenant-aware platform design with scoped data access and role-specific workspaces.
- Good operator UX coverage across stations, charge points, incidents, reports, notifications, integrations, and finance.
- A real OCPP gateway with multi-version support, live deployment evidence, and meaningful security and operational controls.
- A partial but real OCPI gateway rather than only simulated roaming UI.
- A meaningful swap-station operating model including pack inventory, lifecycle transitions, inspection, retirement decisions, and rebalancing dispatch.
- Hybrid site thinking: charging and swapping can coexist in the same site model.

That last point still matters. Battery swap support is uncommon in generic CPO software, and EVzone remains unusually well-positioned there.

## Highest-priority gaps

If the goal is to compete with serious modern CPO platforms, these are the biggest gaps to close next:

### 1. Finish protocol depth rather than start protocol work from zero

This is the biggest change from the earlier review. EVzone already has a strong OCPP gateway and a partial OCPI gateway. The next step is to finish depth, conformance, and operational hardening.

Target outcome:

- broader OCPP 2.0.1 and 2.1 command and device-model coverage
- production-grade OCPI partner operations and monitoring
- OCPI `2.3.0` support where strategically needed
- stronger protocol conformance, regression, and interoperability testing

### 2. Add real charging commerce

Modern CPO platforms increasingly support payment gateways, payment terminals, direct payment, and more flexible commercial models. EVzone has tariffs, billing, payouts, and settlement, but not yet the consumer-facing payment layer.

Target outcome:

- payment gateway integrations
- ad-hoc or direct payment workflows
- receipt and tax handling
- terminal support where needed

### 3. Complete Plug & Charge and advanced auth orchestration

This is no longer a pure zero-to-one gap because EVzone has protocol-side certificate handling. The missing piece is the productized end-to-end experience.

Target outcome:

- ISO 15118 contract certificate lifecycle
- Plug & Charge enablement per charger and site
- AutoCharge or equivalent fallback strategies where relevant
- unified auth orchestration across RFID, app, QR, roaming, terminal, and certificate-based flows

### 4. Expand energy from charger balancing to site and grid orchestration

The smart charging surface is promising, but advanced CPO platforms now connect chargers with utility tariffs, demand response, BESS, renewables, and site constraints.

Target outcome:

- DER, BESS, and solar visibility
- utility-tariff aware optimization
- demand-response hooks
- site-level energy policy enforcement

### 5. Add fleet and reservation workflows

The repo is strong for operators, but still thin for fleets and drivers.

Target outcome:

- reservation and booking lifecycle
- fleet scheduling and prioritization
- reimbursement or managed charging accounts
- driver-facing APIs or app surfaces

### 6. Harden enterprise security and ecosystem openness

Enterprise buyers increasingly expect SSO, stronger IAM, real-time event APIs, and audit-grade integration surfaces.

Target outcome:

- SSO and IdP integration
- stronger 2FA and security policy controls
- public API and developer portal
- more operational webhook management and event subscriptions

## Suggested roadmap priority

If the goal is the shortest path from "strong EV operations platform" to "credible modern CPO platform", I would prioritize work in this order:

1. Finish OCPP and OCPI production depth, conformance, and observability
2. Add real payments and direct charging commerce
3. Productize Plug & Charge and modern auth orchestration
4. Expand energy orchestration beyond load balancing
5. Add fleet, booking, and driver-facing workflows
6. Deepen enterprise security and developer ecosystem capabilities

## Bottom line

EVzone is now ahead of where the earlier frontend-only assessment placed it.

The platform already has a real OCPP gateway and a partial OCPI gateway, which means the protocol foundation is materially more credible than "mock bench" language suggested. The main gap is no longer protocol existence. The main gap is protocol completeness, roaming depth, payment commerce, advanced auth productization, and broader energy orchestration.

If those layers are finished well, EVzone can move from "strong operator platform with standout swapping support" to "serious next-generation CPO platform."

## Official benchmark sources used

- AMPECO, EV Charging Solutions: https://www.ampeco.com/ev-charging-solutions/
- Driivz, Interoperability and Extensibility: https://driivz.com/platform/interoperability-and-extensibility/
- Open Charge Alliance, OCPP info / FAQ: https://openchargealliance.org/ocpp-info-whitepapers-papers-faq/
- Open Charge Alliance, Certification Profiles: https://openchargealliance.org/certification-profiles/
- EVRoaming Foundation, OCPI 2.3.0: https://evroaming.org/wp-content/uploads/2025/02/OCPI-2.3.0.pdf
- EVRoaming Foundation, EVRoaming Test Tool: https://evroaming.org/evroaming-test-tool/
- CharIN, Implementation Guide to Plug and Charge v1.2: https://www.charin.global/media/pages/technology/plug-charge/cd956082cc-1659354078/charin_implementation_guide_to_plug_and_charge_v1_2.pdf
