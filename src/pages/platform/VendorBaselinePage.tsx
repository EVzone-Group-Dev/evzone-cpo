import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useStations } from "@/core/hooks/useStations";
import {
  useApplyVendorLoyaltyTransaction,
  useCreateVendorTerminalCheckoutIntent,
  useEnrollVendorAutocharge,
  useIngestVendorOpenAdrEvent,
  useRegisterVendorPaymentTerminal,
  useReconcileVendorTerminalCheckoutIntent,
  useUpdateVendorRoamingProtocols,
  useUpsertVendorOpenAdrSettings,
  useUpsertVendorV2xProfile,
  useVendorBaselineOverview,
  useVendorDriverWorkflow,
  useVendorSmartQueue,
} from "@/core/hooks/useVendorBaseline";
import type { VendorBaselineRoamingProtocolsInput } from "@/core/types/vendorBaseline";

const ALLOWED_PROTOCOLS = ["OCPI", "OCHP", "OICP", "EMIP"] as const;

function toIsoDateTime(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Invalid datetime value");
  }
  return parsed.toISOString();
}

function parseProtocols(value: string): VendorBaselineRoamingProtocolsInput["protocols"] {
  const items = value
    .split(",")
    .map((entry) => entry.trim().toUpperCase())
    .filter((entry) => entry.length > 0);

  const valid = items.filter((entry): entry is VendorBaselineRoamingProtocolsInput["protocols"][number] =>
    (ALLOWED_PROTOCOLS as readonly string[]).includes(entry),
  );

  return Array.from(new Set(valid));
}

function parseReaderIds(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0),
    ),
  );
}

export function VendorBaselinePage() {
  const overviewQuery = useVendorBaselineOverview();
  const smartQueueQuery = useVendorSmartQueue({ limit: 15 });
  const stationsQuery = useStations();

  const [feedback, setFeedback] = useState<string | null>(null);

  const [openAdrDraft, setOpenAdrDraft] = useState({
    enabled: true,
    venId: "",
    programName: "",
    marketContext: "",
    responseMode: "",
    defaultDurationMinutes: "60",
    signalName: "SIMPLE",
    signalType: "level",
    priority: "0",
  });

  const [openAdrEventDraft, setOpenAdrEventDraft] = useState({
    stationId: "",
    startsAt: "",
    endsAt: "",
    signalValueKw: "15",
    reason: "",
  });

  const [roamingDraft, setRoamingDraft] = useState({
    partnerId: "",
    protocolsCsv: "OCPI,OCHP,OICP,eMIP",
    transport: "HTTPS",
  });

  const [v2xDraft, setV2xDraft] = useState({
    stationId: "",
    enabled: true,
    mode: "V2G" as "V2G" | "V2X",
    maxDischargeKw: "20",
    minSocPercent: "20",
    provider: "",
    notes: "",
  });

  const [autochargeDraft, setAutochargeDraft] = useState({
    driverId: "",
    tokenUid: "",
    vehicleVin: "",
    chargePointId: "",
  });

  const [terminalDraft, setTerminalDraft] = useState({
    terminalId: "",
    locationName: "",
    model: "",
    provider: "",
    cardReaderIds: "",
  });

  const [checkoutDraft, setCheckoutDraft] = useState({
    terminalId: "",
    cardReaderId: "",
    amount: "10000",
    idempotencyKey: "",
  });

  const [reconcileDraft, setReconcileDraft] = useState({
    intentId: "",
    status: "SETTLED" as
      | "PENDING"
      | "AUTHORIZED"
      | "SETTLED"
      | "FAILED"
      | "CANCELED"
      | "EXPIRED",
  });

  const [loyaltyDraft, setLoyaltyDraft] = useState({
    driverId: "",
    points: "50",
    reason: "Driver-app charging bonus",
  });

  const [driverWorkflowId, setDriverWorkflowId] = useState("");

  const openAdrMutation = useUpsertVendorOpenAdrSettings();
  const openAdrEventMutation = useIngestVendorOpenAdrEvent();
  const roamingMutation = useUpdateVendorRoamingProtocols();
  const v2xMutation = useUpsertVendorV2xProfile();
  const autochargeMutation = useEnrollVendorAutocharge();
  const terminalMutation = useRegisterVendorPaymentTerminal();
  const checkoutMutation = useCreateVendorTerminalCheckoutIntent();
  const reconcileMutation = useReconcileVendorTerminalCheckoutIntent();
  const loyaltyMutation = useApplyVendorLoyaltyTransaction();

  const driverWorkflowQuery = useVendorDriverWorkflow(
    driverWorkflowId.trim() ? driverWorkflowId.trim() : undefined,
    { includeHistory: true },
  );

  const stationOptions = stationsQuery.data || [];

  const metricRows = useMemo(() => {
    const metrics = overviewQuery.data?.metrics;
    if (!metrics) {
      return [];
    }

    return [
      { label: "OpenADR", value: metrics.openAdrEnabled ? "Enabled" : "Disabled" },
      { label: "Roaming Protocols", value: metrics.roamingProtocols.join(", ") || "None" },
      { label: "V2X Ready Sites", value: metrics.v2xReadyCount.toString() },
      { label: "Autocharge", value: metrics.autochargeCount.toString() },
      { label: "SmartQueue", value: metrics.smartQueueCount.toString() },
      { label: "Terminal Intents", value: metrics.terminalIntentCount.toString() },
      { label: "Loyalty Drivers", value: metrics.loyaltyDriverCount.toString() },
      { label: "Driver Ready", value: metrics.driverWorkflowReadyCount.toString() },
    ];
  }, [overviewQuery.data]);

  const handleAction = async (runner: () => Promise<unknown>, success: string) => {
    try {
      await runner();
      setFeedback(success);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Request failed");
    }
  };

  if (overviewQuery.isLoading) {
    return (
      <DashboardLayout pageTitle="Vendor Baseline">
        <div className="p-8 text-center text-subtle">Loading vendor baseline features...</div>
      </DashboardLayout>
    );
  }

  if (overviewQuery.error || !overviewQuery.data) {
    return (
      <DashboardLayout pageTitle="Vendor Baseline">
        <div className="p-8 text-center text-danger">Unable to load vendor baseline features.</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout pageTitle="Vendor Baseline">
      {feedback && (
        <div className="card mb-4">
          <div className="text-sm">{feedback}</div>
        </div>
      )}

      <div className="card mb-6">
        <div className="section-title">Baseline Coverage</div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {metricRows.map((metric) => (
            <div key={metric.label} className="rounded-lg border border-border/70 bg-bg-muted/35 px-3 py-2">
              <div className="text-[11px] text-subtle">{metric.label}</div>
              <div className="text-sm font-semibold mt-1">{metric.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <div className="card space-y-3">
          <div className="section-title">OpenADR Settings</div>
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={openAdrDraft.enabled}
              onChange={(event) => setOpenAdrDraft((current) => ({ ...current, enabled: event.target.checked }))}
            />
            Enabled
          </label>
          <input className="input" placeholder="VEN ID" value={openAdrDraft.venId} onChange={(event) => setOpenAdrDraft((current) => ({ ...current, venId: event.target.value }))} />
          <input className="input" placeholder="Program name" value={openAdrDraft.programName} onChange={(event) => setOpenAdrDraft((current) => ({ ...current, programName: event.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <input className="input" placeholder="Signal name" value={openAdrDraft.signalName} onChange={(event) => setOpenAdrDraft((current) => ({ ...current, signalName: event.target.value }))} />
            <input className="input" placeholder="Signal type" value={openAdrDraft.signalType} onChange={(event) => setOpenAdrDraft((current) => ({ ...current, signalType: event.target.value }))} />
          </div>
          <button
            className="btn primary"
            disabled={openAdrMutation.isPending}
            onClick={() =>
              handleAction(
                () =>
                  openAdrMutation.mutateAsync({
                    enabled: openAdrDraft.enabled,
                    venId: openAdrDraft.venId,
                    programName: openAdrDraft.programName,
                    marketContext: openAdrDraft.marketContext,
                    responseMode: openAdrDraft.responseMode,
                    defaultDurationMinutes: Number(openAdrDraft.defaultDurationMinutes),
                    signalName: openAdrDraft.signalName,
                    signalType: openAdrDraft.signalType,
                    priority: Number(openAdrDraft.priority),
                  }),
                "OpenADR settings saved.",
              )
            }
          >
            {openAdrMutation.isPending ? "Saving..." : "Save OpenADR"}
          </button>
        </div>

        <div className="card space-y-3">
          <div className="section-title">OpenADR Event</div>
          <select className="input" value={openAdrEventDraft.stationId} onChange={(event) => setOpenAdrEventDraft((current) => ({ ...current, stationId: event.target.value }))}>
            <option value="">Select station</option>
            {stationOptions.map((station) => (
              <option key={station.id} value={station.id}>{station.name}</option>
            ))}
          </select>
          <input type="datetime-local" className="input" value={openAdrEventDraft.startsAt} onChange={(event) => setOpenAdrEventDraft((current) => ({ ...current, startsAt: event.target.value }))} />
          <input type="datetime-local" className="input" value={openAdrEventDraft.endsAt} onChange={(event) => setOpenAdrEventDraft((current) => ({ ...current, endsAt: event.target.value }))} />
          <input className="input" placeholder="Signal kW" value={openAdrEventDraft.signalValueKw} onChange={(event) => setOpenAdrEventDraft((current) => ({ ...current, signalValueKw: event.target.value }))} />
          <button
            className="btn primary"
            disabled={openAdrEventMutation.isPending}
            onClick={() =>
              handleAction(
                () =>
                  openAdrEventMutation.mutateAsync({
                    stationId: openAdrEventDraft.stationId,
                    startsAt: toIsoDateTime(openAdrEventDraft.startsAt),
                    endsAt: toIsoDateTime(openAdrEventDraft.endsAt),
                    signalValueKw: Number(openAdrEventDraft.signalValueKw),
                    reason: openAdrEventDraft.reason,
                  }),
                "OpenADR event queued.",
              )
            }
          >
            {openAdrEventMutation.isPending ? "Queueing..." : "Queue Event"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <div className="card space-y-3">
          <div className="section-title">Roaming Protocols (OCHP/OICP/eMIP)</div>
          <input className="input" placeholder="Partner ID" value={roamingDraft.partnerId} onChange={(event) => setRoamingDraft((current) => ({ ...current, partnerId: event.target.value }))} />
          <input className="input" placeholder="Protocols: OCPI,OCHP,OICP,EMIP" value={roamingDraft.protocolsCsv} onChange={(event) => setRoamingDraft((current) => ({ ...current, protocolsCsv: event.target.value }))} />
          <button
            className="btn primary"
            disabled={roamingMutation.isPending}
            onClick={() =>
              handleAction(
                () =>
                  roamingMutation.mutateAsync({
                    partnerId: roamingDraft.partnerId,
                    input: {
                      protocols: parseProtocols(roamingDraft.protocolsCsv),
                      transport: roamingDraft.transport,
                    },
                  }),
                "Roaming partner protocol stack updated.",
              )
            }
          >
            {roamingMutation.isPending ? "Updating..." : "Update Partner Protocols"}
          </button>
        </div>

        <div className="card space-y-3">
          <div className="section-title">V2G / V2X Profile</div>
          <select className="input" value={v2xDraft.stationId} onChange={(event) => setV2xDraft((current) => ({ ...current, stationId: event.target.value }))}>
            <option value="">Select station</option>
            {stationOptions.map((station) => (
              <option key={station.id} value={station.id}>{station.name}</option>
            ))}
          </select>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={v2xDraft.enabled} onChange={(event) => setV2xDraft((current) => ({ ...current, enabled: event.target.checked }))} />
            Enabled
          </label>
          <select className="input" value={v2xDraft.mode} onChange={(event) => setV2xDraft((current) => ({ ...current, mode: event.target.value as "V2G" | "V2X" }))}>
            <option value="V2G">V2G</option>
            <option value="V2X">V2X</option>
          </select>
          <button
            className="btn primary"
            disabled={v2xMutation.isPending}
            onClick={() =>
              handleAction(
                () =>
                  v2xMutation.mutateAsync({
                    stationId: v2xDraft.stationId,
                    input: {
                      enabled: v2xDraft.enabled,
                      mode: v2xDraft.mode,
                      maxDischargeKw: Number(v2xDraft.maxDischargeKw),
                      minSocPercent: Number(v2xDraft.minSocPercent),
                      provider: v2xDraft.provider,
                      notes: v2xDraft.notes,
                    },
                  }),
                "V2X profile updated.",
              )
            }
          >
            {v2xMutation.isPending ? "Saving..." : "Save V2X"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <div className="card space-y-3">
          <div className="section-title">Autocharge Enrollment</div>
          <input className="input" placeholder="Driver ID" value={autochargeDraft.driverId} onChange={(event) => setAutochargeDraft((current) => ({ ...current, driverId: event.target.value }))} />
          <input className="input" placeholder="Token UID" value={autochargeDraft.tokenUid} onChange={(event) => setAutochargeDraft((current) => ({ ...current, tokenUid: event.target.value }))} />
          <button
            className="btn primary"
            disabled={autochargeMutation.isPending}
            onClick={() =>
              handleAction(
                () =>
                  autochargeMutation.mutateAsync({
                    driverId: autochargeDraft.driverId,
                    tokenUid: autochargeDraft.tokenUid,
                    vehicleVin: autochargeDraft.vehicleVin || undefined,
                    chargePointId: autochargeDraft.chargePointId || undefined,
                  }),
                "Autocharge token enrolled.",
              )
            }
          >
            {autochargeMutation.isPending ? "Enrolling..." : "Enroll Autocharge"}
          </button>
        </div>

        <div className="card space-y-3">
          <div className="section-title">SmartQueue</div>
          {smartQueueQuery.isLoading && <div className="text-sm text-subtle">Loading queue...</div>}
          {!smartQueueQuery.isLoading && (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Booking</th>
                    <th>Station</th>
                    <th>Start</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {smartQueueQuery.data?.items.map((item) => (
                    <tr key={item.bookingId}>
                      <td className="font-mono text-xs">{item.bookingId.slice(0, 8)}</td>
                      <td>{item.stationName}</td>
                      <td>{new Date(item.startTime).toLocaleString()}</td>
                      <td>{item.score}</td>
                    </tr>
                  ))}
                  {(smartQueueQuery.data?.items.length || 0) === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center text-subtle py-8">No queue entries found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <div className="card space-y-3">
          <div className="section-title">Payment Terminal Registration</div>
          <input className="input" placeholder="Terminal ID" value={terminalDraft.terminalId} onChange={(event) => setTerminalDraft((current) => ({ ...current, terminalId: event.target.value }))} />
          <input className="input" placeholder="Location" value={terminalDraft.locationName} onChange={(event) => setTerminalDraft((current) => ({ ...current, locationName: event.target.value }))} />
          <input className="input" placeholder="Card reader IDs (comma separated)" value={terminalDraft.cardReaderIds} onChange={(event) => setTerminalDraft((current) => ({ ...current, cardReaderIds: event.target.value }))} />
          <button
            className="btn primary"
            disabled={terminalMutation.isPending}
            onClick={() =>
              handleAction(
                () =>
                  terminalMutation.mutateAsync({
                    terminalId: terminalDraft.terminalId,
                    locationName: terminalDraft.locationName,
                    model: terminalDraft.model,
                    provider: terminalDraft.provider,
                    cardReaderIds: parseReaderIds(terminalDraft.cardReaderIds),
                  }),
                "Payment terminal registered.",
              )
            }
          >
            {terminalMutation.isPending ? "Registering..." : "Register Terminal"}
          </button>
        </div>

        <div className="card space-y-3">
          <div className="section-title">Card Reader Checkout</div>
          <input className="input" placeholder="Terminal ID" value={checkoutDraft.terminalId} onChange={(event) => setCheckoutDraft((current) => ({ ...current, terminalId: event.target.value }))} />
          <input className="input" placeholder="Amount" value={checkoutDraft.amount} onChange={(event) => setCheckoutDraft((current) => ({ ...current, amount: event.target.value }))} />
          <input className="input" placeholder="Idempotency key" value={checkoutDraft.idempotencyKey} onChange={(event) => setCheckoutDraft((current) => ({ ...current, idempotencyKey: event.target.value }))} />
          <button
            className="btn primary"
            disabled={checkoutMutation.isPending}
            onClick={() =>
              handleAction(
                () =>
                  checkoutMutation.mutateAsync({
                    terminalId: checkoutDraft.terminalId,
                    amount: Number(checkoutDraft.amount),
                    idempotencyKey: checkoutDraft.idempotencyKey,
                    cardReaderId: checkoutDraft.cardReaderId || undefined,
                  }),
                "Terminal checkout intent created.",
              )
            }
          >
            {checkoutMutation.isPending ? "Creating..." : "Create Checkout Intent"}
          </button>

          <div className="pt-2 border-t border-border/70">
            <div className="text-xs text-subtle mb-2">Reconcile Intent</div>
            <input className="input mb-2" placeholder="Intent ID" value={reconcileDraft.intentId} onChange={(event) => setReconcileDraft((current) => ({ ...current, intentId: event.target.value }))} />
            <select className="input mb-2" value={reconcileDraft.status} onChange={(event) => setReconcileDraft((current) => ({ ...current, status: event.target.value as typeof reconcileDraft.status }))}>
              <option value="PENDING">PENDING</option>
              <option value="AUTHORIZED">AUTHORIZED</option>
              <option value="SETTLED">SETTLED</option>
              <option value="FAILED">FAILED</option>
              <option value="CANCELED">CANCELED</option>
              <option value="EXPIRED">EXPIRED</option>
            </select>
            <button
              className="btn secondary"
              disabled={reconcileMutation.isPending}
              onClick={() =>
                handleAction(
                  () =>
                    reconcileMutation.mutateAsync({
                      intentId: reconcileDraft.intentId,
                      input: {
                        status: reconcileDraft.status,
                        markSettled: reconcileDraft.status === "SETTLED",
                      },
                    }),
                  "Terminal intent reconciled.",
                )
              }
            >
              {reconcileMutation.isPending ? "Reconciling..." : "Reconcile"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <div className="card space-y-3">
          <div className="section-title">Loyalty Adjustment</div>
          <input className="input" placeholder="Driver ID" value={loyaltyDraft.driverId} onChange={(event) => setLoyaltyDraft((current) => ({ ...current, driverId: event.target.value }))} />
          <input className="input" placeholder="Points (+/-)" value={loyaltyDraft.points} onChange={(event) => setLoyaltyDraft((current) => ({ ...current, points: event.target.value }))} />
          <input className="input" placeholder="Reason" value={loyaltyDraft.reason} onChange={(event) => setLoyaltyDraft((current) => ({ ...current, reason: event.target.value }))} />
          <button
            className="btn primary"
            disabled={loyaltyMutation.isPending}
            onClick={() =>
              handleAction(
                () =>
                  loyaltyMutation.mutateAsync({
                    driverId: loyaltyDraft.driverId,
                    points: Number(loyaltyDraft.points),
                    reason: loyaltyDraft.reason,
                  }),
                "Loyalty transaction applied.",
              )
            }
          >
            {loyaltyMutation.isPending ? "Applying..." : "Apply Loyalty"}
          </button>
        </div>

        <div className="card space-y-3">
          <div className="section-title">Driver-App Workflow</div>
          <input className="input" placeholder="Driver ID" value={driverWorkflowId} onChange={(event) => setDriverWorkflowId(event.target.value)} />

          {driverWorkflowId.trim().length === 0 && (
            <div className="text-sm text-subtle">Enter a driver ID to inspect workflow readiness.</div>
          )}

          {driverWorkflowQuery.isLoading && driverWorkflowId.trim().length > 0 && (
            <div className="text-sm text-subtle">Loading driver workflow...</div>
          )}

          {driverWorkflowQuery.data && (
            <div className="space-y-2 text-sm">
              <div className="rounded-lg border border-border/70 bg-bg-muted/35 px-3 py-2">
                <div className="text-xs text-subtle">Driver</div>
                <div className="font-semibold">{String((driverWorkflowQuery.data.driver as { displayName?: string })?.displayName || "Unknown")}</div>
              </div>
              <div className="rounded-lg border border-border/70 bg-bg-muted/35 px-3 py-2">
                <div className="text-xs text-subtle">Workflow Steps</div>
                <div className="font-semibold">
                  {Array.isArray((driverWorkflowQuery.data.readiness as { steps?: Array<{ complete?: boolean }> })?.steps)
                    ? ((driverWorkflowQuery.data.readiness as { steps: Array<{ complete?: boolean }> }).steps.filter((step) => step.complete).length)
                    : 0}
                  /
                  {Array.isArray((driverWorkflowQuery.data.readiness as { steps?: Array<{ complete?: boolean }> })?.steps)
                    ? ((driverWorkflowQuery.data.readiness as { steps: Array<{ complete?: boolean }> }).steps.length)
                    : 0}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
