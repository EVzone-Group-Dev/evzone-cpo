import type {
  BatteryPackStatus,
  OrganizationId,
  ServiceMode,
  StationStatus,
  TenantCpoType,
} from "@/core/types/domain";

export type TenantStatus =
  | "Pending Approval"
  | "Active"
  | "Suspended"
  | "Revoked"
  | "Past Due"
  | "Trial";

export type SubscriptionStatus =
  | "Active"
  | "Past Due"
  | "Suspended"
  | "Revoked"
  | "Trial";

export interface PlatformTenantSummary {
  id: OrganizationId;
  name: string;
  code: string;
  cpoType: TenantCpoType;
  status: TenantStatus;
  country: string;
  city: string;
  email: string;
  phone: string;
  createdAt: string;
  stationCount: number;
  chargePointCount: number;
  swapCabinetCount: number;
  batteryPackCount: number;
  openIncidents: number;
  revenue30d: number;
  currency: string;
}

export interface PlatformTenantAdminContact {
  name: string;
  role: string;
  email: string;
  phone: string;
  mfaEnabled: boolean;
  lastSeen: string;
}

export interface TenantSubscription {
  planName: string;
  status: SubscriptionStatus;
  renewalDate: string;
  billingCycle: "Monthly" | "Quarterly" | "Annual";
  platformFeesDue: number;
  outstandingBalance: number;
  currency: string;
  limits: {
    maxStations: number;
    maxChargePoints: number;
    maxSwapCabinets: number;
    maxUsers: number;
    apiAccess: boolean;
    ocpiAccess: boolean;
  };
}

export interface TenantStationAsset {
  id: string;
  name: string;
  serviceMode: ServiceMode;
  location: string;
  status: StationStatus;
  chargePoints: number;
  swapCabinets: number;
  availableChargedPacks: number;
  chargingPacks: number;
  capacityKw: number;
  uptimePercent: number;
  healthNote: string;
}

export interface TenantChargePointAsset {
  id: string;
  stationName: string;
  ocppId: string;
  ocppVersion: string;
  status: string;
  lastHeartbeat: string;
  maxCapacityKw: number;
  activeSession: boolean;
}

export interface TenantSwapAsset {
  id: string;
  stationName: string;
  cabinetCount: number;
  readyPacks: number;
  chargingPacks: number;
  reservedPacks: number;
  avgSwapDurationMinutes: number;
  alert: string;
}

export interface TenantBatteryMetric {
  status: BatteryPackStatus;
  count: number;
}

export interface TenantApplication {
  id: string;
  organizationName: string;
  applicantName: string;
  applicantEmail: string;
  requestedCpoType: TenantCpoType;
  region: string;
  submittedAt: string;
  stage: "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "ACTIVATED";
}

export interface TenantAuditEvent {
  id: string;
  actorName: string;
  action: string;
  createdAt: string;
}

export interface PlatformTenantDetails extends PlatformTenantSummary {
  timezone: string;
  tenantType: string;
  primaryAdmin: PlatformTenantAdminContact;
  subscription: TenantSubscription;
  stations: TenantStationAsset[];
  chargePoints: TenantChargePointAsset[];
  swapping: TenantSwapAsset[];
  batteryMetrics: TenantBatteryMetric[];
  applications: TenantApplication[];
  auditEvents: TenantAuditEvent[];
}

const MOCK_TENANTS: PlatformTenantDetails[] = [
  {
    id: "tenant_evzone_ke",
    name: "EVzone Kenya",
    code: "KE-CPO",
    cpoType: "HYBRID",
    status: "Active",
    tenantType: "Operating Company",
    country: "Kenya",
    city: "Nairobi",
    email: "tenant-admin@evzone.app",
    phone: "+254 700 000 000",
    createdAt: "2026-03-01T08:00:00Z",
    timezone: "Africa/Nairobi",
    stationCount: 12,
    chargePointCount: 48,
    swapCabinetCount: 9,
    batteryPackCount: 216,
    openIncidents: 3,
    revenue30d: 2400000,
    currency: "KES",
    primaryAdmin: {
      name: "Jane Admin",
      role: "Tenant Admin",
      email: "jane@evzone.app",
      phone: "+254 711 000 000",
      mfaEnabled: true,
      lastSeen: "2026-04-27T16:30:00Z",
    },
    subscription: {
      planName: "Enterprise Hybrid Plan",
      status: "Active",
      renewalDate: "2026-05-30",
      billingCycle: "Annual",
      platformFeesDue: 184500,
      outstandingBalance: 24000,
      currency: "KES",
      limits: {
        maxStations: 100,
        maxChargePoints: 500,
        maxSwapCabinets: 120,
        maxUsers: 250,
        apiAccess: true,
        ocpiAccess: true,
      },
    },
    stations: [
      {
        id: "station_westlands",
        name: "Westlands Hub",
        serviceMode: "Hybrid",
        location: "Westlands, Nairobi",
        status: "Online",
        chargePoints: 6,
        swapCabinets: 1,
        availableChargedPacks: 9,
        chargingPacks: 3,
        capacityKw: 360,
        uptimePercent: 99.4,
        healthNote: "Healthy",
      },
      {
        id: "station_cbd",
        name: "CBD Charging Station",
        serviceMode: "Charging",
        location: "CBD, Nairobi",
        status: "Degraded",
        chargePoints: 4,
        swapCabinets: 0,
        availableChargedPacks: 0,
        chargingPacks: 0,
        capacityKw: 240,
        uptimePercent: 94.1,
        healthNote: "One charge point faulted",
      },
      {
        id: "station_airport",
        name: "Airport East Battery Exchange",
        serviceMode: "Swapping",
        location: "JKIA, Nairobi",
        status: "Online",
        chargePoints: 0,
        swapCabinets: 2,
        availableChargedPacks: 18,
        chargingPacks: 6,
        capacityKw: 90,
        uptimePercent: 98.7,
        healthNote: "Healthy",
      },
    ],
    chargePoints: [
      {
        id: "cp_wl_001",
        stationName: "Westlands Hub",
        ocppId: "EVZ-WL-001",
        ocppVersion: "2.0.1",
        status: "Charging",
        lastHeartbeat: "12s ago",
        maxCapacityKw: 120,
        activeSession: true,
      },
      {
        id: "cp_cbd_001",
        stationName: "CBD Charging Station",
        ocppId: "EVZ-CBD-001",
        ocppVersion: "1.6J",
        status: "Faulted",
        lastHeartbeat: "7m ago",
        maxCapacityKw: 60,
        activeSession: false,
      },
    ],
    swapping: [
      {
        id: "swap_wl_001",
        stationName: "Westlands Hub",
        cabinetCount: 1,
        readyPacks: 9,
        chargingPacks: 3,
        reservedPacks: 1,
        avgSwapDurationMinutes: 3.7,
        alert: "Reserve below threshold",
      },
      {
        id: "swap_airport_001",
        stationName: "Airport East Battery Exchange",
        cabinetCount: 2,
        readyPacks: 18,
        chargingPacks: 6,
        reservedPacks: 2,
        avgSwapDurationMinutes: 2.9,
        alert: "Healthy",
      },
    ],
    batteryMetrics: [
      { status: "Ready", count: 38 },
      { status: "Charging", count: 17 },
      { status: "Reserved", count: 4 },
      { status: "In Use", count: 153 },
      { status: "Quarantined", count: 4 },
    ],
    applications: [
      {
        id: "app_greenfleet",
        organizationName: "GreenFleet Kenya",
        applicantName: "Mary Wanjiku",
        applicantEmail: "mary@greenfleet.co.ke",
        requestedCpoType: "HYBRID",
        region: "Kenya",
        submittedAt: "2026-04-24T10:00:00Z",
        stage: "SUBMITTED",
      },
    ],
    auditEvents: [
      {
        id: "audit_1",
        actorName: "Delta Admin",
        action: "Approved tenant application",
        createdAt: "2026-04-27T10:21:00Z",
      },
      {
        id: "audit_2",
        actorName: "Delta Admin",
        action: "Created station Airport East Battery Exchange",
        createdAt: "2026-04-27T10:42:00Z",
      },
      {
        id: "audit_3",
        actorName: "Platform Billing Admin",
        action: "Viewed tenant subscription",
        createdAt: "2026-04-27T11:03:00Z",
      },
    ],
  },
];

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(value), 250);
  });
}

export async function listPlatformTenants(): Promise<PlatformTenantSummary[]> {
  return delay(
    MOCK_TENANTS.map(({ primaryAdmin, subscription, stations, chargePoints, swapping, batteryMetrics, applications, auditEvents, ...summary }) => summary),
  );
}

export async function getPlatformTenantDetails(
  tenantId: OrganizationId,
): Promise<PlatformTenantDetails> {
  const tenant = MOCK_TENANTS.find((item) => item.id === tenantId);

  if (!tenant) {
    throw new Error("Tenant not found.");
  }

  return delay(tenant);
}

export async function suspendPlatformTenant(tenantId: OrganizationId) {
  return delay({ tenantId, status: "Suspended" as TenantStatus });
}

export async function revokePlatformTenantSubscription(tenantId: OrganizationId) {
  return delay({ tenantId, subscriptionStatus: "Revoked" as SubscriptionStatus });
}

export async function reactivatePlatformTenant(tenantId: OrganizationId) {
  return delay({ tenantId, status: "Active" as TenantStatus });
}
