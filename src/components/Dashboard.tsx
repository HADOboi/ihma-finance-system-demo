/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect, useRef } from "react";
import {
  User,
  AccountHead,
  Transaction,
  HeadType,
  OrgLevel,
  Asset,
  BankBalance,
  ChapterMaster,
  Member,
} from "../types";
import {
  STATES,
  DISTRICTS,
  CHAPTERS,
  PRELOADED_ASSETS,
  PRELOADED_BANK_BALANCES,
  PRELOADED_CHAPTER_DIRECTORY,
  PRELOADED_MEMBERS,
} from "../mockData";
import { formatDateDMY, formatINR } from "../utils/formatters";
import { getFinancialUnitName, getReadableFinancialUnitIds, getUserFinancialUnitId } from "../utils/financialUnits";
import ReportWizard from "./ReportWizard";
import {
  TrendingUp,
  TrendingDown,
  Scale,
  Calendar,
  Filter,
  Check,
  Edit3,
  Trash2,
  FileSpreadsheet,
  Download,
  Info,
  Layers,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  HelpCircle,
  Building2,
  Landmark,
  Users,
  Briefcase,
  X,
  ArrowDownRight,
  ArrowUpRight,
  FileText,
  Receipt,
  BookOpen,
  BarChart3,
  MapPin,
  Sparkles,
  Wallet,
  Banknote,
  Loader2,
} from "lucide-react";

function calculateMemberExpiryDate(membershipDate?: string, membershipType?: string): string {
  if (!membershipDate) return "—";
  const typeLower = (membershipType || "").toLowerCase();
  if (typeLower.includes("platinum") || typeLower.includes("life")) return "Lifelong";
  
  const dateObj = new Date(membershipDate);
  if (isNaN(dateObj.getTime())) return "—";

  if (typeLower.includes("gold")) {
    dateObj.setFullYear(dateObj.getFullYear() + 12);
    return formatDateDMY(dateObj.toISOString().slice(0, 10));
  }
  
  // Default / Silver (+1 year)
  dateObj.setFullYear(dateObj.getFullYear() + 1);
  return formatDateDMY(dateObj.toISOString().slice(0, 10));
}

interface DashboardProps {
  currentUser: User;
  accountHeads: AccountHead[];
  transactions: Transaction[];
  assets?: Asset[];
  bankBalances?: BankBalance[];
  chapterDirectory?: ChapterMaster[];
  members?: Member[];
  loading?: boolean;
  onDeleteTransaction: (id: string) => void;
  onEditTransaction: (tx: Transaction) => void;
  onUpdateTransaction?: (tx: Transaction) => void;
  initialReportTab?: ReportTab;
  onReportTabChange?: (tab: ReportTab) => void;
  activeReportSection?: "summary" | "detailed" | "specific" | null;
  onReportSectionChange?: (section: "summary" | "detailed" | "specific" | null) => void;
  showReportWizard?: boolean;
  onReportWizardChange?: (show: boolean) => void;
  onBackToHome?: () => void;
}

type PeriodType = "year" | "month" | "day" | "custom";

type ReportTab =
  | "heads"
  | "payments"
  | "receipts"
  | "loans"
  | "members"
  | "entity_types"
  | "assets"
  | "bank_balances"
  | "chapters"
  | "monthly"
  | "yearly"
  | "raw";

type GeoFilterKey = "states" | "districts" | "chapters";

interface GeoOption {
  id: string;
  name: string;
  /** Small trailing note, e.g. the district a chapter belongs to. */
  hint?: string;
}

/**
 * Compact multiselect dropdown used for the cascading State / District / Chapter
 * filters. Selection stays in the parent so the existing cascade rules apply.
 */
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
  // Count only what is actually offered, so a stale id can never inflate the label.
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

export default function Dashboard({
  currentUser,
  accountHeads,
  transactions,
  assets = PRELOADED_ASSETS,
  bankBalances = PRELOADED_BANK_BALANCES,
  chapterDirectory = PRELOADED_CHAPTER_DIRECTORY,
  members = PRELOADED_MEMBERS,
  loading = false,
  onDeleteTransaction,
  onEditTransaction,
  onUpdateTransaction,
  initialReportTab,
  onReportTabChange,
  activeReportSection,
  onReportSectionChange,
  showReportWizard: externalShowReportWizard,
  onReportWizardChange,
  onBackToHome,
}: DashboardProps) {
  // Active Section on Reports Page ("summary" | "detailed" | "specific" | null)
  const [reportSection, setReportSection] = useState<"summary" | "detailed" | "specific" | null>(
    activeReportSection !== undefined ? activeReportSection : null
  );

  useEffect(() => {
    if (activeReportSection !== undefined) {
      setReportSection(activeReportSection);
    }
  }, [activeReportSection]);

  const handleSelectSection = (sec: "summary" | "detailed" | "specific" | null) => {
    setReportSection(sec);
    if (onReportSectionChange) {
      onReportSectionChange(sec);
    }
  };
  // --- Date Range / Period State ---
  const [periodType, setPeriodType] = useState<PeriodType>("year");
  
  // Year Selector
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  // Month Selector (0-indexed: 0 = Jan, 11 = Dec)
  const [selectedMonth, setSelectedMonth] = useState<number>(5); // Default to June
  // Day Selector (YYYY-MM-DD)
  const [selectedDay, setSelectedDay] = useState<string>("2026-06-01");
  // Custom Date Range (From Date -> To Date)
  const [startDate, setStartDate] = useState<string>("2026-04-01");
  const [endDate, setEndDate] = useState<string>("2026-06-30");
  const [detailPeriodType, setDetailPeriodType] = useState<PeriodType>("year");
  const [detailYear, setDetailYear] = useState<number>(2026);
  const [detailMonth, setDetailMonth] = useState<number>(5);
  const [detailDay, setDetailDay] = useState<string>("2026-06-01");
  const [detailStartDate, setDetailStartDate] = useState<string>("2026-04-01");
  const [detailEndDate, setDetailEndDate] = useState<string>("2027-03-31");

  // Loan Repayment Modal State
  const [repayModalTx, setRepayModalTx] = useState<Transaction | null>(null);
  const [repaymentAmount, setRepaymentAmount] = useState<number>(0);
  const [repaymentMode, setRepaymentMode] = useState<"Cash" | "Bank">("Cash");
  const [repaymentDate, setRepaymentDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [repaymentRemarks, setRepaymentRemarks] = useState<string>("");

  // --- Hierarchical Filter States ---
  // Nothing is preselected: the user picks what they want to look at. A Local
  // user is the exception, since they get no dropdown to pick with.
  const [selectedStates, setSelectedStates] = useState<string[]>([]);

  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);

  const [selectedChapters, setSelectedChapters] = useState<string[]>(
    currentUser.level === OrgLevel.Local ? [currentUser.nodeId || ""] : []
  );
  const [includeOwnFinancialUnit, setIncludeOwnFinancialUnit] = useState<boolean>(currentUser.level === OrgLevel.Local);

  // Only one geo dropdown is open at a time; clicking outside the row closes it.
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

  // Search filter
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedExpenseHeads, setSelectedExpenseHeads] = useState<string[]>([]);
  const [selectedIncomeHeads, setSelectedIncomeHeads] = useState<string[]>([]);
  const [isHeadFilterOpen, setIsHeadFilterOpen] = useState(false);

  // Report Sheet View Tab
  const [activeReportTab, setActiveReportTab] = useState<ReportTab>(initialReportTab || "payments");
  const [isReportDropdownOpen, setIsReportDropdownOpen] = useState(false);

  const handleSelectReportTab = (tab: ReportTab) => {
    setActiveReportTab(tab);
    if (onReportTabChange) {
      onReportTabChange(tab);
    }
  };

  useEffect(() => {
    if (initialReportTab) {
      setActiveReportTab(initialReportTab);
    }
  }, [initialReportTab]);

  // Toggle for showing detailed reporting sheets
  const [showDetailedReports, setShowDetailedReports] = useState<boolean>(false);

  // Guided step-by-step report builder
  const [internalShowReportWizard, setInternalShowReportWizard] = useState<boolean>(false);
  const showReportWizard = externalShowReportWizard !== undefined ? externalShowReportWizard : internalShowReportWizard;

  const handleSetShowReportWizard = (show: boolean) => {
    if (onReportWizardChange) {
      onReportWizardChange(show);
    } else {
      setInternalShowReportWizard(show);
    }
  };

  const handleCloseReportWizard = () => {
    if (window.location.hash.includes("wizard=true")) {
      window.history.back();
    } else {
      handleSetShowReportWizard(false);
    }
  };

  useEffect(() => {
    if (showReportWizard) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [showReportWizard]);

  // Human-readable description of what this user is allowed to see.
  const scopeLabel = useMemo(() => {
    if (currentUser.level === OrgLevel.National) return "All India Chapter";
    if (currentUser.level === OrgLevel.State) {
      const stateName = STATES.find((s) => s.id === currentUser.nodeId)?.name || "State";
      return stateName.toLowerCase().includes("chapter") ? stateName : `${stateName} Chapter`;
    }
    if (currentUser.level === OrgLevel.District) {
      const distName = DISTRICTS.find((d) => d.id === currentUser.nodeId)?.name || "District";
      return distName.toLowerCase().includes("chapter") ? distName : `${distName} Chapter`;
    }
    const chapName = CHAPTERS.find((c) => c.id === currentUser.nodeId)?.name || "Local Chapter";
    return chapName.toLowerCase().includes("chapter") ? chapName : `${chapName} Chapter`;
  }, [currentUser]);

  const userFinancialUnitId = useMemo(() => getUserFinancialUnitId(currentUser), [currentUser]);
  const readableFinancialUnitIds = useMemo(() => getReadableFinancialUnitIds(currentUser), [currentUser]);

  // --- Dynamic Filtering Lists for UI ---
  // Combine static mock CHAPTERS and Supabase DB chapterDirectory to ensure all chapters/districts work
  const combinedChapters = useMemo(() => {
    const list = [...CHAPTERS];
    const existingIds = new Set(list.map((c) => c.id));

    (chapterDirectory || []).forEach((c) => {
      if (!c.id) return;
      const districtId = c.district ? c.district.toLowerCase().replace(/\s+/g, "_") : "";
      if (!existingIds.has(c.id)) {
        list.push({
          id: c.id,
          name: c.chapterName,
          districtId: districtId,
        });
        existingIds.add(c.id);
      }
    });
    return list;
  }, [chapterDirectory]);

  const combinedDistricts = useMemo(() => {
    const list = [...DISTRICTS];
    const existingIds = new Set(list.map((d) => d.id));

    (chapterDirectory || []).forEach((c) => {
      if (!c.district) return;
      const distId = c.district.toLowerCase().replace(/\s+/g, "_");
      const stateId = c.state ? c.state.toLowerCase().replace(/\s+/g, "_") : "kerala";
      if (!existingIds.has(distId)) {
        list.push({
          id: distId,
          name: c.district,
          stateId: stateId,
        });
        existingIds.add(distId);
      }
    });
    return list;
  }, [chapterDirectory]);

  // Districts available under chosen States
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

  // Chapters available under chosen Districts
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
    // For every level above Local, an empty selection means nothing is picked
    // yet — it must NOT silently fall back to "everything".
    const stateUnits = selectedStates;
    const districtUnits = selectedDistricts;
    const localUnits = selectedChapters;
    const ownUnit = includeOwnFinancialUnit ? [userFinancialUnitId] : [];
    return [...new Set([...ownUnit, ...stateUnits, ...districtUnits, ...localUnits])]
      .filter((id) => readableFinancialUnitIds.includes(id));
  }, [currentUser.level, userFinancialUnitId, includeOwnFinancialUnit, selectedStates, selectedDistricts, selectedChapters, readableFinancialUnitIds]);

  const hasAnyGeoSelection = currentUser.level === OrgLevel.Local
    ? true
    : selectedFinancialUnitIds.length > 0;

  // Handle toggles. Selecting never auto-selects anything downstream — the user
  // picks each level themselves. Deselecting still prunes downstream choices
  // that are no longer reachable, so nothing filters the data invisibly.
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

  const selectAllStates = () => {
    setSelectedStates(STATES.map((s) => s.id));
  };

  const selectNoneStates = () => {
    setSelectedStates([]);
    setSelectedDistricts([]);
    setSelectedChapters([]);
  };

  const selectAllDistricts = () => {
    setSelectedDistricts(availableDistricts.map((d) => d.id));
  };

  const selectNoneDistricts = () => {
    setSelectedDistricts([]);
    // Chapters hang off districts, so clearing districts must clear them too.
    setSelectedChapters([]);
  };

  const selectAllChapters = () => {
    setSelectedChapters(availableChapters.map((c) => c.id));
  };

  const selectNoneChapters = () => {
    setSelectedChapters([]);
  };

  const renderGeoFilters = () => {
    if (currentUser.level === OrgLevel.Local) return null;

    return (
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs mb-4" id="dashboard-filters-container">
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4">
            <div
              ref={geoFilterRef}
              id="geo-filter-row"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 border-b border-slate-100 pb-4"
            >
              <button
                type="button"
                onClick={() => setIncludeOwnFinancialUnit((selected) => !selected)}
                className={`sm:col-span-2 lg:col-span-3 flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border text-left text-xs font-bold cursor-pointer transition-colors ${
                  includeOwnFinancialUnit ? "bg-teal-50 border-teal-300 text-teal-900" : "bg-white border-slate-300 text-slate-700 hover:border-teal-300"
                }`}
              >
                <span>Include {getFinancialUnitName(userFinancialUnitId)}</span>
                <span className={`h-5 w-5 rounded-md border flex items-center justify-center transition-colors ${includeOwnFinancialUnit ? "bg-[#0F6E5D] border-[#0F6E5D] text-white" : "border-slate-300"}`}>
                  {includeOwnFinancialUnit && <Check className="h-3.5 w-3.5" />}
                </span>
              </button>

              {/* National Level View: Select States */}
              {currentUser.level === OrgLevel.National && (
                <MultiSelectFilter
                  label="States"
                  wrapperId="state-selector-wrapper"
                  idPrefix="state-filter"
                  options={STATES.map((s) => ({ id: s.id, name: s.name }))}
                  selectedIds={selectedStates}
                  isOpen={openGeoFilter === "states"}
                  onToggleOpen={() => toggleGeoFilter("states")}
                  onToggleOption={handleStateToggle}
                  onSelectAll={selectAllStates}
                  onClear={selectNoneStates}
                  emptyHint="No states available"
                />
              )}

              {/* National & State View: Select Districts */}
              {(currentUser.level === OrgLevel.National || currentUser.level === OrgLevel.State) && (
                <MultiSelectFilter
                  label="Districts"
                  wrapperId="district-selector-wrapper"
                  idPrefix="district-filter"
                  options={availableDistricts.map((d) => ({ id: d.id, name: d.name }))}
                  selectedIds={selectedDistricts}
                  isOpen={openGeoFilter === "districts"}
                  onToggleOpen={() => toggleGeoFilter("districts")}
                  onToggleOption={handleDistrictToggle}
                  onSelectAll={selectAllDistricts}
                  onClear={selectNoneDistricts}
                  emptyHint="Select a state first"
                />
              )}

              {/* Select Chapters (Visible on National, State, and District levels) */}
              <MultiSelectFilter
                label="Local Chapters"
                wrapperId="chapter-selector-wrapper"
                idPrefix="chapter-filter"
                options={availableChapters.map((c) => ({
                  id: c.id,
                  name: c.name,
                  hint: combinedDistricts.find((d) => d.id === c.districtId)?.name || DISTRICTS.find((d) => d.id === c.districtId)?.name || "",
                }))}
                selectedIds={selectedChapters}
                isOpen={openGeoFilter === "chapters"}
                onToggleOpen={() => toggleGeoFilter("chapters")}
                onToggleOption={handleChapterToggle}
                onSelectAll={selectAllChapters}
                onClear={selectNoneChapters}
                emptyHint={currentUser.level === OrgLevel.District ? "No local chapters in this district" : "Select a district first"}
              />
            </div>

            {!hasAnyGeoSelection && (
              <div id="no-geo-selection-notice" className="flex items-center gap-2.5 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-xs font-semibold text-amber-800">
                <Info className="h-4 w-4 shrink-0" />
                Select at least one state, district or chapter above to view data. Nothing is shown until you make a selection.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const filterTransactions = (
    period: PeriodType, year: number, month: number, day: string, from: string, to: string, includeSearch = false
  ) => transactions.filter((tx) => {
      // 1. Organizational chapter filter
      if (!selectedFinancialUnitIds.includes(tx.financialUnitId || tx.chapterId)) {
        return false;
      }

      // 2. Date/Period Filter
      if (!tx.date) return false;
      const dateStr = tx.date.slice(0, 10);
      const parts = dateStr.split("-");
      const txYear = parts.length > 0 ? parseInt(parts[0], 10) : 0;
      const txMonth = parts.length > 1 ? parseInt(parts[1], 10) - 1 : 0;

      if (period === "year") {
        // Indian Financial Year: April of selectedYear to March of selectedYear + 1
        const startStr = `${year}-04-01`;
        const endStr = `${year + 1}-03-31`;
        if (dateStr < startStr || dateStr > endStr) {
          return false;
        }
      } else if (period === "month") {
        // Specific Month in selected Year
        if (txYear !== year || txMonth !== month) {
          return false;
        }
      } else if (period === "day") {
        // Specific Day YYYY-MM-DD
        if (dateStr !== day) {
          return false;
        }
      } else if (period === "custom") {
        if (from && dateStr < from) return false;
        if (to && dateStr > to) return false;
      }

      // 3. Optional Search Text (remarks or voucher)
      if (includeSearch && searchTerm.trim() !== "") {
        const term = searchTerm.toLowerCase();
        const searchDesc = (tx.description || "").toLowerCase();
        const searchVouch = (tx.voucherNumber || "").toLowerCase();
        const searchHead = (tx.headName || "").toLowerCase();
        if (!searchDesc.includes(term) && !searchVouch.includes(term) && !searchHead.includes(term)) {
          return false;
        }
      }

      return true;
    });

  // Summary and Detailed Report deliberately have independent date ranges.
  const filteredTransactions = useMemo(
    () => filterTransactions(periodType, selectedYear, selectedMonth, selectedDay, startDate, endDate),
    [transactions, selectedChapters, periodType, selectedYear, selectedMonth, selectedDay, startDate, endDate]
  );
  const detailedTransactions = useMemo(
    () => filterTransactions(detailPeriodType, detailYear, detailMonth, detailDay, detailStartDate, detailEndDate, true),
    [transactions, selectedChapters, detailPeriodType, detailYear, detailMonth, detailDay, detailStartDate, detailEndDate, searchTerm]
  );

  // --- Summary Metrics Computations (Cash vs Bank & Income vs Expense Breakdown) ---
  const summaryMetrics = useMemo(() => {
    let actualIncomeCash = 0;
    let actualIncomeBank = 0;
    let loanRepaidCash = 0;
    let loanRepaidBank = 0;

    let actualExpenseCash = 0;
    let actualExpenseBank = 0;
    let loansGivenCash = 0;
    let loansGivenBank = 0;

    filteredTransactions.forEach((tx) => {
      const isCash = tx.paymentMode === "Cash";

      if (tx.type === HeadType.Income) {
        const amt = tx.paidAmount !== undefined ? tx.paidAmount : tx.amount;
        if (isCash) {
          actualIncomeCash += amt;
        } else {
          actualIncomeBank += amt;
        }
      } else if (tx.type === HeadType.Expense) {
        const amt = tx.paidAmount !== undefined ? tx.paidAmount : tx.amount;
        if (isCash) {
          actualExpenseCash += amt;
        } else {
          actualExpenseBank += amt;
        }
      } else if (tx.type === HeadType.Loan) {
        // Loan given is an outflow/expense
        if (isCash) {
          loansGivenCash += tx.amount;
        } else {
          loansGivenBank += tx.amount;
        }

        // Loan repayment received is an inflow/income
        const returnedAmt = tx.amountReturned || 0;
        if (returnedAmt > 0) {
          const isRepaidCash = tx.repaymentPaymentMode ? tx.repaymentPaymentMode === "Cash" : isCash;
          if (isRepaidCash) {
            loanRepaidCash += returnedAmt;
          } else {
            loanRepaidBank += returnedAmt;
          }
        }
      }
    });

    const totalIncomeCash = actualIncomeCash + loanRepaidCash;
    const totalIncomeBank = actualIncomeBank + loanRepaidBank;
    const totalIncomeGrand = totalIncomeCash + totalIncomeBank;

    const totalExpenseCash = actualExpenseCash + loansGivenCash;
    const totalExpenseBank = actualExpenseBank + loansGivenBank;
    const totalExpenseGrand = totalExpenseCash + totalExpenseBank;

    const netCashBalance = totalIncomeCash - totalExpenseCash;
    const netBankBalance = totalIncomeBank - totalExpenseBank;
    const netTotalBalance = totalIncomeGrand - totalExpenseGrand;

    return {
      actualIncomeCash,
      actualIncomeBank,
      actualIncomeTotal: actualIncomeCash + actualIncomeBank,
      loanRepaidCash,
      loanRepaidBank,
      loanRepaidTotal: loanRepaidCash + loanRepaidBank,
      totalIncomeCash,
      totalIncomeBank,
      totalIncomeGrand,

      actualExpenseCash,
      actualExpenseBank,
      actualExpenseTotal: actualExpenseCash + actualExpenseBank,
      loansGivenCash,
      loansGivenBank,
      loansGivenTotal: loansGivenCash + loansGivenBank,
      totalExpenseCash,
      totalExpenseBank,
      totalExpenseGrand,

      netCashBalance,
      netBankBalance,
      netTotalBalance,
    };
  }, [filteredTransactions]);

  const { totalIncome, totalExpense, netBalance } = useMemo(() => {
    return {
      totalIncome: summaryMetrics.totalIncomeGrand,
      totalExpense: summaryMetrics.totalExpenseGrand,
      netBalance: summaryMetrics.netTotalBalance,
    };
  }, [summaryMetrics]);

  // --- Aggregated Monthly Summary Sheet Logic ---
  // Groups by Head and displays aggregated details including smart compressed Voucher lists!
  const aggregatedReportRows = useMemo(() => {
    const headMap: Record<
      string,
      { headId: string; headName: string; type: HeadType; total: number; vouchers: string[] }
    > = {};

    // Seed all active account heads to make sure they display in report format
    accountHeads.forEach((head) => {
      if (head.isActive) {
        headMap[head.id] = {
          headId: head.id,
          headName: head.name,
          type: head.type,
          total: 0,
          vouchers: [],
        };
      }
    });

    // Populate data
    filteredTransactions.forEach((tx) => {
      // Exclude loans from standard monthly aggregated table
      if (tx.type === HeadType.Loan) return;

      // Ensure the head is in the list (could be deleted, disabled, or a manual
      // entry with no headId at all — fall back to a stable key built from the
      // transaction's own stored headName so it never collides with others).
      const headKey = tx.headId || `custom_${tx.type}_${tx.headName || "general"}`;
      if (!headMap[headKey]) {
        headMap[headKey] = {
          headId: headKey,
          headName: tx.headName || "General Head",
          type: tx.type,
          total: 0,
          vouchers: [],
        };
      }

      headMap[headKey].total += tx.amount;
      if (tx.voucherNumber) {
        headMap[headKey].vouchers.push(tx.voucherNumber);
      }
    });

    // Smart Voucher List Compressor:
    // Takes something like ["RV-101", "RV-102", "RV-103", "RV-105"]
    // and compresses to "RV 101-103, RV 105"
    const compressVouchers = (vouchers: string[]) => {
      if (vouchers.length === 0) return "—";
      // Remove duplicates and sort
      const uniqueVouchers = Array.from(new Set(vouchers)).sort((a, b) => {
        return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
      });

      // Let's try to group them sequentially if they have a consistent prefix (e.g., "RV-101" or "RV 101")
      // Extract prefix vs numbers
      const regex = /^([A-Za-z- ]+)?(\d+)$/;
      const parsed = uniqueVouchers.map((v) => {
        const match = v.match(regex);
        if (match) {
          return {
            original: v,
            prefix: match[1] || "",
            num: parseInt(match[2], 10),
          };
        }
        return { original: v, prefix: null, num: NaN };
      });

      const resultParts: string[] = [];
      let i = 0;

      while (i < parsed.length) {
        const current = parsed[i];
        if (current.prefix === null || isNaN(current.num)) {
          // Can't sequence this one, output directly
          resultParts.push(current.original);
          i++;
          continue;
        }

        let start = i;
        let end = i;

        while (
          end + 1 < parsed.length &&
          parsed[end + 1].prefix === current.prefix &&
          parsed[end + 1].num === parsed[end].num + 1
        ) {
          end++;
        }

        if (end > start) {
          // Found sequence! E.g. RV-101 to RV-103
          resultParts.push(`${current.prefix || ""}${current.num}-${parsed[end].num}`);
          i = end + 1;
        } else {
          resultParts.push(current.original);
          i++;
        }
      }

      return resultParts.join(", ");
    };

    return Object.values(headMap).map((row) => ({
      ...row,
      voucherString: compressVouchers(row.vouchers),
    }));
  }, [filteredTransactions, accountHeads]);

  // --- Year-Summary matrix grid ---
  // Indian Financial year starts in April, ends in March
  const monthsSequence = [3, 4, 5, 6, 7, 8, 9, 10, 11, 0, 1, 2]; // Apr=3, May=4, ..., Mar=2
  const monthLabels = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

  const yearlyMatrix = useMemo(() => {
    const headRowMap: Record<string, { headId: string; headName: string; type: HeadType; monthlyTotals: number[]; grandTotal: number }> = {};

    accountHeads.forEach((head) => {
      if (head.isActive) {
        headRowMap[head.id] = {
          headId: head.id,
          headName: head.name,
          type: head.type,
          monthlyTotals: new Array(12).fill(0),
          grandTotal: 0,
        };
      }
    });

    // We process all transactions for the selected year range regardless of periodType state (as this is an annual matrix report)
    transactions.forEach((tx) => {
      // Filter by selected chapters
      if (!selectedFinancialUnitIds.includes(tx.financialUnitId || tx.chapterId)) return;

      // Exclude loans from standard financial matrix
      if (tx.type === HeadType.Loan) return;

      if (!tx.date) return;
      const parts = tx.date.slice(0, 10).split("-");
      if (parts.length < 3) return;
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1; // 0 for Jan, 3 for Apr
      const fy = m >= 3 ? y : y - 1;

      if (fy === selectedYear) {
        const headKey = tx.headId || `custom_${tx.type}_${tx.headName || "general"}`;
        if (!headRowMap[headKey]) {
          headRowMap[headKey] = {
            headId: headKey,
            headName: tx.headName || "General Head",
            type: tx.type || HeadType.Expense,
            monthlyTotals: new Array(12).fill(0),
            grandTotal: 0,
          };
        }

        // find position in Indian financial year array [3, 4, ..., 2]
        const colIndex = monthsSequence.indexOf(m);
        if (colIndex !== -1) {
          headRowMap[headKey].monthlyTotals[colIndex] += (tx.amount || 0);
          headRowMap[headKey].grandTotal += (tx.amount || 0);
        }
      }
    });

    return Object.values(headRowMap);
  }, [transactions, selectedFinancialUnitIds, selectedYear, accountHeads]);

  // Derived filtered collections for specific sheets.
  // Loan disbursements are cash/bank outflows, so they belong in Payments alongside
  // expenses; loan repayments are inflows and are surfaced in Receipts below. The
  // Loan Registry tab still tracks the full lifecycle with outstanding balances.
  const filteredPayments = useMemo(() => {
    return detailedTransactions.filter((tx) =>
      (tx.type === HeadType.Expense &&
        (selectedExpenseHeads.length === 0 || selectedExpenseHeads.includes(tx.headId))) ||
      (tx.type === HeadType.Loan && selectedExpenseHeads.length === 0)
    );
  }, [detailedTransactions, selectedExpenseHeads]);

  const filteredReceipts = useMemo(() => {
    const income = detailedTransactions.filter((tx) =>
      tx.type === HeadType.Income &&
      (selectedIncomeHeads.length === 0 || selectedIncomeHeads.includes(tx.headId))
    );

    // Surface each repayment as its own receipt row, dated on the repayment.
    const repayments =
      selectedIncomeHeads.length === 0
        ? detailedTransactions
            .filter((tx) => tx.type === HeadType.Loan && (tx.amountReturned || 0) > 0)
            .map((tx) => ({
              ...tx,
              id: `${tx.id}_repayment`,
              date: tx.repaymentDate || tx.loanReturnedDate || tx.date,
              headName: "Loan Repayment",
              amount: tx.amountReturned || 0,
              offeredAmount: tx.amount,
              paidAmount: tx.amountReturned || 0,
              balanceAmount: tx.loanBalance ?? tx.amount - (tx.amountReturned || 0),
              paidBy: tx.paidToName || tx.paidTo,
              collectedBy: tx.createdBy,
              paymentMode: tx.repaymentPaymentMode || tx.paymentMode,
              isLoanRepayment: true,
            }))
        : [];

    return [...income, ...repayments].sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [detailedTransactions, selectedIncomeHeads]);

  const filteredLoans = useMemo(() => {
    return detailedTransactions.filter(tx => tx.type === HeadType.Loan);
  }, [detailedTransactions]);

  // Detailed directory records use the displayed chapter ID (for example,
  // "KL-EK-CO01"), while transactions use the internal ID ("cochin").
  // Build the allowed displayed IDs and names from the currently scoped chapters
  // so every report observes the same national/state/district/local boundary.
  const allowedChapterDirectoryIds = useMemo(() => {
    const allowedNames = new Set(
      CHAPTERS.filter((chapter) => selectedChapters.includes(chapter.id)).map((chapter) => chapter.name)
    );
    return new Set(
      chapterDirectory
        .filter((chapter) => allowedNames.has(chapter.chapterName))
        .map((chapter) => chapter.id)
    );
  }, [chapterDirectory, selectedChapters]);

  const isChapterInScope = (chapterId?: string, chapterName?: string) =>
    selectedFinancialUnitIds.includes(chapterId || "") ||
    allowedChapterDirectoryIds.has(chapterId || "") ||
    CHAPTERS.some(
      (chapter) => selectedChapters.includes(chapter.id) && chapter.name === chapterName
    );

  const filteredMembers = useMemo(() => {
    const scopedMembers = members.filter((member) =>
      isChapterInScope(member.chapterIdInput, member.chapterNameInput)
    );
    if (!searchTerm.trim()) return scopedMembers;
    const term = searchTerm.toLowerCase();
    return scopedMembers.filter(
      (m) =>
        m.memberName.toLowerCase().includes(term) ||
        m.memberId.toLowerCase().includes(term) ||
        m.chapterNameInput.toLowerCase().includes(term) ||
        m.qualification.toLowerCase().includes(term) ||
        m.email.toLowerCase().includes(term) ||
        m.mobileNumber.toLowerCase().includes(term)
    );
  }, [members, searchTerm, selectedFinancialUnitIds, allowedChapterDirectoryIds]);

  const filteredAssets = useMemo(() => {
    const scopedAssets = assets.filter((asset) =>
      isChapterInScope(asset.financialUnitId || asset.chapterIdInput, asset.chapterNameInput)
    );
    if (!searchTerm.trim()) return scopedAssets;
    const term = searchTerm.toLowerCase();
    return scopedAssets.filter(
      (a) =>
        a.assetName.toLowerCase().includes(term) ||
        a.assetId.toLowerCase().includes(term) ||
        a.category.toLowerCase().includes(term) ||
        a.custodianName.toLowerCase().includes(term) ||
        a.chapterNameInput.toLowerCase().includes(term)
    );
  }, [assets, searchTerm, selectedFinancialUnitIds, allowedChapterDirectoryIds]);

  const filteredBankBalances = useMemo(() => {
    // FD only — liquid bank balances are no longer tracked in this register.
    const scopedBankBalances = bankBalances.filter(
      (balance) =>
        balance.amountType === "FD" &&
        isChapterInScope(balance.financialUnitId || balance.chapterIdInput, balance.chapterNameInput)
    );
    if (!searchTerm.trim()) return scopedBankBalances;
    const term = searchTerm.toLowerCase();
    return scopedBankBalances.filter(
      (b) =>
        b.chapterNameInput.toLowerCase().includes(term) ||
        b.chapterIdInput.toLowerCase().includes(term) ||
        b.amountType.toLowerCase().includes(term)
    );
  }, [bankBalances, searchTerm, selectedFinancialUnitIds, allowedChapterDirectoryIds]);

  const filteredChapters = useMemo(() => {
    const scopedChapters = chapterDirectory.filter((chapter) =>
      isChapterInScope(chapter.id, chapter.chapterName)
    );
    if (!searchTerm.trim()) return scopedChapters;
    const term = searchTerm.toLowerCase();
    return scopedChapters.filter(
      (c) =>
        c.chapterName.toLowerCase().includes(term) ||
        c.id.toLowerCase().includes(term) ||
        c.state.toLowerCase().includes(term) ||
        c.district.toLowerCase().includes(term) ||
        c.presidentName.toLowerCase().includes(term) ||
        c.treasurerName.toLowerCase().includes(term) ||
        c.email.toLowerCase().includes(term)
    );
  }, [chapterDirectory, searchTerm, selectedChapters, allowedChapterDirectoryIds]);

  // Export to simple CSV helper
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";

    if (activeReportTab === "payments") {
      csvContent += "Sl. No.,Chapter ID Number,Chapter Name,Date,Paid By,Paid To,Accounts Head,Payable Amount,Paid Amount,Balance Amount,Mode of Payment,Remarks\n";
      filteredPayments.forEach((tx, idx) => {
        csvContent += `${idx + 1},"${tx.chapterIdInput || tx.chapterId}","${tx.chapterNameInput || tx.chapterId}","${tx.date}","${tx.paidByExpense || tx.createdBy}","${tx.paidToName || tx.paidTo || ""}","${tx.type === HeadType.Loan ? "Loan" : tx.headName}",${tx.payableAmount || tx.amount},${tx.paidAmount || tx.amount},${tx.type === HeadType.Loan ? (tx.loanBalance || 0) : (tx.balanceAmount || 0)},"${tx.paymentMode || "Cash"}","${(tx.remarks || tx.description || "").replace(/"/g, '""')}"\n`;
      });
    } else if (activeReportTab === "receipts") {
      csvContent += "Sl. No.,Chapter ID No.,Chapter Name,Date,Collected By,Paid By Name,Accounts Head,Offered Amount,Paid Amount,Balance Amount,Payment Mode,Remarks,Paid By Member ID\n";
      filteredReceipts.forEach((tx, idx) => {
        csvContent += `${idx + 1},"${tx.chapterIdInput || tx.chapterId}","${tx.chapterNameInput || tx.chapterId}","${tx.date}","${tx.collectedBy || ""}","${tx.paidBy || ""}","${tx.headName}",${tx.offeredAmount || tx.amount},${tx.paidAmount || tx.amount},${tx.balanceAmount || 0},"${tx.paymentMode || "Bank"}","${(tx.remarks || tx.description || "").replace(/"/g, '""')}","${tx.paidByMemberId || ""}"\n`;
      });
    } else if (activeReportTab === "loans") {
      csvContent += "Sl. No.,Chapter ID No.,Chapter Name,Date,Paid To,Paid To ID,Member/Chapter Name,Particulars,Amount,Amount Returned,Loan Balance,Loan Return Date,Loan Returned Date,Remarks\n";
      filteredLoans.forEach((tx, idx) => {
        const bal = tx.loanBalance !== undefined ? tx.loanBalance : (tx.amount - (tx.amountReturned || 0));
        csvContent += `${idx + 1},"${tx.chapterIdInput || tx.chapterId}","${tx.chapterNameInput || tx.chapterId}","${tx.date}","${tx.paidTo || ""}","${tx.paidToId || ""}","${tx.paidToName || ""}","${(tx.particulars || tx.description || "").replace(/"/g, '""')}",${tx.amount},${tx.amountReturned || 0},${bal},"${tx.loanReturnDate || ""}","${tx.loanReturnedDate || ""}","${(tx.remarks || "").replace(/"/g, '""')}"\n`;
      });
    } else if (activeReportTab === "members") {
      csvContent += "Sl. No.,Member ID Number,Member Name,Chapter ID No.,Chapter Name,Member Qualification,Membership Type,Membership Date,Expiry Date,Membership Status,Mobile Number,WhatsApp Number,Email Address,Office/Clinic Number\n";
      filteredMembers.forEach((m, idx) => {
        csvContent += `${idx + 1},"${m.memberId}","${m.memberName}","${m.chapterIdInput}","${m.chapterNameInput}","${m.qualification}","${m.membershipType}","${m.membershipDate}","${calculateMemberExpiryDate(m.membershipDate, m.membershipType)}","${m.membershipStatus}","${m.mobileNumber}","${m.whatsappNumber}","${m.email}","${m.clinicNumber}"\n`;
      });
    } else if (activeReportTab === "entity_types") {
      csvContent += "Sl. No.,Entity Type,Purpose / Scope\n";
      csvContent += '1,"National Chapter","Apex governing entity representing IHMA nationwide"\n';
      csvContent += '2,"State Chapter","State-level administrative division governing districts"\n';
      csvContent += '3,"District Chapter","District-level administrative unit managing local chapters"\n';
      csvContent += '4,"Local Chapter","Local grassroots operational chapter executing CME & finances"\n';
      csvContent += '5,"Sub-Committee","Specialized functional or project committee appointed by chapter"\n';
    } else if (activeReportTab === "assets") {
      csvContent += "Sl. No.,Date,Chapter ID No.,Chapter Name,Asset Number/ID,Asset Name,Asset Purchase Date,No. of Items,Price Per Item,Total Value,Payment Mode,Asset Category,Asset Life,Custodian Name,Depreciation Per Year,Net Amount,Remarks\n";
      filteredAssets.forEach((a, idx) => {
        csvContent += `${idx + 1},"${a.date}","${a.chapterIdInput}","${a.chapterNameInput}","${a.assetId}","${a.assetName}","${a.purchaseDate}",${a.quantity ?? 1},${a.assetValue},${a.totalValue ?? a.assetValue},"${a.paymentMode || ""}","${a.category}",${a.assetLife},"${a.custodianName}",${a.depreciationAmount ?? 0},${a.netAmount ?? a.totalValue ?? a.assetValue},"${a.remarks || ""}"\n`;
      });
    } else if (activeReportTab === "bank_balances") {
      csvContent += "Sl. No.,Date,Chapter ID No.,Chapter Name,Bank Account Number,Bank Name,Bank Branch,Branch Address,Bank Contact,Deposited By,FD Amount,Maturity Date,Remarks\n";
      filteredBankBalances.forEach((b, idx) => {
        csvContent += `${idx + 1},"${b.date}","${b.chapterIdInput}","${b.chapterNameInput}","${b.bankAccountNumber || ""}","${b.bankName || ""}","${b.bankBranch || ""}","${(b.bankAddress || "").replace(/"/g, '""')}","${b.bankContactNumber || ""}","${b.depositedBy || ""}",${b.amount},"${b.maturityDate || ""}","${(b.remarks || "").replace(/"/g, '""')}"\n`;
      });
    } else if (activeReportTab === "chapters") {
      csvContent += "Sl. No.,Chapter ID,Chapter Name,State,District,Chapter Address,President ID,President Name,VP ID,VP Name,General Secretary ID,General Secretary Name,Treasurer ID,Treasurer Name,Contact No.,WhatsApp No.,Office No.,Email ID,Formation Date\n";
      filteredChapters.forEach((c, idx) => {
        csvContent += `${idx + 1},"${c.id}","${c.chapterName}","${c.state}","${c.district}","${c.chapterAddress}","${c.presidentId}","${c.presidentName}","${c.vpId}","${c.vpName}","${c.secretaryId}","${c.secretaryName}","${c.treasurerId}","${c.treasurerName}","${c.contactNo}","${c.whatsappNo}","${c.officeNo}","${c.email}","${c.formationDate}"\n`;
      });
    } else if (activeReportTab === "monthly") {
      csvContent += "Category Type,Account Head,Consolidated Vouchers,Total Amount (INR)\n";
      aggregatedReportRows.forEach((row) => {
        csvContent += `"${row.type}","${row.headName}","${row.voucherString}",${row.total}\n`;
      });
    } else if (activeReportTab === "yearly") {
      csvContent += `Account Head,Type,${monthLabels.join(",")},Grand Total\n`;
      yearlyMatrix.forEach((row) => {
        csvContent += `"${row.headName}","${row.type}",${row.monthlyTotals.join(",")},${row.grandTotal}\n`;
      });
    } else {
      csvContent += "Date,Type,Category,Amount,Voucher,Remarks,Chapter,Recorded By\n";
      detailedTransactions.forEach((tx) => {
        const chapName = CHAPTERS.find((c) => c.id === tx.chapterId)?.name || tx.chapterId;
        csvContent += `"${tx.date}","${tx.type}","${tx.headName}",${tx.amount},"${tx.voucherNumber || ""}","${tx.description || ""}","${chapName}","${tx.createdBy}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `IHMA_Ledger_${activeReportTab}_sheet.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Loading Indicator Banner */}
      {loading && (
        <div className="bg-blue-50/80 border border-blue-200 text-blue-800 px-4 py-3 rounded-2xl flex items-center justify-between shadow-xs animate-pulse" id="reports-loading-banner">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-blue-900">Synchronizing with Supabase...</p>
              <p className="text-[11px] text-blue-700">Fetching latest transactions, chapters, and ledger data.</p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-semibold bg-blue-100/80 text-blue-800 px-2 py-0.5 rounded-md">
            Loading data...
          </span>
        </div>
      )}

      {/* LANDING HEADER BAR */}
      {!reportSection && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs" id="dashboard-header-container">
          <div className="flex flex-wrap items-center gap-2">
            {onBackToHome && (
              <button
                type="button"
                onClick={onBackToHome}
                id="back-to-home-button"
                className="inline-flex items-center gap-2 h-9 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shrink-0 cursor-pointer"
                aria-label="Back to home"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </button>
            )}

            <div className="flex flex-wrap items-center gap-1.5 sm:ml-auto">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200 text-[11px] font-bold">
                {scopeLabel}
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-50 text-slate-700 border border-slate-200 text-[11px] font-bold">
                {currentUser.level}
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-[11px] font-bold">
                {currentUser.role === "Treasurer" ? "Treasurer (R/W)" : `${currentUser.role} (RO)`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* LANDING VIEW: 3 CARDS */}
      {!reportSection && (
        <div className="space-y-6 pt-2">
          <div className="text-center py-2">
            <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900">
              Financial Reports & Statements
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* 1. Summary Card */}
            <button
              onClick={() => handleSelectSection("summary")}
              id="report-card-summary"
              className="group bg-white p-5 rounded-2xl border border-emerald-100 shadow-xs hover:shadow-md hover:border-emerald-500 transition-all text-left flex flex-col justify-between cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                  📊
                </div>
                <ChevronRight className="h-5 w-5 text-emerald-600 group-hover:translate-x-1 transition-transform" />
              </div>
              <div className="mt-5">
                <h3 className="font-bold text-base text-slate-900 group-hover:text-emerald-800 transition-colors">
                  Summary
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Financial summary statements, cash vs bank breakdown, and surplus/deficit balances.
                </p>
              </div>
            </button>

            {/* 2. Detailed Report Card */}
            <button
              onClick={() => handleSelectSection("detailed")}
              id="report-card-detailed"
              className="group bg-white p-5 rounded-2xl border border-blue-100 shadow-xs hover:shadow-md hover:border-blue-500 transition-all text-left flex flex-col justify-between cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                  📑
                </div>
                <ChevronRight className="h-5 w-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
              </div>
              <div className="mt-5">
                <h3 className="font-bold text-base text-slate-900 group-hover:text-blue-800 transition-colors">
                  Detailed Report
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Full ledger sheets for Payments, Receipts, Loans, Members, Assets, and FDs.
                </p>
              </div>
            </button>

            {/* 3. Specific Report Card */}
            <button
              onClick={() => handleSelectSection("specific")}
              id="report-card-specific"
              className="group bg-white p-5 rounded-2xl border border-teal-100 shadow-xs hover:shadow-md hover:border-teal-500 transition-all text-left flex flex-col justify-between cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                  ✨
                </div>
                <ChevronRight className="h-5 w-5 text-teal-600 group-hover:translate-x-1 transition-transform" />
              </div>
              <div className="mt-5">
                <h3 className="font-bold text-base text-slate-900 group-hover:text-teal-800 transition-colors">
                  Specific Report
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Guided step-by-step report builder for customized period and account head exports.
                </p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* SECTION 1: SUMMARY */}
      {reportSection === "summary" && (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2 border-b border-slate-200 pb-3">
          <div className="flex justify-start">
            <button
              type="button"
              onClick={() => handleSelectSection(null)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-xl font-bold text-xs shadow-2xs cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Reports</span>
            </button>
          </div>
          <h2 className="text-base font-bold text-emerald-950 text-center">Summary</h2>
          <div className="flex sm:justify-end">
            <span className="text-xs font-semibold text-slate-500">
              {periodType === "year" && `Financial Year ${selectedYear}-${(selectedYear + 1).toString().slice(2)}`}
              {periodType === "month" && `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][selectedMonth]} ${selectedYear}`}
              {periodType === "day" && formatDateDMY(selectedDay)}
              {periodType === "custom" && `${formatDateDMY(startDate)} to ${formatDateDMY(endDate)}`}
            </span>
          </div>
        </div>

        {renderGeoFilters()}

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 sm:p-4 flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="flex items-center gap-2 shrink-0"><Calendar className="h-4 w-4 text-blue-600" /><span className="text-xs font-bold text-slate-800">Summary period</span></div>
          <div className="flex flex-wrap gap-1 bg-white border border-slate-200 rounded-xl p-1">{(["year", "month", "day", "custom"] as PeriodType[]).map((type) => <button key={type} type="button" onClick={() => setPeriodType(type)} className={`px-2.5 py-1 text-[11px] font-bold rounded-lg capitalize ${periodType === type ? "bg-blue-600 text-white" : "text-slate-600"}`}>{type}</button>)}</div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {(periodType === "year" || periodType === "month") && <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-semibold"><option value={2026}>2026–27</option><option value={2025}>2025–26</option><option value={2024}>2024–25</option></select>}
            {periodType === "month" && <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white">{["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m, i) => <option key={m} value={i}>{m}</option>)}</select>}
            {periodType === "day" && <input type="date" value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)} className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white" />}
            {periodType === "custom" && <><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white" /><span>to</span><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white" /></>}
          </div>
        </div>

        {/* SUMMARY TABLES GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* 1. RECEIPTS SUMMARY TABLE */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-4 py-3 bg-emerald-50/80 border-b border-emerald-100 flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                <span>💰</span> Receipts (Income)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                    <th className="py-2.5 px-4 font-bold text-slate-600">DETAIL</th>
                    <th className="py-2.5 px-4 text-right font-bold text-slate-600">CASH</th>
                    <th className="py-2.5 px-4 text-right font-bold text-slate-600">BANK</th>
                    <th className="py-2.5 px-4 text-right font-bold text-slate-700 bg-slate-100/60">TOTAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-4 font-semibold text-slate-800">Actual Receipts (Income)</td>
                    <td className="py-2.5 px-4 text-right font-mono">{formatINR(summaryMetrics.actualIncomeCash)}</td>
                    <td className="py-2.5 px-4 text-right font-mono">{formatINR(summaryMetrics.actualIncomeBank)}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900 bg-slate-50/60">
                      {formatINR(summaryMetrics.actualIncomeTotal)}
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-4 font-semibold text-slate-800">Loan Repayments Received</td>
                    <td className="py-2.5 px-4 text-right font-mono">
                      {summaryMetrics.loanRepaidCash > 0 ? formatINR(summaryMetrics.loanRepaidCash) : "—"}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono">
                      {summaryMetrics.loanRepaidBank > 0 ? formatINR(summaryMetrics.loanRepaidBank) : "—"}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-800 bg-slate-50/60">
                      {summaryMetrics.loanRepaidTotal > 0 ? formatINR(summaryMetrics.loanRepaidTotal) : "—"}
                    </td>
                  </tr>
                  <tr className="bg-emerald-50/60 font-black text-emerald-950 border-t-2 border-emerald-200">
                    <td className="py-3 px-4 uppercase text-[11px] tracking-wider">Total Receipts (Income)</td>
                    <td className="py-3 px-4 text-right font-mono">{formatINR(summaryMetrics.totalIncomeCash)}</td>
                    <td className="py-3 px-4 text-right font-mono">{formatINR(summaryMetrics.totalIncomeBank)}</td>
                    <td className="py-3 px-4 text-right font-mono text-sm bg-emerald-100/70 text-emerald-950">
                      {formatINR(summaryMetrics.totalIncomeGrand)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. PAYMENTS SUMMARY TABLE */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-4 py-3 bg-rose-50/80 border-b border-rose-100 flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-rose-950 flex items-center gap-1.5">
                <span>💸</span> Payments (Expense)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                    <th className="py-2.5 px-4 font-bold text-slate-600">DETAIL</th>
                    <th className="py-2.5 px-4 text-right font-bold text-slate-600">CASH</th>
                    <th className="py-2.5 px-4 text-right font-bold text-slate-600">BANK</th>
                    <th className="py-2.5 px-4 text-right font-bold text-slate-700 bg-slate-100/60">TOTAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-4 font-semibold text-slate-800">Actual Payments (Expense)</td>
                    <td className="py-2.5 px-4 text-right font-mono">{formatINR(summaryMetrics.actualExpenseCash)}</td>
                    <td className="py-2.5 px-4 text-right font-mono">{formatINR(summaryMetrics.actualExpenseBank)}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900 bg-slate-50/60">
                      {formatINR(summaryMetrics.actualExpenseTotal)}
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-4 font-semibold text-slate-800">Loan Payments</td>
                    <td className="py-2.5 px-4 text-right font-mono">
                      {summaryMetrics.loansGivenCash > 0 ? formatINR(summaryMetrics.loansGivenCash) : "—"}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono">
                      {summaryMetrics.loansGivenBank > 0 ? formatINR(summaryMetrics.loansGivenBank) : "—"}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-rose-800 bg-slate-50/60">
                      {summaryMetrics.loansGivenTotal > 0 ? formatINR(summaryMetrics.loansGivenTotal) : "—"}
                    </td>
                  </tr>
                  <tr className="bg-rose-50/60 font-black text-rose-950 border-t-2 border-rose-200">
                    <td className="py-3 px-4 uppercase text-[11px] tracking-wider">Total Payments (Expense)</td>
                    <td className="py-3 px-4 text-right font-mono">{formatINR(summaryMetrics.totalExpenseCash)}</td>
                    <td className="py-3 px-4 text-right font-mono">{formatINR(summaryMetrics.totalExpenseBank)}</td>
                    <td className="py-3 px-4 text-right font-mono text-sm bg-rose-100/70 text-rose-950">
                      {formatINR(summaryMetrics.totalExpenseGrand)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* CASH & BANK NET BREAKDOWN CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex justify-between items-center">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cash in Hand</span>
              <span className={`text-base font-black ${summaryMetrics.netCashBalance >= 0 ? "text-slate-900" : "text-rose-700"}`}>
                {formatINR(summaryMetrics.netCashBalance)}
              </span>
            </div>
            <span className="p-2 bg-amber-50 text-amber-700 rounded-lg">
              <Wallet className="h-5 w-5" />
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex justify-between items-center">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cash at Bank</span>
              <span className={`text-base font-black ${summaryMetrics.netBankBalance >= 0 ? "text-slate-900" : "text-rose-700"}`}>
                {formatINR(summaryMetrics.netBankBalance)}
              </span>
            </div>
            <span className="p-2 bg-blue-50 text-blue-700 rounded-lg">
              <Landmark className="h-5 w-5" />
            </span>
          </div>

          <div className="bg-slate-900 text-white border border-slate-800 rounded-xl p-3.5 shadow-xs flex justify-between items-center">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Surplus / Deficit</span>
              <span className={`text-base font-black ${summaryMetrics.netTotalBalance >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {summaryMetrics.netTotalBalance >= 0 ? "+" : ""}{formatINR(summaryMetrics.netTotalBalance)}
              </span>
            </div>
            <span className="p-2 bg-slate-800 text-emerald-400 rounded-lg">
              <Scale className="h-5 w-5" />
            </span>
          </div>
        </div>
      </div>
      )}

      {/* SECTION 2: DETAILED REPORTS */}
      {reportSection === "detailed" && (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2 border-b border-slate-200 pb-3">
          <div className="flex justify-start">
            <button
              type="button"
              onClick={() => handleSelectSection(null)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-xl font-bold text-xs shadow-2xs cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Reports</span>
            </button>
          </div>
          <h2 className="text-base font-bold text-emerald-950 text-center">Detailed Report</h2>
          <div className="flex sm:justify-end">
            <span className="text-xs font-semibold text-slate-500">
              {detailPeriodType === "year" && `Financial Year ${detailYear}-${(detailYear + 1).toString().slice(2)}`}
              {detailPeriodType === "month" && `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][detailMonth]} ${detailYear}`}
              {detailPeriodType === "day" && formatDateDMY(detailDay)}
              {detailPeriodType === "custom" && `${formatDateDMY(detailStartDate)} to ${formatDateDMY(detailEndDate)}`}
            </span>
          </div>
        </div>

        {renderGeoFilters()}

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 sm:p-4 flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <Calendar className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-800">Report period</span>
          </div>
          <div className="flex flex-wrap gap-1 bg-white border border-slate-200 rounded-xl p-1">
            {(["year", "month", "day", "custom"] as PeriodType[]).map((type) => (
              <button key={type} type="button" onClick={() => setDetailPeriodType(type)} className={`px-2.5 py-1 text-[11px] font-bold rounded-lg capitalize ${detailPeriodType === type ? "bg-blue-600 text-white" : "text-slate-600"}`}>{type}</button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {(detailPeriodType === "year" || detailPeriodType === "month") && <select value={detailYear} onChange={(e) => setDetailYear(Number(e.target.value))} className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-semibold"><option value={2026}>2026–27</option><option value={2025}>2025–26</option><option value={2024}>2024–25</option></select>}
            {detailPeriodType === "month" && <select value={detailMonth} onChange={(e) => setDetailMonth(Number(e.target.value))} className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white">{["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m, i) => <option key={m} value={i}>{m}</option>)}</select>}
            {detailPeriodType === "day" && <input type="date" value={detailDay} onChange={(e) => setDetailDay(e.target.value)} className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white" />}
            {detailPeriodType === "custom" && <><input type="date" value={detailStartDate} onChange={(e) => setDetailStartDate(e.target.value)} className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white" /><span>to</span><input type="date" value={detailEndDate} onChange={(e) => setDetailEndDate(e.target.value)} className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white" /></>}
          </div>
        </div>

        {/* ACTIVE SHEET CONTAINER */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs">
          {/* Sheets Nav & Actions */}
          <div className="bg-slate-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 rounded-t-2xl relative z-20">
            <div className="flex items-center gap-2.5 w-full lg:max-w-md">
              <span className="text-slate-500 text-[11px] sm:text-xs font-bold uppercase tracking-wider shrink-0 hidden sm:inline">
                Account heads:
              </span>

              {/* CUSTOM STYLED DROPDOWN */}
              {(() => {
                const reportTabOptions = [
                  { id: "payments" as ReportTab, label: "Payments (Expense)", icon: ArrowUpRight, count: `${filteredPayments.length} entries` },
                  { id: "receipts" as ReportTab, label: "Receipts (Income)", icon: ArrowDownRight, count: `${filteredReceipts.length} entries` },
                  { id: "loans" as ReportTab, label: "Internal Loans Details", icon: Briefcase, count: `${filteredLoans.length} loans` },
                  { id: "members" as ReportTab, label: "Member Details", icon: Users, count: `${filteredMembers.length} doctors` },
                  { id: "chapters" as ReportTab, label: "Chapter Details", icon: MapPin, count: `${filteredChapters.length} chapters` },
                  { id: "assets" as ReportTab, label: "Asset Details", icon: Building2, count: `${filteredAssets.length} assets` },
                  { id: "bank_balances" as ReportTab, label: "Fixed Deposit Details", icon: Landmark, count: `${filteredBankBalances.length} FDs` },
                ];

                const currentOpt = reportTabOptions.find((o) => o.id === activeReportTab) || reportTabOptions[0];
                const CurrentIcon = currentOpt.icon;

                return (
                  <div className="relative w-full">
                    <button
                      type="button"
                      id="report-sheet-selector"
                      onClick={() => setIsReportDropdownOpen(!isReportDropdownOpen)}
                      className="w-full flex items-center justify-between gap-2 px-3.5 py-2 bg-white border border-slate-300 rounded-xl shadow-2xs hover:border-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all text-xs font-bold text-slate-800 cursor-pointer"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <div className="p-1 rounded-lg bg-blue-50 text-blue-700 shrink-0">
                          <CurrentIcon className="h-4 w-4" />
                        </div>
                        <span className="truncate">{currentOpt.label}</span>
                        <span className="px-2 py-0.5 text-[10px] font-extrabold bg-slate-100 text-slate-600 rounded-md shrink-0">
                          {currentOpt.count}
                        </span>
                      </div>
                      <ChevronDown className={`h-4 w-4 text-slate-400 shrink-0 transition-transform ${isReportDropdownOpen ? "rotate-180" : ""}`} />
                    </button>

                    {isReportDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setIsReportDropdownOpen(false)}
                        />
                        <div className="absolute top-full left-0 mt-2 w-full sm:w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden max-h-96 overflow-y-auto p-1.5 space-y-0.5">
                          {reportTabOptions.map((opt) => {
                            const OptIcon = opt.icon;
                            const isSelected = activeReportTab === opt.id;

                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => {
                                  handleSelectReportTab(opt.id);
                                  setIsReportDropdownOpen(false);
                                }}
                                className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                                  isSelected
                                    ? "bg-blue-50 text-blue-900 font-bold"
                                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <OptIcon className={`h-4 w-4 shrink-0 ${isSelected ? "text-blue-600" : "text-slate-400"}`} />
                                  <span className="truncate">{opt.label}</span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className={`px-2 py-0.5 text-[10px] rounded-md font-bold ${
                                    isSelected ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-500"
                                  }`}>
                                    {opt.count}
                                  </span>
                                  {isSelected && <Check className="h-4 w-4 text-blue-600 shrink-0" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                );
              })()}
            </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            {(activeReportTab === "payments" || activeReportTab === "receipts") && (
              <div className="relative w-full lg:w-64">
                <button type="button" onClick={() => setIsHeadFilterOpen((open) => !open)} className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 shadow-2xs hover:border-blue-400">
                  <span>{activeReportTab === "payments" ? "Expense heads" : "Income heads"} {((activeReportTab === "payments" ? selectedExpenseHeads : selectedIncomeHeads).length > 0) && `(${(activeReportTab === "payments" ? selectedExpenseHeads : selectedIncomeHeads).length})`}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${isHeadFilterOpen ? "rotate-180" : ""}`} />
                </button>
                {isHeadFilterOpen && (
                  <div className="absolute right-0 z-30 mt-2 w-full bg-white rounded-xl border border-slate-200 shadow-xl p-2 space-y-1 max-h-64 overflow-y-auto">
                    {accountHeads.filter((head) => head.type === (activeReportTab === "payments" ? HeadType.Expense : HeadType.Income)).map((head) => {
                      const selection = activeReportTab === "payments" ? selectedExpenseHeads : selectedIncomeHeads;
                      const checked = selection.includes(head.id);
                      return <label key={head.id} className="flex items-center gap-2 px-2 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"><input type="checkbox" checked={checked} onChange={() => { const next = checked ? selection.filter((id) => id !== head.id) : [...selection, head.id]; activeReportTab === "payments" ? setSelectedExpenseHeads(next) : setSelectedIncomeHeads(next); }} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />{head.name}</label>;
                    })}
                    <button type="button" onClick={() => { activeReportTab === "payments" ? setSelectedExpenseHeads([]) : setSelectedIncomeHeads([]); }} className="w-full pt-1 text-[11px] font-bold text-blue-700 hover:underline">Clear selection</button>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleExportCSV}
              id="export-csv-btn"
              className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-xs px-3 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer shrink-0 ml-auto lg:ml-0"
              title="Download spreadsheet report"
            >
              <Download className="h-4 w-4" />
              Export (CSV)
            </button>
            <button onClick={() => window.print()} className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-3 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer shrink-0" title="Print or save as PDF"><FileText className="h-4 w-4" />Export (PDF)</button>
          </div>
        </div>

        {/* Interactive Sheets Workspace */}
        <div className="p-4 sm:p-6">
          {/* SHEET 1: PAYMENTS (EXPENSES) */}
          {activeReportTab === "payments" && (
            <div className="space-y-4">
              <div className="border border-slate-200 rounded-xl overflow-x-auto">
                <table className="w-full text-left border-collapse bg-white text-xs" id="payments-sheet-table">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                      <th className="py-2.5 px-3">Sl. No.</th>
                      <th className="py-2.5 px-3">Voucher No.</th>
                      <th className="py-2.5 px-3">Chapter ID</th>
                      <th className="py-2.5 px-3">Chapter Name</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Paid By</th>
                      <th className="py-2.5 px-3">Paid To</th>
                      <th className="py-2.5 px-3">Accounts Head</th>
                      <th className="py-2.5 px-3 text-right">Payable (₹)</th>
                      <th className="py-2.5 px-3 text-right">Paid (₹)</th>
                      <th className="py-2.5 px-3 text-right">Balance (₹)</th>
                      <th className="py-2.5 px-3">Payment Mode</th>
                      <th className="py-2.5 px-3">Remarks</th>
                      {false && (
                        <th className="py-2.5 px-3 text-center">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredPayments.length === 0 ? (
                      <tr>
                        <td colSpan={14} className="py-8 text-center text-slate-400">
                          No payment entries match the selected filters.
                        </td>
                      </tr>
                    ) : (
                      filteredPayments.map((tx, idx) => {
                        const chapterName = CHAPTERS.find((c) => c.id === tx.chapterId)?.name || tx.chapterIdInput || tx.chapterId;
                        const isEditable = currentUser.role === "Admin" || (currentUser.role === "Treasurer" && tx.chapterId === currentUser.nodeId);
                        
                        return (
                          <tr key={tx.id} className="hover:bg-slate-50/40 transition-colors">
                            <td className="py-3 px-3 font-mono font-bold text-slate-500">{idx + 1}</td>
                            <td className="py-3 px-3 font-mono text-slate-700 font-semibold">{tx.voucherNumber || "—"}</td>
                            <td className="py-3 px-3 font-mono text-slate-600">{tx.chapterIdInput || tx.chapterId}</td>
                            <td className="py-3 px-3 font-semibold text-slate-800">{chapterName}</td>
                            <td className="py-3 px-3 font-mono text-slate-600 whitespace-nowrap">{tx.date ? formatDateDMY(tx.date) : "—"}</td>
                            <td className="py-3 px-3 font-medium text-slate-700">{tx.paidByExpense || (tx.type === HeadType.Loan ? tx.chapterNameInput || tx.chapterId : tx.createdBy)}</td>
                            <td className="py-3 px-3 font-medium text-slate-800">{tx.paidToName || tx.paidTo || "—"}</td>
                            <td className="py-3 px-3">
                              {tx.type === HeadType.Loan ? (
                                <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide">
                                  <Briefcase className="h-3 w-3" />
                                  Loan
                                </span>
                              ) : (
                                <span className="font-semibold text-rose-800">{tx.headName}</span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right font-medium text-slate-600">{formatINR((tx.payableAmount || tx.amount))}</td>
                            <td className="py-3 px-3 text-right font-bold text-rose-900">{formatINR((tx.paidAmount || tx.amount))}</td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-slate-600">
                              {tx.type === HeadType.Loan ? formatINR((tx.loanBalance || 0)) : formatINR((tx.balanceAmount || 0))}
                            </td>
                            <td className="py-3 px-3">
                              <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full text-[10px] uppercase">
                                {tx.paymentMode || "Cash"}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-slate-500 max-w-xs truncate" title={tx.remarks || undefined}>{tx.remarks || "—"}</td>
                            {false && (
                              <td className="py-3 px-3 text-center">
                                {isEditable ? (
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      onClick={() => onEditTransaction(tx)}
                                      className="p-1 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-md cursor-pointer transition-all"
                                      title="Edit Payment"
                                    >
                                      <Edit3 className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (confirm("Delete this payment record?")) {
                                          onDeleteTransaction(tx.id);
                                        }
                                      }}
                                      className="p-1 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-md cursor-pointer transition-all"
                                      title="Delete Payment"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-slate-400 italic">Locked</span>
                                )}
                              </td>
                            )}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SHEET 2: RECEIPTS (INCOME) */}
          {activeReportTab === "receipts" && (
            <div className="space-y-4">
              <div className="border border-slate-200 rounded-xl overflow-x-auto">
                <table className="w-full text-left border-collapse bg-white text-xs" id="receipts-sheet-table">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                      <th className="py-2.5 px-3">Sl. No.</th>
                      <th className="py-2.5 px-3">Voucher No.</th>
                      <th className="py-2.5 px-3">Chapter ID</th>
                      <th className="py-2.5 px-3">Chapter Name</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Collected By</th>
                      <th className="py-2.5 px-3">Paid By Name</th>
                      <th className="py-2.5 px-3">Accounts Head</th>
                      <th className="py-2.5 px-3 text-right">Offered (₹)</th>
                      <th className="py-2.5 px-3 text-right">Paid Amount (₹)</th>
                      <th className="py-2.5 px-3 text-right">Balance (₹)</th>
                      <th className="py-2.5 px-3">Payment Mode</th>
                      <th className="py-2.5 px-3">Remarks</th>
                      {false && (
                        <th className="py-2.5 px-3 text-center">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredReceipts.length === 0 ? (
                      <tr>
                        <td colSpan={14} className="py-8 text-center text-slate-400">
                          No receipt entries match the selected filters.
                        </td>
                      </tr>
                    ) : (
                      filteredReceipts.map((tx, idx) => {
                        const chapterName = CHAPTERS.find((c) => c.id === tx.chapterId)?.name || tx.chapterIdInput || tx.chapterId;
                        const isEditable = currentUser.role === "Admin" || (currentUser.role === "Treasurer" && tx.chapterId === currentUser.nodeId);
                        
                        return (
                          <tr key={tx.id} className="hover:bg-slate-50/40 transition-colors">
                            <td className="py-3 px-3 font-mono font-bold text-slate-500">{idx + 1}</td>
                            <td className="py-3 px-3 font-mono text-slate-700 font-semibold">{tx.voucherNumber || "—"}</td>
                            <td className="py-3 px-3 font-mono text-slate-600">{tx.chapterIdInput || tx.chapterId}</td>
                            <td className="py-3 px-3 font-semibold text-slate-800">{chapterName}</td>
                            <td className="py-3 px-3 font-mono text-slate-600 whitespace-nowrap">{tx.date ? formatDateDMY(tx.date) : "—"}</td>
                            <td className="py-3 px-3 font-medium text-slate-700">{tx.collectedBy || tx.createdBy}</td>
                            <td className="py-3 px-3 font-semibold text-slate-800">{tx.paidBy || "—"}</td>
                            <td className="py-3 px-3">
                              {(tx as any).isLoanRepayment ? (
                                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide">
                                  <Briefcase className="h-3 w-3" />
                                  Loan Repayment
                                </span>
                              ) : (
                                <span className="font-semibold text-blue-800">{tx.headName}</span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right font-medium text-slate-600">{formatINR((tx.offeredAmount || tx.amount))}</td>
                            <td className="py-3 px-3 text-right font-bold text-blue-900">{formatINR((tx.paidAmount || tx.amount))}</td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-slate-600">{formatINR((tx.balanceAmount || 0))}</td>
                            <td className="py-3 px-3">
                              <span className="bg-blue-50 text-blue-800 font-bold px-2 py-0.5 rounded-full text-[10px] uppercase border border-blue-100">
                                {tx.paymentMode || "Bank"}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-slate-500 max-w-xs truncate" title={tx.remarks || undefined}>{tx.remarks || "—"}</td>
                            {false && (
                              <td className="py-3 px-3 text-center">
                                {isEditable ? (
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      onClick={() => onEditTransaction(tx)}
                                      className="p-1 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-md cursor-pointer transition-all"
                                      title="Edit Receipt"
                                    >
                                      <Edit3 className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (confirm("Delete this receipt record?")) {
                                          onDeleteTransaction(tx.id);
                                        }
                                      }}
                                      className="p-1 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-md cursor-pointer transition-all"
                                      title="Delete Receipt"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-slate-400 italic">Locked</span>
                                )}
                              </td>
                            )}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SHEET 3: LOANS REGISTRY */}
          {activeReportTab === "loans" && (
            <div className="space-y-4">
              <div className="border border-slate-200 rounded-xl overflow-x-auto">
                <table className="w-full text-left border-collapse bg-white text-xs" id="loans-sheet-table">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                      <th className="py-2.5 px-3">Sl. No.</th>
                      <th className="py-2.5 px-3">Voucher No.</th>
                      <th className="py-2.5 px-3">Chapter ID</th>
                      <th className="py-2.5 px-3">Chapter Name</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Paid To</th>
                      <th className="py-2.5 px-3">Paid To ID</th>
                      <th className="py-2.5 px-3">Particulars</th>
                      <th className="py-2.5 px-3">Mode</th>
                      <th className="py-2.5 px-3 text-right">Loan Amount (₹)</th>
                      <th className="py-2.5 px-3 text-right">Returned (₹)</th>
                      <th className="py-2.5 px-3 text-right">Loan Balance (₹)</th>
                      <th className="py-2.5 px-3">Target Return Date</th>
                      <th className="py-2.5 px-3">Remarks</th>
                      {false && (
                        <th className="py-2.5 px-3 text-center">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredLoans.length === 0 ? (
                      <tr>
                        <td colSpan={14} className="py-8 text-center text-slate-400">
                          No active loan records match the selected filters.
                        </td>
                      </tr>
                    ) : (
                      filteredLoans.map((tx, idx) => {
                        const chapterName = CHAPTERS.find((c) => c.id === tx.chapterId)?.name || tx.chapterIdInput || tx.chapterId;
                        const isEditable = currentUser.role === "Admin" || (currentUser.role === "Treasurer" && tx.chapterId === currentUser.nodeId);
                        const bal = tx.loanBalance !== undefined ? tx.loanBalance : (tx.amount - (tx.amountReturned || 0));

                        return (
                          <tr key={tx.id} className="hover:bg-slate-50/40 transition-colors">
                            <td className="py-3 px-3 font-mono font-bold text-slate-500">{idx + 1}</td>
                            <td className="py-3 px-3 font-mono text-slate-700 font-semibold">{tx.voucherNumber || "—"}</td>
                            <td className="py-3 px-3 font-mono text-slate-600">{tx.chapterIdInput || tx.chapterId}</td>
                            <td className="py-3 px-3 font-semibold text-slate-800">{chapterName}</td>
                            <td className="py-3 px-3 font-mono text-slate-600 whitespace-nowrap">{tx.date ? formatDateDMY(tx.date) : "—"}</td>
                            <td className="py-3 px-3 font-semibold text-slate-800">{tx.paidTo || tx.paidToName || "—"}</td>
                            <td className="py-3 px-3 font-mono font-bold text-slate-700">{tx.paidToId || "—"}</td>
                            <td className="py-3 px-3 text-slate-600 max-w-xs truncate" title={tx.particulars || tx.description}>{tx.particulars || tx.description || "—"}</td>
                            <td className="py-3 px-3">
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full border border-slate-200 shrink-0 whitespace-nowrap">
                                  Out: {tx.paymentMode || "Cash"}
                                </span>
                                {tx.amountReturned && tx.amountReturned > 0 ? (
                                  <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200 shrink-0 whitespace-nowrap">
                                    In: {tx.repaymentPaymentMode || tx.paymentMode || "Cash"}
                                  </span>
                                ) : null}
                              </div>
                            </td>
                            <td className="py-3 px-3 text-right font-bold text-slate-900">{formatINR(tx.amount)}</td>
                            <td className="py-3 px-3 text-right font-medium text-emerald-700">{formatINR((tx.amountReturned || 0))}</td>
                            <td className="py-3 px-3 text-right font-black text-indigo-900">{formatINR(bal)}</td>
                            <td className="py-3 px-3 font-mono text-slate-600 whitespace-nowrap">{tx.loanReturnDate ? formatDateDMY(tx.loanReturnDate) : "—"}</td>
                            <td className="py-3 px-3 text-slate-500 max-w-xs truncate">{tx.remarks || "—"}</td>
                            {false && (
                              <td className="py-3 px-3 text-center">
                                {isEditable ? (
                                  <div className="flex items-center justify-center gap-1.5">
                                    {bal > 0 && (
                                      <button
                                        onClick={() => {
                                          setRepayModalTx(tx);
                                          setRepaymentAmount(bal);
                                          setRepaymentMode("Cash");
                                          setRepaymentDate(new Date().toISOString().slice(0, 10));
                                          setRepaymentRemarks("");
                                        }}
                                        className="px-2 py-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg cursor-pointer transition-all flex items-center gap-1 shrink-0"
                                        title="Log Loan Repayment"
                                      >
                                        <ArrowDownRight className="h-3 w-3 text-emerald-600" />
                                        <span>Repay</span>
                                      </button>
                                    )}
                                    <button
                                      onClick={() => onEditTransaction(tx)}
                                      className="p-1 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-md cursor-pointer transition-all"
                                      title="Edit Loan"
                                    >
                                      <Edit3 className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (confirm("Delete this loan record?")) {
                                          onDeleteTransaction(tx.id);
                                        }
                                      }}
                                      className="p-1 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-md cursor-pointer transition-all"
                                      title="Delete Loan"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-slate-400 italic">Locked</span>
                                )}
                              </td>
                            )}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SHEET 4: MEMBERS DIRECTORY */}
          {activeReportTab === "members" && (
            <div className="space-y-4">
              <div className="border border-slate-200 rounded-xl overflow-x-auto">
                <table className="w-full text-left border-collapse bg-white text-xs" id="members-sheet-table">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                      <th className="py-2.5 px-3">Sl. No.</th>
                      <th className="py-2.5 px-3">Member ID</th>
                      <th className="py-2.5 px-3">Member Name</th>
                      <th className="py-2.5 px-3">Chapter ID</th>
                      <th className="py-2.5 px-3">Chapter Name</th>
                      <th className="py-2.5 px-3">Qualification</th>
                      <th className="py-2.5 px-3">Membership Type</th>
                      <th className="py-2.5 px-3">Membership Date</th>
                      <th className="py-2.5 px-3">Expiry Date</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Mobile No.</th>
                      <th className="py-2.5 px-3">WhatsApp No.</th>
                      <th className="py-2.5 px-3">Email Address</th>
                      <th className="py-2.5 px-3">Office/Clinic No.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredMembers.length === 0 ? (
                      <tr>
                        <td colSpan={14} className="py-8 text-center text-slate-400">
                          No member records match the search parameters.
                        </td>
                      </tr>
                    ) : (
                      filteredMembers.map((m, idx) => (
                        <tr key={m.memberId} className="hover:bg-slate-50/40 transition-colors">
                          <td className="py-3 px-3 font-mono font-bold text-slate-500">{idx + 1}</td>
                          <td className="py-3 px-3 font-mono font-bold text-emerald-800">{m.memberId}</td>
                          <td className="py-3 px-3 font-bold text-slate-900">{m.memberName}</td>
                          <td className="py-3 px-3 font-mono text-slate-600">{m.chapterIdInput}</td>
                          <td className="py-3 px-3 font-semibold text-slate-800">{m.chapterNameInput}</td>
                          <td className="py-3 px-3 text-slate-600 font-medium">{m.qualification}</td>
                          <td className="py-3 px-3 font-semibold text-blue-700">{m.membershipType}</td>
                          <td className="py-3 px-3 font-mono text-slate-600 whitespace-nowrap">{m.membershipDate ? formatDateDMY(m.membershipDate) : "—"}</td>
                          <td className="py-3 px-3 font-mono text-emerald-700 font-bold whitespace-nowrap">{calculateMemberExpiryDate(m.membershipDate, m.membershipType)}</td>
                          <td className="py-3 px-3">
                            <span className="bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-full text-[10px] uppercase border border-emerald-200">
                              {m.membershipStatus}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-700">{m.mobileNumber}</td>
                          <td className="py-3 px-3 font-mono text-slate-700">{m.whatsappNumber}</td>
                          <td className="py-3 px-3 font-mono text-blue-600">{m.email}</td>
                          <td className="py-3 px-3 font-mono text-slate-600">{m.clinicNumber}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SHEET 5: ENTITY TYPES TAXONOMY */}
          {activeReportTab === "entity_types" && (
            <div className="space-y-4">
              <div className="border border-slate-200 rounded-xl overflow-x-auto">
                <table className="w-full text-left border-collapse bg-white text-xs" id="entity-types-sheet-table">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                      <th className="py-2.5 px-4 w-20">Sl. No.</th>
                      <th className="py-2.5 px-4 min-w-[200px]">Entity Type</th>
                      <th className="py-2.5 px-4">Administrative Purpose & Governance Scope</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    <tr className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-500">1</td>
                      <td className="py-3.5 px-4 font-bold text-purple-900">National Chapter</td>
                      <td className="py-3.5 px-4 text-slate-600 leading-relaxed">
                        Apex governing entity representing IHMA nationwide. Manages national policy, central funds, national CME programs, and national executive oversight.
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-500">2</td>
                      <td className="py-3.5 px-4 font-bold text-blue-900">State Chapter</td>
                      <td className="py-3.5 px-4 text-slate-600 leading-relaxed">
                        State-level administrative division governing districts within the state. Oversees state CME conferences, district coordination, and state audit consolidation.
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-500">3</td>
                      <td className="py-3.5 px-4 font-bold text-indigo-900">District Chapter</td>
                      <td className="py-3.5 px-4 text-slate-600 leading-relaxed">
                        District-level administrative unit managing local chapters across a designated district territory.
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-500">4</td>
                      <td className="py-3.5 px-4 font-bold text-emerald-900">Local Chapter</td>
                      <td className="py-3.5 px-4 text-slate-600 leading-relaxed">
                        Grassroots operational chapter executing local monthly CME meetings, member fee collection, local event expenditures, and primary ledger entries.
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-500">5</td>
                      <td className="py-3.5 px-4 font-bold text-amber-900">Sub-Committee</td>
                      <td className="py-3.5 px-4 text-slate-600 leading-relaxed">
                        Specialized functional or project committee appointed by chapter executive bodies for specific tasks (e.g. Building Fund Committee, CME Organising Committee).
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SHEET 6: ASSET REGISTER */}
          {activeReportTab === "assets" && (
            <div className="space-y-4">
              <div className="border border-slate-200 rounded-xl overflow-x-auto">
                <table className="w-full text-left border-collapse bg-white text-xs" id="assets-sheet-table">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                      <th className="py-2.5 px-3">Sl. No.</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Chapter ID</th>
                      <th className="py-2.5 px-3">Chapter Name</th>
                      <th className="py-2.5 px-3">Asset ID</th>
                      <th className="py-2.5 px-3">Asset Name</th>
                      <th className="py-2.5 px-3">Purchase Date</th>
                      <th className="py-2.5 px-3 text-right">No. of Items</th>
                      <th className="py-2.5 px-3 text-right">Price / Item (₹)</th>
                      <th className="py-2.5 px-3 text-right">Total Value (₹)</th>
                      <th className="py-2.5 px-3">Payment Mode</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3 text-right">Life (Years)</th>
                      <th className="py-2.5 px-3">Custodian Name</th>
                      <th className="py-2.5 px-3 text-right">Deprec. / Year (₹)</th>
                      <th className="py-2.5 px-3 text-right">Net Amount (₹)</th>
                      <th className="py-2.5 px-3">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredAssets.length === 0 ? (
                      <tr>
                        <td colSpan={17} className="py-8 text-center text-slate-400">
                          No asset entries match the search parameters.
                        </td>
                      </tr>
                    ) : (
                      filteredAssets.map((a, idx) => (
                        <tr key={a.assetId} className="hover:bg-slate-50/40 transition-colors">
                          <td className="py-3 px-3 font-mono font-bold text-slate-500">{idx + 1}</td>
                          <td className="py-3 px-3 font-mono text-slate-600 whitespace-nowrap">{a.date ? formatDateDMY(a.date) : "—"}</td>
                          <td className="py-3 px-3 font-mono text-slate-600">{a.chapterIdInput}</td>
                          <td className="py-3 px-3 font-semibold text-slate-800">{a.chapterNameInput}</td>
                          <td className="py-3 px-3 font-mono font-bold text-amber-800">{a.assetId}</td>
                          <td className="py-3 px-3 font-bold text-slate-900">{a.assetName}</td>
                          <td className="py-3 px-3 font-mono text-slate-600 whitespace-nowrap">{a.purchaseDate ? formatDateDMY(a.purchaseDate) : "—"}</td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-slate-700">{a.quantity ?? 1}</td>
                          <td className="py-3 px-3 text-right font-semibold text-slate-700">{formatINR(a.assetValue)}</td>
                          <td className="py-3 px-3 text-right font-black text-slate-900">{formatINR((a.totalValue ?? a.assetValue))}</td>
                          <td className="py-3 px-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              a.paymentMode === "Bank" ? "bg-sky-50 text-sky-800 border border-sky-200" : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            }`}>
                              {a.paymentMode || "—"}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-semibold text-blue-700">{a.category}</td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-slate-700">{a.assetLife}</td>
                          <td className="py-3 px-3 font-medium text-slate-800">{a.custodianName}</td>
                          <td className="py-3 px-3 text-right font-bold text-rose-700">{formatINR((a.depreciationAmount ?? 0))}</td>
                          <td className="py-3 px-3 text-right font-black text-sky-800">{formatINR((a.netAmount ?? a.totalValue ?? a.assetValue))}</td>
                          <td className="py-3 px-3 text-slate-600 italic">{a.remarks || "—"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SHEET 7: FD REGISTER */}
          {activeReportTab === "bank_balances" && (
            <div className="space-y-4">
              <div className="border border-slate-200 rounded-xl overflow-x-auto">
                <table className="w-full text-left border-collapse bg-white text-xs" id="bank-balances-sheet-table">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                      <th className="py-2.5 px-4 w-16">Sl. No.</th>
                      <th className="py-2.5 px-4">Date</th>
                      <th className="py-2.5 px-4">Chapter ID</th>
                      <th className="py-2.5 px-4">Chapter Name</th>
                      <th className="py-2.5 px-4">Bank Account No.</th>
                      <th className="py-2.5 px-4">Bank Name</th>
                      <th className="py-2.5 px-4">Bank Branch</th>
                      <th className="py-2.5 px-4">Branch Address</th>
                      <th className="py-2.5 px-4">Bank Contact</th>
                      <th className="py-2.5 px-4">Deposited By</th>
                      <th className="py-2.5 px-4 text-right">FD Amount (₹)</th>
                      <th className="py-2.5 px-4">Maturity Date</th>
                      <th className="py-2.5 px-4">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredBankBalances.length === 0 ? (
                      <tr>
                        <td colSpan={13} className="py-8 text-center text-slate-400">
                          No FD records match the search parameters.
                        </td>
                      </tr>
                    ) : (
                      filteredBankBalances.map((b, idx) => (
                        <tr key={`${b.chapterIdInput}_${idx}`} className="hover:bg-slate-50/40 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-slate-500">{idx + 1}</td>
                          <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">{b.date ? formatDateDMY(b.date) : "—"}</td>
                          <td className="py-3 px-4 font-mono text-slate-600">{b.chapterIdInput}</td>
                          <td className="py-3 px-4 font-semibold text-slate-800">{b.chapterNameInput}</td>
                          <td className="py-3 px-4 font-mono text-slate-700">{b.bankAccountNumber || "—"}</td>
                          <td className="py-3 px-4 font-semibold text-slate-800">{b.bankName || "—"}</td>
                          <td className="py-3 px-4 text-slate-700">{b.bankBranch || "—"}</td>
                          <td className="py-3 px-4 text-slate-600 text-[11px]">{b.bankAddress || "—"}</td>
                          <td className="py-3 px-4 text-slate-600">{b.bankContactNumber || "—"}</td>
                          <td className="py-3 px-4 font-medium text-slate-800">{b.depositedBy || "—"}</td>
                          <td className="py-3 px-4 text-right font-black text-slate-900 text-sm">{formatINR(b.amount)}</td>
                          <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">{b.maturityDate ? formatDateDMY(b.maturityDate) : "—"}</td>
                          <td className="py-3 px-4 text-slate-600 italic">{b.remarks || "—"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SHEET 8: CHAPTER DIRECTORY / MASTER */}
          {activeReportTab === "chapters" && (
            <div className="space-y-4">
              <div className="border border-slate-200 rounded-xl overflow-x-auto">
                <table className="w-full text-left border-collapse bg-white text-xs" id="chapters-sheet-table">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                      <th className="py-2.5 px-3">Sl. No.</th>
                      <th className="py-2.5 px-3">Chapter ID</th>
                      <th className="py-2.5 px-3">Chapter Name</th>
                      <th className="py-2.5 px-3">State</th>
                      <th className="py-2.5 px-3">District</th>
                      <th className="py-2.5 px-3">President (ID & Name)</th>
                      <th className="py-2.5 px-3">Vice President</th>
                      <th className="py-2.5 px-3">Gen. Secretary</th>
                      <th className="py-2.5 px-3">Treasurer</th>
                      <th className="py-2.5 px-3">Contact / WhatsApp</th>
                      <th className="py-2.5 px-3">Email ID</th>
                      <th className="py-2.5 px-3">Formation Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredChapters.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="py-8 text-center text-slate-400">
                          No chapter entries match the search parameters.
                        </td>
                      </tr>
                    ) : (
                      filteredChapters.map((ch, idx) => (
                        <tr key={ch.id} className="hover:bg-slate-50/40 transition-colors">
                          <td className="py-3 px-3 font-mono font-bold text-slate-500">{idx + 1}</td>
                          <td className="py-3 px-3 font-mono font-bold text-blue-800">{ch.id}</td>
                          <td className="py-3 px-3 font-bold text-slate-900">{ch.chapterName}</td>
                          <td className="py-3 px-3 text-slate-600">{ch.state}</td>
                          <td className="py-3 px-3 text-slate-600">{ch.district}</td>
                          <td className="py-3 px-3 font-medium text-slate-800">
                            <span className="font-mono text-[10px] text-slate-400">{ch.presidentId}</span> {ch.presidentName}
                          </td>
                          <td className="py-3 px-3 font-medium text-slate-800">
                            <span className="font-mono text-[10px] text-slate-400">{ch.vpId}</span> {ch.vpName}
                          </td>
                          <td className="py-3 px-3 font-medium text-slate-800">
                            <span className="font-mono text-[10px] text-slate-400">{ch.secretaryId}</span> {ch.secretaryName}
                          </td>
                          <td className="py-3 px-3 font-medium text-slate-800">
                            <span className="font-mono text-[10px] text-slate-400">{ch.treasurerId}</span> {ch.treasurerName}
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-700">{ch.contactNo}</td>
                          <td className="py-3 px-3 font-mono text-blue-600">{ch.email}</td>
                          <td className="py-3 px-3 font-mono text-slate-600 whitespace-nowrap">{ch.formationDate ? formatDateDMY(ch.formationDate) : "—"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB A: AGGREGATED MONTHLY SUMMARY SHEET */}
          {activeReportTab === "monthly" && (
            <div className="space-y-4">
              <div className="border border-slate-200 rounded-xl overflow-x-auto">
                <table className="w-full text-left border-collapse" id="aggregated-summary-table">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                      <th className="py-3 px-4">Transaction Type</th>
                      <th className="py-3 px-4">Account Head</th>
                      <th className="py-3 px-4">Aggregated Vouchers</th>
                      <th className="py-3 px-4 text-right">Sum Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {/* Income Heads */}
                    <tr className="bg-blue-50/10 font-semibold text-blue-900 text-[10px] uppercase tracking-wider">
                      <td colSpan={4} className="py-2 px-4 border-b border-slate-200">Receipt Heads (Income)</td>
                    </tr>
                    {aggregatedReportRows
                      .filter((row) => row.type === HeadType.Income)
                      .map((row) => (
                        <tr key={row.headId} className="hover:bg-slate-50/40 transition-colors">
                          <td className="py-3 px-4 text-blue-700 font-semibold flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                            Receipt
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-800">{row.headName}</td>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-600">{row.voucherString}</td>
                          <td className="py-3 px-4 text-right font-bold text-slate-900">{formatINR(row.total)}</td>
                        </tr>
                      ))}
                    <tr className="bg-blue-50/20 font-bold border-t border-b border-slate-200 text-slate-900">
                      <td colSpan={3} className="py-3 px-4 text-right">Total Receipts (A):</td>
                      <td className="py-3 px-4 text-right font-black text-blue-900">{formatINR(totalIncome)}</td>
                    </tr>

                    {/* Expense Heads */}
                    <tr className="bg-rose-50/20 font-semibold text-rose-950 text-[10px] uppercase tracking-wider">
                      <td colSpan={4} className="py-3 px-4 border-b border-slate-200">Payment Heads (Expense)</td>
                    </tr>
                    {aggregatedReportRows
                      .filter((row) => row.type === HeadType.Expense)
                      .map((row) => (
                        <tr key={row.headId} className="hover:bg-slate-50/40 transition-colors">
                          <td className="py-3 px-4 text-rose-700 font-semibold flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                            Payment
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-800">{row.headName}</td>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-600">{row.voucherString}</td>
                          <td className="py-3 px-4 text-right font-bold text-slate-900">{formatINR(row.total)}</td>
                        </tr>
                      ))}
                    <tr className="bg-rose-50/30 font-bold border-t border-b border-slate-200 text-slate-900">
                      <td colSpan={3} className="py-3 px-4 text-right">Total Payments (B):</td>
                      <td className="py-3 px-4 text-right font-black text-rose-950">{formatINR(totalExpense)}</td>
                    </tr>

                    {/* Financial Summary Net Row */}
                    <tr className="bg-slate-100 font-bold text-slate-900">
                      <td colSpan={3} className="py-3.5 px-4 text-right">Net Surplus Balance (A - B):</td>
                      <td className={`py-3.5 px-4 text-right font-black ${netBalance >= 0 ? "text-blue-900" : "text-rose-950"}`}>
                        {formatINR(netBalance)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB B: ANNUAL MATRIX SUMMARY SHEET */}
          {activeReportTab === "yearly" && (
            <div className="space-y-4">
              <div className="border border-slate-200 rounded-xl overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[950px]" id="annual-matrix-table">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                      <th className="py-2.5 px-3 min-w-[150px]">Account Category Head</th>
                      <th className="py-2.5 px-2">Type</th>
                      {monthLabels.map((m) => (
                        <th key={m} className="py-2.5 px-2 text-right">{m}</th>
                      ))}
                      <th className="py-2.5 px-3 text-right bg-slate-100 font-black">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px] text-slate-700">
                    {/* Income categories */}
                    <tr className="bg-blue-50/10 font-bold text-[9px] uppercase tracking-wider">
                      <td colSpan={15} className="py-1.5 px-3">Receipts (Income)</td>
                    </tr>
                    {yearlyMatrix
                      .filter((row) => row.type === HeadType.Income)
                      .map((row, rowIdx) => (
                        <tr key={row.headId || `inc_${row.headName}_${rowIdx}`} className="hover:bg-slate-50/40 transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-slate-800">{row.headName}</td>
                          <td className="py-2.5 px-2 text-blue-700 font-bold text-[9px]">Receipt</td>
                          {row.monthlyTotals.map((tot, idx) => (
                            <td key={idx} className="py-2.5 px-2 text-right font-mono">
                              {tot > 0 ? formatINR(tot) : "—"}
                            </td>
                          ))}
                          <td className="py-2.5 px-3 text-right font-black text-slate-900 bg-blue-50/20">
                            {formatINR(row.grandTotal)}
                          </td>
                        </tr>
                      ))}

                    {/* Expense categories */}
                    <tr className="bg-rose-50/20 font-bold text-[9px] uppercase tracking-wider">
                      <td colSpan={15} className="py-1.5 px-3">Payments (Expenses)</td>
                    </tr>
                    {yearlyMatrix
                      .filter((row) => row.type === HeadType.Expense)
                      .map((row, rowIdx) => (
                        <tr key={row.headId || `exp_${row.headName}_${rowIdx}`} className="hover:bg-slate-50/40 transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-slate-800">{row.headName}</td>
                          <td className="py-2.5 px-2 text-rose-700 font-bold text-[9px]">Payment</td>
                          {row.monthlyTotals.map((tot, idx) => (
                            <td key={idx} className="py-2.5 px-2 text-right font-mono">
                              {tot > 0 ? formatINR(tot) : "—"}
                            </td>
                          ))}
                          <td className="py-2.5 px-3 text-right font-black text-slate-900 bg-rose-50/40">
                            {formatINR(row.grandTotal)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB C: INDIVIDUAL TRANSACTIONS LEDGER */}
          {activeReportTab === "raw" && (
            <div className="space-y-4">
              <div className="border border-slate-200 rounded-xl overflow-x-auto">
                {detailedTransactions.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <Layers className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-semibold text-slate-500">No matching entries recorded</p>
                    <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or record entries in Local Chapter Treasurer mode.</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse" id="raw-ledger-table">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                        <th className="py-2.5 px-4">Date</th>
                        <th className="py-2.5 px-4">Chapter</th>
                        <th className="py-2.5 px-4">Type</th>
                        <th className="py-2.5 px-4">Category Head</th>
                        <th className="py-2.5 px-4">Voucher ID</th>
                        <th className="py-2.5 px-4">Remarks / Description</th>
                        <th className="py-2.5 px-4 text-right">Amount (₹)</th>
                        {false && (
                          <th className="py-2.5 px-4 text-center">Actions</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                      {detailedTransactions.map((tx) => {
                        const chapterName = CHAPTERS.find((c) => c.id === tx.chapterId)?.name || tx.chapterId;
                        const isEditable = currentUser.role === "Admin" || (currentUser.role === "Treasurer" && tx.chapterId === currentUser.nodeId);
                        
                        return (
                          <tr key={tx.id} className="hover:bg-slate-50/40 transition-colors">
                            <td className="py-3.5 px-4 font-mono font-medium text-slate-600 whitespace-nowrap">{tx.date ? formatDateDMY(tx.date) : "—"}</td>
                            <td className="py-3.5 px-4 font-semibold text-slate-800">{chapterName}</td>
                            <td className="py-3.5 px-4">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                tx.type === HeadType.Income
                                  ? "bg-blue-50 text-blue-800 border border-blue-200"
                                  : tx.type === HeadType.Expense
                                  ? "bg-rose-50 text-rose-800 border border-rose-200"
                                  : "bg-indigo-50 text-indigo-800 border border-indigo-200"
                              }`}>
                                {tx.type === HeadType.Income ? "Receipt" : tx.type === HeadType.Expense ? "Payment" : "Loan"}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-slate-800">{tx.headName}</td>
                            <td className="py-3.5 px-4 font-mono font-bold text-slate-700">{tx.voucherNumber || "—"}</td>
                            <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate" title={tx.description}>{tx.description || "—"}</td>
                            <td className="py-3.5 px-4 text-right font-black text-slate-900">{formatINR(tx.amount)}</td>
                            
                            {false && (
                              <td className="py-3.5 px-4 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  {isEditable ? (
                                    <>
                                      <button
                                        onClick={() => onEditTransaction(tx)}
                                        className="p-1 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-md cursor-pointer transition-all"
                                        title="Edit Entry"
                                      >
                                        <Edit3 className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          if (confirm("Are you sure you want to delete this recorded transaction? This will permanently adjust ledger balances.")) {
                                            onDeleteTransaction(tx.id);
                                          }
                                        }}
                                        className="p-1 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-md cursor-pointer transition-all"
                                        title="Delete Entry"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 italic">Locked</span>
                                  )}
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
      )}

      {/* SECTION 3: SPECIFIC REPORT */}
      {reportSection === "specific" && (
        <div className="space-y-4">
          <ReportWizard
            currentUser={currentUser}
            accountHeads={accountHeads}
            transactions={transactions}
            assets={assets}
            bankBalances={bankBalances}
            members={members}
            scopeLabel={scopeLabel}
            onClose={() => handleSelectSection(null)}
          />
        </div>
      )}

      {/* SPECIFIC REPORT WIZARD OVERLAY MODAL */}
      {showReportWizard && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-white p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Specific report builder"
        >
          <div className="w-full max-w-6xl my-3 sm:my-8">
            <ReportWizard
              currentUser={currentUser}
              accountHeads={accountHeads}
              transactions={transactions}
              assets={assets}
              bankBalances={bankBalances}
              members={members}
              scopeLabel={scopeLabel}
              onClose={handleCloseReportWizard}
            />
          </div>
        </div>
      )}

      {repayModalTx && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white p-4 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm flex items-center gap-1.5">
                  <span>💼</span> Record Loan Repayment
                </h3>
                <p className="text-[11px] text-emerald-200">
                  Loan to: {repayModalTx.paidToName || repayModalTx.paidToId || "Member"}
                </p>
              </div>
              <button
                onClick={() => setRepayModalTx(null)}
                className="p-1 text-emerald-200 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 flex justify-between text-xs">
                <div>
                  <span className="text-emerald-700 font-semibold block">Original Loan</span>
                  <span className="text-sm font-black text-emerald-950">{formatINR(repayModalTx.amount)}</span>
                </div>
                <div>
                  <span className="text-emerald-700 font-semibold block">Outstanding Balance</span>
                  <span className="text-sm font-black text-indigo-900">
                    {formatINR((repayModalTx.loanBalance !== undefined ? repayModalTx.loanBalance : (repayModalTx.amount - (repayModalTx.amountReturned || 0))))}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Repayment Amount Received (₹) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={repayModalTx.loanBalance !== undefined ? repayModalTx.loanBalance : (repayModalTx.amount - (repayModalTx.amountReturned || 0))}
                  value={repaymentAmount || ""}
                  onChange={(e) => setRepaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Remarks / Payment Receipt Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bank transfer ref #1234 or cash receipt"
                  value={repaymentRemarks}
                  onChange={(e) => setRepaymentRemarks(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mode of Repayment <span className="text-rose-600">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRepaymentMode("Cash")}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 cursor-pointer ${
                      repaymentMode === "Cash"
                        ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                        : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span>💵 Cash</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRepaymentMode("Bank")}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 cursor-pointer ${
                      repaymentMode === "Bank"
                        ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                        : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span>🏦 Bank</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Repayment Date
                </label>
                <input
                  type="date"
                  value={repaymentDate}
                  onChange={(e) => setRepaymentDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl bg-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRepayModalTx(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!repayModalTx || !repaymentAmount || repaymentAmount <= 0) return;
                    const currentReturned = repayModalTx.amountReturned || 0;
                    const newReturned = currentReturned + repaymentAmount;
                    const newBal = Math.max(0, repayModalTx.amount - newReturned);

                    const updatedTx: Transaction = {
                      ...repayModalTx,
                      amountReturned: newReturned,
                      loanBalance: newBal,
                      repaymentPaymentMode: repaymentMode,
                      repaymentDate: repaymentDate,
                      loanReturnedDate: newBal === 0 ? repaymentDate : repayModalTx.loanReturnedDate,
                      remarks: repaymentRemarks
                        ? `${repayModalTx.remarks ? repayModalTx.remarks + " | " : ""}Repaid ₹${repaymentAmount} via ${repaymentMode} on ${formatDateDMY(repaymentDate)}: ${repaymentRemarks}`
                        : repayModalTx.remarks,
                    };

                    if (onUpdateTransaction) {
                      onUpdateTransaction(updatedTx);
                    }
                    setRepayModalTx(null);
                  }}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="h-4 w-4" />
                  <span>Save Repayment (Income)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
