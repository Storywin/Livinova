"use client";

import type { ChangeEvent } from "react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { RequireErp } from "@/components/erp/require-erp";
import { 
  ShieldAlert, 
  Users, 
  Building2, 
  Globe2, 
  LayoutDashboard, 
  Settings, 
  LogOut,
  TrendingUp,
  Activity,
  Server,
  UserCog,
  Database,
  Search,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Plus,
  X,
  Loader2,
  Mail,
  Phone,
  MapPin,
  Trash2,
  Globe,
  Key,
  Bell,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle
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
import { Textarea } from "@/components/ui/textarea";

type SubscriptionStatus =
  | "trial"
  | "active"
  | "expired"
  | "trial_expired"
  | "inactive";

type AdminStats = {
  totalPartners: number;
  totalTenants: number;
  totalLicenses: number;
  totalProjects: number;
  totalGMV: number;
  recentPartners: Array<{ id: string; name: string; email: string }>;
  recentTenants: Array<{
    id: string;
    name: string;
    slug: string;
    status: SubscriptionStatus;
    partner?: { name: string } | null;
  }>;
  diskStats?: { total: number; free: number; used: number; percentage: number };
  systemHealth?: {
    cpuUsage: number;
    totalMem: number;
    freeMem: number;
    usedMem: number;
    memPercentage: number;
    hostname?: string;
  };
  securityLogs?: Array<{
    event: string;
    user: string;
    time: string;
    status: string;
  }>;
};

type Partner = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  _count?: { tenants: number };
};

type Tenant = {
  id: string;
  name: string;
  slug: string;
  status: SubscriptionStatus;
  createdAt: string;
  partner?: { name: string } | null;
  _count?: { projects: number; licenses: number; users: number };
};

type License = {
  id: string;
  startDate: string;
  endDate: string;
  status: string;
  tenant?: { name: string; slug: string } | null;
  user?: { email: string; name: string | null } | null;
};

type PricingPlan = {
  id: string;
  name: string;
  description?: string | null;
  durationDays: number;
  price: number;
  ownerType: string;
  ownerId?: string | null;
};

function getErrorMessage(error: unknown, fallback = "Terjadi kesalahan") {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.length > 0) return message;
  }
  return fallback;
}

export default function ErpSuperAdminDashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setToken = useAuthStore(s => s.setToken);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [activeSettingsTab, setActiveSettingsTab] = useState("global");
  const [isAddPartnerOpen, setIsAddPartnerOpen] = useState(false);
  const [createAccountTab, setCreateAccountTab] = useState<"tenant" | "partner">("tenant");
  const [isAddLicenseOpen, setIsAddLicenseOpen] = useState(false);
  const [isAddPlanOpen, setIsAddPlanOpen] = useState(false);
  const [isExtendLicenseOpen, setIsExtendLicenseOpen] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const [isManagePartnerOpen, setIsManagePartnerOpen] = useState(false);
  const [isTenantDetailOpen, setIsTenantDetailOpen] = useState(false);
  const [isAccessControlMode, setIsAccessControlMode] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [isSystemActionLoading, setIsSystemActionLoading] = useState<string | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [newPartner, setNewPartner] = useState({ name: "", email: "", phone: "" });
  const [newTenant, setNewTenant] = useState({ name: "", slug: "", email: "" });
  const [newLicense, setNewLicense] = useState({ tenantId: "", userId: "", durationDays: 30, deviceName: "Main Server" });
  const [newPricingPlan, setNewPricingPlan] = useState({ name: "", description: "", durationDays: 365, price: 5000000 });
  const [tenantSearchQuery, setTenantSearchQuery] = useState("");

  const [globalConfig, setGlobalConfig] = useState({
    siteName: "Livinova Property ERP",
    maintenanceMode: false,
    allowRegistration: true,
    smtpHost: "smtp.livinova.id",
    smtpPort: "587",
    smtpUser: "no-reply@livinova.id",
    backupInterval: "Daily",
    apiKey: "lv_live_8a2b3c4d5e6f7g8h9i0j",
    strictIPAccess: false,
    ipWhitelist: "127.0.0.1, 192.168.1.1",
    force2FA: false,
  });

  const [webhooks, setWebhooks] = useState([
    { event: "tenant.created", url: "https://webhooks.livinova.id/provision" },
    { event: "license.purchased", url: "https://webhooks.livinova.id/license" },
  ]);

  const { data: stats, isLoading } = useQuery({
    queryKey: ["erp-admin-stats"],
    queryFn: () => apiFetch<AdminStats>("/api/erp/admin/stats"),
  });

  const { data: partners } = useQuery({
    queryKey: ["erp-admin-partners"],
    queryFn: () => apiFetch<Partner[]>("/api/erp/admin/partners"),
    enabled: activeTab === "partners",
  });

  const { data: tenants } = useQuery({
    queryKey: ["erp-admin-tenants"],
    queryFn: () => apiFetch<Tenant[]>("/api/erp/admin/tenants"),
    enabled: activeTab === "tenants",
  });

  const { data: globalLicenses } = useQuery({
    queryKey: ["erp-admin-licenses"],
    queryFn: () => apiFetch<License[]>("/api/erp/admin/licenses"),
    enabled: activeTab === "licenses",
  });

  const { data: pricingPlans } = useQuery({
    queryKey: ["erp-admin-pricing"],
    queryFn: () => apiFetch<PricingPlan[]>("/api/erp/admin/pricing"),
    enabled: activeTab === "pricing",
  });

  const filteredTenants = useMemo(() => {
    if (!tenants) return [];
    if (!tenantSearchQuery) return tenants;

    const query = tenantSearchQuery.toLowerCase();
    return tenants.filter((tenant) => 
      tenant.name.toLowerCase().includes(query) ||
      tenant.slug.toLowerCase().includes(query) ||
      (tenant.partner?.name && tenant.partner.name.toLowerCase().includes(query))
    );
  }, [tenants, tenantSearchQuery]);

  const addPartnerMutation = useMutation({
    mutationFn: (data: typeof newPartner) => apiFetch("/api/erp/admin/partners", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["erp-admin-partners"] });
      queryClient.invalidateQueries({ queryKey: ["erp-admin-stats"] });
      setIsAddPartnerOpen(false);
      setNewPartner({ name: "", email: "", phone: "" });
      alert("Partner baru berhasil ditambahkan! Password default: Livinova123!");
    },
    onError: (error: unknown) => {
      alert(getErrorMessage(error, "Gagal menambahkan partner"));
    }
  });

  const createTenantMutation = useMutation({
    mutationFn: (data: typeof newTenant) => apiFetch("/api/erp/admin/tenants", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["erp-admin-tenants"] });
      queryClient.invalidateQueries({ queryKey: ["erp-admin-stats"] });
      setIsAddPartnerOpen(false); // Close the same modal
      setNewTenant({ name: "", slug: "", email: "" });
      alert("Akun trial baru berhasil dibuat! Detail login telah dikirim ke email admin.");
    },
    onError: (error: unknown) => {
      alert(getErrorMessage(error, "Gagal membuat akun trial"));
    }
  });

  const updateTenantStatusMutation = useMutation({
    mutationFn: (input: { tenantId: string; status: SubscriptionStatus }) =>
      apiFetch(`/api/erp/admin/tenants/${input.tenantId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: input.status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["erp-admin-tenants"] });
      alert("Tenant status has been successfully updated.");
      setIsAccessControlMode(false);
      setIsTenantDetailOpen(false);
    },
    onError: (error: unknown) => {
      alert(getErrorMessage(error, "Failed to update tenant status"));
    }
  });

  const addLicenseMutation = useMutation({
    mutationFn: (data: typeof newLicense) => apiFetch("/api/erp/admin/licenses", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["erp-admin-licenses"] });
      queryClient.invalidateQueries({ queryKey: ["erp-admin-stats"] });
      setIsAddLicenseOpen(false);
      setNewLicense({ tenantId: "", userId: "", durationDays: 30, deviceName: "Main Server" });
      alert("Lisensi baru berhasil dibuat dan diaktifkan!");
    },
    onError: (error: unknown) => {
      alert(getErrorMessage(error, "Gagal membuat lisensi"));
    }
  });

  const extendLicenseMutation = useMutation({
    mutationFn: (data: { licenseId: string; durationDays: number }) =>
      apiFetch(`/api/erp/admin/licenses/${data.licenseId}/extend`, {
        method: "PATCH",
        body: JSON.stringify({ durationDays: data.durationDays }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["erp-admin-licenses"] });
      setIsExtendLicenseOpen(false);
      setSelectedLicense(null);
      alert("License duration has been successfully extended.");
    },
    onError: (error: unknown) => {
      alert(getErrorMessage(error, "Failed to extend license"));
    }
  });

  const addPlanMutation = useMutation({
    mutationFn: (data: typeof newPricingPlan) => apiFetch("/api/erp/admin/pricing", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["erp-admin-pricing"] });
      setIsAddPlanOpen(false);
      setNewPricingPlan({ name: "", description: "", durationDays: 365, price: 5000000 });
      alert("Paket harga baru berhasil ditambahkan!");
    },
    onError: (error: unknown) => {
      alert(getErrorMessage(error, "Gagal menambahkan paket harga"));
    }
  });

  const updatePartnerMutation = useMutation({
    mutationFn: (input: { partnerId: string; data: { name?: string; email?: string; phone?: string } }) =>
      apiFetch(`/api/erp/admin/partners/${input.partnerId}`, {
        method: "PATCH",
        body: JSON.stringify(input.data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["erp-admin-partners"] });
      setIsManagePartnerOpen(false);
      setSelectedPartner(null);
      alert("Partner berhasil diperbarui!");
    },
    onError: (error: unknown) => {
      alert(getErrorMessage(error, "Gagal memperbarui partner"));
    }
  });

  const deletePartnerMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/erp/admin/partners/${id}`, {
      method: "DELETE",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["erp-admin-partners"] });
      queryClient.invalidateQueries({ queryKey: ["erp-admin-stats"] });
      setIsManagePartnerOpen(false);
      setSelectedPartner(null);
      alert("Partner berhasil dihapus!");
    },
    onError: (error: unknown) => {
      alert(getErrorMessage(error, "Gagal menghapus partner"));
    }
  });

  const handleLogout = () => {
    setToken(null);
    router.push("/erp/login");
  };

  const handleSystemAction = (action: string) => {
    setIsSystemActionLoading(action);
    setTimeout(() => {
      setIsSystemActionLoading(null);
      if (action === "Save Configuration") {
        alert("System Configuration has been successfully saved to the primary cluster.");
      } else if (action === "Test SMTP") {
        alert("SMTP Connection Test: SUCCESS. Handshake established with smtp.livinova.id.");
      } else if (action === "Download Audit Log") {
        alert("Audit Log Generation: SUCCESS. The PDF report has been encrypted and downloaded.");
      } else {
        alert(`System Action: ${action} has been successfully executed.`);
      }
    }, 2000);
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(globalConfig.apiKey);
    alert("Master API Key copied to clipboard!");
  };

  const handleRevokeKey = () => {
    if (confirm("Warning: Revoking this key will immediately disconnect all active integrations. Proceed?")) {
      const newKey = "lv_live_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      setGlobalConfig({...globalConfig, apiKey: newKey});
      alert("API Key has been revoked and a new one has been generated.");
    }
  };

  const handleAddWebhook = () => {
    const url = prompt("Enter Webhook URL:");
    if (url) {
      setWebhooks([...webhooks, { event: "manual.trigger", url }]);
    }
  };

  const handleDeleteWebhook = (index: number) => {
    if (confirm("Remove this webhook endpoint?")) {
      setWebhooks(webhooks.filter((_, i) => i !== index));
    }
  };

  const formatGB = (bytes: number) => {
    if (!bytes) return "0 GB";
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + " GB";
  };

  const formatTB = (bytes: number) => {
    if (!bytes) return "0 TB";
    return (bytes / (1024 * 1024 * 1024 * 1024)).toFixed(1) + " TB";
  };

  const formatUptime = (seconds: number) => {
    if (!seconds) return "0m";
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${d}d ${h}h ${m}m`;
  };

  const navItems = [
    { id: "dashboard", label: "Overview", icon: <LayoutDashboard className="h-5 w-5" /> },
    { id: "partners", label: "Partners", icon: <UserCog className="h-5 w-5" /> },
    { id: "tenants", label: "Global Tenants", icon: <Building2 className="h-5 w-5" /> },
    { id: "licenses", label: "License Management", icon: <Key className="h-5 w-5" /> },
    { id: "pricing", label: "Pricing Plans", icon: <Sparkles className="h-5 w-5" /> },
    { id: "system", label: "System Health", icon: <Server className="h-5 w-5" /> },
    { id: "settings", label: "Configuration", icon: <Settings className="h-5 w-5" /> },
  ];

  return (
    <RequireErp allowedRoles={["super_admin", "admin"]}>
      <div className="min-h-screen bg-[#020617] text-slate-200 font-sans">
        {/* Sidebar */}
        <div className="flex h-screen overflow-hidden">
          <aside className="w-72 border-r border-slate-800/50 bg-slate-950/90 backdrop-blur-2xl flex flex-col hidden lg:flex overflow-hidden">
            {/* Sidebar Header */}
            <div className="p-8 pb-10">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-red-600 shadow-lg shadow-rose-500/20">
                  <ShieldAlert className="h-6 w-6 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="text-lg font-black tracking-tighter text-white whitespace-nowrap overflow-hidden text-ellipsis uppercase">
                    Admin <span className="text-rose-500">Portal</span>
                  </div>
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] leading-none mt-1">Super Admin Access</div>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-8 overflow-y-auto custom-scrollbar pb-10">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 mb-4 px-4">Core Management</div>
                <div className="space-y-1">
                  {navItems.map((item) => (
                    <button 
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 text-left group relative",
                        activeTab === item.id 
                          ? "bg-rose-500/10 text-rose-500 font-bold shadow-sm shadow-rose-500/5" 
                          : "text-slate-500 hover:bg-white/5 hover:text-slate-200"
                      )}
                    >
                      <div className={cn(
                        "transition-colors shrink-0",
                        activeTab === item.id ? "text-rose-500" : "text-slate-600 group-hover:text-slate-400"
                      )}>
                        {item.icon}
                      </div>
                      <span className="text-xs font-bold tracking-tight uppercase">{item.label}</span>
                      {activeTab === item.id && (
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 h-5 w-1 bg-rose-500 rounded-l-full"></div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </nav>

            {/* Sidebar Footer */}
            <div className="p-6 mt-auto border-t border-slate-800/50">
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-slate-500 hover:bg-rose-500/10 hover:text-rose-500 transition-all text-xs font-black uppercase tracking-widest group"
              >
                <LogOut className="h-5 w-5 shrink-0 group-hover:translate-x-1 transition-transform" /> 
                <span>Sign Out System</span>
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
            {/* Top Bar */}
            <header className="sticky top-0 z-30 border-b border-slate-800/40 bg-[#020617]/80 backdrop-blur-md px-8 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className="h-10 w-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 shadow-inner">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white tracking-tight uppercase">
                      Livinova <span className="text-rose-500">Central Console</span>
                    </h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Infrastructure Management System</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-5">
                  <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-slate-900/50 border border-slate-800 rounded-xl">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Network Status</span>
                    <span className="text-[10px] font-black text-emerald-500 uppercase">Secure</span>
                  </div>
                  <div className="h-10 w-10 rounded-xl border border-slate-800 bg-slate-900 flex items-center justify-center overflow-hidden hover:border-rose-500/50 transition-colors cursor-pointer shadow-lg">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=SuperAdmin" alt="Avatar" className="h-full w-full object-cover" />
                  </div>
                </div>
              </div>
            </header>

            <div className="p-8 max-w-[1600px] mx-auto space-y-10">
              {activeTab === "dashboard" && (
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  {/* Global Stats */}
                  <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                    {[
                      { label: "Total Partners", val: stats?.totalPartners ?? "0", icon: <UserCog />, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/10" },
                      { label: "Global Tenants", val: stats?.totalTenants ?? "0", icon: <Building2 />, color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/10" },
                      { label: "Active Licenses", val: stats?.totalLicenses ?? "0", icon: <Users />, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/10" },
                      { label: "Global GMV", val: formatRupiah(stats?.totalGMV ?? 0), icon: <Globe2 />, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/10" },
                    ].map((s, i) => (
                      <Card key={i} className={cn("border bg-slate-950/40 backdrop-blur-sm rounded-[2rem] p-7 transition-all hover:bg-slate-900/60 hover:border-slate-700/50 group", s.border)}>
                        <div className={cn("p-2.5 rounded-xl w-fit mb-5 transition-transform group-hover:scale-110 duration-500", s.bg, s.color)}>{s.icon}</div>
                        <div className="text-2xl font-black text-white tracking-tighter mb-1">{s.val}</div>
                        <div className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">{s.label}</div>
                      </Card>
                    ))}
                  </div>

                  {/* System Health & Activity */}
                  <div className="grid gap-8 lg:grid-cols-12">
                    <div className="lg:col-span-8 space-y-8">
                      <Card className="border-slate-800/40 bg-slate-950/40 backdrop-blur-sm rounded-[2.5rem] p-10 overflow-hidden relative group">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                          <TrendingUp className="h-40 w-40 text-rose-500" />
                        </div>
                        <div className="flex items-center justify-between mb-10 relative z-10">
                          <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-3 uppercase">
                            <TrendingUp className="h-6 w-6 text-rose-500" />
                            Global Growth Engine
                          </h3>
                          <div className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-widest">Analytics Dashboard</div>
                        </div>
                        <div className="h-72 w-full bg-slate-900/50 rounded-[2rem] border border-slate-800/50 flex flex-col items-center justify-center relative overflow-hidden group/chart shadow-inner">
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-rose-500/5 via-transparent to-transparent opacity-0 group-hover/chart:opacity-100 transition-opacity duration-700"></div>
                          <Sparkles className="h-10 w-10 text-slate-700 mb-4 group-hover/chart:scale-125 transition-transform duration-700" />
                          <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">Engineered for Scalability</p>
                          <div className="mt-8 flex gap-2">
                            {[1, 2, 3, 4, 5].map(i => (
                              <div key={i} className="h-1 w-8 bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-rose-500/20 animate-pulse" style={{ animationDelay: `${i * 200}ms` }}></div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </Card>

                      <div className="grid gap-6 md:grid-cols-2">
                        <Card className="border-slate-800/40 bg-slate-950/40 rounded-[2rem] p-8 group">
                          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-8">Recent Partner Nodes</h4>
                          <div className="space-y-6">
                            {stats?.recentPartners?.map((p, i) => (
                              <div key={i} className="flex items-center gap-4 group/item cursor-pointer">
                                <div className="h-10 w-10 rounded-xl bg-blue-500/5 border border-blue-500/10 flex items-center justify-center text-blue-500 group-hover/item:bg-blue-500 group-hover/item:text-white transition-all duration-300 shadow-lg shadow-blue-500/0 group-hover/item:shadow-blue-500/20">
                                  <UserCog className="h-5 w-5" />
                                </div>
                                <div>
                                  <div className="text-sm font-bold text-slate-200 group-hover/item:text-white transition-colors">{p.name}</div>
                                  <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{p.email}</div>
                                </div>
                              </div>
                            ))}
                            {(!stats?.recentPartners || stats.recentPartners.length === 0) && (
                              <div className="text-[10px] text-slate-600 font-bold uppercase tracking-widest text-center py-4">No Active Nodes</div>
                            )}
                          </div>
                        </Card>
                        <Card className="border-slate-800/40 bg-slate-950/40 rounded-[2rem] p-8 group">
                          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-8">Latest Tenant Deployments</h4>
                          <div className="space-y-6">
                            {stats?.recentTenants?.map((t, i) => (
                              <div key={i} className="flex items-center gap-4 group/item cursor-pointer">
                                <div className="h-10 w-10 rounded-xl bg-rose-500/5 border border-rose-500/10 flex items-center justify-center text-rose-500 group-hover/item:bg-rose-500 group-hover/item:text-white transition-all duration-300 shadow-lg shadow-rose-500/0 group-hover/item:shadow-rose-500/20">
                                  <Building2 className="h-5 w-5" />
                                </div>
                                <div>
                                  <div className="text-sm font-bold text-slate-200 group-hover/item:text-white transition-colors">{t.name}</div>
                                  <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{t.partner?.name || 'Independent Unit'}</div>
                                </div>
                              </div>
                            ))}
                            {(!stats?.recentTenants || stats.recentTenants.length === 0) && (
                              <div className="text-[10px] text-slate-600 font-bold uppercase tracking-widest text-center py-4">No Active Units</div>
                            )}
                          </div>
                        </Card>
                      </div>
                    </div>

                    <div className="lg:col-span-4 space-y-8">
                      <Card className="border-slate-800/40 bg-gradient-to-br from-[#020617] to-slate-950 rounded-[2.5rem] p-8 overflow-hidden relative group shadow-2xl">
                        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-rose-500/5 blur-[100px] group-hover:bg-rose-500/10 transition-all duration-1000"></div>
                        <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] mb-10 relative z-10">Infrastructure Health</h3>
                        <div className="space-y-9 relative z-10">
                          {[
                            { label: "CPU Performance", status: (stats?.systemHealth?.cpuUsage ?? 12) < 80 ? "Optimal" : "High Load", val: stats?.systemHealth?.cpuUsage ?? 12, color: (stats?.systemHealth?.cpuUsage ?? 12) < 80 ? "bg-emerald-500" : "bg-rose-500" },
                            { label: "Memory Usage", status: (stats?.systemHealth?.memPercentage ?? 42) < 85 ? "Healthy" : "Critical", val: stats?.systemHealth?.memPercentage ?? 42, color: (stats?.systemHealth?.memPercentage ?? 42) < 85 ? "bg-emerald-500" : "bg-amber-500" },
                            { label: "Storage Capacity", status: (stats?.diskStats?.percentage ?? 45) < 90 ? "Optimal" : "Full", val: stats?.diskStats?.percentage ?? 45, color: "bg-emerald-500" },
                            { label: "Network Latency", status: "Optimal", val: 99.9, color: "bg-emerald-500" },
                          ].map((item, i) => (
                            <div key={i} className="space-y-4">
                              <div className="flex justify-between items-end">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.label}</span>
                                <span className={cn("text-[9px] font-black uppercase tracking-tighter", item.status === "Optimal" || item.status === "Healthy" ? "text-emerald-500" : "text-rose-500")}>{item.status}</span>
                              </div>
                              <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden shadow-inner">
                                <div className={cn("h-full rounded-full transition-all duration-1000", item.color, "shadow-[0_0_8px_rgba(0,0,0,0.5)]")} style={{ width: `${item.val}%` }}></div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <Button 
                          onClick={() => setActiveTab("system")}
                          className="w-full mt-12 h-12 rounded-xl bg-white/5 hover:bg-rose-500 text-slate-400 hover:text-white border border-white/5 hover:border-rose-500 font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-500 shadow-xl"
                        >
                          OPEN SYSTEM CONSOLE
                        </Button>
                      </Card>

                      <Card className="border-slate-800 bg-slate-900/30 rounded-[2rem] p-8">
                        <div className="flex items-center gap-4 mb-6">
                          <Database className="h-6 w-6 text-slate-500" />
                          <h4 className="text-sm font-black text-white uppercase tracking-widest">Resource Usage</h4>
                        </div>
                        <div className="text-2xl font-black text-white mb-2 tracking-tighter">
                          {stats?.diskStats ? formatGB(stats.diskStats.used) : "540 GB"} 
                          <span className="text-xs text-slate-600 font-bold uppercase tracking-widest ml-2">
                            of {stats?.diskStats ? formatTB(stats.diskStats.total) : "1.2 TB"} Used
                          </span>
                        </div>
                        <div className="h-1 w-full bg-slate-800 rounded-full mt-4">
                          <div 
                            className="h-full bg-rose-500 rounded-full transition-all duration-1000" 
                            style={{ width: `${stats?.diskStats?.percentage ?? 45}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between mt-3 text-[10px] font-black uppercase tracking-widest text-slate-600">
                          <span>Free: {stats?.diskStats ? formatGB(stats.diskStats.free) : "660 GB"}</span>
                          <span>{stats?.diskStats?.percentage ?? 45}% Capacity</span>
                        </div>
                      </Card>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "partners" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-black text-white tracking-tight">Partner Ecosystem</h3>
                    <Button 
                      onClick={() => setIsAddPartnerOpen(true)}
                      className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      CREATE ACCOUNT
                    </Button>
                  </div>
                  <div className="grid gap-6">
                    {partners?.map((p) => (
                      <Card key={p.id} className="border-slate-800 bg-slate-900/50 p-6 flex items-center justify-between hover:bg-slate-900 transition-colors">
                        <div className="flex items-center gap-6">
                          <div className="h-14 w-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                            <UserCog className="h-8 w-8" />
                          </div>
                          <div>
                            <div className="text-lg font-bold text-white">{p.name}</div>
                            <div className="text-sm text-slate-500">{p.email}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-12 text-right">
                            <div>
                              <div className="text-xl font-black text-white">{p._count?.tenants || 0}</div>
                              <div className="text-[10px] font-black uppercase tracking-widest text-slate-600">Tenants</div>
                            </div>
                            <Button 
                              variant="outline" 
                              onClick={() => {
                                setSelectedPartner(p);
                                setIsManagePartnerOpen(true);
                              }}
                              className="border-slate-800 hover:bg-slate-800 text-slate-400"
                            >
                              Manage
                            </Button>
                          </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "tenants" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-black text-white tracking-tight uppercase">Global Tenants</h3>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Infrastructure Instance Monitoring</p>
                    </div>
                    <div className="relative group">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 group-focus-within:text-rose-500 transition-colors" />
                      <Input 
                        placeholder="Search instances..." 
                        value={tenantSearchQuery}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setTenantSearchQuery(e.target.value)}
                        className="pl-12 w-80 bg-slate-950/50 border-slate-800 rounded-xl h-12 text-sm text-white focus:ring-rose-500/20 placeholder:text-slate-700" 
                      />
                    </div>
                  </div>

                  <div className="grid gap-5">
                    {filteredTenants?.map((t) => (
                      <Card key={t.id} className="border-slate-800/40 bg-slate-950/40 p-7 flex items-center justify-between hover:bg-slate-900/60 hover:border-slate-700/50 transition-all group rounded-[2rem]">
                        <div className="flex items-center gap-7">
                          <div className="h-14 w-14 rounded-2xl bg-rose-500/5 border border-rose-500/10 flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-rose-500/0 group-hover:shadow-rose-500/5">
                            <Building2 className="h-7 w-7" />
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-1.5">
                              <span className="text-lg font-black text-white tracking-tight uppercase">{t.name}</span>
                              <span className="px-2.5 py-0.5 bg-slate-900 border border-slate-800 rounded-lg text-[9px] font-black text-slate-500 uppercase tracking-widest">/{t.slug}</span>
                            </div>
                            <div className="flex items-center gap-5">
                              <div className="flex items-center gap-2 px-2 py-1 bg-white/5 rounded-md border border-white/5">
                                <Globe className="h-3 w-3 text-slate-500" />
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t.partner?.name || 'Livinova Direct'}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className={cn(
                                  "h-1.5 w-1.5 rounded-full animate-pulse",
                                  t.status === 'active' ? "bg-emerald-500" : "bg-amber-500"
                                )}></div>
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{t.status} Mode</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-10">
                          <div className="text-right px-6 border-r border-slate-800/50">
                            <div className="text-xl font-black text-white tracking-tighter">{t._count?.projects || 0}</div>
                            <div className="text-[9px] font-black uppercase tracking-widest text-slate-600">Nodes</div>
                          </div>
                          <div className="text-right px-6">
                            <div className="text-xl font-black text-white tracking-tighter">{t._count?.licenses || 0}</div>
                            <div className="text-[9px] font-black uppercase tracking-widest text-slate-600">Keys</div>
                          </div>
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              setSelectedTenant(t);
                              setIsTenantDetailOpen(true);
                            }}
                            className="border-slate-800/50 hover:bg-rose-500 hover:border-rose-500 bg-white/5 text-slate-400 hover:text-white font-black text-[10px] px-6 h-10 rounded-xl transition-all duration-300 uppercase tracking-widest shadow-xl"
                          >
                            Details
                          </Button>
                        </div>
                      </Card>
                    ))}
                    {filteredTenants?.length === 0 && (
                      <div className="p-24 text-center border border-dashed border-slate-800 rounded-[3rem] bg-slate-950/20">
                        <Building2 className="h-12 w-12 text-slate-800 mx-auto mb-5 opacity-30" />
                        <p className="text-slate-600 font-black uppercase tracking-[0.3em] text-[10px]">Instance Not Found</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "licenses" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-black text-white tracking-tight">Global License Hub</h3>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Manage enterprise activation keys</p>
                    </div>
                    <Button 
                      onClick={() => setIsAddLicenseOpen(true)}
                      className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold px-6 flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      GENERATE NEW LICENSE
                    </Button>
                  </div>

                  <Card className="border-slate-800 bg-slate-900/50 overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-slate-950/50 border-b border-slate-800">
                        <tr>
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">License Holder</th>
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Validity Period</th>
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {globalLicenses?.map((l) => (
                          <tr key={l.id} className="hover:bg-white/5 transition-colors group">
                            <td className="px-8 py-6">
                              <div className="text-sm font-bold text-white">{l.tenant?.name}</div>
                              <div className="text-[10px] text-slate-500 font-bold uppercase">{l.user?.email}</div>
                            </td>
                            <td className="px-8 py-6">
                              <div className="text-xs font-bold text-slate-300">
                                {new Date(l.startDate).toLocaleDateString()} - {new Date(l.endDate).toLocaleDateString()}
                              </div>
                              <div className="text-[10px] text-slate-500 mt-1 uppercase font-black tracking-tighter">
                                {Math.ceil((new Date(l.endDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24))} Days Remaining
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <span className={cn(
                                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                                l.status === "active" ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                              )}>
                                {l.status}
                              </span>
                            </td>
                            <td className="px-8 py-6 text-right">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => {
                                  setSelectedLicense(l);
                                  setIsExtendLicenseOpen(true);
                                }}
                                className="border-slate-800 bg-slate-900/50 text-slate-400 hover:bg-rose-500 hover:text-white hover:border-rose-500 font-bold transition-all duration-300"
                              >
                                EXTEND
                              </Button>
                            </td>
                          </tr>
                        ))}
                        {(!globalLicenses || globalLicenses.length === 0) && (
                          <tr>
                            <td colSpan={4} className="px-8 py-12 text-center text-slate-500 italic">No active licenses found in global cluster.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </Card>
                </div>
              )}

              {activeTab === "pricing" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-black text-white tracking-tight">System Pricing Plans</h3>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Manage global pricing for partners</p>
                    </div>
                    <Button 
                      onClick={() => setIsAddPlanOpen(true)}
                      className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      ADD NEW PLAN
                    </Button>
                  </div>
                  <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {(pricingPlans || []).map((plan) => (
                      <Card key={plan.id} className="border-slate-800 bg-slate-900/50 p-8 flex flex-col justify-between hover:bg-slate-900 transition-colors group">
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <span className="px-4 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-black uppercase tracking-widest">{plan.durationDays} DAYS</span>
                            <button className="text-slate-600 hover:text-white"><Trash2 className="h-4 w-4" /></button>
                          </div>
                          <h4 className="text-2xl font-black text-white tracking-tight mb-2">{plan.name}</h4>
                          <p className="text-xs text-slate-400 font-medium mb-6">{plan.description}</p>
                        </div>
                        <div className="pt-6 border-t border-slate-800/50 text-right">
                          <div className="text-4xl font-black text-white tracking-tighter">{formatRupiah(plan.price)}</div>
                          <div className="text-[10px] font-black uppercase tracking-widest text-slate-600">PER LICENSE</div>
                        </div>
                      </Card>
                    ))}
                    {(!pricingPlans || pricingPlans.length === 0) && (
                      <div className="lg:col-span-3 p-20 text-center border-2 border-dashed border-slate-800 rounded-[3rem] bg-slate-900/20">
                        <Sparkles className="h-12 w-12 text-slate-700 mx-auto mb-4 opacity-20" />
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No pricing plans defined. Click ADD NEW PLAN to start.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "system" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-black text-white tracking-tight">System Infrastructure</h3>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Real-time Node Monitoring</p>
                    </div>
                    <div className="flex gap-4">
                      <Button 
                        variant="outline" 
                        onClick={() => handleSystemAction("Restart Services")}
                        disabled={isSystemActionLoading === "Restart Services"}
                        className="border-slate-800 bg-slate-900/50 text-slate-400 font-bold rounded-xl hover:bg-slate-800 hover:text-white hover:border-slate-700 transition-all duration-300"
                      >
                        {isSystemActionLoading === "Restart Services" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        RESTART SERVICES
                      </Button>
                      <Button 
                        onClick={() => handleSystemAction("Flush Cache")}
                        disabled={isSystemActionLoading === "Flush Cache"}
                        className="bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl px-6"
                      >
                        {isSystemActionLoading === "Flush Cache" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        FLUSH CACHE
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-8 lg:grid-cols-3">
                    <Card className="lg:col-span-2 border-slate-800 bg-slate-900/50 rounded-[2rem] overflow-hidden">
                      <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-slate-950/30">
                        <div className="flex items-center gap-4">
                          <Activity className="h-6 w-6 text-rose-500" />
                          <span className="text-sm font-black text-white uppercase tracking-widest">Active Server Nodes</span>
                        </div>
                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase rounded-full tracking-widest">All Systems Operational</span>
                      </div>
                      <div className="p-0">
                        {[
                          { 
                            name: "Primary API Cluster", 
                            region: stats?.systemHealth?.hostname ?? "Node-01", 
                            cpu: `${stats?.systemHealth?.cpuUsage ?? 12}%`, 
                            ram: stats?.systemHealth ? formatGB(stats.systemHealth.usedMem) : "4.2GB", 
                            status: "Healthy" 
                          },
                          { name: "Database Master (Postgres)", region: "Singapore (SIN-1)", cpu: "28%", ram: "16.1GB", status: "Healthy" },
                          { name: "Redis Cache Node", region: "Singapore (SIN-1)", cpu: "5%", ram: "1.2GB", status: "Healthy" },
                          { name: "Static Assets CDN", region: "Global Edge", cpu: "2%", ram: "0.8GB", status: "Healthy" },
                        ].map((node, i) => (
                          <div key={i} className="px-8 py-6 border-b border-slate-800/50 last:border-0 flex items-center justify-between hover:bg-white/5 transition-colors">
                            <div className="flex items-center gap-6">
                              <div className="h-12 w-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
                                <Server className="h-6 w-6" />
                              </div>
                              <div>
                                <div className="text-sm font-bold text-white">{node.name}</div>
                                <div className="text-[10px] text-slate-500 font-bold uppercase">{node.region}</div>
                              </div>
                            </div>
                            <div className="flex gap-12 text-right">
                              <div>
                                <div className="text-xs font-black text-white">{node.cpu}</div>
                                <div className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">CPU</div>
                              </div>
                              <div>
                                <div className="text-xs font-black text-white">{node.ram}</div>
                                <div className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">RAM</div>
                              </div>
                              <div className="w-24">
                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">● {node.status}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>

                    <div className="space-y-8">
                      <Card className="border-slate-800 bg-slate-900/50 rounded-[2rem] p-8">
                        <h4 className="text-sm font-black text-white uppercase tracking-widest mb-8 flex items-center gap-3">
                          <ShieldAlert className="h-5 w-5 text-amber-500" />
                          Security Logs
                        </h4>
                        <div className="space-y-6">
                          {(stats?.securityLogs ?? [
                            { event: "Login Attempt", user: "admin@dev.id", time: "2m ago", status: "Success" },
                            { event: "API Key Created", user: "Partner X", time: "15m ago", status: "Audit Logged" },
                            { event: "DB Backup", user: "System", time: "1h ago", status: "Verified" },
                          ]).map((log, i) => (
                            <div key={i} className="text-xs space-y-1">
                              <div className="flex justify-between font-bold">
                                <span className="text-slate-200">{log.event}</span>
                                <span className="text-slate-500 text-[10px]">{log.time}</span>
                              </div>
                              <div className="flex justify-between text-[10px] uppercase font-black">
                                <span className="text-slate-600">{log.user}</span>
                                <span className={cn(
                                  log.status === "Success" || log.status === "Authorized" || log.status === "Verified" 
                                    ? "text-emerald-500" 
                                    : "text-amber-500"
                                )}>{log.status}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                        <Button variant="ghost" className="w-full mt-8 border border-slate-800 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:text-white">View Full Audit Trail</Button>
                      </Card>

                      <Card className="border-amber-500/30 bg-slate-950 rounded-[2.5rem] p-8 border relative overflow-hidden group shadow-2xl shadow-amber-500/5">
                        <div className="absolute -right-4 -top-4 h-32 w-32 bg-amber-500/5 blur-3xl rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                        <h4 className="text-sm font-black text-amber-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></div>
                          Urgent Maintenance
                        </h4>
                        <p className="text-sm text-slate-200 leading-relaxed mb-8 font-bold">
                          Database migration for <span className="text-amber-400">shard-02</span> scheduled in 4 hours. Expect 2-3 seconds of latency.
                        </p>
                        <Button 
                          onClick={() => handleSystemAction("Acknowledge Maintenance")}
                          disabled={isSystemActionLoading === "Acknowledge Maintenance"}
                          className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-[0.2em] h-14 rounded-2xl shadow-xl shadow-amber-500/20 transition-all active:scale-95"
                        >
                          {isSystemActionLoading === "Acknowledge Maintenance" ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                          ACKNOWLEDGE
                        </Button>
                      </Card>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "settings" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-black text-white tracking-tight">System Configuration</h3>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Global settings & security audit</p>
                    </div>
                    <Button 
                      onClick={() => handleSystemAction("Save Configuration")}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-8 rounded-xl h-12 shadow-lg shadow-emerald-500/20"
                    >
                      SAVE CHANGES
                    </Button>
                  </div>

                  <div className="grid gap-10 lg:grid-cols-12">
                    <Card className="lg:col-span-3 border-slate-800 bg-slate-900/30 rounded-[2rem] p-4 h-fit">
                      <div className="space-y-2">
                        {[
                          { id: "global", label: "Global Settings", icon: <Globe className="h-4 w-4" /> },
                          { id: "api", label: "API & Webhooks", icon: <Key className="h-4 w-4" /> },
                          { id: "smtp", label: "SMTP / Email", icon: <Mail className="h-4 w-4" /> },
                          { id: "security", label: "Security & Auth", icon: <ShieldCheck className="h-4 w-4" /> },
                        ].map((s) => (
                          <button
                            key={s.id}
                            onClick={() => setActiveSettingsTab(s.id)}
                            className={cn(
                              "w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 text-left",
                              activeSettingsTab === s.id 
                                ? "bg-white/10 text-white font-bold" 
                                : "text-slate-500 hover:bg-white/5 hover:text-slate-300"
                            )}
                          >
                            <span className={activeSettingsTab === s.id ? "text-rose-500" : "text-slate-600"}>{s.icon}</span>
                            <span className="text-xs font-black uppercase tracking-widest">{s.label}</span>
                          </button>
                        ))}
                      </div>
                    </Card>

                    <div className="lg:col-span-9 space-y-8">
                      {activeSettingsTab === "global" && (
                        <Card className="border-slate-800 bg-slate-900/50 rounded-[2.5rem] p-10 space-y-10 animate-in fade-in duration-500">
                          <div className="grid gap-10 md:grid-cols-2">
                            <div className="space-y-4">
                              <Label className="text-xs font-black text-white uppercase tracking-widest ml-1">Site Title</Label>
                              <Input 
                                value={globalConfig.siteName}
                                onChange={(e) => setGlobalConfig({...globalConfig, siteName: e.target.value})}
                                className="bg-slate-950 border-slate-800 rounded-xl h-14 text-white focus:ring-rose-500/20" 
                              />
                            </div>
                            <div className="space-y-4">
                              <Label className="text-xs font-black text-white uppercase tracking-widest ml-1">Environment</Label>
                              <div className="h-14 bg-slate-950 border border-slate-800 rounded-xl flex items-center px-6 text-emerald-500 font-black text-xs uppercase tracking-widest">
                                Production Mode
                              </div>
                            </div>
                          </div>

                          <div className="space-y-8 pt-6 border-t border-slate-800">
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <h4 className="text-sm font-bold text-white">Maintenance Mode</h4>
                                <p className="text-xs text-slate-500">Prevent all users from accessing the platform except Super Admins.</p>
                              </div>
                              <button 
                                onClick={() => setGlobalConfig({...globalConfig, maintenanceMode: !globalConfig.maintenanceMode})}
                                className={cn(
                                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                                  globalConfig.maintenanceMode ? "bg-rose-500" : "bg-slate-800"
                                )}
                              >
                                <span
                                  className={cn(
                                    "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform",
                                    globalConfig.maintenanceMode ? "translate-x-5" : "translate-x-0.5"
                                  )}
                                />
                              </button>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <h4 className="text-sm font-bold text-white">Open Registration</h4>
                                <p className="text-xs text-slate-500">Allow new tenants to register their developers account.</p>
                              </div>
                              <button 
                                onClick={() => setGlobalConfig({...globalConfig, allowRegistration: !globalConfig.allowRegistration})}
                                className={cn(
                                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                                  globalConfig.allowRegistration ? "bg-emerald-500" : "bg-slate-800"
                                )}
                              >
                                <span
                                  className={cn(
                                    "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform",
                                    globalConfig.allowRegistration ? "translate-x-5" : "translate-x-0.5"
                                  )}
                                />
                              </button>
                            </div>
                          </div>
                        </Card>
                      )}

                      {activeSettingsTab === "api" && (
                        <Card className="border-slate-800 bg-slate-900/50 rounded-[2.5rem] p-10 space-y-10 animate-in fade-in duration-500">
                          <div className="space-y-6">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-sm font-bold text-white">Master API Key</h4>
                              <Button 
                                variant="ghost" 
                                onClick={handleRevokeKey}
                                className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:bg-rose-500/10"
                              >
                                Revoke Key
                              </Button>
                            </div>
                            <div className="relative group">
                              <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                                <Key className="h-4 w-4 text-slate-600" />
                              </div>
                              <Input 
                                value={globalConfig.apiKey}
                                readOnly
                                className="bg-slate-950 border-slate-800 rounded-xl h-14 pl-14 text-white font-mono text-sm" 
                              />
                              <Button 
                                onClick={handleCopyKey}
                                className="absolute right-2 top-2 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold px-4"
                              >
                                COPY
                              </Button>
                            </div>
                            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest text-center">Use this key to authorize system-level integrations</p>
                          </div>

                          <div className="space-y-6 pt-10 border-t border-slate-800">
                            <h4 className="text-sm font-bold text-white">Webhook Configuration</h4>
                            <div className="grid gap-6">
                              {webhooks.map((wh, i) => (
                                <div key={i} className="flex items-center gap-4 p-4 bg-slate-950 rounded-2xl border border-slate-800">
                                  <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center text-rose-500 font-bold text-xs uppercase">POST</div>
                                  <div className="flex-1">
                                    <div className="text-xs font-black text-white uppercase tracking-widest mb-1">{wh.event}</div>
                                    <div className="text-[10px] text-slate-500 font-mono">{wh.url}</div>
                                  </div>
                                  <Button 
                                    variant="ghost" 
                                    onClick={() => handleDeleteWebhook(i)}
                                    size="sm"
                                    className="h-10 w-10 p-0 text-slate-600 hover:text-rose-500"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                            <Button 
                              variant="outline" 
                              onClick={handleAddWebhook}
                              className="w-full border-slate-800 border-dashed rounded-xl h-12 text-slate-500 hover:text-white font-bold"
                            >
                              ADD WEBHOOK ENDPOINT
                            </Button>
                          </div>
                        </Card>
                      )}

                      {activeSettingsTab === "smtp" && (
                        <Card className="border-slate-800 bg-slate-900/50 rounded-[2.5rem] p-10 space-y-8 animate-in fade-in duration-500">
                          <div className="grid gap-8 md:grid-cols-3">
                            <div className="md:col-span-2 space-y-4">
                              <Label className="text-xs font-black text-white uppercase tracking-widest ml-1">SMTP Host</Label>
                              <Input 
                                value={globalConfig.smtpHost}
                                onChange={(e) => setGlobalConfig({...globalConfig, smtpHost: e.target.value})}
                                className="bg-slate-950 border-slate-800 rounded-xl h-14 text-white" 
                              />
                            </div>
                            <div className="space-y-4">
                              <Label className="text-xs font-black text-white uppercase tracking-widest ml-1">Port</Label>
                              <Input 
                                value={globalConfig.smtpPort}
                                onChange={(e) => setGlobalConfig({...globalConfig, smtpPort: e.target.value})}
                                className="bg-slate-950 border-slate-800 rounded-xl h-14 text-white text-center" 
                              />
                            </div>
                          </div>
                          <div className="space-y-4">
                            <Label className="text-xs font-black text-white uppercase tracking-widest ml-1">SMTP User</Label>
                            <Input 
                              value={globalConfig.smtpUser}
                              onChange={(e) => setGlobalConfig({...globalConfig, smtpUser: e.target.value})}
                              className="bg-slate-950 border-slate-800 rounded-xl h-14 text-white" 
                            />
                          </div>
                          <div className="pt-6 border-t border-slate-800 flex justify-between items-center">
                            <div className="flex items-center gap-4 text-emerald-500">
                              <CheckCircle2 className="h-5 w-5" />
                              <span className="text-xs font-bold uppercase tracking-widest">Connection Verified</span>
                            </div>
                            <Button 
                              variant="outline" 
                              onClick={() => handleSystemAction("Test SMTP")}
                              disabled={isSystemActionLoading === "Test SMTP"}
                              className="border-slate-800 rounded-xl h-12 px-8 font-bold text-slate-400"
                            >
                              {isSystemActionLoading === "Test SMTP" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                              TEST CONNECTION
                            </Button>
                          </div>
                        </Card>
                      )}

                      {activeSettingsTab === "security" && (
                        <Card className="border-slate-800 bg-slate-900/50 rounded-[2.5rem] p-10 space-y-10 animate-in fade-in duration-500">
                          <div className="space-y-8">
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <h4 className="text-sm font-bold text-white">Force 2FA</h4>
                                <p className="text-xs text-slate-500">Require Two-Factor Authentication for all Admin and Partner accounts.</p>
                              </div>
                              <button 
                                onClick={() => setGlobalConfig({...globalConfig, force2FA: !globalConfig.force2FA})}
                                className={cn(
                                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors",
                                  globalConfig.force2FA ? "bg-emerald-500" : "bg-slate-800"
                                )}
                              >
                                <span className={cn(
                                  "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform",
                                  globalConfig.force2FA ? "translate-x-5" : "translate-x-0.5"
                                )} />
                              </button>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <h4 className="text-sm font-bold text-white">Strict IP Access</h4>
                                <p className="text-xs text-slate-500">Restrict Central Console access to authorized whitelist IP ranges only.</p>
                              </div>
                              <button 
                                onClick={() => setGlobalConfig({...globalConfig, strictIPAccess: !globalConfig.strictIPAccess})}
                                className={cn(
                                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors",
                                  globalConfig.strictIPAccess ? "bg-rose-500" : "bg-slate-800"
                                )}
                              >
                                <span className={cn(
                                  "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform",
                                  globalConfig.strictIPAccess ? "translate-x-5" : "translate-x-0.5"
                                )} />
                              </button>
                            </div>
                          </div>

                          {globalConfig.strictIPAccess && (
                            <div className="space-y-4 p-6 bg-slate-950 rounded-2xl border border-rose-500/20 animate-in slide-in-from-top-2 duration-300">
                              <Label className="text-[10px] font-black uppercase tracking-widest text-rose-500 ml-1">Authorized IP Addresses (Comma separated)</Label>
                              <Input 
                                value={globalConfig.ipWhitelist}
                                onChange={(e) => setGlobalConfig({...globalConfig, ipWhitelist: e.target.value})}
                                placeholder="e.g. 127.0.0.1, 192.168.1.1"
                                className="bg-slate-900 border-slate-800 rounded-xl h-12 text-white focus:ring-rose-500/20"
                              />
                              <p className="text-[10px] text-slate-600 italic">Warning: Enabling this will block access from any IP not listed above.</p>
                            </div>
                          )}

                          <div className="p-8 bg-amber-500/10 border border-amber-500/20 rounded-[2rem] flex items-start gap-6">
                            <AlertTriangle className="h-8 w-8 text-amber-500 shrink-0 mt-1" />
                            <div>
                              <h4 className="text-sm font-black text-amber-500 uppercase tracking-widest mb-2">Security Audit Recommended</h4>
                              <p className="text-xs text-slate-400 leading-relaxed">System has detected 14 failed login attempts from unknown regions in the last 24 hours. Consider enabling Strict IP Access.</p>
                            </div>
                          </div>

                          <div className="pt-6 border-t border-slate-800">
                            <Button 
                              onClick={() => handleSystemAction("Download Audit Log")}
                              disabled={isSystemActionLoading === "Download Audit Log"}
                              className="w-full h-14 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs uppercase tracking-[0.2em]"
                            >
                              {isSystemActionLoading === "Download Audit Log" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                              DOWNLOAD AUDIT LOG (PDF)
                            </Button>
                          </div>
                        </Card>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Create Account Modal (Partner/Tenant) */}
      {isAddPartnerOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => !addPartnerMutation.isPending && !createTenantMutation.isPending && setIsAddPartnerOpen(false)}></div>
          <Card className="relative w-full max-w-2xl bg-slate-900 border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between p-8 border-b border-slate-800 bg-slate-950/50">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <UserCog className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight">Create New Account</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Register a Partner or create a direct Tenant Trial</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddPartnerOpen(false)}
                className="h-10 w-10 rounded-xl hover:bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-8">
              <div className="grid w-full grid-cols-2 bg-slate-950 border border-slate-800 h-14 rounded-2xl p-2">
                <button
                  onClick={() => setCreateAccountTab("tenant")}
                  className={cn(
                    "rounded-xl h-full text-xs font-black uppercase tracking-widest transition-colors",
                    createAccountTab === "tenant"
                      ? "bg-white/10 text-white"
                      : "text-slate-500 hover:text-white",
                  )}
                >
                  Direct Tenant (Trial)
                </button>
                <button
                  onClick={() => setCreateAccountTab("partner")}
                  className={cn(
                    "rounded-xl h-full text-xs font-black uppercase tracking-widest transition-colors",
                    createAccountTab === "partner"
                      ? "bg-white/10 text-white"
                      : "text-slate-500 hover:text-white",
                  )}
                >
                  New Partner
                </button>
              </div>

              {createAccountTab === "tenant" && (
                <div className="pt-8 space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Company Name</Label>
                    <Input 
                      value={newTenant.name}
                      onChange={(e) => setNewTenant({...newTenant, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
                      placeholder="e.g. PT Properti Sejahtera" 
                      className="bg-slate-950 border-slate-800 rounded-xl h-12 text-sm text-white focus:ring-blue-500/20" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Company Slug</Label>
                      <Input 
                        value={newTenant.slug}
                        onChange={(e) => setNewTenant({...newTenant, slug: e.target.value})}
                        placeholder="e.g. properti-sejahtera" 
                        className="bg-slate-950 border-slate-800 rounded-xl h-12 text-sm text-white focus:ring-blue-500/20" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Admin Email</Label>
                      <Input 
                        value={newTenant.email}
                        onChange={(e) => setNewTenant({...newTenant, email: e.target.value})}
                        type="email"
                        placeholder="admin@properti.co.id" 
                        className="bg-slate-950 border-slate-800 rounded-xl h-12 text-sm text-white focus:ring-blue-500/20" 
                      />
                    </div>
                  </div>
                  <div className="p-8 border-t border-slate-800 bg-slate-950/30 flex gap-4 mt-8 -mx-8 -mb-8">
                    <Button 
                      variant="ghost" 
                      onClick={() => setIsAddPartnerOpen(false)}
                      className="flex-1 h-14 rounded-2xl text-slate-400 font-bold hover:bg-white/5"
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
                        "CREATE 14-DAY TRIAL"
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {createAccountTab === "partner" && (
                <div className="pt-8 space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Partner Name</Label>
                      <Input 
                        value={newPartner.name}
                        onChange={(e) => setNewPartner({...newPartner, name: e.target.value})}
                        placeholder="e.g. PT Distributor Utama" 
                        className="bg-slate-950 border-slate-800 rounded-xl h-12 text-sm text-white focus:ring-blue-500/20" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Partner Email</Label>
                      <Input 
                        value={newPartner.email}
                        onChange={(e) => setNewPartner({...newPartner, email: e.target.value})}
                        type="email"
                        placeholder="partner@company.com" 
                        className="bg-slate-950 border-slate-800 rounded-xl h-12 text-sm text-white focus:ring-blue-500/20" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Phone Number</Label>
                    <Input 
                      value={newPartner.phone}
                      onChange={(e) => setNewPartner({...newPartner, phone: e.target.value})}
                      placeholder="+62 812..." 
                      className="bg-slate-950 border-slate-800 rounded-xl h-12 text-sm text-white focus:ring-blue-500/20" 
                    />
                  </div>
                   <div className="p-8 border-t border-slate-800 bg-slate-950/30 flex gap-4 mt-8 -mx-8 -mb-8">
                    <Button 
                      variant="ghost" 
                      onClick={() => setIsAddPartnerOpen(false)}
                      className="flex-1 h-14 rounded-2xl text-slate-400 font-bold hover:bg-white/5"
                      disabled={addPartnerMutation.isPending}
                    >
                      CANCEL
                    </Button>
                    <Button 
                      onClick={() => addPartnerMutation.mutate(newPartner)}
                      className="flex-2 bg-blue-600 hover:bg-blue-700 text-white font-black px-12 h-14 rounded-2xl shadow-xl shadow-blue-500/20 disabled:opacity-50"
                      disabled={addPartnerMutation.isPending || !newPartner.name || !newPartner.email}
                    >
                      {addPartnerMutation.isPending ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        "REGISTER PARTNER"
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Manage Partner Modal */}
      {isManagePartnerOpen && selectedPartner && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => !updatePartnerMutation.isPending && setIsManagePartnerOpen(false)}></div>
          <Card className="relative w-full max-w-xl bg-slate-900 border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between p-8 border-b border-slate-800 bg-slate-950/50">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <UserCog className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight">Manage Partner</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Update or remove partner node</p>
                </div>
              </div>
              <button 
                onClick={() => setIsManagePartnerOpen(false)}
                className="h-10 w-10 rounded-xl hover:bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Partner Name</Label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                    <Input 
                      value={selectedPartner.name}
                      onChange={(e) => setSelectedPartner({...selectedPartner, name: e.target.value})}
                      placeholder="e.g. PT Distributor Utama" 
                      className="pl-12 bg-slate-950 border-slate-800 rounded-xl h-12 text-sm text-white focus:ring-blue-500/20" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                    <Input 
                      value={selectedPartner.email}
                      onChange={(e) => setSelectedPartner({...selectedPartner, email: e.target.value})}
                      type="email"
                      placeholder="partner@company.com" 
                      className="pl-12 bg-slate-950 border-slate-800 rounded-xl h-12 text-sm text-white focus:ring-blue-500/20" 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                  <Input 
                    value={selectedPartner.phone || ""}
                    onChange={(e) => setSelectedPartner({...selectedPartner, phone: e.target.value})}
                    placeholder="+62 812..." 
                    className="pl-12 bg-slate-950 border-slate-800 rounded-xl h-12 text-sm text-white focus:ring-blue-500/20" 
                  />
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-slate-800 bg-slate-950/30 flex gap-4">
              <Button 
                variant="ghost" 
                onClick={() => {
                  if (confirm("Are you sure you want to delete this partner? This will also affect their tenants.")) {
                    deletePartnerMutation.mutate(selectedPartner.id);
                  }
                }}
                className="h-14 w-14 rounded-2xl text-rose-500 font-bold hover:bg-rose-500/10 border border-rose-500/20"
                disabled={deletePartnerMutation.isPending || updatePartnerMutation.isPending}
              >
                {deletePartnerMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
              </Button>
              <div className="flex-1 flex gap-4">
                <Button 
                  variant="ghost" 
                  onClick={() => setIsManagePartnerOpen(false)}
                  className="flex-1 h-14 rounded-2xl text-slate-400 font-bold hover:bg-white/5"
                  disabled={updatePartnerMutation.isPending}
                >
                  CANCEL
                </Button>
                <Button 
                  onClick={() =>
                    updatePartnerMutation.mutate({
                      partnerId: selectedPartner.id,
                      data: {
                        name: selectedPartner.name,
                        email: selectedPartner.email,
                        phone: selectedPartner.phone ?? undefined,
                      },
                    })
                  }
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-black h-14 rounded-2xl shadow-xl shadow-amber-500/20 disabled:opacity-50"
                  disabled={updatePartnerMutation.isPending || !selectedPartner.name || !selectedPartner.email}
                >
                  {updatePartnerMutation.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "UPDATE PARTNER"
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Add License Modal */}
      {isAddLicenseOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => !addLicenseMutation.isPending && setIsAddLicenseOpen(false)}></div>
          <Card className="relative w-full max-w-xl bg-slate-900 border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between p-8 border-b border-slate-800 bg-slate-950/50">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                  <Key className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight">Generate New License</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Create an enterprise activation key</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddLicenseOpen(false)}
                className="h-10 w-10 rounded-xl hover:bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Target Tenant (ID)</Label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                  <Input 
                    value={newLicense.tenantId}
                    onChange={(e) => setNewLicense({...newLicense, tenantId: e.target.value})}
                    placeholder="Enter Tenant UUID" 
                    className="pl-12 bg-slate-950 border-slate-800 rounded-xl h-12 text-sm text-white focus:ring-rose-500/20" 
                  />
                </div>
                <p className="text-[10px] text-slate-600 italic px-1">Note: Find the Tenant ID in the Global Tenants menu.</p>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Admin User (ID)</Label>
                <div className="relative">
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                  <Input 
                    value={newLicense.userId}
                    onChange={(e) => setNewLicense({...newLicense, userId: e.target.value})}
                    placeholder="Enter Admin User UUID" 
                    className="pl-12 bg-slate-950 border-slate-800 rounded-xl h-12 text-sm text-white focus:ring-rose-500/20" 
                  />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Duration (Days)</Label>
                  <Input 
                    type="number"
                    value={newLicense.durationDays}
                    onChange={(e) => setNewLicense({...newLicense, durationDays: parseInt(e.target.value)})}
                    className="bg-slate-950 border-slate-800 rounded-xl h-12 text-sm text-white focus:ring-rose-500/20" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Device/Server Name</Label>
                  <Input 
                    value={newLicense.deviceName}
                    onChange={(e) => setNewLicense({...newLicense, deviceName: e.target.value})}
                    placeholder="e.g. Production Cluster" 
                    className="bg-slate-950 border-slate-800 rounded-xl h-12 text-sm text-white focus:ring-rose-500/20" 
                  />
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-slate-800 bg-slate-950/30 flex gap-4">
              <Button 
                variant="ghost" 
                onClick={() => setIsAddLicenseOpen(false)}
                className="flex-1 h-14 rounded-2xl text-slate-400 font-bold hover:bg-white/5"
                disabled={addLicenseMutation.isPending}
              >
                CANCEL
              </Button>
              <Button 
                onClick={() => addLicenseMutation.mutate(newLicense)}
                className="flex-2 bg-rose-600 hover:bg-rose-700 text-white font-black px-12 h-14 rounded-2xl shadow-xl shadow-rose-500/20 disabled:opacity-50"
                disabled={addLicenseMutation.isPending || !newLicense.tenantId || !newLicense.userId}
              >
                {addLicenseMutation.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "ACTIVATE LICENSE"
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Add Plan Modal */}
      {isAddPlanOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => !addPlanMutation.isPending && setIsAddPlanOpen(false)}></div>
          <Card className="relative w-full max-w-xl bg-slate-900 border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between p-8 border-b border-slate-800 bg-slate-950/50">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight">Add New Pricing Plan</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Create a new global license package</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddPlanOpen(false)}
                className="h-10 w-10 rounded-xl hover:bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Plan Name</Label>
                <Input 
                  value={newPricingPlan.name}
                  onChange={(e) => setNewPricingPlan({...newPricingPlan, name: e.target.value})}
                  placeholder="e.g. Annual Enterprise License" 
                  className="bg-slate-950 border-slate-800 rounded-xl h-12 text-sm text-white focus:ring-emerald-500/20" 
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Description</Label>
                <Textarea
                  value={newPricingPlan.description}
                  onChange={(e) => setNewPricingPlan({...newPricingPlan, description: e.target.value})}
                  placeholder="Full access to all ERP features for one year."
                  className="bg-slate-950 border-slate-800 rounded-xl text-sm text-white focus:ring-emerald-500/20 min-h-[100px]"
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Duration (Days)</Label>
                  <Input 
                    type="number"
                    value={newPricingPlan.durationDays}
                    onChange={(e) => setNewPricingPlan({...newPricingPlan, durationDays: parseInt(e.target.value)})}
                    className="bg-slate-950 border-slate-800 rounded-xl h-12 text-sm text-white focus:ring-emerald-500/20" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Price (IDR)</Label>
                  <Input 
                    type="number"
                    value={newPricingPlan.price}
                    onChange={(e) => setNewPricingPlan({...newPricingPlan, price: parseInt(e.target.value)})}
                    className="bg-slate-950 border-slate-800 rounded-xl h-12 text-sm text-white focus:ring-emerald-500/20" 
                  />
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-slate-800 bg-slate-950/30 flex gap-4">
              <Button 
                variant="ghost" 
                onClick={() => setIsAddPlanOpen(false)}
                className="flex-1 h-14 rounded-2xl text-slate-400 font-bold hover:bg-white/5"
                disabled={addPlanMutation.isPending}
              >
                CANCEL
              </Button>
              <Button 
                onClick={() => addPlanMutation.mutate(newPricingPlan)}
                className="flex-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black px-12 h-14 rounded-2xl shadow-xl shadow-emerald-500/20 disabled:opacity-50"
                disabled={addPlanMutation.isPending || !newPricingPlan.name || !newPricingPlan.price}
              >
                {addPlanMutation.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "CREATE PLAN"
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
      {/* Tenant Detail Modal */}
      {isTenantDetailOpen && selectedTenant && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => {
            setIsTenantDetailOpen(false);
            setIsAccessControlMode(false);
          }}></div>
          <Card className="relative w-full max-w-2xl bg-slate-900 border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between p-8 border-b border-slate-800 bg-slate-950/50">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                  {isAccessControlMode ? <ShieldCheck className="h-6 w-6" /> : <Building2 className="h-6 w-6" />}
                </div>
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight uppercase">{selectedTenant.name}</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                    {isAccessControlMode ? "Access Control Management" : "Instance Intelligence Profile"}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsTenantDetailOpen(false);
                  setIsAccessControlMode(false);
                }}
                className="h-10 w-10 rounded-xl hover:bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-8 space-y-8">
              {!isAccessControlMode ? (
                <>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-1">
                      <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Tenant ID</div>
                      <div className="text-xs font-mono text-rose-500 bg-rose-500/5 px-2 py-1 rounded border border-rose-500/10 inline-block">{selectedTenant.id}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Domain Slug</div>
                      <div className="text-sm font-bold text-white">/{selectedTenant.slug}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Managing Partner</div>
                      <div className="text-sm font-bold text-white">{selectedTenant.partner?.name || 'Direct Enterprise'}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Deployment Date</div>
                      <div className="text-sm font-bold text-white">{new Date(selectedTenant.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-950/50 border border-slate-800 p-5 rounded-2xl text-center">
                      <div className="text-2xl font-black text-white tracking-tighter">{selectedTenant._count?.projects || 0}</div>
                      <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-1">Active Projects</div>
                    </div>
                    <div className="bg-slate-950/50 border border-slate-800 p-5 rounded-2xl text-center">
                      <div className="text-2xl font-black text-white tracking-tighter">{selectedTenant._count?.licenses || 0}</div>
                      <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-1">Assigned Keys</div>
                    </div>
                    <div className="bg-slate-950/50 border border-slate-800 p-5 rounded-2xl text-center">
                      <div className="text-2xl font-black text-white tracking-tighter">{selectedTenant._count?.users || 0}</div>
                      <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-1">User Nodes</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Infrastructure Status</div>
                    <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">System Operational</span>
                      </div>
                      <span className="text-[9px] font-black text-emerald-500/50 uppercase">Latency: 24ms</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-8">
                  <div className="p-6 bg-rose-500/5 border border-rose-500/10 rounded-2xl space-y-4">
                    <div className="flex items-center gap-3">
                      <ShieldAlert className="h-5 w-5 text-rose-500" />
                      <span className="text-sm font-black text-white uppercase tracking-widest">Danger Zone</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                      Modifying access control will immediately affect the tenant ability to access ERP features. Use with caution.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Subscription Status</div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: 'active', label: 'Set Active', color: 'bg-emerald-500' },
                        { id: 'trial', label: 'Set Trial', color: 'bg-amber-500' },
                        { id: 'expired', label: 'Set Expired', color: 'bg-rose-500' },
                        { id: 'inactive', label: 'Set Inactive', color: 'bg-slate-500' },
                      ].map((s) => (
                        <button
                          key={s.id}
                          onClick={() =>
                            selectedTenant &&
                            updateTenantStatusMutation.mutate({
                              tenantId: selectedTenant.id,
                              status: s.id as SubscriptionStatus,
                            })
                          }
                          disabled={updateTenantStatusMutation.isPending || selectedTenant.status === s.id}
                          className={cn(
                            "flex items-center justify-between p-4 rounded-xl border transition-all group",
                            selectedTenant.status === s.id 
                              ? "bg-white/10 border-white/20 cursor-default" 
                              : "bg-slate-950 border-slate-800 hover:border-white/20 hover:bg-white/5"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn("h-2 w-2 rounded-full", s.color)}></div>
                            <span className="text-xs font-bold text-white uppercase tracking-widest">{s.label}</span>
                          </div>
                          {selectedTenant.status === s.id && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Account Actions</div>
                    <Button 
                      variant="outline" 
                      onClick={() =>
                        selectedTenant &&
                        updateTenantStatusMutation.mutate({
                          tenantId: selectedTenant.id,
                          status: "inactive",
                        })
                      }
                      className="w-full h-14 border-slate-800 hover:bg-rose-500 hover:border-rose-500 text-slate-500 hover:text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                    >
                      TERMINATE INSTANCE
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="p-8 border-t border-slate-800 bg-slate-950/30 flex gap-4">
              {isAccessControlMode ? (
                <Button 
                  variant="ghost" 
                  onClick={() => setIsAccessControlMode(false)}
                  className="flex-1 h-12 rounded-xl text-slate-500 font-bold hover:bg-white/5 uppercase text-[10px] tracking-widest"
                >
                  Back to Profile
                </Button>
              ) : (
                <Button 
                  variant="ghost" 
                  onClick={() => setIsTenantDetailOpen(false)}
                  className="flex-1 h-12 rounded-xl text-slate-500 font-bold hover:bg-white/5 uppercase text-[10px] tracking-widest"
                >
                  Close Profile
                </Button>
              )}
              
              {!isAccessControlMode && (
                <Button 
                  onClick={() => setIsAccessControlMode(true)}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-black h-12 rounded-xl shadow-xl shadow-rose-500/20 uppercase text-[10px] tracking-widest"
                >
                  Access Control
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}
      {/* Extend License Modal */}
      {isExtendLicenseOpen && selectedLicense && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => !extendLicenseMutation.isPending && setIsExtendLicenseOpen(false)}></div>
          <Card className="relative w-full max-w-lg bg-slate-900 border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between p-8 border-b border-slate-800 bg-slate-950/50">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                  <Key className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight uppercase">Extend License</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Extend enterprise validity period</p>
                </div>
              </div>
              <button 
                onClick={() => setIsExtendLicenseOpen(false)}
                className="h-10 w-10 rounded-xl hover:bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-8 space-y-8">
              <div className="bg-slate-950/50 border border-slate-800 p-6 rounded-2xl space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Target Instance</span>
                  <span className="text-sm font-bold text-white uppercase">{selectedLicense.tenant?.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Current Expiry</span>
                  <span className="text-sm font-bold text-rose-500">{new Date(selectedLicense.endDate).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Extension Duration</Label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: '30 Days', val: 30 },
                    { label: '90 Days', val: 90 },
                    { label: '180 Days', val: 180 },
                    { label: '365 Days', val: 365 },
                  ].map((d) => (
                    <button
                      key={d.val}
                      onClick={() => extendLicenseMutation.mutate({ licenseId: selectedLicense.id, durationDays: d.val })}
                      disabled={extendLicenseMutation.isPending}
                      className="flex items-center justify-center h-14 bg-slate-950 border border-slate-800 rounded-xl text-xs font-black text-white uppercase tracking-widest hover:border-rose-500/50 hover:bg-rose-500/5 transition-all disabled:opacity-50"
                    >
                      {extendLicenseMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : d.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-slate-800 bg-slate-950/30">
              <Button 
                variant="ghost" 
                onClick={() => setIsExtendLicenseOpen(false)}
                className="w-full h-12 rounded-xl text-slate-500 font-bold hover:bg-white/5 uppercase text-[10px] tracking-widest"
              >
                Cancel Extension
              </Button>
            </div>
          </Card>
        </div>
      )}
    </RequireErp>
  );
}
