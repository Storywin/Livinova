"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { RequireErp } from "@/components/erp/require-erp";
import { Card } from "@/components/ui/card";
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
  ImagePlus,
  Search,
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
  Loader2,
  Truck,
  ReceiptText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/auth";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { apiFetchWithAuth } from "@/lib/api-auth";
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
  heroMediaAsset?: { id: string; url: string } | null;
  units: Array<{
    id: string;
    unitCode: string;
    status: string;
    price: number;
    area?: number | null;
    sales?: Array<{ id: string; status: string; createdAt: string }>;
  }>;
};

type TenantSubscription = {
  status: SubscriptionStatus;
  daysRemaining: number;
  isTrial: boolean;
  isExpiringSoon: boolean;
  partner?: { name: string } | null;
  activeLicense?: { endDate: string } | null;
  paymentMethod?: string | null;
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

type CustomerSale = {
  id: string;
  createdAt: string;
  status: string;
  totalPrice: number;
  project?: { id: string; name: string } | null;
  unit?: { id: string; unitCode: string } | null;
};

type CustomerLead = {
  id: string;
  createdAt: string;
  name: string;
  status: string;
  project?: { id: string; name: string } | null;
};

type CustomerDetail = Customer & {
  createdAt: string;
  sales: CustomerSale[];
  leads: CustomerLead[];
};

type SalesDetail = {
  id: string;
  status: string;
  totalPrice: string;
  createdAt: string;
  updatedAt: string;
  handoverAt?: string | null;
  customer: Customer;
  project: { id: string; name: string };
  unit: { id: string; unitCode: string };
  payments: Array<{
    id: string;
    amount: string;
    dueDate: string;
    paidDate?: string | null;
    status: string;
  }>;
  documents: Array<{
    id: string;
    content: string;
    status: string;
    createdAt: string;
    template?: { id: string; name: string; type: string } | null;
  }>;
};

type LeadStatus = "new" | "contacted" | "qualified" | "booked" | "lost";

type LeadActivityType = "call" | "whatsapp" | "meeting" | "site_visit" | "note";

type LeadActivity = {
  id: string;
  tenantId: string;
  leadId: string;
  type: LeadActivityType;
  notes?: string | null;
  nextFollowUpAt?: string | null;
  createdAt: string;
  createdBy?: { id: string; name?: string | null; email: string } | null;
};

type Lead = {
  id: string;
  tenantId: string;
  projectId?: string | null;
  customerId?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  source: string;
  status: LeadStatus;
  notes?: string | null;
  createdAt: string;
  project?: { id: string; name: string } | null;
  customer?: { id: string; name: string; email?: string | null; phone?: string | null } | null;
  activities?: LeadActivity[];
};

type Vendor = {
  id: string;
  tenantId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  taxId?: string | null;
  createdAt: string;
};

type VendorBillStatus = "draft" | "approved" | "paid" | "cancelled";
type VendorPaymentType = "payment" | "retention_release";

type VendorPayment = {
  id: string;
  tenantId: string;
  billId: string;
  date: string;
  amount: string;
  cashAccountCode: string;
  type: VendorPaymentType;
  notes?: string | null;
};

type VendorBillItem = {
  id: string;
  description: string;
  amount: string;
  wipAccountCode: string;
};

type VendorBill = {
  id: string;
  tenantId: string;
  projectId?: string | null;
  vendorId: string;
  invoiceNumber: string;
  date: string;
  dueDate?: string | null;
  subtotal: string;
  taxAmount: string;
  retentionPercent?: string | null;
  retentionAmount: string;
  total: string;
  status: VendorBillStatus;
  notes?: string | null;
  postedAt?: string | null;
  paidAt?: string | null;
  vendor: Vendor;
  project?: { id: string; name: string } | null;
  items: VendorBillItem[];
  payments: VendorPayment[];
};

type PurchaseOrder = {
  id: string;
  poNumber: string;
  status: string;
  vendor?: { id: string; name: string } | null;
  project?: { id: string; name: string } | null;
};

type EmployeeStatus = "active" | "inactive";

type Employee = {
  id: string;
  tenantId: string;
  employeeNo: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  department?: string | null;
  position?: string | null;
  status: EmployeeStatus;
  startDate: string;
  endDate?: string | null;
  basicSalary: string;
  allowance: string;
  pph21: string;
  bpjsEmployee: string;
  bpjsEmployer: string;
  createdAt: string;
};

type PayrollRunStatus = "draft" | "approved" | "paid" | "cancelled";

type PayrollPeriod = {
  id: string;
  tenantId: string;
  name: string;
  startDate: string;
  endDate: string;
};

type PayrollLine = {
  id: string;
  employeeId: string;
  gross: string;
  allowance: string;
  pph21: string;
  bpjsEmployee: string;
  bpjsEmployer: string;
  net: string;
  employee: Employee;
};

type PayrollSettlementKind = "pph21" | "bpjs";

type PayrollSettlement = {
  id: string;
  tenantId: string;
  payrollRunId: string;
  kind: PayrollSettlementKind;
  date: string;
  amount: string;
  cashAccountCode: string;
  notes?: string | null;
};

type PayrollRun = {
  id: string;
  tenantId: string;
  periodId: string;
  status: PayrollRunStatus;
  grossTotal: string;
  deductionsTotal: string;
  netTotal: string;
  postedAt?: string | null;
  paidAt?: string | null;
  period: PayrollPeriod;
  lines: PayrollLine[];
  settlements?: PayrollSettlement[];
};

type CommissionStatus = "draft" | "approved" | "paid" | "cancelled";

type CommissionPayout = {
  id: string;
  tenantId: string;
  salesId?: string | null;
  userId: string;
  amount: string;
  status: CommissionStatus;
  postedAt?: string | null;
  paidAt?: string | null;
  notes?: string | null;
  user: { id: string; name?: string | null; email: string };
};

type TenantSettings = {
  tenant: {
    id: string;
    name: string;
    slug: string;
    status: SubscriptionStatus;
    createdAt: string;
  };
  me: {
    id: string;
    email: string;
    name?: string | null;
    phone?: string | null;
    roles: string[];
  };
  canManageUsers: boolean;
  users: Array<{
    id: string;
    email: string;
    name?: string | null;
    phone?: string | null;
    status: string;
    createdAt: string;
    roles: string[];
  }>;
};

const SETTINGS_TABS = [
  { id: "profile", label: "Profil Saya" },
  { id: "company", label: "Perusahaan" },
  { id: "team", label: "Tim & Akses" },
  { id: "security", label: "Keamanan" },
] as const;

const PAYMENT_METHODS = [
  { id: "VA_MANDIRI", label: "Virtual Account Mandiri", detail: "Diproses otomatis (simulasi)" },
  { id: "VA_BCA", label: "Virtual Account BCA", detail: "Diproses otomatis (simulasi)" },
  { id: "QRIS", label: "QRIS", detail: "Scan QR untuk bayar (simulasi)" },
  { id: "MANUAL_TRANSFER", label: "Transfer Manual", detail: "Verifikasi manual (simulasi)" },
] as const;

type PaymentMethodId = (typeof PAYMENT_METHODS)[number]["id"];

const LEAD_STATUSES: Array<{ id: LeadStatus; label: string; tone: string }> = [
  { id: "new", label: "Baru", tone: "bg-slate-100 text-slate-700" },
  { id: "contacted", label: "Dihubungi", tone: "bg-amber-100 text-amber-700" },
  { id: "qualified", label: "Qualified", tone: "bg-blue-100 text-blue-700" },
  { id: "booked", label: "Booked", tone: "bg-emerald-100 text-emerald-700" },
  { id: "lost", label: "Lost", tone: "bg-rose-100 text-rose-700" },
];

function formatMonthIdLabel(monthId: string) {
  const m = /^(\d{4})-(\d{2})$/.exec(monthId);
  if (!m) return monthId;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}

function formatThousandsId(value: string) {
  const digits = value.replace(/[^\d]/g, "");
  if (!digits) return "0";
  const normalized = digits.replace(/^0+/, "") || "0";
  return normalized.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function formatAmountsInHtml(html: string) {
  let out = html;
  out = out.replace(/<\/h1>\s*<p>\s*(Nomor\s*:)/i, "</h1><div style=\"height:18px;\"></div><p>$1");
  out = out.replace(/(<div style="font-size: 12px; color: #475569; margin-top: )(10|18)(px;")/g, "$126$3");
  out = out.replace(/(Harga\s*:\s*)(Rp\s*)?(\d{4,})/gi, (_m, p1: string, p2: string | undefined, p3: string) => {
    const rp = p2 || "";
    return `${p1}${rp}${formatThousandsId(p3)}`;
  });
  out = out.replace(/(Rp\s*)(\d{4,})/g, (_m, p1: string, p2: string) => `${p1}${formatThousandsId(p2)}`);
  return out;
}

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
  const [activeSettingsTab, setActiveSettingsTab] = useState<"profile" | "company" | "team" | "security">("profile");
  const [activeFinanceSubTab, setActiveFinanceSubTab] = useState<"journals" | "accounts" | "reports">("journals");
  const [activeProcurementSubTab, setActiveProcurementSubTab] = useState<
    "bills" | "vendors" | "purchaseOrders"
  >("bills");
  const [activeHrSubTab, setActiveHrSubTab] = useState<"employees" | "payroll" | "commissions">(
    "employees",
  );
  const [reportPeriodMonth, setReportPeriodMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [reportCurrency, setReportCurrency] = useState<"IDR">("IDR");
  const [reportPeriodTouched, setReportPeriodTouched] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<
    | "project"
    | "sales"
    | "sale-detail"
    | "journal"
    | "customer"
    | "customer-list"
    | "customer-detail"
    | "lead"
    | "lead-activity"
    | "vendor"
    | "vendor-bill"
    | "vendor-payment"
    | "purchase-order"
    | "employee"
    | "payroll-period"
    | "payroll-run"
    | "payroll-pay"
    | "withholding-pay"
    | "commission"
    | "commission-pay"
    | "unit"
    | "doc-preview"
    | "construction"
    | "legal-upload"
    | "renew"
    | "payment-method"
    | null
  >(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedSalesId, setSelectedSalesId] = useState<string | null>(null);
  const [isProjectDetailMode, setIsProjectDetailOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<{ name: string; content: string } | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const previewDocHtml = useMemo(() => (previewDoc ? formatAmountsInHtml(previewDoc.content) : ""), [previewDoc]);
  
  // Form States
  const [projectData, setProjectData] = useState({ name: "", description: "" });
  const [unitData, setUnitData] = useState({ projectId: "", unitCode: "", price: 0, area: 0 });
  const [salesData, setSalesData] = useState({ projectId: "", unitId: "", customerId: "", totalPrice: 0 });
  const [customerData, setCustomerData] = useState({ name: "", email: "", phone: "", address: "" });
  const [leadData, setLeadData] = useState({ name: "", email: "", phone: "", source: "manual", projectId: "", notes: "" });
  const [leadActivityData, setLeadActivityData] = useState({
    type: "whatsapp" as LeadActivityType,
    notes: "",
    nextFollowUpAt: "",
  });
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);
  const [paymentKind, setPaymentKind] = useState<"payment" | "retention_release">("payment");
  const [vendorData, setVendorData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    taxId: "",
  });
  const [vendorBillData, setVendorBillData] = useState({
    vendorId: "",
    projectId: "",
    invoiceNumber: "",
    date: new Date().toISOString().split("T")[0],
    dueDate: "",
    taxAmount: 0,
    retentionPercent: 0,
    notes: "",
    items: [{ description: "", amount: 0, wipAccountCode: "103.04" }],
  });
  const [vendorPaymentData, setVendorPaymentData] = useState({
    date: new Date().toISOString().split("T")[0],
    amount: 0,
    cashAccountCode: "101.02",
    notes: "",
  });
  const [purchaseOrderData, setPurchaseOrderData] = useState({
    vendorId: "",
    projectId: "",
    poNumber: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
    items: [{ description: "", qty: 1, unitPrice: 0, wipAccountCode: "103.04" }],
  });
  const [selectedPayrollRunId, setSelectedPayrollRunId] = useState<string | null>(null);
  const [selectedCommissionId, setSelectedCommissionId] = useState<string | null>(null);
  const [employeeData, setEmployeeData] = useState({
    employeeNo: "",
    name: "",
    email: "",
    phone: "",
    department: "",
    position: "",
    startDate: new Date().toISOString().split("T")[0],
    basicSalary: 0,
    allowance: 0,
    pph21: 0,
    bpjsEmployee: 0,
    bpjsEmployer: 0,
  });
  const [payrollPeriodData, setPayrollPeriodData] = useState({
    name: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });
  const [payrollRunData, setPayrollRunData] = useState({ periodId: "" });
  const [payrollPayData, setPayrollPayData] = useState({
    date: new Date().toISOString().split("T")[0],
    cashAccountCode: "101.02",
    amount: 0,
    notes: "",
  });
  const [withholdingKind, setWithholdingKind] = useState<PayrollSettlementKind>("pph21");
  const [withholdingPayData, setWithholdingPayData] = useState({
    date: new Date().toISOString().split("T")[0],
    cashAccountCode: "101.02",
    amount: 0,
    notes: "",
  });
  const [commissionData, setCommissionData] = useState({
    userId: "",
    salesId: "",
    amount: 0,
    notes: "",
  });
  const [commissionPayData, setCommissionPayData] = useState({
    date: new Date().toISOString().split("T")[0],
    cashAccountCode: "101.02",
    notes: "",
  });
  const [constructionData, setConstructionData] = useState({ projectId: "", stage: "", progress: 0, notes: "" });
  const [legalData, setLegalData] = useState<{ title: string; type: string; notes: string; file: File | null }>({ title: "", type: "", notes: "", file: null });
  const [settingsTenantName, setSettingsTenantName] = useState("");
  const [settingsMyName, setSettingsMyName] = useState("");
  const [settingsMyPhone, setSettingsMyPhone] = useState("");
  const [inviteUser, setInviteUser] = useState({ email: "", name: "", phone: "", role: "erp_user" as "erp_user" | "tenant_admin" });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "" });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId | null>(null);
  const [paymentMethodDraft, setPaymentMethodDraft] = useState<PaymentMethodId>("VA_MANDIRI");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const projectImageInputRef = useRef<HTMLInputElement>(null);
  const [projectImageTargetId, setProjectImageTargetId] = useState<string | null>(null);
  const [journalData, setJournalData] = useState({ 
    date: new Date().toISOString().split('T')[0], 
    description: "",
    projectId: "",
    salesId: "",
    reference: "",
    details: [
      { accountCode: "", debit: 0, credit: 0 },
      { accountCode: "", debit: 0, credit: 0 }
    ]
  });

  const { roles } = useAuthStore();
  const isTenantAdmin = roles.includes("tenant_admin");
  const isSales = roles.includes("erp_user") && !isTenantAdmin;

  const { data: stats, refetch: refetchStats } = useQuery({
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

  useEffect(() => {
    if (activeTab !== "finance") return;
    if (activeFinanceSubTab !== "reports") return;
    if (reportPeriodTouched) return;
    if (!journals || journals.length === 0) return;
    const latest = journals.reduce<Date | null>((acc, j) => {
      const d = new Date(j.date);
      if (Number.isNaN(d.getTime())) return acc;
      if (!acc) return d;
      return d > acc ? d : acc;
    }, null);
    if (!latest) return;
    setReportPeriodMonth(latest.toISOString().slice(0, 7));
  }, [activeTab, activeFinanceSubTab, journals, reportPeriodTouched]);

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

  const {
    data: settings,
    isLoading: isSettingsLoading,
    isError: isSettingsError,
    error: settingsError,
    refetch: refetchSettings,
  } = useQuery({
    queryKey: ["erp-tenant-settings"],
    queryFn: () => apiFetch<TenantSettings>("/api/erp/tenant/settings"),
    enabled: activeTab === "settings" || activeTab === "hr" || modalType === "commission",
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
    enabled:
      modalType === "sales" ||
      activeTab === "sales" ||
      modalType === "customer-list" ||
      modalType === "customer-detail",
  });

  const { data: customerDetail, isLoading: isCustomerDetailLoading } = useQuery({
    queryKey: ["erp-customer", selectedCustomerId],
    queryFn: () => apiFetch<CustomerDetail>(`/api/erp/customers/${selectedCustomerId}`),
    enabled: modalType === "customer-detail" && !!selectedCustomerId,
  });

  const { data: saleDetail, isLoading: isSaleDetailLoading } = useQuery({
    queryKey: ["erp-sale", selectedSalesId],
    queryFn: () => apiFetch<SalesDetail>(`/api/erp/sales/${selectedSalesId}`),
    enabled: modalType === "sale-detail" && !!selectedSalesId,
  });

  const { data: leads, refetch: refetchLeads } = useQuery({
    queryKey: ["erp-leads"],
    queryFn: () => apiFetch<Lead[]>("/api/erp/leads"),
    enabled: activeTab === "sales",
  });

  const { data: vendors, refetch: refetchVendors } = useQuery({
    queryKey: ["erp-vendors"],
    queryFn: () => apiFetch<Vendor[]>("/api/erp/vendors"),
    enabled:
      activeTab === "procurement" || modalType === "vendor" || modalType === "vendor-bill",
  });

  const { data: purchaseOrders } = useQuery({
    queryKey: ["erp-purchase-orders"],
    queryFn: () => apiFetch<PurchaseOrder[]>("/api/erp/procurement/purchase-orders"),
    enabled: activeTab === "procurement",
  });

  const { data: vendorBills, refetch: refetchVendorBills } = useQuery({
    queryKey: ["erp-vendor-bills"],
    queryFn: () => apiFetch<VendorBill[]>("/api/erp/procurement/bills"),
    enabled: activeTab === "procurement",
  });

  const { data: employees, refetch: refetchEmployees } = useQuery({
    queryKey: ["erp-employees"],
    queryFn: () => apiFetch<Employee[]>("/api/erp/hr/employees"),
    enabled: activeTab === "hr" || modalType === "employee" || modalType === "payroll-run",
  });

  const { data: payrollPeriods, refetch: refetchPayrollPeriods } = useQuery({
    queryKey: ["erp-payroll-periods"],
    queryFn: () => apiFetch<PayrollPeriod[]>("/api/erp/payroll/periods"),
    enabled: activeTab === "hr" || modalType === "payroll-period" || modalType === "payroll-run",
  });

  const { data: payrollRuns, refetch: refetchPayrollRuns } = useQuery({
    queryKey: ["erp-payroll-runs"],
    queryFn: () => apiFetch<PayrollRun[]>("/api/erp/payroll/runs"),
    enabled: activeTab === "hr",
  });

  const { data: commissionPayouts, refetch: refetchCommissionPayouts } = useQuery({
    queryKey: ["erp-commissions"],
    queryFn: () => apiFetch<CommissionPayout[]>("/api/erp/payroll/commissions"),
    enabled: activeTab === "hr",
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

  const uploadProjectHero = useMutation({
    mutationFn: async (input: { projectId: string; file: File }) => {
      const fd = new FormData();
      fd.append("file", input.file);
      return apiFetchWithAuth<{ ok: boolean; url: string; mediaAssetId: string }>(
        `/api/erp/projects/${input.projectId}/hero`,
        { method: "POST", body: fd },
      );
    },
    onSuccess: async () => {
      toast.success("Foto proyek berhasil diperbarui");
      await queryClient.invalidateQueries({ queryKey: ["erp-projects"] });
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Gagal upload foto proyek"));
    },
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

  const createLead = useMutation({
    mutationFn: (data: typeof leadData) =>
      apiFetch("/api/erp/leads", {
        method: "POST",
        body: {
          name: data.name,
          email: data.email || undefined,
          phone: data.phone || undefined,
          source: data.source || undefined,
          projectId: data.projectId || undefined,
          notes: data.notes || undefined,
        },
      }),
    onSuccess: () => {
      toast.success("Lead berhasil ditambahkan");
      refetchLeads();
      closeModal();
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Gagal menambahkan lead"));
    },
  });

  const updateLead = useMutation({
    mutationFn: (input: { id: string; status?: LeadStatus; notes?: string }) =>
      apiFetch(`/api/erp/leads/${input.id}`, {
        method: "PATCH",
        body: { status: input.status, notes: input.notes },
      }),
    onSuccess: () => {
      refetchLeads();
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Gagal memperbarui lead"));
    },
  });

  const convertLead = useMutation({
    mutationFn: (leadId: string) => apiFetch(`/api/erp/leads/${leadId}/convert`, { method: "POST", body: {} }),
    onSuccess: () => {
      toast.success("Lead berhasil dikonversi menjadi konsumen");
      refetchLeads();
      refetchCustomers();
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Gagal mengonversi lead"));
    },
  });

  const createLeadActivity = useMutation({
    mutationFn: (data: { leadId: string; type: LeadActivityType; notes?: string; nextFollowUpAt?: string }) =>
      apiFetch(`/api/erp/leads/${data.leadId}/activities`, {
        method: "POST",
        body: {
          type: data.type,
          notes: data.notes || undefined,
          nextFollowUpAt: data.nextFollowUpAt || undefined,
        },
      }),
    onSuccess: () => {
      toast.success("Follow-up tersimpan");
      refetchLeads();
      closeModal();
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Gagal menyimpan follow-up"));
    },
  });

  const createVendor = useMutation({
    mutationFn: (data: typeof vendorData) =>
      apiFetch("/api/erp/vendors", {
        method: "POST",
        body: {
          name: data.name,
          email: data.email || undefined,
          phone: data.phone || undefined,
          address: data.address || undefined,
          taxId: data.taxId || undefined,
        },
      }),
    onSuccess: () => {
      toast.success("Vendor berhasil ditambahkan");
      refetchVendors();
      closeModal();
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Gagal menambahkan vendor"));
    },
  });

  const createVendorBill = useMutation({
    mutationFn: (data: typeof vendorBillData) =>
      apiFetch("/api/erp/procurement/bills", {
        method: "POST",
        body: {
          vendorId: data.vendorId,
          projectId: data.projectId || undefined,
          invoiceNumber: data.invoiceNumber,
          date: data.date,
          dueDate: data.dueDate || undefined,
          taxAmount: data.taxAmount,
          retentionPercent: data.retentionPercent,
          notes: data.notes || undefined,
          items: data.items
            .filter((i) => i.description.trim().length > 0 && Number(i.amount) > 0)
            .map((i) => ({
              description: i.description,
              amount: Number(i.amount),
              wipAccountCode: i.wipAccountCode || "103.04",
            })),
        },
      }),
    onSuccess: () => {
      toast.success("Invoice vendor berhasil dibuat");
      refetchVendorBills();
      closeModal();
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Gagal membuat invoice vendor"));
    },
  });

  const approveVendorBill = useMutation({
    mutationFn: (billId: string) =>
      apiFetch(`/api/erp/procurement/bills/${billId}/approve`, { method: "POST", body: {} }),
    onSuccess: () => {
      toast.success("Invoice berhasil di-approve. Jurnal otomatis dibuat.");
      refetchVendorBills();
      refetchAccounts();
      refetchJournals();
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Gagal approve invoice"));
    },
  });

  const payVendorBill = useMutation({
    mutationFn: (input: { billId: string; date: string; amount: number; cashAccountCode: string; notes?: string }) =>
      apiFetch(`/api/erp/procurement/bills/${input.billId}/pay`, {
        method: "POST",
        body: {
          date: input.date,
          amount: input.amount,
          cashAccountCode: input.cashAccountCode,
          notes: input.notes || undefined,
        },
      }),
    onSuccess: () => {
      toast.success("Pembayaran berhasil disimpan. Jurnal otomatis dibuat.");
      refetchVendorBills();
      refetchAccounts();
      refetchJournals();
      closeModal();
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Gagal menyimpan pembayaran"));
    },
  });

  const releaseRetention = useMutation({
    mutationFn: (input: { billId: string; date: string; amount: number; cashAccountCode: string; notes?: string }) =>
      apiFetch(`/api/erp/procurement/bills/${input.billId}/release-retention`, {
        method: "POST",
        body: {
          date: input.date,
          amount: input.amount,
          cashAccountCode: input.cashAccountCode,
          notes: input.notes || undefined,
        },
      }),
    onSuccess: () => {
      toast.success("Pembayaran retensi berhasil disimpan. Jurnal otomatis dibuat.");
      refetchVendorBills();
      refetchAccounts();
      refetchJournals();
      closeModal();
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Gagal menyimpan pembayaran retensi"));
    },
  });

  const createPurchaseOrder = useMutation({
    mutationFn: (data: typeof purchaseOrderData) =>
      apiFetch("/api/erp/procurement/purchase-orders", {
        method: "POST",
        body: {
          vendorId: data.vendorId,
          projectId: data.projectId || undefined,
          poNumber: data.poNumber,
          date: data.date,
          notes: data.notes || undefined,
          items: data.items
            .filter((i) => i.description.trim().length > 0 && Number(i.qty) > 0)
            .map((i) => ({
              description: i.description,
              qty: Number(i.qty),
              unitPrice: Number(i.unitPrice),
              wipAccountCode: i.wipAccountCode || "103.04",
            })),
        },
      }),
    onSuccess: () => {
      toast.success("PO berhasil dibuat");
      queryClient.invalidateQueries({ queryKey: ["erp-purchase-orders"] });
      closeModal();
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Gagal membuat PO"));
    },
  });

  const createEmployee = useMutation({
    mutationFn: (data: typeof employeeData) =>
      apiFetch("/api/erp/hr/employees", {
        method: "POST",
        body: {
          employeeNo: data.employeeNo,
          name: data.name,
          email: data.email || undefined,
          phone: data.phone || undefined,
          department: data.department || undefined,
          position: data.position || undefined,
          startDate: data.startDate,
          basicSalary: data.basicSalary,
          allowance: data.allowance,
          pph21: data.pph21,
          bpjsEmployee: data.bpjsEmployee,
          bpjsEmployer: data.bpjsEmployer,
        },
      }),
    onSuccess: () => {
      toast.success("Karyawan berhasil ditambahkan");
      refetchEmployees();
      closeModal();
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Gagal menambahkan karyawan"));
    },
  });

  const createPayrollPeriod = useMutation({
    mutationFn: (data: typeof payrollPeriodData) =>
      apiFetch("/api/erp/payroll/periods", { method: "POST", body: data }),
    onSuccess: () => {
      toast.success("Periode payroll berhasil dibuat");
      refetchPayrollPeriods();
      closeModal();
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Gagal membuat periode payroll"));
    },
  });

  const createPayrollRun = useMutation({
    mutationFn: (data: typeof payrollRunData) =>
      apiFetch("/api/erp/payroll/runs", { method: "POST", body: { periodId: data.periodId } }),
    onSuccess: () => {
      toast.success("Payroll run berhasil dibuat");
      refetchPayrollRuns();
      closeModal();
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Gagal membuat payroll run"));
    },
  });

  const approvePayroll = useMutation({
    mutationFn: (runId: string) =>
      apiFetch(`/api/erp/payroll/runs/${runId}/approve`, { method: "POST", body: {} }),
    onSuccess: () => {
      toast.success("Payroll di-approve. Jurnal otomatis dibuat.");
      refetchPayrollRuns();
      refetchJournals();
      refetchAccounts();
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Gagal approve payroll"));
    },
  });

  const payPayroll = useMutation({
    mutationFn: (input: { runId: string; date: string; cashAccountCode: string; amount: number; notes?: string }) =>
      apiFetch(`/api/erp/payroll/runs/${input.runId}/pay`, {
        method: "POST",
        body: {
          date: input.date,
          cashAccountCode: input.cashAccountCode,
          amount: input.amount,
          notes: input.notes || undefined,
        },
      }),
    onSuccess: () => {
      toast.success("Payroll berhasil dibayar. Jurnal otomatis dibuat.");
      refetchPayrollRuns();
      refetchJournals();
      refetchAccounts();
      closeModal();
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Gagal membayar payroll"));
    },
  });

  const payWithholding = useMutation({
    mutationFn: (input: {
      runId: string;
      kind: PayrollSettlementKind;
      date: string;
      cashAccountCode: string;
      amount: number;
      notes?: string;
    }) =>
      apiFetch(`/api/erp/payroll/runs/${input.runId}/settle`, {
        method: "POST",
        body: {
          kind: input.kind,
          date: input.date,
          cashAccountCode: input.cashAccountCode,
          amount: input.amount,
          notes: input.notes || undefined,
        },
      }),
    onSuccess: () => {
      toast.success("Pembayaran PPh21/BPJS tersimpan. Jurnal otomatis dibuat.");
      refetchPayrollRuns();
      refetchJournals();
      refetchAccounts();
      closeModal();
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Gagal menyimpan pembayaran"));
    },
  });

  const createCommission = useMutation({
    mutationFn: (data: typeof commissionData) =>
      apiFetch("/api/erp/payroll/commissions", {
        method: "POST",
        body: {
          userId: data.userId,
          salesId: data.salesId || undefined,
          amount: data.amount,
          notes: data.notes || undefined,
        },
      }),
    onSuccess: () => {
      toast.success("Insentif berhasil dibuat");
      refetchCommissionPayouts();
      closeModal();
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Gagal membuat insentif"));
    },
  });

  const approveCommission = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/erp/payroll/commissions/${id}/approve`, { method: "POST", body: {} }),
    onSuccess: () => {
      toast.success("Insentif di-approve. Jurnal otomatis dibuat.");
      refetchCommissionPayouts();
      refetchJournals();
      refetchAccounts();
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Gagal approve insentif"));
    },
  });

  const payCommission = useMutation({
    mutationFn: (input: { id: string; date: string; cashAccountCode: string; notes?: string }) =>
      apiFetch(`/api/erp/payroll/commissions/${input.id}/pay`, {
        method: "POST",
        body: {
          date: input.date,
          cashAccountCode: input.cashAccountCode,
          notes: input.notes || undefined,
        },
      }),
    onSuccess: () => {
      toast.success("Insentif berhasil dibayar. Jurnal otomatis dibuat.");
      refetchCommissionPayouts();
      refetchJournals();
      refetchAccounts();
      closeModal();
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Gagal membayar insentif"));
    },
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
    mutationFn: (data: {
      date: string;
      description: string;
      projectId?: string;
      salesId?: string;
      reference?: string;
      details: Array<{ accountCode: string; debit: number; credit: number }>;
    }) =>
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

  const handoverSales = useMutation({
    mutationFn: (salesId: string) =>
      apiFetch(`/api/erp/sales/${salesId}/handover`, {
        method: "POST",
        body: {},
      }),
    onSuccess: () => {
      toast.success("Serah terima berhasil. Jurnal otomatis telah dibuat.");
      queryClient.invalidateQueries({ queryKey: ["erp-tenant-stats"] });
      queryClient.invalidateQueries({ queryKey: ["erp-tenant-inventory"] });
      queryClient.invalidateQueries({ queryKey: ["erp-journals"] });
      queryClient.invalidateQueries({ queryKey: ["erp-accounts"] });
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Gagal melakukan serah terima"));
    },
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
    mutationFn: (input: { planId: string; paymentMethod?: PaymentMethodId | null }) => apiFetch("/api/erp/tenant/renew", { 
      method: "POST", 
      body: { planId: input.planId, paymentMethod: input.paymentMethod ?? undefined }
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

  const updateTenantSettingsMutation = useMutation({
    mutationFn: (data: { name: string }) =>
      apiFetch("/api/erp/tenant/settings/tenant", { method: "PATCH", body: data }),
    onSuccess: () => {
      toast.success("Pengaturan perusahaan berhasil disimpan");
      refetchSettings();
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Gagal menyimpan pengaturan perusahaan"));
    },
  });

  const updateMyProfileMutation = useMutation({
    mutationFn: (data: { name?: string; phone?: string }) =>
      apiFetch("/api/erp/tenant/settings/profile", { method: "PATCH", body: data }),
    onSuccess: () => {
      toast.success("Profil berhasil diperbarui");
      refetchSettings();
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Gagal memperbarui profil"));
    },
  });

  const createTenantUserMutation = useMutation({
    mutationFn: (data: { email: string; name: string; phone?: string; role?: "erp_user" | "tenant_admin" }) =>
      apiFetch<{ user: { id: string; email: string; name?: string | null }; tempPassword: string }>(
        "/api/erp/tenant/settings/users",
        { method: "POST", body: data },
      ),
    onSuccess: (res) => {
      setInviteUser({ email: "", name: "", phone: "", role: "erp_user" });
      toast.success("User berhasil dibuat");
      alert(`Akun berhasil dibuat.\nEmail: ${res.user.email}\nPassword sementara: ${res.tempPassword}`);
      refetchSettings();
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Gagal membuat user"));
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      apiFetch("/api/erp/tenant/settings/password", { method: "POST", body: data }),
    onSuccess: () => {
      setPasswordForm({ currentPassword: "", newPassword: "" });
      toast.success("Password berhasil diubah");
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Gagal mengubah password"));
    },
  });

  useEffect(() => {
    if (!settings) return;
    setSettingsTenantName(settings.tenant.name || "");
    setSettingsMyName(settings.me.name || "");
    setSettingsMyPhone(settings.me.phone || "");
  }, [settings]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("erp:tenant:paymentMethod");
      if (saved && PAYMENT_METHODS.some((m) => m.id === saved)) {
        setPaymentMethod(saved as PaymentMethodId);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (paymentMethod) return;
    const fromApi = subscription?.paymentMethod;
    if (fromApi && PAYMENT_METHODS.some((m) => m.id === fromApi)) {
      setPaymentMethod(fromApi as PaymentMethodId);
    }
  }, [subscription?.paymentMethod, paymentMethod]);

  const handleLogout = () => {
    setToken(null);
    router.push("/erp/login");
  };

  const resetForms = () => {
    setProjectData({ name: "", description: "" });
    setUnitData({ projectId: "", unitCode: "", price: 0, area: 0 });
    setSalesData({ projectId: "", unitId: "", customerId: "", totalPrice: 0 });
    setCustomerData({ name: "", email: "", phone: "", address: "" });
    setLeadData({ name: "", email: "", phone: "", source: "manual", projectId: "", notes: "" });
    setSelectedLeadId(null);
    setSelectedCustomerId(null);
    setSelectedSalesId(null);
    setCustomerSearch("");
    setLeadActivityData({ type: "whatsapp", notes: "", nextFollowUpAt: "" });
    setSelectedBillId(null);
    setPaymentKind("payment");
    setVendorData({ name: "", email: "", phone: "", address: "", taxId: "" });
    setVendorBillData({
      vendorId: "",
      projectId: "",
      invoiceNumber: "",
      date: new Date().toISOString().split("T")[0],
      dueDate: "",
      taxAmount: 0,
      retentionPercent: 0,
      notes: "",
      items: [{ description: "", amount: 0, wipAccountCode: "103.04" }],
    });
    setVendorPaymentData({
      date: new Date().toISOString().split("T")[0],
      amount: 0,
      cashAccountCode: "101.02",
      notes: "",
    });
    setPurchaseOrderData({
      vendorId: "",
      projectId: "",
      poNumber: "",
      date: new Date().toISOString().split("T")[0],
      notes: "",
      items: [{ description: "", qty: 1, unitPrice: 0, wipAccountCode: "103.04" }],
    });
    setSelectedPayrollRunId(null);
    setSelectedCommissionId(null);
    setEmployeeData({
      employeeNo: "",
      name: "",
      email: "",
      phone: "",
      department: "",
      position: "",
      startDate: new Date().toISOString().split("T")[0],
      basicSalary: 0,
      allowance: 0,
      pph21: 0,
      bpjsEmployee: 0,
      bpjsEmployer: 0,
    });
    setPayrollPeriodData({
      name: "",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
    });
    setPayrollRunData({ periodId: "" });
    setPayrollPayData({
      date: new Date().toISOString().split("T")[0],
      cashAccountCode: "101.02",
      amount: 0,
      notes: "",
    });
    setWithholdingKind("pph21");
    setWithholdingPayData({
      date: new Date().toISOString().split("T")[0],
      cashAccountCode: "101.02",
      amount: 0,
      notes: "",
    });
    setCommissionData({ userId: "", salesId: "", amount: 0, notes: "" });
    setCommissionPayData({ date: new Date().toISOString().split("T")[0], cashAccountCode: "101.02", notes: "" });
    setConstructionData({ projectId: "", stage: "", progress: 0, notes: "" });
    setLegalData({ title: "", type: "", notes: "", file: null });
    setIsDragging(false);
    setJournalData({
      date: new Date().toISOString().split('T')[0],
      description: "",
      projectId: "",
      salesId: "",
      reference: "",
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

  const openModal = (
    type:
      | "project"
      | "sales"
      | "sale-detail"
      | "journal"
      | "customer"
      | "customer-list"
      | "customer-detail"
      | "lead"
      | "lead-activity"
      | "vendor"
      | "vendor-bill"
      | "vendor-payment"
      | "purchase-order"
      | "employee"
      | "payroll-period"
      | "payroll-run"
      | "payroll-pay"
      | "withholding-pay"
      | "commission"
      | "commission-pay"
      | "unit"
      | "construction"
      | "legal-upload"
      | "renew"
      | "payment-method",
  ) => {
    resetForms();
    setModalType(type);
    setIsModalOpen(true);
  };

  const openCustomerListModal = () => {
    resetForms();
    setModalType("customer-list");
    setIsModalOpen(true);
  };

  const openCustomerDetailModal = (customerId: string) => {
    resetForms();
    setSelectedCustomerId(customerId);
    setModalType("customer-detail");
    setIsModalOpen(true);
  };

  const openLeadActivityModal = (leadId: string) => {
    resetForms();
    setSelectedLeadId(leadId);
    setLeadActivityData({ type: "whatsapp", notes: "", nextFollowUpAt: "" });
    setModalType("lead-activity");
    setIsModalOpen(true);
  };

  const openSalesForCustomer = (customerId: string) => {
    resetForms();
    setSalesData({ projectId: "", unitId: "", customerId, totalPrice: 0 });
    setModalType("sales");
    setIsModalOpen(true);
  };

  const openSaleDetailModal = (salesId: string) => {
    resetForms();
    setSelectedSalesId(salesId);
    setModalType("sale-detail");
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
      { id: "projects", label: "Master Proyek", icon: <Map className="h-5 w-5" />, group: "Main Menu", roles: ["tenant_admin", "erp_user"] },
      { id: "sales", label: "Penjualan (CRM)", icon: <ShoppingCart className="h-5 w-5" />, group: "Main Menu", roles: ["tenant_admin", "erp_user"] },
      { id: "finance", label: "Keuangan & Akun", icon: <Wallet className="h-5 w-5" />, group: "Backoffice", roles: ["tenant_admin"] },
      { id: "procurement", label: "Procurement & Vendor", icon: <Truck className="h-5 w-5" />, group: "Backoffice", roles: ["tenant_admin"] },
      { id: "hr", label: "HR & Payroll", icon: <Users className="h-5 w-5" />, group: "Backoffice", roles: ["tenant_admin"] },
      { id: "construction", label: "Konstruksi", icon: <ClipboardList className="h-5 w-5" />, group: "Backoffice", roles: ["tenant_admin"] },
      { id: "legal", label: "Legal & Dokumen", icon: <FileText className="h-5 w-5" />, group: "Backoffice", roles: ["tenant_admin", "erp_user"] },
      { id: "subscription", label: "Langganan", icon: <ShieldCheck className="h-5 w-5" />, group: "System", roles: ["tenant_admin"] },
      { id: "settings", label: "Pengaturan", icon: <Settings className="h-5 w-5" />, group: "System", roles: ["tenant_admin", "erp_user"] },
    ];
    return allItems.filter(item => item.roles.some(r => roles.includes(r)));
  }, [roles]);

  // Set default tab for sales
  useEffect(() => {
    const isSalesUser = roles.includes("erp_user") && !roles.includes("tenant_admin");
    if (
      isSalesUser &&
      (activeTab === "finance" ||
        activeTab === "procurement" ||
        activeTab === "hr" ||
        activeTab === "construction")
    ) {
      setActiveTab("dashboard");
    }
  }, [roles, activeTab]);

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
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setActiveTab("settings");
                      setActiveSettingsTab("profile");
                    }}
                    className="h-10 w-10 p-0 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-900 transition-all"
                  >
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
                            <div
                              key={i}
                              onClick={() => setActiveTab("sales")}
                              className="flex gap-4 p-5 rounded-3xl bg-white border border-slate-100 relative overflow-hidden group cursor-pointer hover:shadow-lg hover:border-blue-100 transition-all"
                            >
                              <div
                                className={cn(
                                  "h-12 w-12 shrink-0 rounded-2xl flex items-center justify-center shadow-sm",
                                  sale.status === "completed"
                                    ? "bg-blue-50 text-blue-600"
                                    : sale.status === "approved"
                                      ? "bg-emerald-50 text-emerald-600"
                                      : sale.status === "cancelled"
                                        ? "bg-rose-50 text-rose-600"
                                        : "bg-amber-50 text-amber-600",
                                )}
                              >
                                <ShoppingCart className="h-5 w-5" />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-3">
                                  <div className="text-sm font-black text-slate-900 truncate">
                                    {sale.status === "completed"
                                      ? "Serah Terima"
                                      : sale.status === "approved"
                                        ? "Booking Disetujui"
                                        : sale.status === "cancelled"
                                          ? "Booking Dibatalkan"
                                          : "Booking Baru"}
                                  </div>
                                  <span
                                    className={cn(
                                      "shrink-0 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                      sale.status === "completed"
                                        ? "bg-blue-50 text-blue-700 border-blue-100"
                                        : sale.status === "approved"
                                          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                          : sale.status === "cancelled"
                                            ? "bg-rose-50 text-rose-700 border-rose-100"
                                            : "bg-amber-50 text-amber-700 border-amber-100",
                                    )}
                                  >
                                    {sale.status}
                                  </span>
                                </div>

                                <div className="text-xs text-slate-500 font-bold mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                                  <span className="truncate">
                                    {(sale.unit?.unitCode || "Unit")} • {(sale.customer?.name || "Konsumen")}
                                  </span>
                                  <span className="text-slate-300">•</span>
                                  <span>Nilai: {formatRupiah(sale.totalPrice)}</span>
                                </div>

                                <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2">
                                  {new Date(sale.createdAt).toLocaleDateString("id-ID")}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {isTenantAdmin && sale.status === "approved" && (
                                  <>
                                    <Button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        generateSPR.mutate(sale.id);
                                      }}
                                      disabled={generateSPR.isPending}
                                      variant="ghost"
                                      size="sm"
                                      className="h-10 w-10 p-0 rounded-2xl text-slate-300 hover:text-blue-600 hover:bg-blue-50"
                                    >
                                      <FileText className="h-5 w-5" />
                                    </Button>
                                    <Button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const ok = confirm(
                                          `Tandai serah terima untuk unit ${sale.unit?.unitCode ?? ""}? Ini akan membuat jurnal otomatis.`,
                                        );
                                        if (!ok) return;
                                        handoverSales.mutate(sale.id);
                                      }}
                                      disabled={handoverSales.isPending}
                                      variant="ghost"
                                      size="sm"
                                      className="h-10 w-10 p-0 rounded-2xl text-slate-300 hover:text-emerald-600 hover:bg-emerald-50"
                                    >
                                      <CheckCircle2 className="h-5 w-5" />
                                    </Button>
                                  </>
                                )}
                                <div className="opacity-0 group-hover:opacity-100 transition-all translate-x-1 group-hover:translate-x-0">
                                  <ChevronRight className="h-5 w-5 text-slate-300" />
                                </div>
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
                  <input
                    ref={projectImageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file || !projectImageTargetId) return;
                      uploadProjectHero.mutate({ projectId: projectImageTargetId, file });
                      setProjectImageTargetId(null);
                      e.target.value = "";
                    }}
                  />
                  {!isProjectDetailMode ? (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Master <span className="text-blue-600">Proyek</span></h2>
                        {isTenantAdmin && (
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
                        )}
                      </div>
                      
                      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                        {projects?.map((project) => (
                          <Card key={project.id} className="border-slate-100 bg-white rounded-[2rem] overflow-hidden group hover:shadow-2xl hover:border-blue-100 transition-all">
                            <div className="h-52 bg-slate-100 relative overflow-hidden">
                              {project.heroMediaAsset?.url && (
                                <Image
                                  src={project.heroMediaAsset.url}
                                  alt={project.name}
                                  fill
                                  sizes="(max-width: 1024px) 100vw, 33vw"
                                  className="object-cover"
                                />
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
                              <div className="absolute bottom-6 left-6">
                                <div className="text-[10px] font-black text-blue-300 uppercase tracking-[0.2em] mb-1">Residential</div>
                                <h3 className="text-2xl font-black text-white tracking-tight">{project.name}</h3>
                              </div>
                              {isTenantAdmin && (
                                <div className="absolute top-6 left-6">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setProjectImageTargetId(project.id);
                                      projectImageInputRef.current?.click();
                                    }}
                                    className="h-10 w-10 p-0 rounded-2xl bg-white/10 text-white hover:bg-white/20 border border-white/20 shadow-sm backdrop-blur"
                                  >
                                    <ImagePlus className="h-5 w-5" />
                                  </Button>
                                </div>
                              )}
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
                        {isTenantAdmin && (
                          <button 
                            onClick={() => openModal("project")}
                            className="border-2 border-dashed border-slate-200 rounded-[2rem] p-12 flex flex-col items-center justify-center text-slate-300 hover:border-blue-400 hover:text-blue-500 transition-all bg-white hover:bg-blue-50/30 group"
                          >
                            <div className="h-16 w-16 rounded-3xl bg-slate-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                              <Plus className="h-8 w-8" />
                            </div>
                            <span className="font-black text-sm tracking-widest uppercase">Tambah Proyek Baru</span>
                          </button>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="space-y-8 animate-in slide-in-from-right-10 duration-500">
                      <Card className="border-slate-100 bg-white rounded-[2.5rem] shadow-sm overflow-hidden">
                        <div className="relative h-64 bg-slate-100">
                          {selectedProject?.heroMediaAsset?.url && (
                            <Image
                              src={selectedProject.heroMediaAsset.url}
                              alt={selectedProject.name}
                              fill
                              sizes="100vw"
                              className="object-cover"
                            />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/30 to-transparent"></div>
                          <div className="absolute inset-0 p-8 flex flex-col justify-between">
                            <div className="flex items-start justify-between gap-6">
                              <button
                                onClick={closeProjectDetail}
                                className="h-14 w-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all shadow-sm backdrop-blur"
                              >
                                <Plus className="h-6 w-6 rotate-45" />
                              </button>
                              <div className="flex gap-3">
                                {isTenantAdmin && (
                                  <>
                                    <Button
                                      onClick={() => {
                                        if (!selectedProjectId) return;
                                        setProjectImageTargetId(selectedProjectId);
                                        projectImageInputRef.current?.click();
                                      }}
                                      variant="outline"
                                      className="rounded-2xl border-white/30 bg-white/10 text-white px-6 h-12 font-black hover:bg-white/20 backdrop-blur"
                                    >
                                      <ImagePlus className="mr-2 h-5 w-5" /> Ganti Foto
                                    </Button>
                                    <Button
                                      onClick={() => {
                                        openModal("unit");
                                        setUnitData((prev) => ({ ...prev, projectId: selectedProjectId || "" }));
                                      }}
                                      className="rounded-2xl bg-blue-600 px-8 h-12 font-black shadow-xl shadow-blue-500/20 hover:bg-blue-700 text-white"
                                    >
                                      <Plus className="mr-2 h-5 w-5" /> Tambah Unit Baru
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="flex items-end justify-between gap-8">
                              <div className="min-w-0">
                                <div className="text-[10px] font-black text-blue-200 uppercase tracking-[0.2em] mb-2">
                                  Manajemen Proyek
                                </div>
                                <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight truncate">
                                  {selectedProject?.name}
                                </h2>
                                {selectedProject?.description && (
                                  <div className="mt-3 text-sm text-white/80 font-medium max-w-2xl line-clamp-2">
                                    {selectedProject.description}
                                  </div>
                                )}
                              </div>
                              <div className="hidden lg:flex items-center gap-4">
                                <div className="px-5 py-3 rounded-2xl bg-white/10 border border-white/15 text-white backdrop-blur">
                                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Total Unit</div>
                                  <div className="text-2xl font-black tracking-tight mt-1">
                                    {selectedProject?.units?.length ?? 0}
                                  </div>
                                </div>
                                <div className="px-5 py-3 rounded-2xl bg-emerald-400/10 border border-emerald-200/20 text-white backdrop-blur">
                                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-100/70">Terjual</div>
                                  <div className="text-2xl font-black tracking-tight mt-1">
                                    {selectedProject?.units?.filter((u) => u.status === "sold").length ?? 0}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>

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
                                    onClick={() => {
                                      if (unit.status === "available") {
                                        openModal("sales");
                                        setSalesData((prev) => ({
                                          ...prev,
                                          projectId: selectedProjectId || "",
                                          unitId: unit.id,
                                          totalPrice: unit.price,
                                        }));
                                        return;
                                      }

                                      const saleId = unit.sales?.[0]?.id;
                                      if (!saleId) {
                                        toast.error("Detail penjualan tidak ditemukan untuk unit ini");
                                        return;
                                      }
                                      openSaleDetailModal(saleId);
                                    }}
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
                                {isTenantAdmin && (
                                  <button 
                                    onClick={() => {
                                      openModal("unit");
                                      setUnitData(prev => ({ ...prev, projectId: selectedProjectId || "" }));
                                    }}
                                    className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300 hover:bg-white hover:border-blue-300 hover:text-blue-500 transition-all"
                                  >
                                    <Plus className="h-8 w-8" />
                                  </button>
                                )}
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
                                    {isTenantAdmin && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 rounded-xl h-9 text-[10px] font-black uppercase tracking-widest border-slate-200 hover:bg-slate-50"
                                      >
                                        Edit
                                      </Button>
                                    )}
                                    <Button 
                                      onClick={() => {
                                        if (unit.status === "available") {
                                          openModal("sales");
                                          setSalesData(prev => ({ ...prev, projectId: selectedProjectId || "", unitId: unit.id, totalPrice: unit.price }));
                                          return;
                                        }

                                        const saleId = unit.sales?.[0]?.id;
                                        if (!saleId) {
                                          toast.error("Detail penjualan tidak ditemukan untuk unit ini");
                                          return;
                                        }
                                        openSaleDetailModal(saleId);
                                      }}
                                      className={cn(
                                        "rounded-xl h-9 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/10 text-white",
                                        unit.status === "available" ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-900 hover:bg-slate-800 shadow-black/10",
                                        isTenantAdmin ? "flex-1" : "w-full",
                                      )}
                                    >
                                      {unit.status === "available" ? "Booking" : "Detail"}
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
                        onClick={openCustomerListModal}
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
                                      sale.status === "completed"
                                        ? "bg-blue-100 text-blue-700"
                                        : sale.status === "approved"
                                          ? "bg-emerald-100 text-emerald-700"
                                          : sale.status === "cancelled"
                                            ? "bg-rose-100 text-rose-700"
                                            : "bg-amber-100 text-amber-700"
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
                                    {isTenantAdmin && sale.status === "approved" && (
                                      <Button
                                        onClick={() => {
                                          const ok = confirm(
                                            `Tandai serah terima untuk unit ${sale.unit?.unitCode ?? ""}? Ini akan membuat jurnal otomatis.`,
                                          );
                                          if (!ok) return;
                                          handoverSales.mutate(sale.id);
                                        }}
                                        disabled={handoverSales.isPending}
                                        variant="ghost"
                                        size="sm"
                                        className="h-10 w-10 p-0 rounded-xl text-slate-300 hover:text-emerald-600 hover:bg-emerald-50"
                                      >
                                        <CheckCircle2 className="h-5 w-5" />
                                      </Button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </Card>
                    </div>
                    <div className="lg:col-span-4 space-y-6">
                      <Card className="border-slate-100 bg-white rounded-[2rem] shadow-sm p-8">
                        <h3 className="text-xl font-black text-slate-900 mb-8 tracking-tight">Database Konsumen</h3>
                        <div className="space-y-4">
                          {customers?.slice(0, 5).map((c) => (
                            <div
                              key={c.id}
                              onClick={() => openCustomerDetailModal(c.id)}
                              className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 group cursor-pointer hover:border-blue-200 hover:bg-blue-50/50 transition-all"
                            >
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
                            onClick={openCustomerListModal}
                            variant="ghost" 
                            className="w-full text-xs font-black uppercase tracking-widest text-blue-600 hover:bg-blue-50 h-12 rounded-2xl"
                          >
                            Lihat Semua Konsumen
                          </Button>
                        </div>
                      </Card>

                      <Card className="border-slate-100 bg-white rounded-[2rem] shadow-sm p-8">
                        <div className="p-6 rounded-[1.75rem] bg-gradient-to-r from-blue-50 via-white to-white border border-slate-100">
                          <div className="flex items-start justify-between gap-6">
                            <div>
                              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                                CRO <span className="text-blue-600">Pipeline</span>
                              </h3>
                              <div className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-2">
                                Lead & follow-up
                              </div>
                            </div>
                            <Button
                              onClick={() => openModal("lead")}
                              className="h-11 rounded-2xl bg-blue-600 text-white font-black shadow-xl shadow-blue-500/20 hover:bg-blue-700 px-6"
                            >
                              + Lead
                            </Button>
                          </div>
                        </div>

                        <div className="mt-6 p-4 rounded-[1.75rem] bg-slate-50 border border-slate-100">
                          <div className="flex flex-wrap gap-2">
                            {LEAD_STATUSES.map((s) => {
                              const count = (leads || []).filter((l) => l.status === s.id).length;
                              return (
                                <div
                                  key={s.id}
                                  className={cn(
                                    "px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-sm",
                                    s.tone,
                                  )}
                                >
                                  {s.label.toUpperCase()} • {count}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="space-y-4 mt-6">
                          {(leads || []).slice(0, 5).map((l) => {
                            const statusMeta = LEAD_STATUSES.find((s) => s.id === l.status) ?? LEAD_STATUSES[0];
                            const lastActivity = l.activities?.[0];
                            return (
                              <div
                                key={l.id}
                                className="p-6 rounded-[1.75rem] bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 hover:bg-blue-50/30 transition-all"
                              >
                                <div className="flex items-start justify-between gap-6">
                                  <div className="min-w-0">
                                    <div className="text-base font-black text-slate-900 truncate tracking-tight">{l.name}</div>
                                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-2">
                                      {l.phone || l.email || "No contact"}
                                    </div>
                                    <div className="text-xs text-slate-600 font-bold mt-3 truncate">
                                      {l.project?.name ? `Proyek: ${l.project.name}` : "Tanpa proyek"}
                                    </div>
                                    <div className="text-xs text-slate-500 font-medium mt-3">
                                      {lastActivity
                                        ? `Aktivitas terakhir: ${lastActivity.type.replaceAll("_", " ")} • ${new Date(lastActivity.createdAt).toLocaleDateString("id-ID")}`
                                        : "Aktivitas terakhir: -"}
                                      {lastActivity?.nextFollowUpAt
                                        ? ` • Follow-up: ${new Date(lastActivity.nextFollowUpAt).toLocaleDateString("id-ID")}`
                                        : ""}
                                    </div>
                                  </div>
                                  <span
                                    className={cn(
                                      "shrink-0 px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-sm",
                                      statusMeta.tone,
                                    )}
                                  >
                                    {statusMeta.label.toUpperCase()}
                                  </span>
                                </div>

                                <div className="mt-6 flex flex-wrap items-center gap-2">
                                  <select
                                    value={l.status}
                                    onChange={(e) =>
                                      updateLead.mutate({ id: l.id, status: e.target.value as LeadStatus })
                                    }
                                    className="flex-1 min-w-[160px] bg-slate-50 border border-slate-200 rounded-2xl h-11 px-5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm"
                                  >
                                    {LEAD_STATUSES.map((s) => (
                                      <option key={s.id} value={s.id}>
                                        {s.label}
                                      </option>
                                    ))}
                                  </select>

                                  <Button
                                    onClick={() => openLeadActivityModal(l.id)}
                                    variant="outline"
                                    className="flex-1 min-w-[140px] min-h-11 h-auto rounded-2xl border-slate-200 bg-white font-black text-[10px] uppercase tracking-[0.2em] px-5 py-3"
                                  >
                                    Follow-up
                                  </Button>
                                  {!l.customerId && (
                                    <Button
                                      onClick={() => convertLead.mutate(l.id)}
                                      disabled={convertLead.isPending}
                                      variant="outline"
                                      className="flex-1 min-w-[160px] min-h-11 h-auto rounded-2xl border-slate-200 bg-white font-black text-[10px] uppercase tracking-[0.2em] px-5 py-3 whitespace-normal text-center leading-snug"
                                    >
                                      Jadikan Konsumen
                                    </Button>
                                  )}
                                </div>
                              </div>
                            );
                          })}

                          {(leads || []).length === 0 && (
                            <div className="p-10 text-center text-slate-300 border-2 border-dashed border-slate-100 rounded-3xl bg-white/50">
                              <Users className="h-8 w-8 mx-auto mb-3 opacity-20" />
                              <p className="font-black text-xs uppercase tracking-widest opacity-30">Belum ada lead</p>
                            </div>
                          )}
                        </div>
                      </Card>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "procurement" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div>
                      <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                        Procurement <span className="text-blue-600">& Vendor</span>
                      </h2>
                      <p className="text-sm text-slate-400 font-medium mt-1">
                        Vendor, invoice (AP), retensi, dan jurnal WIP otomatis.
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        onClick={() => openModal("vendor")}
                        variant="outline"
                        className="rounded-2xl border-slate-200 bg-white h-12 px-6 font-black text-slate-600 hover:bg-slate-50 transition-all"
                      >
                        Tambah Vendor
                      </Button>
                      <Button
                        onClick={() => openModal("vendor-bill")}
                        className="rounded-2xl bg-blue-600 px-8 h-12 font-black shadow-xl shadow-blue-500/20 hover:bg-blue-700 text-white"
                      >
                        Buat Invoice
                      </Button>
                    </div>
                  </div>

                  <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-200 shadow-inner w-fit">
                    <button
                      onClick={() => setActiveProcurementSubTab("bills")}
                      className={cn(
                        "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                        activeProcurementSubTab === "bills"
                          ? "bg-white text-blue-600 shadow-sm"
                          : "text-slate-400 hover:text-slate-600",
                      )}
                    >
                      Invoice Vendor
                    </button>
                    <button
                      onClick={() => setActiveProcurementSubTab("vendors")}
                      className={cn(
                        "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                        activeProcurementSubTab === "vendors"
                          ? "bg-white text-blue-600 shadow-sm"
                          : "text-slate-400 hover:text-slate-600",
                      )}
                    >
                      Vendor
                    </button>
                    <button
                      onClick={() => setActiveProcurementSubTab("purchaseOrders")}
                      className={cn(
                        "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                        activeProcurementSubTab === "purchaseOrders"
                          ? "bg-white text-blue-600 shadow-sm"
                          : "text-slate-400 hover:text-slate-600",
                      )}
                    >
                      Purchase Order
                    </button>
                  </div>

                  {activeProcurementSubTab === "bills" && (
                    <Card className="border-slate-100 bg-white rounded-[2rem] shadow-sm p-8">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">
                          Invoice Vendor (AP)
                        </h3>
                        <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                          Retensi: 201.04 • AP: 201.01 • WIP: 103.xx
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-[0.15em]">
                              <th className="pb-6 font-bold">Invoice</th>
                              <th className="pb-6 font-bold">Vendor</th>
                              <th className="pb-6 font-bold">Proyek</th>
                              <th className="pb-6 font-bold text-center">Status</th>
                              <th className="pb-6 font-bold text-right">Total</th>
                              <th className="pb-6 font-bold text-right">Retensi</th>
                              <th className="pb-6 font-bold text-right">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {(vendorBills || []).map((b) => {
                              const total = Number(b.total);
                              const retention = Number(b.retentionAmount);
                              const paid = (b.payments || [])
                                .filter((p) => p.type === "payment")
                                .reduce((sum, p) => sum + Number(p.amount), 0);
                              const retentionPaid = (b.payments || [])
                                .filter((p) => p.type === "retention_release")
                                .reduce((sum, p) => sum + Number(p.amount), 0);
                              const payable = total - retention;
                              const remaining = Math.max(0, payable - paid);
                              const remainingRetention = Math.max(0, retention - retentionPaid);
                              return (
                                <tr key={b.id} className="group hover:bg-slate-50/50 transition-colors">
                                  <td className="py-6">
                                    <div className="font-black text-slate-900">{b.invoiceNumber}</div>
                                    <div className="text-xs text-slate-400 font-medium">
                                      {new Date(b.date).toLocaleDateString("id-ID")}
                                      {b.dueDate ? ` • Due ${new Date(b.dueDate).toLocaleDateString("id-ID")}` : ""}
                                    </div>
                                  </td>
                                  <td className="py-6">
                                    <div className="text-sm font-bold text-slate-700">{b.vendor?.name}</div>
                                    <div className="text-[10px] text-slate-400 font-black tracking-widest uppercase mt-1">
                                      {b.vendor?.phone || b.vendor?.email || ""}
                                    </div>
                                  </td>
                                  <td className="py-6">
                                    <div className="text-sm font-bold text-slate-700">
                                      {b.project?.name || "Tanpa proyek"}
                                    </div>
                                  </td>
                                  <td className="py-6 text-center">
                                    <span
                                      className={cn(
                                        "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm",
                                        b.status === "paid"
                                          ? "bg-blue-100 text-blue-700"
                                          : b.status === "approved"
                                            ? "bg-emerald-100 text-emerald-700"
                                            : b.status === "cancelled"
                                              ? "bg-rose-100 text-rose-700"
                                              : "bg-amber-100 text-amber-700",
                                      )}
                                    >
                                      {b.status}
                                    </span>
                                  </td>
                                  <td className="py-6 text-right font-black text-slate-900 tracking-tight">
                                    {formatRupiah(total)}
                                  </td>
                                  <td className="py-6 text-right font-black text-slate-700 tracking-tight">
                                    {retention > 0 ? formatRupiah(retention) : "-"}
                                  </td>
                                  <td className="py-6 text-right whitespace-nowrap">
                                    {b.status === "draft" && (
                                      <Button
                                        onClick={() => approveVendorBill.mutate(b.id)}
                                        disabled={approveVendorBill.isPending}
                                        variant="outline"
                                        className="h-10 rounded-2xl border-slate-200 bg-white font-black text-[10px] uppercase tracking-widest"
                                      >
                                        Approve
                                      </Button>
                                    )}
                                    {b.status !== "cancelled" && b.status !== "draft" && remaining > 0 && (
                                      <Button
                                        onClick={() => {
                                          setSelectedBillId(b.id);
                                          setPaymentKind("payment");
                                          setVendorPaymentData((p) => ({ ...p, amount: Math.ceil(remaining) }));
                                          openModal("vendor-payment");
                                        }}
                                        variant="outline"
                                        className="h-10 rounded-2xl border-slate-200 bg-white font-black text-[10px] uppercase tracking-widest ml-2"
                                      >
                                        Bayar
                                      </Button>
                                    )}
                                    {b.status !== "cancelled" && remainingRetention > 0 && (
                                      <Button
                                        onClick={() => {
                                          setSelectedBillId(b.id);
                                          setPaymentKind("retention_release");
                                          setVendorPaymentData((p) => ({
                                            ...p,
                                            amount: Math.ceil(remainingRetention),
                                          }));
                                          openModal("vendor-payment");
                                        }}
                                        variant="outline"
                                        className="h-10 rounded-2xl border-slate-200 bg-white font-black text-[10px] uppercase tracking-widest ml-2"
                                      >
                                        Bayar Retensi
                                      </Button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  )}

                  {activeProcurementSubTab === "vendors" && (
                    <Card className="border-slate-100 bg-white rounded-[2rem] shadow-sm p-8">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Vendor</h3>
                        <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                          Data master vendor
                        </div>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        {(vendors || []).map((v) => (
                          <div
                            key={v.id}
                            className="p-5 rounded-3xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:bg-blue-50/40 transition-all"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <div className="text-sm font-black text-slate-900 truncate">{v.name}</div>
                                <div className="text-xs text-slate-500 font-medium mt-2">
                                  {(v.phone || "-") + (v.email ? ` • ${v.email}` : "")}
                                </div>
                                {v.address && (
                                  <div className="text-xs text-slate-500 font-medium mt-2 truncate">{v.address}</div>
                                )}
                              </div>
                              <div className="h-10 w-10 rounded-2xl bg-white border border-slate-200 text-blue-600 flex items-center justify-center shadow-sm">
                                <Building2 className="h-5 w-5" />
                              </div>
                            </div>
                          </div>
                        ))}
                        {(vendors || []).length === 0 && (
                          <div className="p-10 text-center text-slate-300 border-2 border-dashed border-slate-100 rounded-3xl bg-white/50 md:col-span-2">
                            <Truck className="h-8 w-8 mx-auto mb-3 opacity-20" />
                            <p className="font-black text-xs uppercase tracking-widest opacity-30">
                              Belum ada vendor
                            </p>
                          </div>
                        )}
                      </div>
                    </Card>
                  )}

                  {activeProcurementSubTab === "purchaseOrders" && (
                    <Card className="border-slate-100 bg-white rounded-[2rem] shadow-sm p-8">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Purchase Order</h3>
                        <Button
                          onClick={() => openModal("purchase-order")}
                          className="h-11 rounded-2xl bg-blue-600 text-white font-black shadow-xl shadow-blue-500/20 hover:bg-blue-700 px-6"
                        >
                          Buat PO
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {(purchaseOrders || []).slice(0, 10).map((po) => (
                          <div
                            key={po.id}
                            className="p-5 rounded-3xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:bg-blue-50/40 transition-all"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <div className="text-sm font-black text-slate-900 truncate">
                                  {po.poNumber || "PO"}
                                </div>
                                <div className="text-xs text-slate-500 font-medium mt-2">
                                  {po.vendor?.name || "Vendor"} •{" "}
                                  {po.project?.name || "Tanpa proyek"}
                                </div>
                              </div>
                              <span className="px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-700">
                                {po.status || "draft"}
                              </span>
                            </div>
                          </div>
                        ))}
                        {(purchaseOrders || []).length === 0 && (
                          <div className="p-10 text-center text-slate-300 border-2 border-dashed border-slate-100 rounded-3xl bg-white/50">
                            <ReceiptText className="h-8 w-8 mx-auto mb-3 opacity-20" />
                            <p className="font-black text-xs uppercase tracking-widest opacity-30">
                              Belum ada PO
                            </p>
                          </div>
                        )}
                      </div>
                    </Card>
                  )}
                </div>
              )}

              {activeTab === "hr" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div>
                      <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                        HR <span className="text-blue-600">& Payroll</span>
                      </h2>
                      <p className="text-sm text-slate-400 font-medium mt-1">
                        Data karyawan, payroll run, BPJS/PPH21, dan insentif sales.
                      </p>
                    </div>
                    <div className="flex gap-3">
                      {activeHrSubTab === "employees" && (
                        <Button
                          onClick={() => openModal("employee")}
                          className="rounded-2xl bg-blue-600 px-8 h-12 font-black shadow-xl shadow-blue-500/20 hover:bg-blue-700 text-white"
                        >
                          Tambah Karyawan
                        </Button>
                      )}
                      {activeHrSubTab === "payroll" && (
                        <>
                          <Button
                            onClick={() => openModal("payroll-period")}
                            variant="outline"
                            className="rounded-2xl border-slate-200 bg-white h-12 px-6 font-black text-slate-600 hover:bg-slate-50 transition-all"
                          >
                            Buat Periode
                          </Button>
                          <Button
                            onClick={() => openModal("payroll-run")}
                            className="rounded-2xl bg-blue-600 px-8 h-12 font-black shadow-xl shadow-blue-500/20 hover:bg-blue-700 text-white"
                          >
                            Buat Payroll
                          </Button>
                        </>
                      )}
                      {activeHrSubTab === "commissions" && (
                        <Button
                          onClick={() => openModal("commission")}
                          className="rounded-2xl bg-blue-600 px-8 h-12 font-black shadow-xl shadow-blue-500/20 hover:bg-blue-700 text-white"
                        >
                          Buat Insentif
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-200 shadow-inner w-fit">
                    <button
                      onClick={() => setActiveHrSubTab("employees")}
                      className={cn(
                        "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                        activeHrSubTab === "employees"
                          ? "bg-white text-blue-600 shadow-sm"
                          : "text-slate-400 hover:text-slate-600",
                      )}
                    >
                      Karyawan
                    </button>
                    <button
                      onClick={() => setActiveHrSubTab("payroll")}
                      className={cn(
                        "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                        activeHrSubTab === "payroll"
                          ? "bg-white text-blue-600 shadow-sm"
                          : "text-slate-400 hover:text-slate-600",
                      )}
                    >
                      Payroll
                    </button>
                    <button
                      onClick={() => setActiveHrSubTab("commissions")}
                      className={cn(
                        "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                        activeHrSubTab === "commissions"
                          ? "bg-white text-blue-600 shadow-sm"
                          : "text-slate-400 hover:text-slate-600",
                      )}
                    >
                      Insentif
                    </button>
                  </div>

                  {activeHrSubTab === "employees" && (
                    <Card className="border-slate-100 bg-white rounded-[2rem] shadow-sm p-8">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Daftar Karyawan</h3>
                        <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                          Payroll master
                        </div>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        {(employees || []).map((e) => (
                          <div
                            key={e.id}
                            className="p-5 rounded-3xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:bg-blue-50/40 transition-all"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <div className="text-sm font-black text-slate-900 truncate">
                                  {e.name}{" "}
                                  <span className="text-slate-400 text-xs font-black tracking-widest">
                                    • {e.employeeNo}
                                  </span>
                                </div>
                                <div className="text-xs text-slate-500 font-medium mt-2">
                                  {(e.department || "-") + (e.position ? ` • ${e.position}` : "")}
                                </div>
                                <div className="text-xs text-slate-500 font-medium mt-2">
                                  Gaji pokok: {formatRupiah(Number(e.basicSalary))} • Tunjangan:{" "}
                                  {formatRupiah(Number(e.allowance))}
                                </div>
                              </div>
                              <span
                                className={cn(
                                  "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm",
                                  e.status === "active"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-slate-100 text-slate-600",
                                )}
                              >
                                {e.status}
                              </span>
                            </div>
                          </div>
                        ))}
                        {(employees || []).length === 0 && (
                          <div className="p-10 text-center text-slate-300 border-2 border-dashed border-slate-100 rounded-3xl bg-white/50 md:col-span-2">
                            <Users className="h-8 w-8 mx-auto mb-3 opacity-20" />
                            <p className="font-black text-xs uppercase tracking-widest opacity-30">
                              Belum ada karyawan
                            </p>
                          </div>
                        )}
                      </div>
                    </Card>
                  )}

                  {activeHrSubTab === "payroll" && (
                    <div className="grid gap-6 lg:grid-cols-3">
                      <Card className="border-slate-100 bg-white rounded-[2rem] shadow-sm p-8 lg:col-span-1">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-lg font-black text-slate-900 tracking-tight">Periode</h3>
                        </div>
                        <div className="space-y-3">
                          {(payrollPeriods || []).slice(0, 10).map((p) => (
                            <div
                              key={p.id}
                              className="p-4 rounded-2xl bg-slate-50 border border-slate-100"
                            >
                              <div className="text-sm font-black text-slate-900">{p.name}</div>
                              <div className="text-xs text-slate-500 font-medium mt-2">
                                {new Date(p.startDate).toLocaleDateString("id-ID")} –{" "}
                                {new Date(p.endDate).toLocaleDateString("id-ID")}
                              </div>
                            </div>
                          ))}
                          {(payrollPeriods || []).length === 0 && (
                            <div className="p-8 text-center text-slate-300 border-2 border-dashed border-slate-100 rounded-3xl bg-white/50">
                              <p className="font-black text-xs uppercase tracking-widest opacity-30">
                                Belum ada periode
                              </p>
                            </div>
                          )}
                        </div>
                      </Card>

                      <Card className="border-slate-100 bg-white rounded-[2rem] shadow-sm p-8 lg:col-span-2">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-lg font-black text-slate-900 tracking-tight">Payroll Run</h3>
                          <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                            Dr 504.xx • Cr 205.02/205.03/204.03
                          </div>
                        </div>
                        <div className="space-y-3">
                          {(payrollRuns || []).map((r) => {
                            const pph21Total = (r.lines || []).reduce((sum, l) => sum + Number(l.pph21), 0);
                            const bpjsTotal = (r.lines || []).reduce(
                              (sum, l) => sum + Number(l.bpjsEmployee) + Number(l.bpjsEmployer),
                              0,
                            );
                            const pph21Paid = (r.settlements || [])
                              .filter((s) => s.kind === "pph21")
                              .reduce((sum, s) => sum + Number(s.amount), 0);
                            const bpjsPaid = (r.settlements || [])
                              .filter((s) => s.kind === "bpjs")
                              .reduce((sum, s) => sum + Number(s.amount), 0);
                            const pph21Remaining = Math.max(0, pph21Total - pph21Paid);
                            const bpjsRemaining = Math.max(0, bpjsTotal - bpjsPaid);

                            return (
                              <div
                                key={r.id}
                                className="p-5 rounded-3xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:bg-blue-50/40 transition-all"
                              >
                              <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                  <div className="text-sm font-black text-slate-900 truncate">
                                    {r.period?.name || "Payroll"}
                                  </div>
                                  <div className="text-xs text-slate-500 font-medium mt-2">
                                    Gross: {formatRupiah(Number(r.grossTotal))} • Net:{" "}
                                    {formatRupiah(Number(r.netTotal))}
                                  </div>
                                  <div className="text-xs text-slate-500 font-medium mt-2">
                                    Karyawan: {r.lines?.length || 0}
                                  </div>
                                  {(pph21Total > 0 || bpjsTotal > 0) && (
                                    <div className="text-xs text-slate-500 font-medium mt-2">
                                      {pph21Total > 0
                                        ? `PPh21: ${formatRupiah(pph21Remaining)}`
                                        : "PPh21: -"}
                                      {bpjsTotal > 0 ? ` • BPJS: ${formatRupiah(bpjsRemaining)}` : " • BPJS: -"}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span
                                    className={cn(
                                      "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm",
                                      r.status === "paid"
                                        ? "bg-blue-100 text-blue-700"
                                        : r.status === "approved"
                                          ? "bg-emerald-100 text-emerald-700"
                                          : r.status === "cancelled"
                                            ? "bg-rose-100 text-rose-700"
                                            : "bg-amber-100 text-amber-700",
                                    )}
                                  >
                                    {r.status}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center justify-end gap-2 mt-4">
                                {(r.status === "approved" || r.status === "paid") && (
                                  <Button
                                    onClick={() => window.open(`/erp/payroll/payslip?runId=${r.id}`, "_blank")}
                                    variant="outline"
                                    className="h-10 rounded-2xl border-slate-200 bg-white font-black text-[10px] uppercase tracking-widest"
                                  >
                                    Payslip
                                  </Button>
                                )}
                                {(r.status === "approved" || r.status === "paid") && (
                                  <Button
                                    onClick={() => window.open(`/erp/payroll/report?runId=${r.id}`, "_blank")}
                                    variant="outline"
                                    className="h-10 rounded-2xl border-slate-200 bg-white font-black text-[10px] uppercase tracking-widest"
                                  >
                                    Rekap
                                  </Button>
                                )}
                                {r.status === "draft" && (
                                  <Button
                                    onClick={() => approvePayroll.mutate(r.id)}
                                    disabled={approvePayroll.isPending}
                                    variant="outline"
                                    className="h-10 rounded-2xl border-slate-200 bg-white font-black text-[10px] uppercase tracking-widest"
                                  >
                                    Approve
                                  </Button>
                                )}
                                {r.status === "approved" && (
                                  <Button
                                    onClick={() => {
                                      setSelectedPayrollRunId(r.id);
                                      setPayrollPayData((p) => ({
                                        ...p,
                                        amount: Math.ceil(Number(r.netTotal)),
                                      }));
                                      openModal("payroll-pay");
                                    }}
                                    variant="outline"
                                    className="h-10 rounded-2xl border-slate-200 bg-white font-black text-[10px] uppercase tracking-widest"
                                  >
                                    Bayar
                                  </Button>
                                )}
                                {(r.status === "approved" || r.status === "paid") && pph21Remaining > 0 && (
                                  <Button
                                    onClick={() => {
                                      setSelectedPayrollRunId(r.id);
                                      setWithholdingKind("pph21");
                                      setWithholdingPayData((p) => ({
                                        ...p,
                                        amount: Math.ceil(pph21Remaining),
                                      }));
                                      openModal("withholding-pay");
                                    }}
                                    variant="outline"
                                    className="h-10 rounded-2xl border-slate-200 bg-white font-black text-[10px] uppercase tracking-widest"
                                  >
                                    Bayar PPh21
                                  </Button>
                                )}
                                {(r.status === "approved" || r.status === "paid") && bpjsRemaining > 0 && (
                                  <Button
                                    onClick={() => {
                                      setSelectedPayrollRunId(r.id);
                                      setWithholdingKind("bpjs");
                                      setWithholdingPayData((p) => ({
                                        ...p,
                                        amount: Math.ceil(bpjsRemaining),
                                      }));
                                      openModal("withholding-pay");
                                    }}
                                    variant="outline"
                                    className="h-10 rounded-2xl border-slate-200 bg-white font-black text-[10px] uppercase tracking-widest"
                                  >
                                    Bayar BPJS
                                  </Button>
                                )}
                              </div>
                              </div>
                            );
                          })}
                          {(payrollRuns || []).length === 0 && (
                            <div className="p-10 text-center text-slate-300 border-2 border-dashed border-slate-100 rounded-3xl bg-white/50">
                              <Wallet className="h-8 w-8 mx-auto mb-3 opacity-20" />
                              <p className="font-black text-xs uppercase tracking-widest opacity-30">
                                Belum ada payroll run
                              </p>
                            </div>
                          )}
                        </div>
                      </Card>
                    </div>
                  )}

                  {activeHrSubTab === "commissions" && (
                    <Card className="border-slate-100 bg-white rounded-[2rem] shadow-sm p-8">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Insentif Sales</h3>
                        <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                          Dr 503.04 • Cr 205.05
                        </div>
                      </div>
                      <div className="space-y-3">
                        {(commissionPayouts || []).map((c) => (
                          <div
                            key={c.id}
                            className="p-5 rounded-3xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:bg-blue-50/40 transition-all"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <div className="text-sm font-black text-slate-900 truncate">
                                  {c.user?.name || c.user?.email}
                                </div>
                                <div className="text-xs text-slate-500 font-medium mt-2">
                                  Nominal: {formatRupiah(Number(c.amount))}
                                </div>
                                {c.notes && (
                                  <div className="text-xs text-slate-500 font-medium mt-2 truncate">{c.notes}</div>
                                )}
                              </div>
                              <span
                                className={cn(
                                  "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm",
                                  c.status === "paid"
                                    ? "bg-blue-100 text-blue-700"
                                    : c.status === "approved"
                                      ? "bg-emerald-100 text-emerald-700"
                                      : c.status === "cancelled"
                                        ? "bg-rose-100 text-rose-700"
                                        : "bg-amber-100 text-amber-700",
                                )}
                              >
                                {c.status}
                              </span>
                            </div>
                            <div className="flex items-center justify-end gap-2 mt-4">
                              {c.status === "draft" && (
                                <Button
                                  onClick={() => approveCommission.mutate(c.id)}
                                  disabled={approveCommission.isPending}
                                  variant="outline"
                                  className="h-10 rounded-2xl border-slate-200 bg-white font-black text-[10px] uppercase tracking-widest"
                                >
                                  Approve
                                </Button>
                              )}
                              {c.status === "approved" && (
                                <Button
                                  onClick={() => {
                                    setSelectedCommissionId(c.id);
                                    openModal("commission-pay");
                                  }}
                                  variant="outline"
                                  className="h-10 rounded-2xl border-slate-200 bg-white font-black text-[10px] uppercase tracking-widest"
                                >
                                  Bayar
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                        {(commissionPayouts || []).length === 0 && (
                          <div className="p-10 text-center text-slate-300 border-2 border-dashed border-slate-100 rounded-3xl bg-white/50">
                            <TrendingUp className="h-8 w-8 mx-auto mb-3 opacity-20" />
                            <p className="font-black text-xs uppercase tracking-widest opacity-30">
                              Belum ada insentif
                            </p>
                          </div>
                        )}
                      </div>
                    </Card>
                  )}
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
                                            <div
                                              key={idx}
                                              className={cn(
                                                "text-[10px] font-bold flex items-center gap-2",
                                                Number(d.credit) > 0 ? "pl-6 text-blue-500" : "text-emerald-600",
                                              )}
                                            >
                                              <span className="opacity-50 tracking-tighter">[{d.account.code}]</span>
                                              <span>{d.account.name}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </td>
                                      <td className="p-10 py-8 text-right align-top">
                                        <div className="font-black text-emerald-600 tracking-tight">
                                          {formatRupiah(j.details.reduce((s, d) => s + Number(d.debit || 0), 0))}
                                        </div>
                                      </td>
                                      <td className="p-10 py-8 text-right align-top">
                                        <div className="font-black text-blue-600 tracking-tight">
                                          {formatRupiah(j.details.reduce((s, d) => s + Number(d.credit || 0), 0))}
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
                                <Button
                                  onClick={() => {
                                    const path =
                                      rep.title === "Laporan Neraca"
                                        ? "/erp/finance/reports/balance-sheet"
                                        : rep.title === "Laba Rugi"
                                          ? "/erp/finance/reports/income-statement"
                                          : rep.title === "Buku Besar"
                                            ? "/erp/finance/reports/general-ledger"
                                            : "/erp/finance/reports/trial-balance";
                                    const qs = new URLSearchParams();
                                    qs.set("period", reportPeriodMonth);
                                    qs.set("currency", reportCurrency);
                                    window.open(`${path}?${qs.toString()}`, "_blank");
                                  }}
                                  className={cn(
                                  "w-full h-12 rounded-xl text-white font-black text-[10px] tracking-widest uppercase shadow-lg transition-all",
                                  rep.color === 'blue' ? "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20" :
                                  rep.color === 'emerald' ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20" :
                                  rep.color === 'amber' ? "bg-amber-600 hover:bg-amber-700 shadow-amber-500/20" : "bg-purple-600 hover:bg-purple-700 shadow-purple-500/20"
                                )}
                                >
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
                              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 h-10 shadow-sm">
                                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Periode</span>
                                  <input
                                    type="month"
                                    value={reportPeriodMonth}
                                    onChange={(e) => {
                                      setReportPeriodTouched(true);
                                      setReportPeriodMonth(e.target.value);
                                    }}
                                    className="bg-transparent outline-none text-xs font-black text-slate-700"
                                  />
                                </div>
                                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 h-10 shadow-sm">
                                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Mata Uang</span>
                                  <select
                                    value={reportCurrency}
                                    onChange={(e) => setReportCurrency(e.target.value as "IDR")}
                                    className="bg-transparent outline-none text-xs font-black text-slate-700"
                                  >
                                    <option value="IDR">IDR</option>
                                  </select>
                                </div>
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    toast.success(`Periode laporan: ${formatMonthIdLabel(reportPeriodMonth)} • ${reportCurrency}`);
                                  }}
                                  className="rounded-xl border-slate-200 font-black text-[10px] tracking-[0.2em] uppercase h-10"
                                >
                                  Terapkan
                                </Button>
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
                        <div className="text-sm font-bold mb-6">
                          {(() => {
                            const methodId = paymentMethod ?? (subscription?.paymentMethod as PaymentMethodId | undefined) ?? "VA_MANDIRI";
                            const method = PAYMENT_METHODS.find((m) => m.id === methodId);
                            return method ? method.label : "Simulated Gateway";
                          })()}
                        </div>
                        <Button
                          onClick={() => {
                            const current = (paymentMethod ??
                              (subscription?.paymentMethod as PaymentMethodId | undefined) ??
                              "VA_MANDIRI") as PaymentMethodId;
                            setPaymentMethodDraft(current);
                            openModal("payment-method");
                          }}
                          className="w-full bg-white/10 hover:bg-white/20 text-white border-white/10 rounded-xl h-10 text-[10px] font-black uppercase tracking-widest"
                        >
                          Ganti Metode
                        </Button>
                      </Card>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "settings" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-10">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-3xl font-black text-slate-900 tracking-tight">Pengaturan <span className="text-blue-600">Tenant</span></h2>
                      <p className="text-sm text-slate-400 font-medium mt-1">Kelola profil, perusahaan, tim, dan keamanan akun</p>
                    </div>
                    <Button
                      onClick={() => setActiveTab("subscription")}
                      variant="outline"
                      className="rounded-2xl border-slate-200 bg-white h-12 px-6 font-black text-slate-600 hover:bg-slate-50 transition-all"
                    >
                      Buka Langganan
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2 p-2 bg-white border border-slate-200 rounded-2xl shadow-sm">
                    {SETTINGS_TABS.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setActiveSettingsTab(t.id)}
                        className={cn(
                          "px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                          activeSettingsTab === t.id ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "text-slate-400 hover:text-slate-700 hover:bg-slate-50",
                        )}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {isSettingsLoading ? (
                    <Card className="border-slate-200 bg-white rounded-[2.5rem] p-12 shadow-sm animate-pulse">
                      <div className="text-center text-slate-400 font-bold">Memuat pengaturan...</div>
                    </Card>
                  ) : isSettingsError || !settings ? (
                    <Card className="border-slate-200 bg-white rounded-[2.5rem] p-12 shadow-sm">
                      <div className="text-center">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Gagal memuat</div>
                        <div className="text-xl font-black text-slate-900 tracking-tight">Pengaturan tidak bisa ditampilkan</div>
                        <div className="text-sm text-slate-500 font-medium mt-3">
                          {getErrorMessage(settingsError, "Silakan muat ulang halaman atau coba lagi.")}
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
                          <Button
                            onClick={() => refetchSettings()}
                            className="h-12 rounded-2xl bg-blue-600 text-white font-black shadow-xl shadow-blue-500/20 hover:bg-blue-700"
                          >
                            Coba Lagi
                          </Button>
                          <Button
                            onClick={() => setActiveTab("dashboard")}
                            variant="outline"
                            className="h-12 rounded-2xl border-slate-200 bg-white font-black"
                          >
                            Kembali
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ) : (
                    <>
                      {activeSettingsTab === "profile" && settings && (
                        <Card className="border-slate-200 bg-white rounded-[2.5rem] p-10 shadow-sm space-y-8">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-xl font-black text-slate-900 tracking-tight">Profil Saya</h3>
                              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Data user yang sedang login</p>
                            </div>
                            <Button
                              onClick={() => updateMyProfileMutation.mutate({ name: settingsMyName, phone: settingsMyPhone })}
                              disabled={updateMyProfileMutation.isPending}
                              className="rounded-2xl bg-blue-600 px-8 h-12 font-black shadow-xl shadow-blue-500/20 hover:bg-blue-700 text-white disabled:opacity-50"
                            >
                              Simpan
                            </Button>
                          </div>

                          <div className="grid gap-6 md:grid-cols-2">
                            <div>
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Email</label>
                              <Input value={settings.me.email} disabled className="h-12 rounded-2xl border-slate-200 bg-slate-50" />
                            </div>
                            <div>
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Role</label>
                              <Input value={(settings.me.roles || []).join(", ")} disabled className="h-12 rounded-2xl border-slate-200 bg-slate-50" />
                            </div>
                            <div>
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Nama</label>
                              <Input
                                value={settingsMyName}
                                onChange={(e) => setSettingsMyName(e.target.value)}
                                className="h-12 rounded-2xl border-slate-200 bg-white"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">No. HP</label>
                              <Input
                                value={settingsMyPhone}
                                onChange={(e) => setSettingsMyPhone(e.target.value)}
                                className="h-12 rounded-2xl border-slate-200 bg-white"
                              />
                            </div>
                          </div>
                        </Card>
                      )}

                      {activeSettingsTab === "company" && settings && (
                        <Card className="border-slate-200 bg-white rounded-[2.5rem] p-10 shadow-sm space-y-8">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-xl font-black text-slate-900 tracking-tight">Perusahaan</h3>
                              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Identitas tenant</p>
                            </div>
                            <Button
                              onClick={() => updateTenantSettingsMutation.mutate({ name: settingsTenantName })}
                              disabled={!settings.canManageUsers || updateTenantSettingsMutation.isPending}
                              className="rounded-2xl bg-blue-600 px-8 h-12 font-black shadow-xl shadow-blue-500/20 hover:bg-blue-700 text-white disabled:opacity-50"
                            >
                              Simpan
                            </Button>
                          </div>

                          <div className="grid gap-6 md:grid-cols-2">
                            <div className="md:col-span-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Nama Perusahaan</label>
                              <Input
                                value={settingsTenantName}
                                onChange={(e) => setSettingsTenantName(e.target.value)}
                                className="h-12 rounded-2xl border-slate-200 bg-white"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Tenant Slug</label>
                              <Input value={settings.tenant.slug} disabled className="h-12 rounded-2xl border-slate-200 bg-slate-50" />
                            </div>
                            <div>
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Status</label>
                              <Input value={settings.tenant.status} disabled className="h-12 rounded-2xl border-slate-200 bg-slate-50" />
                            </div>
                          </div>
                        </Card>
                      )}

                      {activeSettingsTab === "team" && settings && (
                        <div className="grid gap-8 lg:grid-cols-12">
                          <Card className="lg:col-span-7 border-slate-200 bg-white rounded-[2.5rem] shadow-sm overflow-hidden">
                            <div className="p-10 border-b border-slate-100 bg-slate-50/50">
                              <h3 className="text-xl font-black text-slate-900 tracking-tight">Tim & Akses</h3>
                              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Kelola user dalam tenant</p>
                            </div>
                            <div className="p-0">
                              <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                  <thead>
                                    <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-[0.15em] bg-white">
                                      <th className="p-10 pb-6 font-bold">User</th>
                                      <th className="p-10 pb-6 font-bold">Role</th>
                                      <th className="p-10 pb-6 font-bold">Status</th>
                                      <th className="p-10 pb-6 font-bold text-right">Dibuat</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-50">
                                    {(settings.users || []).map((u) => (
                                      <tr key={u.id} className="group hover:bg-slate-50/30 transition-colors">
                                        <td className="p-10 py-8">
                                          <div className="font-black text-slate-900">{u.name || "User"}</div>
                                          <div className="text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-widest">{u.email}</div>
                                        </td>
                                        <td className="p-10 py-8">
                                          <div className="text-xs font-bold text-slate-700">{(u.roles || []).join(", ")}</div>
                                        </td>
                                        <td className="p-10 py-8">
                                          <span className={cn(
                                            "text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full",
                                            u.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                                          )}>
                                            {u.status}
                                          </span>
                                        </td>
                                        <td className="p-10 py-8 text-right">
                                          <div className="text-xs font-bold text-slate-600">{new Date(u.createdAt).toLocaleDateString("id-ID")}</div>
                                        </td>
                                      </tr>
                                    ))}
                                    {(!settings.users || settings.users.length === 0) && (
                                      <tr>
                                        <td colSpan={4} className="p-20 text-center text-slate-300">
                                          <div className="font-black text-xs uppercase tracking-widest opacity-20">Belum ada user</div>
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </Card>

                          <Card className="lg:col-span-5 border-slate-200 bg-white rounded-[2.5rem] p-10 shadow-sm space-y-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">Tambah User</h3>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Buat akun staf ERP</p>
                              </div>
                            </div>

                            {!settings.canManageUsers && (
                              <div className="p-6 rounded-2xl border border-amber-200 bg-amber-50 text-amber-700 text-xs font-bold">
                                Hanya Tenant Admin yang dapat menambah user.
                              </div>
                            )}

                            <div className="space-y-4">
                              <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Email</label>
                                <Input
                                  value={inviteUser.email}
                                  onChange={(e) => setInviteUser((p) => ({ ...p, email: e.target.value }))}
                                  className="h-12 rounded-2xl border-slate-200 bg-white"
                                  disabled={!settings.canManageUsers}
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Nama</label>
                                <Input
                                  value={inviteUser.name}
                                  onChange={(e) => setInviteUser((p) => ({ ...p, name: e.target.value }))}
                                  className="h-12 rounded-2xl border-slate-200 bg-white"
                                  disabled={!settings.canManageUsers}
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">No. HP (opsional)</label>
                                <Input
                                  value={inviteUser.phone}
                                  onChange={(e) => setInviteUser((p) => ({ ...p, phone: e.target.value }))}
                                  className="h-12 rounded-2xl border-slate-200 bg-white"
                                  disabled={!settings.canManageUsers}
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Role</label>
                                <select
                                  value={inviteUser.role}
                                  onChange={(e) =>
                                    setInviteUser((p) => ({
                                      ...p,
                                      role: e.target.value as "erp_user" | "tenant_admin",
                                    }))
                                  }
                                  disabled={!settings.canManageUsers}
                                  className="w-full h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700"
                                >
                                  <option value="erp_user">ERP User</option>
                                  <option value="tenant_admin">Tenant Admin</option>
                                </select>
                              </div>
                            </div>

                            <Button
                              onClick={() =>
                                createTenantUserMutation.mutate({
                                  email: inviteUser.email,
                                  name: inviteUser.name,
                                  phone: inviteUser.phone || undefined,
                                  role: inviteUser.role,
                                })
                              }
                              disabled={!settings.canManageUsers || createTenantUserMutation.isPending}
                              className="w-full rounded-2xl bg-blue-600 px-8 h-12 font-black shadow-xl shadow-blue-500/20 hover:bg-blue-700 text-white disabled:opacity-50"
                            >
                              Buat User
                            </Button>
                          </Card>
                        </div>
                      )}

                      {activeSettingsTab === "security" && settings && (
                        <Card className="border-slate-200 bg-white rounded-[2.5rem] p-10 shadow-sm space-y-8">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-xl font-black text-slate-900 tracking-tight">Keamanan</h3>
                              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Ubah password login</p>
                            </div>
                            <Button
                              onClick={() => changePasswordMutation.mutate(passwordForm)}
                              disabled={changePasswordMutation.isPending}
                              className="rounded-2xl bg-blue-600 px-8 h-12 font-black shadow-xl shadow-blue-500/20 hover:bg-blue-700 text-white disabled:opacity-50"
                            >
                              Simpan
                            </Button>
                          </div>

                          <div className="grid gap-6 md:grid-cols-2">
                            <div>
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Password Saat Ini</label>
                              <Input
                                type="password"
                                value={passwordForm.currentPassword}
                                onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))}
                                className="h-12 rounded-2xl border-slate-200 bg-white"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Password Baru</label>
                              <Input
                                type="password"
                                value={passwordForm.newPassword}
                                onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
                                className="h-12 rounded-2xl border-slate-200 bg-white"
                              />
                            </div>
                          </div>
                        </Card>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </main>
        </div>

        {/* Modal Overlay */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 backdrop-blur-xl bg-slate-900/40 animate-in fade-in duration-500">
            <div
              className={cn(
                "w-full bg-white border border-slate-200 rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.15)] overflow-hidden animate-in zoom-in-95 duration-500 max-h-[88vh] flex flex-col",
                modalType === "renew"
                  ? "max-w-5xl"
                  : modalType === "journal" ||
                      modalType === "customer-list" ||
                      modalType === "customer-detail" ||
                      modalType === "sale-detail"
                    ? "max-w-4xl"
                    : "max-w-xl",
              )}
            >
              {/* Modal Header - Fixed */}
              <div className="px-8 py-6 sm:px-10 sm:py-8 border-b border-slate-50 flex items-center justify-between bg-gradient-to-r from-blue-50 to-transparent flex-shrink-0">
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {modalType === "project" && "Tambah Proyek Baru"}
                    {modalType === "sales" && "Input Penjualan Baru"}
                    {modalType === "sale-detail" && "Detail Penjualan"}
                    {modalType === "journal" && "Buat Jurnal Baru"}
                    {modalType === "customer" && "Tambah Konsumen"}
                    {modalType === "customer-list" && "Database Konsumen"}
                    {modalType === "customer-detail" && "Detail Konsumen"}
                    {modalType === "lead" && "Tambah Lead"}
                    {modalType === "lead-activity" && "Tambah Follow-up"}
                    {modalType === "vendor" && "Tambah Vendor"}
                    {modalType === "vendor-bill" && "Buat Invoice Vendor"}
                    {modalType === "vendor-payment" && (paymentKind === "payment" ? "Pembayaran Invoice" : "Pembayaran Retensi")}
                    {modalType === "purchase-order" && "Buat Purchase Order"}
                    {modalType === "employee" && "Tambah Karyawan"}
                    {modalType === "payroll-period" && "Buat Periode Payroll"}
                    {modalType === "payroll-run" && "Buat Payroll Run"}
                    {modalType === "payroll-pay" && "Pembayaran Payroll"}
                    {modalType === "withholding-pay" && (withholdingKind === "pph21" ? "Pembayaran PPh21" : "Pembayaran BPJS")}
                    {modalType === "commission" && "Buat Insentif Sales"}
                    {modalType === "commission-pay" && "Pembayaran Insentif"}
                    {modalType === "unit" && "Tambah Unit Proyek"}
                    {modalType === "doc-preview" && "Preview Dokumen"}
                    {modalType === "construction" && "Update Progres Lapangan"}
                    {modalType === "legal-upload" && "Upload Dokumen Baru"}
                    {modalType === "renew" && "Perpanjang Langganan"}
                    {modalType === "payment-method" && "Metode Pembayaran"}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">LIVINOVA ENTERPRISE ERP</p>
                </div>
                <button onClick={closeModal} className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors border border-slate-100">
                  <Plus className="h-6 w-6 rotate-45" />
                </button>
              </div>
              
              {/* Modal Body - Scrollable */}
              <div className={cn("space-y-6 overflow-y-auto flex-1 custom-scrollbar", modalType === "renew" ? "p-0" : "p-6 sm:p-8")}>
                {modalType === "renew" && (
                  <div>
                    <div className="px-8 py-8 sm:px-10 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-900 text-white relative overflow-hidden">
                      <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
                      <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-blue-400/10 blur-2xl" />
                      <div className="relative">
                        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
                          <div>
                            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-white/60">Perpanjang Langganan</div>
                            <h3 className="text-2xl sm:text-3xl font-black tracking-tight mt-2">Pilih paket perpanjangan</h3>
                            <p className="text-sm text-white/70 font-medium mt-2 max-w-2xl">
                              Pilih durasi yang paling sesuai. Pembayaran disimulasikan, lisensi langsung aktif setelah memilih paket.
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="px-4 py-2 rounded-2xl bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-widest">
                              {(tenantPricingPlans || []).length} Paket Tersedia
                            </div>
                            <Button
                              onClick={closeModal}
                              variant="outline"
                              className="h-11 rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                            >
                              Tutup
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 sm:p-8">
                      {(tenantPricingPlans || []).length === 0 ? (
                        <Card className="border-slate-200 bg-white rounded-[2rem] p-10 shadow-sm">
                          <div className="text-center">
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Tidak ada paket</div>
                            <div className="text-lg font-black text-slate-900">Paket perpanjangan belum tersedia</div>
                            <div className="text-sm text-slate-500 font-medium mt-2">
                              Pastikan System Pricing Plans sudah dibuat dan statusnya aktif.
                            </div>
                            <Button
                              onClick={() => queryClient.invalidateQueries({ queryKey: ["erp-tenant-pricing"] })}
                              variant="outline"
                              className="mt-6 rounded-2xl border-slate-200 h-12 px-6 font-black"
                            >
                              Muat Ulang
                            </Button>
                          </div>
                        </Card>
                      ) : (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                          {(tenantPricingPlans || []).map((plan) => (
                            <Card
                              key={plan.id}
                              className="border-slate-200 bg-white rounded-[2rem] shadow-sm hover:shadow-2xl transition-all group overflow-hidden"
                            >
                              <div className="p-8">
                                <div className="flex items-center justify-between mb-6">
                                  <span className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                                    {plan.durationDays} Hari
                                  </span>
                                  <div className="h-10 w-10 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-blue-600 group-hover:border-blue-200 group-hover:bg-blue-50 transition-all">
                                    <Zap className="h-5 w-5" />
                                  </div>
                                </div>

                                <div className="min-h-[88px]">
                                  <h4 className="text-lg font-black text-slate-900 tracking-tight leading-snug">
                                    {plan.name}
                                  </h4>
                                  <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed max-h-10 overflow-hidden">
                                    {plan.description || "Akses penuh fitur ERP sesuai paket."}
                                  </p>
                                </div>

                                <div className="mt-8">
                                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">
                                    Harga
                                  </div>
                                  <div className="text-3xl font-black text-blue-600 tracking-tighter">
                                    {formatRupiah(plan.price)}
                                  </div>
                                </div>
                              </div>

                              <div className="p-6 pt-0">
                                <Button
                                  onClick={() =>
                                    renewLicenseMutation.mutate({
                                      planId: plan.id,
                                      paymentMethod,
                                    })
                                  }
                                  disabled={renewLicenseMutation.isPending}
                                  className="w-full h-12 rounded-2xl bg-blue-600 text-white font-black text-xs tracking-widest uppercase shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all"
                                >
                                  {renewLicenseMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Pilih & Bayar"}
                                </Button>
                                <div className="text-[10px] text-slate-400 font-bold mt-4 text-center uppercase tracking-widest">
                                  Aktivasi instan
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {modalType === "payment-method" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight">Ganti Metode Pembayaran</h3>
                      <p className="text-sm text-slate-500 font-medium mt-1">
                        Metode ini akan dipakai saat Anda melakukan perpanjangan berikutnya (simulasi pembayaran).
                      </p>
                    </div>

                    <div className="grid gap-4">
                      {PAYMENT_METHODS.map((m) => {
                        const selected = paymentMethodDraft === m.id;
                        return (
                          <button
                            key={m.id}
                            onClick={() => setPaymentMethodDraft(m.id)}
                            className={cn(
                              "w-full text-left p-6 rounded-[1.75rem] border transition-all flex items-start justify-between gap-6",
                              selected
                                ? "border-blue-500 bg-blue-50 shadow-lg shadow-blue-500/10"
                                : "border-slate-200 bg-white hover:bg-slate-50",
                            )}
                          >
                            <div>
                              <div className="text-sm font-black text-slate-900">{m.label}</div>
                              <div className="text-xs text-slate-500 font-medium mt-1">{m.detail}</div>
                            </div>
                            <div
                              className={cn(
                                "h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5",
                                selected ? "border-blue-600 bg-blue-600" : "border-slate-300 bg-white",
                              )}
                            >
                              <div className={cn("h-2.5 w-2.5 rounded-full", selected ? "bg-white" : "bg-transparent")} />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {modalType === "doc-preview" && previewDoc && (
                  <div className="space-y-6">
                    <div className="p-8 bg-slate-50 border border-slate-100 rounded-[2rem] min-h-[400px] overflow-y-auto max-h-[60vh] font-serif shadow-inner">
                      <div className="prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: previewDocHtml }}></div>
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

                {modalType === "customer-list" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      <div className="md:col-span-8">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Cari Konsumen</label>
                        <Input
                          value={customerSearch}
                          onChange={(e) => setCustomerSearch(e.target.value)}
                          placeholder="Nama / email / telepon..."
                          className="bg-slate-50 border-slate-200 rounded-2xl h-14 px-6 focus:ring-blue-500/10 focus:border-blue-500 font-bold shadow-sm"
                        />
                      </div>
                      <div className="md:col-span-4 flex items-end">
                        <Button
                          onClick={() => openModal("customer")}
                          className="w-full h-14 rounded-2xl bg-blue-600 text-white font-black hover:bg-blue-700 shadow-xl shadow-blue-500/20"
                        >
                          + Tambah Konsumen
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-3">
                      {(customers || [])
                        .filter((c) => {
                          const q = customerSearch.trim().toLowerCase();
                          if (!q) return true;
                          return (
                            c.name.toLowerCase().includes(q) ||
                            (c.email || "").toLowerCase().includes(q) ||
                            (c.phone || "").toLowerCase().includes(q)
                          );
                        })
                        .map((c) => (
                          <div
                            key={c.id}
                            onClick={() => openCustomerDetailModal(c.id)}
                            className="p-5 rounded-3xl bg-white border border-slate-200 hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer shadow-sm"
                          >
                            <div className="flex items-start justify-between gap-6">
                              <div className="flex items-center gap-4 min-w-0">
                                <div className="h-11 w-11 rounded-2xl bg-slate-50 border border-slate-100 text-blue-600 flex items-center justify-center font-black text-sm shadow-sm">
                                  {c.name.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                  <div className="text-sm font-black text-slate-900 truncate">{c.name}</div>
                                  <div className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-2">
                                    {c.phone || c.email || "-"}
                                  </div>
                                </div>
                              </div>
                              <ChevronRight className="h-5 w-5 text-slate-300 shrink-0" />
                            </div>
                          </div>
                        ))}
                      {(customers || []).length === 0 && (
                        <div className="p-12 text-center text-slate-300 border-2 border-dashed border-slate-100 rounded-3xl bg-white/50">
                          <Users className="h-8 w-8 mx-auto mb-3 opacity-20" />
                          <p className="font-black text-xs uppercase tracking-widest opacity-30">Belum ada konsumen</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {modalType === "customer-detail" && (
                  <div className="space-y-6">
                    <div className="p-8 rounded-[2rem] bg-slate-50 border border-slate-100">
                      <div className="flex items-start justify-between gap-6">
                        <div className="min-w-0">
                          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Konsumen</div>
                          <div className="text-xl font-black text-slate-900 tracking-tight mt-2">
                            {isCustomerDetailLoading
                              ? "Memuat..."
                              : customerDetail?.name || "Konsumen tidak ditemukan"}
                          </div>
                          <div className="text-xs text-slate-500 font-medium mt-3">
                            {(customerDetail?.phone || "-") + (customerDetail?.email ? ` • ${customerDetail.email}` : "")}
                          </div>
                        </div>
                        {customerDetail && (
                          <div className="flex flex-col items-end gap-3">
                            <div className="px-4 py-2 rounded-2xl bg-white border border-slate-200 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 shadow-sm">
                              ID: {customerDetail.id.slice(0, 8).toUpperCase()}
                            </div>
                            <Button
                              onClick={() => openSalesForCustomer(customerDetail.id)}
                              className="h-11 rounded-2xl bg-blue-600 text-white font-black shadow-xl shadow-blue-500/20 hover:bg-blue-700 px-6"
                            >
                              Buat Penjualan
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    {customerDetail?.address && (
                      <div className="p-8 rounded-[2rem] bg-white border border-slate-200 shadow-sm">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Alamat</div>
                        <div className="text-sm font-bold text-slate-700 mt-3 whitespace-pre-wrap">{customerDetail.address}</div>
                      </div>
                    )}

                    <div className="grid gap-6 lg:grid-cols-2">
                      <div className="p-8 rounded-[2rem] bg-white border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-black text-slate-900">Riwayat Penjualan</div>
                          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                            {(customerDetail?.sales || []).length} transaksi
                          </div>
                        </div>
                        <div className="mt-6 space-y-3">
                          {(customerDetail?.sales || []).map((s) => (
                            <div
                              key={s.id}
                              onClick={() => openSaleDetailModal(s.id)}
                              className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer"
                            >
                              <div className="text-sm font-black text-slate-900">
                                {(s.project?.name || "Project") + (s.unit?.unitCode ? ` • ${s.unit.unitCode}` : "")}
                              </div>
                              <div className="text-xs text-slate-500 font-medium mt-2">
                                {new Date(s.createdAt).toLocaleDateString("id-ID")} • {s.status} •{" "}
                                {formatRupiah(s.totalPrice)}
                              </div>
                            </div>
                          ))}
                          {(customerDetail?.sales || []).length === 0 && (
                            <div className="p-8 text-center text-slate-300 border-2 border-dashed border-slate-100 rounded-3xl bg-white/50">
                              <p className="font-black text-xs uppercase tracking-widest opacity-30">Belum ada penjualan</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="p-8 rounded-[2rem] bg-white border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-black text-slate-900">Riwayat Lead</div>
                          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                            {(customerDetail?.leads || []).length} lead
                          </div>
                        </div>
                        <div className="mt-6 space-y-3">
                          {(customerDetail?.leads || []).map((l) => (
                            <div key={l.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                              <div className="text-sm font-black text-slate-900">{l.name}</div>
                              <div className="text-xs text-slate-500 font-medium mt-2">
                                {new Date(l.createdAt).toLocaleDateString("id-ID")} • {l.status}{" "}
                                {l.project?.name ? `• ${l.project.name}` : ""}
                              </div>
                            </div>
                          ))}
                          {(customerDetail?.leads || []).length === 0 && (
                            <div className="p-8 text-center text-slate-300 border-2 border-dashed border-slate-100 rounded-3xl bg-white/50">
                              <p className="font-black text-xs uppercase tracking-widest opacity-30">Belum ada lead</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {modalType === "sale-detail" && (
                  <div className="space-y-6">
                    <div className="p-8 rounded-[2rem] bg-slate-50 border border-slate-100">
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                        <div className="min-w-0">
                          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Penjualan</div>
                          <div className="text-xl font-black text-slate-900 tracking-tight mt-2">
                            {isSaleDetailLoading
                              ? "Memuat..."
                              : saleDetail
                                ? `${saleDetail.project.name} • ${saleDetail.unit.unitCode}`
                                : "Penjualan tidak ditemukan"}
                          </div>
                          {saleDetail && (
                            <div className="text-xs text-slate-500 font-medium mt-3">
                              Konsumen: {saleDetail.customer.name}
                            </div>
                          )}
                        </div>

                        {saleDetail && (
                          <div className="flex flex-col items-start lg:items-end gap-3">
                            <div className="flex items-center gap-2">
                              <span className="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] bg-white border border-slate-200 text-slate-600 shadow-sm">
                                {saleDetail.status}
                              </span>
                              <span className="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] bg-white border border-slate-200 text-slate-600 shadow-sm">
                                ID: {saleDetail.id.slice(0, 8).toUpperCase()}
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                Total
                              </div>
                              <div className="text-2xl font-black text-blue-600 tracking-tight mt-2">
                                {formatRupiah(Number(saleDetail.totalPrice))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {saleDetail && (
                      <div className="grid gap-6 lg:grid-cols-2">
                        <div className="p-8 rounded-[2rem] bg-white border border-slate-200 shadow-sm">
                          <div className="flex items-center justify-between gap-6">
                            <div>
                              <div className="text-sm font-black text-slate-900">Dokumen</div>
                              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-2">
                                {(saleDetail.documents || []).length} dokumen
                              </div>
                            </div>
                            <Button
                              onClick={() => generateSPR.mutate(saleDetail.id)}
                              disabled={generateSPR.isPending}
                              className="h-11 rounded-2xl bg-blue-600 text-white font-black shadow-xl shadow-blue-500/20 hover:bg-blue-700 px-6"
                            >
                              Generate SPR
                            </Button>
                          </div>

                          <div className="mt-6 space-y-3">
                            {(saleDetail.documents || []).map((doc) => (
                              <div
                                key={doc.id}
                                className="p-5 rounded-3xl bg-slate-50 border border-slate-100"
                              >
                                <div className="flex items-start justify-between gap-6">
                                  <div className="min-w-0">
                                    <div className="text-sm font-black text-slate-900 truncate">
                                      {doc.template?.name || "Dokumen"}
                                    </div>
                                    <div className="text-xs text-slate-500 font-medium mt-2">
                                      {new Date(doc.createdAt).toLocaleDateString("id-ID")} • {doc.status}
                                    </div>
                                  </div>
                                  <Button
                                    variant="outline"
                                    className="h-11 rounded-2xl border-slate-200 bg-white font-black text-[10px] uppercase tracking-[0.2em] px-5"
                                    onClick={() => {
                                      setPreviewDoc({
                                        name: doc.template?.name || "Dokumen",
                                        content: doc.content,
                                      });
                                      setModalType("doc-preview");
                                      setIsModalOpen(true);
                                    }}
                                  >
                                    Preview
                                  </Button>
                                </div>
                              </div>
                            ))}
                            {(saleDetail.documents || []).length === 0 && (
                              <div className="p-10 text-center text-slate-300 border-2 border-dashed border-slate-100 rounded-3xl bg-white/50">
                                <p className="font-black text-xs uppercase tracking-widest opacity-30">
                                  Belum ada dokumen
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="p-8 rounded-[2rem] bg-white border border-slate-200 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-black text-slate-900">Jadwal Pembayaran</div>
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                              {(saleDetail.payments || []).length} item
                            </div>
                          </div>
                          <div className="mt-6 space-y-3">
                            {(saleDetail.payments || []).map((p) => (
                              <div key={p.id} className="p-5 rounded-3xl bg-slate-50 border border-slate-100">
                                <div className="flex items-start justify-between gap-6">
                                  <div>
                                    <div className="text-sm font-black text-slate-900">
                                      {formatRupiah(Number(p.amount))}
                                    </div>
                                    <div className="text-xs text-slate-500 font-medium mt-2">
                                      Jatuh tempo: {new Date(p.dueDate).toLocaleDateString("id-ID")}
                                      {p.paidDate ? ` • Dibayar: ${new Date(p.paidDate).toLocaleDateString("id-ID")}` : ""}
                                    </div>
                                  </div>
                                  <span className="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] bg-white border border-slate-200 text-slate-600 shadow-sm">
                                    {p.status}
                                  </span>
                                </div>
                              </div>
                            ))}
                            {(saleDetail.payments || []).length === 0 && (
                              <div className="p-10 text-center text-slate-300 border-2 border-dashed border-slate-100 rounded-3xl bg-white/50">
                                <p className="font-black text-xs uppercase tracking-widest opacity-30">
                                  Belum ada jadwal pembayaran
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
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

                {modalType === "lead" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Nama Lead</label>
                        <Input
                          value={leadData.name}
                          onChange={(e) => setLeadData({ ...leadData, name: e.target.value })}
                          placeholder="Nama calon konsumen"
                          className="bg-slate-50 border-slate-200 rounded-2xl h-14 px-6 focus:ring-blue-500/10 focus:border-blue-500 font-bold shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Sumber</label>
                        <Input
                          value={leadData.source}
                          onChange={(e) => setLeadData({ ...leadData, source: e.target.value })}
                          placeholder="Contoh: IG Ads / Walk-in / Referral"
                          className="bg-slate-50 border-slate-200 rounded-2xl h-14 px-6 focus:ring-blue-500/10 focus:border-blue-500 font-bold shadow-sm"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Nomor Telepon / WA</label>
                        <Input
                          value={leadData.phone}
                          onChange={(e) => setLeadData({ ...leadData, phone: e.target.value })}
                          placeholder="+62..."
                          className="bg-slate-50 border-slate-200 rounded-2xl h-14 px-6 focus:ring-blue-500/10 focus:border-blue-500 font-bold shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Email</label>
                        <Input
                          type="email"
                          value={leadData.email}
                          onChange={(e) => setLeadData({ ...leadData, email: e.target.value })}
                          placeholder="email@example.com"
                          className="bg-slate-50 border-slate-200 rounded-2xl h-14 px-6 focus:ring-blue-500/10 focus:border-blue-500 font-bold shadow-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Proyek (Opsional)</label>
                      <select
                        value={leadData.projectId}
                        onChange={(e) => setLeadData({ ...leadData, projectId: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl h-14 px-6 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm appearance-none"
                      >
                        <option value="">-- Tanpa Proyek --</option>
                        {projects?.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Catatan (Opsional)</label>
                      <textarea
                        value={leadData.notes}
                        onChange={(e) => setLeadData({ ...leadData, notes: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-[1.5rem] p-6 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 min-h-[100px] shadow-sm"
                        placeholder="Contoh: minat type 36, minta jadwal survey, prefer WA..."
                      />
                    </div>
                  </div>
                )}

                {modalType === "lead-activity" && (
                  <div className="space-y-6">
                    <div className="p-6 rounded-[1.75rem] bg-slate-50 border border-slate-200">
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Lead</div>
                      <div className="text-base font-black text-slate-900 tracking-tight mt-2">
                        {(leads || []).find((l) => l.id === selectedLeadId)?.name || "Lead tidak ditemukan"}
                      </div>
                      <div className="text-xs text-slate-500 font-medium mt-2">
                        Tambahkan catatan follow-up agar tim sales punya jejak komunikasi yang jelas.
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      <div className="md:col-span-5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Jenis Follow-up</label>
                        <select
                          value={leadActivityData.type}
                          onChange={(e) =>
                            setLeadActivityData({ ...leadActivityData, type: e.target.value as LeadActivityType })
                          }
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl h-14 px-6 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm appearance-none"
                        >
                          <option value="whatsapp">WhatsApp</option>
                          <option value="call">Telepon</option>
                          <option value="meeting">Meeting</option>
                          <option value="site_visit">Site Visit</option>
                          <option value="note">Catatan</option>
                        </select>
                      </div>
                      <div className="md:col-span-7">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Jadwal Follow-up (Opsional)</label>
                        <Input
                          type="datetime-local"
                          value={leadActivityData.nextFollowUpAt}
                          onChange={(e) => setLeadActivityData({ ...leadActivityData, nextFollowUpAt: e.target.value })}
                          className="bg-slate-50 border-slate-200 rounded-2xl h-14 px-6 focus:ring-blue-500/10 focus:border-blue-500 font-bold shadow-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Catatan</label>
                      <textarea
                        value={leadActivityData.notes}
                        onChange={(e) => setLeadActivityData({ ...leadActivityData, notes: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-[1.5rem] p-6 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 min-h-[120px] shadow-sm"
                        placeholder="Contoh: kirim brosur via WA, follow-up besok jam 10, minta preferensi type..."
                      />
                    </div>
                  </div>
                )}

                {modalType === "vendor" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Nama Vendor</label>
                        <Input
                          value={vendorData.name}
                          onChange={(e) => setVendorData({ ...vendorData, name: e.target.value })}
                          placeholder="Nama perusahaan / subkon"
                          className="bg-slate-50 border-slate-200 rounded-2xl h-14 px-6 focus:ring-blue-500/10 focus:border-blue-500 font-bold shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">NPWP (Opsional)</label>
                        <Input
                          value={vendorData.taxId}
                          onChange={(e) => setVendorData({ ...vendorData, taxId: e.target.value })}
                          placeholder="NPWP / Tax ID"
                          className="bg-slate-50 border-slate-200 rounded-2xl h-14 px-6 focus:ring-blue-500/10 focus:border-blue-500 font-bold shadow-sm"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Telepon</label>
                        <Input
                          value={vendorData.phone}
                          onChange={(e) => setVendorData({ ...vendorData, phone: e.target.value })}
                          placeholder="+62..."
                          className="bg-slate-50 border-slate-200 rounded-2xl h-14 px-6 focus:ring-blue-500/10 focus:border-blue-500 font-bold shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Email</label>
                        <Input
                          type="email"
                          value={vendorData.email}
                          onChange={(e) => setVendorData({ ...vendorData, email: e.target.value })}
                          placeholder="email@vendor.com"
                          className="bg-slate-50 border-slate-200 rounded-2xl h-14 px-6 focus:ring-blue-500/10 focus:border-blue-500 font-bold shadow-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Alamat (Opsional)</label>
                      <textarea
                        value={vendorData.address}
                        onChange={(e) => setVendorData({ ...vendorData, address: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-[1.5rem] p-6 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 min-h-[100px] shadow-sm"
                        placeholder="Alamat vendor..."
                      />
                    </div>
                  </div>
                )}

                {modalType === "vendor-bill" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      <div className="md:col-span-6">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Vendor</label>
                        <select
                          value={vendorBillData.vendorId}
                          onChange={(e) => setVendorBillData({ ...vendorBillData, vendorId: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl h-14 px-6 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm appearance-none"
                        >
                          <option value="">-- Pilih Vendor --</option>
                          {(vendors || []).map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="md:col-span-6">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Proyek (Opsional)</label>
                        <select
                          value={vendorBillData.projectId}
                          onChange={(e) => setVendorBillData({ ...vendorBillData, projectId: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl h-14 px-6 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm appearance-none"
                        >
                          <option value="">-- Tanpa Proyek --</option>
                          {(projects || []).map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      <div className="md:col-span-5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Nomor Invoice</label>
                        <Input
                          value={vendorBillData.invoiceNumber}
                          onChange={(e) => setVendorBillData({ ...vendorBillData, invoiceNumber: e.target.value })}
                          placeholder="INV-001"
                          className="bg-slate-50 border-slate-200 rounded-2xl h-14 px-6 focus:ring-blue-500/10 focus:border-blue-500 font-bold shadow-sm"
                        />
                      </div>
                      <div className="md:col-span-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Tanggal</label>
                        <Input
                          type="date"
                          value={vendorBillData.date}
                          onChange={(e) => setVendorBillData({ ...vendorBillData, date: e.target.value })}
                          className="bg-slate-50 border-slate-200 rounded-2xl h-14 px-6 focus:ring-blue-500/10 focus:border-blue-500 font-bold shadow-sm"
                        />
                      </div>
                      <div className="md:col-span-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Jatuh Tempo (Opsional)</label>
                        <Input
                          type="date"
                          value={vendorBillData.dueDate}
                          onChange={(e) => setVendorBillData({ ...vendorBillData, dueDate: e.target.value })}
                          className="bg-slate-50 border-slate-200 rounded-2xl h-14 px-6 focus:ring-blue-500/10 focus:border-blue-500 font-bold shadow-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      <div className="md:col-span-6">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">PPN Masukan (Opsional)</label>
                        <Input
                          type="number"
                          value={vendorBillData.taxAmount}
                          onChange={(e) => setVendorBillData({ ...vendorBillData, taxAmount: Number(e.target.value) })}
                          placeholder="0"
                          className="bg-slate-50 border-slate-200 rounded-2xl h-14 px-6 focus:ring-blue-500/10 focus:border-blue-500 font-bold shadow-sm"
                        />
                      </div>
                      <div className="md:col-span-6">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Retensi % (Opsional)</label>
                        <Input
                          type="number"
                          value={vendorBillData.retentionPercent}
                          onChange={(e) =>
                            setVendorBillData({ ...vendorBillData, retentionPercent: Number(e.target.value) })
                          }
                          placeholder="0"
                          className="bg-slate-50 border-slate-200 rounded-2xl h-14 px-6 focus:ring-blue-500/10 focus:border-blue-500 font-bold shadow-sm"
                        />
                      </div>
                    </div>

                    <div className="p-8 rounded-[2rem] bg-slate-50 border border-slate-100 space-y-4">
                      <div className="flex items-center justify-between gap-6 mb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Item (WIP)</span>
                        <Button
                          type="button"
                          onClick={() =>
                            setVendorBillData({
                              ...vendorBillData,
                              items: [...vendorBillData.items, { description: "", amount: 0, wipAccountCode: "103.04" }],
                            })
                          }
                          size="sm"
                          variant="ghost"
                          className="text-blue-600 text-[10px] font-black uppercase tracking-widest"
                        >
                          + Tambah Baris
                        </Button>
                      </div>
                      {vendorBillData.items.map((it, idx) => (
                        <div
                          key={idx}
                          className="grid grid-cols-1 sm:grid-cols-[1fr_160px_120px_40px] gap-3 group/row items-center"
                        >
                          <Input
                            value={it.description}
                            onChange={(e) => {
                              const next = [...vendorBillData.items];
                              next[idx] = { ...next[idx], description: e.target.value };
                              setVendorBillData({ ...vendorBillData, items: next });
                            }}
                            placeholder="Deskripsi pekerjaan/material"
                            className="bg-white border-slate-200 rounded-2xl h-12 px-4 text-xs font-bold shadow-sm"
                          />
                          <Input
                            type="number"
                            value={it.amount || ""}
                            onChange={(e) => {
                              const next = [...vendorBillData.items];
                              next[idx] = { ...next[idx], amount: Number(e.target.value) };
                              setVendorBillData({ ...vendorBillData, items: next });
                            }}
                            placeholder="Nominal"
                            className="bg-white border-slate-200 rounded-2xl h-12 px-4 text-xs font-black text-right"
                          />
                          <Input
                            value={it.wipAccountCode}
                            onChange={(e) => {
                              const next = [...vendorBillData.items];
                              next[idx] = { ...next[idx], wipAccountCode: e.target.value };
                              setVendorBillData({ ...vendorBillData, items: next });
                            }}
                            placeholder="103.04"
                            className="bg-white border-slate-200 rounded-2xl h-12 px-4 text-xs font-black text-center"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (vendorBillData.items.length <= 1) return;
                              const next = [...vendorBillData.items];
                              next.splice(idx, 1);
                              setVendorBillData({ ...vendorBillData, items: next });
                            }}
                            className="h-10 w-10 rounded-2xl flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover/row:opacity-100"
                          >
                            <Plus className="h-4 w-4 rotate-45" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Catatan (Opsional)</label>
                      <textarea
                        value={vendorBillData.notes}
                        onChange={(e) => setVendorBillData({ ...vendorBillData, notes: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-[1.5rem] p-6 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 min-h-[100px] shadow-sm"
                        placeholder="Contoh: termin 1, sesuai SPK, retensi 5%..."
                      />
                    </div>
                  </div>
                )}

                {modalType === "vendor-payment" && (
                  <div className="space-y-6">
                    <div className="p-6 rounded-[1.75rem] bg-slate-50 border border-slate-200">
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Invoice</div>
                      <div className="text-base font-black text-slate-900 tracking-tight mt-2">
                        {(vendorBills || []).find((b) => b.id === selectedBillId)?.invoiceNumber || "Invoice tidak ditemukan"}
                      </div>
                      <div className="text-xs text-slate-500 font-medium mt-2">
                        {paymentKind === "payment"
                          ? "Pembayaran akan membuat jurnal: Dr 201.01 / Cr Kas/Bank."
                          : "Pembayaran retensi akan membuat jurnal: Dr 201.04 / Cr Kas/Bank."}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      <div className="md:col-span-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Tanggal</label>
                        <Input
                          type="date"
                          value={vendorPaymentData.date}
                          onChange={(e) => setVendorPaymentData({ ...vendorPaymentData, date: e.target.value })}
                          className="bg-slate-50 border-slate-200 rounded-2xl h-14 px-6 focus:ring-blue-500/10 focus:border-blue-500 font-bold shadow-sm"
                        />
                      </div>
                      <div className="md:col-span-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Kas/Bank (COA)</label>
                        <Input
                          value={vendorPaymentData.cashAccountCode}
                          onChange={(e) =>
                            setVendorPaymentData({ ...vendorPaymentData, cashAccountCode: e.target.value })
                          }
                          placeholder="101.02"
                          className="bg-slate-50 border-slate-200 rounded-2xl h-14 px-6 focus:ring-blue-500/10 focus:border-blue-500 font-bold shadow-sm"
                        />
                      </div>
                      <div className="md:col-span-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Nominal</label>
                        <Input
                          type="number"
                          value={vendorPaymentData.amount}
                          onChange={(e) =>
                            setVendorPaymentData({ ...vendorPaymentData, amount: Number(e.target.value) })
                          }
                          placeholder="Rp 0"
                          className="bg-slate-50 border-slate-200 rounded-2xl h-14 px-6 focus:ring-blue-500/10 focus:border-blue-500 font-black shadow-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Catatan (Opsional)</label>
                      <textarea
                        value={vendorPaymentData.notes}
                        onChange={(e) => setVendorPaymentData({ ...vendorPaymentData, notes: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-[1.5rem] p-6 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 min-h-[100px] shadow-sm"
                        placeholder="Contoh: transfer bank, no. referensi, keterangan..."
                      />
                    </div>
                  </div>
                )}

                {modalType === "purchase-order" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      <div className="md:col-span-6">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Vendor</label>
                        <select
                          value={purchaseOrderData.vendorId}
                          onChange={(e) =>
                            setPurchaseOrderData({ ...purchaseOrderData, vendorId: e.target.value })
                          }
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl h-14 px-6 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm appearance-none"
                        >
                          <option value="">-- Pilih Vendor --</option>
                          {(vendors || []).map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="md:col-span-6">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Proyek (Opsional)</label>
                        <select
                          value={purchaseOrderData.projectId}
                          onChange={(e) =>
                            setPurchaseOrderData({ ...purchaseOrderData, projectId: e.target.value })
                          }
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl h-14 px-6 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm appearance-none"
                        >
                          <option value="">-- Tanpa Proyek --</option>
                          {(projects || []).map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      <div className="md:col-span-5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Nomor PO</label>
                        <Input
                          value={purchaseOrderData.poNumber}
                          onChange={(e) =>
                            setPurchaseOrderData({ ...purchaseOrderData, poNumber: e.target.value })
                          }
                          placeholder="PO-001"
                          className="bg-slate-50 border-slate-200 rounded-2xl h-14 px-6 focus:ring-blue-500/10 focus:border-blue-500 font-bold shadow-sm"
                        />
                      </div>
                      <div className="md:col-span-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Tanggal</label>
                        <Input
                          type="date"
                          value={purchaseOrderData.date}
                          onChange={(e) =>
                            setPurchaseOrderData({ ...purchaseOrderData, date: e.target.value })
                          }
                          className="bg-slate-50 border-slate-200 rounded-2xl h-14 px-6 focus:ring-blue-500/10 focus:border-blue-500 font-bold shadow-sm"
                        />
                      </div>
                      <div className="md:col-span-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Catatan (Opsional)</label>
                        <Input
                          value={purchaseOrderData.notes}
                          onChange={(e) =>
                            setPurchaseOrderData({ ...purchaseOrderData, notes: e.target.value })
                          }
                          placeholder="Syarat, termin, keterangan..."
                          className="bg-slate-50 border-slate-200 rounded-2xl h-14 px-6 focus:ring-blue-500/10 focus:border-blue-500 font-bold shadow-sm"
                        />
                      </div>
                    </div>

                    <div className="p-8 rounded-[2rem] bg-slate-50 border border-slate-100 space-y-4">
                      <div className="flex items-center justify-between gap-6 mb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Item PO</span>
                        <Button
                          type="button"
                          onClick={() =>
                            setPurchaseOrderData({
                              ...purchaseOrderData,
                              items: [
                                ...purchaseOrderData.items,
                                { description: "", qty: 1, unitPrice: 0, wipAccountCode: "103.04" },
                              ],
                            })
                          }
                          size="sm"
                          variant="ghost"
                          className="text-blue-600 text-[10px] font-black uppercase tracking-widest"
                        >
                          + Tambah Baris
                        </Button>
                      </div>

                      {purchaseOrderData.items.map((it, idx) => (
                        <div
                          key={idx}
                          className="grid grid-cols-1 sm:grid-cols-[1fr_90px_140px_110px_40px] gap-3 group/row items-center"
                        >
                          <Input
                            value={it.description}
                            onChange={(e) => {
                              const next = [...purchaseOrderData.items];
                              next[idx] = { ...next[idx], description: e.target.value };
                              setPurchaseOrderData({ ...purchaseOrderData, items: next });
                            }}
                            placeholder="Deskripsi"
                            className="bg-white border-slate-200 rounded-2xl h-12 px-4 text-xs font-bold shadow-sm"
                          />
                          <Input
                            type="number"
                            value={it.qty || ""}
                            onChange={(e) => {
                              const next = [...purchaseOrderData.items];
                              next[idx] = { ...next[idx], qty: Number(e.target.value) };
                              setPurchaseOrderData({ ...purchaseOrderData, items: next });
                            }}
                            placeholder="Qty"
                            className="bg-white border-slate-200 rounded-2xl h-12 px-4 text-xs font-black text-right"
                          />
                          <Input
                            type="number"
                            value={it.unitPrice || ""}
                            onChange={(e) => {
                              const next = [...purchaseOrderData.items];
                              next[idx] = { ...next[idx], unitPrice: Number(e.target.value) };
                              setPurchaseOrderData({ ...purchaseOrderData, items: next });
                            }}
                            placeholder="Harga"
                            className="bg-white border-slate-200 rounded-2xl h-12 px-4 text-xs font-black text-right"
                          />
                          <Input
                            value={it.wipAccountCode}
                            onChange={(e) => {
                              const next = [...purchaseOrderData.items];
                              next[idx] = { ...next[idx], wipAccountCode: e.target.value };
                              setPurchaseOrderData({ ...purchaseOrderData, items: next });
                            }}
                            placeholder="103.04"
                            className="bg-white border-slate-200 rounded-2xl h-12 px-4 text-xs font-black text-center"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (purchaseOrderData.items.length <= 1) return;
                              const next = [...purchaseOrderData.items];
                              next.splice(idx, 1);
                              setPurchaseOrderData({ ...purchaseOrderData, items: next });
                            }}
                            className="h-10 w-10 rounded-2xl flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover/row:opacity-100"
                          >
                            <Plus className="h-4 w-4 rotate-45" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {modalType === "employee" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Nomor Karyawan</label>
                        <Input
                          value={employeeData.employeeNo}
                          onChange={(e) => setEmployeeData({ ...employeeData, employeeNo: e.target.value })}
                          placeholder="EMP-001"
                          className="bg-slate-50 border-slate-200 rounded-2xl h-14 px-6 focus:ring-blue-500/10 focus:border-blue-500 font-bold shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Nama</label>
                        <Input
                          value={employeeData.name}
                          onChange={(e) => setEmployeeData({ ...employeeData, name: e.target.value })}
                          placeholder="Nama lengkap"
                          className="bg-slate-50 border-slate-200 rounded-2xl h-14 px-6 focus:ring-blue-500/10 focus:border-blue-500 font-bold shadow-sm"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Departemen</label>
                        <Input
                          value={employeeData.department}
                          onChange={(e) => setEmployeeData({ ...employeeData, department: e.target.value })}
                          placeholder="Contoh: Finance / Sales / Teknik"
                          className="bg-slate-50 border-slate-200 rounded-2xl h-14 px-6 focus:ring-blue-500/10 focus:border-blue-500 font-bold shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Jabatan</label>
                        <Input
                          value={employeeData.position}
                          onChange={(e) => setEmployeeData({ ...employeeData, position: e.target.value })}
                          placeholder="Contoh: Admin / Sales Exec"
                          className="bg-slate-50 border-slate-200 rounded-2xl h-14 px-6 focus:ring-blue-500/10 focus:border-blue-500 font-bold shadow-sm"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Email</label>
                        <Input
                          type="email"
                          value={employeeData.email}
                          onChange={(e) => setEmployeeData({ ...employeeData, email: e.target.value })}
                          placeholder="email@company.com"
                          className="bg-slate-50 border-slate-200 rounded-2xl h-14 px-6 focus:ring-blue-500/10 focus:border-blue-500 font-bold shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Telepon</label>
                        <Input
                          value={employeeData.phone}
                          onChange={(e) => setEmployeeData({ ...employeeData, phone: e.target.value })}
                          placeholder="+62..."
                          className="bg-slate-50 border-slate-200 rounded-2xl h-14 px-6 focus:ring-blue-500/10 focus:border-blue-500 font-bold shadow-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Tanggal Masuk</label>
                      <Input
                        type="date"
                        value={employeeData.startDate}
                        onChange={(e) => setEmployeeData({ ...employeeData, startDate: e.target.value })}
                        className="bg-slate-50 border-slate-200 rounded-2xl h-14 px-6 focus:ring-blue-500/10 focus:border-blue-500 font-bold shadow-sm"
                      />
                    </div>

                    <div className="p-8 rounded-[2rem] bg-slate-50 border border-slate-100 space-y-4">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Komponen Payroll</div>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Gaji Pokok</label>
                          <Input
                            type="number"
                            value={employeeData.basicSalary}
                            onChange={(e) => setEmployeeData({ ...employeeData, basicSalary: Number(e.target.value) })}
                            className="bg-white border-slate-200 rounded-2xl h-12 px-4 font-black text-right"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Tunjangan</label>
                          <Input
                            type="number"
                            value={employeeData.allowance}
                            onChange={(e) => setEmployeeData({ ...employeeData, allowance: Number(e.target.value) })}
                            className="bg-white border-slate-200 rounded-2xl h-12 px-4 font-black text-right"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-6">
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">PPH21</label>
                          <Input
                            type="number"
                            value={employeeData.pph21}
                            onChange={(e) => setEmployeeData({ ...employeeData, pph21: Number(e.target.value) })}
                            className="bg-white border-slate-200 rounded-2xl h-12 px-4 font-black text-right"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">BPJS (Karyawan)</label>
                          <Input
                            type="number"
                            value={employeeData.bpjsEmployee}
                            onChange={(e) =>
                              setEmployeeData({ ...employeeData, bpjsEmployee: Number(e.target.value) })
                            }
                            className="bg-white border-slate-200 rounded-2xl h-12 px-4 font-black text-right"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">BPJS (Perusahaan)</label>
                          <Input
                            type="number"
                            value={employeeData.bpjsEmployer}
                            onChange={(e) =>
                              setEmployeeData({ ...employeeData, bpjsEmployer: Number(e.target.value) })
                            }
                            className="bg-white border-slate-200 rounded-2xl h-12 px-4 font-black text-right"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {modalType === "payroll-period" && (
                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Nama Periode</label>
                      <Input
                        value={payrollPeriodData.name}
                        onChange={(e) => setPayrollPeriodData({ ...payrollPeriodData, name: e.target.value })}
                        placeholder="Contoh: Maret 2026"
                        className="bg-slate-50 border-slate-200 rounded-2xl h-14 px-6 focus:ring-blue-500/10 focus:border-blue-500 font-bold shadow-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Start Date</label>
                        <Input
                          type="date"
                          value={payrollPeriodData.startDate}
                          onChange={(e) =>
                            setPayrollPeriodData({ ...payrollPeriodData, startDate: e.target.value })
                          }
                          className="bg-slate-50 border-slate-200 rounded-2xl h-14 px-6 focus:ring-blue-500/10 focus:border-blue-500 font-bold shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">End Date</label>
                        <Input
                          type="date"
                          value={payrollPeriodData.endDate}
                          onChange={(e) =>
                            setPayrollPeriodData({ ...payrollPeriodData, endDate: e.target.value })
                          }
                          className="bg-slate-50 border-slate-200 rounded-2xl h-14 px-6 focus:ring-blue-500/10 focus:border-blue-500 font-bold shadow-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {modalType === "payroll-run" && (
                  <div className="space-y-6">
                    <div className="p-6 rounded-[1.75rem] bg-slate-50 border border-slate-200">
                      <div className="text-xs text-slate-500 font-medium">
                        Payroll run akan mengambil semua karyawan aktif, lalu hitung Gross/Net berdasarkan master karyawan.
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Periode</label>
                      <select
                        value={payrollRunData.periodId}
                        onChange={(e) => setPayrollRunData({ periodId: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl h-14 px-6 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm appearance-none"
                      >
                        <option value="">-- Pilih Periode --</option>
                        {(payrollPeriods || []).map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="p-6 rounded-[1.75rem] bg-white border border-slate-200">
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Karyawan aktif</div>
                      <div className="text-base font-black text-slate-900 tracking-tight mt-2">
                        {(employees || []).filter((e) => e.status === "active").length}
                      </div>
                    </div>
                  </div>
                )}

                {modalType === "payroll-pay" && (
                  <div className="space-y-6">
                    <div className="p-6 rounded-[1.75rem] bg-slate-50 border border-slate-200">
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Payroll</div>
                      <div className="text-base font-black text-slate-900 tracking-tight mt-2">
                        {(payrollRuns || []).find((r) => r.id === selectedPayrollRunId)?.period?.name || "Payroll tidak ditemukan"}
                      </div>
                      <div className="text-xs text-slate-500 font-medium mt-2">
                        Pembayaran akan membuat jurnal: Dr 205.02 / Cr Kas/Bank.
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      <div className="md:col-span-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Tanggal</label>
                        <Input
                          type="date"
                          value={payrollPayData.date}
                          onChange={(e) => setPayrollPayData({ ...payrollPayData, date: e.target.value })}
                          className="bg-slate-50 border-slate-200 rounded-2xl h-14 px-6 focus:ring-blue-500/10 focus:border-blue-500 font-bold shadow-sm"
                        />
                      </div>
                      <div className="md:col-span-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Kas/Bank (COA)</label>
                        <Input
                          value={payrollPayData.cashAccountCode}
                          onChange={(e) => setPayrollPayData({ ...payrollPayData, cashAccountCode: e.target.value })}
                          placeholder="101.02"
                          className="bg-slate-50 border-slate-200 rounded-2xl h-14 px-6 focus:ring-blue-500/10 focus:border-blue-500 font-bold shadow-sm"
                        />
                      </div>
                      <div className="md:col-span-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Nominal</label>
                        <Input
                          type="number"
                          value={payrollPayData.amount}
                          onChange={(e) => setPayrollPayData({ ...payrollPayData, amount: Number(e.target.value) })}
                          className="bg-slate-50 border-slate-200 rounded-2xl h-14 px-6 focus:ring-blue-500/10 focus:border-blue-500 font-black shadow-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Catatan (Opsional)</label>
                      <textarea
                        value={payrollPayData.notes}
                        onChange={(e) => setPayrollPayData({ ...payrollPayData, notes: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-[1.5rem] p-6 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 min-h-[100px] shadow-sm"
                        placeholder="Contoh: transfer bank payroll batch..."
                      />
                    </div>
                  </div>
                )}

                {modalType === "withholding-pay" && (
                  <div className="space-y-6">
                    <div className="p-6 rounded-[1.75rem] bg-slate-50 border border-slate-200">
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Payroll</div>
                      <div className="text-base font-black text-slate-900 tracking-tight mt-2">
                        {(payrollRuns || []).find((r) => r.id === selectedPayrollRunId)?.period?.name ||
                          "Payroll tidak ditemukan"}
                      </div>
                      <div className="text-xs text-slate-500 font-medium mt-2">
                        {withholdingKind === "pph21"
                          ? "Pembayaran akan membuat jurnal: Dr 204.03 / Cr Kas/Bank."
                          : "Pembayaran akan membuat jurnal: Dr 205.03 / Cr Kas/Bank."}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      <div className="md:col-span-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Tanggal</label>
                        <Input
                          type="date"
                          value={withholdingPayData.date}
                          onChange={(e) =>
                            setWithholdingPayData({ ...withholdingPayData, date: e.target.value })
                          }
                          className="bg-slate-50 border-slate-200 rounded-2xl h-14 px-6 focus:ring-blue-500/10 focus:border-blue-500 font-bold shadow-sm"
                        />
                      </div>
                      <div className="md:col-span-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Kas/Bank (COA)</label>
                        <Input
                          value={withholdingPayData.cashAccountCode}
                          onChange={(e) =>
                            setWithholdingPayData({
                              ...withholdingPayData,
                              cashAccountCode: e.target.value,
                            })
                          }
                          placeholder="101.02"
                          className="bg-slate-50 border-slate-200 rounded-2xl h-14 px-6 focus:ring-blue-500/10 focus:border-blue-500 font-bold shadow-sm"
                        />
                      </div>
                      <div className="md:col-span-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Nominal</label>
                        <Input
                          type="number"
                          value={withholdingPayData.amount}
                          onChange={(e) =>
                            setWithholdingPayData({
                              ...withholdingPayData,
                              amount: Number(e.target.value),
                            })
                          }
                          className="bg-slate-50 border-slate-200 rounded-2xl h-14 px-6 focus:ring-blue-500/10 focus:border-blue-500 font-black shadow-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Catatan (Opsional)</label>
                      <textarea
                        value={withholdingPayData.notes}
                        onChange={(e) =>
                          setWithholdingPayData({ ...withholdingPayData, notes: e.target.value })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-[1.5rem] p-6 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 min-h-[100px] shadow-sm"
                        placeholder="Contoh: pembayaran setor pajak / BPJS..."
                      />
                    </div>
                  </div>
                )}

                {modalType === "commission" && (
                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Penerima</label>
                      <select
                        value={commissionData.userId}
                        onChange={(e) => setCommissionData({ ...commissionData, userId: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl h-14 px-6 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm appearance-none"
                      >
                        <option value="">-- Pilih User --</option>
                        {(settings?.users || []).map((u) => (
                          <option key={u.id} value={u.id}>
                            {(u.name ? `${u.name} • ` : "") + u.email}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      <div className="md:col-span-6">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Nominal</label>
                        <Input
                          type="number"
                          value={commissionData.amount}
                          onChange={(e) => setCommissionData({ ...commissionData, amount: Number(e.target.value) })}
                          className="bg-slate-50 border-slate-200 rounded-2xl h-14 px-6 focus:ring-blue-500/10 focus:border-blue-500 font-black shadow-sm"
                        />
                      </div>
                      <div className="md:col-span-6">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Sales ID (Opsional)</label>
                        <Input
                          value={commissionData.salesId}
                          onChange={(e) => setCommissionData({ ...commissionData, salesId: e.target.value })}
                          placeholder="Link ke transaksi (opsional)"
                          className="bg-slate-50 border-slate-200 rounded-2xl h-14 px-6 focus:ring-blue-500/10 focus:border-blue-500 font-bold shadow-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Catatan (Opsional)</label>
                      <textarea
                        value={commissionData.notes}
                        onChange={(e) => setCommissionData({ ...commissionData, notes: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-[1.5rem] p-6 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 min-h-[100px] shadow-sm"
                        placeholder="Keterangan insentif..."
                      />
                    </div>
                  </div>
                )}

                {modalType === "commission-pay" && (
                  <div className="space-y-6">
                    <div className="p-6 rounded-[1.75rem] bg-slate-50 border border-slate-200">
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Insentif</div>
                      <div className="text-base font-black text-slate-900 tracking-tight mt-2">
                        {(commissionPayouts || []).find((c) => c.id === selectedCommissionId)?.user?.name ||
                          (commissionPayouts || []).find((c) => c.id === selectedCommissionId)?.user?.email ||
                          "Insentif tidak ditemukan"}
                      </div>
                      <div className="text-xs text-slate-500 font-medium mt-2">
                        Pembayaran akan membuat jurnal: Dr 205.05 / Cr Kas/Bank.
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      <div className="md:col-span-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Tanggal</label>
                        <Input
                          type="date"
                          value={commissionPayData.date}
                          onChange={(e) => setCommissionPayData({ ...commissionPayData, date: e.target.value })}
                          className="bg-slate-50 border-slate-200 rounded-2xl h-14 px-6 focus:ring-blue-500/10 focus:border-blue-500 font-bold shadow-sm"
                        />
                      </div>
                      <div className="md:col-span-8">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Kas/Bank (COA)</label>
                        <Input
                          value={commissionPayData.cashAccountCode}
                          onChange={(e) =>
                            setCommissionPayData({ ...commissionPayData, cashAccountCode: e.target.value })
                          }
                          placeholder="101.02"
                          className="bg-slate-50 border-slate-200 rounded-2xl h-14 px-6 focus:ring-blue-500/10 focus:border-blue-500 font-bold shadow-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Catatan (Opsional)</label>
                      <textarea
                        value={commissionPayData.notes}
                        onChange={(e) => setCommissionPayData({ ...commissionPayData, notes: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-[1.5rem] p-6 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 min-h-[100px] shadow-sm"
                        placeholder="Keterangan pembayaran..."
                      />
                    </div>
                  </div>
                )}

                {modalType === "journal" && (
                  <div className="space-y-6">
                    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
                      <div className="flex items-start justify-between gap-6">
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Jurnal Umum</div>
                          <div className="text-lg font-black text-slate-900 tracking-tight mt-2">Detail transaksi</div>
                          <div className="text-sm text-slate-500 font-medium mt-2">
                            Pastikan total debit dan kredit seimbang sebelum simpan.
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        <div className="md:col-span-4">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Tanggal</label>
                          <Input 
                            type="date" 
                            value={journalData.date}
                            onChange={(e) => setJournalData({ ...journalData, date: e.target.value })}
                            className="bg-slate-50 border-slate-200 rounded-2xl h-14 px-6 focus:ring-blue-500/10 focus:border-blue-500 font-bold shadow-sm" 
                          />
                        </div>
                        <div className="md:col-span-8">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Keterangan</label>
                          <Input 
                            value={journalData.description}
                            onChange={(e) => setJournalData({ ...journalData, description: e.target.value })}
                            placeholder="Contoh: Penerimaan Booking Unit A01" 
                            className="bg-slate-50 border-slate-200 rounded-2xl h-14 px-6 focus:ring-blue-500/10 focus:border-blue-500 font-bold shadow-sm" 
                          />
                        </div>
                      </div>

                      <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6 sm:p-7">
                        <div className="flex items-center justify-between gap-6 mb-5">
                          <div>
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Konteks (Opsional)</div>
                            <div className="text-sm font-black text-slate-900 tracking-tight mt-2">Link ke proyek / sales</div>
                          </div>
                          <div className="text-xs text-slate-500 font-medium">
                            Dipakai untuk jurnal otomatis saat serah terima
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                          <div className="lg:col-span-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Proyek</label>
                            <select
                              value={journalData.projectId}
                              onChange={(e) => setJournalData({ ...journalData, projectId: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-2xl h-14 px-6 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm appearance-none"
                            >
                              <option value="">-- Tanpa Proyek --</option>
                              {projects?.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="lg:col-span-5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Sales</label>
                            <select
                              value={journalData.salesId}
                              onChange={(e) => setJournalData({ ...journalData, salesId: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-2xl h-14 px-6 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm appearance-none"
                            >
                              <option value="">-- Tanpa Sales --</option>
                              {(stats?.recentSales || []).map((s) => (
                                <option key={s.id} value={s.id}>
                                  {(s.unit?.unitCode || "Unit")} - {(s.customer?.name || "Konsumen")}
                                </option>
                              ))}
                            </select>
                            <div className="text-xs text-slate-500 font-medium mt-2">
                              Pilih sales agar uang muka/WIP bisa ikut terhitung saat serah terima.
                            </div>
                          </div>

                          <div className="lg:col-span-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Referensi</label>
                            <Input
                              value={journalData.reference}
                              onChange={(e) => setJournalData({ ...journalData, reference: e.target.value })}
                              placeholder="INV-001"
                              className="bg-white border-slate-200 rounded-2xl h-14 px-6 focus:ring-blue-500/10 focus:border-blue-500 font-bold shadow-sm"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-8 rounded-[2rem] bg-slate-50 border border-slate-100 space-y-4">
                      <div className="flex items-center justify-between gap-6 mb-2">
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
                        <div
                          key={idx}
                          className="grid grid-cols-1 sm:grid-cols-[1fr_140px_140px_40px] gap-3 group/row items-center"
                        >
                          <select 
                            value={detail.accountCode}
                            onChange={(e) => {
                              const newDetails = [...journalData.details];
                              newDetails[idx].accountCode = e.target.value;
                              setJournalData({ ...journalData, details: newDetails });
                            }}
                            className="w-full bg-white border border-slate-200 rounded-2xl h-12 px-4 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/10"
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
                            className="w-full bg-white border border-slate-200 h-12 rounded-2xl text-xs font-black text-emerald-600 text-right px-4" 
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
                            className="w-full bg-white border border-slate-200 h-12 rounded-2xl text-xs font-black text-blue-600 text-right px-4" 
                          />
                          <button 
                            type="button"
                            onClick={() => removeJournalRow(idx)}
                            className="h-10 w-10 rounded-2xl flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover/row:opacity-100"
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
                          const companyName = (settingsTenantName || "Livinova Enterprise").trim();
                          const printedAt = new Date().toLocaleString("id-ID");
                          const isBrandedDoc = previewDocHtml.includes("Dokumen internal perusahaan");
                          win.document.write(`
                            <html>
                              <head>
                                <title></title>
                                <style>
                                  @page { size: A4; margin: 0; }
                                  html, body { height: 100%; }
                                  body { font-family: "Times New Roman", serif; color: #0f172a; margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                                  .page { padding: 18mm; }
                                  .doc { max-width: 820px; margin: 0 auto; }
                                  .letterhead { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; padding-bottom: 14px; border-bottom: 2px solid #0f172a; }
                                  .brand { font-weight: 800; letter-spacing: 0.08em; font-size: 16px; text-transform: uppercase; }
                                  .sub { color: #64748b; font-size: 11px; margin-top: 6px; }
                                  .meta { text-align: right; }
                                  .meta .label { color: #64748b; font-size: 11px; }
                                  .meta .value { font-weight: 700; font-size: 12px; margin-top: 6px; }
                                  .content { padding-top: 18px; }
                                  h1, h2, h3 { margin: 0; }
                                  h1 { font-size: 22px; font-weight: 800; letter-spacing: 0.08em; text-align: center; margin-top: 6px; }
                                  p { margin: 0 0 10px 0; }
                                  table { width: 100%; border-collapse: collapse; }
                                  td, th { vertical-align: top; }
                                  .footer { margin-top: 18px; padding-top: 12px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 10px; }
                                </style>
                              </head>
                              <body>
                                <div class="page">
                                  <div class="doc">
                                    ${
                                      isBrandedDoc
                                        ? `${previewDocHtml}`
                                        : `
                                          <div class="letterhead">
                                            <div>
                                              <div class="brand">${companyName}</div>
                                              <div class="sub">Dokumen perusahaan • ERP Livinova</div>
                                            </div>
                                            <div class="meta">
                                              <div class="label">Dicetak pada</div>
                                              <div class="value">${printedAt}</div>
                                            </div>
                                          </div>
                                          <div class="content">
                                            ${previewDocHtml}
                                          </div>
                                          <div class="footer">
                                            Dokumen ini dihasilkan otomatis oleh sistem. Harap verifikasi data sebelum ditandatangani.
                                          </div>
                                        `
                                    }
                                  </div>
                                </div>
                              </body>
                            </html>
                          `);
                          win.document.title = "";
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
                ) : modalType === "renew" ? (
                  <>
                    <Button
                      variant="ghost"
                      className="flex-1 h-12 sm:h-14 rounded-2xl text-slate-400 font-black hover:bg-slate-50"
                      onClick={closeModal}
                    >
                      TUTUP
                    </Button>
                  </>
                ) : modalType === "customer-list" || modalType === "customer-detail" || modalType === "sale-detail" ? (
                  <>
                    <Button
                      variant="ghost"
                      className="flex-1 h-12 sm:h-14 rounded-2xl text-slate-400 font-black hover:bg-slate-50"
                      onClick={closeModal}
                    >
                      TUTUP
                    </Button>
                  </>
                ) : modalType === "payment-method" ? (
                  <>
                    <Button
                      variant="ghost"
                      className="flex-1 h-12 sm:h-14 rounded-2xl text-slate-400 font-black hover:bg-slate-50"
                      onClick={closeModal}
                    >
                      BATAL
                    </Button>
                    <Button
                      onClick={() => {
                        setPaymentMethod(paymentMethodDraft);
                        try {
                          window.localStorage.setItem("erp:tenant:paymentMethod", paymentMethodDraft);
                        } catch {}
                        toast.success("Metode pembayaran diperbarui");
                        closeModal();
                      }}
                      className="flex-1 h-12 sm:h-14 rounded-2xl bg-blue-600 text-white font-black hover:bg-blue-700 shadow-xl shadow-blue-500/20"
                    >
                      SIMPAN
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" className="flex-1 h-12 sm:h-14 rounded-2xl text-slate-400 font-black hover:bg-slate-50" onClick={closeModal}>BATAL</Button>
                    <Button 
                      disabled={createProject.isPending || createSales.isPending || createCustomer.isPending || createLead.isPending || createLeadActivity.isPending || createVendor.isPending || createVendorBill.isPending || createPurchaseOrder.isPending || createEmployee.isPending || createPayrollPeriod.isPending || createPayrollRun.isPending || payPayroll.isPending || payWithholding.isPending || createCommission.isPending || payCommission.isPending || payVendorBill.isPending || releaseRetention.isPending || createJournal.isPending || createUnit.isPending || updateConstruction.isPending || uploadDocument.isPending}
                      onClick={() => {
                        if (modalType === "project") createProject.mutate(projectData);
                        if (modalType === "sales") createSales.mutate(salesData);
                        if (modalType === "customer") createCustomer.mutate(customerData);
                        if (modalType === "lead") createLead.mutate(leadData);
                        if (modalType === "lead-activity") {
                          if (!selectedLeadId) {
                            toast.error("Lead belum dipilih");
                            return;
                          }
                          createLeadActivity.mutate({
                            leadId: selectedLeadId,
                            type: leadActivityData.type,
                            notes: leadActivityData.notes,
                            nextFollowUpAt: leadActivityData.nextFollowUpAt,
                          });
                        }
                        if (modalType === "vendor") createVendor.mutate(vendorData);
                        if (modalType === "vendor-bill") createVendorBill.mutate(vendorBillData);
                        if (modalType === "purchase-order") createPurchaseOrder.mutate(purchaseOrderData);
                        if (modalType === "employee") createEmployee.mutate(employeeData);
                        if (modalType === "payroll-period") createPayrollPeriod.mutate(payrollPeriodData);
                        if (modalType === "payroll-run") createPayrollRun.mutate(payrollRunData);
                        if (modalType === "payroll-pay") {
                          if (!selectedPayrollRunId) {
                            toast.error("Payroll belum dipilih");
                            return;
                          }
                          payPayroll.mutate({
                            runId: selectedPayrollRunId,
                            date: payrollPayData.date,
                            cashAccountCode: payrollPayData.cashAccountCode,
                            amount: payrollPayData.amount,
                            notes: payrollPayData.notes,
                          });
                        }
                        if (modalType === "withholding-pay") {
                          if (!selectedPayrollRunId) {
                            toast.error("Payroll belum dipilih");
                            return;
                          }
                          payWithholding.mutate({
                            runId: selectedPayrollRunId,
                            kind: withholdingKind,
                            date: withholdingPayData.date,
                            cashAccountCode: withholdingPayData.cashAccountCode,
                            amount: withholdingPayData.amount,
                            notes: withholdingPayData.notes,
                          });
                        }
                        if (modalType === "commission") createCommission.mutate(commissionData);
                        if (modalType === "commission-pay") {
                          if (!selectedCommissionId) {
                            toast.error("Insentif belum dipilih");
                            return;
                          }
                          payCommission.mutate({
                            id: selectedCommissionId,
                            date: commissionPayData.date,
                            cashAccountCode: commissionPayData.cashAccountCode,
                            notes: commissionPayData.notes,
                          });
                        }
                        if (modalType === "vendor-payment") {
                          if (!selectedBillId) {
                            toast.error("Invoice belum dipilih");
                            return;
                          }
                          if (paymentKind === "payment") {
                            payVendorBill.mutate({
                              billId: selectedBillId,
                              date: vendorPaymentData.date,
                              amount: vendorPaymentData.amount,
                              cashAccountCode: vendorPaymentData.cashAccountCode,
                              notes: vendorPaymentData.notes,
                            });
                            return;
                          }
                          releaseRetention.mutate({
                            billId: selectedBillId,
                            date: vendorPaymentData.date,
                            amount: vendorPaymentData.amount,
                            cashAccountCode: vendorPaymentData.cashAccountCode,
                            notes: vendorPaymentData.notes,
                          });
                        }
                        if (modalType === "journal") createJournal.mutate(journalData);
                        if (modalType === "unit") createUnit.mutate(unitData);
                        if (modalType === "construction") updateConstruction.mutate(constructionData);
                        if (modalType === "legal-upload") uploadDocument.mutate(legalData);
                      }}
                      className="flex-1 h-12 sm:h-14 rounded-2xl bg-blue-600 text-white font-black hover:bg-blue-700 shadow-xl shadow-blue-500/20 disabled:opacity-50"
                    >
                      {createProject.isPending || createSales.isPending || createCustomer.isPending || createLead.isPending || createLeadActivity.isPending || createVendor.isPending || createVendorBill.isPending || createPurchaseOrder.isPending || createEmployee.isPending || createPayrollPeriod.isPending || createPayrollRun.isPending || payPayroll.isPending || payWithholding.isPending || createCommission.isPending || payCommission.isPending || payVendorBill.isPending || releaseRetention.isPending || createJournal.isPending || createUnit.isPending || updateConstruction.isPending || uploadDocument.isPending ? "MENYIMPAN..." : "SIMPAN DATA"}
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
