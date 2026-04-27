import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Users, Search, Filter, Plus, ExternalLink, Shield, CreditCard, Activity } from "lucide-react";
import { canAccessPolicy } from "@/core/auth/access";
import { useAuthStore } from "@/core/auth/authStore";

export function TenantsPage() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const [searchQuery, setSearchQuery] = useState("");

  const canWriteTenants = canAccessPolicy(user, "platformTenantsWrite");

  return (
    <div className="page-container animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="page-header flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text)]">
            {t("nav.items.tenants")}
          </h1>
          <p className="text-[var(--text-subtle)] mt-1">
            Manage infrastructure, subscriptions, and access controls across all platform tenants.
          </p>
        </div>

        {canWriteTenants && (
          <button className="btn primary flex items-center gap-2">
            <Plus size={18} />
            <span>Provision Tenant</span>
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="stats-card p-6 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl">
          <div className="flex items-center gap-3 text-[var(--accent)] mb-2">
            <Users size={20} />
            <span className="text-sm font-medium uppercase tracking-wider">Total Tenants</span>
          </div>
          <div className="text-3xl font-bold text-[var(--text)]">124</div>
        </div>
        <div className="stats-card p-6 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl">
          <div className="flex items-center gap-3 text-green-500 mb-2">
            <Activity size={20} />
            <span className="text-sm font-medium uppercase tracking-wider">Active Now</span>
          </div>
          <div className="text-3xl font-bold text-[var(--text)]">118</div>
        </div>
        <div className="stats-card p-6 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl">
          <div className="flex items-center gap-3 text-orange-500 mb-2">
            <Shield size={20} />
            <span className="text-sm font-medium uppercase tracking-wider">Pending Review</span>
          </div>
          <div className="text-3xl font-bold text-[var(--text)]">6</div>
        </div>
        <div className="stats-card p-6 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl">
          <div className="flex items-center gap-3 text-blue-500 mb-2">
            <CreditCard size={20} />
            <span className="text-sm font-medium uppercase tracking-wider">Revenue (MTD)</span>
          </div>
          <div className="text-3xl font-bold text-[var(--text)]">$42.8k</div>
        </div>
      </div>

      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[var(--border)] bg-[var(--bg-card)]/50 backdrop-blur-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]" size={18} />
            <input
              type="text"
              placeholder="Search by name, ID, or domain..."
              className="w-full pl-10 pr-4 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-xl focus:ring-2 focus:ring-[var(--accent)] transition-all outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <button className="btn ghost flex items-center gap-2">
              <Filter size={16} />
              <span>Filter</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--bg-subtle)] text-[var(--text-subtle)] text-xs uppercase tracking-widest font-semibold">
                <th className="px-6 py-4">Tenant</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Subscription</th>
                <th className="px-6 py-4">Stations</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {[
                { id: "1", name: "VoltDrive Solutions", domain: "voltdrive.io", type: "Enterprise", status: "Active", stations: 42, plan: "Platinum" },
                { id: "2", name: "GreenGrid Networks", domain: "greengrid.net", type: "CPO", status: "Active", stations: 12, plan: "Gold" },
                { id: "3", name: "CityCharge Municipal", domain: "city.gov", type: "Public", status: "Pending", stations: 0, plan: "Free" },
                { id: "4", name: "EchoEnergy Group", domain: "echo.energy", type: "Hybrid", status: "Active", stations: 85, plan: "Enterprise" },
              ].map((tenant) => (
                <tr key={tenant.id} className="hover:bg-[var(--accent-dim)]/5 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[var(--accent-dim)] flex items-center justify-center text-[var(--accent-ink)] font-bold shadow-sm group-hover:scale-105 transition-transform">
                        {tenant.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-[var(--text)]">{tenant.name}</div>
                        <div className="text-xs text-[var(--text-subtle)]">{tenant.domain}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="px-2 py-1 rounded-md bg-[var(--bg-subtle)] text-xs font-medium border border-[var(--border)]">
                      {tenant.type}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1">
                      <span className={`text-xs font-bold ${tenant.status === 'Active' ? 'text-green-500' : 'text-orange-500'}`}>
                        ● {tenant.status}
                      </span>
                      <span className="text-[10px] text-[var(--text-subtle)] uppercase tracking-tight">{tenant.plan} Plan</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 font-mono text-sm">{tenant.stations}</td>
                  <td className="px-6 py-5 text-right">
                    <button className="btn ghost icon hover:text-[var(--accent)] transition-colors">
                      <ExternalLink size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 bg-[var(--bg-subtle)]/50 text-center">
          <p className="text-xs text-[var(--text-subtle)]">
            Showing 4 of 124 platform tenants
          </p>
        </div>
      </div>
    </div>
  );
}
