import { fetchJson } from "./fetchJson";
import type {
  OrganizationId,
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
  serviceMode: string;
  location: string;
  status: string;
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
  status: string;
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

interface BackendOrganization {
  id: string;
  name: string;
  type?: string;
  tenantSubdomain?: string;
  billingStatus?: string;
  suspendedAt?: string | null;
  country?: string;
  city?: string;
  email?: string;
  phone?: string;
  createdAt: string;
  _count?: {
    sites?: number;
  };
  timezone?: string;
  billingPlanCode?: string;
}

function mapOrganizationToSummary(org: BackendOrganization): PlatformTenantSummary {
  return {
    id: org.id,
    name: org.name,
    code: org.tenantSubdomain || org.id.slice(0, 8).toUpperCase(),
    cpoType: (org.type === "HYBRID" || org.type === "CPO" ? "HYBRID" : "CHARGE") as TenantCpoType,
    status: org.suspendedAt ? "Suspended" : (org.billingStatus === "PAST_DUE" ? "Past Due" : "Active"),
    country: org.country || "Uganda",
    city: org.city || "Kampala",
    email: org.email || "",
    phone: org.phone || "",
    createdAt: org.createdAt,
    stationCount: org._count?.sites ?? 0,
    chargePointCount: 0,
    swapCabinetCount: 0,
    batteryPackCount: 0,
    openIncidents: 0,
    revenue30d: 0,
    currency: "UGX",
  };
}

export async function listPlatformTenants(): Promise<PlatformTenantSummary[]> {
  const orgs = await fetchJson<BackendOrganization[]>("/api/v1/platform/tenants");
  return orgs.map(mapOrganizationToSummary);
}

export async function getPlatformTenantDetails(
  tenantId: OrganizationId,
): Promise<PlatformTenantDetails> {
  const org = await fetchJson<BackendOrganization>(`/api/v1/platform/tenants/${tenantId}`);

  // Basic mapping for details, expanding on summary
  const summary = mapOrganizationToSummary(org);

  return {
    ...summary,
    timezone: org.timezone || "Africa/Nairobi",
    tenantType: org.type || "Operating Company",
    primaryAdmin: {
      name: "Admin",
      role: "Tenant Admin",
      email: org.email || "",
      phone: org.phone || "",
      mfaEnabled: true,
      lastSeen: new Date().toISOString(),
    },
    subscription: {
      planName: org.billingPlanCode || "Standard Plan",
      status: summary.status === "Active" ? "Active" : "Suspended",
      renewalDate: new Date().toISOString(),
      billingCycle: "Monthly",
      platformFeesDue: 0,
      outstandingBalance: 0,
      currency: "KES",
      limits: {
        maxStations: 10,
        maxChargePoints: 50,
        maxSwapCabinets: 5,
        maxUsers: 20,
        apiAccess: true,
        ocpiAccess: true,
      },
    },
    stations: [],
    chargePoints: [],
    swapping: [],
    batteryMetrics: [],
    applications: [],
    auditEvents: [],
  };
}

export async function suspendPlatformTenant(tenantId: OrganizationId) {
  return fetchJson(`/api/v1/platform/tenants/${tenantId}/suspend`, {
    method: "POST",
    body: JSON.stringify({ suspended: true }),
  });
}

export async function reactivatePlatformTenant(tenantId: OrganizationId) {
  return fetchJson(`/api/v1/platform/tenants/${tenantId}/suspend`, {
    method: "POST",
    body: JSON.stringify({ suspended: false }),
  });
}

export async function revokePlatformTenantSubscription(tenantId: OrganizationId) {
  // Assuming a similar endpoint exists or using update
  return fetchJson(`/api/v1/platform/tenants/${tenantId}`, {
    method: "PATCH",
    body: JSON.stringify({ billingStatus: "REVOKED" }),
  });
}

