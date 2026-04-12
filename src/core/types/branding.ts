export const WHITE_LABEL_SCHEMA_VERSION = 1 as const;

export const BRANDING_FONT_OPTIONS = [
  'Inter',
  'Roboto',
  'Outfit',
  'Plus Jakarta Sans',
] as const;

export type WhiteLabelFontFamily = (typeof BRANDING_FONT_OPTIONS)[number];

export interface WhiteLabelConfigV1 {
  schemaVersion: typeof WHITE_LABEL_SCHEMA_VERSION;
  branding: {
    appName: string;
    shortName: string;
    logoUrl: string | null;
    logoIconUrl: string | null;
    faviconUrl: string | null;
  };
  theme: {
    primaryColor: string;
    accentColor: string | null;
    borderRadiusPx: number;
    fontFamily: WhiteLabelFontFamily;
  };
  legal: {
    termsUrl: string | null;
    privacyUrl: string | null;
    supportUrl: string | null;
  };
  support: {
    email: string | null;
    phone: string | null;
  };
  domain: {
    primaryDomain: string | null;
    allowedOrigins: string[];
  };
  metadata: {
    lastEditedBy: string | null;
    lastEditedAt: string | null;
  };
}

export interface BrandingRuntimeResponse {
  tenantId: string | null;
  tenantName: string;
  resolvedBy: 'host_custom_domain' | 'host_subdomain' | 'default';
  config: WhiteLabelConfigV1;
}

export interface BrandingRevisionSummary {
  id: string;
  version: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ROLLED_BACK';
  publishedAt: string | null;
  rolledBackFromVersion: number | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BrandingDraftSnapshot {
  id: string;
  version: number;
  config: WhiteLabelConfigV1;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
}

export interface BrandingDraftResponse {
  tenantId: string;
  tenantName: string;
  activeConfig: WhiteLabelConfigV1;
  draft: BrandingDraftSnapshot | null;
  revisions: BrandingRevisionSummary[];
}

export interface TenantBrandingAssetResponse {
  assetKind: string;
  assetUrl: string;
  source: 'upload' | 'url';
  mimeType: string | null;
  sizeBytes: number | null;
  uploadedAt: string;
}

export interface PlatformTenantSummary {
  id: string;
  name: string;
  tenantSubdomain?: string | null;
  primaryDomain?: string | null;
}

export function createDefaultBrandingConfig(): WhiteLabelConfigV1 {
  return {
    schemaVersion: WHITE_LABEL_SCHEMA_VERSION,
    branding: {
      appName: 'EVzone CPO Central',
      shortName: 'EVzone',
      logoUrl: null,
      logoIconUrl: null,
      faviconUrl: null,
    },
    theme: {
      primaryColor: '#14C78B',
      accentColor: '#0EA672',
      borderRadiusPx: 8,
      fontFamily: 'Inter',
    },
    legal: {
      termsUrl: null,
      privacyUrl: null,
      supportUrl: null,
    },
    support: {
      email: null,
      phone: null,
    },
    domain: {
      primaryDomain: null,
      allowedOrigins: [],
    },
    metadata: {
      lastEditedBy: null,
      lastEditedAt: null,
    },
  };
}
