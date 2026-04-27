import { useParams } from "react-router-dom";
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
  Users
} from "lucide-react";
import { Link } from "react-router-dom";
import { PATHS } from "@/router/paths";
import { canAccessPolicy } from "@/core/auth/access";
import { useAuthStore } from "@/core/auth/authStore";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);

  const canWriteTenants = canAccessPolicy(user, "platformTenantsWrite");

  return (
    <DashboardLayout pageTitle="Tenant Detail">
      <div className="animate-in fade-in slide-in-from-left-4 duration-500">
        <Link 
          to={PATHS.TENANTS} 
          className="flex items-center gap-2 text-[var(--text-subtle)] hover:text-[var(--accent)] transition-colors mb-6 group"
        >
          <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back to Tenants</span>
        </Link>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Info */}
          <aside className="w-full lg:w-80 space-y-6">
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-8 text-center shadow-sm">
              <div className="w-20 h-20 rounded-2xl bg-[var(--accent-dim)] flex items-center justify-center text-[var(--accent-ink)] font-bold text-3xl mx-auto mb-4 shadow-md">
                V
              </div>
              <h2 className="text-2xl font-bold text-[var(--text)]">VoltDrive</h2>
              <p className="text-[var(--text-subtle)] text-sm mb-6">voltdrive.io</p>
              
              <div className="flex flex-col gap-3">
                {canWriteTenants && (
                  <>
                    <button className="btn primary w-full flex items-center justify-center gap-2">
                      <CheckCircle2 size={16} />
                      <span>Active Status</span>
                    </button>
                    <button className="btn ghost w-full flex items-center justify-center gap-2 text-orange-500 hover:bg-orange-50">
                      <Ban size={16} />
                      <span>Suspend Tenant</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--text-subtle)]">Tenant Metadata</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[var(--text-subtle)]">ID</span>
                  <span className="text-sm font-mono bg-[var(--bg-subtle)] px-2 py-0.5 rounded border border-[var(--border)]">{id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[var(--text-subtle)]">Created</span>
                  <span className="text-sm font-medium">Oct 12, 2025</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[var(--text-subtle)]">Type</span>
                  <span className="text-sm font-medium">Enterprise CPO</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 space-y-8">
            <section className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                  <ShieldAlert size={20} />
                </div>
                <h2 className="text-xl font-bold text-[var(--text)]">Administrative Controls</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 border border-[var(--border)] rounded-xl bg-[var(--bg-subtle)] hover:border-[var(--accent)] transition-colors cursor-pointer group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] group-hover:text-[var(--accent)] transition-colors">
                      <Key size={20} />
                    </div>
                  </div>
                  <h4 className="font-bold text-[var(--text)] mb-1">IAM Governance</h4>
                  <p className="text-xs text-[var(--text-subtle)]">Manage tenant admin rights and delegated auth policies.</p>
                </div>

                <div className="p-6 border border-[var(--border)] rounded-xl bg-[var(--bg-subtle)] hover:border-[var(--accent)] transition-colors cursor-pointer group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] group-hover:text-[var(--accent)] transition-colors">
                      <CreditCard size={20} />
                    </div>
                  </div>
                  <h4 className="font-bold text-[var(--text)] mb-1">Subscription Billing</h4>
                  <p className="text-xs text-[var(--text-subtle)]">Adjust tier limits, recurring fees, and usage credits.</p>
                </div>

                <div className="p-6 border border-[var(--border)] rounded-xl bg-[var(--bg-subtle)] hover:border-[var(--accent)] transition-colors cursor-pointer group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] group-hover:text-[var(--accent)] transition-colors">
                      <Cpu size={20} />
                    </div>
                  </div>
                  <h4 className="font-bold text-[var(--text)] mb-1">Infrastructure Management</h4>
                  <p className="text-xs text-[var(--text-subtle)]">Directly manage tenant stations and hardware assignments.</p>
                </div>

                <div className="p-6 border border-[var(--border)] rounded-xl bg-[var(--bg-subtle)] hover:border-[var(--accent)] transition-colors cursor-pointer group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] group-hover:text-[var(--accent)] transition-colors">
                      <SettingsIcon size={20} />
                    </div>
                  </div>
                  <h4 className="font-bold text-[var(--text)] mb-1">System Overrides</h4>
                  <p className="text-xs text-[var(--text-subtle)]">Bypass default protocols or apply manual configurations.</p>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <Users size={18} className="text-[var(--text-subtle)]" />
                      <h3 className="font-bold text-[var(--text)]">User Base</h3>
                    </div>
                    <span className="text-xs font-medium text-[var(--accent)]">View All</span>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200" />
                      <div className="flex-1">
                        <div className="text-sm font-medium">Alex Rivera</div>
                        <div className="text-[10px] text-[var(--text-subtle)]">Tenant Admin</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200" />
                      <div className="flex-1">
                        <div className="text-sm font-medium">Sam Chen</div>
                        <div className="text-[10px] text-[var(--text-subtle)]">Finance Manager</div>
                      </div>
                    </div>
                  </div>
               </div>

               <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <Building2 size={18} className="text-[var(--text-subtle)]" />
                      <h3 className="font-bold text-[var(--text)]">Stations</h3>
                    </div>
                    <span className="text-xs font-medium text-[var(--accent)]">Live View</span>
                  </div>
                  <div className="flex items-center justify-center h-20 text-[var(--text-subtle)] italic text-sm">
                    85 Active Charge Points
                  </div>
               </div>
            </div>
          </main>
        </div>
      </div>
    </DashboardLayout>
  );
}
