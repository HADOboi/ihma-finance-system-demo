/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect } from "react";
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
} from "lucide-react";

interface DashboardProps {
  currentUser: User;
  accountHeads: AccountHead[];
  transactions: Transaction[];
  assets?: Asset[];
  bankBalances?: BankBalance[];
  chapterDirectory?: ChapterMaster[];
  members?: Member[];
  onDeleteTransaction: (id: string) => void;
  onEditTransaction: (tx: Transaction) => void;
  initialReportTab?: ReportTab;
}

type PeriodType = "year" | "month" | "day";

type ReportTab =
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

export default function Dashboard({
  currentUser,
  accountHeads,
  transactions,
  assets = PRELOADED_ASSETS,
  bankBalances = PRELOADED_BANK_BALANCES,
  chapterDirectory = PRELOADED_CHAPTER_DIRECTORY,
  members = PRELOADED_MEMBERS,
  onDeleteTransaction,
  onEditTransaction,
  initialReportTab,
}: DashboardProps) {
  // --- Date Range / Period State ---
  const [periodType, setPeriodType] = useState<PeriodType>("month");
  
  // Year Selector
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  // Month Selector (0-indexed: 0 = Jan, 11 = Dec)
  const [selectedMonth, setSelectedMonth] = useState<number>(5); // Default to June
  // Day Selector (YYYY-MM-DD)
  const [selectedDay, setSelectedDay] = useState<string>("2026-06-01");

  // --- Hierarchical Filter States ---
  const [selectedStates, setSelectedStates] = useState<string[]>(
    currentUser.level === OrgLevel.National ? STATES.map(s => s.id) : []
  );
  
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>(() => {
    if (currentUser.level === OrgLevel.National) {
      return DISTRICTS.map(d => d.id);
    }
    if (currentUser.level === OrgLevel.State) {
      return DISTRICTS.filter(d => d.stateId === currentUser.nodeId).map(d => d.id);
    }
    return [];
  });

  const [selectedChapters, setSelectedChapters] = useState<string[]>(() => {
    if (currentUser.level === OrgLevel.National) {
      return CHAPTERS.map(c => c.id);
    }
    if (currentUser.level === OrgLevel.State) {
      const allowedDistIds = DISTRICTS.filter(d => d.stateId === currentUser.nodeId).map(d => d.id);
      return CHAPTERS.filter(c => allowedDistIds.includes(c.districtId)).map(c => c.id);
    }
    if (currentUser.level === OrgLevel.District) {
      return CHAPTERS.filter(c => c.districtId === currentUser.nodeId).map(c => c.id);
    }
    if (currentUser.level === OrgLevel.Local) {
      return [currentUser.nodeId || ""];
    }
    return [];
  });

  // Search filter
  const [searchTerm, setSearchTerm] = useState("");

  // Report Sheet View Tab
  const [activeReportTab, setActiveReportTab] = useState<ReportTab>(initialReportTab || "payments");

  useEffect(() => {
    if (initialReportTab) {
      setActiveReportTab(initialReportTab);
    }
  }, [initialReportTab]);

  // Toggle for showing detailed reporting sheets
  const [showDetailedReports, setShowDetailedReports] = useState<boolean>(false);

  // --- Dynamic Filtering Lists for UI ---
  // Districts available under chosen States
  const availableDistricts = useMemo(() => {
    if (currentUser.level === OrgLevel.National) {
      return DISTRICTS.filter((d) => selectedStates.includes(d.stateId));
    }
    if (currentUser.level === OrgLevel.State) {
      return DISTRICTS.filter((d) => d.stateId === currentUser.nodeId);
    }
    return [];
  }, [selectedStates, currentUser]);

  // Chapters available under chosen Districts
  const availableChapters = useMemo(() => {
    if (currentUser.level === OrgLevel.National || currentUser.level === OrgLevel.State) {
      return CHAPTERS.filter((c) => selectedDistricts.includes(c.districtId));
    }
    if (currentUser.level === OrgLevel.District) {
      return CHAPTERS.filter((c) => c.districtId === currentUser.nodeId);
    }
    return [];
  }, [selectedDistricts, currentUser]);

  // Handle toggles with auto-cascading rules
  const handleStateToggle = (stateId: string) => {
    let updated;
    if (selectedStates.includes(stateId)) {
      updated = selectedStates.filter((id) => id !== stateId);
    } else {
      updated = [...selectedStates, stateId];
    }
    setSelectedStates(updated);

    // Cascading: automatically select/deselect districts and chapters
    const nextDists = DISTRICTS.filter((d) => updated.includes(d.stateId)).map((d) => d.id);
    setSelectedDistricts(nextDists);
    const nextChaps = CHAPTERS.filter((c) => nextDists.includes(c.districtId)).map((c) => c.id);
    setSelectedChapters(nextChaps);
  };

  const handleDistrictToggle = (distId: string) => {
    let updated;
    if (selectedDistricts.includes(distId)) {
      updated = selectedDistricts.filter((id) => id !== distId);
    } else {
      updated = [...selectedDistricts, distId];
    }
    setSelectedDistricts(updated);

    // Cascading: update chapters
    const nextChaps = CHAPTERS.filter((c) => updated.includes(c.districtId)).map((c) => c.id);
    setSelectedChapters(nextChaps);
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
    setSelectedDistricts(DISTRICTS.map((d) => d.id));
    setSelectedChapters(CHAPTERS.map((c) => c.id));
  };

  const selectNoneStates = () => {
    setSelectedStates([]);
    setSelectedDistricts([]);
    setSelectedChapters([]);
  };

  const selectAllDistricts = () => {
    const distIds = availableDistricts.map((d) => d.id);
    setSelectedDistricts(distIds);
    const chapIds = CHAPTERS.filter((c) => distIds.includes(c.districtId)).map((c) => c.id);
    setSelectedChapters(chapIds);
  };

  const selectAllChapters = () => {
    setSelectedChapters(availableChapters.map((c) => c.id));
  };

  // --- Filter Transactions by Date Range and Hierarchical Selection ---
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // 1. Organizational chapter filter
      if (!selectedChapters.includes(tx.chapterId)) {
        return false;
      }

      // 2. Date/Period Filter
      const txDate = new Date(tx.date);
      const txYear = txDate.getFullYear();
      const txMonth = txDate.getMonth(); // 0-11

      if (periodType === "year") {
        // Indian Financial Year: April of selectedYear to March of selectedYear + 1
        const start = new Date(`${selectedYear}-04-01`);
        const end = new Date(`${selectedYear + 1}-03-31`);
        const current = new Date(tx.date);
        if (current < start || current > end) {
          return false;
        }
      } else if (periodType === "month") {
        // Specific Month in selected Year
        if (txYear !== selectedYear || txMonth !== selectedMonth) {
          return false;
        }
      } else if (periodType === "day") {
        // Specific Day YYYY-MM-DD
        if (tx.date !== selectedDay) {
          return false;
        }
      }

      // 3. Optional Search Text (remarks or voucher)
      if (searchTerm.trim() !== "") {
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
  }, [transactions, selectedChapters, periodType, selectedYear, selectedMonth, selectedDay, searchTerm]);

  // --- Metrics Computations ---
  const { totalIncome, totalExpense, netBalance } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    filteredTransactions.forEach((tx) => {
      if (tx.type === HeadType.Income) {
        inc += tx.amount;
      } else if (tx.type === HeadType.Expense) {
        exp += tx.amount;
      }
    });
    return {
      totalIncome: inc,
      totalExpense: exp,
      netBalance: inc - exp,
    };
  }, [filteredTransactions]);

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

      // Ensure the head is in the list (could be deleted or disabled, default to backup snapshot info)
      if (!headMap[tx.headId]) {
        headMap[tx.headId] = {
          headId: tx.headId,
          headName: tx.headName,
          type: tx.type,
          total: 0,
          vouchers: [],
        };
      }

      headMap[tx.headId].total += tx.amount;
      if (tx.voucherNumber) {
        headMap[tx.headId].vouchers.push(tx.voucherNumber);
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
    const headRowMap: Record<string, { headName: string; type: HeadType; monthlyTotals: number[]; grandTotal: number }> = {};

    accountHeads.forEach((head) => {
      if (head.isActive) {
        headRowMap[head.id] = {
          headName: head.name,
          type: head.type,
          monthlyTotals: new Array(12).fill(0),
          grandTotal: 0,
        };
      }
    });

    // We process all transactions for the selected year range regardless of periodType state (as this is a annual matrix report)
    const start = new Date(`${selectedYear}-04-01`);
    const end = new Date(`${selectedYear + 1}-03-31`);

    transactions.forEach((tx) => {
      // Filter by selected chapters
      if (!selectedChapters.includes(tx.chapterId)) return;

      // Exclude loans from standard financial matrix
      if (tx.type === HeadType.Loan) return;

      const txDate = new Date(tx.date);
      if (txDate >= start && txDate <= end) {
        if (!headRowMap[tx.headId]) {
          headRowMap[tx.headId] = {
            headName: tx.headName,
            type: tx.type,
            monthlyTotals: new Array(12).fill(0),
            grandTotal: 0,
          };
        }

        const txMonth = txDate.getMonth();
        // find position in Indian financial year array [3, 4, ..., 2]
        const colIndex = monthsSequence.indexOf(txMonth);
        if (colIndex !== -1) {
          headRowMap[tx.headId].monthlyTotals[colIndex] += tx.amount;
          headRowMap[tx.headId].grandTotal += tx.amount;
        }
      }
    });

    return Object.values(headRowMap);
  }, [transactions, selectedChapters, selectedYear, accountHeads]);

  // Derived filtered collections for specific sheets
  const filteredPayments = useMemo(() => {
    return filteredTransactions.filter(tx => tx.type === HeadType.Expense);
  }, [filteredTransactions]);

  const filteredReceipts = useMemo(() => {
    return filteredTransactions.filter(tx => tx.type === HeadType.Income);
  }, [filteredTransactions]);

  const filteredLoans = useMemo(() => {
    return filteredTransactions.filter(tx => tx.type === HeadType.Loan);
  }, [filteredTransactions]);

  const filteredMembers = useMemo(() => {
    if (!searchTerm.trim()) return members;
    const term = searchTerm.toLowerCase();
    return members.filter(
      (m) =>
        m.memberName.toLowerCase().includes(term) ||
        m.memberId.toLowerCase().includes(term) ||
        m.chapterNameInput.toLowerCase().includes(term) ||
        m.qualification.toLowerCase().includes(term) ||
        m.email.toLowerCase().includes(term) ||
        m.mobileNumber.toLowerCase().includes(term)
    );
  }, [members, searchTerm]);

  const filteredAssets = useMemo(() => {
    if (!searchTerm.trim()) return assets;
    const term = searchTerm.toLowerCase();
    return assets.filter(
      (a) =>
        a.assetName.toLowerCase().includes(term) ||
        a.assetId.toLowerCase().includes(term) ||
        a.category.toLowerCase().includes(term) ||
        a.custodianName.toLowerCase().includes(term) ||
        a.chapterNameInput.toLowerCase().includes(term)
    );
  }, [assets, searchTerm]);

  const filteredBankBalances = useMemo(() => {
    if (!searchTerm.trim()) return bankBalances;
    const term = searchTerm.toLowerCase();
    return bankBalances.filter(
      (b) =>
        b.chapterNameInput.toLowerCase().includes(term) ||
        b.chapterIdInput.toLowerCase().includes(term) ||
        b.amountType.toLowerCase().includes(term)
    );
  }, [bankBalances, searchTerm]);

  const filteredChapters = useMemo(() => {
    if (!searchTerm.trim()) return chapterDirectory;
    const term = searchTerm.toLowerCase();
    return chapterDirectory.filter(
      (c) =>
        c.chapterName.toLowerCase().includes(term) ||
        c.id.toLowerCase().includes(term) ||
        c.state.toLowerCase().includes(term) ||
        c.district.toLowerCase().includes(term) ||
        c.presidentName.toLowerCase().includes(term) ||
        c.treasurerName.toLowerCase().includes(term) ||
        c.email.toLowerCase().includes(term)
    );
  }, [chapterDirectory, searchTerm]);

  // Export to simple CSV helper
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";

    if (activeReportTab === "payments") {
      csvContent += "Sl. No.,Chapter ID Number,Chapter Name,Date,Paid By,Paid To,Accounts Head,Payable Amount,Paid Amount,Balance Amount,Mode of Payment,Remarks\n";
      filteredPayments.forEach((tx, idx) => {
        csvContent += `${idx + 1},"${tx.chapterIdInput || tx.chapterId}","${tx.chapterNameInput || tx.chapterId}","${tx.date}","${tx.paidByExpense || tx.createdBy}","${tx.paidTo || ""}","${tx.headName}",${tx.payableAmount || tx.amount},${tx.paidAmount || tx.amount},${tx.balanceAmount || 0},"${tx.paymentMode || "Cash"}","${(tx.remarks || tx.description || "").replace(/"/g, '""')}"\n`;
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
      csvContent += "Sl. No.,Member ID Number,Member Name,Chapter ID No.,Chapter Name,Member Qualification,Membership Type,Membership Date,Membership Status,Mobile Number,WhatsApp Number,Email Address,Office/Clinic Number\n";
      filteredMembers.forEach((m, idx) => {
        csvContent += `${idx + 1},"${m.memberId}","${m.memberName}","${m.chapterIdInput}","${m.chapterNameInput}","${m.qualification}","${m.membershipType}","${m.membershipDate}","${m.membershipStatus}","${m.mobileNumber}","${m.whatsappNumber}","${m.email}","${m.clinicNumber}"\n`;
      });
    } else if (activeReportTab === "entity_types") {
      csvContent += "Sl. No.,Entity Type,Purpose / Scope\n";
      csvContent += '1,"National Chapter","Apex governing entity representing IHMA nationwide"\n';
      csvContent += '2,"State Chapter","State-level administrative division governing districts"\n';
      csvContent += '3,"District Chapter","District-level administrative unit managing local chapters"\n';
      csvContent += '4,"Local Chapter","Local grassroots operational chapter executing CME & finances"\n';
      csvContent += '5,"Sub-Committee","Specialized functional or project committee appointed by chapter"\n';
    } else if (activeReportTab === "assets") {
      csvContent += "Sl. No.,Date,Chapter ID No.,Chapter Name,Asset Number/ID,Asset Name,Asset Purchase Date,Asset Value,Asset Category,Asset Life,Custodian Name\n";
      filteredAssets.forEach((a, idx) => {
        csvContent += `${idx + 1},"${a.date}","${a.chapterIdInput}","${a.chapterNameInput}","${a.assetId}","${a.assetName}","${a.purchaseDate}",${a.assetValue},"${a.category}",${a.assetLife},"${a.custodianName}"\n`;
      });
    } else if (activeReportTab === "bank_balances") {
      csvContent += "Sl. No.,Date,Chapter ID No.,Chapter Name,Amount Type,Balance Amount\n";
      filteredBankBalances.forEach((b, idx) => {
        csvContent += `${idx + 1},"${b.date}","${b.chapterIdInput}","${b.chapterNameInput}","${b.amountType}",${b.amount}\n`;
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
      filteredTransactions.forEach((tx) => {
        const chapName = CHAPTERS.find((c) => c.id === tx.chapterId)?.name || tx.chapterId;
        csvContent += `"${tx.date}","${tx.type}","${tx.headName}",${tx.amount},"${tx.voucherNumber || ""}","${tx.description || ""}","${chapName}","${tx.createdBy}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `IHMA_FinApp_${activeReportTab}_sheet.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* 1. SELECTION FILTERS PANEL (Based on User's Org Level) */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs" id="dashboard-filters-container">
        <div className="flex items-center gap-2 mb-4 text-emerald-950 font-bold text-base border-b border-slate-100 pb-3">
          <Filter className="h-5 w-5 text-emerald-800" />
          <span>Report Filters</span>
          <span className="ml-auto text-xs font-normal text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full flex items-center gap-1">
            <Layers className="h-3.5 w-3.5 text-emerald-700" />
            Level: {currentUser.level}
          </span>
        </div>

        <div className="space-y-5">
          {/* A. Geographical / Organizational selections (Cascading) */}
          <div className="grid grid-cols-1 gap-4">
            {/* National Level View: Select States */}
            {currentUser.level === OrgLevel.National && (
              <div className="space-y-2 border-b border-slate-100 pb-3" id="state-selector-wrapper">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">States (National View)</span>
                  <div className="flex gap-2">
                    <button onClick={selectAllStates} className="text-[10px] text-blue-600 font-bold hover:underline cursor-pointer">Select All</button>
                    <span className="text-slate-300 text-xs">|</span>
                    <button onClick={selectNoneStates} className="text-[10px] text-slate-500 hover:underline cursor-pointer">Deselect All</button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {STATES.map((s) => {
                    const isChecked = selectedStates.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        id={`state-filter-${s.id}`}
                        onClick={() => handleStateToggle(s.id)}
                        className={`px-3 py-1.5 text-xs rounded-xl font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                          isChecked
                            ? "bg-blue-50/70 border-blue-500 text-blue-900 font-bold"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {isChecked && <Check className="h-3 w-3" />}
                        {s.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* National & State View: Select Districts */}
            {(currentUser.level === OrgLevel.National || currentUser.level === OrgLevel.State) && (
              <div className="space-y-2 border-b border-slate-100 pb-3" id="district-selector-wrapper">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Districts ({currentUser.level === OrgLevel.State ? `${STATES.find(s => s.id === currentUser.nodeId)?.name || ""} State` : "National Filter"})
                  </span>
                  {(currentUser.level === OrgLevel.National || currentUser.level === OrgLevel.State) && (
                    <button onClick={selectAllDistricts} className="text-[10px] text-blue-600 font-bold hover:underline cursor-pointer">Select All Districts</button>
                  )}
                </div>
                {availableDistricts.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Select a State above to load districts.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {availableDistricts.map((d) => {
                      const isChecked = selectedDistricts.includes(d.id);
                      return (
                        <button
                          key={d.id}
                          id={`district-filter-${d.id}`}
                          onClick={() => handleDistrictToggle(d.id)}
                          className={`px-3 py-1.5 text-xs rounded-xl font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                            isChecked
                              ? "bg-blue-50/70 border-blue-500 text-blue-900 font-bold"
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {isChecked && <Check className="h-3 w-3" />}
                          {d.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Select Chapters (Visible on National, State, and District levels) */}
            {currentUser.level !== OrgLevel.Local && (
              <div className="space-y-2" id="chapter-selector-wrapper">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Local Chapters ({availableChapters.length} active)
                  </span>
                  <button onClick={selectAllChapters} className="text-[10px] text-blue-600 font-bold hover:underline cursor-pointer">Select All Chapters</button>
                </div>
                {availableChapters.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Select a District above to load chapters.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1 bg-slate-50 border border-slate-200/60 rounded-xl">
                    {availableChapters.map((c) => {
                      const isChecked = selectedChapters.includes(c.id);
                      const distName = DISTRICTS.find((d) => d.id === c.districtId)?.name || "";
                      return (
                        <button
                          key={c.id}
                          id={`chapter-filter-${c.id}`}
                          onClick={() => handleChapterToggle(c.id)}
                          className={`px-2.5 py-1 text-xs rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                            isChecked
                              ? "bg-blue-600 border-blue-600 text-white font-semibold"
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {isChecked && <Check className="h-3 w-3 text-blue-200" />}
                          <span>{c.name}</span>
                          <span className={`text-[9px] ${isChecked ? "text-blue-100/80" : "text-slate-400"}`}>({distName})</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Local Chapter Information */}
            {currentUser.level === OrgLevel.Local && (
              <div className="bg-blue-50/40 p-3.5 border border-blue-100 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 uppercase font-semibold">Your Local Chapter Assignment</span>
                  <p className="text-sm font-bold text-blue-900 mt-0.5">
                    {CHAPTERS.find((c) => c.id === currentUser.nodeId)?.name || currentUser.nodeId} Chapter
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 uppercase font-semibold">Role Privilege</span>
                  <p className="text-sm font-bold text-blue-900 mt-0.5 flex items-center gap-1">
                    {currentUser.role === "Treasurer" ? "Treasurer (Editor)" : "General User (Read-Only)"}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* B. Date / Period Filters (Full Year, Month, Specific Day) */}
          <div className="bg-slate-50 p-4 border border-slate-200/70 rounded-2xl flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1 shrink-0">
                <Calendar className="h-4.5 w-4.5 text-blue-600" />
                Date Range
              </span>

              {/* Range Type Button Group */}
              <div className="flex bg-white border border-slate-200 rounded-xl p-1 shrink-0">
                {(["year", "month", "day"] as PeriodType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setPeriodType(type)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors capitalize cursor-pointer ${
                      periodType === type
                        ? "bg-blue-600 text-white"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {type === "year" ? "Full Year" : type === "month" ? "Specific Month" : "Single Day"}
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic selectors depending on selection above */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Year select (applicable to both 'year' and 'month') */}
              {(periodType === "year" || periodType === "month") && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500 font-medium">Financial Year:</span>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                    className="px-2.5 py-1 text-xs font-semibold border border-slate-300 rounded-lg bg-white"
                  >
                    <option value={2026}>2026-27</option>
                    <option value={2025}>2025-26</option>
                    <option value={2024}>2024-25</option>
                  </select>
                </div>
              )}

              {/* Month Selector (applicable to 'month') */}
              {periodType === "month" && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500 font-medium">Month:</span>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
                    className="px-2.5 py-1 text-xs font-semibold border border-slate-300 rounded-lg bg-white"
                  >
                    {[
                      "January", "February", "March", "April", "May", "June",
                      "July", "August", "September", "October", "November", "December"
                    ].map((m, idx) => (
                      <option key={m} value={idx}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Day Calendar Input (applicable to 'day') */}
              {periodType === "day" && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500 font-medium">Select Day:</span>
                  <input
                    type="date"
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(e.target.value)}
                    className="px-2.5 py-1 text-xs font-semibold border border-slate-300 rounded-lg bg-white"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. METRIC CARDS SUMMARY PANEL */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" id="dashboard-metrics-row">
        {/* Total Income */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center gap-3 sm:gap-4 hover:border-blue-200 transition-colors">
          <div className="h-10 w-10 sm:h-12 sm:w-12 bg-blue-50/50 rounded-xl flex items-center justify-center border border-blue-100 shrink-0">
            <TrendingUp className="h-5.5 w-5.5 sm:h-6 sm:w-6 text-blue-600" />
          </div>
          <div>
            <span className="text-slate-500 text-[10px] sm:text-xs font-semibold uppercase tracking-wider block">Total Income</span>
            <span className="text-xl sm:text-2xl font-black text-blue-900 block mt-0.5 sm:mt-1">{formatINR(totalIncome)}</span>
            <span className="text-[9px] sm:text-[10px] text-slate-400 block mt-0.5">Total Income from filtered chapters</span>
          </div>
        </div>

        {/* Total Expense */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center gap-3 sm:gap-4 hover:border-rose-200 transition-colors">
          <div className="h-10 w-10 sm:h-12 sm:w-12 bg-rose-50 rounded-xl flex items-center justify-center border border-rose-100 shrink-0">
            <TrendingDown className="h-5.5 w-5.5 sm:h-6 sm:w-6 text-rose-700" />
          </div>
          <div>
            <span className="text-slate-500 text-[10px] sm:text-xs font-semibold uppercase tracking-wider block">Total Expense</span>
            <span className="text-xl sm:text-2xl font-black text-rose-950 block mt-0.5 sm:mt-1">{formatINR(totalExpense)}</span>
            <span className="text-[9px] sm:text-[10px] text-slate-400 block mt-0.5">Total Expense from filtered chapters</span>
          </div>
        </div>

        {/* Net Balance */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center gap-3 sm:gap-4 hover:border-slate-300 transition-colors">
          <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center border shrink-0 ${
            netBalance >= 0 ? "bg-blue-50/50 border-blue-100 text-blue-600" : "bg-rose-50 border-rose-100 text-rose-700"
          }`}>
            <Scale className="h-5.5 w-5.5 sm:h-6 sm:w-6" />
          </div>
          <div>
            <span className="text-slate-500 text-[10px] sm:text-xs font-semibold uppercase tracking-wider block">Net Balance</span>
            <span className={`text-xl sm:text-2xl font-black block mt-0.5 sm:mt-1 ${netBalance >= 0 ? "text-blue-900" : "text-rose-900"}`}>
              {netBalance < 0 ? "-" : ""}{formatINR(Math.abs(netBalance))}
            </span>
            <span className="text-[9px] sm:text-[10px] text-slate-400 block mt-0.5">Available chapter balance</span>
          </div>
        </div>
      </div>

      {/* 3. REPORTING SHEETS INTERACTIVE PANEL OR SUMMARY CALLOUT */}
      {!showDetailedReports ? (
        <div className="space-y-6">
          {/* CTA Card to open Detailed Reports */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-[#0F6E5D] text-white rounded-2xl p-6 shadow-md border border-slate-700/60">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-teal-400/20 text-teal-200 border border-teal-400/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Financial Reports
                  </span>
                  <span className="text-slate-300 text-xs">Report Sheets</span>
                </div>
                <h3 className="text-xl font-bold font-display text-white mt-2">
                  Detailed Reports & Statements
                </h3>
                <p className="text-slate-200 text-xs mt-1 max-w-2xl leading-relaxed">
                  Access itemized payments, receipts, loan registry, member directory, assets, and annual summary sheets.
                </p>
              </div>

              <button
                onClick={() => setShowDetailedReports(true)}
                className="px-5 py-3 bg-[#0F6E5D] hover:bg-[#0B5548] text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 shrink-0 border border-teal-400/30 hover:scale-[1.02]"
              >
                <FileSpreadsheet className="h-4.5 w-4.5" />
                <span>Open Detailed Reports View</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Quick Jump Shortcut Chips */}
            <div className="mt-5 pt-4 border-t border-slate-700/80 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider mr-1">
                Quick Jump To:
              </span>
              <button
                onClick={() => { setActiveReportTab("payments"); setShowDetailedReports(true); }}
                className="px-3 py-1.5 bg-slate-800/90 hover:bg-slate-700 border border-slate-600 rounded-lg text-xs font-semibold text-slate-100 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <span>💸 Payments</span>
                <span className="bg-rose-500/30 text-rose-200 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {filteredPayments.length}
                </span>
              </button>

              <button
                onClick={() => { setActiveReportTab("receipts"); setShowDetailedReports(true); }}
                className="px-3 py-1.5 bg-slate-800/90 hover:bg-slate-700 border border-slate-600 rounded-lg text-xs font-semibold text-slate-100 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <span>🧾 Receipts</span>
                <span className="bg-teal-500/30 text-teal-200 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {filteredReceipts.length}
                </span>
              </button>

              <button
                onClick={() => { setActiveReportTab("loans"); setShowDetailedReports(true); }}
                className="px-3 py-1.5 bg-slate-800/90 hover:bg-slate-700 border border-slate-600 rounded-lg text-xs font-semibold text-slate-100 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <span>💼 Loans</span>
                <span className="bg-indigo-500/30 text-indigo-200 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {filteredLoans.length}
                </span>
              </button>

              <button
                onClick={() => { setActiveReportTab("members"); setShowDetailedReports(true); }}
                className="px-3 py-1.5 bg-slate-800/90 hover:bg-slate-700 border border-slate-600 rounded-lg text-xs font-semibold text-slate-100 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <span>👥 Members</span>
                <span className="bg-emerald-500/30 text-emerald-200 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {filteredMembers.length}
                </span>
              </button>

              <button
                onClick={() => { setActiveReportTab("assets"); setShowDetailedReports(true); }}
                className="px-3 py-1.5 bg-slate-800/90 hover:bg-slate-700 border border-slate-600 rounded-lg text-xs font-semibold text-slate-100 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <span>🏢 Assets</span>
                <span className="bg-sky-500/30 text-sky-200 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {filteredAssets.length}
                </span>
              </button>

              <button
                onClick={() => { setActiveReportTab("bank_balances"); setShowDetailedReports(true); }}
                className="px-3 py-1.5 bg-slate-800/90 hover:bg-slate-700 border border-slate-600 rounded-lg text-xs font-semibold text-slate-100 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <span>🏦 Bank / FD</span>
                <span className="bg-purple-500/30 text-purple-200 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {filteredBankBalances.length}
                </span>
              </button>

              <button
                onClick={() => { setActiveReportTab("monthly"); setShowDetailedReports(true); }}
                className="px-3 py-1.5 bg-slate-800/90 hover:bg-slate-700 border border-slate-600 rounded-lg text-xs font-semibold text-amber-300 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <span>📊 Monthly Summary</span>
              </button>

              <button
                onClick={() => { setActiveReportTab("yearly"); setShowDetailedReports(true); }}
                className="px-3 py-1.5 bg-slate-800/90 hover:bg-slate-700 border border-slate-600 rounded-lg text-xs font-semibold text-amber-300 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <span>📅 Annual Matrix</span>
              </button>
            </div>
          </div>

          {/* Recent Transactions Mini Preview Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-bold text-sm text-slate-900 font-display">
                  Recent Ledger Activity
                </h3>
                <p className="text-xs text-slate-500">
                  Latest recorded transactions across selected chapters
                </p>
              </div>
              <button
                onClick={() => { setActiveReportTab("raw"); setShowDetailedReports(true); }}
                className="text-xs font-bold text-[#0F6E5D] hover:text-[#0B5548] flex items-center gap-1 cursor-pointer"
              >
                <span>View All {filteredTransactions.length} Entries</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              {filteredTransactions.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No transactions recorded for the selected filter period.
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100/60 text-slate-600 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Chapter</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Category / Particulars</th>
                      <th className="py-3 px-4 text-right">Amount (INR)</th>
                      <th className="py-3 px-4 text-center">Mode</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
                    {filteredTransactions.slice(0, 6).map((tx) => {
                      const head = accountHeads.find((h) => h.id === tx.headId);
                      const headName = head ? head.name : tx.headName || "General";
                      const isInc = tx.type === HeadType.Income;
                      return (
                        <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-600">{tx.date ? formatDateDMY(tx.date) : "—"}</td>
                          <td className="py-3 px-4 font-medium text-slate-900">{tx.chapterNameInput || tx.chapterId}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              isInc ? "bg-teal-100 text-teal-800" : "bg-rose-100 text-rose-800"
                            }`}>
                              {isInc ? "Receipt" : "Payment"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold">{headName}</div>
                            <div className="text-[10px] text-slate-500">{tx.paidBy || tx.paidTo || tx.description}</div>
                          </td>
                          <td className={`py-3 px-4 text-right font-bold font-mono ${isInc ? "text-teal-800" : "text-rose-800"}`}>
                            {isInc ? "+" : "-"}₹{tx.amount.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-md font-medium text-slate-600">
                              {tx.paymentMode || "Cash"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => onEditTransaction(tx)}
                              className="p-1 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-md cursor-pointer transition-all"
                              title="Edit Entry"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Detailed Reports View */
        <div className="space-y-4">
          <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-md">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowDetailedReports(false)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 cursor-pointer flex items-center gap-1.5 text-xs font-bold transition-all"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Overview</span>
              </button>
              <div>
                <h3 className="text-base font-bold font-display text-white">
                  Detailed Accounting Sheets & Reports
                </h3>
                <p className="text-slate-400 text-xs">
                  Viewing {activeReportTab.toUpperCase()} Sheet • Filtering for {selectedChapters.length} Chapters
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowDetailedReports(false)}
              className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
            >
              Close Detailed Reports View
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Sheets Nav & Actions */}
            <div className="bg-slate-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
          <div className="flex items-center gap-2.5 w-full lg:max-w-md">
            <label htmlFor="report-sheet-selector" className="text-slate-500 text-[11px] sm:text-xs font-bold uppercase tracking-wider shrink-0 hidden sm:inline">
              Report View:
            </label>
            <div className="relative w-full">
              <select
                id="report-sheet-selector"
                value={activeReportTab}
                onChange={(e) => setActiveReportTab(e.target.value as any)}
                className="w-full pl-3 pr-10 py-2 border border-slate-300 rounded-xl text-xs font-bold bg-white text-slate-800 shadow-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer appearance-none"
              >
                <option value="payments">💸 Sheet 1: Payments (Expenses) ({filteredPayments.length} entries)</option>
                <option value="receipts">🧾 Sheet 2: Receipts (Income) ({filteredReceipts.length} entries)</option>
                <option value="loans">💼 Sheet 3: Loan Registry ({filteredLoans.length} records)</option>
                <option value="members">👥 Sheet 4: Member Directory ({filteredMembers.length} members)</option>
                <option value="entity_types">🏛️ Sheet 5: Entity Types Taxonomy (5 tiers)</option>
                <option value="assets">🏢 Sheet 6: Asset Register ({filteredAssets.length} assets)</option>
                <option value="bank_balances">🏦 Sheet 7: FD & Bank Balances ({filteredBankBalances.length} accounts)</option>
                <option value="chapters">📍 Sheet 8: Chapter Directory / Master ({filteredChapters.length} chapters)</option>
                <option value="monthly">📊 Monthly Summary Aggregation</option>
                <option value="yearly">📅 Annual Matrix Sheet (Apr - Mar)</option>
                <option value="raw">🗂️ Consolidated Raw Ledger ({filteredTransactions.length} total entries)</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 border-l border-slate-200">
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            {activeReportTab !== "monthly" && activeReportTab !== "yearly" && activeReportTab !== "entity_types" && (
              <div className="relative w-full lg:w-60">
                <input
                  type="text"
                  placeholder={`Search ${activeReportTab}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-hidden"
                />
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
          </div>
        </div>

        {/* Interactive Sheets Workspace */}
        <div className="p-4 sm:p-6">
          {/* SHEET 1: PAYMENTS (EXPENSES) */}
          {activeReportTab === "payments" && (
            <div className="space-y-4">
              <div className="bg-rose-50/40 p-4 rounded-xl border border-rose-100/30 text-slate-700 text-xs flex gap-3">
                <Info className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-rose-900">Sheet 1: Payments Register (Expenses)</p>
                  <p className="mt-0.5 leading-relaxed">
                    Tracks chapter expenditure items including Sl. No., Chapter ID, Chapter Name, Date, Paid By, Paid To, Accounts Head, Payable Amount, Paid Amount, Balance Amount, Mode of Payment, and Remarks.
                  </p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-x-auto">
                <table className="w-full text-left border-collapse bg-white text-xs" id="payments-sheet-table">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                      <th className="py-2.5 px-3">Sl. No.</th>
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
                      {(currentUser.role === "Treasurer" || currentUser.role === "Admin") && (
                        <th className="py-2.5 px-3 text-center">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredPayments.length === 0 ? (
                      <tr>
                        <td colSpan={13} className="py-8 text-center text-slate-400">
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
                            <td className="py-3 px-3 font-mono text-slate-600">{tx.chapterIdInput || tx.chapterId}</td>
                            <td className="py-3 px-3 font-semibold text-slate-800">{chapterName}</td>
                            <td className="py-3 px-3 font-mono text-slate-600 whitespace-nowrap">{tx.date ? formatDateDMY(tx.date) : "—"}</td>
                            <td className="py-3 px-3 font-medium text-slate-700">{tx.paidByExpense || tx.createdBy}</td>
                            <td className="py-3 px-3 font-medium text-slate-800">{tx.paidTo || "—"}</td>
                            <td className="py-3 px-3 font-semibold text-rose-800">{tx.headName}</td>
                            <td className="py-3 px-3 text-right font-medium text-slate-600">₹{(tx.payableAmount || tx.amount).toLocaleString()}</td>
                            <td className="py-3 px-3 text-right font-bold text-rose-900">₹{(tx.paidAmount || tx.amount).toLocaleString()}</td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-slate-600">₹{(tx.balanceAmount || 0).toLocaleString()}</td>
                            <td className="py-3 px-3">
                              <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full text-[10px] uppercase">
                                {tx.paymentMode || "Cash"}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-slate-500 max-w-xs truncate" title={tx.remarks || tx.description}>{tx.remarks || tx.description || "—"}</td>
                            {(currentUser.role === "Treasurer" || currentUser.role === "Admin") && (
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
              <div className="bg-blue-50/40 p-4 rounded-xl border border-blue-100/30 text-slate-700 text-xs flex gap-3">
                <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-blue-900">Sheet 2: Receipts Register (Income)</p>
                  <p className="mt-0.5 leading-relaxed">
                    Tracks chapter income collections including Sl. No., Chapter ID No., Chapter Name, Date, Collected By, Paid By Name, Accounts Head, Offered Amount, Paid Amount, Balance Amount, Payment Mode, Remarks, and Paid By Member ID.
                  </p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-x-auto">
                <table className="w-full text-left border-collapse bg-white text-xs" id="receipts-sheet-table">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                      <th className="py-2.5 px-3">Sl. No.</th>
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
                      <th className="py-2.5 px-3">Member ID</th>
                      <th className="py-2.5 px-3">Remarks</th>
                      {(currentUser.role === "Treasurer" || currentUser.role === "Admin") && (
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
                            <td className="py-3 px-3 font-mono text-slate-600">{tx.chapterIdInput || tx.chapterId}</td>
                            <td className="py-3 px-3 font-semibold text-slate-800">{chapterName}</td>
                            <td className="py-3 px-3 font-mono text-slate-600 whitespace-nowrap">{tx.date ? formatDateDMY(tx.date) : "—"}</td>
                            <td className="py-3 px-3 font-medium text-slate-700">{tx.collectedBy || tx.createdBy}</td>
                            <td className="py-3 px-3 font-semibold text-slate-800">{tx.paidBy || "—"}</td>
                            <td className="py-3 px-3 font-semibold text-blue-800">{tx.headName}</td>
                            <td className="py-3 px-3 text-right font-medium text-slate-600">₹{(tx.offeredAmount || tx.amount).toLocaleString()}</td>
                            <td className="py-3 px-3 text-right font-bold text-blue-900">₹{(tx.paidAmount || tx.amount).toLocaleString()}</td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-slate-600">₹{(tx.balanceAmount || 0).toLocaleString()}</td>
                            <td className="py-3 px-3">
                              <span className="bg-blue-50 text-blue-800 font-bold px-2 py-0.5 rounded-full text-[10px] uppercase border border-blue-100">
                                {tx.paymentMode || "Bank"}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-slate-700">{tx.paidByMemberId || "—"}</td>
                            <td className="py-3 px-3 text-slate-500 max-w-xs truncate" title={tx.remarks || tx.description}>{tx.remarks || tx.description || "—"}</td>
                            {(currentUser.role === "Treasurer" || currentUser.role === "Admin") && (
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
              <div className="bg-indigo-50/40 p-4 rounded-xl border border-indigo-100/30 text-slate-700 text-xs flex gap-3">
                <Info className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-indigo-900">Sheet 3: Loans & Disbursements Register</p>
                  <p className="mt-0.5 leading-relaxed">
                    Tracks interest-free temporary loans distributed among chapters and members including Sl. No., Chapter ID No., Chapter Name, Date, Paid To, Paid To ID, Recipient Name, Particulars, Amount, Amount Returned, Loan Balance, Return Date, and Remarks.
                  </p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-x-auto">
                <table className="w-full text-left border-collapse bg-white text-xs" id="loans-sheet-table">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                      <th className="py-2.5 px-3">Sl. No.</th>
                      <th className="py-2.5 px-3">Chapter ID</th>
                      <th className="py-2.5 px-3">Chapter Name</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Paid To Type</th>
                      <th className="py-2.5 px-3">Recipient ID</th>
                      <th className="py-2.5 px-3">Recipient Name</th>
                      <th className="py-2.5 px-3">Particulars</th>
                      <th className="py-2.5 px-3 text-right">Loan Amount (₹)</th>
                      <th className="py-2.5 px-3 text-right">Returned (₹)</th>
                      <th className="py-2.5 px-3 text-right">Loan Balance (₹)</th>
                      <th className="py-2.5 px-3">Target Return Date</th>
                      <th className="py-2.5 px-3">Remarks</th>
                      {(currentUser.role === "Treasurer" || currentUser.role === "Admin") && (
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
                            <td className="py-3 px-3 font-mono text-slate-600">{tx.chapterIdInput || tx.chapterId}</td>
                            <td className="py-3 px-3 font-semibold text-slate-800">{chapterName}</td>
                            <td className="py-3 px-3 font-mono text-slate-600 whitespace-nowrap">{tx.date ? formatDateDMY(tx.date) : "—"}</td>
                            <td className="py-3 px-3 capitalize font-medium text-slate-600">{tx.paidToCategory || tx.paidTo || "Member"}</td>
                            <td className="py-3 px-3 font-mono font-bold text-slate-700">{tx.paidToId || "—"}</td>
                            <td className="py-3 px-3 font-semibold text-slate-800">{tx.paidToName || "—"}</td>
                            <td className="py-3 px-3 text-slate-600 max-w-xs truncate" title={tx.particulars || tx.description}>{tx.particulars || tx.description || "—"}</td>
                            <td className="py-3 px-3 text-right font-bold text-slate-900">₹{tx.amount.toLocaleString()}</td>
                            <td className="py-3 px-3 text-right font-medium text-emerald-700">₹{(tx.amountReturned || 0).toLocaleString()}</td>
                            <td className="py-3 px-3 text-right font-black text-indigo-900">₹{bal.toLocaleString()}</td>
                            <td className="py-3 px-3 font-mono text-slate-600 whitespace-nowrap">{tx.loanReturnDate ? formatDateDMY(tx.loanReturnDate) : "—"}</td>
                            <td className="py-3 px-3 text-slate-500 max-w-xs truncate">{tx.remarks || "—"}</td>
                            {(currentUser.role === "Treasurer" || currentUser.role === "Admin") && (
                              <td className="py-3 px-3 text-center">
                                {isEditable ? (
                                  <div className="flex items-center justify-center gap-1">
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
              <div className="bg-emerald-50/40 p-4 rounded-xl border border-emerald-100/30 text-slate-700 text-xs flex gap-3">
                <Info className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-emerald-900">Sheet 4: IHMA Member Directory Register</p>
                  <p className="mt-0.5 leading-relaxed">
                    Complete master registry of all registered doctors & medical members across local chapters including Sl. No., Member ID Number, Member Name, Chapter ID No., Chapter Name, Member Qualification, Membership Type, Membership Date, Status, Mobile Number, WhatsApp Number, Email, and Clinic Contact.
                  </p>
                </div>
              </div>

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
                        <td colSpan={13} className="py-8 text-center text-slate-400">
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
              <div className="bg-purple-50/40 p-4 rounded-xl border border-purple-100/30 text-slate-700 text-xs flex gap-3">
                <Info className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-purple-900">Sheet 5: Entity Types Taxonomy</p>
                  <p className="mt-0.5 leading-relaxed">
                    Hierarchical organizational taxonomy governing chapter governance, financial limits, and reporting relationships within IHMA.
                  </p>
                </div>
              </div>

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
              <div className="bg-amber-50/40 p-4 rounded-xl border border-amber-100/30 text-slate-700 text-xs flex gap-3">
                <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-900">Sheet 6: Asset Register</p>
                  <p className="mt-0.5 leading-relaxed">
                    Physical and capital asset tracking registry including Sl. No., Date, Chapter ID No., Chapter Name, Asset Number/ID, Asset Name, Purchase Date, Asset Value (INR), Category, Asset Life (years), and Custodian Name.
                  </p>
                </div>
              </div>

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
                      <th className="py-2.5 px-3 text-right">Asset Value (₹)</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3 text-right">Life (Years)</th>
                      <th className="py-2.5 px-3">Custodian Name</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredAssets.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="py-8 text-center text-slate-400">
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
                          <td className="py-3 px-3 text-right font-black text-slate-900">₹{a.assetValue.toLocaleString()}</td>
                          <td className="py-3 px-3 font-semibold text-blue-700">{a.category}</td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-slate-700">{a.assetLife}</td>
                          <td className="py-3 px-3 font-medium text-slate-800">{a.custodianName}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SHEET 7: FD & BANK BALANCES */}
          {activeReportTab === "bank_balances" && (
            <div className="space-y-4">
              <div className="bg-sky-50/40 p-4 rounded-xl border border-sky-100/30 text-slate-700 text-xs flex gap-3">
                <Info className="h-5 w-5 text-sky-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sky-900">Sheet 7: Fixed Deposits & Bank Balances Register</p>
                  <p className="mt-0.5 leading-relaxed">
                    Overview of liquid bank deposits and long-term fixed deposits held by each chapter including Sl. No., Date, Chapter ID No., Chapter Name, Amount Type (FD vs Bank Balance), and Balance Amount (INR).
                  </p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-x-auto">
                <table className="w-full text-left border-collapse bg-white text-xs" id="bank-balances-sheet-table">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                      <th className="py-2.5 px-4 w-16">Sl. No.</th>
                      <th className="py-2.5 px-4">Date</th>
                      <th className="py-2.5 px-4">Chapter ID</th>
                      <th className="py-2.5 px-4">Chapter Name</th>
                      <th className="py-2.5 px-4">Amount Type</th>
                      <th className="py-2.5 px-4 text-right">Balance Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredBankBalances.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          No bank balance records match the search parameters.
                        </td>
                      </tr>
                    ) : (
                      filteredBankBalances.map((b, idx) => (
                        <tr key={`${b.chapterIdInput}_${idx}`} className="hover:bg-slate-50/40 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-slate-500">{idx + 1}</td>
                          <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">{b.date ? formatDateDMY(b.date) : "—"}</td>
                          <td className="py-3 px-4 font-mono text-slate-600">{b.chapterIdInput}</td>
                          <td className="py-3 px-4 font-semibold text-slate-800">{b.chapterNameInput}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              b.amountType === "FD" ? "bg-amber-50 text-amber-800 border border-amber-200" : "bg-sky-50 text-sky-800 border border-sky-200"
                            }`}>
                              {b.amountType}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-black text-slate-900 text-sm">₹{b.amount.toLocaleString()}</td>
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
              <div className="bg-slate-100 p-4 rounded-xl border border-slate-200/80 text-slate-700 text-xs flex gap-3">
                <Info className="h-5 w-5 text-slate-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900">Sheet 8: Chapter Directory / Master Register</p>
                  <p className="mt-0.5 leading-relaxed">
                    Master contact and leadership directory for all IHMA chapters containing Sl. No., Chapter ID, Chapter Name, State, District, Chapter Address, President ID & Name, VP ID & Name, General Secretary ID & Name, Treasurer ID & Name, Contact Nos., Email, and Formation Date.
                  </p>
                </div>
              </div>

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
              <div className="bg-blue-50/40 p-4 rounded-xl border border-blue-100/30 text-slate-700 text-xs flex gap-3">
                <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-blue-900">Spreadsheet Auto-Aggregation Protocol</p>
                  <p className="mt-0.5 leading-relaxed">
                    This sheet acts as your digital monthly report. It matches your requested workflow: it groups individual receipts and payments by their <strong>Account Head</strong>, totals the figures automatically, and compresses sequential and multi-item Voucher IDs (e.g. <code>RV-101 to RV-103</code>) for convenient administrative accounting.
                  </p>
                </div>
              </div>

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
                          <td className="py-3 px-4 text-right font-bold text-slate-900">₹{row.total.toLocaleString()}</td>
                        </tr>
                      ))}
                    <tr className="bg-blue-50/20 font-bold border-t border-b border-slate-200 text-slate-900">
                      <td colSpan={3} className="py-3 px-4 text-right">Total Receipts (A):</td>
                      <td className="py-3 px-4 text-right font-black text-blue-900">₹{totalIncome.toLocaleString()}</td>
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
                          <td className="py-3 px-4 text-right font-bold text-slate-900">₹{row.total.toLocaleString()}</td>
                        </tr>
                      ))}
                    <tr className="bg-rose-50/30 font-bold border-t border-b border-slate-200 text-slate-900">
                      <td colSpan={3} className="py-3 px-4 text-right">Total Payments (B):</td>
                      <td className="py-3 px-4 text-right font-black text-rose-950">₹{totalExpense.toLocaleString()}</td>
                    </tr>

                    {/* Financial Summary Net Row */}
                    <tr className="bg-slate-100 font-bold text-slate-900">
                      <td colSpan={3} className="py-3.5 px-4 text-right">Net Surplus Balance (A - B):</td>
                      <td className={`py-3.5 px-4 text-right font-black ${netBalance >= 0 ? "text-blue-900" : "text-rose-950"}`}>
                        ₹{netBalance.toLocaleString()}
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
              <div className="bg-blue-50/40 p-4 rounded-xl border border-blue-100/30 text-slate-700 text-xs flex gap-3">
                <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-blue-900">Financial Year Master Spreadsheet Format</p>
                  <p className="mt-0.5 leading-relaxed">
                    This displays monthly collections for each account head during the Indian Financial Year (<strong>April {selectedYear} to March {selectedYear + 1}</strong>). Useful for tax compliance, state audit declarations, and comparative chapter growth analytics.
                  </p>
                </div>
              </div>

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
                      .map((row) => (
                        <tr key={row.headName} className="hover:bg-slate-50/40 transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-slate-800">{row.headName}</td>
                          <td className="py-2.5 px-2 text-blue-700 font-bold text-[9px]">Receipt</td>
                          {row.monthlyTotals.map((tot, idx) => (
                            <td key={idx} className="py-2.5 px-2 text-right font-mono">
                              {tot > 0 ? `₹${tot.toLocaleString()}` : "—"}
                            </td>
                          ))}
                          <td className="py-2.5 px-3 text-right font-black text-slate-900 bg-blue-50/20">
                            ₹{row.grandTotal.toLocaleString()}
                          </td>
                        </tr>
                      ))}

                    {/* Expense categories */}
                    <tr className="bg-rose-50/20 font-bold text-[9px] uppercase tracking-wider">
                      <td colSpan={15} className="py-1.5 px-3">Payments (Expenses)</td>
                    </tr>
                    {yearlyMatrix
                      .filter((row) => row.type === HeadType.Expense)
                      .map((row) => (
                        <tr key={row.headName} className="hover:bg-slate-50/40 transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-slate-800">{row.headName}</td>
                          <td className="py-2.5 px-2 text-rose-700 font-bold text-[9px]">Payment</td>
                          {row.monthlyTotals.map((tot, idx) => (
                            <td key={idx} className="py-2.5 px-2 text-right font-mono">
                              {tot > 0 ? `₹${tot.toLocaleString()}` : "—"}
                            </td>
                          ))}
                          <td className="py-2.5 px-3 text-right font-black text-slate-900 bg-rose-50/40">
                            ₹{row.grandTotal.toLocaleString()}
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
                {filteredTransactions.length === 0 ? (
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
                        {(currentUser.role === "Treasurer" || currentUser.role === "Admin") && (
                          <th className="py-2.5 px-4 text-center">Actions</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                      {filteredTransactions.map((tx) => {
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
                            <td className="py-3.5 px-4 text-right font-black text-slate-900">₹{tx.amount.toLocaleString()}</td>
                            
                            {(currentUser.role === "Treasurer" || currentUser.role === "Admin") && (
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
    </div>
  );
}
