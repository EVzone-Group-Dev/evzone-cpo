export interface VendorBaselineOverviewResponse {
  tenantId: string;
  generatedAt: string;
  metrics: {
    openAdrEnabled: boolean;
    roamingProtocols: string[];
    v2xReadyCount: number;
    autochargeCount: number;
    smartQueueCount: number;
    terminalIntentCount: number;
    loyaltyDriverCount: number;
    driverWorkflowReadyCount: number;
  };
}

export interface VendorBaselineOpenAdrSettingsInput {
  enabled: boolean;
  venId?: string;
  programName?: string;
  marketContext?: string;
  responseMode?: string;
  defaultDurationMinutes?: number;
  signalName?: string;
  signalType?: string;
  priority?: number;
  targetStationIds?: string[];
}

export interface VendorBaselineOpenAdrEventInput {
  stationId: string;
  eventId?: string;
  startsAt: string;
  endsAt: string;
  signalValueKw: number;
  signalName?: string;
  signalType?: string;
  priority?: number;
  reason?: string;
}

export interface VendorBaselineRoamingProtocolsInput {
  protocols: Array<"OCPI" | "OCHP" | "OICP" | "EMIP">;
  transport?: string;
  endpointOverrides?: Record<string, unknown>;
}

export interface VendorBaselineV2xProfileInput {
  enabled: boolean;
  mode: "V2G" | "V2X";
  maxDischargeKw?: number;
  minSocPercent?: number;
  bidirectionalDispatch?: boolean;
  provider?: string;
  notes?: string;
}

export interface VendorBaselineAutochargeEnrollmentInput {
  driverId: string;
  tokenUid: string;
  vehicleId?: string;
  vehicleVin?: string;
  chargePointId?: string;
  connectorId?: number;
  metadata?: Record<string, unknown>;
}

export interface VendorBaselineSmartQueueItem {
  bookingId: string;
  reservationId: number | null;
  stationId: string;
  stationName: string;
  userId: string;
  userName: string;
  status: string;
  startTime: string;
  endTime: string;
  score: number;
  reasons: string[];
}

export interface VendorBaselineSmartQueueResponse {
  tenantId: string;
  generatedAt: string;
  count: number;
  items: VendorBaselineSmartQueueItem[];
}

export interface VendorBaselineTerminalRegistrationInput {
  terminalId: string;
  locationName?: string;
  model?: string;
  provider?: string;
  active?: boolean;
  cardReaderIds?: string[];
  metadata?: Record<string, unknown>;
}

export interface VendorBaselineTerminalCheckoutIntentInput {
  amount: number;
  currency?: string;
  terminalId: string;
  cardReaderId?: string;
  idempotencyKey: string;
  correlationId?: string;
  ttlMinutes?: number;
  callbackUrl?: string;
  sessionId?: string;
  invoiceId?: string;
  metadata?: Record<string, unknown>;
}

export interface VendorBaselineTerminalIntentReconcileInput {
  status: "PENDING" | "AUTHORIZED" | "SETTLED" | "FAILED" | "CANCELED" | "EXPIRED";
  providerReference?: string;
  note?: string;
  markSettled?: boolean;
}

export interface VendorBaselineLoyaltyTransactionInput {
  driverId: string;
  points: number;
  reason?: string;
  correlationId?: string;
  metadata?: Record<string, unknown>;
}

export interface VendorBaselineDriverWorkflowQuery {
  includeHistory?: boolean;
}
