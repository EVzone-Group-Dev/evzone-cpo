# Swap Stations Research & Analysis Report
Date: March 29, 2026

## 1) Executive Summary
Battery swapping is no longer a niche format. It has proven scale in two-wheelers (Taiwan), strong momentum in China heavy freight, and accelerating pilots for urban car/fleet operations in Europe and Japan.

For EVzone, the strongest near-term opportunity is to treat swap as an operations-intensive energy business (not only a station listing feature): inventory balancing, battery lifecycle risk, and turnaround/SLA performance should be first-class product primitives.

## 2) What The Market Shows Right Now

### 2.1 Proven scale patterns by segment
- Passenger cars (China, NIO): As of June 30, 2025, NIO reported 3,445 swap stations globally and over 78 million cumulative swaps; Station 4.0 is rated up to 480 automated swaps/day. This is evidence of real throughput viability at scale.
- Two-wheelers (Taiwan, Gogoro): As of December 31, 2024, Gogoro reported over 640k subscribers in Taiwan, over 2.6k battery swapping locations, over 12,600 GoStation racks, and over 671 million cumulative swaps.
- Commercial fleets (emerging multi-market): Ample announced production-style deployments in 2025: Madrid rollout (first 40 Fiat 500e, scaling to 100) and Tokyo launch (150 commercial vehicles + 14 swap stations).
- Heavy-duty freight (China): ICCT reports swap-capable vehicle sales exceeded 25,400 in H1 2025 (+134% YoY), with heavy swap-capable truck share hovering around ~30% after rapid growth.

### 2.2 Policy and standards direction
- Kenya: National e-Mobility Policy launched February 3, 2026; government cites 39,324 cumulative EVs by 2025, with fiscal support in Finance Bill 2025 (VAT/excise relief for key EV categories and Li-ion batteries).
- India: Ministry of Power signaled operational guidelines for swapping/charging stations in 2024, and parliamentary/government disclosures reference issued guidelines on January 10, 2025.
- India standards stack: NITI e-Amrit states battery-swapping standards are under development by BIS for form factor, interoperability, communications, and network management.
- China standardization pressure: CATL and NIO announced partnership (March 18, 2025) to expand network scale and push standardization/adoption.

## 3) Operating Model Insights (What Matters Most)

### 3.1 Core economics and constraints
- Swapping removes dwell-time bottlenecks but shifts the challenge to battery inventory CAPEX, pack health variance, and station utilization.
- ICCT Tianjin drayage case: swap-capable battery-electric trucks had ~10% lower 5-year TCO than diesel, but swap infrastructure payback (5.8 years) was slower than charging infrastructure (4.8 years). This shows swapping can win in vehicle economics while still requiring disciplined infra utilization.
- World Bank analysis highlights recurring pain points: high capital intensity, infrastructure complexity, and standardization/interoperability friction.

### 3.2 Where swapping wins fastest
- High-utilization fleets with tight turnaround requirements.
- Segments with detachable/smaller batteries (2W/3W), or duty cycles where charging dwell directly hurts revenue.
- Dense routes where station utilization can stay high and battery inventory can be pooled.

### 3.3 Where swapping struggles
- Fragmented battery formats and weak interoperability.
- Low-throughput locations (poor payback dynamics).
- Incomplete telemetry/governance around pack health and asset ownership.

## 4) EVzone Current Product Position (Codebase Snapshot)
Your swap stack already has a solid UI base:
- Fleet list and detail experiences for swap stations and cabinets.
- Swap sessions and battery inventory pages.
- Useful operational fields (SoC/SoH labels, cycle count, cabinet status, recent swaps, turnaround labels).

Current gap is mostly analytical and operational depth, not UI existence:
- No forecasting/rebalancing recommendations for pack allocation.
- No explicit battery lifecycle controls (degradation policy, retirement thresholding, warranty trail).
- No financial performance lens per station/cabinet/pack (revenue vs idle inventory, yield per pack/day).
- No SLA control plane for swap latency, queue risk, and failed swap root-cause trend.
- No public API or workflow for station provisioning / commissioning in swap domain.

## 5) Strategic Recommendations For EVzone

### 5.1 Product strategy
Prioritize EVzone as a "swap operations control tower" over "swap monitoring dashboard."

### 5.2 90-day roadmap
- Phase 1 (0-30 days):
  - Add swap operational KPIs: swap success rate, median/p95 turnaround, ready-pack runway (hours), pack-utilization ratio, failed-swap reasons.
  - Add alert rules: ready-pack floor breach, cabinet heartbeat gaps, repeat failed inspection, station imbalance.
- Phase 2 (31-60 days):
  - Add battery lifecycle module: pack state machine (Ready/Charging/Reserved/Installed/Quarantined/Retired), cycle and SoH guardrails, quarantine workflows.
  - Add tenant-level swap economics dashboard: revenue/pack/day, swaps/station/day, idle inventory cost proxy.
- Phase 3 (61-90 days):
  - Add balancing recommendations: move packs from low-utilization to high-deficit stations, with confidence scoring.
  - Add fleet SLA board for enterprise operators (top at-risk stations, ETA to depletion, dispatch recommendations).

### 5.3 Data model upgrades to unlock this
- `pack_events`: insert/remove/swap/charge_start/charge_end/inspection/result.
- `swap_attempts`: start_ts, end_ts, duration, failure_code, operator/system source.
- `station_capacity_profile`: slot_count, power envelope, charge throughput, queue depth.
- `pack_lifecycle`: commissioning date, owner, warranty state, degradation curve, retirement flag.

## 6) Key Risks To Watch
- Standardization risk: connector/pack mismatch blocks multi-OEM scaling.
- CAPEX risk: excess battery inventory without sufficient swap throughput.
- Safety/reputation risk: weak inspection controls on returned packs.
- Policy risk: subsidy/tariff assumptions changing across markets.

## 7) Decision Guidance For EVzone Leadership
If EVzone is prioritizing swap stations, the highest-value decision is to build for high-frequency operational optimization (turnaround + inventory + lifecycle + SLA) before adding broad marketplace features.

This approach aligns with what scaled operators demonstrate today: throughput discipline, interoperability strategy, and battery asset intelligence are the differentiators.

## Sources
- NIO Form 424B5 (filed Sep 10, 2025): https://ir.nio.com/static-files/6c361916-7d19-4e20-be50-774465c6d519
- Gogoro Form 20-F (FY2024): https://www.sec.gov/Archives/edgar/data/1886190/000188619025000017/ggr-20241231.htm
- CATL + NIO partnership (Mar 18, 2025): https://www.catl.com/en/news/6381.html
- ICCT Market Spotlight (China ZE-MHDV H1 2025): https://theicct.org/wp-content/uploads/2025/09/ID-463-%E2%80%93-China-ZE-MHDVs-H1-2025_market-spotlight_final-1.pdf
- ICCT Tianjin drayage case (Jan 21, 2025): https://theicct.org/publication/drayage-trucks-tianjin-china-jan25/
- Ample Madrid rollout (Jun 12, 2025): https://ample.com/2025/06/12/madrid-gets-moving-citywide-battery-swapping-arrives-with-free2move-fiat-and-stellantis/
- Ample Tokyo launch (Jun 6, 2025): https://ample.com/2025/06/06/ev-battery-swapping-arrives-in-tokyo-ample-mitsubishi-fuso-mitsubishi-motors-and-yamato-launch-citywide-commercial-network/
- Ample + Repsol Madrid gas-station integration (Sep 10, 2025): https://ample.com/2025/09/10/fill-up-or-swap-out-ample-and-repsol-team-up-to-bring-ev-battery-swapping-to-gas-station-sites-in-madrid/
- Kenya Ministry of Roads and Transport policy launch (Feb 3, 2026): https://www.transport.go.ke/kenya-launches-national-electric-mobility-policy-drive-cleaner-efficient-and-sustainable-transport
- India Ministry of Power draft note on swapping/charging station guidelines (Oct 4, 2024): https://powermin.gov.in/sites/default/files/webform/notices/OM%20on%20draft%20Guidelines_for_Installation_and_Operation_of_Battery_Swapping_and_Charging_Stations.pdf
- India government reference to Jan 10, 2025 guidelines: https://powermin.gov.in/sites/default/files/uploads/LS06.02.2025_Eng.pdf
- NITI e-Amrit BIS standards page (battery swapping standards in development): https://e-amrit.niti.gov.in/bis-standard
- World Bank (Electric Mobility & Power Systems): https://documents1.worldbank.org/curated/en/099050123125542493/pdf/P1746590c032c506708d4905fad210b582c.pdf
