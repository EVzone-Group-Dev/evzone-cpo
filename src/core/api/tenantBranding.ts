import { fetchJson } from '@/core/api/fetchJson';
import type {
  BrandingDraftResponse,
  BrandingRuntimeResponse,
  PlatformTenantSummary,
  TenantBrandingAssetResponse,
  WhiteLabelConfigV1,
} from '@/core/types/branding';

function normalizeApiBaseUrl(rawValue: string | undefined): string | null {
  if (!rawValue) {
    return null;
  }

  const trimmed = rawValue.trim();
  if (!trimmed) {
    return null;
  }

  const corrected = trimmed.replace(/^(https?:\/\/[^/:/?#]+)::(\d+)/i, '$1:$2');

  try {
    const url = new URL(corrected);
    return url.toString().replace(/\/$/, '');
  } catch {
    return null;
  }
}

function resolveRequestUrl(input: string): string {
  if (/^https?:\/\//i.test(input)) {
    return input;
  }

  const apiBaseUrl = normalizeApiBaseUrl(
    import.meta.env.VITE_API_BASE_URL as string | undefined,
  );

  if (!apiBaseUrl) {
    return input;
  }

  if (input.startsWith('/')) {
    return `${apiBaseUrl}${input}`;
  }

  return `${apiBaseUrl}/${input}`;
}

async function readErrorMessage(response: Response): Promise<string | null> {
  try {
    const payload = (await response.json()) as { message?: string };
    return payload.message ?? null;
  } catch {
    return null;
  }
}

async function fetchPublicJson<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(resolveRequestUrl(input), {
    ...init,
    credentials: init?.credentials ?? 'include',
  });

  if (!response.ok) {
    const message =
      (await readErrorMessage(response)) ??
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

function resolveBrandingBasePath(tenantId?: string | null): string {
  if (tenantId) {
    return `/api/v1/platform/tenants/${tenantId}/branding`;
  }

  return '/api/v1/tenant-branding';
}

export async function fetchRuntimeBranding(): Promise<BrandingRuntimeResponse> {
  return fetchPublicJson<BrandingRuntimeResponse>('/api/v1/public/tenant-branding');
}

export async function fetchTenantBrandingState(options?: {
  tenantId?: string | null;
}): Promise<BrandingDraftResponse> {
  return fetchJson<BrandingDraftResponse>(resolveBrandingBasePath(options?.tenantId));
}

export async function saveTenantBrandingDraft(
  config: WhiteLabelConfigV1,
  options?: { tenantId?: string | null },
): Promise<BrandingDraftResponse> {
  return fetchJson<BrandingDraftResponse>(
    `${resolveBrandingBasePath(options?.tenantId)}/draft`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ config }),
    },
  );
}

export async function publishTenantBrandingDraft(options?: {
  tenantId?: string | null;
}): Promise<BrandingDraftResponse> {
  return fetchJson<BrandingDraftResponse>(
    `${resolveBrandingBasePath(options?.tenantId)}/publish`,
    {
      method: 'POST',
    },
  );
}

export async function rollbackTenantBranding(
  version: number,
  options?: { tenantId?: string | null },
): Promise<BrandingDraftResponse> {
  return fetchJson<BrandingDraftResponse>(
    `${resolveBrandingBasePath(options?.tenantId)}/rollback`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ version }),
    },
  );
}

export async function uploadTenantBrandingAsset(
  input: {
    assetKind: 'logo' | 'logoIcon' | 'favicon' | 'loginIllustration';
    assetUrl?: string;
    file?: File;
  },
  options?: { tenantId?: string | null },
): Promise<TenantBrandingAssetResponse> {
  const formData = new FormData();
  formData.set('assetKind', input.assetKind);

  if (input.assetUrl) {
    formData.set('assetUrl', input.assetUrl);
  }

  if (input.file) {
    formData.set('file', input.file);
  }

  return fetchJson<TenantBrandingAssetResponse>(
    `${resolveBrandingBasePath(options?.tenantId)}/assets`,
    {
      method: 'POST',
      body: formData,
    },
  );
}

export async function listPlatformTenants(): Promise<PlatformTenantSummary[]> {
  const tenants = await fetchJson<PlatformTenantSummary[]>('/api/v1/platform/tenants');
  return Array.isArray(tenants) ? tenants : [];
}
