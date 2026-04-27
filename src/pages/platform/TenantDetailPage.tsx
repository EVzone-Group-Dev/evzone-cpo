import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { 
  Building2, 
  ChevronLeft, 
  ShieldAlert, 
  CheckCircle2, 
  Ban, 
  Key, 
  CreditCard, 
  Cpu,
  Settings as SettingsIcon,
  Users,
  XCircle,
  FileText,
  Mail,
  MapPin,
  Calendar,
  Zap,
  Globe2
} from "lucide-react";
import { Link } from "react-router-dom";
import { PATHS } from "@/router/paths";
import { canAccessPolicy } from "@/core/auth/access";
import { useAuthStore } from "@/core/auth/authStore";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);

  const canWriteTenants = canAccessPolicy(user, "platformTenantsWrite");

  // Mock logic to differentiate between "Active" and "Pending" based on ID
  // In reality, this would come from an API call
  const isPending = id === "3" || id === "5";
  const tenantName = id === "3" ? "CityCharge Municipal" : "VoltDrive Solutions";
  const status = isPending ? "Pending Review" : "Active";

  return (
    <DashboardLayout pageTitle={`Tenant: ${tenantName}`}>
      <div className="animate-in fade-in slide-in-from-left-4 duration-500">
        <header className="flex items-center justify-between mb-8">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-[var(--text-subtle)] hover:text-[var(--accent)] transition-all group"
          >
            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-semibold tracking-tight uppercase">Back to Directory</span>
          </button>

          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
              isPending ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-green-50 text-green-600 border-green-200'
            }`}>
              {status}
            </span>
          </div>
        </header>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* Sidebar Profiler */}
          <aside className="w-full lg:w-96 space-y-8">
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[2.5rem] p-10 text-center shadow-xl shadow-slate-200/50 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-[var(--accent)] to-[var(--accent-dim)] opacity-10 group-hover:opacity-20 transition-opacity" />
              
              <div className="w-24 h-24 rounded-3xl bg-white border-4 border-[var(--bg-card)] flex items-center justify-center text-[var(--accent)] font-black text-4xl mx-auto mb-6 shadow-xl relative z-10 group-hover:scale-110 transition-transform duration-500">
                {tenantName.charAt(0)}
              </div>
              
              <h2 className="text-2xl font-black text-[var(--text)] mb-2 tracking-tight">{tenantName}</h2>
              <div className="flex items-center justify-center gap-2 text-[var(--text-subtle)] text-sm mb-8 font-medium">
                <Globe2 size={14} />
                <span>{id === "3" ? "city.gov" : "voltdrive.io"}</span>
              </div>
              
              <div className="space-y-3 relative z-10">
                {canWriteTenants && (
                  isPending ? (
                    <>
                      <button className="btn primary w-full flex items-center justify-center gap-2 py-3 rounded-2xl shadow-lg shadow-[var(--accent-dim)]/50">
                        <CheckCircle2 size={18} />
                        <span className="font-bold">Approve Application</span>
                      </button>
                      <button className="btn ghost w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-red-500 border border-red-100 hover:bg-red-50">
                        <XCircle size={18} />
                        <span className="font-bold">Reject Request</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="btn ghost w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-orange-600 border border-orange-100 hover:bg-orange-50 font-bold">
                        <Ban size={18} />
                        <span>Suspend Tenant</span>
                      </button>
                      <button className="btn ghost w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-red-600 border border-red-100 hover:bg-red-50 font-bold">
                        <ShieldAlert size={18} />
                        <span>Revoke Access</span>
                      </button>
                    </>
                  )
                )}
              </div>
            </div>

            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-8 space-y-6 shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--text-subtle)]">Entity Dossier</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[var(--text-subtle)] text-xs font-bold">
                    <Mail size={14} />
                    <span>Contact</span>
                  </div>
                  <span className="text-sm font-semibold">{id === "3" ? "admin@city.gov" : "ops@voltdrive.io"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[var(--text-subtle)] text-xs font-bold">
                    <MapPin size={14} />
                    <span>Region</span>
                  </div>
                  <span className="text-sm font-semibold">North America</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[var(--text-subtle)] text-xs font-bold">
                    <Calendar size={14} />
                    <span>Registered</span>
                  </div>
                  <span className="text-sm font-semibold">Oct 12, 2025</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Core Content Layout */}
          <main className="flex-1 space-y-8">
            <section className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-10 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-5 text-[var(--text)]">
                  <Building2 size={120} />
               </div>

              <div className="flex items-center gap-4 mb-10">
                <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 shadow-inner">
                  <Zap size={24} strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-[var(--text)] tracking-tight">Platform Governance</h2>
                  <p className="text-sm text-[var(--text-subtle)] font-medium">Overriding configurations and administrative protocols.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-8 border border-[var(--border)] rounded-3xl bg-[var(--bg-subtle)] hover:border-[var(--accent)] hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--accent)] opacity-0 group-hover:opacity-5 rounded-bl-full transition-opacity" />
                  <div className="p-3 rounded-xl bg-white border border-[var(--border)] w-fit mb-6 shadow-sm group-hover:scale-110 group-hover:bg-[var(--accent)] group-hover:text-white transition-all duration-300">
                    <Key size={24} />
                  </div>
                  <h4 className="font-black text-[var(--text)] text-lg mb-2">IAM Identity Control</h4>
                  <p className="text-sm text-[var(--text-subtle)] leading-relaxed font-medium">Provision tenant administrators, manage SSO integration, and audit cross-tenant delegation.</p>
                </div>

                <div className="p-8 border border-[var(--border)] rounded-3xl bg-[var(--bg-subtle)] hover:border-[var(--accent)] hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-green-500 opacity-0 group-hover:opacity-5 rounded-bl-full transition-opacity" />
                  <div className="p-3 rounded-xl bg-white border border-[var(--border)] w-fit mb-6 shadow-sm group-hover:scale-110 group-hover:bg-green-500 group-hover:text-white transition-all duration-300">
                    <CreditCard size={24} />
                  </div>
                  <h4 className="font-black text-[var(--text)] text-lg mb-2">Subscription & Credits</h4>
                  <p className="text-sm text-[var(--text-subtle)] leading-relaxed font-medium">Manage billing cycles, override tier limits, and allocate infrastructure usage credits.</p>
                </div>

                <div className="p-8 border border-[var(--border)] rounded-3xl bg-[var(--bg-subtle)] hover:border-[var(--accent)] hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500 opacity-0 group-hover:opacity-5 rounded-bl-full transition-opacity" />
                  <div className="p-3 rounded-xl bg-white border border-[var(--border)] w-fit mb-6 shadow-sm group-hover:scale-110 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                    <Cpu size={24} />
                  </div>
                  <h4 className="font-black text-[var(--text)] text-lg mb-2">Node Management</h4>
                  <p className="text-sm text-[var(--text-subtle)] leading-relaxed font-medium">Directly manage charging station inventory, vendor profiles, and technical overrides.</p>
                </div>

                <div className="p-8 border border-[var(--border)] rounded-3xl bg-[var(--bg-subtle)] hover:border-[var(--accent)] hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500 opacity-0 group-hover:opacity-5 rounded-bl-full transition-opacity" />
                  <div className="p-3 rounded-xl bg-white border border-[var(--border)] w-fit mb-6 shadow-sm group-hover:scale-110 group-hover:bg-purple-500 group-hover:text-white transition-all duration-300">
                    <SettingsIcon size={24} />
                  </div>
                  <h4 className="font-black text-[var(--text)] text-lg mb-2">Global Policies</h4>
                  <p className="text-sm text-[var(--text-subtle)] leading-relaxed font-medium">Enforce platform-wide security protocols or custom branding overrides for this entity.</p>
                </div>
              </div>
            </section>

            {isPending && (
              <section className="bg-orange-50 border border-orange-200 rounded-3xl p-8 flex items-start gap-4 animate-in zoom-in-95 duration-500">
                <div className="p-3 rounded-2xl bg-orange-100 text-orange-600">
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-orange-900 mb-1">Application Documentation</h3>
                  <p className="text-sm text-orange-800 font-medium mb-4">The applicant has submitted all required KYC and regulatory documents for platform onboarding.</p>
                  <button className="text-sm font-black text-orange-700 hover:underline">View Onboarding Artifacts →</button>
                </div>
              </section>
            )}

            {!isPending && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-3">
                        <Users size={20} className="text-[var(--accent)]" />
                        <h3 className="font-bold text-[var(--text)] text-lg">Tenant Admin Base</h3>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-subtle)] hover:text-[var(--accent)] cursor-pointer transition-colors">Directory</span>
                    </div>
                    <div className="space-y-6">
                      <div className="flex items-center gap-4 group cursor-pointer">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center font-bold text-slate-500 group-hover:bg-[var(--accent-dim)] group-hover:text-[var(--accent)] transition-all">AR</div>
                        <div className="flex-1">
                          <div className="text-sm font-black text-[var(--text)]">Alex Rivera</div>
                          <div className="text-[11px] text-[var(--text-subtle)] font-bold uppercase tracking-tight">Super Admin</div>
                        </div>
                        <Mail size={16} className="text-[var(--text-subtle)] opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="flex items-center gap-4 group cursor-pointer">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center font-bold text-slate-500 group-hover:bg-[var(--accent-dim)] group-hover:text-[var(--accent)] transition-all">SC</div>
                        <div className="flex-1">
                          <div className="text-sm font-black text-[var(--text)]">Sam Chen</div>
                          <div className="text-[11px] text-[var(--text-subtle)] font-bold uppercase tracking-tight">Billing Contact</div>
                        </div>
                        <Mail size={16} className="text-[var(--text-subtle)] opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                 </div>

                 <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-3">
                        <Building2 size={20} className="text-green-500" />
                        <h3 className="font-bold text-[var(--text)] text-lg">Infrastructure Nodes</h3>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-subtle)]">Real-time</span>
                    </div>
                    <div className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-[var(--border)] rounded-2xl text-[var(--text-subtle)]">
                      <div className="text-3xl font-black text-[var(--text)] mb-1">85</div>
                      <div className="text-[10px] font-black uppercase tracking-[0.2em]">Active Station Slots</div>
                    </div>
                 </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </DashboardLayout>
  );
}
