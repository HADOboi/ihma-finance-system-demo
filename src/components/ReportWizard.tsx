/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useState, useEffect, useRef } from "react";
import {
  User,
  AccountHead,
  Transaction,
  HeadType,
  OrgLevel,
  Asset,
  BankBalance,
  Member,
} from "../types";
import { CHAPTERS, DISTRICTS, STATES } from "../mockData";
import { FINANCIAL_UNITS, getReadableFinancialUnitIds, getUserFinancialUnitId, getFinancialUnitName } from "../utils/financialUnits";
import { formatDateDMY, formatINR } from "../utils/formatters";
import {
  ArrowLeft,
  ArrowDownRight,
  ArrowUpRight,
  Briefcase,
  Building2,
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  Landmark,
  Users,
} from "lucide-react";

type GeoFilterKey = "states" | "districts" | "chapters";

interface GeoOption {
  id: string;
  name: string;
  hint?: string;
}

function MultiSelectFilter({
  label,
  options,
  selectedIds,
  isOpen,
  onToggleOpen,
  onToggleOption,
  onSelectAll,
  onClear,
  emptyHint,
  idPrefix,
  wrapperId,
}: {
  label: string;
  options: GeoOption[];
  selectedIds: string[];
  isOpen: boolean;
  onToggleOpen: () => void;
  onToggleOption: (id: string) => void;
  onSelectAll: () => void;
  onClear: () => void;
  emptyHint: string;
  idPrefix: string;
  wrapperId: string;
}) {
  const isEmpty = options.length === 0;
  const chosen = options.filter((o) => selectedIds.includes(o.id));

  let summary: string;
  if (isEmpty) summary = emptyHint;
  else if (chosen.length === 0) summary = `None selected (${options.length} available)`;
  else if (chosen.length === options.length) summary = `All ${label.toLowerCase()} (${options.length})`;
  else if (chosen.length <= 2) summary = chosen.map((o) => o.name).join(", ");
  else summary = `${chosen.length} of ${options.length} selected`;

  return (
    <div className="relative" id={wrapperId}>
      <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">{label}</span>
      <button
        type="button"
        disabled={isEmpty}
        onClick={onToggleOpen}
        id={`${idPrefix}-dropdown-button`}
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 bg-white border rounded-xl text-xs font-bold shadow-2xs transition-colors ${
          isEmpty
            ? "border-slate-200 text-slate-400 cursor-not-allowed"
            : "border-slate-300 text-slate-700 hover:border-blue-400 cursor-pointer"
        }`}
      >
        <span className="truncate text-left">{summary}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && !isEmpty && (
        <div className="absolute left-0 right-0 z-30 mt-1.5 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 bg-slate-50/70">
            <button type="button" onClick={onSelectAll} className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer">
              Select all
            </button>
            <button type="button" onClick={onClear} className="text-[10px] font-bold text-slate-500 hover:underline cursor-pointer">
              Clear
            </button>
          </div>
          <div className="max-h-56 overflow-y-auto p-1.5 space-y-0.5">
            {options.map((o) => {
              const checked = selectedIds.includes(o.id);
              return (
                <label
                  key={o.id}
                  id={`${idPrefix}-${o.id}`}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggleOption(o.id)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="truncate">{o.name}</span>
                  {o.hint && <span className="text-[9px] text-slate-400 ml-auto shrink-0">{o.hint}</span>}
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export type ReportSection = "income" | "expense" | "loans" | "assets" | "fd" | "members";

type WizardPeriod = "year" | "month" | "day" | "custom";

interface ReportWizardProps {
  currentUser: User;
  accountHeads: AccountHead[];
  transactions: Transaction[];
  assets: Asset[];
  bankBalances: BankBalance[];
  members: Member[];
  scopeLabel: string;
  onClose: () => void;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const SECTION_OPTIONS: { id: ReportSection; label: string; sub: string; icon: typeof Users }[] = [
  { id: "income", label: "Income", sub: "Receipts collected", icon: ArrowDownRight },
  { id: "expense", label: "Expense", sub: "Payments made", icon: ArrowUpRight },
  { id: "loans", label: "Internal Loans", sub: "Internal loans given & repayments", icon: Briefcase },
  { id: "assets", label: "Assets", sub: "Capital asset register", icon: Building2 },
  { id: "fd", label: "FD", sub: "Fixed deposits", icon: Landmark },
  { id: "members", label: "Members", sub: "Doctor directory", icon: Users },
];

// One column definition drives both the on-screen table and the exported sheet,
// so the two can never drift apart.
interface ReportColumn {
  label: string;
  money?: boolean;
  numeric?: boolean;
  value: (row: any, index: number) => string | number;
}

export default function ReportWizard({
  currentUser,
  accountHeads,
  transactions,
  assets,
  bankBalances,
  members,
  scopeLabel,
  onClose,
}: ReportWizardProps) {
  const today = new Date().toISOString().slice(0, 10);
  const currentYear = new Date().getFullYear();

  const [currentStep, setCurrentStep] = useState<number>(0);
  const userFinancialUnitId = getUserFinancialUnitId(currentUser);
  const readableFinancialUnitIds = useMemo(() => getReadableFinancialUnitIds(currentUser), [currentUser]);

  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [selectedChapters, setSelectedChapters] = useState<string[]>(
    currentUser.level === OrgLevel.Local ? [currentUser.nodeId || ""] : []
  );
  const [includeOwnFinancialUnit, setIncludeOwnFinancialUnit] = useState<boolean>(true);

  const [openGeoFilter, setOpenGeoFilter] = useState<GeoFilterKey | null>(null);
  const geoFilterRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!openGeoFilter) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (geoFilterRef.current && !geoFilterRef.current.contains(e.target as Node)) {
        setOpenGeoFilter(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [openGeoFilter]);

  const toggleGeoFilter = (key: GeoFilterKey) => {
    setOpenGeoFilter((current) => (current === key ? null : key));
  };

  const combinedChapters = CHAPTERS;
  const combinedDistricts = DISTRICTS;

  const availableDistricts = useMemo(() => {
    if (currentUser.level === OrgLevel.National) {
      const stateScope = selectedStates.length > 0 ? selectedStates : STATES.map((s) => s.id);
      return combinedDistricts.filter((d) => stateScope.includes(d.stateId));
    }
    if (currentUser.level === OrgLevel.State) {
      const userState = (currentUser.nodeId || "").toLowerCase();
      return combinedDistricts.filter((d) => {
        const dState = (d.stateId || "").toLowerCase();
        return dState === userState || (userState.includes("kerala") && dState.includes("kerala")) || d.stateId === currentUser.nodeId;
      });
    }
    return [];
  }, [selectedStates, currentUser, combinedDistricts]);

  const availableChapters = useMemo(() => {
    if (currentUser.level === OrgLevel.National || currentUser.level === OrgLevel.State) {
      const districtScope = selectedDistricts.length > 0 ? selectedDistricts : availableDistricts.map((d) => d.id);
      return combinedChapters.filter((c) => districtScope.includes(c.districtId));
    }
    if (currentUser.level === OrgLevel.District) {
      const userDist = currentUser.nodeId?.toLowerCase().trim() || "";
      const userDistClean = userDist.replace(/\s+/g, "_");
      return combinedChapters.filter((c) => {
        const dId = (c.districtId || "").toLowerCase().trim();
        return dId === userDist || dId === userDistClean || dId.replace(/_/g, " ") === userDist.replace(/_/g, " ");
      });
    }
    return [];
  }, [selectedDistricts, currentUser, availableDistricts, combinedChapters]);

  const selectedFinancialUnitIds = useMemo(() => {
    if (currentUser.level === OrgLevel.Local) return [userFinancialUnitId];
    const stateUnits = selectedStates;
    const districtUnits = selectedDistricts;
    const localUnits = selectedChapters;
    const ownUnit = includeOwnFinancialUnit ? [userFinancialUnitId] : [];
    return [...new Set([...ownUnit, ...stateUnits, ...districtUnits, ...localUnits])]
      .filter((id) => readableFinancialUnitIds.includes(id));
  }, [currentUser.level, userFinancialUnitId, includeOwnFinancialUnit, selectedStates, selectedDistricts, selectedChapters, readableFinancialUnitIds]);

  const handleStateToggle = (stateId: string) => {
    const updated = selectedStates.includes(stateId)
      ? selectedStates.filter((id) => id !== stateId)
      : [...selectedStates, stateId];
    setSelectedStates(updated);

    const stillValidDists = combinedDistricts.filter(
      (d) => updated.includes(d.stateId) && selectedDistricts.includes(d.id)
    ).map((d) => d.id);
    setSelectedDistricts(stillValidDists);
    setSelectedChapters((prev) =>
      prev.filter((chapId) => {
        const chap = combinedChapters.find((c) => c.id === chapId);
        return chap ? stillValidDists.includes(chap.districtId) : false;
      })
    );
  };

  const handleDistrictToggle = (distId: string) => {
    const updated = selectedDistricts.includes(distId)
      ? selectedDistricts.filter((id) => id !== distId)
      : [...selectedDistricts, distId];
    setSelectedDistricts(updated);

    setSelectedChapters((prev) =>
      prev.filter((chapId) => {
        const chap = combinedChapters.find((c) => c.id === chapId);
        return chap ? updated.includes(chap.districtId) : false;
      })
    );
  };

  const handleChapterToggle = (chapId: string) => {
    if (selectedChapters.includes(chapId)) {
      setSelectedChapters(selectedChapters.filter((id) => id !== chapId));
    } else {
      setSelectedChapters([...selectedChapters, chapId]);
    }
  };

  // Step 1 — period
  const [periodType, setPeriodType] = useState<WizardPeriod | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [rangeStart, setRangeStart] = useState<string>("");
  const [rangeEnd, setRangeEnd] = useState<string>("");

  // Step 2 — which sections
  const [sections, setSections] = useState<ReportSection[]>([]);

  // Step 3 — account heads (only when Income and/or Expense chosen)
  const [selectedHeadIds, setSelectedHeadIds] = useState<string[]>([]);

  const wantsIncome = sections.includes("income");
  const wantsExpense = sections.includes("expense");
  // The head-picker only makes sense when the report is purely ledger heads.
  const needsHeadStep =
    (wantsIncome || wantsExpense) &&
    sections.every((s) => s === "income" || s === "expense");

  const steps = useMemo(() => {
    const list = [
      { id: "units", title: "Select Chapter / Entity Scope", sub: "Choose the states, districts, local chapters or own entity to include in this report." },
      { id: "period", title: "Report Period", sub: "Pick the time span this report should cover." },
      { id: "sections", title: "What should the report contain?", sub: "Choose one, or select several to combine them." },
    ];
    if (needsHeadStep) {
      list.push({
        id: "heads",
        title: "Which account heads?",
        sub: "Leave everything unticked to include all heads.",
      });
    }
    list.push({ id: "result", title: "Your report", sub: "Review the result, then export it." });
    return list;
  }, [needsHeadStep]);

  const currentStepConfig = steps[Math.min(currentStep, steps.length - 1)];

  // --- Date window derived from the wizard answers ---
  const dateWindow = useMemo(() => {
    if (periodType === "year" && selectedYear !== null) {
      // Indian financial year: 1 April to 31 March.
      return { from: `${selectedYear}-04-01`, to: `${selectedYear + 1}-03-31` };
    }
    if (periodType === "month" && selectedYear !== null && selectedMonth !== null) {
      const monthStr = String(selectedMonth + 1).padStart(2, "0");
      const lastDay = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      return { from: `${selectedYear}-${monthStr}-01`, to: `${selectedYear}-${monthStr}-${lastDay}` };
    }
    if (periodType === "day" && selectedDay) {
      return { from: selectedDay, to: selectedDay };
    }
    if (periodType === "custom" && rangeStart && rangeEnd) {
      return { from: rangeStart, to: rangeEnd };
    }
    return null;
  }, [periodType, selectedYear, selectedMonth, selectedDay, rangeStart, rangeEnd]);

  const periodLabel = useMemo(() => {
    if (!dateWindow) return "";
    if (periodType === "year") return `FY ${selectedYear}–${String((selectedYear ?? 0) + 1).slice(2)}`;
    if (periodType === "month") return `${MONTH_NAMES[selectedMonth ?? 0]} ${selectedYear}`;
    if (periodType === "day") return formatDateDMY(dateWindow.from);
    return `${formatDateDMY(dateWindow.from)} to ${formatDateDMY(dateWindow.to)}`;
  }, [dateWindow, periodType, selectedYear, selectedMonth]);

  const inWindow = (dateStr?: string) => {
    if (!dateWindow || !dateStr) return false;
    const d = dateStr.slice(0, 10);
    return d >= dateWindow.from && d <= dateWindow.to;
  };

  const inScope = (financialUnitId?: string) =>
    selectedFinancialUnitIds.includes(financialUnitId || "");

  const headMatches = (headId: string) => selectedHeadIds.length === 0 || selectedHeadIds.includes(headId);

  // --- Result blocks, one per chosen section ---
  const resultBlocks = useMemo(() => {
    if (!dateWindow) return [];

    const blocks: {
      key: ReportSection;
      title: string;
      rows: any[];
      columns: ReportColumn[];
      totals: { label: string; value: number }[];
    }[] = [];

    const ledgerRows = transactions.filter((tx) => inScope(tx.financialUnitId || tx.chapterId) && inWindow(tx.date));

    if (wantsIncome) {
      const rows = ledgerRows.filter((tx) => tx.type === HeadType.Income && headMatches(tx.headId));
      blocks.push({
        key: "income",
        title: "Income / Receipts",
        rows,
        totals: [{ label: "Total received", value: rows.reduce((sum, tx) => sum + (tx.paidAmount ?? tx.amount), 0) }],
        columns: [
          { label: "Sl. No.", value: (_r, i) => i + 1 },
          { label: "Date", value: (r) => formatDateDMY(r.date) },
          { label: "Chapter", value: (r) => r.chapterNameInput || r.chapterId },
          { label: "Account Head", value: (r) => r.headName },
          { label: "Paid By", value: (r) => r.paidBy || "—" },
          { label: "Collected By", value: (r) => r.collectedBy || "—" },
          { label: "Mode", value: (r) => r.paymentMode || "—" },
          { label: "Offered (₹)", money: true, value: (r) => r.offeredAmount ?? r.amount },
          { label: "Received (₹)", money: true, value: (r) => r.paidAmount ?? r.amount },
          { label: "Balance (₹)", money: true, value: (r) => r.balanceAmount ?? 0 },
          { label: "Remarks", value: (r) => r.remarks || r.description || "—" },
        ],
      });
    }

    if (wantsExpense) {
      const rows = ledgerRows.filter((tx) => tx.type === HeadType.Expense && headMatches(tx.headId));
      blocks.push({
        key: "expense",
        title: "Expense / Payments",
        rows,
        totals: [{ label: "Total paid", value: rows.reduce((sum, tx) => sum + (tx.paidAmount ?? tx.amount), 0) }],
        columns: [
          { label: "Sl. No.", value: (_r, i) => i + 1 },
          { label: "Date", value: (r) => formatDateDMY(r.date) },
          { label: "Chapter", value: (r) => r.chapterNameInput || r.chapterId },
          { label: "Account Head", value: (r) => r.headName },
          { label: "Paid By", value: (r) => r.paidByExpense || r.createdBy || "—" },
          { label: "Paid To", value: (r) => r.paidTo || r.paidToName || "—" },
          { label: "Mode", value: (r) => r.paymentMode || "—" },
          { label: "Payable (₹)", money: true, value: (r) => r.payableAmount ?? r.amount },
          { label: "Paid (₹)", money: true, value: (r) => r.paidAmount ?? r.amount },
          { label: "Balance (₹)", money: true, value: (r) => r.balanceAmount ?? 0 },
          { label: "Remarks", value: (r) => r.remarks || r.description || "—" },
        ],
      });
    }

    if (sections.includes("loans")) {
      const rows = ledgerRows.filter((tx) => tx.type === HeadType.Loan);
      blocks.push({
        key: "loans",
        title: "Internal Loans",
        rows,
        totals: [
          { label: "Total disbursed", value: rows.reduce((sum, tx) => sum + tx.amount, 0) },
          { label: "Total repaid", value: rows.reduce((sum, tx) => sum + (tx.amountReturned ?? 0), 0) },
          {
            label: "Outstanding",
            value: rows.reduce((sum, tx) => sum + (tx.loanBalance ?? tx.amount - (tx.amountReturned ?? 0)), 0),
          },
        ],
        columns: [
          { label: "Sl. No.", value: (_r, i) => i + 1 },
          { label: "Date", value: (r) => formatDateDMY(r.date) },
          { label: "Chapter", value: (r) => r.chapterNameInput || r.chapterId },
          { label: "Paid To", value: (r) => r.paidToName || r.paidTo || "—" },
          { label: "Particulars", value: (r) => r.particulars || r.description || "—" },
          { label: "Mode", value: (r) => r.paymentMode || "—" },
          { label: "Loan Amount (₹)", money: true, value: (r) => r.amount },
          { label: "Returned (₹)", money: true, value: (r) => r.amountReturned ?? 0 },
          { label: "Balance (₹)", money: true, value: (r) => r.loanBalance ?? r.amount - (r.amountReturned ?? 0) },
          { label: "Return Due", value: (r) => (r.loanReturnDate ? formatDateDMY(r.loanReturnDate) : "—") },
          { label: "Returned On", value: (r) => (r.loanReturnedDate ? formatDateDMY(r.loanReturnedDate) : "—") },
          { label: "Remarks", value: (r) => r.remarks || "—" },
        ],
      });
    }

    if (sections.includes("assets")) {
      // Assets are dated by purchase, which is what a treasurer means by
      // "assets bought this year".
      const rows = assets.filter(
        (a) => inScope(a.financialUnitId || a.chapterIdInput) && inWindow(a.purchaseDate || a.date)
      );
      blocks.push({
        key: "assets",
        title: "Assets",
        rows,
        totals: [
          { label: "Total asset value", value: rows.reduce((sum, a) => sum + (a.totalValue ?? a.assetValue), 0) },
          { label: "Total net value", value: rows.reduce((sum, a) => sum + (a.netAmount ?? a.totalValue ?? a.assetValue), 0) },
        ],
        columns: [
          { label: "Sl. No.", value: (_r, i) => i + 1 },
          { label: "Asset ID", value: (r) => r.assetId },
          { label: "Asset Name", value: (r) => r.assetName },
          { label: "Chapter", value: (r) => r.chapterNameInput },
          { label: "Purchase Date", value: (r) => formatDateDMY(r.purchaseDate) },
          { label: "Category", value: (r) => r.category },
          { label: "No. of Items", numeric: true, value: (r) => r.quantity ?? 1 },
          { label: "Price / Item (₹)", money: true, value: (r) => r.assetValue },
          { label: "Total Value (₹)", money: true, value: (r) => r.totalValue ?? r.assetValue },
          { label: "Mode", value: (r) => r.paymentMode || "—" },
          { label: "Life (Yrs)", numeric: true, value: (r) => r.assetLife },
          { label: "Custodian", value: (r) => r.custodianName },
          { label: "Deprec. / Year (₹)", money: true, value: (r) => r.depreciationAmount ?? 0 },
          { label: "Net Amount (₹)", money: true, value: (r) => r.netAmount ?? r.totalValue ?? r.assetValue },
          { label: "Remarks", value: (r) => r.remarks || "—" },
        ],
      });
    }

    if (sections.includes("fd")) {
      const rows = bankBalances.filter(
        (b) => b.amountType === "FD" && inScope(b.financialUnitId || b.chapterIdInput) && inWindow(b.date)
      );
      blocks.push({
        key: "fd",
        title: "Fixed Deposits",
        rows,
        totals: [
          { label: "Total deposited", value: rows.reduce((sum, b) => sum + b.amount, 0) },
        ],
        columns: [
          { label: "Sl. No.", value: (_r, i) => i + 1 },
          { label: "Date", value: (r) => formatDateDMY(r.date) },
          { label: "Chapter", value: (r) => r.chapterNameInput },
          { label: "Bank Account No.", value: (r) => r.bankAccountNumber || "—" },
          { label: "Bank Name", value: (r) => r.bankName || "—" },
          { label: "Bank Branch", value: (r) => r.bankBranch || "—" },
          { label: "Branch Address", value: (r) => r.bankAddress || "—" },
          { label: "Bank Contact", value: (r) => r.bankContactNumber || "—" },
          { label: "Deposited By", value: (r) => r.depositedBy || "—" },
          { label: "FD Amount (₹)", money: true, value: (r) => r.amount },
          { label: "Maturity Date", value: (r) => (r.maturityDate ? formatDateDMY(r.maturityDate) : "—") },
          { label: "Remarks", value: (r) => r.remarks || "—" },
        ],
      });
    }

    if (sections.includes("members")) {
      const rows = members.filter(
        (m) => inScope(m.chapterIdInput) && inWindow(m.membershipDate)
      );
      blocks.push({
        key: "members",
        title: "Members",
        rows,
        totals: [],
        columns: [
          { label: "Sl. No.", value: (_r, i) => i + 1 },
          { label: "Member ID", value: (r) => r.memberId },
          { label: "Member Name", value: (r) => r.memberName },
          { label: "Chapter", value: (r) => r.chapterNameInput },
          { label: "Qualification", value: (r) => r.qualification },
          { label: "Type", value: (r) => r.membershipType },
          { label: "Joined", value: (r) => formatDateDMY(r.membershipDate) },
          { label: "Status", value: (r) => r.membershipStatus },
          { label: "Mobile", value: (r) => r.mobileNumber },
          { label: "Email", value: (r) => r.email },
        ],
      });
    }

    return blocks;
  }, [
    dateWindow, sections, selectedHeadIds, transactions, assets, bankBalances, members,
    selectedFinancialUnitIds, wantsIncome, wantsExpense,
  ]);

  const totalRowCount = resultBlocks.reduce((sum, b) => sum + b.rows.length, 0);

  // --- Step gating ---
  const isStepValid = () => {
    if (currentStepConfig.id === "units") return currentUser.level === OrgLevel.Local || selectedFinancialUnitIds.length > 0;
    if (currentStepConfig.id === "period") return dateWindow !== null;
    if (currentStepConfig.id === "sections") return sections.length > 0;
    return true; // heads step is optional; result step has no Next
  };

  const toggleSection = (id: ReportSection) => {
    setSections((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
    // Heads chosen for a combination that no longer applies would silently
    // filter the result, so clear them whenever the section mix changes.
    setSelectedHeadIds([]);
  };

  const availableHeads = useMemo(
    () =>
      accountHeads.filter(
        (h) =>
          (wantsIncome && h.type === HeadType.Income) ||
          (wantsExpense && h.type === HeadType.Expense)
      ),
    [accountHeads, wantsIncome, wantsExpense]
  );

  // --- Exports ---
  const reportTitle = `IHMA Report — ${sections
    .map((s) => SECTION_OPTIONS.find((o) => o.id === s)?.label)
    .join(", ")} — ${periodLabel}`;

  const csvCell = (value: string | number) => {
    const str = String(value ?? "");
    return `"${str.replace(/"/g, '""')}"`;
  };

  const handleExportCSV = () => {
    const lines: string[] = [];
    lines.push(csvCell(reportTitle));
    lines.push(csvCell(`Scope: ${scopeLabel}`));
    lines.push(csvCell(`Generated: ${formatDateDMY(today)}`));
    lines.push("");

    resultBlocks.forEach((block) => {
      lines.push(csvCell(block.title));
      lines.push(block.columns.map((c) => csvCell(c.label)).join(","));
      block.rows.forEach((row, idx) => {
        lines.push(block.columns.map((c) => csvCell(c.value(row, idx))).join(","));
      });
      block.totals.forEach((t) => {
        lines.push(`${csvCell(t.label)},${t.value}`);
      });
      lines.push("");
    });

    // BOM keeps the ₹ sign and Indian names intact when Excel opens the file.
    const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `IHMA_Report_${sections.join("_")}_${dateWindow?.from}_to_${dateWindow?.to}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    const win = window.open("", "_blank", "width=1100,height=800");
    if (!win) return;

    const tablesHtml = resultBlocks
      .map((block) => {
        const head = block.columns.map((c) => `<th>${c.label}</th>`).join("");
        const body = block.rows.length
          ? block.rows
              .map(
                (row, idx) =>
                  `<tr>${block.columns
                    .map((c) => {
                      const v = c.value(row, idx);
                      const align = c.money || c.numeric ? ' class="num"' : "";
                      const text = c.money ? formatINR(Number(v || 0)) : v;
                      return `<td${align}>${text}</td>`;
                    })
                    .join("")}</tr>`
              )
              .join("")
          : `<tr><td colspan="${block.columns.length}" class="empty">No entries for this period.</td></tr>`;
        const footer = block.totals.length
          ? `<tfoot>${block.totals
              .map(
                (t) =>
                  `<tr><td colspan="${block.columns.length - 1}">${t.label}</td><td class="num">${formatINR(t.value)}</td></tr>`
              )
              .join("")}</tfoot>`
          : "";
        return `<h2>${block.title} <span class="count">${block.rows.length} entries</span></h2>
          <table><thead><tr>${head}</tr></thead><tbody>${body}</tbody>${footer}</table>`;
      })
      .join("");

    win.document.write(`<!doctype html><html><head><meta charset="utf-8" /><title>${reportTitle}</title>
      <style>
        * { box-sizing: border-box; }
        body { font-family: "Segoe UI", Arial, sans-serif; color: #0f172a; margin: 24px; }
        h1 { font-size: 18px; margin: 0 0 4px; }
        .meta { font-size: 11px; color: #64748b; margin-bottom: 18px; }
        h2 { font-size: 13px; margin: 22px 0 8px; border-bottom: 2px solid #0F6E5D; padding-bottom: 4px; }
        .count { font-size: 10px; color: #64748b; font-weight: 400; }
        table { width: 100%; border-collapse: collapse; font-size: 10px; }
        th { background: #f1f5f9; text-align: left; padding: 6px; border: 1px solid #cbd5e1; font-size: 9px; text-transform: uppercase; }
        td { padding: 5px 6px; border: 1px solid #e2e8f0; }
        td.num, th.num { text-align: right; }
        tfoot td { font-weight: bold; background: #f8fafc; text-align: right; }
        .empty { text-align: center; color: #94a3b8; padding: 14px; }
        @page { size: A4 landscape; margin: 12mm; }
      </style></head><body>
      <h1>${reportTitle}</h1>
      <div class="meta">Scope: ${scopeLabel} &nbsp;•&nbsp; Generated ${formatDateDMY(today)} by ${currentUser.name}</div>
      ${tablesHtml}
      </body></html>`);
    win.document.close();
    win.focus();
    win.print();
  };

  const yearOptions = [currentYear, currentYear - 1, currentYear - 2, currentYear - 3];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden animate-fadeIn">
      {/* Wizard App Bar */}
      <div className="px-3 sm:px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2">
        <button
          onClick={currentStep === 0 ? onClose : () => setCurrentStep((prev) => prev - 1)}
          className="shrink-0 px-2.5 sm:px-3 py-1.5 bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-xl cursor-pointer flex items-center gap-1 text-xs font-bold transition-all shadow-xs whitespace-nowrap"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{currentStep === 0 ? "Cancel" : "Back"}</span>
        </button>

        <div className="text-center min-w-0 flex-1 px-1">
          <h3 className="font-bold text-xs sm:text-sm text-slate-900 font-display truncate">
            Specific Report
          </h3>
          <p className="text-[10px] text-slate-500 font-medium truncate">{scopeLabel}</p>
        </div>

        <div className="shrink-0 text-[10px] sm:text-xs font-bold text-slate-600 bg-white px-2 sm:px-2.5 py-1 rounded-lg border border-slate-200 whitespace-nowrap">
          Step {currentStep + 1} of {steps.length}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 h-1.5 flex">
        {steps.map((_, idx) => (
          <div
            key={idx}
            className={`h-full flex-1 transition-all duration-300 ${idx <= currentStep ? "bg-[#0F6E5D]" : "bg-transparent"}`}
          />
        ))}
      </div>

      {/* Step Question Header */}
      <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2">
        <h2 className="text-lg sm:text-xl font-extrabold font-display text-slate-900 leading-snug">
          {currentStepConfig.title}
        </h2>
        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{currentStepConfig.sub}</p>
      </div>

      {/* Step Content */}
      <div className="p-4 sm:p-6 space-y-4">
        {/* ---------------- STEP: FINANCIAL UNITS / GEOGRAPHICAL FILTER ---------------- */}
        {currentStepConfig.id === "units" && (
          <div className="space-y-4">
            {currentUser.level !== OrgLevel.Local ? (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => setIncludeOwnFinancialUnit((selected) => !selected)}
                  className={`w-full flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl border text-left text-xs font-bold cursor-pointer transition-colors ${
                    includeOwnFinancialUnit ? "bg-teal-50 border-teal-300 text-teal-900" : "bg-white border-slate-300 text-slate-700 hover:border-teal-300"
                  }`}
                >
                  <span>Include {getFinancialUnitName(userFinancialUnitId)}</span>
                  <span className={`h-5 w-5 rounded-md border flex items-center justify-center transition-colors ${includeOwnFinancialUnit ? "bg-[#0F6E5D] border-[#0F6E5D] text-white" : "border-slate-300"}`}>
                    {includeOwnFinancialUnit && <Check className="h-3.5 w-3.5" />}
                  </span>
                </button>

                <div ref={geoFilterRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1 border-t border-slate-100">
                  {/* National Level View: Select States */}
                  {currentUser.level === OrgLevel.National && (
                    <MultiSelectFilter
                      label="States"
                      wrapperId="wizard-state-selector-wrapper"
                      idPrefix="wizard-state-filter"
                      options={STATES.map((s) => ({ id: s.id, name: s.name }))}
                      selectedIds={selectedStates}
                      isOpen={openGeoFilter === "states"}
                      onToggleOpen={() => toggleGeoFilter("states")}
                      onToggleOption={handleStateToggle}
                      onSelectAll={() => setSelectedStates(STATES.map((s) => s.id))}
                      onClear={() => {
                        setSelectedStates([]);
                        setSelectedDistricts([]);
                        setSelectedChapters([]);
                      }}
                      emptyHint="No states available"
                    />
                  )}

                  {/* National & State View: Select Districts */}
                  {(currentUser.level === OrgLevel.National || currentUser.level === OrgLevel.State) && (
                    <MultiSelectFilter
                      label="Districts"
                      wrapperId="wizard-district-selector-wrapper"
                      idPrefix="wizard-district-filter"
                      options={availableDistricts.map((d) => ({ id: d.id, name: d.name }))}
                      selectedIds={selectedDistricts}
                      isOpen={openGeoFilter === "districts"}
                      onToggleOpen={() => toggleGeoFilter("districts")}
                      onToggleOption={handleDistrictToggle}
                      onSelectAll={() => setSelectedDistricts(availableDistricts.map((d) => d.id))}
                      onClear={() => {
                        setSelectedDistricts([]);
                        setSelectedChapters([]);
                      }}
                      emptyHint="Select a state first"
                    />
                  )}

                  {/* Select Chapters (Visible on National, State, and District levels) */}
                  <MultiSelectFilter
                    label="Local Chapters"
                    wrapperId="wizard-chapter-selector-wrapper"
                    idPrefix="wizard-chapter-filter"
                    options={availableChapters.map((c) => ({
                      id: c.id,
                      name: c.name,
                      hint: combinedDistricts.find((d) => d.id === c.districtId)?.name || DISTRICTS.find((d) => d.id === c.districtId)?.name || "",
                    }))}
                    selectedIds={selectedChapters}
                    isOpen={openGeoFilter === "chapters"}
                    onToggleOpen={() => toggleGeoFilter("chapters")}
                    onToggleOption={handleChapterToggle}
                    onSelectAll={() => setSelectedChapters(availableChapters.map((c) => c.id))}
                    onClear={() => setSelectedChapters([])}
                    emptyHint={currentUser.level === OrgLevel.District ? "No local chapters in this district" : "Select a district first"}
                  />
                </div>

                {selectedFinancialUnitIds.length === 0 && (
                  <div className="flex items-center gap-2.5 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-xs font-semibold text-amber-800">
                    Select at least one state, district, or chapter above to include in the report.
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 text-xs font-semibold text-teal-900">
                Logged in as Local Chapter user ({getFinancialUnitName(userFinancialUnitId)}). All data will be generated for your chapter.
              </div>
            )}
          </div>
        )}

        {/* ---------------- STEP: PERIOD ---------------- */}
        {currentStepConfig.id === "period" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {([
                { id: "year" as WizardPeriod, label: "Year", sub: "Full financial year" },
                { id: "month" as WizardPeriod, label: "Month", sub: "One calendar month" },
                { id: "day" as WizardPeriod, label: "Date", sub: "A single day" },
                { id: "custom" as WizardPeriod, label: "Custom Range", sub: "From and to dates" },
              ]).map((opt) => {
                const active = periodType === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPeriodType(opt.id)}
                    className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                      active
                        ? "border-[#0F6E5D] bg-teal-50 shadow-xs"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-bold ${active ? "text-teal-900" : "text-slate-800"}`}>{opt.label}</span>
                      {active && <Check className="h-4 w-4 text-[#0F6E5D]" />}
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-0.5">{opt.sub}</span>
                  </button>
                );
              })}
            </div>

            {periodType === "year" && (
              <div className="space-y-2 pt-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Year</label>
                <select
                  value={selectedYear ?? ""}
                  onChange={(e) => setSelectedYear(e.target.value ? Number(e.target.value) : null)}
                  className="w-full sm:w-64 px-4 py-3 border border-slate-300 rounded-xl text-sm font-semibold bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0F6E5D] cursor-pointer"
                >
                  <option value="">Select financial year</option>
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>
                      {y}–{String(y + 1).slice(2)}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500">Indian financial year runs 1 April to 31 March.</p>
              </div>
            )}

            {periodType === "month" && (
              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <div className="flex-1 space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Month</label>
                  <select
                    value={selectedMonth ?? ""}
                    onChange={(e) => setSelectedMonth(e.target.value ? Number(e.target.value) : null)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm font-semibold bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0F6E5D] cursor-pointer"
                  >
                    <option value="">Select month</option>
                    {MONTH_NAMES.map((m, i) => (
                      <option key={m} value={i}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Year</label>
                  <select
                    value={selectedYear ?? ""}
                    onChange={(e) => setSelectedYear(e.target.value ? Number(e.target.value) : null)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm font-semibold bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0F6E5D] cursor-pointer"
                  >
                    <option value="">Select year</option>
                    {yearOptions.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {periodType === "day" && (
              <div className="space-y-2 pt-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Select date</label>
                <div className="flex items-center gap-3">
                  <input
                    type="date"
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(e.target.value)}
                    className="flex-1 px-4 py-3 border border-slate-300 rounded-xl text-sm font-semibold bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0F6E5D]"
                  />
                  <button
                    type="button"
                    onClick={() => setSelectedDay(today)}
                    className="px-4 py-3 bg-teal-50 text-teal-800 text-xs font-bold rounded-xl border border-teal-200 hover:bg-teal-100 cursor-pointer"
                  >
                    Today
                  </button>
                </div>
              </div>
            )}

            {periodType === "custom" && (
              <div className="space-y-2 pt-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">From and to</label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="date"
                    value={rangeStart}
                    onChange={(e) => setRangeStart(e.target.value)}
                    className="flex-1 px-4 py-3 border border-slate-300 rounded-xl text-sm font-semibold bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0F6E5D]"
                  />
                  <span className="text-xs font-bold text-slate-500 text-center">to</span>
                  <input
                    type="date"
                    value={rangeEnd}
                    min={rangeStart || undefined}
                    onChange={(e) => setRangeEnd(e.target.value)}
                    className="flex-1 px-4 py-3 border border-slate-300 rounded-xl text-sm font-semibold bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0F6E5D]"
                  />
                </div>
                {rangeStart && rangeEnd && rangeEnd < rangeStart && (
                  <p className="text-[11px] font-bold text-rose-700">End date must fall on or after the start date.</p>
                )}
              </div>
            )}

            {dateWindow && (
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 flex items-center gap-2 text-xs text-teal-900">
                <Calendar className="h-4 w-4 shrink-0 text-teal-700" />
                <span className="font-semibold">
                  Report period: {formatDateDMY(dateWindow.from)} to {formatDateDMY(dateWindow.to)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* ---------------- STEP: SECTIONS ---------------- */}
        {currentStepConfig.id === "sections" && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {SECTION_OPTIONS.map((opt) => {
                const active = sections.includes(opt.id);
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggleSection(opt.id)}
                    className={`p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer flex items-center gap-3 ${
                      active ? "border-[#0F6E5D] bg-teal-50 shadow-xs" : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${active ? "bg-[#0F6E5D] text-white" : "bg-slate-100 text-slate-500"}`}>
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className={`text-sm font-bold block ${active ? "text-teal-900" : "text-slate-800"}`}>{opt.label}</span>
                      <span className="text-[10px] text-slate-500 block">{opt.sub}</span>
                    </div>
                    {active && <Check className="h-4 w-4 text-[#0F6E5D] shrink-0" />}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500">
              Tick as many as you need — each one becomes its own table in the report.
            </p>
          </div>
        )}

        {/* ---------------- STEP: ACCOUNT HEADS ---------------- */}
        {currentStepConfig.id === "heads" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                {wantsIncome && wantsExpense ? "Income & expense heads" : wantsIncome ? "Income heads" : "Expense heads"}
              </span>
              {selectedHeadIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedHeadIds([])}
                  className="text-[11px] font-bold text-blue-700 hover:underline cursor-pointer"
                >
                  Clear selection
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
              {availableHeads.map((head) => {
                const active = selectedHeadIds.includes(head.id);
                return (
                  <button
                    key={head.id}
                    type="button"
                    onClick={() =>
                      setSelectedHeadIds((prev) =>
                        prev.includes(head.id) ? prev.filter((id) => id !== head.id) : [...prev, head.id]
                      )
                    }
                    className={`px-3 py-2.5 rounded-xl border-2 text-left text-xs font-semibold transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      active ? "border-[#0F6E5D] bg-teal-50 text-teal-900" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <span className="truncate">{head.name}</span>
                    <span className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase ${
                          head.type === HeadType.Income ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {head.type}
                      </span>
                      {active && <Check className="h-3.5 w-3.5 text-[#0F6E5D]" />}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-600">
              {selectedHeadIds.length === 0
                ? "Nothing ticked — the report will include every head."
                : `${selectedHeadIds.length} head${selectedHeadIds.length === 1 ? "" : "s"} selected.`}
            </div>
          </div>
        )}

        {/* ---------------- STEP: RESULT ---------------- */}
        {currentStepConfig.id === "result" && (
          <div className="space-y-5">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
              <span className="flex items-center gap-1.5 text-slate-700">
                <Calendar className="h-3.5 w-3.5 text-[#0F6E5D]" />
                <span className="font-bold">{periodLabel}</span>
              </span>
              <span className="text-slate-600">
                <span className="font-bold text-slate-900">{totalRowCount}</span> total entries
              </span>
              {selectedHeadIds.length > 0 && (
                <span className="text-slate-600">
                  <span className="font-bold text-slate-900">{selectedHeadIds.length}</span> head filter
                </span>
              )}
              <span className="text-slate-500 ml-auto">{scopeLabel}</span>
            </div>

            {currentUser.level !== OrgLevel.Local && selectedFinancialUnitIds.length === 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs font-semibold text-amber-800">
                No chapters were selected, so this report is empty.
              </div>
            )}

            {resultBlocks.map((block) => (
              <div key={block.key} className="space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    {block.title}
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      {block.rows.length} {block.rows.length === 1 ? "entry" : "entries"}
                    </span>
                  </h3>
                  {block.totals.length > 0 && (
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-bold text-slate-700">
                      {block.totals.map((t) => (
                        <span key={t.label}>
                          {t.label}: <span className="text-slate-900 font-black">{formatINR(t.value)}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border border-slate-200 rounded-xl overflow-x-auto">
                  <table className="w-full text-left border-collapse bg-white text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                        {block.columns.map((c) => (
                          <th key={c.label} className={`py-2.5 px-3 whitespace-nowrap ${c.money || c.numeric ? "text-right" : ""}`}>
                            {c.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {block.rows.length === 0 ? (
                        <tr>
                          <td colSpan={block.columns.length} className="py-8 text-center text-slate-400">
                            No {block.title.toLowerCase()} entries in this period.
                          </td>
                        </tr>
                      ) : (
                        block.rows.map((row, idx) => (
                          <tr key={row.id || row.assetId || row.memberId || idx} className="hover:bg-slate-50/40 transition-colors">
                            {block.columns.map((c) => {
                              const v = c.value(row, idx);
                              return (
                                <td
                                  key={c.label}
                                  className={`py-3 px-3 ${
                                    c.money
                                      ? "text-right font-bold text-slate-900 whitespace-nowrap"
                                      : c.numeric
                                      ? "text-right font-mono text-slate-700"
                                      : "text-slate-700"
                                  }`}
                                >
                                  {c.money ? formatINR(Number(v || 0)) : v}
                                </td>
                              );
                            })}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 sm:gap-3">
        <button
          onClick={currentStep === 0 ? onClose : () => setCurrentStep((prev) => prev - 1)}
          className="px-4 sm:px-5 py-2.5 bg-white text-slate-700 font-bold rounded-xl border border-slate-200 hover:bg-slate-100 cursor-pointer text-xs whitespace-nowrap shrink-0"
        >
          {currentStep === 0 ? "Cancel" : "Back"}
        </button>

        {currentStepConfig.id !== "result" ? (
          <button
            disabled={!isStepValid()}
            onClick={() => setCurrentStep((prev) => prev + 1)}
            className="px-5 sm:px-6 py-2.5 bg-[#0F6E5D] text-white font-bold rounded-xl hover:bg-[#0B5548] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all text-xs shadow-sm flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <span>Continue</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <>
            <button
              onClick={handleExportCSV}
              disabled={totalRowCount === 0}
              className="px-4 sm:px-5 py-2.5 bg-white text-slate-800 font-bold rounded-xl border border-slate-300 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-xs flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handleExportPDF}
              disabled={totalRowCount === 0}
              className="px-4 sm:px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-xs flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <FileText className="h-4 w-4" />
              <span>Export PDF</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 sm:px-5 py-2.5 bg-[#0F6E5D] text-white font-bold rounded-xl hover:bg-[#0B5548] cursor-pointer text-xs flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Check className="h-4 w-4" />
              <span>Finish</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
