/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { User, AccountHead, Transaction, OrgLevel, UserRole, HeadType, Asset, BankBalance, ChapterMaster, Member, ReportTab } from "./types";
import { loadDatabase, saveDatabase, resetToDefaults, CHAPTERS } from "./mockData";
import { ensureDoctorPrefix } from "./utils/formatters";
import { getChapterCode, getFinancialUnitName, getUserFinancialUnitId, isWritableFinancialUnit } from "./utils/financialUnits";
import { signOutSupabaseAuth } from "./services/supabaseService";
import { useSupabaseData } from "./context/SupabaseContext";
import Login from "./components/Login";
import TreasurerEntry from "./components/TreasurerEntry";
import AdminPanel from "./components/AdminPanel";
import Dashboard from "./components/Dashboard";
import Logo from "./components/Logo";
import {
  ShieldAlert,
  LogOut,
  Layers,
  Sparkles,
  RefreshCw,
  Award,
  Home,
  BarChart3,
  ChevronRight,
  ArrowLeft,
  Receipt,
  Users,
  Building,
  CreditCard,
  Briefcase,
  FileText,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  Landmark,
  Loader2,
} from "lucide-react";

export default function App() {
  const {
    loading: supabaseLoading,
    error: supabaseError,
    currentUser: authUser,
    setCurrentUser: setAuthUser,
    members: dbMembers,
    income: dbIncome,
    expenses: dbExpenses,
    fds: dbFDs,
    assets: dbAssets,
    loans: dbLoans,
    chapters: dbChapters,
    createMember: createSupabaseMember,
    createIncome: createSupabaseIncome,
    createExpense: createSupabaseExpense,
    createFD: createSupabaseFD,
    createAsset: createSupabaseAsset,
    createLoan: createSupabaseLoan,
    logout: logoutSupabase,
  } = useSupabaseData();

  // Database States
  const [db, setDb] = useState<{
    users: User[];
    accountHeads: AccountHead[];
    transactions: Transaction[];
    assets: Asset[];
    bankBalances: BankBalance[];
    chapterDirectory: ChapterMaster[];
    members: Member[];
  } | null>(null);

  // Active authenticated user
  const [currentUser, setCurrentUser] = useState<User | null>(authUser);

  useEffect(() => {
    if (authUser && !currentUser) {
      setCurrentUser(authUser);
    }
  }, [authUser]);

  // Merge live Supabase records into DB state
  useEffect(() => {
    const mappedTransactions: Transaction[] = [];

    dbIncome.forEach((item) => {
      mappedTransactions.push({
        id: `tx_inc_${item.slNo || (item as any).id || Date.now()}`,
        date: item.date,
        type: HeadType.Income,
        headId: item.accountsHead,
        headName: item.accountsHead,
        amount: item.paidAmount,
        paidAmount: item.paidAmount,
        offeredAmount: item.offeredAmount,
        balanceAmount: item.balanceAmount,
        voucherNumber: item.voucherNumber,
        paymentMode: (item.paymentMode as any) || "Bank",
        collectedBy: item.collectedBy,
        paidBy: item.collectedFrom,
        chapterId: item.chapterIdNo,
        chapterIdInput: item.chapterIdNo,
        chapterNameInput: item.chapterName,
        financialUnitId: item.chapterIdNo,
        description: item.remarksComments,
        remarks: item.remarksComments,
        createdBy: item.collectedBy,
        createdAt: item.date,
        slNo: item.slNo,
      });
    });

    dbExpenses.forEach((item) => {
      mappedTransactions.push({
        id: `tx_exp_${item.slNo || (item as any).id || Date.now()}`,
        date: item.date,
        type: HeadType.Expense,
        headId: item.accountsHead,
        headName: item.accountsHead,
        amount: item.paidAmount,
        payableAmount: item.payableAmount,
        paidAmount: item.paidAmount,
        balanceAmount: item.balanceAmount,
        voucherNumber: item.voucherNumber,
        paymentMode: (item.modeOfPayment as any) || "Cash",
        paidByExpense: item.paidBy,
        paidTo: item.paidTo,
        chapterId: item.chapterIdNumber,
        chapterIdInput: item.chapterIdNumber,
        chapterNameInput: item.chapterName,
        financialUnitId: item.chapterIdNumber,
        description: item.remarksComments,
        remarks: item.remarksComments,
        createdBy: item.paidBy,
        createdAt: item.date,
        slNo: item.slNo,
      });
    });

    dbLoans.forEach((item) => {
      mappedTransactions.push({
        id: `tx_loan_${item.slNo || (item as any).id || Date.now()}`,
        date: item.date,
        type: HeadType.Loan,
        headId: "loan_advances",
        headName: "Loans & Advances",
        amount: item.amount,
        amountReturned: (item.amount || 0) - (item.loanBalance || 0),
        loanBalance: item.loanBalance,
        loanReturnDate: item.loanReturnDate,
        loanReturnedDate: item.loanReturnedDate,
        voucherNumber: item.voucherNumber,
        repaymentPaymentMode: (item.modeOfPayment as any) || "Bank",
        paymentMode: (item.modeOfPayment as any) || "Bank",
        paidToCategory: (item.paidTo || "").toLowerCase().includes("member") ? "member" : "chapter",
        paidToId: item.paidToId,
        paidToName: item.paidTo,
        paidTo: item.paidTo,
        particulars: item.particulars,
        chapterId: item.chapterIdNo,
        chapterIdInput: item.chapterIdNo,
        chapterNameInput: item.chapterName,
        financialUnitId: item.chapterIdNo,
        description: item.remarksComments,
        remarks: item.remarksComments,
        createdBy: item.paidTo,
        createdAt: item.date,
        slNo: item.slNo,
      });
    });

    const mappedAssets: Asset[] = dbAssets.map((item) => ({
      id: `ast_${item.slNo || item.assetNumberAssetId || Date.now()}`,
      slNo: item.slNo || 1,
      date: item.date,
      chapterIdInput: item.chapterIdNo,
      chapterNameInput: item.chapterName,
      financialUnitId: item.chapterIdNo,
      assetId: item.assetNumberAssetId,
      assetName: item.assetName,
      purchaseDate: item.assetPurchaseDate,
      quantity: 1,
      assetValue: item.assetValueInr,
      totalValue: item.assetValueInr,
      paymentMode: "Bank",
      category: item.assetCategory,
      assetLife: item.assetLife,
      custodianName: item.custodianName,
      depreciationAmount: item.depreciationAmount,
      netAmount: item.netAmount,
      remarks: item.remarks,
    }));

    const mappedFDs: BankBalance[] = dbFDs.map((item) => ({
      id: `fd_${item.slNo || item.chapterIdNo || Date.now()}`,
      slNo: item.slNo || 1,
      date: item.date,
      chapterIdInput: item.chapterIdNo,
      chapterNameInput: item.chapterName,
      financialUnitId: item.chapterIdNo,
      amountType: "FD",
      amount: item.amount,
      maturityDate: item.fdMaturityDate,
      bankName: item.bankName,
      bankBranch: item.bankBranch,
      bankAccountNumber: item.bankAccountNumber,
      bankAddress: item.bankBranchAddress,
      bankContactNumber: item.bankContactNumber,
      remarks: item.remarksComments,
    }));

    const mappedChapters: ChapterMaster[] = dbChapters.map((item) => ({
      id: item.chapterId,
      slNo: item.slNo || 1,
      chapterName: item.chapterName,
      entityType: "Local Chapter",
      state: item.state,
      district: item.district,
      chapterAddress: item.chapterAddress,
      presidentId: item.chapterPresidentIdNo || "",
      presidentName: item.chapterPresidentName || "",
      vpId: item.chapterVpIdNo || "",
      vpName: item.chapterVpName || "",
      secretaryId: item.chapterGenSecretaryIdNo || "",
      secretaryName: item.chapterGenSecretaryName || "",
      treasurerId: item.chapterTreasurerIdNo || "",
      treasurerName: item.chapterTreasurerName || "",
      contactNo: item.chapterContactNo || "",
      whatsappNo: item.chapterContactNo || "",
      officeNo: item.chapterContactNo || "",
      email: "",
      formationDate: "2024-01-01",
    }));

    const mappedMembers: Member[] = dbMembers.map((item) => ({
      id: item.memberIdNo,
      slNo: item.slNo || 1,
      memberId: item.memberIdNo,
      memberName: item.memberName,
      chapterIdInput: item.chapterIdNo,
      chapterNameInput: item.chapterName,
      qualification: item.qualificationsList && item.qualificationsList.length > 0
        ? item.qualificationsList.map((q) => q.degree).join(", ")
        : item.qualification,
      qualificationsList: item.qualificationsList,
      membershipType: (item.membershipType as any) || "General",
      membershipDate: item.membershipDate || "2024-01-01",
      membershipStatus: (item.membershipStatus as any) || "Active",
      mobileNumber: item.mobileNo || "",
      whatsappNumber: item.whatsappNo || item.mobileNo || "",
      email: item.emailAddress || "",
      clinicNumber: item.contactNumberLandline || "",
      gender: item.gender,
      dob: item.dob,
      bloodGroup: item.bloodGroup,
      specialization: item.specialization,
      clinicAddress: item.clinicAddress,
      residentialAddress: item.residentialAddress,
      associationRole: item.designation,
    }));

    setDb((prev) => {
      const base = prev || loadDatabase();
      return {
        users: base.users,
        accountHeads: base.accountHeads,
        transactions: mappedTransactions.length > 0 ? mappedTransactions : base.transactions,
        assets: mappedAssets.length > 0 ? mappedAssets : base.assets,
        bankBalances: mappedFDs.length > 0 ? mappedFDs : base.bankBalances,
        chapterDirectory: mappedChapters.length > 0 ? mappedChapters : base.chapterDirectory,
        members: mappedMembers.length > 0 ? mappedMembers : base.members,
      };
    });
  }, [dbIncome, dbExpenses, dbLoans, dbFDs, dbAssets, dbChapters, dbMembers]);

  // Parse state from URL hash or path parameters
  const parseStateFromUrl = () => {
    const hash = window.location.hash.replace(/^#\/?/, "");
    const params = new URLSearchParams(hash.includes("?") ? hash.split("?")[1] : window.location.search);
    const viewParam = hash.split("?")[0] || params.get("view") || "home";
    const tabParam = params.get("tab") as ReportTab | null;
    const wizardParam = params.get("wizard");
    const sectionParam = params.get("section");

    const validViews: ("login" | "home" | "reports" | "admin")[] = ["login", "home", "reports", "admin"];
    const view = validViews.includes(viewParam as any) ? (viewParam as "login" | "home" | "reports" | "admin") : "home";

    const validTabs: ReportTab[] = [
      "heads", "payments", "receipts", "loans", "members",
      "entity_types", "assets", "bank_balances", "chapters", "monthly", "yearly", "raw"
    ];
    const tab = tabParam && validTabs.includes(tabParam) ? tabParam : "payments";

    const validSections: ("summary" | "detailed" | "specific" | null)[] = ["summary", "detailed", "specific"];
    const section = sectionParam && validSections.includes(sectionParam as any) ? (sectionParam as "summary" | "detailed" | "specific") : null;

    return { view, tab, wizard: wizardParam, section };
  };

  const initialState = parseStateFromUrl();

  // View state: "login" | "home" | "reports" | "admin"
  const [currentView, setCurrentView] = useState<"login" | "home" | "reports" | "admin">(initialState.view);

  // Selected report tab when navigating to reports
  const [activeReportTab, setActiveReportTab] = useState<ReportTab>(initialState.tab);

  // Active report section state ("summary" | "detailed" | "specific" | null)
  const [activeReportSection, setActiveReportSection] = useState<"summary" | "detailed" | "specific" | null>(initialState.section);

  // Report wizard overlay state synced with URL
  const [showReportWizard, setShowReportWizard] = useState<boolean>(initialState.view === "reports" && initialState.wizard === "true");

  // Home wizard state synced with URL
  const [homeWizard, setHomeWizard] = useState<string | null>(initialState.view === "home" ? initialState.wizard : null);

  // Active transaction being edited
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Load database on mount
  useEffect(() => {
    const loaded = loadDatabase();
    setDb(loaded);
  }, []);

  // Sync window location with app state helper
  const navigateTo = (
    view: "login" | "home" | "reports" | "admin",
    tab?: ReportTab,
    wizard?: boolean | string | null,
    section?: "summary" | "detailed" | "specific" | null,
    replace = false
  ) => {
    const targetTab = tab || (view === "reports" ? activeReportTab : "payments");
    const targetSection = section !== undefined ? section : (view === "reports" && section === null ? null : (view === "reports" && tab ? activeReportSection : null));

    setCurrentView(view);
    if (tab) setActiveReportTab(targetTab);
    if (view === "reports") setActiveReportSection(targetSection);

    let targetReportWizard = showReportWizard;
    let targetHomeWizard = homeWizard;

    if (view === "reports") {
      targetReportWizard = typeof wizard === "boolean" ? wizard : (wizard === "true");
      setShowReportWizard(targetReportWizard);
      setHomeWizard(null);
    } else if (view === "home") {
      targetHomeWizard = typeof wizard === "string" ? wizard : null;
      setHomeWizard(targetHomeWizard);
      setShowReportWizard(false);
    } else {
      setShowReportWizard(false);
      setHomeWizard(null);
    }

    let newHash = `#/${view}`;
    if (view === "reports") {
      const params = new URLSearchParams();
      if (targetSection) params.set("section", targetSection);
      if (targetReportWizard) params.set("wizard", "true");
      if (targetTab && targetTab !== "payments") params.set("tab", targetTab);
      const q = params.toString();
      newHash = q ? `#/reports?${q}` : `#/reports`;
    } else if (view === "home") {
      if (targetHomeWizard) {
        newHash = `#/home?wizard=${targetHomeWizard}`;
      }
    }

    if (window.location.hash !== newHash) {
      if (replace) {
        window.history.replaceState({ view, tab: targetTab, wizard, section: targetSection }, "", newHash);
      } else {
        window.history.pushState({ view, tab: targetTab, wizard, section: targetSection }, "", newHash);
      }
    }
  };

  // Sync history state on popstate (browser back/forward button clicks)
  useEffect(() => {
    const handlePopState = () => {
      const parsed = parseStateFromUrl();
      setCurrentView(parsed.view);
      setActiveReportTab(parsed.tab);
      setActiveReportSection(parsed.section);
      setShowReportWizard(parsed.view === "reports" && parsed.wizard === "true");
      setHomeWizard(parsed.view === "home" ? parsed.wizard : null);
    };

    window.addEventListener("popstate", handlePopState);

    // Set initial history state if hash isn't set yet or if user is not logged in
    if (!currentUser) {
      if (window.location.hash !== "#/login") {
        window.history.replaceState({ view: "login" }, "", "#/login");
      }
    } else if (!window.location.hash) {
      window.history.replaceState(
        { view: initialState.view, tab: initialState.tab, wizard: initialState.wizard, section: initialState.section },
        "",
        `#/${initialState.view}?view=${initialState.view}&tab=${initialState.tab}`
      );
    }

    return () => window.removeEventListener("popstate", handlePopState);
  }, [currentUser]);

  // Sync to database helper
  const syncDatabase = (updated: {
    users: User[];
    accountHeads: AccountHead[];
    transactions: Transaction[];
    assets: Asset[];
    bankBalances: BankBalance[];
    chapterDirectory: ChapterMaster[];
    members: Member[];
  }) => {
    setDb(updated);
    saveDatabase(updated);
  };

  // --- Handlers ---
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setEditingTransaction(null);
    navigateTo("home", undefined, null, true);
  };

  const handleLogout = async () => {
    try {
      await signOutSupabaseAuth();
    } catch (err) {
      console.warn("Supabase sign out error:", err);
    }
    setCurrentUser(null);
    setEditingTransaction(null);
    navigateTo("login", undefined, null, true);
  };

  const handleOpenReports = (tab?: ReportTab, section?: "summary" | "detailed" | "specific" | null) => {
    navigateTo("reports", tab || activeReportTab, false, section !== undefined ? section : (tab ? "detailed" : null));
  };

  // Manual entries must carry the official chapter code (e.g. KL-EK-CO01) like seeded rows do,
  // not the internal slug ("cochin"). Resolve it from the chapter directory by name.
  const resolveChapterCode = (financialUnitId: string) => getChapterCode(financialUnitId);

  // 1. Record Transaction (Local Treasurer Mode)
  const handleAddTransaction = (
    newTx: Omit<Transaction, "id" | "createdBy" | "createdAt" | "chapterId" | "headName">
  ) => {
    if (!db || !currentUser) return;
    const financialUnitId = getUserFinancialUnitId(currentUser);
    if (!isWritableFinancialUnit(currentUser, financialUnitId)) return;

    const id = `tx_${Date.now()}`;
    const selectedHead = db.accountHeads.find((h) => h.id === newTx.headId);

    const fullTx: Transaction = {
      ...newTx,
      id,
      headName: newTx.type === HeadType.Loan ? "Loan" : (selectedHead ? selectedHead.name : ""),
      chapterId: financialUnitId,
      financialUnitId,
      chapterIdInput: resolveChapterCode(financialUnitId),
      chapterNameInput: getFinancialUnitName(financialUnitId),
      createdBy: currentUser.username,
      createdAt: new Date().toISOString(),
    };

    const updatedTxs = [fullTx, ...db.transactions];
    syncDatabase({ ...db, transactions: updatedTxs });

    // Sync to Supabase in background
    if (newTx.type === HeadType.Income) {
      createSupabaseIncome({
        chapterIdNo: resolveChapterCode(financialUnitId),
        chapterName: getFinancialUnitName(financialUnitId),
        date: newTx.date,
        voucherNumber: newTx.voucherNumber,
        collectedBy: currentUser.name || currentUser.username,
        collectedFrom: newTx.paidBy || "",
        accountsHead: selectedHead ? selectedHead.name : (newTx.headName || "General"),
        offeredAmount: newTx.offeredAmount || newTx.amount,
        paidAmount: newTx.paidAmount || newTx.amount,
        balanceAmount: newTx.balanceAmount || 0,
        paymentMode: newTx.paymentMode || "Bank",
        remarksComments: newTx.description || newTx.remarks || "",
      }).catch((err) => console.warn("Supabase Income sync error:", err));
    } else if (newTx.type === HeadType.Expense) {
      createSupabaseExpense({
        chapterIdNumber: resolveChapterCode(financialUnitId),
        chapterName: getFinancialUnitName(financialUnitId),
        date: newTx.date,
        voucherNumber: newTx.voucherNumber,
        paidBy: newTx.paidByExpense || currentUser.name || currentUser.username,
        paidTo: newTx.paidTo || "",
        accountsHead: selectedHead ? selectedHead.name : (newTx.headName || "General"),
        payableAmount: newTx.payableAmount || newTx.amount,
        paidAmount: newTx.paidAmount || newTx.amount,
        balanceAmount: newTx.balanceAmount || 0,
        modeOfPayment: newTx.paymentMode || "Cash",
        remarksComments: newTx.description || newTx.remarks || "",
      }).catch((err) => console.warn("Supabase Expense sync error:", err));
    } else if (newTx.type === HeadType.Loan) {
      createSupabaseLoan({
        chapterIdNo: resolveChapterCode(financialUnitId),
        chapterName: getFinancialUnitName(financialUnitId),
        date: newTx.date,
        voucherNumber: newTx.voucherNumber,
        paidTo: newTx.paidTo || newTx.paidToName || ((newTx.paidToCategory || "member") === "member" ? "Member" : "Chapter"),
        paidToId: newTx.paidToId || "",
        particulars: newTx.particulars || newTx.description || "Loan Advance",
        amount: newTx.amount,
        transactionType: "Loan Issue",
        loanBalance: newTx.loanBalance ?? newTx.amount,
        loanReturnDate: newTx.loanReturnDate || "",
        loanReturnedDate: newTx.loanReturnedDate || "",
        modeOfPayment: newTx.repaymentPaymentMode || newTx.paymentMode || "Bank",
        remarksComments: newTx.description || newTx.remarks || "",
      }).catch((err) => console.warn("Supabase Loan sync error:", err));
    }
  };

  // 2. Update Transaction (Edit Mode)
  const handleUpdateTransaction = (updatedTx: Transaction) => {
    if (!db) return;

    const updatedTxs = db.transactions.map((tx) =>
      tx.id === updatedTx.id ? updatedTx : tx
    );

    syncDatabase({ ...db, transactions: updatedTxs });
    setEditingTransaction(null);
  };

  // 3. Delete Transaction
  const handleDeleteTransaction = (id: string) => {
    if (!db) return;

    const updatedTxs = db.transactions.filter((tx) => tx.id !== id);
    syncDatabase({ ...db, transactions: updatedTxs });

    if (editingTransaction?.id === id) {
      setEditingTransaction(null);
    }
  };

  // 4. Update Account Heads (Add/Edit/Enable/Disable Heads)
  const handleUpdateAccountHeads = (updatedHeads: AccountHead[]) => {
    if (!db) return;
    syncDatabase({ ...db, accountHeads: updatedHeads });
  };

  // 5. Update Users (e.g. Password Reset)
  const handleUpdateUsers = (updatedUsers: User[]) => {
    if (!db) return;
    syncDatabase({ ...db, users: updatedUsers });
  };

  // 5.1 Add Member
  const handleAddMember = (newMember: Omit<Member, "id" | "slNo">) => {
    if (!db) return;
    const id = `mem_${Date.now()}`;
    const slNo = db.members.length + 1;
    const formattedName = ensureDoctorPrefix(newMember.memberName);
    const fullMember: Member = { ...newMember, memberName: formattedName, id, slNo };
    syncDatabase({ ...db, members: [fullMember, ...db.members] });

    // Sync to Supabase in background
    createSupabaseMember({
      memberIdNo: newMember.memberId || `MEM-${Date.now()}`,
      memberName: formattedName,
      chapterIdNo: newMember.chapterIdInput || "",
      chapterName: newMember.chapterNameInput || "",
      qualification: newMember.qualification || "",
      qualificationsList: newMember.qualificationsList || [],
      membershipType: newMember.membershipType || "General",
      membershipDate: newMember.membershipDate || new Date().toISOString().slice(0, 10),
      membershipStatus: newMember.membershipStatus || "Active",
      mobileNo: newMember.mobileNumber || "",
      whatsappNo: newMember.whatsappNumber || "",
      emailAddress: newMember.email || "",
      contactNumberLandline: newMember.clinicNumber || "",
      gender: newMember.gender,
      dob: newMember.dob,
      bloodGroup: newMember.bloodGroup,
      specialization: newMember.specialization,
      clinicAddress: newMember.clinicAddress,
      residentialAddress: newMember.residentialAddress,
      designation: newMember.associationRole,
    }).catch((err) => console.warn("Supabase Member sync error:", err));
  };

  // 5.2 Add Asset
  const handleAddAsset = (newAsset: Omit<Asset, "id" | "slNo">) => {
    if (!db || !currentUser) return;
    const financialUnitId = getUserFinancialUnitId(currentUser);
    if (!isWritableFinancialUnit(currentUser, financialUnitId)) return;
    const id = `ast_${Date.now()}`;
    const slNo = db.assets.length + 1;
    const fullAsset: Asset = { ...newAsset, id, slNo, financialUnitId, chapterIdInput: resolveChapterCode(financialUnitId), chapterNameInput: getFinancialUnitName(financialUnitId) };

    // An asset purchase is real money leaving the chapter, so mirror it as a capital
    // expense. Without this the Asset Register and the cash/bank totals disagree.
    const purchaseHead = db.accountHeads.find((h) => h.id === "exp_asset_purchase");
    const expenseTx: Transaction = {
      id: `tx_${Date.now()}_asset`,
      date: newAsset.date,
      type: HeadType.Expense,
      headId: "exp_asset_purchase",
      headName: purchaseHead ? purchaseHead.name : "Asset purchase (Capital)",
      amount: newAsset.totalValue,
      payableAmount: newAsset.totalValue,
      paidAmount: newAsset.totalValue,
      balanceAmount: 0,
      paymentMode: newAsset.paymentMode,
      paidByExpense: currentUser.name,
      paidTo: newAsset.assetName,
      chapterId: financialUnitId,
      financialUnitId,
      chapterIdInput: resolveChapterCode(financialUnitId),
      chapterNameInput: getFinancialUnitName(financialUnitId),
      assetRef: newAsset.assetId,
      description: `Asset purchase: ${newAsset.assetName} (${newAsset.assetId})`,
      remarks: newAsset.remarks,
      createdBy: currentUser.username,
      createdAt: new Date().toISOString(),
    };

    syncDatabase({
      ...db,
      assets: [fullAsset, ...db.assets],
      transactions: [expenseTx, ...db.transactions],
    });

    // Sync to Supabase in background
    createSupabaseAsset({
      date: newAsset.date,
      chapterIdNo: resolveChapterCode(financialUnitId),
      chapterName: getFinancialUnitName(financialUnitId),
      assetNumberAssetId: newAsset.assetId,
      assetName: newAsset.assetName,
      assetPurchaseDate: newAsset.purchaseDate,
      assetValueInr: newAsset.totalValue || newAsset.assetValue,
      assetCategory: newAsset.category || "Equipment",
      assetLife: newAsset.assetLife || "5 Years",
      custodianName: newAsset.custodianName || currentUser.name,
      depreciationAmount: newAsset.depreciationAmount || 0,
      netAmount: newAsset.netAmount || newAsset.totalValue,
      remarks: newAsset.remarks || "",
    }).catch((err) => console.warn("Supabase Asset sync error:", err));
  };

  // 5.3 Add FD Record
  //
  // The principal is not income or expense — it is a transfer from the bank account
  // into the FD, so recording an FD never touches the ledger. Interest is no longer
  // projected or auto-posted either: the treasurer logs each interest credit by hand
  // as a Bank interest entry, which lands in the ledger as Bank income.
  const handleAddBankBalance = (newBalance: Omit<BankBalance, "id" | "slNo">) => {
    if (!db || !currentUser) return;
    const financialUnitId = getUserFinancialUnitId(currentUser);
    if (!isWritableFinancialUnit(currentUser, financialUnitId)) return;
    const id = `bal_${Date.now()}`;
    const slNo = db.bankBalances.length + 1;
    const fullBalance: BankBalance = { ...newBalance, id, slNo, financialUnitId, chapterIdInput: resolveChapterCode(financialUnitId), chapterNameInput: getFinancialUnitName(financialUnitId) };

    syncDatabase({
      ...db,
      bankBalances: [fullBalance, ...db.bankBalances],
    });

    // Sync to Supabase in background
    createSupabaseFD({
      chapterIdNo: resolveChapterCode(financialUnitId),
      chapterName: getFinancialUnitName(financialUnitId),
      date: newBalance.date,
      bankName: newBalance.bankName || "",
      bankBranch: newBalance.bankBranch || "",
      bankAccountNumber: newBalance.bankAccountNumber || "",
      bankBranchAddress: newBalance.bankAddress || "",
      bankContactNumber: newBalance.bankContactNumber || "",
      amount: newBalance.amount,
      fdMaturityDate: newBalance.maturityDate || "",
      remarksComments: newBalance.remarks || "",
    }).catch((err) => console.warn("Supabase FD sync error:", err));
  };

  // 6. Reset Database to Default Demo State
  const handleResetDatabase = () => {
    const defaults = resetToDefaults();
    setDb(defaults);
    if (currentUser) {
      const activeMatch = defaults.users.find((u) => u.username === currentUser.username);
      if (activeMatch) {
        setCurrentUser(activeMatch);
      } else {
        setCurrentUser(defaults.users[0]);
      }
    }
  };

  // 7. Import Database JSON
  const handleImportDatabase = (importedData: any): boolean => {
    if (
      importedData &&
      Array.isArray(importedData.users) &&
      Array.isArray(importedData.accountHeads) &&
      Array.isArray(importedData.transactions)
    ) {
      syncDatabase({
        users: importedData.users,
        accountHeads: importedData.accountHeads,
        transactions: importedData.transactions,
        assets: Array.isArray(importedData.assets) ? importedData.assets : (db?.assets || []),
        bankBalances: Array.isArray(importedData.bankBalances) ? importedData.bankBalances : (db?.bankBalances || []),
        chapterDirectory: Array.isArray(importedData.chapterDirectory) ? importedData.chapterDirectory : (db?.chapterDirectory || []),
        members: Array.isArray(importedData.members) ? importedData.members : (db?.members || []),
      });
      return true;
    }
    return false;
  };

  // 8. Export Database JSON
  const handleExportDatabase = () => {
    if (!db) return;
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(db, null, 2)
    )}`;
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", jsonString);
    downloadAnchor.setAttribute("download", `IHMA_FinApp_DB_Backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
  };

  // Loading Guard
  if (!db) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center">
        <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
        <p className="mt-4 text-sm font-semibold text-slate-600">Initializing IHMA FinApp database...</p>
      </div>
    );
  }

  // Auth Guard
  if (!currentUser) {
    return (
      <Login onLoginSuccess={handleLogin} />
    );
  }

  const isLocalTreasurer = currentUser.role === UserRole.Treasurer;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Main Header */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex flex-row items-center justify-between gap-3">
          {/* Logo Brand */}
          <div className="flex items-center gap-2">
            <Logo className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl">
              <div className="h-8 w-8 sm:h-10 sm:w-10 bg-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center border border-blue-500 shadow-sm shrink-0">
                <Award className="h-4.5 w-4.5 sm:h-5.5 sm:w-5.5 text-white" />
              </div>
            </Logo>
            <div>
              <h1 className="font-display font-semibold text-base sm:text-xl text-slate-900 tracking-tight leading-none">
                IHMA FinApp
              </h1>
              {supabaseLoading && (
                <span className="inline-flex items-center gap-1 text-[10px] text-blue-600 font-bold mt-0.5 animate-pulse">
                  <Loader2 className="h-2.5 w-2.5 animate-spin" /> Syncing data...
                </span>
              )}
            </div>
          </div>

          {/* Center View Navigation Tabs */}
          <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/60">
            <button
              onClick={() => navigateTo("home")}
              id="nav-home-tab"
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                currentView === "home"
                  ? "bg-white text-blue-900 shadow-xs border border-slate-200/80 font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Home className="h-3.5 w-3.5" />
              <span>Home</span>
            </button>

            <button
              onClick={() => navigateTo("reports", "payments", false, null)}
              id="nav-reports-tab"
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                currentView === "reports"
                  ? "bg-white text-blue-900 shadow-xs border border-slate-200/80 font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5 text-teal-600" />
              <span className="hidden xs:inline sm:inline">Reports</span>
              <span className="xs:hidden sm:hidden">Reports</span>
            </button>

            {currentUser.role === UserRole.Admin && (
              <button
                onClick={() => navigateTo("admin")}
                id="nav-admin-tab"
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  currentView === "admin"
                    ? "bg-white text-blue-900 shadow-xs border border-slate-200/80 font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                <span className="hidden sm:inline">Admin</span>
              </button>
            )}
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            id="logout-button"
            className="px-2.5 sm:px-3 py-1.5 bg-white text-slate-600 hover:text-red-700 hover:bg-red-50 border border-slate-200 rounded-xl cursor-pointer transition-all shadow-xs flex items-center gap-1.5 text-xs font-semibold shrink-0"
            title="Sign Out of Portal"
          >
            <LogOut className="h-4 w-4 text-slate-500 group-hover:text-red-600" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* ---------------- VIEW 1: HOME (MINIMAL ACTIONS ONLY) ---------------- */}
        {currentView === "home" && (
          <div className="space-y-6 animate-fadeIn">
            {isLocalTreasurer ? (
              /* Treasurers / Logging Roles: Show Logging Action Buttons + View Reports & Summaries */
              <TreasurerEntry
                currentUser={currentUser}
                accountHeads={db.accountHeads}
                membersList={db.members}
                chapterDirectory={db.chapterDirectory}
                transactions={db.transactions}
                assetsList={db.assets}
                onAddTransaction={handleAddTransaction}
                onUpdateTransaction={handleUpdateTransaction}
                editingTransaction={editingTransaction}
                onCancelEdit={() => setEditingTransaction(null)}
                onAddMember={handleAddMember}
                onAddAsset={handleAddAsset}
                onAddBankBalance={handleAddBankBalance}
                onOpenReports={handleOpenReports}
                activeHomeWizard={homeWizard}
                onHomeWizardChange={(w) => navigateTo("home", undefined, w)}
              />
            ) : (
              /* Non-Treasurers (President, Secretary, Auditor, Member): Show View Buttons Only */
              <div className="w-full max-w-4xl mx-auto space-y-6">
                {/* Hero Greeting Card */}
                <div className="bg-gradient-to-br from-[#0F6E5D] to-[#0B5548] text-white rounded-2xl p-5 sm:p-6 shadow-md border border-teal-700/30">
                  <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4">
                    {/* Left Side: Chapter Name & Chapter ID */}
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold font-display text-white">
                        {CHAPTERS.find((c) => c.id === currentUser.nodeId)?.name || db?.chapterDirectory?.find((c) => c.id === currentUser.nodeId || c.chapterName === currentUser.nodeId)?.chapterName || getFinancialUnitName(getUserFinancialUnitId(currentUser))}
                      </h2>
                      <span className="text-xs font-semibold text-teal-200/90 block mt-0.5 font-mono">
                        ID: {getChapterCode(getUserFinancialUnitId(currentUser)) || currentUser.nodeId || "KL-EK-CO01"}
                      </span>
                    </div>

                    {/* Right Side: Logged in as Name & Role */}
                    <div className="sm:text-right bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/20 shrink-0 sm:justify-self-end w-full sm:w-auto">
                      <span className="text-[10px] text-teal-200 uppercase tracking-widest font-bold block">
                        Logged by
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-white block">
                        {currentUser.name}
                      </span>
                      <div className="flex items-center sm:justify-end gap-1.5 mt-0.5">
                        <span className="text-[10px] text-teal-200/90 font-medium bg-white/10 px-2 py-0.5 rounded-full inline-block">
                          {currentUser.role}
                        </span>
                        <span className="text-[10px] text-teal-100 font-semibold bg-teal-900/40 border border-teal-400/30 px-2 py-0.5 rounded-full inline-block uppercase">
                          Read Only
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Highlight Button: View Reports & Summaries */}
                <div className="space-y-4">
                  <button
                    onClick={() => handleOpenReports()}
                    id="non-treasurer-view-reports-button"
                    className="group bg-gradient-to-br from-[#0F6E5D] to-[#0B5548] text-white p-5 rounded-2xl shadow-md border border-teal-600/50 hover:shadow-lg hover:border-teal-400 transition-all text-left flex flex-col justify-between cursor-pointer w-full"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
                      <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/25 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <BarChart3 className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-white font-display">
                              Financial Reports
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="px-4 py-2 bg-white text-[#0F6E5D] font-bold text-xs rounded-xl shadow-xs hover:bg-teal-50 transition-all flex items-center gap-2 shrink-0">
                        <span>Open Reports Page</span>
                        <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </button>

                  {/* Report Sheet Shortcut Buttons Grid */}
                  <div className="pt-2">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-1">
                      Quick Report Sheet Shortcuts
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {/* Payments */}
                      <button
                        onClick={() => handleOpenReports("payments")}
                        className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-teal-500 hover:shadow-xs transition-all text-left flex items-center justify-between cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                            <ArrowUpRight className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-slate-900 group-hover:text-teal-800 transition-colors">
                              Payments Summary
                            </h4>
                            <p className="text-[11px] text-slate-500">Expenditure & Vouchers</p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-1 transition-transform" />
                      </button>

                      {/* Receipts */}
                      <button
                        onClick={() => handleOpenReports("receipts")}
                        className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-teal-500 hover:shadow-xs transition-all text-left flex items-center justify-between cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                            <ArrowDownRight className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-slate-900 group-hover:text-teal-800 transition-colors">
                              Receipts Summary
                            </h4>
                            <p className="text-[11px] text-slate-500">Income & Subscriptions</p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-1 transition-transform" />
                      </button>

                      {/* Loans */}
                      <button
                        onClick={() => handleOpenReports("loans")}
                        className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-teal-500 hover:shadow-xs transition-all text-left flex items-center justify-between cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                            <Briefcase className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-slate-900 group-hover:text-teal-800 transition-colors">
                              Internal Loans
                            </h4>
                            <p className="text-[11px] text-slate-500">Internal Loan Registry & Balances</p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-1 transition-transform" />
                      </button>

                      {/* Members */}
                      <button
                        onClick={() => handleOpenReports("members")}
                        className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-teal-500 hover:shadow-xs transition-all text-left flex items-center justify-between cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                            <Users className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-slate-900 group-hover:text-teal-800 transition-colors">
                              Member Directory
                            </h4>
                            <p className="text-[11px] text-slate-500">Doctor Profiles & Tiers</p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-1 transition-transform" />
                      </button>

                      {/* Assets */}
                      <button
                        onClick={() => handleOpenReports("assets")}
                        className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-teal-500 hover:shadow-xs transition-all text-left flex items-center justify-between cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
                            <Building2 className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-slate-900 group-hover:text-teal-800 transition-colors">
                              Asset Register
                            </h4>
                            <p className="text-[11px] text-slate-500">Capital Equipment & Values</p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-1 transition-transform" />
                      </button>

                      {/* FD Register */}
                      <button
                        onClick={() => handleOpenReports("bank_balances")}
                        className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-teal-500 hover:shadow-xs transition-all text-left flex items-center justify-between cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                            <Landmark className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-slate-900 group-hover:text-teal-800 transition-colors">
                              FD & Bank
                            </h4>
                            <p className="text-[11px] text-slate-500">Fixed Deposits</p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---------------- VIEW 2: REPORTS & SUMMARIES PAGE ---------------- */}
        {currentView === "reports" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Dashboard Component containing all filters, charts, metrics, and 11 report sheets */}
            <Dashboard
              currentUser={currentUser}
              accountHeads={db.accountHeads}
              transactions={db.transactions}
              assets={db.assets}
              bankBalances={db.bankBalances}
              chapterDirectory={db.chapterDirectory}
              members={db.members}
              loading={supabaseLoading}
              onDeleteTransaction={handleDeleteTransaction}
              onEditTransaction={(tx) => {
                setEditingTransaction(tx);
                let wizardType = "income";
                if (tx.type === HeadType.Expense) wizardType = "expense";
                if (tx.type === HeadType.Loan) wizardType = "loan";
                navigateTo("home", undefined, wizardType);
              }}
              onUpdateTransaction={handleUpdateTransaction}
              initialReportTab={activeReportTab}
              onReportTabChange={(tab) => navigateTo("reports", tab, showReportWizard, activeReportSection)}
              activeReportSection={activeReportSection}
              onReportSectionChange={(sec) => navigateTo("reports", activeReportTab, showReportWizard, sec)}
              onReportWizardChange={(wizard) => navigateTo("reports", activeReportTab, wizard, activeReportSection)}
              showReportWizard={showReportWizard}
              onBackToHome={() => navigateTo("home")}
            />
          </div>
        )}

        {/* ---------------- VIEW 3: ADMIN PANEL ---------------- */}
        {currentView === "admin" && currentUser.role === UserRole.Admin && (
          <div className="space-y-6 animate-fadeIn">
            {/* Top Back Navigation Bar */}
            <div className="flex items-center justify-between bg-white px-4 py-3 rounded-2xl border border-slate-200 shadow-xs">
              <button
                onClick={() => navigateTo("home")}
                className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-all cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Home</span>
              </button>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                  IHMA Control Center
                </span>
                <span className="text-sm font-black text-slate-800">
                  Global System Admin
                </span>
              </div>
            </div>

            <AdminPanel
              currentUser={currentUser}
              accountHeads={db.accountHeads}
              onUpdateAccountHeads={handleUpdateAccountHeads}
              users={db.users}
              onUpdateUsers={handleUpdateUsers}
              onResetDatabase={handleResetDatabase}
              onImportDatabase={handleImportDatabase}
              onExportDatabase={handleExportDatabase}
            />
          </div>
        )}
      </main>

      {/* Humble Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-6 mt-12 text-center text-xs text-slate-400 font-medium">
        <p>© 2026 Indian Homeopathic Medical Association. All rights reserved.</p>
        <p className="mt-1 flex items-center justify-center gap-1 font-mono text-[10px] text-slate-400">
          <Sparkles className="h-3 w-3" /> Developed by SAMFI Digital Solutions
        </p>
      </footer>
    </div>
  );
}
