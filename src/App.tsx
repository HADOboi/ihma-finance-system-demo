/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { User, AccountHead, Transaction, OrgLevel, UserRole, HeadType, Asset, BankBalance, ChapterMaster, Member, ReportTab } from "./types";
import { loadDatabase, saveDatabase, resetToDefaults, CHAPTERS } from "./mockData";
import { ensureDoctorPrefix } from "./utils/formatters";
import Login from "./components/Login";
import TreasurerEntry from "./components/TreasurerEntry";
import AdminPanel from "./components/AdminPanel";
import Dashboard from "./components/Dashboard";
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
} from "lucide-react";

export default function App() {
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
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // View state: "home" | "reports" | "admin"
  const [currentView, setCurrentView] = useState<"home" | "reports" | "admin">("home");

  // Selected report tab when navigating to reports
  const [activeReportTab, setActiveReportTab] = useState<ReportTab>("payments");

  // Active transaction being edited
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Load database on mount
  useEffect(() => {
    const loaded = loadDatabase();
    setDb(loaded);
  }, []);

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
    setCurrentView("home");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setEditingTransaction(null);
    setCurrentView("home");
  };

  const handleOpenReports = (tab?: ReportTab) => {
    if (tab) {
      setActiveReportTab(tab);
    }
    setCurrentView("reports");
  };

  // 1. Record Transaction (Local Treasurer Mode)
  const handleAddTransaction = (
    newTx: Omit<Transaction, "id" | "createdBy" | "createdAt" | "chapterId" | "headName">
  ) => {
    if (!db || !currentUser) return;

    const id = `tx_${Date.now()}`;
    const selectedHead = db.accountHeads.find((h) => h.id === newTx.headId);

    const fullTx: Transaction = {
      ...newTx,
      id,
      headName: newTx.type === HeadType.Loan ? "Loan" : (selectedHead ? selectedHead.name : ""),
      chapterId: currentUser.nodeId || "cochin",
      createdBy: currentUser.username,
      createdAt: new Date().toISOString(),
    };

    const updatedTxs = [fullTx, ...db.transactions];
    syncDatabase({ ...db, transactions: updatedTxs });
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
  };

  // 5.2 Add Asset
  const handleAddAsset = (newAsset: Omit<Asset, "id" | "slNo">) => {
    if (!db) return;
    const id = `ast_${Date.now()}`;
    const slNo = db.assets.length + 1;
    const fullAsset: Asset = { ...newAsset, id, slNo };
    syncDatabase({ ...db, assets: [fullAsset, ...db.assets] });
  };

  // 5.3 Add Bank Balance
  const handleAddBankBalance = (newBalance: Omit<BankBalance, "id" | "slNo">) => {
    if (!db) return;
    const id = `bal_${Date.now()}`;
    const slNo = db.bankBalances.length + 1;
    const fullBalance: BankBalance = { ...newBalance, id, slNo };
    syncDatabase({ ...db, bankBalances: [fullBalance, ...db.bankBalances] });
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

  const isLocalTreasurer =
    currentUser.role === UserRole.Treasurer || currentUser.role === UserRole.Admin;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Main Header */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex flex-row items-center justify-between gap-3">
          {/* Logo Brand */}
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 sm:h-10 sm:w-10 bg-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center border border-blue-500 shadow-sm shrink-0">
              <Award className="h-4.5 w-4.5 sm:h-5.5 sm:w-5.5 text-white" />
            </div>
            <div>
              <h1 className="font-display font-semibold text-base sm:text-xl text-slate-900 tracking-tight leading-none">
                IHMA FinApp
              </h1>
            </div>
          </div>

          {/* Center View Navigation Tabs */}
          <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/60">
            <button
              onClick={() => setCurrentView("home")}
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
              onClick={() => setCurrentView("reports")}
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
                onClick={() => setCurrentView("admin")}
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
                onAddTransaction={handleAddTransaction}
                onUpdateTransaction={handleUpdateTransaction}
                editingTransaction={editingTransaction}
                onCancelEdit={() => setEditingTransaction(null)}
                onAddMember={handleAddMember}
                onAddAsset={handleAddAsset}
                onAddBankBalance={handleAddBankBalance}
                onOpenReports={handleOpenReports}
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
                        {CHAPTERS.find((c) => c.id === currentUser.nodeId)?.name || db?.chapterDirectory?.find((c) => c.id === currentUser.nodeId)?.chapterName || "Cochin Chapter"}
                      </h2>
                      <span className="text-xs font-semibold text-teal-200/90 block mt-0.5 font-mono">
                        ID: {currentUser.nodeId && currentUser.nodeId !== "cochin" ? currentUser.nodeId : "KL-EK-CO01"}
                      </span>
                    </div>

                    {/* Right Side: Logged in as Name & Role */}
                    <div className="sm:text-right bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/20 shrink-0 sm:justify-self-end w-full sm:w-auto">
                      <span className="text-[10px] text-teal-200 uppercase tracking-widest font-bold block">
                        Logged in as
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
                        <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/25 text-white flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform">
                          📊
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
                          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center text-lg shrink-0">
                            🧾
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
                          <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center text-lg shrink-0">
                            💰
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
                          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center text-lg shrink-0">
                            💼
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-slate-900 group-hover:text-teal-800 transition-colors">
                              Temporary Loans
                            </h4>
                            <p className="text-[11px] text-slate-500">Loan Registry & Balances</p>
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
                          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center text-lg shrink-0">
                            👥
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
                          <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center text-lg shrink-0">
                            🏢
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

                      {/* Bank Balances */}
                      <button
                        onClick={() => handleOpenReports("bank_balances")}
                        className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-teal-500 hover:shadow-xs transition-all text-left flex items-center justify-between cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center text-lg shrink-0">
                            🏦
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-slate-900 group-hover:text-teal-800 transition-colors">
                              Bank & FD Balances
                            </h4>
                            <p className="text-[11px] text-slate-500">Liquid Savings & Fixed Deposits</p>
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
              onDeleteTransaction={handleDeleteTransaction}
              onEditTransaction={(tx) => {
                setEditingTransaction(tx);
                setCurrentView("home");
              }}
              onUpdateTransaction={handleUpdateTransaction}
              initialReportTab={activeReportTab}
              onBackToHome={() => setCurrentView("home")}
            />
          </div>
        )}

        {/* ---------------- VIEW 3: ADMIN PANEL ---------------- */}
        {currentView === "admin" && currentUser.role === UserRole.Admin && (
          <div className="space-y-6 animate-fadeIn">
            {/* Top Back Navigation Bar */}
            <div className="flex items-center justify-between bg-white px-4 py-3 rounded-2xl border border-slate-200 shadow-xs">
              <button
                onClick={() => setCurrentView("home")}
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
        <p className="mt-1 flex items-center justify-center gap-1 font-mono text-[10px] text-slate-350">
          <Sparkles className="h-3 w-3" /> IHMA Ledger system designed & deployed for localized secure demonstrations.
        </p>
      </footer>
    </div>
  );
}
