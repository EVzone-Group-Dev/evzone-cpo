import { type ReactNode } from "react";
import { useBranding } from "@/core/branding/useBranding";
import loginIllustration from "@/assets/Login-use.jpg";

const DEFAULT_AUTH_LOGO_PATH = "/assets/logos/evzone-charging-landscape.png";

interface AuthShellProps {
  children: ReactNode;
  visualTitle: string;
  visualSubtitle: string;
  visualBullets?: string[];
  showVisualSection?: boolean;
  showFormCard?: boolean;
  showBackgroundOverlay?: boolean;
}

export function AuthShell({
  children,
  visualTitle,
  visualSubtitle,
  visualBullets = [],
  showVisualSection = true,
  showFormCard = true,
  showBackgroundOverlay = true,
}: AuthShellProps) {
  const { branding } = useBranding();
  const brandName =
    branding.branding.shortName?.trim() || branding.branding.appName;
  const logoUrl = branding.branding.logoUrl || DEFAULT_AUTH_LOGO_PATH;

  return (
    <div className="auth-page">
      <img
        src={loginIllustration}
        alt=""
        aria-hidden="true"
        className="auth-bg-image"
      />
      {showBackgroundOverlay && <div className="auth-bg-overlay" />}
      <div className="auth-shell">
        <main className="auth-card-wrap">
          {showVisualSection && (
            <section className="mb-6 w-full max-w-[34rem] text-center">
              <div className="inline-flex items-center rounded-full border border-emerald-300/45 bg-emerald-50/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
                {brandName}
              </div>
              <h2 className="mx-auto mt-3 max-w-[24ch] text-2xl font-extrabold leading-tight text-slate-900">
                {visualTitle}
              </h2>
              <p className="mx-auto mt-2 max-w-[46ch] text-sm text-slate-700">
                {visualSubtitle}
              </p>
              {visualBullets.length > 0 && (
                <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-xs text-slate-700">
                  {visualBullets.map((bullet) => (
                    <span key={bullet} className="inline-flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {bullet}
                    </span>
                  ))}
                </div>
              )}
            </section>
          )}
          <div className={`auth-card${showFormCard ? "" : " auth-cardless"}`}>
            <div className="mb-5 text-center">
              <img
                src={logoUrl}
                alt={brandName}
                className="mx-auto h-auto w-full max-w-[270px] object-contain"
              />
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
