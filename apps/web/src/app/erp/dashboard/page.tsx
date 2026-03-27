"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { RequireErp } from "@/components/erp/require-erp";
import { Container } from "@/components/site/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Home, 
  ShoppingCart, 
  Users, 
  Wallet, 
  LogOut, 
  LayoutDashboard, 
  Building2, 
  FileText, 
  Settings,
  Plus,
  Search,
  MoreVertical,
  ChevronRight,
  TrendingUp,
  Map,
  ClipboardList,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  History,
  CreditCard,
  Zap,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/auth";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type SubscriptionStatus =
  | "trial"
  | "active"
  | "expired"
  | "trial_expired"
  | "inactive";

type TenantStats = {
  projectCount: number;
  customerCount: number;
  totalRevenue: number;
  recentSales: Array<{
    id: string;
    date?: string;
    createdAt: string;
    status: string;
    totalPrice: number;
    customer?: { name: string; email?: string | null } | null;
    unit?: { unitCode: string } | null;
    project?: { name: string } | null;
  }>;
};

type AccountType = "asset" | "liability" | "equity" | "income" | "expense";

type Account = {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  balance: number;
};

type Journal = {
  id: string;
  date: string;
  description: string;
  details: Array<{
    debit: number;
    credit: number;
    account: { code: string; name: string };
  }>;
};

type ConstructionStats = {
  activeProjects: number;
  pendingTasks: number;
  totalBudget: number;
  realizedBudget: number;
};

type GeneratedDoc = {
  id: string;
  content: string;
  status: string;
  createdAt: string;
  sales?: {
    customer?: { name: string } | null;
    project?: { name: string } | null;
    unit?: { unitCode: string } | null;
  } | null;
};

type InventoryProject = {
  id: string;
  name: string;
  description?: string | null;
  units: Array<{
    id: string;
    unitCode: string;
    status: string;
    price: number;
    area?: number | null;
  }>;
};

type TenantSubscription = {
  status: SubscriptionStatus;
  daysRemaining: number;
  isTrial: boolean;
  isExpiringSoon: boolean;
  partner?: { name: string } | null;
  activeLicense?: { endDate: string } | null;
};

type TenantPricingPlan = {
  id: string;
  name: string;
  description?: string | null;
  durationDays: number;
  price: number;
};

type Customer = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
};

function getErrorMessage(error: unknown, fallback = "Terjadi kesalahan") {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.length > 0) return message;
  }
  return fallback;
}

export default function ErpDashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setToken = useAuthStore(s => s.setToken);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [activeFinanceSubTab, setActiveFinanceSubTab] = useState<"journals" | "accounts" | "reports">("journals");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"project" | "sales" | "journal" | "customer" | "unit" | "doc-preview" | "construction" | "legal-upload" | "renew" | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isProjectDetailMode, setIsProjectDetailOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<{ name: string; content: string } | null>(null);
  
  // Form States
  const [projectData, setProjectData] = useState({ name: "", description: "" });
  const [unitData, setUnitData] = useState({ projectId: "", unitCode: "", price: 0, area: 0 });
  const [salesData, setSalesData] = useState({ projectId: "", unitId: "", customerId: "", totalPrice: 0 });
  const [customerData, setCustomerData] = useState({ name: "", email: "", phone: "", address: "" });
  const [constructionData, setConstructionData] = useState({ projectId: "", stage: "", progress: 0, notes: "" });
  const [legalData, setLegalData] = useState<{ title: string; type: string; notes: string; file: File | null }>({ title: "", type: "", notes: "", file: null });
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [journalData, setJournalData] = useState({ 
    date: new Date().toISOString().split('T')[0], 
    description: "",
    details: [
      { accountCode: "", debit: 0, credit: 0 },
      { accountCode: "", debit: 0, credit: 0 }
    ]
  });

  const { token, roles, hydrated } = useAuthStore();
  const isSales = useMemo(() => roles.includes("erp_user") && !roles.includes("tenant_admin"), [roles]);

  const { data: stats, isLoading, refetch: refetchStats } = useQuery({
    queryKey: ["erp-tenant-stats"],
    queryFn: () => apiFetch<TenantStats>("/api/erp/tenant/stats"),
    enabled: activeTab === "dashboard",
  });

  // Backoffice Queries
  const { data: accounts, refetch: refetchAccounts } = useQuery({
    queryKey: ["erp-accounts"],
    queryFn: () => apiFetch<Account[]>("/api/erp/accounts"),
    enabled: activeTab === "finance" || modalType === "journal",
  });

  const { data: journals, refetch: refetchJournals } = useQuery({
    queryKey: ["erp-journals"],
    queryFn: () => apiFetch<Journal[]>("/api/erp/journals"),
    enabled: activeTab === "finance",
  });

  const { data: constStats } = useQuery({
    queryKey: ["erp-construction-stats"],
    queryFn: () => apiFetch<ConstructionStats>("/api/erp/construction/stats"),
    enabled: activeTab === "construction",
  });

  const { data: legalStats, refetch: refetchLegalStats } = useQuery({
    queryKey: ["erp-legal-stats"],
    queryFn: () => apiFetch<{ totalDocuments: number; pendingReview: number; expiredLicenses: number }>("/api/erp/legal/stats"),
    enabled: activeTab === "legal",
  });

  const { data: generatedDocs, refetch: refetchDocs } = useQuery({
    queryKey: ["erp-generated-docs"],
    queryFn: () => apiFetch<GeneratedDoc[]>("/api/erp/documents"),
    enabled: activeTab === "legal",
  });

  const { data: inventory, isLoading: isInventoryLoading, refetch: refetchInventory } = useQuery({
    queryKey: ["erp-tenant-inventory"],
    queryFn: () => apiFetch<InventoryProject[]>("/api/erp/tenant/inventory"),
    enabled: activeTab === "construction" || activeTab === "dashboard",
  });

  const { data: subscription } = useQuery({
    queryKey: ["erp-tenant-subscription"],
    queryFn: () => apiFetch<TenantSubscription>("/api/erp/tenant/subscription"),
    enabled: activeTab === "subscription",
  });

  const { data: tenantPricingPlans } = useQuery({
    queryKey: ["erp-tenant-pricing"],
    queryFn: () => apiFetch<TenantPricingPlan[]>("/api/erp/tenant/pricing"),
    enabled: isModalOpen && modalType === "renew",
  });

  const { data: projects, refetch: refetchProjects } = useQuery({
    queryKey: ["erp-projects"],
    queryFn: () => apiFetch<InventoryProject[]>("/api/erp/projects"),
    enabled: activeTab === "projects" || modalType === "sales" || activeTab === "dashboard",
  });

  const { data: customers, refetch: refetchCustomers } = useQuery({
    queryKey: ["erp-customers"],
    queryFn: () => apiFetch<Customer[]>("/api/erp/customers"),
    enabled: modalType === "sales" || activeTab === "sales",
  });

  // Mutations
  const createProject = useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      apiFetch("/api/erp/projects", { method: "POST", body: data }),
    onSuccess: () => {
      toast.success("Proyek berhasil ditambahkan");
      refetchProjects();
      refetchStats();
      refetchInventory();
      closeModal();
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Gagal menambahkan proyek"));
    }
  });

  const createUnit = useMutation({
    mutationFn: (data: { projectId: string; unitCode: string; price: number; area?: number }) =>
      apiFetch(`/api/erp/projects/${data.projectId}/units`, { method: "POST", body: data }),
    onSuccess: () => {
      toast.success("Unit berhasil ditambahkan ke proyek");
      refetchProjects();
      refetchInventory();
      closeModal();
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Gagal menambahkan unit"));
    }
  });

  const createCustomer = useMutation({
    mutationFn: (data: { name: string; email?: string; phone?: string; address?: string }) =>
      apiFetch("/api/erp/customers", { method: "POST", body: data }),
    onSuccess: () => {
      toast.success("Konsumen berhasil ditambahkan");
      refetchCustomers();
      closeModal();
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Gagal menambahkan konsumen"));
    }
  });

  const createSales = useMutation({
    mutationFn: (data: { projectId: string; unitId: string; customerId: string; totalPrice: number }) =>
      apiFetch("/api/erp/sales", { method: "POST", body: data }),
    onSuccess: () => {
      toast.success("Transaksi penjualan berhasil disimpan. SPR sedang di-generate...");
      refetchStats();
      refetchInventory();
      refetchProjects();
      refetchAccounts();
      refetchJournals();
      closeModal();
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Gagal memproses penjualan"));
    }
  });

  const createJournal = useMutation({
    mutationFn: (data: { date: string; description: string; details: Array<{ accountCode: string; debit: number; credit: number }> }) =>
      apiFetch("/api/erp/journals", { method: "POST", body: data }),
    onSuccess: () => {
      toast.success("Jurnal berhasil disimpan");
      refetchJournals();
      refetchAccounts();
      closeModal();
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Gagal menyimpan jurnal"));
    }
  });

  const generateSPR = useMutation({
    mutationFn: (salesId: string) => apiFetch<{ content: string }>("/api/erp/documents/generate", { 
      method: "POST", 
      body: { salesId, templateId: "spr-standard" } 
    }),
    onSuccess: (data) => {
      toast.success("Dokumen SPR berhasil di-generate");
      setPreviewDoc({ name: "Surat Pesanan Rumah (SPR)", content: data.content });
      setModalType("doc-preview");
      setIsModalOpen(true);
      refetchLegalStats();
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Gagal generate SPR"));
    }
  });

  const updateConstruction = useMutation({
    mutationFn: (data: { projectId: string; stage: string; progress: number; notes?: string }) =>
      apiFetch("/api/erp/construction/update", { method: "POST", body: data }),
    onSuccess: () => {
      toast.success("Progres konstruksi berhasil diperbarui");
      closeModal();
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Gagal memperbarui progres"));
    }
  });

  const uploadDocument = useMutation({
    mutationFn: (data: { title: string; type: string; notes?: string }) =>
      apiFetch("/api/erp/documents/upload", { method: "POST", body: data }),
    onSuccess: () => {
      toast.success("Dokumen berhasil diunggah");
      refetchDocs();
      closeModal();
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Gagal mengunggah dokumen"));
    }
  });

  const renewLicenseMutation = useMutation({
    mutationFn: (planId: string) => apiFetch("/api/erp/tenant/renew", { 
      method: "POST", 
      body: { planId }
    }),
    onSuccess: () => {
      toast.success("Pembayaran berhasil! Lisensi Anda telah diperpanjang.");
      queryClient.invalidateQueries({ queryKey: ["erp-tenant-subscription"] });
      closeModal();
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Gagal memproses perpanjangan"));
    }
  });

  const handleLogout = () => {
    setToken(null);
    router.push("/erp/login");
  };

  const resetForms = () => {
    setProjectData({ name: "", description: "" });
    setUnitData({ projectId: "", unitCode: "", price: 0, area: 0 });
    setSalesData({ projectId: "", unitId: "", customerId: "", totalPrice: 0 });
    setCustomerData({ name: "", email: "", phone: "", address: "" });
    setConstructionData({ projectId: "", stage: "", progress: 0, notes: "" });
    setLegalData({ title: "", type: "", notes: "", file: null });
    setIsDragging(false);
    setJournalData({
      date: new Date().toISOString().split('T')[0],
      description: "",
      details: [
        { accountCode: "", debit: 0, credit: 0 },
        { accountCode: "", debit: 0, credit: 0 }
      ]
    });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalType(null);
    resetForms();
  };

  const openModal = (type: "project" | "sales" | "journal" | "customer" | "unit" | "construction" | "legal-upload" | "renew") => {
    resetForms();
    setModalType(type);
    setIsModalOpen(true);
  };

  const addJournalRow = () => {
    setJournalData({
      ...journalData,
      details: [...journalData.details, { accountCode: "", debit: 0, credit: 0 }]
    });
  };

  const removeJournalRow = (idx: number) => {
    if (journalData.details.length <= 2) return;
    const newDetails = [...journalData.details];
    newDetails.splice(idx, 1);
    setJournalData({ ...journalData, details: newDetails });
  };

  const journalTotals = useMemo(() => {
    return journalData.details.reduce((acc, curr) => ({
      debit: acc.debit + (Number(curr.debit) || 0),
      credit: acc.credit + (Number(curr.credit) || 0)
    }), { debit: 0, credit: 0 });
  }, [journalData.details]);

  const isJournalBalanced = useMemo(() => {
    return journalTotals.debit === journalTotals.credit && journalTotals.debit > 0;
  }, [journalTotals]);

  const selectedProject = useMemo(() => {
    return projects?.find((p) => p.id === selectedProjectId);
  }, [projects, selectedProjectId]);

  const openProjectDetail = (projectId: string) => {
    setSelectedProjectId(projectId);
    setIsProjectDetailOpen(true);
  };

  const closeProjectDetail = () => {
    setIsProjectDetailOpen(false);
    setSelectedProjectId(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLegalData(prev => ({ ...prev, file }));
      toast.success(`File ${file.name} terpilih`);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setLegalData(prev => ({ ...prev, file }));
      toast.success(`File ${file.name} berhasil di-drop`);
    }
  };

  // Role based filtering for menu items
  const menuItems = useMemo(() => {
    const allItems = [
      { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" />, group: "Main Menu", roles: ["tenant_admin", "erp_user"] },
      { id: "projects", label: "Master Proyek", icon: <Map className="h-5 w-5" />, group: "Main Menu", roles: ["tenant_admin"] },
      { id: "sales", label: "Penjualan (CRM)", icon: <ShoppingCart className="h-5 w-5" />, group: "Main Menu", roles: ["tenant_admin", "erp_user"] },
      { id: "finance", label: "Keuangan & Akun", icon: <Wallet className="h-5 w-5" />, group: "Backoffice", roles: ["tenant_admin"] },
      { id: "construction", label: "Konstruksi", icon: <ClipboardList className="h-5 w-5" />, group: "Backoffice", roles: ["tenant_admin"] },
      { id: "legal", label: "Legal & Dokumen", icon: <FileText className="h-5 w-5" />, group: "Backoffice", roles: ["tenant_admin", "erp_user"] },
      { id: "subscription", label: "Langganan", icon: <ShieldCheck className="h-5 w-5" />, group: "System", roles: ["tenant_admin"] },
    ];
    return allItems.filter(item => item.roles.some(r => roles.includes(r)));
  }, [roles]);

  // Set default tab for sales
  useEffect(() => {
    if (isSales && (activeTab === "finance" || activeTab === "projects" || activeTab === "construction")) {
      setActiveTab("dashboard");
    }
  }, [isSales, activeTab]);

  return (
    <RequireErp allowedRoles={["tenant_admin", "erp_user"]}>
      <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
        {/* Modern ERP Shell */}
        <div className="flex h-screen overflow-hidden">
          {/* Sidebar */}
          <aside className="w-64 border-r border-slate-200 bg-white p-6 hidden lg:block overflow-y-auto shadow-sm">
            <div className="mb-10 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-500/20">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-black tracking-tighter">LIVINOVA <span className="text-blue-600">ERP</span></span>
            </div>

            <nav className="space-y-8">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 px-3">Main Menu</div>
                <div className="space-y-1">
                  {menuItems.filter(i => i.group === "Main Menu").map(item => (
                    <button 
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-left group",
                        activeTab === item.id 
                          ? "bg-blue-50 text-blue-600 font-bold shadow-sm shadow-blue-500/5" 
                          : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                      )}
                    >
                      <div className={cn(
                        "transition-colors",
                        activeTab === item.id ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                      )}>
                        {item.icon}
                      </div>
                      <span className="text-sm">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {menuItems.some(i => i.group === "Backoffice") && (
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 px-3">Backoffice</div>
                  <div className="space-y-1">
                    {menuItems.filter(i => i.group === "Backoffice").map(item => (
                      <button 
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-left group",
                          activeTab === item.id 
                            ? "bg-blue-50 text-blue-600 font-bold shadow-sm shadow-blue-500/5" 
                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                        )}
                      >
                        <div className={cn(
                          "transition-colors",
                          activeTab === item.id ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                        )}>
                          {item.icon}
                        </div>
                        <span className="text-sm">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {menuItems.some(i => i.group === "System") && (
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 px-3">System</div>
                  <div className="space-y-1">
                    {menuItems.filter(i => i.group === "System").map(item => (
                      <button 
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-left group",
                          activeTab === item.id 
                            ? "bg-blue-50 text-blue-600 font-bold shadow-sm shadow-blue-500/5" 
                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                        )}
                      >
                        <div className={cn(
                          "transition-colors",
                          activeTab === item.id ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                        )}>
                          {item.icon}
                        </div>
                        <span className="text-sm">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-6 border-t border-slate-100">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all text-sm font-bold"
                >
                  <LogOut className="h-5 w-5" /> 
                  <span>Logout</span>
                </button>
              </div>
            </nav>
          </aside>

          {/* Main Area */}
          <main className="flex-1 overflow-y-auto bg-slate-50/50">
            {/* Top Header */}
            <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-xl px-6 py-4 lg:px-10 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="lg:hidden h-10 w-10 flex items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-500/20">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {isSales ? "Licensed Staff Workspace" : "Developer Workspace"}
                    </h2>
                    <p className="text-lg font-black text-slate-900 tracking-tight">Livinova Enterprise</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative group hidden md:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                    <Input placeholder="Cari data..." className="h-10 w-64 rounded-xl border-slate-200 bg-slate-50 pl-10 text-slate-900 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm" />
                  </div>
                  <Button size="sm" variant="ghost" className="h-10 w-10 p-0 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-900 transition-all">
                    <Settings className="h-5 w-5" />
                  </Button>
                  <div className={cn(
                    "h-10 px-4 rounded-xl border border-white/10 flex items-center justify-center font-black text-[10px] text-white shadow-lg uppercase tracking-wider",
                    isSales ? "bg-gradient-to-br from-emerald-500 to-teal-700 shadow-emerald-500/20" : "bg-gradient-to-br from-blue-600 to-indigo-700 shadow-blue-500/20"
                  )}>
                    {isSales ? "LICENSED STAFF" : "TENANT ADMIN"}
                  </div>
                </div>
              </div>
            </header>

            <div className="p-6 lg:p-10 max-w-[1600px] mx-auto">
              {activeTab === "dashboard" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {/* Stats Grid */}
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-10">
                    {[
                      { label: "Total Proyek", val: stats?.projectCount ?? 0, icon: <Home />, color: "text-blue-600", bg: "bg-blue-50" },
                      { label: "Booking Baru", val: "24", icon: <ShoppingCart />, color: "text-emerald-600", bg: "bg-emerald-50" },
                      { label: "Calon Konsumen", val: stats?.customerCount ?? 0, icon: <Users />, color: "text-amber-600", bg: "bg-amber-50" },
                      { label: "Omzet (Approved)", val: formatRupiah(stats?.totalRevenue ?? 0), icon: <Wallet />, color: "text-purple-600", bg: "bg-purple-50" },
                    ].map((s, i) => (
                      <Card key={i} className="border-slate-200 bg-white rounded-2xl overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all relative">
                        <div className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className={`p-2.5 rounded-xl ${s.bg} ${s.color} shadow-sm`}>
                              {s.icon}
                            </div>
                            <TrendingUp className="h-4 w-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0" />
                          </div>
                          <div className="text-3xl font-black text-slate-900 tracking-tight">{s.val}</div>
                          <div className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mt-1">{s.label}</div>
                        </div>
                        <div className={cn("absolute bottom-0 left-0 h-1 w-0 transition-all group-hover:w-full bg-current", s.color)}></div>
                      </Card>
                    ))}
                  </div>

                  <div className="grid gap-8 lg:grid-cols-12">
                    {/* Inventory Overview */}
                    <div className="lg:col-span-8 space-y-6">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                            <Map className="h-5 w-5" />
                          </div>
                          Ketersediaan Unit (Siteplan)
                        </h2>
                        <Button variant="ghost" className="text-blue-600 hover:bg-blue-50 text-sm font-bold" onClick={() => setActiveTab("projects")}>Update Manual</Button>
                      </div>

                      <div className="grid gap-6">
                        {isInventoryLoading ? (
                          <div className="p-20 text-center text-slate-400 animate-pulse bg-white rounded-3xl border border-slate-100">Memuat data inventory...</div>
                        ) : inventory?.map((proj) => (
                          <Card key={proj.id} className="border-slate-100 bg-white rounded-3xl overflow-hidden group hover:border-blue-200 hover:shadow-md transition-all">
                            <div className="p-8">
                              <div className="flex items-center justify-between mb-8">
                                <div>
                                  <h3 className="font-black text-xl text-slate-900 tracking-tight">{proj.name}</h3>
                                  <p className="text-sm text-slate-400 font-medium">{proj.description}</p>
                                </div>
                                <Button size="sm" variant="outline" className="border-slate-200 rounded-xl hover:bg-slate-50 font-bold text-slate-600" onClick={() => setActiveTab("projects")}>Detail Proyek</Button>
                              </div>
                              
                              {/* Unit Grid Mockup */}
                              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-3">
                                {proj.units.map((unit) => (
                                  <div 
                                    key={unit.id} 
                                    className={cn(
                                      "h-12 rounded-xl flex items-center justify-center text-[10px] font-black border transition-all cursor-pointer hover:scale-110 shadow-sm",
                                      unit.status === 'available' ? "bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-600 hover:text-white" :
                                      unit.status === 'booked' ? "bg-amber-50 border-amber-100 text-amber-700" :
                                      "bg-rose-50 border-rose-100 text-rose-700"
                                    )}
                                    title={`${unit.unitCode} - ${unit.status}`}
                                  >
                                    {unit.unitCode}
                                  </div>
                                ))}
                                <button 
                                  onClick={() => openModal("project")}
                                  className="h-12 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300 hover:bg-slate-50 hover:border-blue-300 hover:text-blue-400 transition-all shadow-sm"
                                >
                                  <Plus className="h-5 w-5" />
                                </button>
                              </div>

                              <div className="mt-8 flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                <div className="flex items-center gap-2.5"><div className="h-3 w-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/20"></div> Tersedia</div>
                                <div className="flex items-center gap-2.5"><div className="h-3 w-3 rounded-full bg-amber-500 shadow-sm shadow-amber-500/20"></div> Terbooking</div>
                                <div className="flex items-center gap-2.5"><div className="h-3 w-3 rounded-full bg-rose-500 shadow-sm shadow-rose-500/20"></div> Terjual</div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>

                    {/* Recent Activity & Quick Tools */}
                    <div className="lg:col-span-4 space-y-8">
                      <section>
                        <Card className="border-none bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden group">
                          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 h-40 w-40 rounded-full bg-white/10 blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
                          <div className="relative z-10">
                            <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center mb-5">
                              <FileText className="h-5 w-5" />
                            </div>
                            <h3 className="font-black text-xl mb-2 tracking-tight">Automasi SPR</h3>
                            <p className="text-xs opacity-80 mb-6 leading-relaxed font-medium">Cetak Surat Pesanan Rumah otomatis dalam hitungan detik setelah booking disetujui.</p>
                            <Button 
                              onClick={() => openModal("sales")}
                              className="w-full bg-white text-blue-600 font-black rounded-xl h-12 hover:bg-slate-50 transition-all hover:shadow-xl shadow-lg shadow-black/10 text-xs"
                            >
                              Buat SPR Baru
                            </Button>
                          </div>
                        </Card>
                      </section>

                      <section>
                        <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                            <TrendingUp className="h-5 w-5" />
                          </div>
                          Aktivitas Terakhir
                        </h2>
                        <div className="space-y-4">
                          {stats?.recentSales && stats.recentSales.length > 0 ? (
                            stats.recentSales.map((sale, i) => (
                            <div key={i} className="flex gap-4 p-5 rounded-3xl bg-white border border-slate-100 relative overflow-hidden group cursor-pointer hover:shadow-lg hover:border-blue-100 transition-all">
                              <div className={cn(
                                "h-12 w-12 shrink-0 rounded-2xl flex items-center justify-center shadow-sm",
                                sale.status === 'approved' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                              )}>
                                <ShoppingCart className="h-5 w-5" />
                              </div>
                              <div>
                                <div className="text-sm font-black text-slate-900">Booking Baru</div>
                                <div className="text-xs text-slate-500 font-bold mt-0.5">Nilai: {formatRupiah(sale.totalPrice)}</div>
                                <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2">{new Date(sale.createdAt).toLocaleDateString("id-ID")}</div>
                              </div>
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1">
                                <ChevronRight className="h-5 w-5 text-slate-300" />
                              </div>
                            </div>
                          ))
                          ) : (
                            <div className="p-10 text-center text-slate-300 border-2 border-dashed border-slate-100 rounded-3xl bg-white/50">
                              <ShoppingCart className="h-8 w-8 mx-auto mb-3 opacity-20" />
                              <p className="font-bold text-xs">Belum ada aktivitas penjualan</p>
                            </div>
                          )}
                        </div>
                      </section>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "projects" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                  {!isProjectDetailMode ? (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Master <span className="text-blue-600">Proyek</span></h2>
                        <div className="flex gap-3">
                          <Button 
                            onClick={() => openModal("unit")}
                            variant="outline"
                            className="rounded-2xl border-blue-200 text-blue-600 px-8 h-12 font-black hover:bg-blue-50"
                          >
                            <Plus className="mr-2 h-5 w-5" /> Tambah Unit
                          </Button>
                          <Button 
                            onClick={() => openModal("project")}
                            className="rounded-2xl bg-blue-600 px-8 h-12 font-black shadow-xl shadow-blue-500/20 hover:bg-blue-700 text-white"
                          >
                            <Plus className="mr-2 h-5 w-5" /> Tambah Proyek Baru
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                        {projects?.map((project) => (
                          <Card key={project.id} className="border-slate-100 bg-white rounded-[2rem] overflow-hidden group hover:shadow-2xl hover:border-blue-100 transition-all">
                            <div className="h-52 bg-slate-100 relative overflow-hidden">
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
                              <div className="absolute bottom-6 left-6">
                                <div className="text-[10px] font-black text-blue-300 uppercase tracking-[0.2em] mb-1">Residential</div>
                                <h3 className="text-2xl font-black text-white tracking-tight">{project.name}</h3>
                              </div>
                              <div className="absolute top-6 right-6 bg-emerald-500 text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg">ACTIVE</div>
                            </div>
                            <div className="p-8">
                              <div className="grid grid-cols-2 gap-6 mb-8">
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Unit</div>
                                  <div className="text-2xl font-black text-slate-900 tracking-tight">{project.units?.length ?? 0}</div>
                                </div>
                                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                                  <div className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest mb-1">Terjual</div>
                                  <div className="text-2xl font-black text-emerald-600 tracking-tight">
                                    {project.units?.filter((u) => u.status === "sold").length ?? 0}
                                  </div>
                                </div>
                              </div>
                              <Button 
                                onClick={() => openProjectDetail(project.id)}
                                variant="outline" 
                                className="w-full border-slate-200 rounded-2xl h-12 font-black text-slate-600 hover:bg-slate-50 transition-all"
                              >
                                Kelola Unit & Siteplan
                              </Button>
                            </div>
                          </Card>
                        ))}
                        <button 
                          onClick={() => openModal("project")}
                          className="border-2 border-dashed border-slate-200 rounded-[2rem] p-12 flex flex-col items-center justify-center text-slate-300 hover:border-blue-400 hover:text-blue-500 transition-all bg-white hover:bg-blue-50/30 group"
                        >
                          <div className="h-16 w-16 rounded-3xl bg-slate-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Plus className="h-8 w-8" />
                          </div>
                          <span className="font-black text-sm tracking-widest uppercase">Tambah Proyek Baru</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-8 animate-in slide-in-from-right-10 duration-500">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                          <button 
                            onClick={closeProjectDetail}
                            className="h-14 w-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
                          >
                            <Plus className="h-6 w-6 rotate-45" />
                          </button>
                          <div>
                            <div className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-1">Manajemen Proyek</div>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight">{selectedProject?.name}</h2>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <Button 
                            onClick={() => {
                              openModal("unit");
                              setUnitData(prev => ({ ...prev, projectId: selectedProjectId || "" }));
                            }}
                            className="rounded-2xl bg-blue-600 px-8 h-12 font-black shadow-xl shadow-blue-500/20 hover:bg-blue-700 text-white"
                          >
                            <Plus className="mr-2 h-5 w-5" /> Tambah Unit Baru
                          </Button>
                        </div>
                      </div>

                      <div className="grid gap-8 lg:grid-cols-12">
                        {/* Siteplan Visualization */}
                        <div className="lg:col-span-8">
                          <Card className="border-slate-100 bg-white rounded-[2.5rem] shadow-sm overflow-hidden min-h-[600px] flex flex-col">
                            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                              <h3 className="font-black text-slate-900 uppercase tracking-widest text-sm flex items-center gap-3">
                                <Map className="h-5 w-5 text-blue-600" />
                                Visualisasi Siteplan
                              </h3>
                              <div className="flex gap-3">
                                <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400 mr-6">
                                  <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-emerald-500"></div> Tersedia</div>
                                  <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-amber-500"></div> Booked</div>
                                  <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-rose-500"></div> Terjual</div>
                                </div>
                                <Button variant="outline" size="sm" className="rounded-xl border-slate-200 font-bold text-xs h-9">Zoom Out</Button>
                                <Button variant="outline" size="sm" className="rounded-xl border-slate-200 font-bold text-xs h-9">Zoom In</Button>
                              </div>
                            </div>
                            <div className="flex-1 p-12 flex items-center justify-center bg-slate-50/30">
                              {/* Grid Layout of Units */}
                              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4 w-full max-w-4xl">
                                {selectedProject?.units?.map((unit) => (
                                  <div 
                                    key={unit.id}
                                    className={cn(
                                      "aspect-square rounded-2xl flex flex-col items-center justify-center border-2 transition-all cursor-pointer hover:scale-105 shadow-sm group relative",
                                      unit.status === 'available' ? "bg-white border-emerald-100 text-emerald-700 hover:border-emerald-400" :
                                      unit.status === 'booked' ? "bg-amber-50 border-amber-200 text-amber-700" :
                                      "bg-rose-50 border-rose-200 text-rose-700"
                                    )}
                                  >
                                    <div className="text-[10px] font-black tracking-tighter mb-1">{unit.unitCode}</div>
                                    <div className="text-[8px] font-bold opacity-50 uppercase">{unit.area}m2</div>
                                    
                                    {/* Tooltip on Hover */}
                                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white p-2 rounded-lg text-[10px] font-bold opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-20 whitespace-nowrap shadow-xl">
                                      {formatRupiah(unit.price)}
                                    </div>
                                  </div>
                                ))}
                                <button 
                                  onClick={() => {
                                    openModal("unit");
                                    setUnitData(prev => ({ ...prev, projectId: selectedProjectId || "" }));
                                  }}
                                  className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300 hover:bg-white hover:border-blue-300 hover:text-blue-500 transition-all"
                                >
                                  <Plus className="h-8 w-8" />
                                </button>
                              </div>
                            </div>
                          </Card>
                        </div>

                        {/* Unit Table / List */}
                        <div className="lg:col-span-4">
                          <Card className="border-slate-100 bg-white rounded-[2.5rem] shadow-sm overflow-hidden flex flex-col h-full">
                            <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                              <h3 className="font-black text-slate-900 uppercase tracking-widest text-sm">Daftar Unit</h3>
                            </div>
                            <div className="p-6 space-y-4 overflow-y-auto max-h-[500px] flex-1">
                              {selectedProject?.units?.map((unit) => (
                                <div key={unit.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-100 group hover:bg-white hover:border-blue-200 hover:shadow-md transition-all">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="text-sm font-black text-slate-900 tracking-tight">{unit.unitCode}</div>
                                    <span className={cn(
                                      "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-wider",
                                      unit.status === 'available' ? "bg-emerald-100 text-emerald-700" :
                                      unit.status === 'booked' ? "bg-amber-100 text-amber-700" :
                                      "bg-rose-100 text-rose-700"
                                    )}>
                                      {unit.status}
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4 text-[10px] font-bold text-slate-400 mb-4">
                                    <div>Luas: <span className="text-slate-900">{unit.area} m2</span></div>
                                    <div>Harga: <span className="text-slate-900">{formatRupiah(unit.price)}</span></div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button variant="outline" size="sm" className="flex-1 rounded-xl h-9 text-[10px] font-black uppercase tracking-widest border-slate-200 hover:bg-slate-50">Edit</Button>
                                    <Button 
                                      onClick={() => {
                                        openModal("sales");
                                        setSalesData(prev => ({ ...prev, projectId: selectedProjectId || "", unitId: unit.id, totalPrice: unit.price }));
                                      }}
                                      disabled={unit.status !== 'available'}
                                      className="flex-1 rounded-xl h-9 text-[10px] font-black uppercase tracking-widest bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/10 text-white disabled:opacity-30"
                                    >
                                      Booking
                                    </Button>
                                  </div>
                                </div>
                              ))}
                              {(!selectedProject?.units || selectedProject.units.length === 0) && (
                                <div className="p-10 text-center text-slate-300 border-2 border-dashed border-slate-100 rounded-3xl">
                                  <Home className="h-10 w-10 mx-auto mb-4 opacity-10" />
                                  <p className="font-black text-xs uppercase tracking-widest opacity-20">Belum ada unit ditambahkan</p>
                                </div>
                              )}
                            </div>
                          </Card>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "sales" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Penjualan <span className="text-blue-600">& CRM</span></h2>
                    <div className="flex gap-4">
                      <Button 
                        onClick={() => openModal("customer")}
                        variant="outline" 
                        className="rounded-2xl border-slate-200 bg-white h-12 px-6 font-black text-slate-600 hover:bg-slate-50 transition-all"
                      >
                        Database Konsumen
                      </Button>
                      <Button 
                        onClick={() => openModal("sales")}
                        className="rounded-2xl bg-blue-600 px-8 h-12 font-black shadow-xl shadow-blue-500/20 hover:bg-blue-700 text-white"
                      >
                        Input Penjualan Baru
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-8 lg:grid-cols-12">
                    <div className="lg:col-span-8">
                      <Card className="border-slate-100 bg-white rounded-[2rem] shadow-sm p-8">
                        <h3 className="text-xl font-black text-slate-900 mb-8 tracking-tight">Transaksi Terbaru</h3>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-[0.15em]">
                                <th className="pb-6 font-bold">Konsumen</th>
                                <th className="pb-6 font-bold">Proyek / Unit</th>
                                <th className="pb-6 font-bold text-center">Status</th>
                                <th className="pb-6 font-bold text-right">Total Transaksi</th>
                                <th className="pb-6 font-bold text-right">Aksi</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {stats?.recentSales?.map((sale) => (
                                <tr key={sale.id} className="group hover:bg-slate-50/50 transition-colors">
                                  <td className="py-6">
                                    <div className="font-black text-slate-900">{sale.customer?.name ?? "Customer"}</div>
                                    <div className="text-xs text-slate-400 font-medium">{sale.customer?.email ?? ""}</div>
                                  </td>
                                  <td className="py-6">
                                    <div className="text-sm font-bold text-slate-700">{sale.project?.name ?? "Project"}</div>
                                    <div className="text-[10px] text-blue-600 font-black tracking-widest uppercase mt-1">{sale.unit?.unitCode ?? ""}</div>
                                  </td>
                                  <td className="py-6 text-center">
                                    <span className={cn(
                                      "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm",
                                      sale.status === 'approved' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                                    )}>
                                      {sale.status}
                                    </span>
                                  </td>
                                  <td className="py-6 text-right font-black text-slate-900 tracking-tight">{formatRupiah(sale.totalPrice)}</td>
                                  <td className="py-6 text-right">
                                    <Button 
                                      onClick={() => generateSPR.mutate(sale.id)}
                                      disabled={generateSPR.isPending}
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-10 w-10 p-0 rounded-xl text-slate-300 hover:text-blue-600 hover:bg-blue-50"
                                    >
                                      <FileText className="h-5 w-5" />
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </Card>
                    </div>
                    <div className="lg:col-span-4">
                      <Card className="border-slate-100 bg-white rounded-[2rem] shadow-sm p-8">
                        <h3 className="text-xl font-black text-slate-900 mb-8 tracking-tight">Database Konsumen</h3>
                        <div className="space-y-4">
                          {customers?.slice(0, 5).map((c) => (
                            <div key={c.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 group cursor-pointer hover:border-blue-200 hover:bg-blue-50/50 transition-all">
                              <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-white shadow-sm text-blue-600 flex items-center justify-center font-black text-sm">
                                  {c.name.charAt(0)}
                                </div>
                                <div>
                                  <div className="text-sm font-black text-slate-900 tracking-tight">{c.name}</div>
                                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{c.phone || 'No Phone'}</div>
                                </div>
                              </div>
                              <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                            </div>
                          ))}
                          <Button 
                            onClick={() => openModal("customer")}
                            variant="ghost" 
                            className="w-full text-xs font-black uppercase tracking-widest text-blue-600 hover:bg-blue-50 h-12 rounded-2xl"
                          >
                            Lihat Semua Konsumen
                          </Button>
                        </div>
                      </Card>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "finance" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div>
                      <h2 className="text-3xl font-black text-slate-900 tracking-tight">Keuangan <span className="text-blue-600">& Akun</span></h2>
                      <p className="text-sm text-slate-400 font-medium mt-1">Sistem Akuntansi Berpasangan (Double-entry) Standar Properti</p>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-200 shadow-inner">
                        <button 
                          onClick={() => setActiveFinanceSubTab("journals")}
                          className={cn(
                            "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            activeFinanceSubTab === "journals" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                          )}
                        >
                          Jurnal Umum
                        </button>
                        <button 
                          onClick={() => setActiveFinanceSubTab("accounts")}
                          className={cn(
                            "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            activeFinanceSubTab === "accounts" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                          )}
                        >
                          Daftar Akun (COA)
                        </button>
                        <button 
                          onClick={() => setActiveFinanceSubTab("reports")}
                          className={cn(
                            "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            activeFinanceSubTab === "reports" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                          )}
                        >
                          Laporan
                        </button>
                      </div>
                      <Button 
                        onClick={() => openModal("journal")}
                        className="rounded-2xl bg-blue-600 px-8 h-12 font-black shadow-xl shadow-blue-500/20 hover:bg-blue-700 text-white"
                      >
                        <Plus className="mr-2 h-5 w-5" /> Buat Jurnal Baru
                      </Button>
                    </div>
                  </div>

                  {/* Summary Cards */}
                  <div className="grid gap-6 md:grid-cols-4 mb-10">
                    {[
                      { 
                        label: "Total Kas & Bank", 
                        val: formatRupiah((accounts ?? []).filter(a => a.code.startsWith('101')).reduce((s, a) => s + a.balance, 0)), 
                        trend: "Real-time", 
                        color: "text-emerald-600", 
                        bg: "bg-emerald-50" 
                      },
                      { 
                        label: "Piutang Berjalan", 
                        val: formatRupiah((accounts ?? []).filter(a => a.code.startsWith('102')).reduce((s, a) => s + a.balance, 0)), 
                        trend: "Real-time", 
                        color: "text-blue-600", 
                        bg: "bg-blue-50" 
                      },
                      { 
                        label: "Hutang Vendor", 
                        val: formatRupiah((accounts ?? []).filter(a => a.code.startsWith('201')).reduce((s, a) => s + a.balance, 0)), 
                        trend: "Real-time", 
                        color: "text-rose-600", 
                        bg: "bg-rose-50" 
                      },
                      { 
                        label: "Laba Berjalan", 
                        val: formatRupiah(
                          (accounts ?? []).filter(a => a.type === 'income').reduce((s, a) => s + a.balance, 0) -
                            (accounts ?? []).filter(a => a.type === 'expense').reduce((s, a) => s + a.balance, 0)
                        ), 
                        trend: "Real-time", 
                        color: "text-purple-600", 
                        bg: "bg-purple-50" 
                      },
                    ].map((item, i) => (
                      <Card key={i} className="border-slate-200 bg-white rounded-3xl p-6 shadow-sm group hover:shadow-xl transition-all">
                        <div className="flex items-center justify-between mb-3">
                          <div className={cn("p-2 rounded-xl text-[10px] font-black", item.bg, item.color)}>{item.trend}</div>
                          <div className="h-2 w-2 rounded-full bg-slate-200"></div>
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{item.label}</div>
                        <div className={cn("text-xl font-black tracking-tight", item.color)}>{item.val}</div>
                      </Card>
                    ))}
                  </div>

                  <div className="grid gap-8 lg:grid-cols-12">
                    <div className="lg:col-span-12">
                      {activeFinanceSubTab === "journals" && (
                        <Card className="border-slate-200 bg-white rounded-[2.5rem] shadow-sm overflow-hidden animate-in fade-in duration-500">
                          <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                              <h3 className="text-xl font-black text-slate-900 tracking-tight">Buku Jurnal Umum</h3>
                              <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest">Urutan kronologis transaksi properti</p>
                            </div>
                            <div className="flex gap-3">
                              <Button variant="outline" className="rounded-xl border-slate-200 font-bold text-xs h-10 px-5">Filter Tanggal</Button>
                              <Button variant="outline" className="rounded-xl border-slate-200 font-bold text-xs h-10 px-5">Export PDF/Excel</Button>
                            </div>
                          </div>
                          <div className="p-0">
                            <div className="overflow-x-auto">
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-[0.15em] bg-white">
                                    <th className="p-10 pb-6 font-bold">Waktu & Referensi</th>
                                    <th className="p-10 pb-6 font-bold">Keterangan Transaksi</th>
                                    <th className="p-10 pb-6 font-bold text-right">Debit</th>
                                    <th className="p-10 pb-6 font-bold text-right">Kredit</th>
                                    <th className="p-10 pb-6 font-bold text-center">Status</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                  {journals?.map((j) => (
                                    <tr key={j.id} className="group hover:bg-slate-50/30 transition-colors">
                                      <td className="p-10 py-8">
                                        <div className="font-black text-slate-900">{new Date(j.date).toLocaleDateString("id-ID", { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                                        <div className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-widest">REF: {j.id.slice(0, 8).toUpperCase()}</div>
                                      </td>
                                      <td className="p-10 py-8">
                                        <div className="font-black text-slate-900 leading-tight mb-2">{j.description}</div>
                                        <div className="flex flex-col gap-1.5">
                                          {j.details.map((d, idx) => (
                                            <div key={idx} className={cn("text-[10px] font-bold flex items-center gap-2", d.credit > 0 ? "pl-6 text-blue-500" : "text-emerald-600")}>
                                              <span className="opacity-50 tracking-tighter">[{d.account.code}]</span>
                                              <span>{d.account.name}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </td>
                                      <td className="p-10 py-8 text-right align-top">
                                        <div className="font-black text-emerald-600 tracking-tight">
                                          {formatRupiah(j.details.reduce((s, d) => s + d.debit, 0))}
                                        </div>
                                      </td>
                                      <td className="p-10 py-8 text-right align-top">
                                        <div className="font-black text-blue-600 tracking-tight">
                                          {formatRupiah(j.details.reduce((s, d) => s + d.credit, 0))}
                                        </div>
                                      </td>
                                      <td className="p-10 py-8 text-center align-top">
                                        <div className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shadow-sm border border-emerald-100">
                                          <CheckCircle2 className="h-4 w-4" />
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                  {(!journals || journals.length === 0) && (
                                    <tr>
                                      <td colSpan={5} className="p-20 text-center text-slate-300">
                                        <div className="flex flex-col items-center gap-4">
                                          <Wallet className="h-12 w-12 opacity-10" />
                                          <p className="font-black text-sm tracking-widest uppercase opacity-20">Belum ada transaksi terekam</p>
                                          <Button variant="outline" className="mt-2 rounded-xl border-slate-200" onClick={() => openModal("journal")}>Buat Jurnal Pertama</Button>
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </Card>
                      )}

                      {activeFinanceSubTab === "accounts" && (
                        <div className="animate-in fade-in duration-500">
                          <div className="flex items-center justify-between mb-8">
                            <div>
                              <h3 className="text-xl font-black text-slate-900 tracking-tight">Chart of Accounts (COA)</h3>
                              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Struktur keuangan standar properti</p>
                            </div>
                            {(!accounts || accounts.length === 0) && (
                              <Button 
                                onClick={() => {
                                  refetchAccounts().then(() => {
                                    alert("Daftar akun berhasil disinkronisasi. Silakan muat ulang halaman jika akun belum muncul.");
                                    window.location.reload();
                                  });
                                }}
                                className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs h-10 px-6 shadow-lg shadow-amber-500/20"
                              >
                                Sinkronisasi Daftar Akun
                              </Button>
                            )}
                          </div>
                          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                            {['asset', 'liability', 'equity', 'income', 'expense'].map(type => (
                              <Card key={type} className="border-slate-200 bg-white rounded-[2rem] shadow-sm overflow-hidden flex flex-col">
                                <div className={cn(
                                  "p-8 border-b border-slate-100 flex items-center justify-between",
                                  type === 'asset' ? "bg-emerald-50/50" : 
                                  type === 'liability' ? "bg-rose-50/50" :
                                  type === 'income' ? "bg-blue-50/50" : "bg-slate-50/50"
                                )}>
                                  <h3 className="font-black text-slate-900 uppercase tracking-widest text-sm">
                                    {type === 'asset' ? 'Assets' : 
                                     type === 'liability' ? 'Liabilities' : 
                                     type === 'equity' ? 'Equity' : 
                                     type === 'income' ? 'Income' : 'Expenses'}
                                  </h3>
                                  <span className="text-[10px] font-black text-slate-400 bg-white px-3 py-1 rounded-full shadow-sm">
                                    {accounts?.filter(a => a.type === type).length ?? 0} Akun
                                  </span>
                                </div>
                                <div className="p-6 space-y-3 overflow-y-auto max-h-[500px] scrollbar-hide flex-1">
                                  {accounts?.filter(a => a.type === type).map(acc => (
                                    <div key={acc.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-100 group hover:bg-white hover:border-blue-200 hover:shadow-md transition-all">
                                      <div className="flex items-center justify-between mb-1">
                                        <div className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">{acc.code}</div>
                                        <div className="h-1.5 w-1.5 rounded-full bg-slate-200 group-hover:bg-blue-500 transition-colors"></div>
                                      </div>
                                      <div className="text-sm font-black text-slate-900 tracking-tight">{acc.name}</div>
                                      <div className="mt-3 flex items-center justify-between">
                                        <div className={cn(
                                          "text-[10px] font-bold px-2 py-1 rounded-lg shadow-sm",
                                          acc.balance >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                                        )}>
                                          Saldo: {formatRupiah(acc.balance || 0)}
                                        </div>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                                          <ChevronRight className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                  {(!accounts || accounts.filter(a => a.type === type).length === 0) && (
                                    <div className="p-8 text-center text-slate-400 text-xs italic">
                                      Belum ada akun
                                    </div>
                                  )}
                                </div>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}

                      {activeFinanceSubTab === "reports" && (
                        <div className="animate-in fade-in duration-500">
                          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                            {[
                              { 
                                title: "Laporan Neraca", 
                                desc: "Posisi Aset, Hutang, Modal", 
                                icon: <FileText className="h-6 w-6" />, 
                                color: "blue", 
                                detail: "Pantau kesehatan finansial perusahaan secara real-time dengan laporan Neraca otomatis." 
                              },
                              { 
                                title: "Laba Rugi", 
                                desc: "Kinerja & Profitabilitas", 
                                icon: <TrendingUp className="h-6 w-6" />, 
                                color: "emerald", 
                                detail: "Analisis pendapatan dan beban untuk melihat profitabilitas setiap proyek properti Anda." 
                              },
                              { 
                                title: "Buku Besar", 
                                desc: "Rincian Transaksi per Akun", 
                                icon: <ClipboardList className="h-6 w-6" />, 
                                color: "amber", 
                                detail: "Lihat histori mutasi debit dan kredit untuk setiap akun COA secara mendetail." 
                              },
                              { 
                                title: "Neraca Saldo", 
                                desc: "Ringkasan Saldo Akhir", 
                                icon: <LayoutDashboard className="h-6 w-6" />, 
                                color: "purple", 
                                detail: "Verifikasi keseimbangan saldo seluruh akun sebelum penutupan periode akuntansi." 
                              },
                            ].map((rep, idx) => (
                              <Card key={idx} className={cn(
                                "border-slate-200 bg-white rounded-[2rem] shadow-sm p-8 hover:shadow-xl transition-all group flex flex-col justify-between",
                                rep.color === 'blue' ? "hover:border-blue-200" :
                                rep.color === 'emerald' ? "hover:border-emerald-200" :
                                rep.color === 'amber' ? "hover:border-amber-200" : "hover:border-purple-200"
                              )}>
                                <div>
                                  <div className={cn(
                                    "h-12 w-12 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform",
                                    rep.color === 'blue' ? "bg-blue-50 text-blue-600" :
                                    rep.color === 'emerald' ? "bg-emerald-50 text-emerald-600" :
                                    rep.color === 'amber' ? "bg-amber-50 text-amber-600" : "bg-purple-50 text-purple-600"
                                  )}>
                                    {rep.icon}
                                  </div>
                                  <h3 className="text-lg font-black text-slate-900 tracking-tight">{rep.title}</h3>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 mb-4">{rep.desc}</p>
                                  <p className="text-xs text-slate-500 leading-relaxed mb-8">{rep.detail}</p>
                                </div>
                                <Button className={cn(
                                  "w-full h-12 rounded-xl text-white font-black text-[10px] tracking-widest uppercase shadow-lg transition-all",
                                  rep.color === 'blue' ? "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20" :
                                  rep.color === 'emerald' ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20" :
                                  rep.color === 'amber' ? "bg-amber-600 hover:bg-amber-700 shadow-amber-500/20" : "bg-purple-600 hover:bg-purple-700 shadow-purple-500/20"
                                )}>
                                  Generate
                                </Button>
                              </Card>
                            ))}
                          </div>

                          {/* Report Settings/Filters Area */}
                          <Card className="mt-10 border-slate-200 bg-white rounded-[2.5rem] shadow-sm p-8 border-dashed">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                              <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                  <Settings className="h-5 w-5" />
                                </div>
                                <div>
                                  <h4 className="font-black text-slate-900 text-sm">Konfigurasi Laporan Otomatis</h4>
                                  <p className="text-xs text-slate-400 font-medium">Atur periode pelaporan dan pengiriman email otomatis ke owner.</p>
                                </div>
                              </div>
                              <div className="flex gap-3">
                                <Button variant="outline" className="rounded-xl border-slate-200 font-bold text-xs h-10">Periode: Maret 2026</Button>
                                <Button variant="outline" className="rounded-xl border-slate-200 font-bold text-xs h-10">Mata Uang: IDR</Button>
                              </div>
                            </div>
                          </Card>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "construction" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Progres <span className="text-blue-600">Konstruksi</span></h2>
                    <Button 
                      onClick={() => openModal("construction")}
                      className="rounded-2xl bg-blue-600 px-8 h-12 font-black shadow-xl shadow-blue-500/20 hover:bg-blue-700 text-white"
                    >
                      <Plus className="mr-2 h-5 w-5" /> Update Progres Lapangan
                    </Button>
                  </div>

                  <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                    {[
                      { label: "Proyek Aktif", val: constStats?.activeProjects || 0, icon: <Building2 />, color: "text-blue-600", bg: "bg-blue-50" },
                      { label: "Tugas Pending", val: constStats?.pendingTasks || 0, icon: <ClipboardList />, color: "text-amber-600", bg: "bg-amber-50" },
                      { label: "Total RAB", val: formatRupiah(constStats?.totalBudget || 0), icon: <Wallet />, color: "text-purple-600", bg: "bg-purple-50" },
                      { label: "Realisasi", val: formatRupiah(constStats?.realizedBudget || 0), icon: <TrendingUp />, color: "text-emerald-600", bg: "bg-emerald-50" },
                    ].map((item, i) => (
                      <Card key={i} className="border-slate-100 bg-white rounded-[2rem] p-6 shadow-sm group hover:shadow-xl transition-all">
                        <div className={cn("p-3 rounded-2xl w-fit mb-4", item.bg, item.color)}>{item.icon}</div>
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{item.label}</div>
                        <div className={cn("text-xl font-black tracking-tight", item.color)}>{item.val}</div>
                      </Card>
                    ))}
                  </div>

                  <Card className="border-slate-100 bg-white rounded-[2.5rem] shadow-sm p-8 sm:p-10 overflow-hidden relative">
                    <div className="flex items-center justify-between mb-10">
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">Monitoring Proyek Real-time</h3>
                      <div className="flex gap-2">
                        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">85% On Track</div>
                      </div>
                    </div>
                    
                    <div className="space-y-10 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
                      {inventory?.map((p) => (
                        <div key={p.id} className="space-y-4">
                          <div className="flex justify-between items-end">
                            <div>
                              <h4 className="font-black text-slate-900">{p.name}</h4>
                              <p className="text-xs text-slate-400 font-bold">Infrastruktur & Fasilitas Umum</p>
                            </div>
                            <span className="text-sm font-black text-blue-600">65%</span>
                          </div>
                          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                            <div className="h-full bg-blue-600 rounded-full w-[65%] shadow-lg shadow-blue-500/20"></div>
                          </div>
                          <div className="flex gap-6">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-blue-500"></div> Pondasi: Selesai
                            </div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-amber-500"></div> Dinding: In Progress
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              )}

              {activeTab === "legal" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Legal <span className="text-blue-600">& Dokumen</span></h2>
                    <Button 
                      onClick={() => openModal("legal-upload")}
                      className="rounded-2xl bg-blue-600 px-8 h-12 font-black shadow-xl shadow-blue-500/20 hover:bg-blue-700 text-white"
                    >
                      <Plus className="mr-2 h-5 w-5" /> Upload Dokumen Baru
                    </Button>
                  </div>

                  <div className="grid gap-8 md:grid-cols-3 mb-12">
                    {[
                      { label: "Total Dokumen", val: legalStats?.totalDocuments || 0, color: "text-blue-600", bg: "bg-blue-50" },
                      { label: "Menunggu Review", val: legalStats?.pendingReview || 0, color: "text-amber-600", bg: "bg-amber-50" },
                      { label: "Lisensi Expired", val: legalStats?.expiredLicenses || 0, color: "text-rose-600", bg: "bg-rose-50" },
                    ].map((item, i) => (
                      <Card key={i} className="border-slate-100 bg-white rounded-[2rem] p-8 shadow-sm group hover:shadow-xl transition-all">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">{item.label}</div>
                        <div className={cn("text-3xl font-black tracking-tight", item.color)}>{item.val}</div>
                        <div className={cn("mt-4 h-1.5 w-12 rounded-full opacity-30", item.color.replace('text-', 'bg-'))}></div>
                      </Card>
                    ))}
                  </div>

                  <Card className="border-slate-100 bg-white rounded-[2.5rem] shadow-sm p-8 sm:p-10">
                    <h3 className="text-xl font-black text-slate-900 mb-8 tracking-tight">Repositori Dokumen Proyek</h3>
                    <div className="grid gap-6 md:grid-cols-2 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
                      {generatedDocs?.map((doc) => (
                        <div 
                          key={doc.id} 
                          onClick={() => {
                            setPreviewDoc({ name: "Surat Pesanan Rumah (SPR)", content: doc.content });
                            setModalType("doc-preview");
                            setIsModalOpen(true);
                          }}
                          className="p-6 rounded-[2rem] border border-slate-100 bg-slate-50/50 flex items-center justify-between group hover:border-blue-200 hover:bg-white transition-all cursor-pointer"
                        >
                          <div className="flex items-center gap-5">
                            <div className="h-14 w-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                              <FileText className="h-7 w-7" />
                            </div>
                            <div>
                              <div className="font-black text-slate-900">SPR - {doc.sales?.customer?.name || 'Unit'}</div>
                              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                                {new Date(doc.createdAt).toLocaleDateString("id-ID", { day: '2-digit', month: 'long', year: 'numeric' })}
                              </div>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-xl text-slate-300 hover:text-blue-600 hover:bg-blue-50">
                            <ExternalLink className="h-5 w-5" />
                          </Button>
                        </div>
                      ))}
                      {(!generatedDocs || generatedDocs.length === 0) && (
                        ['Sertifikat Induk', 'IMB / PBG', 'Izin Lokasi', 'PKS Bank'].map((doc, i) => (
                          <div key={i} className="p-6 rounded-[2rem] border border-slate-100 bg-slate-50/50 flex items-center justify-between group hover:border-blue-200 hover:bg-white transition-all cursor-pointer">
                            <div className="flex items-center gap-5">
                              <div className="h-14 w-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                                <FileText className="h-7 w-7" />
                              </div>
                              <div>
                                <div className="font-black text-slate-900">{doc}</div>
                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Last Updated: 2 hari lalu</div>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-xl text-slate-300 hover:text-blue-600 hover:bg-blue-50">
                              <ExternalLink className="h-5 w-5" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </Card>
                </div>
              )}

              {activeTab === "subscription" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-10">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h2 className="text-3xl font-black text-slate-900 tracking-tight">Status <span className="text-blue-600">Langganan</span></h2>
                      <p className="text-sm text-slate-400 font-medium mt-1">Kelola masa aktif ERP dan informasi billing Anda</p>
                    </div>
                    <Button 
                      onClick={() => openModal("renew")}
                      className="rounded-2xl bg-blue-600 px-8 h-12 font-black shadow-xl shadow-blue-500/20 hover:bg-blue-700 text-white"
                    >
                      PERPANJANG SEKARANG
                    </Button>
                  </div>

                  <div className="grid gap-8 lg:grid-cols-3">
                    {/* Status Card */}
                    <Card className="lg:col-span-2 border-slate-100 bg-white rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-10 opacity-5">
                        <ShieldCheck className="h-40 w-40 text-blue-600" />
                      </div>
                      
                      <div className="relative z-10 flex flex-col md:flex-row gap-10">
                        <div className="flex-1 space-y-8">
                          <div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Status Akun</div>
                            <div className="flex items-center gap-3">
                              <span className={cn(
                                "px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-sm",
                                subscription?.status === 'active' ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
                              )}>
                                {subscription?.status === 'active' ? 'ACTIVE' : (subscription?.status === 'trial' ? 'TRIAL' : subscription?.status?.toUpperCase() || 'TRIAL')} MODE
                              </span>
                              {subscription?.status === 'trial' && (
                                <span className="text-[10px] font-bold text-amber-600">Berakhir dalam {subscription.daysRemaining} hari</span>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-8">
                            <div>
                              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Masa Aktif</div>
                              <div className="text-2xl font-black text-slate-900 tracking-tight">
                                {subscription?.daysRemaining ?? 0} <span className="text-sm text-slate-400 uppercase">Hari Lagi</span>
                              </div>
                            </div>
                            <div>
                              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Partner / Distributor</div>
                              <div className="text-sm font-bold text-slate-700">{subscription?.partner?.name || 'Livinova Direct'}</div>
                            </div>
                          </div>

                          <div className="pt-6 border-t border-slate-50">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Fitur Terbuka</div>
                            <div className="grid grid-cols-2 gap-3">
                              {['Multi-Project Support', 'Real-time Siteplan', 'Accounting Suite', 'SPR Automation', 'Customer CRM', 'Document Vault'].map((f, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> {f}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="w-full md:w-64 bg-slate-50 rounded-[2rem] p-8 flex flex-col items-center justify-center text-center border border-slate-100 shadow-inner">
                          <div className="h-20 w-20 rounded-3xl bg-white shadow-xl flex items-center justify-center mb-6 text-blue-600">
                            <Zap className="h-10 w-10 fill-current" />
                          </div>
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Paket Saat Ini</div>
                          <div className="text-xl font-black text-slate-900 mb-4 tracking-tight">
                            {subscription?.status === 'active' ? 'ENTERPRISE PRO' : 'TRIAL VERSION'}
                          </div>
                          <Button 
                            onClick={() => openModal("renew")}
                            variant="outline" 
                            className="w-full rounded-xl border-slate-200 text-[10px] font-black uppercase tracking-widest h-10 hover:bg-white"
                          >
                            Ubah Paket
                          </Button>
                        </div>
                      </div>
                    </Card>

                    {/* Quick Info & Warnings */}
                    <div className="space-y-8">
                      {subscription?.isExpiringSoon && (
                        <Card className="border-amber-200 bg-amber-50 rounded-[2rem] p-8 border-2 animate-pulse">
                          <div className="flex items-start gap-4">
                            <div className="h-10 w-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
                              <AlertTriangle className="h-6 w-6" />
                            </div>
                            <div>
                              <h4 className="text-sm font-black text-amber-700 uppercase tracking-widest mb-1">Masa Aktif Hampir Habis</h4>
                              <p className="text-xs text-amber-600 font-medium leading-relaxed">
                                Sisa masa aktif Anda kurang dari 7 hari. Segera hubungi partner Anda atau lakukan pembayaran untuk menghindari penghentian layanan.
                              </p>
                            </div>
                          </div>
                        </Card>
                      )}

                      <Card className="border-slate-100 bg-white rounded-[2rem] p-8 shadow-sm">
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-3">
                          <History className="h-5 w-5 text-slate-400" />
                          Riwayat Lisensi
                        </h4>
                        <div className="space-y-4">
                          {[
                            { date: '26 Mar 2026', type: 'Renewal', status: 'Success' },
                            { date: '26 Feb 2026', type: 'Initial', status: 'Success' },
                          ].map((h, i) => (
                            <div key={i} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                              <div>
                                <div className="text-xs font-bold text-slate-900">{h.type} Enterprise</div>
                                <div className="text-[10px] text-slate-400 font-medium">{h.date}</div>
                              </div>
                              <span className="text-[8px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">Verified</span>
                            </div>
                          ))}
                        </div>
                        <Button variant="ghost" className="w-full mt-6 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600">Download Invoice</Button>
                      </Card>

                      <Card className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-110 transition-transform duration-500">
                          <CreditCard className="h-12 w-12" />
                        </div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Metode Pembayaran</h4>
                        <div className="text-sm font-bold mb-6">VA Bank Mandiri / BCA Automatic</div>
                        <Button className="w-full bg-white/10 hover:bg-white/20 text-white border-white/10 rounded-xl h-10 text-[10px] font-black uppercase tracking-widest">Ganti Metode</Button>
                      </Card>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>

        {/* Modal Overlay */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 backdrop-blur-xl bg-slate-900/40 animate-in fade-in duration-500">
            <div className="w-full max-w-xl bg-white border border-slate-200 rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.15)] overflow-hidden animate-in zoom-in-95 duration-500 max-h-[85vh] flex flex-col">
              {/* Modal Header - Fixed */}
              <div className="px-8 py-6 sm:px-10 sm:py-8 border-b border-slate-50 flex items-center justify-between bg-gradient-to-r from-blue-50 to-transparent flex-shrink-0">
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {modalType === "project" && "Tambah Proyek Baru"}
                    {modalType === "sales" && "Input Penjualan Baru"}
                    {modalType === "journal" && "Buat Jurnal Baru"}
                    {modalType === "customer" && "Tambah Konsumen"}
                    {modalType === "unit" && "Tambah Unit Proyek"}
                    {modalType === "doc-preview" && "Preview Dokumen"}
                    {modalType === "construction" && "Update Progres Lapangan"}
                    {modalType === "legal-upload" && "Upload Dokumen Baru"}
                    {modalType === "renew" && "Perpanjang Langganan"}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">LIVINOVA ENTERPRISE ERP</p>
                </div>
                <button onClick={closeModal} className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors border border-slate-100">
                  <Plus className="h-6 w-6 rotate-45" />
                </button>
              </div>
              
              {/* Modal Body - Scrollable */}
              <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
                {modalType === "renew" && (
                  <div className="space-y-8">
                    <div className="text-center">
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight">Pilih Paket Perpanjangan</h3>
                      <p className="text-sm text-slate-500 font-medium mt-1">Pilih durasi langganan yang paling sesuai untuk Anda.</p>
                    </div>
                    <div className="grid gap-6 md:grid-cols-2">
                      {(tenantPricingPlans || []).map((plan) => (
                        <Card 
                          key={plan.id} 
                          onClick={() => renewLicenseMutation.mutate(plan.id)}
                          className="border-slate-200 bg-white rounded-[2rem] p-8 shadow-sm hover:shadow-2xl hover:border-blue-500 hover:-translate-y-2 transition-all cursor-pointer group relative"
                        >
                          <div className="text-center">
                            <div className="mb-4">
                              <span className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">{plan.durationDays} HARI</span>
                            </div>
                            <h4 className="text-xl font-black text-slate-900 tracking-tight mb-1">{plan.name}</h4>
                            <p className="text-xs text-slate-400 font-medium mb-6 h-8">{plan.description}</p>
                            <div className="text-4xl font-black text-blue-600 tracking-tighter mb-6">{formatRupiah(plan.price)}</div>
                            <Button 
                              disabled={renewLicenseMutation.isPending}
                              className="w-full h-12 rounded-xl bg-blue-600 text-white font-black text-xs tracking-widest uppercase shadow-lg shadow-blue-500/20 group-hover:bg-blue-700 transition-all"
                            >
                              {renewLicenseMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "PILIH & BAYAR"}
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                    <p className="text-xs text-center text-slate-400 italic pt-4 border-t border-slate-100">* Proses pembayaran akan disimulasikan. Lisensi akan langsung aktif setelah pemilihan paket.</p>
                  </div>
                )}

                {modalType === "doc-preview" && previewDoc && (
                  <div className="space-y-6">
                    <div className="p-8 bg-slate-50 border border-slate-100 rounded-[2rem] min-h-[400px] overflow-y-auto max-h-[60vh] font-serif shadow-inner">
                      <div className="prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: previewDoc.content }}></div>
                    </div>
                  </div>
                )}

                {modalType === "construction" && (
                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Pilih Proyek</label>
                      <select 
                        value={constructionData.projectId}
                        onChange={(e) => setConstructionData({ ...constructionData, projectId: e.target.value })}
                        className="w-full bg-slate-50 border-slate-200 rounded-2xl h-14 px-6 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm appearance-none"
                      >
                        <option value="">-- Pilih Proyek --</option>
                        {projects?.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Tahap Pekerjaan</label>
                        <select 
                          value={constructionData.stage}
                          onChange={(e) => setConstructionData({ ...constructionData, stage: e.target.value })}
                          className="w-full bg-slate-50 border-slate-200 rounded-2xl h-14 px-6 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm appearance-none"
                        >
                          <option value="">-- Pilih Tahap --</option>
                          <option value="Pondasi">Pondasi & Struktur Bawah</option>
                          <option value="Dinding">Dinding & Kolom</option>
                          <option value="Atap">Atap & Rangka</option>
                          <option value="Finishing">Finishing & MEP</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Progres (%)</label>
                        <Input 
                          type="number"
                          value={constructionData.progress}
                          onChange={(e) => setConstructionData({ ...constructionData, progress: Number(e.target.value) })}
                          placeholder="0" 
                          className="bg-slate-50 border-slate-200 rounded-2xl h-14 px-6 focus:ring-blue-500/10 focus:border-blue-500 font-bold shadow-sm" 
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Catatan Lapangan</label>
                      <textarea 
                        value={constructionData.notes}
                        onChange={(e) => setConstructionData({ ...constructionData, notes: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-[1.5rem] p-6 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 min-h-[100px] shadow-sm" 
                        placeholder="Berikan detail progres atau kendala di lapangan..." 
                      />
                    </div>
                  </div>
                )}

                {modalType === "legal-upload" && (
                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Judul Dokumen</label>
                      <Input 
                        value={legalData.title}
                        onChange={(e) => setLegalData({ ...legalData, title: e.target.value })}
                        placeholder="Contoh: Sertifikat HGB No. 123" 
                        className="bg-slate-50 border-slate-200 rounded-2xl h-14 px-6 focus:ring-blue-500/10 focus:border-blue-500 font-bold shadow-sm" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Jenis Dokumen</label>
                      <select 
                        value={legalData.type}
                        onChange={(e) => setLegalData({ ...legalData, type: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl h-14 px-6 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm appearance-none"
                      >
                        <option value="">-- Pilih Jenis --</option>
                        <option value="Sertifikat">Sertifikat Induk/Pecahan</option>
                        <option value="IMB">IMB / PBG</option>
                        <option value="Pajak">Pajak (PBB/PPh)</option>
                        <option value="Perjanjian">Perjanjian (PKS/PPJB)</option>
                      </select>
                    </div>
                    
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      className="hidden" 
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                    
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={cn(
                        "p-10 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center transition-all cursor-pointer group",
                        isDragging ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-slate-50 hover:border-blue-400 hover:bg-white",
                        legalData.file ? "border-emerald-200 bg-emerald-50/30" : ""
                      )}
                    >
                      {legalData.file ? (
                        <>
                          <div className="h-14 w-14 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 mb-4">
                            <FileText className="h-8 w-8" />
                          </div>
                          <p className="text-sm font-black text-slate-900">{legalData.file.name}</p>
                          <p className="text-[10px] text-emerald-600 font-bold uppercase mt-1">File Terpilih - Klik untuk ganti</p>
                        </>
                      ) : (
                        <>
                          <FileText className="h-10 w-10 text-slate-300 group-hover:text-blue-500 mb-4 transition-colors" />
                          <p className="text-xs font-bold text-slate-400 group-hover:text-blue-600 transition-colors text-center">
                            Klik untuk pilih file atau seret ke sini
                          </p>
                          <p className="text-[10px] text-slate-300 mt-2">Format PDF, JPG, atau PNG (Max 5MB)</p>
                        </>
                      )}
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Keterangan Tambahan</label>
                      <textarea 
                        value={legalData.notes}
                        onChange={(e) => setLegalData({ ...legalData, notes: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-[1.5rem] p-6 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 min-h-[100px] shadow-sm" 
                        placeholder="Tambahkan catatan jika diperlukan..." 
                      />
                    </div>
                  </div>
                )}

                {modalType === "project" && (
                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Nama Proyek</label>
                      <Input 
                        value={projectData.name}
                        onChange={(e) => setProjectData({ ...projectData, name: e.target.value })}
                        placeholder="Contoh: Cendana Residence Phase 2" 
                        className="bg-slate-50 border-slate-200 rounded-2xl h-14 px-6 focus:ring-blue-500/10 focus:border-blue-500 font-bold shadow-sm" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Deskripsi Proyek</label>
                      <textarea 
                        value={projectData.description}
                        onChange={(e) => setProjectData({ ...projectData, description: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-[1.5rem] p-6 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 min-h-[120px] shadow-sm" 
                        placeholder="Berikan detail deskripsi mengenai proyek ini..." 
                      />
                    </div>
                  </div>
                )}

                {modalType === "sales" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Pilih Proyek</label>
                        <select 
                          value={salesData.projectId}
                          onChange={(e) => setSalesData({ ...salesData, projectId: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl h-14 px-6 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm appearance-none"
                        >
                          <option value="">-- Pilih Proyek --</option>
                          {projects?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Pilih Unit</label>
                        <select 
                          value={salesData.unitId}
                          onChange={(e) => setSalesData({ ...salesData, unitId: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl h-14 px-6 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm appearance-none"
                        >
                          <option value="">-- Pilih Unit --</option>
                          {projects
                            ?.find((p) => p.id === salesData.projectId)
                            ?.units.filter((u) => u.status === "available")
                            .map((u) => (
                            <option key={u.id} value={u.id}>{u.unitCode}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Pilih Konsumen</label>
                      <select 
                        value={salesData.customerId}
                        onChange={(e) => setSalesData({ ...salesData, customerId: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl h-14 px-6 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm appearance-none"
                      >
                        <option value="">-- Pilih Konsumen --</option>
                        {customers?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Harga Transaksi (Net)</label>
                      <Input 
                        type="number" 
                        value={salesData.totalPrice}
                        onChange={(e) => setSalesData({ ...salesData, totalPrice: Number(e.target.value) })}
                        placeholder="Rp 0" 
                        className="bg-slate-50 border-slate-200 rounded-2xl h-14 px-6 focus:ring-blue-500/10 focus:border-blue-500 font-black shadow-sm" 
                      />
                    </div>
                  </div>
                )}

                {modalType === "customer" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Nama Lengkap</label>
                        <Input 
                          value={customerData.name}
                          onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
                          placeholder="Nama Konsumen" 
                          className="bg-slate-50 border-slate-200 rounded-2xl h-14 px-6 focus:ring-blue-500/10 focus:border-blue-500 font-bold shadow-sm" 
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Alamat Email</label>
                        <Input 
                          type="email"
                          value={customerData.email}
                          onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                          placeholder="email@example.com" 
                          className="bg-slate-50 border-slate-200 rounded-2xl h-14 px-6 focus:ring-blue-500/10 focus:border-blue-500 font-bold shadow-sm" 
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Nomor Telepon / WA</label>
                      <Input 
                        value={customerData.phone}
                        onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                        placeholder="+62..." 
                        className="bg-slate-50 border-slate-200 rounded-2xl h-14 px-6 focus:ring-blue-500/10 focus:border-blue-500 font-bold shadow-sm" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Alamat Lengkap</label>
                      <textarea 
                        value={customerData.address}
                        onChange={(e) => setCustomerData({ ...customerData, address: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-[1.5rem] p-6 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 min-h-[100px] shadow-sm" 
                        placeholder="Alamat lengkap konsumen..." 
                      />
                    </div>
                  </div>
                )}

                {modalType === "journal" && (
                  <div className="space-y-6">
                    <div className="flex gap-6">
                      <div className="flex-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Tanggal Jurnal</label>
                        <Input 
                          type="date" 
                          value={journalData.date}
                          onChange={(e) => setJournalData({ ...journalData, date: e.target.value })}
                          className="bg-slate-50 border-slate-200 rounded-2xl h-14 px-6 focus:ring-blue-500/10 focus:border-blue-500 font-bold shadow-sm" 
                        />
                      </div>
                      <div className="flex-[2]">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Keterangan Transaksi</label>
                        <Input 
                          value={journalData.description}
                          onChange={(e) => setJournalData({ ...journalData, description: e.target.value })}
                          placeholder="Contoh: Penerimaan Booking Unit A01" 
                          className="bg-slate-50 border-slate-200 rounded-2xl h-14 px-6 focus:ring-blue-500/10 focus:border-blue-500 font-bold shadow-sm" 
                        />
                      </div>
                    </div>
                    
                    <div className="p-8 rounded-[2rem] bg-slate-50 border border-slate-100 space-y-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rincian Akun (Debit/Kredit)</span>
                        <Button 
                          type="button"
                          onClick={addJournalRow}
                          size="sm" 
                          variant="ghost" 
                          className="text-blue-600 text-[10px] font-black uppercase tracking-widest"
                        >
                          + Tambah Baris
                        </Button>
                      </div>
                      
                      {journalData.details.map((detail, idx) => (
                        <div key={idx} className="flex gap-3 group/row items-center">
                          <select 
                            value={detail.accountCode}
                            onChange={(e) => {
                              const newDetails = [...journalData.details];
                              newDetails[idx].accountCode = e.target.value;
                              setJournalData({ ...journalData, details: newDetails });
                            }}
                            className="flex-1 bg-white border border-slate-200 rounded-xl h-12 px-4 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/10"
                          >
                            <option value="">Pilih Akun</option>
                            {accounts?.map(acc => (
                              <option key={acc.id} value={acc.code}>
                                [{acc.code}] {acc.name}
                              </option>
                            ))}
                          </select>
                          <Input 
                            type="number"
                            placeholder="Debit"
                            value={detail.debit || ""}
                            onChange={(e) => {
                              const newDetails = [...journalData.details];
                              newDetails[idx].debit = Number(e.target.value);
                              setJournalData({ ...journalData, details: newDetails });
                            }}
                            className="w-32 bg-white border border-slate-200 h-12 text-xs font-black text-emerald-600 text-right" 
                          />
                          <Input 
                            type="number"
                            placeholder="Kredit"
                            value={detail.credit || ""}
                            onChange={(e) => {
                              const newDetails = [...journalData.details];
                              newDetails[idx].credit = Number(e.target.value);
                              setJournalData({ ...journalData, details: newDetails });
                            }}
                            className="w-32 bg-white border border-slate-200 h-12 text-xs font-black text-blue-600 text-right" 
                          />
                          <button 
                            type="button"
                            onClick={() => removeJournalRow(idx)}
                            className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover/row:opacity-100"
                          >
                            <Plus className="h-4 w-4 rotate-45" />
                          </button>
                        </div>
                      ))}

                      <div className="pt-4 border-t border-slate-200 mt-4 flex items-center justify-between">
                        <div className="flex gap-6">
                          <div className="text-right">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Debit</div>
                            <div className="text-sm font-black text-emerald-600">{formatRupiah(journalTotals.debit)}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Kredit</div>
                            <div className="text-sm font-black text-blue-600">{formatRupiah(journalTotals.credit)}</div>
                          </div>
                        </div>
                        {!isJournalBalanced && journalTotals.debit > 0 && (
                          <div className="text-[10px] font-black text-rose-500 uppercase tracking-widest bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
                            Jurnal Tidak Seimbang
                          </div>
                        )}
                        {isJournalBalanced && (
                          <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                            Jurnal Seimbang
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {modalType === "unit" && (
                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Pilih Proyek</label>
                      <select 
                        value={unitData.projectId}
                        onChange={(e) => setUnitData({ ...unitData, projectId: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl h-14 px-6 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm appearance-none"
                      >
                        <option value="">-- Pilih Proyek --</option>
                        {projects?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Kode Unit</label>
                        <Input 
                          value={unitData.unitCode}
                          onChange={(e) => setUnitData({ ...unitData, unitCode: e.target.value })}
                          placeholder="Contoh: A-01" 
                          className="bg-slate-50 border-slate-200 rounded-2xl h-14 px-6 focus:ring-blue-500/10 focus:border-blue-500 font-bold shadow-sm" 
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Luas (m2)</label>
                        <Input 
                          type="number"
                          value={unitData.area}
                          onChange={(e) => setUnitData({ ...unitData, area: Number(e.target.value) })}
                          placeholder="0" 
                          className="bg-slate-50 border-slate-200 rounded-2xl h-14 px-6 focus:ring-blue-500/10 focus:border-blue-500 font-bold shadow-sm" 
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Harga Jual</label>
                      <Input 
                        type="number"
                        value={unitData.price}
                        onChange={(e) => setUnitData({ ...unitData, price: Number(e.target.value) })}
                        placeholder="Rp 0" 
                        className="bg-slate-50 border-slate-200 rounded-2xl h-14 px-6 focus:ring-blue-500/10 focus:border-blue-500 font-black shadow-sm" 
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer - Fixed */}
              <div className="px-8 py-6 sm:px-10 sm:py-8 flex gap-4 flex-shrink-0 bg-white border-t border-slate-50 mt-auto">
                {modalType === "doc-preview" && previewDoc ? (
                  <>
                    <Button 
                      onClick={() => {
                        const win = window.open("", "_blank");
                        if (win) {
                          win.document.write(`
                            <html>
                              <head>
                                <title>${previewDoc.name}</title>
                                <style>
                                  body { font-family: serif; padding: 40px; line-height: 1.6; max-width: 800px; margin: auto; }
                                  h1 { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }
                                </style>
                              </head>
                              <body>${previewDoc.content}</body>
                            </html>
                          `);
                          win.document.close();
                          win.print();
                        }
                      }}
                      className="flex-1 h-12 sm:h-14 rounded-2xl bg-slate-900 text-white font-black hover:bg-slate-800 shadow-xl shadow-black/10"
                    >
                      CETAK DOKUMEN
                    </Button>
                    <Button 
                      onClick={closeModal}
                      className="flex-1 h-12 sm:h-14 rounded-2xl bg-blue-600 text-white font-black hover:bg-blue-700 shadow-xl shadow-blue-500/20"
                    >
                      SELESAI
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" className="flex-1 h-12 sm:h-14 rounded-2xl text-slate-400 font-black hover:bg-slate-50" onClick={closeModal}>BATAL</Button>
                    <Button 
                      disabled={createProject.isPending || createSales.isPending || createCustomer.isPending || createJournal.isPending || createUnit.isPending || updateConstruction.isPending || uploadDocument.isPending}
                      onClick={() => {
                        if (modalType === "project") createProject.mutate(projectData);
                        if (modalType === "sales") createSales.mutate(salesData);
                        if (modalType === "customer") createCustomer.mutate(customerData);
                        if (modalType === "journal") createJournal.mutate(journalData);
                        if (modalType === "unit") createUnit.mutate(unitData);
                        if (modalType === "construction") updateConstruction.mutate(constructionData);
                        if (modalType === "legal-upload") uploadDocument.mutate(legalData);
                      }}
                      className="flex-1 h-12 sm:h-14 rounded-2xl bg-blue-600 text-white font-black hover:bg-blue-700 shadow-xl shadow-blue-500/20 disabled:opacity-50"
                    >
                      {createProject.isPending || createSales.isPending || createCustomer.isPending || createJournal.isPending || createUnit.isPending || updateConstruction.isPending || uploadDocument.isPending ? "MENYIMPAN..." : "SIMPAN DATA"}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </RequireErp>
  );
}
