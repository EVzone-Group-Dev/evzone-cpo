import { useState } from "react";
import { useTranslation } from "react-i18next";
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  ExternalLink, 
  Shield, 
  CreditCard, 
  Activity,
  Inbox,
  CheckCircle2,
  Clock
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { canAccessPolicy } from "@/core/auth/access";
import { useAuthStore } from "@/core/auth/authStore";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PATHS } from "@/router/paths";

type Tab = "active" | "applications";

export function TenantsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("active");

  const canWriteTenants = canAccessPolicy(user, "platformTenantsWrite");

  const activeTenants = [
    { id: "1", name: "VoltDrive Solutions", domain: "voltdrive.io", type: "Enterprise", status: "Active", stations: 42, plan: "Platinum" },
    { id: "2", name: "GreenGrid Networks", domain: "greengrid.net", type: "CPO", status: "Active", stations: 12, plan: "Gold" },
    { id: "4", name: "EchoEnergy Group", domain: "echo.energy", type: "Hybrid", status: "Active", stations: 85, plan: "Enterprise" },
  ];

  const applications = [
    { id: "3", name: "CityCharge Municipal", domain: "city.gov", type: "Public", appliedAt: "2 hours ago", status: "Reviewing" },
    { id: "5", name: "SkyVolt Charging", domain: "skyvolt.com", type: "Private", appliedAt: "1 day ago", status: "Pending" },
  ];

  return (
    <DashboardLayout 
      pageTitle={t("nav.items.tenants")}
      actions={
        canWriteTenants && (
          <button className="btn primary flex items-center gap-2 h-9">
            <Plus size={16} />
            <span className="hidden sm:inline">Provision Tenant</span>
            <span className="sm:hidden">Provision</span>
          </button>
        )
      }
    >
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <header className="mb-8">
          <p className="text-[var(--text-subtle)] mt-1">
            Orchestrate multi-tenant infrastructure and approve onboarding applications.
          </p>
        </header>

        {/* Stats Strip */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="stats-card p-6 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 text-[var(--accent)] mb-2">
              <Users size={20} />
              <span className="text-sm font-medium uppercase tracking-wider">Total Tenants</span>
            </div>
            <div className="text-3xl font-bold text-[var(--text)]">124</div>
          </div>
          <div className="stats-card p-6 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 text-green-500 mb-2">
              <Activity size={20} />
              <span className="text-sm font-medium uppercase tracking-wider">Active Now</span>
            </div>
            <div className="text-3xl font-bold text-[var(--text)]">118</div>
          </div>
          <div className="stats-card p-6 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 text-orange-500 mb-2">
              <Inbox size={20} />
              <span className="text-sm font-medium uppercase tracking-wider">New Requests</span>
            </div>
            <div className="text-3xl font-bold text-[var(--text)]">{applications.length}</div>
          </div>
          <div className="stats-card p-6 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 text-blue-500 mb-2">
              <CreditCard size={20} />
              <span className="text-sm font-medium uppercase tracking-wider">Platform Revenue</span>
            </div>
            <div className="text-3xl font-bold text-[var(--text)]">$42.8k</div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-8 border-b border-[var(--border)] mb-6">
          <button 
            onClick={() => setActiveTab("active")}
            className={`pb-4 text-sm font-semibold transition-all relative ${activeTab === "active" ? "text-[var(--accent)]" : "text-[var(--text-subtle)] hover:text-[var(--text)]"}`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>Active Tenants</span>
            </div>
            {activeTab === "active" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent)] rounded-full animate-in fade-in zoom-in-95" />
            )}
          </button>
          <button 
            onClick={() => setActiveTab("applications")}
            className={`pb-4 text-sm font-semibold transition-all relative ${activeTab === "applications" ? "text-[var(--accent)]" : "text-[var(--text-subtle)] hover:text-[var(--text)]"}`}
          >
            <div className="flex items-center gap-2">
              <Clock size={16} />
              <span>Applications</span>
              {applications.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-orange-500 text-white text-[10px] rounded-full">
                  {applications.length}
                </span>
              )}
            </div>
            {activeTab === "applications" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent)] rounded-full animate-in fade-in zoom-in-95" />
            )}
          </button>
        </div>

        {/* Toolbar - Integrated without card wrap */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]" size={18} />
            <input
              type="text"
              placeholder={`Search ${activeTab === "active" ? "tenants" : "applications"}...`}
              className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl focus:ring-2 focus:ring-[var(--accent)] transition-all outline-none text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <button className="btn ghost flex items-center gap-2 h-10 border border-[var(--border)] px-4">
              <Filter size={16} />
              <span className="text-sm">Filter</span>
            </button>
          </div>
        </div>

        {/* Tabular List */}
        <div className="overflow-x-auto min-h-[400px]">
          {activeTab === "active" ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[var(--text-subtle)] text-[11px] uppercase tracking-[0.1em] font-bold border-b border-[var(--border)]">
                  <th className="px-4 py-3 font-bold">Tenant Identity</th>
                  <th className="px-4 py-3 font-bold">Category</th>
                  <th className="px-4 py-3 font-bold">Health & Subscription</th>
                  <th className="px-4 py-3 font-bold">Nodes</th>
                  <th className="px-4 py-3 text-right font-bold">Context</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {activeTenants.map((tenant) => (
                  <tr 
                    key={tenant.id} 
                    onClick={() => navigate(PATHS.TENANT_DETAIL(tenant.id))}
                    className="hover:bg-[var(--accent-dim)]/10 transition-all cursor-pointer group"
                  >
                    <td className="px-4 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-dim)] flex items-center justify-center text-white font-bold shadow-sm group-hover:scale-105 transition-transform duration-300">
                          {tenant.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-[var(--text)] group-hover:text-[var(--accent)] transition-colors">{tenant.name}</div>
                          <div className="text-xs text-[var(--text-subtle)]">{tenant.domain}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-5">
                      <span className="px-2 py-1 rounded-lg bg-[var(--bg-subtle)] text-[10px] font-bold uppercase tracking-wider border border-[var(--border)]">
                        {tenant.type}
                      </span>
                    </td>
                    <td className="px-4 py-5">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-green-500">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                          <span>{tenant.status}</span>
                        </div>
                        <span className="text-[10px] text-[var(--text-subtle)] font-medium uppercase tracking-tight">{tenant.plan} Subscription</span>
                      </div>
                    </td>
                    <td className="px-4 py-5 font-mono text-sm font-bold text-[var(--text)]">{tenant.stations}</td>
                    <td className="px-4 py-5 text-right">
                      <button className="btn ghost icon opacity-0 group-hover:opacity-100 transition-all">
                        <ExternalLink size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[var(--text-subtle)] text-[11px] uppercase tracking-[0.1em] font-bold border-b border-[var(--border)]">
                  <th className="px-4 py-3 font-bold">Applicant Entity</th>
                  <th className="px-4 py-3 font-bold">Application Type</th>
                  <th className="px-4 py-3 font-bold">Submission</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  <th className="px-4 py-3 text-right font-bold">Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {applications.map((app) => (
                  <tr 
                    key={app.id} 
                    onClick={() => navigate(PATHS.TENANT_DETAIL(app.id))}
                    className="hover:bg-[var(--accent-dim)]/10 transition-all cursor-pointer group"
                  >
                    <td className="px-4 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 font-bold shadow-sm group-hover:rotate-6 transition-transform duration-300">
                          {app.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-[var(--text)]">{app.name}</div>
                          <div className="text-xs text-[var(--text-subtle)]">{app.domain}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-5 text-sm font-medium">{app.type}</td>
                    <td className="px-4 py-5 text-xs text-[var(--text-subtle)]">{app.appliedAt}</td>
                    <td className="px-4 py-5">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${app.status === 'Reviewing' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-4 py-5 text-right">
                      <button className="btn ghost icon text-[var(--accent)]">
                        <Shield size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        <footer className="mt-8 pt-6 border-t border-[var(--border)] flex items-center justify-between">
          <p className="text-xs text-[var(--text-subtle)] font-medium">
            Showing {activeTab === "active" ? activeTenants.length : applications.length} {activeTab === "active" ? "active platform tenants" : "onboarding requests"}
          </p>
          <div className="flex items-center gap-1">
             <button className="btn ghost px-3 py-1.5 text-xs disabled:opacity-50" disabled>Previous</button>
             <button className="btn ghost px-3 py-1.5 text-xs font-bold text-[var(--accent)] border border-[var(--accent-dim)] rounded-lg">1</button>
             <button className="btn ghost px-3 py-1.5 text-xs disabled:opacity-50" disabled>Next</button>
          </div>
        </footer>
      </div>
    </DashboardLayout>
  );
}
