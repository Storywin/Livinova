
"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { RequireErp } from "@/components/erp/require-erp";
import { 
  Users, 
  Building2, 
  LayoutDashboard, 
  Settings, 
  LogOut,
  TrendingUp,
  Search,
  Plus,
  X,
  Loader2,
  Key,
  Sparkles,
  Wallet
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { formatRupiah } from "@/lib/format";
import { useAuthStore } from "@/store/auth";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";

type SubscriptionStatus =
  | "trial"
  | "active"
  | "expired"
  | "trial_expired"
  | "inactive";

type PartnerTenant = {
  id: string;
  name: string;
  slug: string;
  status: SubscriptionStatus;
  licenseCount: number;
  projectCount: number;
  createdAt: string;
};

type PartnerStats = {
  totalTenants: number;
  totalLicenses: number;
  totalProjects: number;
  totalGMV: number;
  tenants: PartnerTenant[];
  partnerName?: string | null;
  partnerEmail?: string | null;
  partnerPhone?: string | null;
};

type PricingPlan = {
  id: string;
  ownerType: "SYSTEM" | "PARTNER";
  name: string;
  description?: string | null;
  durationDays: number;
  price: number;
};

type PartnerQuota = {
  totalQuota: number;
  usedQuota: number;
};

type Invoice = {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  tenant?: { name: string; slug: string } | null;
  pricingPlan?: { name: string; durationDays: number } | null;
};

function getErrorMessage(error: unknown, fallback = "Terjadi kesalahan") {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.length > 0) return message;
  }
  return fallback;
}

export default function ErpPartnerDashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setToken = useAuthStore(s => s.setToken);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isAddTenantOpen, setIsAddTenantOpen] = useState(false);
  const [isAddPlanOpen, setIsAddPlanOpen] = useState(false);
  const [isManageTenantOpen, setIsManageTenantOpen] = useState(false);
  const [isPurchaseQuotaOpen, setIsPurchaseQuotaOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<PartnerTenant | null>(null);
  const [newTenant, setNewTenant] = useState({ name: "", slug: "", email: "" });
  const [newPricingPlan, setNewPricingPlan] = useState({ name: "", description: "", durationDays: 30, price: 500000 });
  const [tenantSearchQuery, setTenantSearchQuery] = useState("");
  const [partnerProfile, setPartnerProfile] = useState({ name: "", email: "", phone: "" });

  const { data: stats, isLoading } = useQuery({
    queryKey: ["erp-partner-stats"],
    queryFn: () => apiFetch<PartnerStats>("/api/erp/partner/stats"),
  });

  const { data: pricingPlans } = useQuery({
    queryKey: ["erp-partner-pricing"],
    queryFn: () => apiFetch<PricingPlan[]>("/api/erp/partner/pricing"),
    enabled: activeTab === "pricing" || activeTab === "licenses" || activeTab === "dashboard",
  });

  const { data: quota } = useQuery({
    queryKey: ["erp-partner-quota"],
    queryFn: () => apiFetch<PartnerQuota>("/api/erp/partner/quota"),
    enabled: activeTab === "licenses" || activeTab === "dashboard" || activeTab === "tenants",
  });

  const { data: invoices } = useQuery({
    queryKey: ["erp-partner-invoices"],
    queryFn: () => apiFetch<Invoice[]>("/api/erp/partner/invoices"),
    enabled: activeTab === "billing",
  });

  useEffect(() => {
    if (!stats) return;
    setPartnerProfile({
      name: stats.partnerName || "",
      email: stats.partnerEmail || "",
      phone: stats.partnerPhone || "",
    });
  }, [stats]);

  const updateProfileMutation = useMutation({
    mutationFn: (data: typeof partnerProfile) => apiFetch("/api/erp/partner/profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["erp-partner-stats"] });
      alert("Profil partner berhasil diperbarui!");
    },
    onError: (error: unknown) => {
      alert(getErrorMessage(error, "Gagal memperbarui profil"));
    }
  });

  const deletePlanMutation = useMutation({
    mutationFn: (planId: string) => apiFetch(`/api/erp/partner/pricing/${planId}`, {
      method: "DELETE",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["erp-partner-pricing"] });
      alert("Paket harga berhasil dihapus!");
    },
    onError: (error: unknown) => {
      alert(getErrorMessage(error, "Gagal menghapus paket harga"));
    }
  });

  const purchaseQuotaMutation = useMutation({
    mutationFn: (amount: number) => apiFetch("/api/erp/partner/purchase-quota", {
      method: "POST",
      body: JSON.stringify({ amount }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["erp-partner-quota"] });
      setIsPurchaseQuotaOpen(false);
      alert("Kuota berhasil ditambahkan! Invoice pembelian dapat dilihat di menu Billing.");
    },
    onError: (error: unknown) => {
      alert(getErrorMessage(error, "Gagal membeli kuota"));
    }
  });

  const createTenantMutation = useMutation({
    mutationFn: (data: typeof newTenant) => apiFetch("/api/erp/partner/tenants", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["erp-partner-stats"] });
      setIsAddTenantOpen(false);
      setNewTenant({ name: "", slug: "", email: "" });
      alert("Tenant baru berhasil dibuat! Detail login telah dikirim ke email admin.");
    },
    onError: (error: unknown) => {
      alert(getErrorMessage(error, "Gagal membuat tenant"));
    }
  });

  const createPlanMutation = useMutation({
    mutationFn: (data: typeof newPricingPlan) => apiFetch("/api/erp/partner/pricing", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["erp-partner-pricing"] });
      setIsAddPlanOpen(false);
      setNewPricingPlan({ name: "", description: "", durationDays: 30, price: 500000 });
      alert("Paket harga baru berhasil dibuat!");
    },
    onError: (error: unknown) => {
      alert(getErrorMessage(error, "Gagal membuat paket harga"));
    }
  });

  const generateLicenseMutation = useMutation({
    mutationFn: (data: { tenantId: string; planId: string }) => apiFetch("/api/erp/partner/generate-license", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["erp-partner-stats"] });
      queryClient.invalidateQueries({ queryKey: ["erp-partner-quota"] });
      setIsManageTenantOpen(false);
      alert("Lisensi berhasil di-generate dan diaktifkan untuk tenant!");
    },
    onError: (error: unknown) => {
      alert(getErrorMessage(error, "Gagal generate lisensi. Periksa kuota Anda."));
    }
  });

  const filteredTenants = useMemo<PartnerTenant[]>(() => {
    if (!stats?.tenants) return [];
    if (!tenantSearchQuery) return stats.tenants;

    const query = tenantSearchQuery.toLowerCase();
    return stats.tenants.filter((tenant) => 
      tenant.name.toLowerCase().includes(query) ||
      tenant.slug.toLowerCase().includes(query)
    );
  }, [stats, tenantSearchQuery]);

  const handleLogout = () => {
    setToken(null);
    router.push("/erp/login");
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
    { id: "tenants", label: "My Tenants", icon: <Building2 className="h-5 w-5" /> },
    { id: "licenses", label: "License Quota", icon: <Key className="h-5 w-5" /> },
    { id: "pricing", label: "My Pricing", icon: <Sparkles className="h-5 w-5" /> },
    { id: "billing", label: "Billing & Invoices", icon: <Wallet className="h-5 w-5" /> },
    { id: "settings", label: "Settings", icon: <Settings className="h-5 w-5" /> },
  ];

  return (
    <RequireErp allowedRoles={["partner"]}>
      <div className="fixed inset-0 bg-slate-50 text-slate-800 font-sans overflow-hidden">
        <div className="flex h-full w-full overflow-hidden">
          <aside className="w-72 border-r border-slate-200 bg-white flex flex-col hidden lg:flex shrink-0 overflow-hidden">
            {/* Sidebar Header */}
            <div className="p-8 pb-10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20 text-white">
                  <Users className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <div className="text-lg font-black tracking-tighter text-slate-900 whitespace-nowrap overflow-hidden text-ellipsis uppercase">
                    Partner <span className="text-blue-600">Portal</span>
                  </div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none mt-1">Reseller Access</div>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-8 overflow-y-auto custom-scrollbar pb-10">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4 px-4">Management</div>
                <div className="space-y-1">
                  {navItems.map((item) => (
                    <button 
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 text-left group relative",
                        activeTab === item.id 
                          ? "bg-blue-50 text-blue-600 font-bold shadow-sm shadow-blue-500/5" 
                          : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                      )}
                    >
                      <div className={cn(
                        "transition-colors shrink-0",
                        activeTab === item.id ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                      )}>
                        {item.icon}
                      </div>
                      <span className="text-xs font-bold tracking-tight uppercase">{item.label}</span>
                      {activeTab === item.id && (
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 h-5 w-1 bg-blue-600 rounded-l-full"></div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </nav>

            {/* Sidebar Footer */}
            <div className="p-6 mt-auto border-t border-slate-100 shrink-0 bg-white">
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all text-xs font-black uppercase tracking-widest group"
              >
                <LogOut className="h-5 w-5 shrink-0 group-hover:translate-x-1 transition-transform" /> 
                <span>Sign Out Portal</span>
              </button>
            </div>
          </aside>

          <main className="flex-1 relative overflow-y-scroll overflow-x-hidden bg-slate-50 scroll-smooth custom-scrollbar min-w-0">
            <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-md px-8 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Welcome, <span className="text-blue-600">Partner!</span></h2>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Livinova Reseller Management Network</p>
                </div>
                <div className="flex items-center gap-5">
                  <div className="h-10 w-10 rounded-xl border-2 border-white shadow-lg bg-slate-200 flex items-center justify-center overflow-hidden hover:scale-105 transition-transform cursor-pointer">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${stats?.partnerName || 'Partner'}`} alt="Avatar" className="h-full w-full object-cover" />
                  </div>
                </div>
              </div>
            </header>

            <div className="p-8 max-w-[1600px] mx-auto space-y-10">
              {activeTab === "dashboard" && (
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {[
                      { label: "My Tenants", val: stats?.totalTenants ?? "0", icon: <Building2 />, color: "text-blue-500", bg: "bg-blue-500/10" },
                      { label: "Active Licenses", val: stats?.totalLicenses ?? "0", icon: <Key />, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                      { label: "Total Projects", val: stats?.totalProjects ?? "0", icon: <Users />, color: "text-amber-500", bg: "bg-amber-500/10" },
                      { label: "Total GMV", val: formatRupiah(stats?.totalGMV ?? 0), icon: <TrendingUp />, color: "text-rose-500", bg: "bg-rose-500/10" },
                    ].map((s, i) => (
                      <Card key={i} className={cn("border-slate-200 bg-white rounded-3xl p-8 transition-all hover:shadow-xl hover:-translate-y-1")}>
                        <div className={cn("p-3 rounded-2xl w-fit mb-6", s.bg, s.color)}>{s.icon}</div>
                        <div className="text-3xl font-black text-slate-900 tracking-tight mb-1">{s.val}</div>
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{s.label}</div>
                      </Card>
                    ))}
                  </div>
                  
                  <div className="grid gap-10 lg:grid-cols-3">
                    <Card className="lg:col-span-2 border-slate-200 bg-white rounded-[2.5rem] p-10">
                      <div className="flex items-center justify-between mb-8">
                        <div>
                          <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">Recent Client Activity</h4>
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Real-time tenant onboarding & renewals</p>
                        </div>
                        <Button variant="ghost" className="text-blue-600 font-black text-[10px] tracking-widest uppercase">View All</Button>
                      </div>
                      <div className="space-y-6">
                        {stats?.tenants?.slice(0, 5).map((t, i) => (
                          <div key={i} className="flex items-center justify-between p-4 rounded-2xl border border-slate-50 bg-slate-50/30 hover:bg-white hover:border-blue-100 transition-all group">
                            <div className="flex items-center gap-4">
                              <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-slate-400 group-hover:text-blue-500 shadow-sm">
                                <Building2 className="h-5 w-5" />
                              </div>
                              <div>
                                <div className="text-sm font-bold text-slate-900">{t.name}</div>
                                <div className="text-[10px] text-slate-400 font-medium uppercase">Joined {new Date(t.createdAt).toLocaleDateString()}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs font-black text-emerald-500 uppercase">{t.status}</div>
                              <div className="text-[10px] text-slate-400 font-bold uppercase">{t.licenseCount} Licenses</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>

                    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2.5rem] p-10 text-white relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-125 transition-transform duration-1000">
                        <Key className="h-40 w-40" />
                      </div>
                      <div className="relative z-10">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8">Inventory Quick-Look</div>
                        <div className="text-6xl font-black tracking-tighter mb-4">
                          {(quota?.totalQuota ?? 0) - (quota?.usedQuota ?? 0)}
                        </div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-10">License-Months Available</div>
                        
                        <div className="space-y-6">
                          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <span>Quota Health</span>
                            <span className="text-blue-400">{Math.round(((quota?.usedQuota || 0) / (quota?.totalQuota || 1)) * 100)}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 rounded-full" 
                              style={{ width: `${((quota?.usedQuota || 0) / (quota?.totalQuota || 1)) * 100}%` }}
                            ></div>
                          </div>
                          <Button 
                            onClick={() => setActiveTab("licenses")}
                            className="w-full h-12 rounded-xl bg-white/10 hover:bg-white/20 text-white font-black uppercase text-[10px] tracking-widest mt-6"
                          >
                            Refill Inventory
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              )}

              {activeTab === "tenants" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight">My Client Tenants</h3>
                      <p className="text-sm text-slate-500 font-medium mt-1">Manage your portfolio of client companies</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <Input 
                          placeholder="Search by name or slug..." 
                          value={tenantSearchQuery}
                          onChange={(e) => setTenantSearchQuery(e.target.value)}
                          className="pl-12 w-80 bg-white border-slate-200 rounded-xl h-12 text-sm focus:ring-blue-500/20" 
                        />
                      </div>
                      <Button 
                        onClick={() => setIsAddTenantOpen(true)}
                        className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 h-12 flex items-center gap-2 shadow-lg shadow-blue-500/20"
                      >
                        <Plus className="h-4 w-4" />
                        ADD TENANT
                      </Button>
                    </div>
                  </div>

                  <Card className="border-slate-200 bg-white rounded-[2rem] overflow-hidden">
                    <div className="overflow-x-auto custom-scrollbar">
                      <table className="w-full text-left min-w-[800px]">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Client Company</th>
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Licenses</th>
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Projects</th>
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredTenants?.map((t) => (
                          <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-8 py-6">
                              <div className="text-sm font-bold text-slate-900">{t.name}</div>
                              <div className="text-xs text-slate-500 font-medium">/{t.slug}</div>
                            </td>
                            <td className="px-8 py-6">
                              <span className={cn(
                                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                                t.status === "active" ? "bg-emerald-500/10 text-emerald-500" : 
                                t.status === "trial" ? "bg-amber-500/10 text-amber-500" : "bg-rose-500/10 text-rose-500"
                              )}>
                                {t.status}
                              </span>
                            </td>
                            <td className="px-8 py-6 text-sm font-bold text-slate-600">{t.licenseCount}</td>
                            <td className="px-8 py-6 text-sm font-bold text-slate-600">{t.projectCount}</td>
                            <td className="px-8 py-6 text-right">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => {
                                  setSelectedTenant(t);
                                  setIsManageTenantOpen(true);
                                }}
                                className="text-slate-500 hover:text-blue-600 font-bold"
                              >
                                MANAGE
                              </Button>
                            </td>
                          </tr>
                        ))}
                        {(!filteredTenants || filteredTenants.length === 0) && (
                          <tr>
                            <td colSpan={5} className="px-8 py-12 text-center text-slate-400 italic">No tenants found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}

              {activeTab === "licenses" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">License Quota Hub</h3>
                      <p className="text-sm text-slate-500 font-medium mt-1">Monitor your available license inventory</p>
                    </div>
                    <Button 
                      onClick={() => setIsPurchaseQuotaOpen(true)}
                      className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black px-8 h-12 flex items-center gap-3 shadow-xl shadow-indigo-500/20"
                    >
                      <Plus className="h-5 w-5" />
                      PURCHASE QUOTA
                    </Button>
                  </div>

                  <div className="grid gap-8 lg:grid-cols-3">
                    <Card className="lg:col-span-2 border-slate-200 bg-white rounded-[2.5rem] p-10 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform duration-700">
                        <Key className="h-40 w-40 text-blue-600" />
                      </div>
                      <div className="relative z-10">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8">Quota Utilization</div>
                        <div className="flex items-end gap-4 mb-10">
                          <div className="text-7xl font-black text-slate-900 tracking-tighter">
                            {(quota?.totalQuota || 0) - (quota?.usedQuota || 0)}<span className="text-2xl text-slate-300 mx-2">/</span>{quota?.totalQuota || 0}
                          </div>
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Available / Total</div>
                        </div>
                        <div className="space-y-4">
                          <div className="flex justify-between items-end">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Inventory Status</span>
                            <span className="text-[10px] font-black text-blue-600 uppercase">
                              {Math.round(((quota?.usedQuota || 0) / (quota?.totalQuota || 1)) * 100)}% Consumed
                            </span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-1000" 
                              style={{ width: `${((quota?.usedQuota || 0) / (quota?.totalQuota || 1)) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </Card>

                    <Card className="bg-slate-900 rounded-[2.5rem] p-10 text-white flex flex-col justify-between group overflow-hidden">
                      <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-500">
                        <Sparkles className="h-24 w-24" />
                      </div>
                      <div className="relative z-10">
                        <h4 className="text-xl font-black tracking-tight mb-2">Need more?</h4>
                        <p className="text-xs text-slate-400 font-medium leading-relaxed">Expand your distribution capacity by purchasing bulk license quota at discounted rates.</p>
                      </div>
                      <div className="mt-10 relative z-10">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Tier Pricing</div>
                        <div className="space-y-3">
                          {[
                            { label: 'Starter Pack (10 Lic)', price: 'Rp 4.5jt', amount: 10 },
                            { label: 'Growth Pack (50 Lic)', price: 'Rp 20jt', amount: 50 },
                            { label: 'Mega Pack (100 Lic)', price: 'Rp 35jt', amount: 100 },
                          ].map((tier, i) => (
                            <button 
                              key={i} 
                              onClick={() => {
                                if (confirm(`Beli ${tier.label} seharga ${tier.price}?`)) {
                                  purchaseQuotaMutation.mutate(tier.amount);
                                }
                              }}
                              disabled={purchaseQuotaMutation.isPending}
                              className="w-full flex justify-between items-center py-3 border-b border-white/5 last:border-0 hover:bg-white/5 px-3 rounded-xl transition-all group/tier disabled:opacity-50"
                            >
                              <div className="flex items-center gap-3">
                                {purchaseQuotaMutation.isPending ? (
                                  <Loader2 className="h-3 w-3 animate-spin text-blue-400" />
                                ) : (
                                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500 group-hover/tier:scale-150 transition-transform" />
                                )}
                                <span className="text-[10px] font-bold text-slate-300 group-hover/tier:text-white transition-colors">{tier.label}</span>
                              </div>
                              <span className="text-[10px] font-black text-emerald-400">{tier.price}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              )}

              {activeTab === "pricing" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">My Distribution Pricing</h3>
                      <p className="text-sm text-slate-500 font-medium mt-1">Set your own profit margins for tenant clients</p>
                    </div>
                    <Button 
                      onClick={() => setIsAddPlanOpen(true)}
                      className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black px-8 h-12 flex items-center gap-3 shadow-xl shadow-emerald-500/20"
                    >
                      <Plus className="h-5 w-5" />
                      CREATE PRICE PLAN
                    </Button>
                  </div>

                  <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {(pricingPlans || []).map((plan) => (
                      <Card key={plan.id} className="border-slate-200 bg-white p-10 rounded-[2.5rem] flex flex-col justify-between hover:shadow-2xl hover:-translate-y-2 transition-all group border-2 border-transparent hover:border-emerald-500/20">
                        <div>
                          <div className="flex justify-between items-start mb-6">
                            <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">{plan.durationDays} DAYS</span>
                            <span className={cn(
                              "px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest",
                              plan.ownerType === 'SYSTEM' ? "bg-slate-100 text-slate-500" : "bg-blue-50 text-blue-600"
                            )}>
                              {plan.ownerType === 'SYSTEM' ? 'GLOBAL' : 'MY PLAN'}
                            </span>
                          </div>
                          <h4 className="text-2xl font-black text-slate-900 tracking-tight mb-2">{plan.name}</h4>
                          <p className="text-xs text-slate-400 font-medium leading-relaxed mb-8">{plan.description}</p>
                        </div>
                        <div className="pt-8 border-t border-slate-50 flex items-end justify-between">
                          <div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Your Price</div>
                            <div className="text-3xl font-black text-slate-900 tracking-tighter">{formatRupiah(plan.price)}</div>
                          </div>
                          {plan.ownerType === 'PARTNER' && (
                            <button 
                              onClick={() => {
                                if (confirm("Hapus paket harga ini?")) {
                                  deletePlanMutation.mutate(plan.id);
                                }
                              }}
                              disabled={deletePlanMutation.isPending}
                              className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors disabled:opacity-50"
                            >
                              {deletePlanMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-5 w-5" />}
                            </button>
                          )}
                        </div>
                      </Card>
                    ))}
                    {(!pricingPlans || pricingPlans.length === 0) && (
                      <div className="lg:col-span-3 p-24 text-center border-2 border-dashed border-slate-200 rounded-[3rem] bg-slate-50/50">
                        <Sparkles className="h-16 w-16 text-slate-200 mx-auto mb-6" />
                        <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-xs">No Custom Plans Found</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "billing" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Tenant Billing & Invoices</h3>
                      <p className="text-sm text-slate-500 font-medium mt-1">Track payments and invoices from your clients</p>
                    </div>
                  </div>

                  <Card className="border-slate-200 bg-white rounded-[2.5rem] overflow-hidden">
                    <div className="overflow-x-auto custom-scrollbar">
                      <table className="w-full text-left min-w-[800px]">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Invoice ID</th>
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Client</th>
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Plan</th>
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Amount</th>
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {invoices?.map((inv) => (
                          <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-tighter">INV-{inv.id.slice(0, 8).toUpperCase()}</td>
                            <td className="px-8 py-6">
                              <div className="text-sm font-bold text-slate-900">{inv.tenant?.name}</div>
                              <div className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">/{inv.tenant?.slug}</div>
                            </td>
                            <td className="px-8 py-6">
                              <div className="text-sm font-bold text-slate-700">{inv.pricingPlan?.name}</div>
                              <div className="text-[10px] text-slate-400 font-bold uppercase">{inv.pricingPlan?.durationDays} Days</div>
                            </td>
                            <td className="px-8 py-6 text-sm font-black text-slate-900">{formatRupiah(inv.amount)}</td>
                            <td className="px-8 py-6">
                              <span className={cn(
                                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                                inv.status === "paid" || inv.status === "approved" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                              )}>
                                {inv.status}
                              </span>
                            </td>
                            <td className="px-8 py-6 text-right text-xs font-bold text-slate-500">
                              {new Date(inv.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                        {(!invoices || invoices.length === 0) && (
                          <tr>
                            <td colSpan={6} className="px-8 py-12 text-center text-slate-400 italic">No billing records found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}

              {activeTab === "settings" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-10">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Partner Settings</h3>
                  <div className="grid gap-8 max-w-4xl">
                    <Card className="border-slate-200 bg-white rounded-[2.5rem] p-10">
                      <div className="space-y-8">
                        <div className="grid grid-cols-2 gap-8">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Company Display Name</Label>
                            <Input 
                              value={partnerProfile.name} 
                              onChange={(e) => setPartnerProfile({...partnerProfile, name: e.target.value})}
                              className="h-12 rounded-xl bg-slate-50 border-slate-200 font-bold" 
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Support Email</Label>
                            <Input 
                              value={partnerProfile.email} 
                              onChange={(e) => setPartnerProfile({...partnerProfile, email: e.target.value})}
                              className="h-12 rounded-xl bg-slate-50 border-slate-200 font-bold" 
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Phone Number</Label>
                            <Input 
                              value={partnerProfile.phone} 
                              onChange={(e) => setPartnerProfile({...partnerProfile, phone: e.target.value})}
                              className="h-12 rounded-xl bg-slate-50 border-slate-200 font-bold" 
                            />
                          </div>
                        </div>
                        <Button 
                          onClick={() => updateProfileMutation.mutate(partnerProfile)}
                          disabled={updateProfileMutation.isPending}
                          className="rounded-xl bg-slate-900 text-white font-black px-10 h-12 uppercase text-[10px] tracking-widest shadow-xl disabled:opacity-50"
                        >
                          {updateProfileMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          Update Profile
                        </Button>
                      </div>
                    </Card>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Add Plan Modal */}
      {isAddPlanOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={() => !createPlanMutation.isPending && setIsAddPlanOpen(false)}></div>
          <Card className="relative w-full max-w-xl bg-white border-slate-200 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between p-8 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">New Distribution Plan</h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Create a custom price for your clients</p>
                </div>
              </div>
              <button onClick={() => setIsAddPlanOpen(false)} className="h-10 w-10 rounded-xl hover:bg-black/5 flex items-center justify-center text-slate-400 transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Plan Name</Label>
                <Input value={newPricingPlan.name} onChange={(e) => setNewPricingPlan({...newPricingPlan, name: e.target.value})} placeholder="e.g. Exclusive Developer 6mo" className="h-12 rounded-xl bg-slate-50" />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Duration (Days)</Label>
                  <Input type="number" value={newPricingPlan.durationDays} onChange={(e) => setNewPricingPlan({...newPricingPlan, durationDays: parseInt(e.target.value)})} className="h-12 rounded-xl bg-slate-50" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Your Price (IDR)</Label>
                  <Input type="number" value={newPricingPlan.price} onChange={(e) => setNewPricingPlan({...newPricingPlan, price: parseInt(e.target.value)})} className="h-12 rounded-xl bg-slate-50" />
                </div>
              </div>
            </div>
            <div className="p-8 border-t border-slate-200 bg-slate-50 flex gap-4">
              <Button variant="ghost" onClick={() => setIsAddPlanOpen(false)} className="flex-1 h-14 rounded-2xl text-slate-500 font-bold uppercase text-[10px] tracking-widest">Cancel</Button>
              <Button onClick={() => createPlanMutation.mutate(newPricingPlan)} className="flex-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black px-12 h-14 rounded-2xl shadow-xl shadow-emerald-500/20">
                {createPlanMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "PUBLISH PLAN"}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Manage Tenant (Generate License) Modal */}
      {isManageTenantOpen && selectedTenant && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={() => !generateLicenseMutation.isPending && setIsManageTenantOpen(false)}></div>
          <Card className="relative w-full max-w-xl bg-white border-slate-200 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between p-8 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                  <Key className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Generate License Key</h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Assign license to {selectedTenant.name}</p>
                </div>
              </div>
              <button onClick={() => setIsManageTenantOpen(false)} className="h-10 w-10 rounded-xl hover:bg-black/5 flex items-center justify-center text-slate-400 transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-8 space-y-8">
              <div className="p-6 bg-blue-50 border border-blue-100 rounded-[2rem] flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Available Quota</div>
                  <div className="text-2xl font-black text-blue-600 tracking-tighter">{(quota?.totalQuota || 0) - (quota?.usedQuota || 0)} License-Months</div>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center text-blue-600 shadow-sm shadow-blue-500/10">
                  <Wallet className="h-6 w-6" />
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Select Active Package</Label>
                <div className="grid gap-3">
                  {(pricingPlans || []).map((plan) => (
                    <button
                      key={plan.id}
                      onClick={() => generateLicenseMutation.mutate({ tenantId: selectedTenant.id, planId: plan.id })}
                      disabled={generateLicenseMutation.isPending || ((quota?.totalQuota || 0) - (quota?.usedQuota || 0)) < (plan.durationDays / 30)}
                      className="flex items-center justify-between p-5 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-blue-500/50 hover:shadow-xl hover:-translate-y-1 transition-all group disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:border-slate-100 disabled:hover:shadow-none"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-slate-400 group-hover:text-blue-600 shadow-sm">
                          <Plus className="h-5 w-5" />
                        </div>
                        <div className="text-left">
                          <div className="text-sm font-black text-slate-900 uppercase tracking-tight">{plan.name}</div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase">{plan.durationDays} Days Duration</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-black text-blue-600 uppercase">Use {Math.ceil(plan.durationDays / 30)} Quota</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-8 border-t border-slate-200 bg-slate-50">
              <Button variant="ghost" onClick={() => setIsManageTenantOpen(false)} className="w-full h-12 rounded-xl text-slate-500 font-bold uppercase text-[10px] tracking-widest">Close Manager</Button>
            </div>
          </Card>
        </div>
      )}

      {isAddTenantOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={() => !createTenantMutation.isPending && setIsAddTenantOpen(false)}></div>
          <Card className="relative w-full max-w-xl bg-white border-slate-200 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between p-8 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Onboard New Tenant</h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Create a new client company account</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddTenantOpen(false)}
                className="h-10 w-10 rounded-xl hover:bg-black/5 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Company Name</Label>
                <Input 
                  value={newTenant.name}
                  onChange={(e) => setNewTenant({...newTenant, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
                  placeholder="e.g. PT Properti Sejahtera" 
                  className="bg-slate-100 border-slate-200 rounded-xl h-12 text-sm focus:ring-blue-500/20" 
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Company Slug</Label>
                  <Input 
                    value={newTenant.slug}
                    onChange={(e) => setNewTenant({...newTenant, slug: e.target.value})}
                    placeholder="e.g. properti-sejahtera" 
                    className="bg-slate-100 border-slate-200 rounded-xl h-12 text-sm focus:ring-blue-500/20" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Admin Email</Label>
                  <Input 
                    value={newTenant.email}
                    onChange={(e) => setNewTenant({...newTenant, email: e.target.value})}
                    type="email"
                    placeholder="admin@properti.co.id" 
                    className="bg-slate-100 border-slate-200 rounded-xl h-12 text-sm focus:ring-blue-500/20" 
                  />
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-slate-200 bg-slate-50 flex gap-4">
              <Button 
                variant="ghost" 
                onClick={() => setIsAddTenantOpen(false)}
                className="flex-1 h-14 rounded-2xl text-slate-500 font-bold hover:bg-slate-100"
                disabled={createTenantMutation.isPending}
              >
                CANCEL
              </Button>
              <Button 
                onClick={() => createTenantMutation.mutate(newTenant)}
                className="flex-2 bg-blue-600 hover:bg-blue-700 text-white font-black px-12 h-14 rounded-2xl shadow-xl shadow-blue-500/20 disabled:opacity-50"
                disabled={createTenantMutation.isPending || !newTenant.name || !newTenant.email || !newTenant.slug}
              >
                {createTenantMutation.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "CREATE TENANT"
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Purchase Quota Modal */}
      {isPurchaseQuotaOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={() => !purchaseQuotaMutation.isPending && setIsPurchaseQuotaOpen(false)}></div>
          <Card className="relative w-full max-w-xl bg-white border-slate-200 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between p-8 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                  <Wallet className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Purchase License Quota</h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Expand your distribution capacity</p>
                </div>
              </div>
              <button onClick={() => setIsPurchaseQuotaOpen(false)} className="h-10 w-10 rounded-xl hover:bg-black/5 flex items-center justify-center text-slate-400 transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid gap-4">
                {[
                  { label: 'Starter Pack', amount: 10, price: 4500000, desc: 'Ideal for small distributors' },
                  { label: 'Growth Pack', amount: 50, price: 20000000, desc: 'Best value for growing agencies' },
                  { label: 'Mega Pack', amount: 100, price: 35000000, desc: 'Enterprise level distribution' },
                ].map((tier, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (confirm(`Konfirmasi pembelian ${tier.label} seharga ${formatRupiah(tier.price)}?`)) {
                        purchaseQuotaMutation.mutate(tier.amount);
                      }
                    }}
                    disabled={purchaseQuotaMutation.isPending}
                    className="flex items-center justify-between p-6 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-indigo-500/50 hover:shadow-xl hover:-translate-y-1 transition-all group disabled:opacity-50"
                  >
                    <div className="text-left">
                      <div className="flex items-center gap-3">
                        {purchaseQuotaMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin text-indigo-600" /> : <div className="h-2 w-2 rounded-full bg-indigo-500" />}
                        <div className="text-sm font-black text-slate-900 uppercase tracking-tight">{tier.label}</div>
                      </div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase ml-5">{tier.amount} License-Months</div>
                      <div className="text-[9px] text-slate-300 font-medium mt-1 ml-5">{tier.desc}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-indigo-600 tracking-tight">{formatRupiah(tier.price)}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="p-8 border-t border-slate-200 bg-slate-50">
              <Button variant="ghost" onClick={() => setIsPurchaseQuotaOpen(false)} className="w-full h-12 rounded-xl text-slate-500 font-bold uppercase text-[10px] tracking-widest">Close</Button>
            </div>
          </Card>
        </div>
      )}
    </RequireErp>
  );
}
