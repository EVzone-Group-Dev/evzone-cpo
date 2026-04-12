import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { fetchRuntimeBranding } from '@/core/api/tenantBranding';
import {
  createDefaultBrandingConfig,
  type BrandingRuntimeResponse,
  type WhiteLabelConfigV1,
} from '@/core/types/branding';
import { BrandingContext, type BrandingContextValue } from '@/core/branding/brandingContext';

const defaultRuntimeBranding: BrandingRuntimeResponse = {
  tenantId: null,
  tenantName: 'EVzone',
  resolvedBy: 'default',
  config: createDefaultBrandingConfig(),
};

function hexToRgb(hex: string): [number, number, number] | null {
  const normalized = hex.trim().replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return null;
  }

  const value = Number.parseInt(normalized, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function colorWithAlpha(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return `rgba(20, 199, 139, ${alpha})`;
  }

  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

function setFavicon(url: string | null): void {
  if (typeof document === 'undefined') {
    return;
  }

  const normalizedUrl = url?.trim() || '/favicon.png';
  let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement | null;

  if (!favicon) {
    favicon = document.createElement('link');
    favicon.rel = 'icon';
    document.head.appendChild(favicon);
  }

  favicon.href = normalizedUrl;
}

function applyBrandingToDocument(config: WhiteLabelConfigV1): void {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;
  const primary = config.theme.primaryColor;
  const accent = config.theme.accentColor || primary;

  root.style.setProperty('--accent', primary);
  root.style.setProperty('--accent-dim', accent);
  root.style.setProperty('--accent-glow', colorWithAlpha(primary, 0.18));
  root.style.setProperty('--brand-radius', `${config.theme.borderRadiusPx}px`);
  root.style.setProperty('--brand-font-family', `'${config.theme.fontFamily}', 'Segoe UI', system-ui, sans-serif`);

  document.title = config.branding.appName;
  setFavicon(config.branding.faviconUrl);

  let themeColor = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
  if (!themeColor) {
    themeColor = document.createElement('meta');
    themeColor.name = 'theme-color';
    document.head.appendChild(themeColor);
  }
  themeColor.content = primary;
}

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [runtimeBranding, setRuntimeBranding] = useState<BrandingRuntimeResponse>(
    defaultRuntimeBranding,
  );
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [lastError, setLastError] = useState<string | null>(null);

  const refreshBranding = useCallback(async () => {
    try {
      const runtime = await fetchRuntimeBranding();
      setRuntimeBranding(runtime);
      setLastError(null);
    } catch (error) {
      setRuntimeBranding(defaultRuntimeBranding);
      setLastError(error instanceof Error ? error.message : 'Failed to load branding');
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await refreshBranding();
      setIsBootstrapping(false);
    })();
  }, [refreshBranding]);

  useEffect(() => {
    applyBrandingToDocument(runtimeBranding.config);
  }, [runtimeBranding]);

  const value = useMemo<BrandingContextValue>(() => ({
    branding: runtimeBranding.config,
    runtimeBranding,
    isBootstrapping,
    lastError,
    refreshBranding,
  }), [isBootstrapping, lastError, refreshBranding, runtimeBranding]);

  if (isBootstrapping) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background: 'var(--bg)',
          color: 'var(--text)',
          fontFamily: 'var(--brand-font-family, Inter, Segoe UI, system-ui, sans-serif)',
        }}
      >
        <div className="text-sm font-semibold tracking-wide">
          Loading {runtimeBranding.config.branding.shortName}...
        </div>
      </div>
    );
  }

  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
}
