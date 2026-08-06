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
  X,
  ArrowDownRight,
  ArrowUpRight,
  FileText,
  Receipt,
  BookOpen,
  BarChart3,
  MapPin,
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
  onUpdateTransaction?: (tx: Transaction) => void;
  initialReportTab?: ReportTab;
}

type PeriodType = "year" | "month" | "day" | "custom";

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
  onUpdateTransaction,
  initialReportTab,
}: DashboardProps) {
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

  // Loan Repayment Modal State
  const [repayModalTx, setRepayModalTx] = useState<Transaction | null>(null);
  const [repaymentAmount, setRepaymentAmount] = useState<number>(0);
  const [repaymentMode, setRepaymentMode] = useState<"Cash" | "Bank">("Cash");
  const [repaymentDate, setRepaymentDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [repaymentRemarks, setRepaymentRemarks] = useState<string>("");

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
  const [isReportDropdownOpen, setIsReportDropdownOpen] = useState(false);

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
      if (!tx.date) return false;
      const dateStr = tx.date.slice(0, 10);
      const parts = dateStr.split("-");
      const txYear = parts.length > 0 ? parseInt(parts[0], 10) : 0;
      const txMonth = parts.length > 1 ? parseInt(parts[1], 10) - 1 : 0;

      if (periodType === "year") {
        // Indian Financial Year: April of selectedYear to March of selectedYear + 1
        const startStr = `${selectedYear}-04-01`;
        const endStr = `${selectedYear + 1}-03-31`;
        if (dateStr < startStr || dateStr > endStr) {
          return false;
        }
      } else if (periodType === "month") {
        // Specific Month in selected Year
        if (txYear !== selectedYear || txMonth !== selectedMonth) {
          return false;
        }
      } else if (periodType === "day") {
        // Specific Day YYYY-MM-DD
        if (dateStr !== selectedDay) {
          return false;
        }
      } else if (periodType === "custom") {
        if (startDate && dateStr < startDate) return false;
        if (endDate && dateStr > endDate) return false;
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
  }, [transactions, selectedChapters, periodType, selectedYear, selectedMonth, selectedDay, startDate, endDate, searchTerm]);

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
      if (!selectedChapters.includes(tx.chapterId)) return;

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
    link.setAttribute("download", `IHMA_Ledger_${activeReportTab}_sheet.csv`);
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

          {/* Date Range Selector Bar */}
          <div className="bg-[#F8FAFC] p-4 border border-slate-200/80 rounded-2xl space-y-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4.5 w-4.5 text-blue-600" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Select Period Range</span>
              </div>

              {/* Range Type Buttons */}
              <div className="flex flex-wrap bg-white border border-slate-200 rounded-xl p-1 gap-1">
                {(["year", "month", "day", "custom"] as PeriodType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setPeriodType(type)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors capitalize cursor-pointer ${
                      periodType === type
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    {type === "year"
                      ? "Full Year"
                      : type === "month"
                      ? "Specific Month"
                      : type === "day"
                      ? "Single Day"
                      : "Custom Range"}
                  </button>
                ))}
              </div>
            </div>

            {/* Sub-selectors for chosen PeriodType */}
            <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-slate-200/50 text-xs">
              {(periodType === "year" || periodType === "month") && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-600 font-semibold">Financial Year:</span>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                    className="px-3 py-1.5 border border-slate-300 rounded-xl font-bold text-slate-900 bg-white"
                  >
                    <option value={2026}>2026-27</option>
                    <option value={2025}>2025-26</option>
                    <option value={2024}>2024-25</option>
                  </select>
                </div>
              )}

              {periodType === "month" && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-600 font-semibold">Month:</span>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
                    className="px-3 py-1.5 border border-slate-300 rounded-xl font-bold text-slate-900 bg-white"
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

              {periodType === "day" && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-600 font-semibold">Select Day:</span>
                  <input
                    type="date"
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(e.target.value)}
                    className="px-3 py-1.5 border border-slate-300 rounded-xl font-bold text-slate-900 bg-white"
                  />
                </div>
              )}

              {periodType === "custom" && (
                <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 font-medium">From:</span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="px-2.5 py-1 border border-slate-300 rounded-lg font-bold text-slate-900 bg-white"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 font-medium">To:</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="px-2.5 py-1 border border-slate-300 rounded-lg font-bold text-slate-900 bg-white"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: SUMMARY */}
      <div className="space-y-4">
        <div className="flex justify-between items-center border-b border-slate-200 pb-2">
          <h2 className="text-xl font-black text-slate-900 font-display tracking-tight">Summary</h2>
          <span className="text-xs font-semibold text-slate-500">
            {periodType === "year" && `Financial Year ${selectedYear}-${(selectedYear + 1).toString().slice(2)}`}
            {periodType === "month" && `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][selectedMonth]} ${selectedYear}`}
            {periodType === "day" && formatDateDMY(selectedDay)}
            {periodType === "custom" && `${formatDateDMY(startDate)} to ${formatDateDMY(endDate)}`}
          </span>
        </div>

        {/* SUMMARY TABLES GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* 1. RECEIPTS SUMMARY TABLE */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-4 py-3 bg-emerald-50/80 border-b border-emerald-100 flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                <span>💰</span> Receipts (Income)
              </h3>
              <span className="text-[11px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-200">
                Total: ₹{summaryMetrics.totalIncomeGrand.toLocaleString()}
              </span>
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
                    <td className="py-2.5 px-4 font-semibold text-slate-800">Actual Income</td>
                    <td className="py-2.5 px-4 text-right font-mono">₹{summaryMetrics.actualIncomeCash.toLocaleString()}</td>
                    <td className="py-2.5 px-4 text-right font-mono">₹{summaryMetrics.actualIncomeBank.toLocaleString()}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900 bg-slate-50/60">
                      ₹{summaryMetrics.actualIncomeTotal.toLocaleString()}
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-4 font-semibold text-slate-800">Loan Repayments Received</td>
                    <td className="py-2.5 px-4 text-right font-mono">
                      {summaryMetrics.loanRepaidCash > 0 ? `₹${summaryMetrics.loanRepaidCash.toLocaleString()}` : "—"}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono">
                      {summaryMetrics.loanRepaidBank > 0 ? `₹${summaryMetrics.loanRepaidBank.toLocaleString()}` : "—"}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-800 bg-slate-50/60">
                      {summaryMetrics.loanRepaidTotal > 0 ? `₹${summaryMetrics.loanRepaidTotal.toLocaleString()}` : "—"}
                    </td>
                  </tr>
                  <tr className="bg-emerald-50/60 font-black text-emerald-950 border-t-2 border-emerald-200">
                    <td className="py-3 px-4 uppercase text-[11px] tracking-wider">TOTAL RECEIPTS</td>
                    <td className="py-3 px-4 text-right font-mono">₹{summaryMetrics.totalIncomeCash.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-mono">₹{summaryMetrics.totalIncomeBank.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-mono text-sm bg-emerald-100/70 text-emerald-950">
                      ₹{summaryMetrics.totalIncomeGrand.toLocaleString()}
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
                <span>💸</span> Payments (Expenses)
              </h3>
              <span className="text-[11px] font-bold text-rose-700 bg-white px-2 py-0.5 rounded-full border border-rose-200">
                Total: ₹{summaryMetrics.totalExpenseGrand.toLocaleString()}
              </span>
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
                    <td className="py-2.5 px-4 font-semibold text-slate-800">Actual Expenses</td>
                    <td className="py-2.5 px-4 text-right font-mono">₹{summaryMetrics.actualExpenseCash.toLocaleString()}</td>
                    <td className="py-2.5 px-4 text-right font-mono">₹{summaryMetrics.actualExpenseBank.toLocaleString()}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900 bg-slate-50/60">
                      ₹{summaryMetrics.actualExpenseTotal.toLocaleString()}
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-4 font-semibold text-slate-800">Loans Given (Outflow)</td>
                    <td className="py-2.5 px-4 text-right font-mono">
                      {summaryMetrics.loansGivenCash > 0 ? `₹${summaryMetrics.loansGivenCash.toLocaleString()}` : "—"}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono">
                      {summaryMetrics.loansGivenBank > 0 ? `₹${summaryMetrics.loansGivenBank.toLocaleString()}` : "—"}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-rose-800 bg-slate-50/60">
                      {summaryMetrics.loansGivenTotal > 0 ? `₹${summaryMetrics.loansGivenTotal.toLocaleString()}` : "—"}
                    </td>
                  </tr>
                  <tr className="bg-rose-50/60 font-black text-rose-950 border-t-2 border-rose-200">
                    <td className="py-3 px-4 uppercase text-[11px] tracking-wider">TOTAL PAYMENTS</td>
                    <td className="py-3 px-4 text-right font-mono">₹{summaryMetrics.totalExpenseCash.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-mono">₹{summaryMetrics.totalExpenseBank.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-mono text-sm bg-rose-100/70 text-rose-950">
                      ₹{summaryMetrics.totalExpenseGrand.toLocaleString()}
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
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Net Cash Balance</span>
              <span className={`text-base font-black ${summaryMetrics.netCashBalance >= 0 ? "text-slate-900" : "text-rose-700"}`}>
                ₹{summaryMetrics.netCashBalance.toLocaleString()}
              </span>
            </div>
            <span className="text-xl">💵</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex justify-between items-center">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Net Bank Balance</span>
              <span className={`text-base font-black ${summaryMetrics.netBankBalance >= 0 ? "text-slate-900" : "text-rose-700"}`}>
                ₹{summaryMetrics.netBankBalance.toLocaleString()}
              </span>
            </div>
            <span className="text-xl">🏦</span>
          </div>

          <div className="bg-slate-900 text-white border border-slate-800 rounded-xl p-3.5 shadow-xs flex justify-between items-center">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Net Surplus / Deficit</span>
              <span className={`text-base font-black ${summaryMetrics.netTotalBalance >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {summaryMetrics.netTotalBalance >= 0 ? "+" : ""}₹{summaryMetrics.netTotalBalance.toLocaleString()}
              </span>
            </div>
            <span className="text-xl">⚖️</span>
          </div>
        </div>
      </div>

      {/* SECTION 2: DETAILED REPORTS */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex justify-between items-center border-b border-slate-200 pb-2">
          <h2 className="text-xl font-black text-slate-900 font-display tracking-tight">Detailed Report</h2>
        </div>

        {/* ACTIVE SHEET CONTAINER */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs">
          {/* Sheets Nav & Actions */}
          <div className="bg-slate-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 rounded-t-2xl relative z-20">
            <div className="flex items-center gap-2.5 w-full lg:max-w-md">
              <span className="text-slate-500 text-[11px] sm:text-xs font-bold uppercase tracking-wider shrink-0 hidden sm:inline">
                Report View:
              </span>

              {/* CUSTOM STYLED DROPDOWN */}
              {(() => {
                const reportTabOptions = [
                  { id: "payments" as ReportTab, label: "Payments (Expenses)", group: "Financial Registers", icon: ArrowUpRight, count: `${filteredPayments.length} entries` },
                  { id: "receipts" as ReportTab, label: "Receipts (Income)", group: "Financial Registers", icon: ArrowDownRight, count: `${filteredReceipts.length} entries` },
                  { id: "loans" as ReportTab, label: "Temporary Loan Registry", group: "Financial Registers", icon: Briefcase, count: `${filteredLoans.length} loans` },
                  { id: "raw" as ReportTab, label: "Consolidated Raw Ledger", group: "Financial Registers", icon: BookOpen, count: `${filteredTransactions.length} entries` },
                  
                  { id: "members" as ReportTab, label: "Member Doctor Directory", group: "Directories & Masters", icon: Users, count: `${filteredMembers.length} doctors` },
                  { id: "chapters" as ReportTab, label: "Chapter Master Directory", group: "Directories & Masters", icon: MapPin, count: `${chapterDirectory.length} chapters` },
                  { id: "assets" as ReportTab, label: "Asset Register", group: "Directories & Masters", icon: Building2, count: `${filteredAssets.length} assets` },
                  { id: "bank_balances" as ReportTab, label: "FD & Bank Accounts", group: "Directories & Masters", icon: Landmark, count: `${filteredBankBalances.length} accounts` },
                  { id: "entity_types" as ReportTab, label: "Entity Types Taxonomy", group: "Directories & Masters", icon: Layers, count: "5 Tiers" },
                  
                  { id: "monthly" as ReportTab, label: "Monthly Summary Aggregation", group: "Analytical Reports", icon: BarChart3, count: "12 Months" },
                  { id: "yearly" as ReportTab, label: "Annual Matrix Sheet (Apr - Mar)", group: "Analytical Reports", icon: Calendar, count: "FY Matrix" },
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
                        <div className="absolute top-full left-0 mt-2 w-full sm:w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden max-h-96 overflow-y-auto divide-y divide-slate-100">
                          {["Financial Registers", "Directories & Masters", "Analytical Reports"].map((groupName) => {
                            const groupOptions = reportTabOptions.filter((o) => o.group === groupName);
                            if (groupOptions.length === 0) return null;

                            return (
                              <div key={groupName} className="p-1.5">
                                <div className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                                  {groupName}
                                </div>
                                {groupOptions.map((opt) => {
                                  const OptIcon = opt.icon;
                                  const isSelected = activeReportTab === opt.id;

                                  return (
                                    <button
                                      key={opt.id}
                                      type="button"
                                      onClick={() => {
                                        setActiveReportTab(opt.id);
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
                      <th className="py-2.5 px-3">Mode</th>
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
                            <td className="py-3 px-3 text-right font-bold text-slate-900">₹{tx.amount.toLocaleString()}</td>
                            <td className="py-3 px-3 text-right font-medium text-emerald-700">₹{(tx.amountReturned || 0).toLocaleString()}</td>
                            <td className="py-3 px-3 text-right font-black text-indigo-900">₹{bal.toLocaleString()}</td>
                            <td className="py-3 px-3 font-mono text-slate-600 whitespace-nowrap">{tx.loanReturnDate ? formatDateDMY(tx.loanReturnDate) : "—"}</td>
                            <td className="py-3 px-3 text-slate-500 max-w-xs truncate">{tx.remarks || "—"}</td>
                            {(currentUser.role === "Treasurer" || currentUser.role === "Admin") && (
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
                      .map((row, rowIdx) => (
                        <tr key={row.headId || `exp_${row.headName}_${rowIdx}`} className="hover:bg-slate-50/40 transition-colors">
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

      {/* LOAN REPAYMENT MODAL */}
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
                  <span className="text-sm font-black text-emerald-950">₹{repayModalTx.amount.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-emerald-700 font-semibold block">Outstanding Balance</span>
                  <span className="text-sm font-black text-indigo-900">
                    ₹{(repayModalTx.loanBalance !== undefined ? repayModalTx.loanBalance : (repayModalTx.amount - (repayModalTx.amountReturned || 0))).toLocaleString()}
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
