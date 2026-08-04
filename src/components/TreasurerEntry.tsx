/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  User,
  AccountHead,
  HeadType,
  Transaction,
  Member,
  Asset,
  BankBalance,
  ChapterMaster,
  ReportTab,
} from "../types";
import { CHAPTERS } from "../mockData";
import { formatDateDMY, formatINR } from "../utils/formatters";
import {
  ArrowLeft,
  Check,
  Search,
  User as UserIcon,
  Calendar,
  CreditCard,
  Building,
  Receipt,
  TrendingUp,
  TrendingDown,
  Info,
  HelpCircle,
  ShieldCheck,
  Plus,
  Award,
  Users,
  CheckCircle2,
  DollarSign,
  Briefcase,
  Layers,
  Sparkles,
  ChevronRight,
  AlertTriangle,
  X,
} from "lucide-react";

interface TreasurerEntryProps {
  currentUser: User;
  accountHeads: AccountHead[];
  membersList?: Member[];
  chapterDirectory?: ChapterMaster[];
  transactions?: Transaction[];
  onAddTransaction: (tx: Omit<Transaction, "id" | "createdBy" | "createdAt" | "chapterId" | "headName">) => void;
  onUpdateTransaction: (tx: Transaction) => void;
  editingTransaction: Transaction | null;
  onCancelEdit: () => void;
  onAddMember?: (member: Omit<Member, "id" | "slNo">) => void;
  onAddAsset?: (asset: Omit<Asset, "id" | "slNo">) => void;
  onAddBankBalance?: (bankBalance: Omit<BankBalance, "id" | "slNo">) => void;
  onOpenReports?: (tab?: ReportTab) => void;
}

export type EntryWizardType = "income" | "expense" | "loan" | "loans_dashboard" | "repay_loan" | "member" | "asset" | "bank_balance" | null;

export default function TreasurerEntry({
  currentUser,
  accountHeads,
  membersList = [],
  chapterDirectory = [],
  transactions = [],
  onAddTransaction,
  onUpdateTransaction,
  editingTransaction,
  onCancelEdit,
  onAddMember,
  onAddAsset,
  onAddBankBalance,
  onOpenReports,
}: TreasurerEntryProps) {
  // Determine chapter details
  const userChapter = CHAPTERS.find((c) => c.id === currentUser.nodeId);
  const defaultChapterId = currentUser.nodeId && currentUser.nodeId !== "cochin" ? currentUser.nodeId : "KL-EK-CO01";
  const defaultChapterName = userChapter ? userChapter.name : "Cochin Chapter";

  // Active Wizard Mode
  const [activeWizard, setActiveWizard] = useState<EntryWizardType>(null);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // Repayment Flow State
  const [selectedLoan, setSelectedLoan] = useState<Transaction | null>(null);
  const [repaymentAmount, setRepaymentAmount] = useState<number>(0);
  const [repaymentRemarks, setRepaymentRemarks] = useState<string>("");
  const [repaymentStep, setRepaymentStep] = useState<number>(0);

  // Wizard Data State
  const [formData, setFormData] = useState<any>({});
  const [memberSearchTerm, setMemberSearchTerm] = useState<string>("");
  const [qualSearchTerm, setQualSearchTerm] = useState<string>("");

  const QUALIFICATION_OPTIONS = [
    "BHMS",
    "MBBS",
    "BAMS",
    "MD (Homeo)",
    "MD (General)",
    "MS",
    "BDS",
    "BUMS",
    "BNYS",
    "DHMS",
    "PhD",
    "DNB",
    "Fellowship",
    "LLB",
    "MCh",
    "DM",
    "MPH",
    "MBA (Hospital Mgmt)",
    "M.Sc",
  ];

  // Populate data when editing an existing transaction
  useEffect(() => {
    if (editingTransaction) {
      if (editingTransaction.type === HeadType.Income) {
        setActiveWizard("income");
        setFormData({
          chapterId: editingTransaction.chapterIdInput || defaultChapterId,
          chapterName: editingTransaction.chapterNameInput || defaultChapterName,
          category: editingTransaction.headId || "membership",
          membershipTier: "Gold",
          membershipStatus: "Active",
          partyId: editingTransaction.paidByMemberId || "OTHER",
          partyName: editingTransaction.paidBy || "",
          paymentMode: editingTransaction.paymentMode || null, // NO PREFILLED DEFAULT
          offeredAmount: editingTransaction.offeredAmount || editingTransaction.amount,
          paidAmount: editingTransaction.paidAmount || editingTransaction.amount,
          voucherNumber: editingTransaction.voucherNumber || "RV-101",
          date: editingTransaction.date || new Date().toISOString().slice(0, 10),
          remarks: editingTransaction.description || "",
        });
      } else if (editingTransaction.type === HeadType.Expense) {
        setActiveWizard("expense");
        setFormData({
          chapterId: editingTransaction.chapterIdInput || defaultChapterId,
          chapterName: editingTransaction.chapterNameInput || defaultChapterName,
          category: editingTransaction.headId || "venue",
          partyId: "OTHER",
          partyName: editingTransaction.paidTo || "",
          paidBy: editingTransaction.paidBy || currentUser.name,
          paymentMode: editingTransaction.paymentMode || null, // NO PREFILLED DEFAULT
          payableAmount: editingTransaction.payableAmount || editingTransaction.amount,
          paidAmount: editingTransaction.paidAmount || editingTransaction.amount,
          voucherNumber: editingTransaction.voucherNumber || "PV-201",
          date: editingTransaction.date || new Date().toISOString().slice(0, 10),
          remarks: editingTransaction.description || "",
        });
      } else if (editingTransaction.type === HeadType.Loan) {
        setActiveWizard("loan");
        setFormData({
          chapterId: editingTransaction.chapterIdInput || defaultChapterId,
          chapterName: editingTransaction.chapterNameInput || defaultChapterName,
          recipientCategory: "chapter",
          recipientId: editingTransaction.paidToId || "",
          recipientName: editingTransaction.paidToName || editingTransaction.paidTo || "",
          loanAmount: editingTransaction.amount,
          targetReturnDate: editingTransaction.loanReturnDate || new Date().toISOString().slice(0, 10),
          particulars: editingTransaction.particulars || "",
          remarks: editingTransaction.remarks || "",
          voucherNumber: editingTransaction.voucherNumber || "LV-301",
          date: editingTransaction.date || new Date().toISOString().slice(0, 10),
        });
      }
      setCurrentStep(0);
      setIsSuccess(false);
    }
  }, [editingTransaction]);

  // Format INR currency
  const formatINR = (n: number | string) => {
    const num = Number(n) || 0;
    return "₹" + num.toLocaleString("en-IN");
  };

  // Reset Wizard State
  const handleStartWizard = (type: EntryWizardType) => {
    setActiveWizard(type);
    setCurrentStep(0);
    setIsSuccess(false);
    setMemberSearchTerm("");

    const todayStr = new Date().toISOString().slice(0, 10);

    // Initial blank state with NO prefilled defaults for choices
    if (type === "income") {
      setFormData({
        chapterId: defaultChapterId,
        chapterName: defaultChapterName,
        category: null, // User must explicitly tap
        membershipTier: null,
        membershipStatus: null,
        partyId: null,
        partyName: "",
        paymentMode: null, // Explicit tap required!
        offeredAmount: 0,
        paidAmount: 0,
        voucherNumber: `RV-${Math.floor(100 + Math.random() * 900)}`,
        date: todayStr,
        remarks: "",
      });
    } else if (type === "expense") {
      setFormData({
        chapterId: defaultChapterId,
        chapterName: defaultChapterName,
        category: null,
        partyId: null,
        partyName: "",
        paidBy: "", // Do not auto select treasurer
        paymentMode: null, // Explicit tap required!
        payableAmount: 0,
        paidAmount: 0,
        voucherNumber: `PV-${Math.floor(100 + Math.random() * 900)}`,
        date: todayStr,
        remarks: "",
      });
    } else if (type === "loan") {
      setFormData({
        chapterId: defaultChapterId,
        chapterName: defaultChapterName,
        date: todayStr,
        recipientCategory: "chapter", // Only chapters
        recipientId: null,
        recipientName: "",
        particulars: "",
        loanAmount: 0,
        targetReturnDate: todayStr,
        remarks: "",
        voucherNumber: `LV-${Math.floor(100 + Math.random() * 900)}`,
      });
    } else if (type === "loans_dashboard") {
      setFormData({});
      setSelectedLoan(null);
      setRepaymentAmount(0);
      setRepaymentRemarks("");
      setRepaymentStep(0);
    } else if (type === "member") {
      setFormData({
        memberName: "",
        qualifications: [],
        qualification: "",
        chapterId: defaultChapterId,
        chapterName: defaultChapterName,
        membershipType: "Silver", // Silver, Gold, or Platinum
        membershipDate: todayStr,
        membershipStatus: "Active",
        mobileNumber: "",
        whatsappNumber: "",
        email: "",
        clinicNumber: "",
      });
      setQualSearchTerm("");
    } else if (type === "asset") {
      setFormData({
        assetName: "",
        category: null,
        chapterId: defaultChapterId,
        chapterName: defaultChapterName,
        purchaseDate: todayStr,
        assetValue: 0,
        assetLife: 5,
        custodianName: currentUser.name,
      });
    } else if (type === "bank_balance") {
      setFormData({
        amountType: null, // FD vs Bank Balance
        chapterId: defaultChapterId,
        chapterName: defaultChapterName,
        amount: 0,
        date: todayStr,
      });
    }
  };

  const handleCloseWizard = () => {
    setActiveWizard(null);
    setCurrentStep(0);
    setFormData({});
    setIsSuccess(false);
    if (editingTransaction) {
      onCancelEdit();
    }
  };

  // Define step configurations dynamically
  const getWizardSteps = () => {
    if (activeWizard === "income") {
      const isMembership = formData.category === "membership";
      const isOthers = formData.category === "others";

      const steps = [
        { id: "date", title: "Select Receipt Date", sub: "Default is today; select any date up to today." },
        { id: "collected_by", title: "Who collected this income?", sub: "Search doctor name or choose guest/non-registered option." },
        { id: "paid_by", title: "Who paid this amount?", sub: "Search IHMA member doctor (stores Member ID) or select guest." },
        { id: "category", title: "Select Income Head", sub: "Choose the income category for this receipt." },
      ];

      if (isMembership) {
        steps.push(
          { id: "membership_tier", title: "Select Membership Tier", sub: "Choose subscription plan tier." }
        );
      }

      if (isOthers) {
        steps.push(
          { id: "other_category_text", title: "Specify Income Category", sub: "Optionally enter custom category description." }
        );
      }

      steps.push(
        { id: "amount", title: "Offered & Paid Amount", sub: "Select preset amounts or enter custom amounts." },
        { id: "payment_mode", title: "Select Mode of Payment", sub: "Choose cash drawer or bank transaction." },
        { id: "remarks", title: "Enter Remarks / Notes", sub: "Optional additional notes for this receipt." },
        { id: "review", title: "Review & Save Receipt Entry", sub: "Verify all receipt details and auto-fetched chapter ID before saving." }
      );
      return steps;
    }

    if (activeWizard === "expense") {
      const isDigitalMedia = formData.category === "digital_media";
      const isWebsiteOrApp =
        isDigitalMedia && (formData.digitalMediaType === "Website" || formData.digitalMediaType === "Application");
      const isOthers = formData.category === "others";

      const steps = [
        { id: "date", title: "Select Payment Date", sub: "Default is today; select any date up to today." },
        { id: "paid_by", title: "Who paid this expense?", sub: "Search doctor, treasurer, or enter payer name." },
        { id: "paid_to", title: "Who was this paid to?", sub: "Search payee doctor, vendor, or enter custom party name." },
        { id: "category", title: "Select Expense Head", sub: "Choose the matching expense account head." },
      ];

      if (isDigitalMedia) {
        steps.push(
          { id: "digital_media_type", title: "Select Digital Media Type", sub: "Choose Website, Application, or Posters." }
        );
        if (isWebsiteOrApp) {
          steps.push(
            { id: "digital_media_charge", title: "Select Charge Type", sub: "Choose Development, Annual Maintenance, or Upgrade charge." }
          );
        }
      }

      if (isOthers) {
        steps.push(
          { id: "other_category_text", title: "Specify Expense Category", sub: "Optionally enter custom category description." }
        );
      }

      steps.push(
        { id: "amount", title: "Payable & Paid Amount", sub: "Specify full payable sum and actual paid amount." },
        { id: "payment_mode", title: "Select Mode of Payment", sub: "Choose cash drawer or bank transaction." },
        { id: "remarks", title: "Enter Remarks / Notes", sub: "Optional additional notes for this expense." },
        { id: "review", title: "Review & Save Expense Entry", sub: "Verify all voucher details and auto-fetched chapter ID before saving." }
      );
      return steps;
    }

    if (activeWizard === "loan") {
      return [
        { id: "date", title: "Select Loan Date", sub: "Default is today; select loan disbursement date." },
        { id: "paid_to", title: "Paid To Chapter", sub: "Search & select chapter entity (loans are given only to chapters)." },
        { id: "particulars", title: "Loan Particulars", sub: "Enter loan details or event advance purpose." },
        { id: "amount", title: "Loan Amount", sub: "Specify principal sum disbursed." },
        { id: "loan_return_date", title: "Agreed Return Date", sub: "Set expected repayment deadline date." },
        { id: "remarks", title: "Remarks / Notes", sub: "Optional notes for this loan voucher." },
        { id: "review", title: "Review & Register Loan", sub: "Audit loan parameters before confirming." },
      ];
    }

    if (activeWizard === "member") {
      return [
        { id: "member_info", title: "Doctor Name & Qualifications", sub: "Enter doctor name and select medical/professional qualifications." },
        { id: "tier_status", title: "Membership Tier & Start Date", sub: "Select tier (Silver, Gold, Platinum) and membership start date." },
        { id: "contact_info", title: "Contact & Clinic Information", sub: "Enter mobile, WhatsApp, email, and office/clinic phone numbers." },
        { id: "review", title: "Confirm Member Profile", sub: "Review doctor profile details before saving to directory." },
      ];
    }

    if (activeWizard === "asset") {
      return [
        { id: "asset_info", title: "Asset Category & Name", sub: "Identify physical capital asset." },
        { id: "value_custodian", title: "Asset Value & Custodian", sub: "Set estimated value and responsible person." },
        { id: "review", title: "Review Asset Entry", sub: "Confirm asset register record." },
      ];
    }

    if (activeWizard === "bank_balance") {
      return [
        { id: "balance_type", title: "Deposit Account Type", sub: "Select Liquid Bank Balance vs Fixed Deposit (FD)." },
        { id: "balance_amount", title: "Account Balance", sub: "Enter closing balance in INR." },
        { id: "review", title: "Review Balance Record", sub: "Confirm bank balance record." },
      ];
    }

    return [];
  };

  const steps = getWizardSteps();
  const currentStepConfig = steps[currentStep] || { id: "", title: "", sub: "" };

  // Validation: Check if current step allows advancing to Next
  const isStepValid = () => {
    if (!currentStepConfig) return false;
    const sId = currentStepConfig.id;

    if (sId === "date") return !!formData.date;
    if (sId === "collected_by") return !!formData.collectedBy && !!formData.collectedBy.trim();
    if (sId === "paid_by") return !!formData.paidBy && !!formData.paidBy.trim();
    if (sId === "paid_to") {
      if (activeWizard === "loan") {
        return !!formData.recipientId && !!formData.recipientName;
      }
      return !!formData.paidTo && !!formData.paidTo.trim();
    }
    if (sId === "category") return !!formData.category;
    if (sId === "membership_tier") return !!formData.membershipTier;
    if (sId === "digital_media_type") return !!formData.digitalMediaType;
    if (sId === "digital_media_charge") return !!formData.digitalMediaCharge;
    if (sId === "other_category_text") return true; // Optional text field
    if (sId === "payment_mode") return !!formData.paymentMode; // STRICT NO-DEFAULT RULE
    if (sId === "amount") {
      if (activeWizard === "income") {
        const offered = Number(formData.offeredAmount || 0);
        const paid = Number(formData.paidAmount || 0);
        if (paid > offered) return false; // Block if received > offered
        return offered > 0 && paid > 0;
      }
      if (activeWizard === "expense") {
        const payable = Number(formData.payableAmount || 0);
        const paid = Number(formData.paidAmount || 0);
        if (paid > payable) return false; // Block if paid > payable
        return payable > 0 && paid > 0;
      }
      if (activeWizard === "loan") {
        return Number(formData.loanAmount) > 0;
      }
      return true;
    }
    if (sId === "remarks") return true; // Optional

    if (sId === "recipient_type") return !!formData.recipientType;
    if (sId === "recipient_select" || (activeWizard === "loan" && sId === "paid_to")) {
      return !!formData.recipientId && !!formData.recipientName;
    }
    if (activeWizard === "loan" && sId === "particulars") {
      return !!formData.particulars && !!formData.particulars.trim();
    }
    if (sId === "loan_return_date") {
      return !!formData.targetReturnDate;
    }
    if (sId === "amount_details") return formData.loanAmount > 0 && !!formData.targetReturnDate;

    if (sId === "member_info") {
      const quals = Array.isArray(formData.qualifications)
        ? formData.qualifications
        : formData.qualification ? [formData.qualification] : [];
      return !!formData.memberName?.trim() && quals.length > 0;
    }
    if (sId === "tier_status") return !!formData.membershipType && !!formData.membershipDate;
    if (sId === "contact_info") return !!formData.mobileNumber?.trim();

    if (sId === "asset_info") return !!formData.category && !!formData.assetName?.trim();
    if (sId === "value_custodian") return formData.assetValue > 0 && !!formData.custodianName?.trim();

    if (sId === "balance_type") return !!formData.amountType;
    if (sId === "balance_amount") return formData.amount > 0;

    if (sId === "review") {
      if (activeWizard === "income") {
        const offered = Number(formData.offeredAmount || 0);
        const paid = Number(formData.paidAmount || 0);
        if (paid > offered) return false;
      }
      if (activeWizard === "expense") {
        const payable = Number(formData.payableAmount || 0);
        const paid = Number(formData.paidAmount || 0);
        if (paid > payable) return false;
      }
      return true;
    }

    return true;
  };

  // Submit Final Step
  const handleFinalSubmit = () => {
    const todayStr = new Date().toISOString().slice(0, 10);

    if (activeWizard === "income") {
      let headLabel =
        formData.category === "membership"
          ? `Membership (${formData.membershipTier || "Fee"})`
          : formData.category === "others"
          ? `Others - ${formData.otherCategoryText || "General"}`
          : formData.category
          ? formData.category.replace(/_/g, " ")
          : "Income";

      const payload = {
        date: formData.date || todayStr,
        type: HeadType.Income,
        headId: formData.category || "head_inc",
        amount: Number(formData.paidAmount),
        voucherNumber: formData.voucherNumber,
        chapterIdInput: formData.chapterId || defaultChapterId,
        chapterNameInput: formData.chapterName || defaultChapterName,
        collectedBy: formData.collectedBy || "Guest",
        paidBy: formData.paidBy || "Guest",
        paidByMemberId: formData.paidByMemberId && formData.paidByMemberId !== "GUEST" ? formData.paidByMemberId : undefined,
        offeredAmount: Number(formData.offeredAmount),
        paidAmount: Number(formData.paidAmount),
        balanceAmount: Math.max(0, Number(formData.offeredAmount) - Number(formData.paidAmount)),
        paymentMode: formData.paymentMode as "Cash" | "Bank",
        membershipTier: formData.membershipTier,
        categoryDetail: formData.category === "others" ? formData.otherCategoryText : undefined,
        remarks: formData.remarks,
        description: formData.remarks || `${headLabel} collected by ${formData.collectedBy || "Guest"} from ${formData.paidBy || "Guest"}`,
      };

      if (editingTransaction) {
        onUpdateTransaction({ ...editingTransaction, ...payload });
      } else {
        onAddTransaction(payload);
      }
    } else if (activeWizard === "expense") {
      let categoryLabel = formData.category ? formData.category.replace(/_/g, " ") : "Expense";
      if (formData.category === "digital_media") {
        categoryLabel = `Digital Media - ${formData.digitalMediaType || ""}`;
        if (formData.digitalMediaCharge) {
          categoryLabel += ` (${formData.digitalMediaCharge})`;
        }
      } else if (formData.category === "others" && formData.otherCategoryText) {
        categoryLabel = `Others - ${formData.otherCategoryText}`;
      }

      const payload = {
        date: formData.date || todayStr,
        type: HeadType.Expense,
        headId: formData.category || "head_exp",
        amount: Number(formData.paidAmount),
        voucherNumber: formData.voucherNumber,
        chapterIdInput: formData.chapterId || defaultChapterId,
        chapterNameInput: formData.chapterName || defaultChapterName,
        paidByExpense: formData.paidBy || currentUser.name,
        paidTo: formData.paidTo || "Vendor / Party",
        payableAmount: Number(formData.payableAmount),
        paidAmount: Number(formData.paidAmount),
        balanceAmount: Math.max(0, Number(formData.payableAmount) - Number(formData.paidAmount)),
        paymentMode: formData.paymentMode as "Cash" | "Bank",
        categoryDetail: categoryLabel,
        remarks: formData.remarks,
        description: formData.remarks || `${categoryLabel} paid by ${formData.paidBy} to ${formData.paidTo}`,
      };

      if (editingTransaction) {
        onUpdateTransaction({ ...editingTransaction, ...payload });
      } else {
        onAddTransaction(payload);
      }
    } else if (activeWizard === "loan") {
      const payload = {
        date: formData.date || todayStr,
        type: HeadType.Loan,
        headId: "loan",
        amount: Number(formData.loanAmount),
        voucherNumber: formData.voucherNumber,
        chapterIdInput: formData.chapterId || defaultChapterId,
        chapterNameInput: formData.chapterName || defaultChapterName,
        paidToCategory: "chapter" as const,
        paidTo: formData.recipientName,
        paidToId: formData.recipientId,
        paidToName: formData.recipientName,
        particulars: formData.particulars || "Temporary loan disbursement",
        amountReturned: 0,
        loanBalance: Number(formData.loanAmount),
        loanReturnDate: formData.targetReturnDate,
        remarks: formData.remarks,
        description: formData.particulars || `Loan disbursement to ${formData.recipientName}`,
      };

      if (editingTransaction) {
        onUpdateTransaction({ ...editingTransaction, ...payload });
      } else {
        onAddTransaction(payload);
      }
    } else if (activeWizard === "member" && onAddMember) {
      const quals = Array.isArray(formData.qualifications)
        ? formData.qualifications
        : formData.qualification ? [formData.qualification] : [];
      onAddMember({
        memberId: `MEM-${Math.floor(100 + Math.random() * 900)}`,
        memberName: formData.memberName,
        chapterIdInput: formData.chapterId,
        chapterNameInput: formData.chapterName,
        qualification: quals.join(", "),
        membershipType: formData.membershipType || "Silver",
        membershipDate: formData.membershipDate || todayStr,
        membershipStatus: formData.membershipStatus || "Active",
        mobileNumber: formData.mobileNumber,
        whatsappNumber: formData.whatsappNumber || formData.mobileNumber,
        email: formData.email || "",
        clinicNumber: formData.clinicNumber || "",
      });
    } else if (activeWizard === "asset" && onAddAsset) {
      onAddAsset({
        date: todayStr,
        chapterIdInput: formData.chapterId,
        chapterNameInput: formData.chapterName,
        assetId: `AST-${Math.floor(100 + Math.random() * 900)}`,
        assetName: formData.assetName,
        purchaseDate: formData.purchaseDate,
        assetValue: Number(formData.assetValue),
        category: formData.category || "General Asset",
        assetLife: Number(formData.assetLife) || 5,
        custodianName: formData.custodianName,
      });
    } else if (activeWizard === "bank_balance" && onAddBankBalance) {
      onAddBankBalance({
        date: formData.date || todayStr,
        chapterIdInput: formData.chapterId,
        chapterNameInput: formData.chapterName,
        amountType: formData.amountType || "Bank Balance",
        amount: Number(formData.amount),
      });
    }

    setIsSuccess(true);
  };

  // Income Heads
  const incomeHeads = [
    { key: "membership", label: "Membership", sub: "Silver (1 yr), Gold (12 yrs), Platinum (Lifelong)", icon: "🪪" },
    { key: "sponsorship", label: "Sponsorship", sub: "Event or corporate chapter sponsorship", icon: "💎" },
    { key: "donation", label: "Donation", sub: "Voluntary contribution or doctor endowment", icon: "🤝" },
    { key: "coaching_programs", label: "Coaching Programs", sub: "Academic courses, seminars, workshops", icon: "🎓" },
    { key: "profit_share", label: "Profit Share", sub: "Shared revenue from CME or publications", icon: "📈" },
    { key: "rent", label: "Rent", sub: "Rental income from chapter premises or equipment", icon: "🏢" },
    { key: "bank_income", label: "Bank Income", sub: "Savings interest or FD maturity interest", icon: "🏦" },
    { key: "others", label: "Others", sub: "Unclassified chapter receipt or category", icon: "📎" },
  ];

  // Expense Heads
  const expenseHeads = [
    { key: "TA_DA", label: "TA & DA", sub: "Travel allowance & daily allowance", icon: "🚗" },
    { key: "meeting", label: "Meeting Expense", sub: "Hall hire, refreshments & meeting logistics", icon: "🏛️" },
    { key: "printing_stationery", label: "Printing & Stationary", sub: "Certificates, banners, registers & stationery", icon: "🖨️" },
    { key: "postage", label: "Postage", sub: "Courier, registered mail & postal charges", icon: "📮" },
    { key: "digital_media", label: "Digital Media", sub: "Website, Application, Posters with sub-charges", icon: "💻" },
    { key: "bank_expense", label: "Bank Expense", sub: "Bank ledger charges, cheque book fees", icon: "🏦" },
    { key: "others", label: "Others", sub: "Unclassified or custom expense category", icon: "📎" },
  ];

  // Filter members for picker
  const filteredMembers = membersList.filter(
    (m) =>
      m.memberName.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
      m.memberId.toLowerCase().includes(memberSearchTerm.toLowerCase())
  );

  // Filter chapters for loan picker
  const filteredChapters = chapterDirectory.filter((c) =>
    c.chapterName.toLowerCase().includes(memberSearchTerm.toLowerCase())
  );

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* ---------------- HOME ENTRY DASHBOARD (When no wizard active) ---------------- */}
      {!activeWizard && (
        <div className="space-y-6">
          {/* Hero Banner Card */}
          <div className="bg-gradient-to-br from-[#0F6E5D] to-[#0B5548] text-white rounded-2xl p-5 sm:p-6 shadow-md border border-teal-700/30">
            <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4">
              {/* Left Side: Chapter Name & Chapter ID */}
              <div>
                <h2 className="text-xl sm:text-2xl font-bold font-display text-white">
                  {defaultChapterName}
                </h2>
                <span className="text-xs font-semibold text-teal-200/90 block mt-0.5 font-mono">
                  ID: {defaultChapterId}
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
                <span className="text-[10px] text-teal-200/90 font-medium bg-white/10 px-2 py-0.5 rounded-full mt-0.5 inline-block">
                  {currentUser.role}
                </span>
              </div>
            </div>
          </div>

          {/* Action Tap Cards Grid - 2 cols on mobile, 3 cols on desktop */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {/* Primary Highlight Card: View Reports & Summaries */}
            <button
              onClick={() => onOpenReports?.()}
              id="view-reports-summaries-button"
              className="group bg-gradient-to-br from-slate-900 via-slate-800 to-[#0F6E5D] text-white p-4 sm:p-5 rounded-2xl shadow-md border border-teal-600/40 hover:shadow-lg hover:border-teal-400 transition-all text-left flex flex-col justify-between cursor-pointer col-span-2 sm:col-span-2 md:col-span-3"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 w-full">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-teal-400/20 border border-teal-300/30 text-teal-200 flex items-center justify-center text-xl sm:text-2xl shrink-0 group-hover:scale-105 transition-transform">
                    📊
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="bg-teal-400/20 text-teal-200 border border-teal-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Financial Reports
                      </span>
                    </div>
                    <h3 className="font-bold text-base sm:text-lg text-white font-display mt-0.5">
                      View reports & summaries
                    </h3>
                  </div>
                </div>
                <div className="px-3.5 py-1.5 sm:px-4 sm:py-2 bg-teal-600 group-hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0 border border-teal-400/30 whitespace-nowrap">
                  <span>Open Reports</span>
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </button>

            {/* 1. Log Income */}
            <button
              onClick={() => handleStartWizard("income")}
              className="group bg-white p-5 rounded-2xl border border-teal-100 shadow-xs hover:shadow-md hover:border-teal-500 transition-all text-left flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center text-2xl mb-3 group-hover:scale-105 transition-transform">
                  💰
                </div>
                <h3 className="font-bold text-base text-slate-900 group-hover:text-teal-800 transition-colors">
                  Log Income / Receipt
                </h3>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-teal-700">
                <span>Start Receipt Wizard</span>
                <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* 2. Log Expense */}
            <button
              onClick={() => handleStartWizard("expense")}
              className="group bg-white p-5 rounded-2xl border border-amber-100 shadow-xs hover:shadow-md hover:border-amber-500 transition-all text-left flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center text-2xl mb-3 group-hover:scale-105 transition-transform">
                  🧾
                </div>
                <h3 className="font-bold text-base text-slate-900 group-hover:text-amber-800 transition-colors">
                  Log Expense / Payment
                </h3>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-700">
                <span>Start Payment Wizard</span>
                <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* 3. Loans Dashboard */}
            <button
              onClick={() => handleStartWizard("loans_dashboard")}
              className="group bg-white p-5 rounded-2xl border border-indigo-100 shadow-xs hover:shadow-md hover:border-indigo-500 transition-all text-left flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-800 flex items-center justify-center text-2xl mb-3 group-hover:scale-105 transition-transform">
                  💼
                </div>
                <h3 className="font-bold text-base text-slate-900 group-hover:text-indigo-800 transition-colors">
                  Loans
                </h3>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-700">
                <span>Loans Dashboard</span>
                <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* 4. Register Member */}
            <button
              onClick={() => handleStartWizard("member")}
              className="group bg-white p-5 rounded-2xl border border-emerald-100 shadow-xs hover:shadow-md hover:border-emerald-500 transition-all text-left flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center text-2xl mb-3 group-hover:scale-105 transition-transform">
                  👥
                </div>
                <h3 className="font-bold text-base text-slate-900 group-hover:text-emerald-800 transition-colors">
                  Add New Member Profile
                </h3>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-700">
                <span>Add Member</span>
                <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* 5. Log Asset */}
            <button
              onClick={() => handleStartWizard("asset")}
              className="group bg-white p-5 rounded-2xl border border-sky-100 shadow-xs hover:shadow-md hover:border-sky-500 transition-all text-left flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-800 flex items-center justify-center text-2xl mb-3 group-hover:scale-105 transition-transform">
                  🏢
                </div>
                <h3 className="font-bold text-base text-slate-900 group-hover:text-sky-800 transition-colors">
                  Register Chapter Asset
                </h3>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-sky-700">
                <span>Add Asset</span>
                <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* 6. Bank Balance / FD */}
            <button
              onClick={() => handleStartWizard("bank_balance")}
              className="group bg-white p-5 rounded-2xl border border-purple-100 shadow-xs hover:shadow-md hover:border-purple-500 transition-all text-left flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-800 flex items-center justify-center text-2xl mb-3 group-hover:scale-105 transition-transform">
                  🏦
                </div>
                <h3 className="font-bold text-base text-slate-900 group-hover:text-purple-800 transition-colors">
                  Log FD & Bank Balance
                </h3>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-purple-700">
                <span>Add Bank Balance</span>
                <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>

          {/* Audit Rule Reminder */}
          <div className="bg-slate-100/80 p-4 rounded-xl border border-slate-200 text-slate-600 text-xs flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-teal-700 shrink-0" />
            <p className="leading-relaxed">
              <strong className="text-slate-800 font-bold">Audit Rule:</strong> No free-typing where a selection will do. No prefilled defaults. Explicit tap decisions enforce accuracy during financial audits across 80+ chapters.
            </p>
          </div>
        </div>
      )}

      {/* ---------------- LOANS DASHBOARD ---------------- */}
      {activeWizard === "loans_dashboard" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Dashboard Header Bar */}
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-md border border-indigo-800/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <button
                  onClick={handleCloseWizard}
                  className="text-xs text-indigo-300 hover:text-white flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Home</span>
                </button>
                <span className="text-indigo-400 text-xs">•</span>
                <span className="text-indigo-300 text-xs font-semibold uppercase tracking-wider">
                  Treasurer Loan Ledger
                </span>
              </div>
              <h2 className="text-2xl font-bold font-display text-white">
                Loans Dashboard
              </h2>
              <p className="text-xs text-indigo-200/80 mt-1">
                Monitor chapter loans, track agreed return dates, and log loan repayments.
              </p>
            </div>

            <button
              onClick={() => handleStartWizard("loan")}
              id="log-new-loan-top-btn"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0 border border-indigo-400/30"
            >
              <Plus className="h-4 w-4" />
              <span>Log New Loan</span>
            </button>
          </div>

          {/* Loan List */}
          {(() => {
            const loanList = (transactions || []).filter((t) => t.type === HeadType.Loan);

            if (loanList.length === 0) {
              return (
                <div className="bg-white rounded-2xl p-8 sm:p-12 text-center border-2 border-dashed border-indigo-200 shadow-sm space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 text-3xl flex items-center justify-center mx-auto shadow-inner">
                    💼
                  </div>
                  <div className="max-w-md mx-auto space-y-1">
                    <h3 className="font-bold text-lg text-slate-900 font-display">
                      No Loans Logged Yet
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      There are no active or historical chapter loan disbursements recorded in this ledger.
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => handleStartWizard("loan")}
                      id="log-new-loan-highlighted-btn"
                      className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 hover:from-indigo-500 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg ring-4 ring-indigo-500/20 animate-pulse transition-all cursor-pointer"
                    >
                      <Plus className="h-5 w-5" />
                      <span>Log New Loan</span>
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Recorded Chapter Loans ({loanList.length})
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">
                    Showing all active & settled loans
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {loanList.map((loan) => {
                    const returnedAmt = loan.amountReturned || 0;
                    const currentBalance = Math.max(
                      0,
                      loan.loanBalance !== undefined
                        ? loan.loanBalance
                        : loan.amount - returnedAmt
                    );
                    const isSettled = currentBalance <= 0;

                    return (
                      <div
                        key={loan.id}
                        className={`bg-white rounded-2xl p-5 border transition-all shadow-xs ${
                          isSettled
                            ? "border-emerald-200 bg-emerald-50/20"
                            : "border-indigo-100 hover:border-indigo-300"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                                isSettled ? "bg-emerald-100 text-emerald-800" : "bg-indigo-100 text-indigo-800"
                              }`}
                            >
                              {isSettled ? "✅" : "💼"}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-sm text-slate-900 font-display">
                                  {loan.paidToName || loan.paidTo || "Chapter Loan"}
                                </h4>
                                {loan.paidToId && (
                                  <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200">
                                    {loan.paidToId}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {loan.particulars || loan.description || "Temporary chapter loan"}
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0">
                            {isSettled ? (
                              <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full border border-emerald-300 inline-flex items-center gap-1">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Fully Settled
                              </span>
                            ) : (
                              <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full border border-amber-300 inline-flex items-center gap-1">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                Outstanding Balance
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-b border-slate-100 text-xs">
                          <div>
                            <span className="text-slate-400 text-[10px] uppercase font-bold block">
                              Loan Amount
                            </span>
                            <span className="font-bold text-slate-900 text-sm">
                              {formatINR(loan.amount)}
                            </span>
                          </div>

                          <div>
                            <span className="text-slate-400 text-[10px] uppercase font-bold block">
                              Amount Returned
                            </span>
                            <span className="font-bold text-teal-700 text-sm">
                              {formatINR(returnedAmt)}
                            </span>
                          </div>

                          <div>
                            <span className="text-slate-400 text-[10px] uppercase font-bold block">
                              Remaining Balance
                            </span>
                            <span className={`font-bold text-sm ${isSettled ? "text-emerald-700" : "text-amber-800"}`}>
                              {formatINR(currentBalance)}
                            </span>
                          </div>

                          <div>
                            <span className="text-slate-400 text-[10px] uppercase font-bold block">
                              Agreed Return Date
                            </span>
                            <span className="font-semibold text-slate-800">
                              {loan.loanReturnDate ? formatDateDMY(loan.loanReturnDate) : "Not set"}
                            </span>
                          </div>
                        </div>

                        <div className="pt-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
                          <div className="text-slate-500 text-[11px] space-y-0.5">
                            <p>
                              <strong className="text-slate-700">Loan Date:</strong> {loan.date ? formatDateDMY(loan.date) : "—"} • <strong className="text-slate-700">Voucher #:</strong> {loan.voucherNumber || "LV-N/A"}
                            </p>
                            {isSettled && loan.loanReturnedDate && (
                              <p className="text-emerald-800 font-semibold flex items-center gap-1">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                Loan Returned Date: {formatDateDMY(loan.loanReturnedDate)}
                              </p>
                            )}
                            {loan.remarks && (
                              <p className="italic text-slate-600">
                                Remarks: {loan.remarks}
                              </p>
                            )}
                          </div>

                          <div className="shrink-0 w-full sm:w-auto">
                            {isSettled ? (
                              <div className="px-3 py-1.5 bg-slate-100 text-slate-500 rounded-lg text-[11px] font-semibold text-center border border-slate-200 cursor-not-allowed">
                                Loan fully returned - Not editable
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedLoan(loan);
                                  setRepaymentAmount(0);
                                  setRepaymentRemarks("");
                                  setRepaymentStep(0);
                                  setActiveWizard("repay_loan");
                                }}
                                className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <span>Record Repayment</span>
                                <ChevronRight className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ---------------- REPAY LOAN FLOW ---------------- */}
      {activeWizard === "repay_loan" && selectedLoan && (
        <div className="bg-white rounded-2xl shadow-md border border-slate-200/80 overflow-hidden space-y-0 animate-fadeIn">
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <button
                  onClick={() => setActiveWizard("loans_dashboard")}
                  className="text-xs text-indigo-300 hover:text-white flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Loans Dashboard</span>
                </button>
              </div>
              <h3 className="text-xl font-bold font-display text-white">
                Record Loan Repayment
              </h3>
              <p className="text-xs text-indigo-200 mt-0.5">
                Paid To: <span className="font-bold text-white">{selectedLoan.paidToName || selectedLoan.paidTo}</span> ({selectedLoan.paidToId || "Chapter"})
              </p>
            </div>

            <div className="text-right bg-white/10 px-3 py-1.5 rounded-xl border border-white/20">
              <span className="text-[10px] text-indigo-200 uppercase font-bold block">
                Current Balance
              </span>
              <span className="text-sm font-bold text-amber-300">
                {formatINR(
                  Math.max(
                    0,
                    selectedLoan.loanBalance !== undefined
                      ? selectedLoan.loanBalance
                      : selectedLoan.amount - (selectedLoan.amountReturned || 0)
                  )
                )}
              </span>
            </div>
          </div>

          {/* Step Content */}
          <div className="p-6 space-y-5">
            {repaymentStep === 0 && (
              <div className="space-y-4">
                <div className="bg-indigo-50/80 p-4 rounded-xl border border-indigo-200 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-medium">Original Loan Amount:</span>
                    <span className="font-bold text-slate-900">{formatINR(selectedLoan.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-medium">Previously Returned:</span>
                    <span className="font-bold text-teal-700">{formatINR(selectedLoan.amountReturned || 0)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-indigo-200/60 font-bold">
                    <span className="text-indigo-900">Current Outstanding Balance:</span>
                    <span className="text-amber-800 text-sm">
                      {formatINR(
                        Math.max(
                          0,
                          selectedLoan.loanBalance !== undefined
                            ? selectedLoan.loanBalance
                            : selectedLoan.amount - (selectedLoan.amountReturned || 0)
                        )
                      )}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Amount Returned Today (₹) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-xl font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      min="1"
                      max={
                        selectedLoan.loanBalance !== undefined
                          ? selectedLoan.loanBalance
                          : selectedLoan.amount - (selectedLoan.amountReturned || 0)
                      }
                      value={repaymentAmount || ""}
                      onChange={(e) => setRepaymentAmount(Number(e.target.value))}
                      className="w-full pl-9 pr-4 py-3 border border-slate-300 rounded-xl text-2xl font-bold font-display text-indigo-950 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Quick Presets */}
                {(() => {
                  const currentBal = Math.max(
                    0,
                    selectedLoan.loanBalance !== undefined
                      ? selectedLoan.loanBalance
                      : selectedLoan.amount - (selectedLoan.amountReturned || 0)
                  );
                  return (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-semibold text-slate-500">Quick Presets:</span>
                      <div className="flex flex-wrap gap-2">
                        {[1000, 2000, 5000, 10000].filter(amt => amt < currentBal).map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setRepaymentAmount(amt)}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                              repaymentAmount === amt
                                ? "bg-indigo-600 text-white border-indigo-600"
                                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            {formatINR(amt)}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setRepaymentAmount(currentBal)}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                            repaymentAmount === currentBal
                              ? "bg-emerald-600 text-white border-emerald-600"
                              : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                          }`}
                        >
                          Full Balance ({formatINR(currentBal)})
                        </button>
                      </div>
                    </div>
                  );
                })()}

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Repayment Remarks / Voucher Notes (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Returned via Cheque #102934 / Bank transfer"
                    value={repaymentRemarks}
                    onChange={(e) => setRepaymentRemarks(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            {repaymentStep === 1 && (
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
                  {/* 1. Loan Date */}
                  <div className="flex justify-between py-1.5 border-b border-slate-200">
                    <span className="text-slate-500 font-semibold">Loan Date:</span>
                    <span className="font-bold text-slate-900">{selectedLoan.date ? formatDateDMY(selectedLoan.date) : "—"}</span>
                  </div>

                  {/* 2. Paid To */}
                  <div className="flex justify-between py-1.5 border-b border-slate-200">
                    <span className="text-slate-500 font-semibold">Paid To (Chapter):</span>
                    <span className="font-bold text-slate-900">
                      {selectedLoan.paidToName || selectedLoan.paidTo} ({selectedLoan.paidToId || "Chapter"})
                    </span>
                  </div>

                  {/* 3. Amount */}
                  <div className="flex justify-between py-1.5 border-b border-slate-200">
                    <span className="text-slate-500 font-semibold">Original Loan Amount:</span>
                    <span className="font-bold text-slate-900">{formatINR(selectedLoan.amount)}</span>
                  </div>

                  {/* 4. Amount Returned */}
                  <div className="flex justify-between py-1.5 border-b border-slate-200">
                    <span className="text-slate-500 font-semibold">Total Amount Returned:</span>
                    <span className="font-bold text-teal-800 text-sm">
                      {formatINR((selectedLoan.amountReturned || 0) + repaymentAmount)}
                    </span>
                  </div>

                  {/* 5. Loan Balance */}
                  {(() => {
                    const newBal = Math.max(
                      0,
                      selectedLoan.amount - ((selectedLoan.amountReturned || 0) + repaymentAmount)
                    );
                    return (
                      <div className="flex justify-between py-1.5 border-b border-slate-200">
                        <span className="text-slate-500 font-semibold">Loan Balance:</span>
                        <span className={`font-bold text-sm ${newBal === 0 ? "text-emerald-700" : "text-amber-800"}`}>
                          {formatINR(newBal)}
                        </span>
                      </div>
                    );
                  })()}

                  {/* 6. Loan Return Date */}
                  <div className="flex justify-between py-1.5 border-b border-slate-200">
                    <span className="text-slate-500 font-semibold">Loan Return Date:</span>
                    <span className="font-bold text-slate-900">{selectedLoan.loanReturnDate ? formatDateDMY(selectedLoan.loanReturnDate) : "Not set"}</span>
                  </div>

                  {/* 7. Loan Returned Date - ONLY SHOWS WHEN FULLY LOAN IS RETURNED */}
                  {(() => {
                    const newBal = Math.max(
                      0,
                      selectedLoan.amount - ((selectedLoan.amountReturned || 0) + repaymentAmount)
                    );
                    const todayStr = new Date().toISOString().slice(0, 10);
                    if (newBal === 0) {
                      return (
                        <div className="flex justify-between py-1.5 border-b border-slate-200 bg-emerald-50 px-2 rounded-lg text-emerald-950 font-bold">
                          <span>Loan Returned Date:</span>
                          <span>{formatDateDMY(todayStr)} (Fully Repaid)</span>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* 8. Remarks */}
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-500 font-semibold">Remarks:</span>
                    <span className="font-medium text-slate-800 italic">
                      {repaymentRemarks || selectedLoan.remarks || "None"}
                    </span>
                  </div>
                </div>

                <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200 text-xs text-indigo-900 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-indigo-700" />
                  <span>Confirming this repayment will update the chapter loan ledger balance.</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
            <button
              onClick={() => {
                if (repaymentStep === 0) {
                  setActiveWizard("loans_dashboard");
                } else {
                  setRepaymentStep(0);
                }
              }}
              className="px-5 py-2.5 bg-white text-slate-700 font-bold rounded-xl border border-slate-200 hover:bg-slate-100 cursor-pointer text-xs"
            >
              {repaymentStep === 0 ? "Cancel" : "Back"}
            </button>

            {repaymentStep === 0 ? (
              <button
                disabled={
                  !repaymentAmount ||
                  repaymentAmount <= 0 ||
                  repaymentAmount >
                    Math.max(
                      0,
                      selectedLoan.loanBalance !== undefined
                        ? selectedLoan.loanBalance
                        : selectedLoan.amount - (selectedLoan.amountReturned || 0)
                    )
                }
                onClick={() => setRepaymentStep(1)}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all text-xs shadow-sm flex items-center gap-1.5"
              >
                <span>Proceed to Review</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => {
                  const todayStr = new Date().toISOString().slice(0, 10);
                  const prevReturned = selectedLoan.amountReturned || 0;
                  const newReturned = prevReturned + repaymentAmount;
                  const newBal = Math.max(0, selectedLoan.amount - newReturned);
                  const returnedDate = newBal <= 0 ? todayStr : selectedLoan.loanReturnedDate;

                  const updatedLoan: Transaction = {
                    ...selectedLoan,
                    amountReturned: newReturned,
                    loanBalance: newBal,
                    loanReturnedDate: returnedDate,
                    updatedAt: new Date().toISOString(),
                    remarks: repaymentRemarks
                      ? `${selectedLoan.remarks ? selectedLoan.remarks + " | " : ""}${repaymentRemarks}`
                      : selectedLoan.remarks,
                  };

                  onUpdateTransaction(updatedLoan);
                  setActiveWizard("loans_dashboard");
                }}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer transition-all text-xs shadow-md flex items-center gap-1.5"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Confirm & Save Repayment</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ---------------- GUIDED WIZARD CONTAINER ---------------- */}
      {activeWizard && activeWizard !== "loans_dashboard" && activeWizard !== "repay_loan" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden transition-all">
          {/* SUCCESS SCREEN */}
          {isSuccess ? (
            <div className="p-8 text-center space-y-6">
              <div className="w-20 h-20 bg-teal-50 text-teal-700 rounded-full flex items-center justify-center text-4xl mx-auto shadow-inner border border-teal-100 animate-bounce">
                ✓
              </div>
              <div>
                <h2 className="text-2xl font-bold font-display text-slate-900">
                  Entry Recorded Successfully
                </h2>
                <p className="text-slate-600 text-sm mt-1 max-w-md mx-auto">
                  Your entry has been committed to the ledger for{" "}
                  <strong className="text-slate-900 font-bold">{defaultChapterName}</strong>. It is now synced and visible across all chapter reporting sheets.
                </p>
              </div>

              <div className="pt-4 flex justify-center gap-3">
                <button
                  onClick={handleCloseWizard}
                  className="px-6 py-3 bg-[#0F6E5D] text-white font-bold rounded-xl hover:bg-[#0B5548] cursor-pointer transition-all text-sm shadow-md"
                >
                  Return to Dashboard
                </button>
                <button
                  onClick={() => handleStartWizard(activeWizard)}
                  className="px-6 py-3 bg-slate-100 text-slate-800 font-bold rounded-xl hover:bg-slate-200 cursor-pointer transition-all text-sm"
                >
                  Log Another Entry
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Wizard App Bar */}
              <div className="px-3 sm:px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2">
                <button
                  onClick={currentStep === 0 ? handleCloseWizard : () => setCurrentStep((prev) => prev - 1)}
                  className="shrink-0 px-2.5 sm:px-3 py-1.5 bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-xl cursor-pointer flex items-center gap-1 text-xs font-bold transition-all shadow-xs whitespace-nowrap"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>{currentStep === 0 ? "Cancel" : "Back"}</span>
                </button>

                <div className="text-center min-w-0 flex-1 px-1">
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 font-display truncate">
                    {activeWizard === "income" && "Log Income / Receipt"}
                    {activeWizard === "expense" && "Log Expense / Payment"}
                    {activeWizard === "loan" && "Log Loan / Disbursement"}
                    {activeWizard === "member" && "Register Member Profile"}
                    {activeWizard === "asset" && "Register Chapter Asset"}
                    {activeWizard === "bank_balance" && "Log Bank Balance / FD"}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-medium truncate">
                    {defaultChapterName}
                  </p>
                </div>

                <div className="shrink-0 text-[10px] sm:text-xs font-bold text-slate-600 bg-white px-2 sm:px-2.5 py-1 rounded-lg border border-slate-200 whitespace-nowrap">
                  Step {currentStep + 1} of {steps.length}
                </div>
              </div>

              {/* Progress Bar Header */}
              <div className="w-full bg-slate-100 h-1.5 flex">
                {steps.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-full flex-1 transition-all duration-300 ${
                      idx <= currentStep ? "bg-[#0F6E5D]" : "bg-transparent"
                    }`}
                  />
                ))}
              </div>

              {/* Step Question Header */}
              <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2">
                <h2 className="text-lg sm:text-xl font-extrabold font-display text-slate-900 leading-snug">
                  {currentStepConfig.title}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  {currentStepConfig.sub}
                </p>
              </div>

              {/* Step Content Workspace */}
              <div className="p-6 space-y-4">
                {/* ---------------- INCOME WIZARD STEPS ---------------- */}
                {activeWizard === "income" && (
                  <>
                    {/* Step: Date */}
                    {currentStepConfig.id === "date" && (
                      <div className="space-y-4">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Select Receipt Date (Max: Today)
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="date"
                            max={new Date().toISOString().slice(0, 10)}
                            value={formData.date || new Date().toISOString().slice(0, 10)}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            className="flex-1 px-4 py-3 border border-slate-300 rounded-xl text-sm font-semibold bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0F6E5D]"
                          />
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, date: new Date().toISOString().slice(0, 10) })}
                            className="px-4 py-3 bg-teal-50 text-teal-800 text-xs font-bold rounded-xl border border-teal-200 hover:bg-teal-100 cursor-pointer"
                          >
                            Set Today
                          </button>
                        </div>
                        <p className="text-xs text-slate-500">
                          Default is today ({new Date().toISOString().slice(0, 10)}). You can select any date up to today for backdated receipts.
                        </p>
                      </div>
                    )}

                    {/* Step: Collected By */}
                    {currentStepConfig.id === "collected_by" && (
                      <div className="space-y-3">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Who collected this income?
                        </label>

                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Search doctor name or ID..."
                            value={memberSearchTerm}
                            onChange={(e) => setMemberSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0F6E5D]"
                          />
                          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                        </div>

                        <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                          {/* 1. Logged in Treasurer */}
                          <div
                            onClick={() =>
                              setFormData({
                                ...formData,
                                collectedBy: currentUser.name,
                                collectedById: "TREASURER",
                              })
                            }
                            className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                              formData.collectedBy === currentUser.name
                                ? "border-[#0F6E5D] bg-[#E4F1EE]"
                                : "border-slate-200 hover:border-slate-300 bg-white"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-xs">
                                🔑
                              </div>
                              <div>
                                <h4 className="font-bold text-xs text-slate-900">{currentUser.name} (Treasurer)</h4>
                                <p className="text-[10px] text-slate-500">Logged in chapter treasurer</p>
                              </div>
                            </div>
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                formData.collectedBy === currentUser.name
                                  ? "border-[#0F6E5D] bg-[#0F6E5D] text-white"
                                  : "border-slate-300 bg-white"
                              }`}
                            >
                              {formData.collectedBy === currentUser.name && <Check className="h-3 w-3" />}
                            </div>
                          </div>

                          {/* 2. Registered Members (excluding current treasurer to prevent duplicate) */}
                          {filteredMembers
                            .filter((m) => m.memberName !== currentUser.name)
                            .map((m) => (
                              <div
                                key={m.memberId}
                                onClick={() =>
                                  setFormData({
                                    ...formData,
                                    collectedBy: m.memberName,
                                    collectedById: m.memberId,
                                  })
                                }
                                className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                                  formData.collectedBy === m.memberName
                                    ? "border-[#0F6E5D] bg-[#E4F1EE]"
                                    : "border-slate-200 hover:border-slate-300 bg-white"
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-700 font-bold flex items-center justify-center text-xs">
                                    🩺
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-xs text-slate-900">{m.memberName}</h4>
                                    <p className="text-[10px] text-slate-500 font-mono">
                                      {m.memberId} • {m.qualification}
                                    </p>
                                  </div>
                                </div>
                                <div
                                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                    formData.collectedBy === m.memberName
                                      ? "border-[#0F6E5D] bg-[#0F6E5D] text-white"
                                      : "border-slate-300 bg-white"
                                  }`}
                                >
                                  {formData.collectedBy === m.memberName && <Check className="h-3 w-3" />}
                                </div>
                              </div>
                            ))}

                          {/* 3. Guest / Non-registered Option */}
                          <div
                            onClick={() =>
                              setFormData({
                                ...formData,
                                collectedBy: formData.collectedById === "GUEST" ? formData.collectedBy : "",
                                collectedById: "GUEST",
                              })
                            }
                            className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                              formData.collectedById === "GUEST"
                                ? "border-[#0F6E5D] bg-[#E4F1EE]"
                                : "border-slate-200 hover:border-slate-300 bg-white"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs">
                                👤
                              </div>
                              <div>
                                <h4 className="font-bold text-xs text-slate-900">Guest or Non-Registered Collector</h4>
                                <p className="text-[10px] text-slate-500">Non-member collector</p>
                              </div>
                            </div>
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                formData.collectedById === "GUEST"
                                  ? "border-[#0F6E5D] bg-[#0F6E5D] text-white"
                                  : "border-slate-300 bg-white"
                              }`}
                            >
                              {formData.collectedById === "GUEST" && <Check className="h-3 w-3" />}
                            </div>
                          </div>
                        </div>

                        {/* Guest input when guest option selected */}
                        {formData.collectedById === "GUEST" && (
                          <div className="mt-3 bg-teal-50/60 p-3 rounded-xl border border-teal-200 animate-fadeIn">
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              Specify Guest / Non-Registered Collector Name:
                            </label>
                            <input
                              type="text"
                              placeholder="Full name of collector"
                              value={formData.collectedBy || ""}
                              onChange={(e) => setFormData({ ...formData, collectedBy: e.target.value })}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0F6E5D]"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Step: Paid By */}
                    {currentStepConfig.id === "paid_by" && (
                      <div className="space-y-3">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Who paid this income amount?
                        </label>

                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Search IHMA doctor member name or member ID..."
                            value={memberSearchTerm}
                            onChange={(e) => setMemberSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0F6E5D]"
                          />
                          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                        </div>

                        <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                          {filteredMembers.map((m) => (
                            <div
                              key={m.memberId}
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  paidBy: m.memberName,
                                  paidByMemberId: m.memberId,
                                })
                              }
                              className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                                formData.paidByMemberId === m.memberId
                                  ? "border-[#0F6E5D] bg-[#E4F1EE]"
                                  : "border-slate-200 hover:border-slate-300 bg-white"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-xs">
                                  👤
                                </div>
                                <div>
                                  <h4 className="font-bold text-xs text-slate-900">{m.memberName}</h4>
                                  <p className="text-[10px] text-slate-500 font-mono">
                                    Member ID: {m.memberId} • {m.qualification}
                                  </p>
                                </div>
                              </div>
                              <div
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                  formData.paidByMemberId === m.memberId
                                    ? "border-[#0F6E5D] bg-[#0F6E5D] text-white"
                                    : "border-slate-300 bg-white"
                                }`}
                              >
                                {formData.paidByMemberId === m.memberId && <Check className="h-3 w-3" />}
                              </div>
                            </div>
                          ))}

                          {/* Guest / Non-registered Payer option */}
                          <div
                            onClick={() =>
                              setFormData({
                                ...formData,
                                paidBy: formData.paidByMemberId === "GUEST" ? formData.paidBy : "",
                                paidByMemberId: "GUEST",
                              })
                            }
                            className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                              formData.paidByMemberId === "GUEST"
                                ? "border-[#0F6E5D] bg-[#E4F1EE]"
                                : "border-slate-200 hover:border-slate-300 bg-white"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-xs">
                                ➕
                              </div>
                              <div>
                                <h4 className="font-bold text-xs text-slate-900">Guest or Non-Registered Payer</h4>
                                <p className="text-[10px] text-slate-500">Not stored with IHMA Member ID</p>
                              </div>
                            </div>
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                formData.paidByMemberId === "GUEST"
                                  ? "border-[#0F6E5D] bg-[#0F6E5D] text-white"
                                  : "border-slate-300 bg-white"
                              }`}
                            >
                              {formData.paidByMemberId === "GUEST" && <Check className="h-3 w-3" />}
                            </div>
                          </div>
                        </div>

                        {formData.paidByMemberId === "GUEST" && (
                          <div className="mt-3 bg-teal-50/60 p-3 rounded-xl border border-teal-200 animate-fadeIn">
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              Specify Guest / Non-Member Payer Name:
                            </label>
                            <input
                              type="text"
                              placeholder="Full name of payer"
                              value={formData.paidBy || ""}
                              onChange={(e) => setFormData({ ...formData, paidBy: e.target.value })}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0F6E5D]"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Step: Income Head Category */}
                    {currentStepConfig.id === "category" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {incomeHeads.map((head) => (
                          <div
                            key={head.key}
                            onClick={() => setFormData({ ...formData, category: head.key })}
                            className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                              formData.category === head.key
                                ? "border-[#0F6E5D] bg-[#E4F1EE]"
                                : "border-slate-200 hover:border-slate-300 bg-white"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{head.icon}</span>
                              <div>
                                <h4 className="font-bold text-sm text-slate-900">{head.label}</h4>
                                <p className="text-[11px] text-slate-500">{head.sub}</p>
                              </div>
                            </div>
                            <div
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                formData.category === head.key
                                  ? "border-[#0F6E5D] bg-[#0F6E5D] text-white"
                                  : "border-slate-300 bg-white"
                              }`}
                            >
                              {formData.category === head.key && <Check className="h-3.5 w-3.5" />}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Step: Membership Tier (When Membership is selected) */}
                    {currentStepConfig.id === "membership_tier" && (
                      <div className="space-y-3">
                        {[
                          { key: "Silver (1 year)", label: "Silver", tenure: "1 Year", sub: "1 Year membership subscription", icon: "🥈" },
                          { key: "Gold (12 years)", label: "Gold", tenure: "12 Years", sub: "12 Years long-term membership", icon: "🥇" },
                          { key: "Platinum (lifelong)", label: "Platinum", tenure: "Lifelong", sub: "Lifelong permanent membership", icon: "💎" },
                        ].map((tier) => (
                          <div
                            key={tier.key}
                            onClick={() => setFormData({ ...formData, membershipTier: tier.key })}
                            className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                              formData.membershipTier === tier.key
                                ? "border-[#0F6E5D] bg-[#E4F1EE]"
                                : "border-slate-200 hover:border-slate-300 bg-white"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{tier.icon}</span>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-sm text-slate-900">{tier.label}</h4>
                                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                                    {tier.tenure}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5">{tier.sub}</p>
                              </div>
                            </div>
                            <div
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                formData.membershipTier === tier.key
                                  ? "border-[#0F6E5D] bg-[#0F6E5D] text-white"
                                  : "border-slate-300 bg-white"
                              }`}
                            >
                              {formData.membershipTier === tier.key && <Check className="h-3.5 w-3.5" />}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Step: Other Category Custom Field */}
                    {currentStepConfig.id === "other_category_text" && (
                      <div className="space-y-3">
                        <label className="block text-xs font-bold text-slate-700">
                          Optional: Specify Income Category Detail
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Journal publication fee, stall space, etc."
                          value={formData.otherCategoryText || ""}
                          onChange={(e) => setFormData({ ...formData, otherCategoryText: e.target.value })}
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0F6E5D] font-medium"
                        />
                      </div>
                    )}

                    {/* Step: Offered & Paid Amount */}
                    {currentStepConfig.id === "amount" && (
                      <div className="space-y-4">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Amount Offered / Expected
                          </label>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-slate-500">₹</span>
                            <input
                              type="number"
                              min="0"
                              value={formData.offeredAmount || ""}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  offeredAmount: Number(e.target.value),
                                })
                              }
                              className="w-full text-2xl font-bold font-display text-slate-900 bg-transparent focus:outline-hidden"
                              placeholder="0"
                            />
                          </div>

                          <div className="flex flex-wrap gap-2 mt-3">
                            {[1000, 2000, 5000].map((v) => (
                              <button
                                key={v}
                                type="button"
                                onClick={() =>
                                  setFormData({ ...formData, offeredAmount: v })
                                }
                                className="px-3 py-1 bg-teal-100 text-teal-800 text-xs font-bold rounded-full hover:bg-teal-200 cursor-pointer"
                              >
                                ₹{v.toLocaleString()}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200">
                          <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider mb-1">
                            Amount Actually Received
                          </label>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-emerald-700">₹</span>
                            <input
                              type="number"
                              min="0"
                              value={formData.paidAmount || ""}
                              onChange={(e) => setFormData({ ...formData, paidAmount: Number(e.target.value) })}
                              className="w-full text-2xl font-bold font-display text-emerald-950 bg-transparent focus:outline-hidden"
                              placeholder="0"
                            />
                          </div>

                          <div className="flex flex-wrap gap-2 mt-3">
                            {[1000, 2000, 5000].map((v) => (
                              <button
                                key={v}
                                type="button"
                                onClick={() =>
                                  setFormData({ ...formData, paidAmount: v })
                                }
                                className="px-3 py-1 bg-emerald-100 text-emerald-900 text-xs font-bold rounded-full hover:bg-emerald-200 cursor-pointer"
                              >
                                ₹{v.toLocaleString()}
                              </button>
                            ))}
                          </div>

                          {formData.offeredAmount > formData.paidAmount && formData.paidAmount > 0 && (
                            <div className="mt-2 text-xs text-amber-800 font-semibold bg-amber-100 p-2 rounded-lg flex items-center gap-1.5">
                              <AlertTriangle className="h-4 w-4 shrink-0" />
                              <span>
                                Outstanding balance of {formatINR(formData.offeredAmount - formData.paidAmount)} will be tracked as due.
                              </span>
                            </div>
                          )}

                          {formData.paidAmount > formData.offeredAmount && (
                            <div className="mt-2 text-xs text-rose-800 font-bold bg-rose-100 border border-rose-300 p-2.5 rounded-lg flex items-center gap-1.5 animate-fadeIn">
                              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                              <span>
                                Security Alert: Amount received ({formatINR(formData.paidAmount)}) cannot exceed offered/expected amount ({formatINR(formData.offeredAmount)}).
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Step: Payment Mode */}
                    {currentStepConfig.id === "payment_mode" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div
                          onClick={() => setFormData({ ...formData, paymentMode: "Cash" })}
                          className={`p-5 rounded-2xl border-2 transition-all cursor-pointer text-center space-y-2 ${
                            formData.paymentMode === "Cash"
                              ? "border-[#0F6E5D] bg-[#E4F1EE] ring-2 ring-[#0F6E5D]/20"
                              : "border-slate-200 hover:border-slate-300 bg-white"
                          }`}
                        >
                          <div className="text-4xl">💵</div>
                          <h4 className="font-bold text-base text-slate-900">Cash Payment</h4>
                          <p className="text-xs text-slate-500">Physical cash received directly into chapter drawer.</p>
                        </div>

                        <div
                          onClick={() => setFormData({ ...formData, paymentMode: "Bank" })}
                          className={`p-5 rounded-2xl border-2 transition-all cursor-pointer text-center space-y-2 ${
                            formData.paymentMode === "Bank"
                              ? "border-[#0F6E5D] bg-[#E4F1EE] ring-2 ring-[#0F6E5D]/20"
                              : "border-slate-200 hover:border-slate-300 bg-white"
                          }`}
                        >
                          <div className="text-4xl">🏦</div>
                          <h4 className="font-bold text-base text-slate-900">Bank Transfer / UPI</h4>
                          <p className="text-xs text-slate-500">Direct bank deposit, UPI, GPay, Cheque, or NEFT/RTGS.</p>
                        </div>
                      </div>
                    )}

                    {/* Step: Remarks */}
                    {currentStepConfig.id === "remarks" && (
                      <div className="space-y-3">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Remarks / Notes (Blank Optional)
                        </label>
                        <textarea
                          rows={3}
                          placeholder="Optional notes or remarks regarding this income receipt..."
                          value={formData.remarks || ""}
                          onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl text-xs bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0F6E5D]"
                        />
                      </div>
                    )}

                    {/* Step: Review & Save */}
                    {currentStepConfig.id === "review" && (
                      <div className="space-y-4">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
                          <div className="flex justify-between py-1.5 border-b border-slate-200">
                            <span className="text-slate-500 font-semibold">Chapter Name:</span>
                            <span className="font-bold text-slate-900">{formData.chapterName || defaultChapterName}</span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-slate-200">
                            <span className="text-slate-500 font-semibold">Chapter ID:</span>
                            <span className="font-mono font-bold text-slate-900">{formData.chapterId || defaultChapterId}</span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-slate-200">
                            <span className="text-slate-500 font-semibold">Receipt Date:</span>
                            <span className="font-bold text-slate-900">{formData.date ? formatDateDMY(formData.date) : "—"}</span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-slate-200">
                            <span className="text-slate-500 font-semibold">Collected By:</span>
                            <span className="font-bold text-slate-900">{formData.collectedBy || "Guest"}</span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-slate-200">
                            <span className="text-slate-500 font-semibold">Paid By:</span>
                            <span className="font-bold text-slate-900">
                              {formData.paidBy || "Guest"}{" "}
                              {formData.paidByMemberId && formData.paidByMemberId !== "GUEST" && `(Member ID: ${formData.paidByMemberId})`}
                            </span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-slate-200">
                            <span className="text-slate-500 font-semibold">Income Head:</span>
                            <span className="font-bold text-teal-800 capitalize">
                              {formData.category === "membership"
                                ? `Membership - ${formData.membershipTier}`
                                : formData.category === "others"
                                ? `Others - ${formData.otherCategoryText || "General"}`
                                : formData.category}
                            </span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-slate-200">
                            <span className="text-slate-500 font-semibold">Payment Mode:</span>
                            <span className="font-bold text-slate-900">{formData.paymentMode}</span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-slate-200">
                            <span className="text-slate-500 font-semibold">Offered Amount:</span>
                            <span className="font-bold text-slate-900">{formatINR(formData.offeredAmount)}</span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-slate-200">
                            <span className="text-slate-500 font-semibold">Amount Received:</span>
                            <span className="font-bold text-teal-800 text-sm">{formatINR(formData.paidAmount)}</span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-slate-200">
                            <span className="text-slate-500 font-semibold">Balance Outstanding:</span>
                            <span className="font-bold text-slate-900">
                              {formatINR(Math.max(0, formData.offeredAmount - formData.paidAmount))}
                            </span>
                          </div>
                          {formData.remarks && (
                            <div className="flex justify-between py-1.5 border-b border-slate-200">
                              <span className="text-slate-500 font-semibold">Remarks:</span>
                              <span className="font-medium text-slate-800 italic">{formData.remarks}</span>
                            </div>
                          )}
                          <div className="flex justify-between py-1.5">
                            <span className="text-slate-500 font-semibold">Voucher #:</span>
                            <span className="font-mono font-bold text-slate-700">{formData.voucherNumber}</span>
                          </div>
                        </div>

                        <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 shrink-0 text-amber-700" />
                          <span>
                            Audit Lock: Once recorded, original transaction entry cannot be directly altered.
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* ---------------- EXPENSE WIZARD STEPS ---------------- */}
                {activeWizard === "expense" && (
                  <>
                    {/* Step: Date */}
                    {currentStepConfig.id === "date" && (
                      <div className="space-y-4">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Select Payment Date (Max: Today)
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="date"
                            max={new Date().toISOString().slice(0, 10)}
                            value={formData.date || new Date().toISOString().slice(0, 10)}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            className="flex-1 px-4 py-3 border border-slate-300 rounded-xl text-sm font-semibold bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                          />
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, date: new Date().toISOString().slice(0, 10) })}
                            className="px-4 py-3 bg-amber-50 text-amber-900 text-xs font-bold rounded-xl border border-amber-200 hover:bg-amber-100 cursor-pointer"
                          >
                            Set Today
                          </button>
                        </div>
                        <p className="text-xs text-slate-500">
                          Default is today ({new Date().toISOString().slice(0, 10)}). Select any date up to today.
                        </p>
                      </div>
                    )}

                    {/* Step: Paid By */}
                    {currentStepConfig.id === "paid_by" && (
                      <div className="space-y-3">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Who paid this expense?
                        </label>

                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Search doctor name or ID..."
                            value={memberSearchTerm}
                            onChange={(e) => setMemberSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                          />
                          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                        </div>

                        <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                          {/* Current Treasurer Quick Card */}
                          <div
                            onClick={() =>
                              setFormData({
                                ...formData,
                                paidBy: currentUser.name,
                                paidByMemberId: "TREASURER",
                              })
                            }
                            className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                              formData.paidBy === currentUser.name
                                ? "border-amber-600 bg-amber-50"
                                : "border-slate-200 hover:border-slate-300 bg-white"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-xs">
                                🔑
                              </div>
                              <div>
                                <h4 className="font-bold text-xs text-slate-900">{currentUser.name} (Treasurer)</h4>
                                <p className="text-[10px] text-slate-500">Logged in chapter treasurer</p>
                              </div>
                            </div>
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                formData.paidBy === currentUser.name
                                  ? "border-amber-600 bg-amber-600 text-white"
                                  : "border-slate-300 bg-white"
                              }`}
                            >
                              {formData.paidBy === currentUser.name && <Check className="h-3 w-3" />}
                            </div>
                          </div>

                          {/* Registered members excluding current treasurer */}
                          {filteredMembers
                            .filter((m) => m.memberName !== currentUser.name)
                            .map((m) => (
                              <div
                                key={m.memberId}
                                onClick={() =>
                                  setFormData({
                                    ...formData,
                                    paidBy: m.memberName,
                                    paidByMemberId: m.memberId,
                                  })
                                }
                                className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                                  formData.paidBy === m.memberName
                                    ? "border-amber-600 bg-amber-50"
                                    : "border-slate-200 hover:border-slate-300 bg-white"
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-800 font-bold flex items-center justify-center text-xs">
                                    🩺
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-xs text-slate-900">{m.memberName}</h4>
                                    <p className="text-[10px] text-slate-500 font-mono">
                                      {m.memberId} • {m.qualification}
                                    </p>
                                  </div>
                                </div>
                                <div
                                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                    formData.paidBy === m.memberName
                                      ? "border-amber-600 bg-amber-600 text-white"
                                      : "border-slate-300 bg-white"
                                  }`}
                                >
                                  {formData.paidBy === m.memberName && <Check className="h-3 w-3" />}
                                </div>
                              </div>
                            ))}

                          {/* Guest / Custom Payer option */}
                          <div
                            onClick={() =>
                              setFormData({
                                ...formData,
                                paidBy: formData.paidByMemberId === "GUEST" ? formData.paidBy : "",
                                paidByMemberId: "GUEST",
                              })
                            }
                            className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                              formData.paidByMemberId === "GUEST"
                                ? "border-amber-600 bg-amber-50"
                                : "border-slate-200 hover:border-slate-300 bg-white"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs">
                                👤
                              </div>
                              <div>
                                <h4 className="font-bold text-xs text-slate-900">Guest or Non-Registered Payer</h4>
                                <p className="text-[10px] text-slate-500">Non-member payer</p>
                              </div>
                            </div>
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                formData.paidByMemberId === "GUEST"
                                  ? "border-amber-600 bg-amber-600 text-white"
                                  : "border-slate-300 bg-white"
                              }`}
                            >
                              {formData.paidByMemberId === "GUEST" && <Check className="h-3 w-3" />}
                            </div>
                          </div>
                        </div>

                        {formData.paidByMemberId === "GUEST" && (
                          <div className="mt-3 bg-amber-50/60 p-3 rounded-xl border border-amber-200 animate-fadeIn">
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              Specify Guest / Non-Member Payer Name:
                            </label>
                            <input
                              type="text"
                              placeholder="Full name of payer"
                              value={formData.paidBy || ""}
                              onChange={(e) => setFormData({ ...formData, paidBy: e.target.value })}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Step: Paid To */}
                    {currentStepConfig.id === "paid_to" && (
                      <div className="space-y-3">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Who was this paid to? (Payee / Vendor / Party)
                        </label>

                        <input
                          type="text"
                          placeholder="Vendor name, printer, hotel, speaker, etc."
                          value={formData.paidTo || ""}
                          onChange={(e) => setFormData({ ...formData, paidTo: e.target.value })}
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-medium"
                        />
                      </div>
                    )}

                    {/* Step: Expense Head */}
                    {currentStepConfig.id === "category" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {expenseHeads.map((head) => (
                          <div
                            key={head.key}
                            onClick={() => setFormData({ ...formData, category: head.key })}
                            className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                              formData.category === head.key
                                ? "border-amber-600 bg-amber-50"
                                : "border-slate-200 hover:border-slate-300 bg-white"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{head.icon}</span>
                              <div>
                                <h4 className="font-bold text-sm text-slate-900">{head.label}</h4>
                                <p className="text-[11px] text-slate-500">{head.sub}</p>
                              </div>
                            </div>
                            <div
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                formData.category === head.key
                                  ? "border-amber-600 bg-amber-600 text-white"
                                  : "border-slate-300 bg-white"
                              }`}
                            >
                              {formData.category === head.key && <Check className="h-3.5 w-3.5" />}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Step: Digital Media Type (When Digital Media is selected) */}
                    {currentStepConfig.id === "digital_media_type" && (
                      <div className="space-y-3">
                        <div className="text-xs font-semibold text-slate-600 bg-amber-50 p-3 rounded-lg border border-amber-200 text-amber-900 flex items-center gap-2">
                          <Info className="h-4 w-4 shrink-0" />
                          <span>Select digital media sub-category:</span>
                        </div>

                        {[
                          { key: "Website", label: "Website", sub: "Web portal design, domain, or hosting", icon: "🌐" },
                          { key: "Application", label: "Application", sub: "Mobile app build or maintenance", icon: "📱" },
                          { key: "Posters", label: "Posters", sub: "Social media banners, flyer graphics", icon: "🖼️" },
                        ].map((dt) => (
                          <div
                            key={dt.key}
                            onClick={() => setFormData({ ...formData, digitalMediaType: dt.key })}
                            className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                              formData.digitalMediaType === dt.key
                                ? "border-amber-600 bg-amber-50"
                                : "border-slate-200 hover:border-slate-300 bg-white"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{dt.icon}</span>
                              <div>
                                <h4 className="font-bold text-sm text-slate-900">{dt.label}</h4>
                                <p className="text-xs text-slate-500 mt-0.5">{dt.sub}</p>
                              </div>
                            </div>
                            <div
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                formData.digitalMediaType === dt.key
                                  ? "border-amber-600 bg-amber-600 text-white"
                                  : "border-slate-300 bg-white"
                              }`}
                            >
                              {formData.digitalMediaType === dt.key && <Check className="h-3.5 w-3.5" />}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Step: Digital Media Charge Sub-options */}
                    {currentStepConfig.id === "digital_media_charge" && (
                      <div className="space-y-3">
                        <div className="text-xs font-semibold text-slate-600 bg-amber-50 p-3 rounded-lg border border-amber-200 text-amber-900 flex items-center gap-2">
                          <Info className="h-4 w-4 shrink-0" />
                          <span>Select specific charge category for {formData.digitalMediaType}:</span>
                        </div>

                        {[
                          { key: "Development charge", label: "Development Charge", sub: "Initial building, coding, or setup", icon: "🛠️" },
                          { key: "Annual Maintenance charge", label: "Annual Maintenance Charge (AMC)", sub: "Server hosting, domain renewal, yearly maintenance", icon: "🔄" },
                          { key: "Upgrade charge", label: "Upgrade Charge", sub: "New feature additions or software upgrades", icon: "🚀" },
                        ].map((dc) => (
                          <div
                            key={dc.key}
                            onClick={() => setFormData({ ...formData, digitalMediaCharge: dc.key })}
                            className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                              formData.digitalMediaCharge === dc.key
                                ? "border-amber-600 bg-amber-50"
                                : "border-slate-200 hover:border-slate-300 bg-white"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{dc.icon}</span>
                              <div>
                                <h4 className="font-bold text-sm text-slate-900">{dc.label}</h4>
                                <p className="text-xs text-slate-500 mt-0.5">{dc.sub}</p>
                              </div>
                            </div>
                            <div
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                formData.digitalMediaCharge === dc.key
                                  ? "border-amber-600 bg-amber-600 text-white"
                                  : "border-slate-300 bg-white"
                              }`}
                            >
                              {formData.digitalMediaCharge === dc.key && <Check className="h-3.5 w-3.5" />}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Step: Other Category Text */}
                    {currentStepConfig.id === "other_category_text" && (
                      <div className="space-y-3">
                        <label className="block text-xs font-bold text-slate-700">
                          Optional: Specify Expense Category Detail
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Refreshment expense, office cleaning, etc."
                          value={formData.otherCategoryText || ""}
                          onChange={(e) => setFormData({ ...formData, otherCategoryText: e.target.value })}
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-medium"
                        />
                      </div>
                    )}

                    {/* Step: Payable & Paid Amount */}
                    {currentStepConfig.id === "amount" && (
                      <div className="space-y-4">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Payable Amount
                          </label>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-slate-500">₹</span>
                            <input
                              type="number"
                              min="0"
                              value={formData.payableAmount || ""}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  payableAmount: Number(e.target.value),
                                })
                              }
                              className="w-full text-2xl font-bold font-display text-slate-900 bg-transparent focus:outline-hidden"
                              placeholder="0"
                            />
                          </div>

                          <div className="flex flex-wrap gap-2 mt-3">
                            {[1000, 2000, 5000].map((v) => (
                              <button
                                key={v}
                                type="button"
                                onClick={() =>
                                  setFormData({ ...formData, payableAmount: v })
                                }
                                className="px-3 py-1 bg-amber-100 text-amber-900 text-xs font-bold rounded-full hover:bg-amber-200 cursor-pointer"
                              >
                                ₹{v.toLocaleString()}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-200">
                          <label className="block text-xs font-bold text-rose-900 uppercase tracking-wider mb-1">
                            Amount Actually Paid
                          </label>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-rose-700">₹</span>
                            <input
                              type="number"
                              min="0"
                              value={formData.paidAmount || ""}
                              onChange={(e) => setFormData({ ...formData, paidAmount: Number(e.target.value) })}
                              className="w-full text-2xl font-bold font-display text-rose-950 bg-transparent focus:outline-hidden"
                              placeholder="0"
                            />
                          </div>

                          <div className="flex flex-wrap gap-2 mt-3">
                            {[1000, 2000, 5000].map((v) => (
                              <button
                                key={v}
                                type="button"
                                onClick={() =>
                                  setFormData({ ...formData, paidAmount: v })
                                }
                                className="px-3 py-1 bg-rose-100 text-rose-900 text-xs font-bold rounded-full hover:bg-rose-200 cursor-pointer"
                              >
                                ₹{v.toLocaleString()}
                              </button>
                            ))}
                          </div>

                          {formData.payableAmount > formData.paidAmount && formData.paidAmount > 0 && (
                            <div className="mt-2 text-xs text-rose-800 font-semibold bg-rose-100 p-2 rounded-lg flex items-center gap-1.5">
                              <AlertTriangle className="h-4 w-4 shrink-0" />
                              <span>
                                Outstanding balance of {formatINR(formData.payableAmount - formData.paidAmount)} will be tracked as pending payable.
                              </span>
                            </div>
                          )}

                          {formData.paidAmount > formData.payableAmount && (
                            <div className="mt-2 text-xs text-rose-800 font-bold bg-rose-100 border border-rose-300 p-2.5 rounded-lg flex items-center gap-1.5 animate-fadeIn">
                              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                              <span>
                                Security Alert: Amount paid ({formatINR(formData.paidAmount)}) cannot exceed total payable amount ({formatINR(formData.payableAmount)}).
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Step: Payment Mode */}
                    {currentStepConfig.id === "payment_mode" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div
                          onClick={() => setFormData({ ...formData, paymentMode: "Cash" })}
                          className={`p-5 rounded-2xl border-2 transition-all cursor-pointer text-center space-y-2 ${
                            formData.paymentMode === "Cash"
                              ? "border-amber-600 bg-amber-50 ring-2 ring-amber-500/20"
                              : "border-slate-200 hover:border-slate-300 bg-white"
                          }`}
                        >
                          <div className="text-4xl">💵</div>
                          <h4 className="font-bold text-base text-slate-900">Cash Payment</h4>
                          <p className="text-xs text-slate-500">Paid out in cash from physical chapter cash drawer.</p>
                        </div>

                        <div
                          onClick={() => setFormData({ ...formData, paymentMode: "Bank" })}
                          className={`p-5 rounded-2xl border-2 transition-all cursor-pointer text-center space-y-2 ${
                            formData.paymentMode === "Bank"
                              ? "border-amber-600 bg-amber-50 ring-2 ring-amber-500/20"
                              : "border-slate-200 hover:border-slate-300 bg-white"
                          }`}
                        >
                          <div className="text-4xl">🏦</div>
                          <h4 className="font-bold text-base text-slate-900">Bank Transfer / Cheque</h4>
                          <p className="text-xs text-slate-500">Paid directly from bank account via cheque, NEFT, or UPI.</p>
                        </div>
                      </div>
                    )}

                    {/* Step: Remarks */}
                    {currentStepConfig.id === "remarks" && (
                      <div className="space-y-3">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Remarks / Notes (Blank Optional)
                        </label>
                        <textarea
                          rows={3}
                          placeholder="Optional notes or remarks regarding this expense..."
                          value={formData.remarks || ""}
                          onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl text-xs bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    )}

                    {/* Step: Review & Save Expense */}
                    {currentStepConfig.id === "review" && (
                      <div className="space-y-4">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
                          <div className="flex justify-between py-1.5 border-b border-slate-200">
                            <span className="text-slate-500 font-semibold">Chapter Name:</span>
                            <span className="font-bold text-slate-900">{formData.chapterName || defaultChapterName}</span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-slate-200">
                            <span className="text-slate-500 font-semibold">Chapter ID:</span>
                            <span className="font-mono font-bold text-slate-900">{formData.chapterId || defaultChapterId}</span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-slate-200">
                            <span className="text-slate-500 font-semibold">Payment Date:</span>
                            <span className="font-bold text-slate-900">{formData.date ? formatDateDMY(formData.date) : "—"}</span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-slate-200">
                            <span className="text-slate-500 font-semibold">Paid By:</span>
                            <span className="font-bold text-slate-900">{formData.paidBy}</span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-slate-200">
                            <span className="text-slate-500 font-semibold">Paid To:</span>
                            <span className="font-bold text-slate-900">{formData.paidTo}</span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-slate-200">
                            <span className="text-slate-500 font-semibold">Expense Head:</span>
                            <span className="font-bold text-amber-800 capitalize">
                              {formData.category === "digital_media"
                                ? `Digital Media - ${formData.digitalMediaType || ""}${formData.digitalMediaCharge ? ` (${formData.digitalMediaCharge})` : ""}`
                                : formData.category === "others"
                                ? `Others - ${formData.otherCategoryText || "General"}`
                                : formData.category}
                            </span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-slate-200">
                            <span className="text-slate-500 font-semibold">Payment Mode:</span>
                            <span className="font-bold text-slate-900">{formData.paymentMode}</span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-slate-200">
                            <span className="text-slate-500 font-semibold">Payable Amount:</span>
                            <span className="font-bold text-slate-900">{formatINR(formData.payableAmount)}</span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-slate-200">
                            <span className="text-slate-500 font-semibold">Amount Paid:</span>
                            <span className="font-bold text-rose-800 text-sm">{formatINR(formData.paidAmount)}</span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-slate-200">
                            <span className="text-slate-500 font-semibold">Balance Outstanding:</span>
                            <span className="font-bold text-slate-900">
                              {formatINR(Math.max(0, formData.payableAmount - formData.paidAmount))}
                            </span>
                          </div>
                          {formData.remarks && (
                            <div className="flex justify-between py-1.5 border-b border-slate-200">
                              <span className="text-slate-500 font-semibold">Remarks:</span>
                              <span className="font-medium text-slate-800 italic">{formData.remarks}</span>
                            </div>
                          )}
                          <div className="flex justify-between py-1.5">
                            <span className="text-slate-500 font-semibold">Voucher #:</span>
                            <span className="font-mono font-bold text-slate-700">{formData.voucherNumber}</span>
                          </div>
                        </div>

                        <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 shrink-0 text-amber-700" />
                          <span>
                            Audit Lock: Once recorded, original transaction entry cannot be directly altered.
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* ---------------- LOAN WIZARD STEPS ---------------- */}
                {activeWizard === "loan" && (
                  <>
                    {/* Date */}
                    {currentStepConfig.id === "date" && (
                      <div className="space-y-3">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Loan Disbursement Date *
                        </label>
                        <input
                          type="date"
                          max={new Date().toISOString().slice(0, 10)}
                          value={formData.date || new Date().toISOString().slice(0, 10)}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <p className="text-[11px] text-slate-500">
                          Disbursement date for this loan voucher. Default is today.
                        </p>
                      </div>
                    )}

                    {/* Paid To Chapter */}
                    {currentStepConfig.id === "paid_to" && (
                      <div className="space-y-3">
                        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-xs text-indigo-900 flex items-center gap-2">
                          <Building className="h-4 w-4 text-indigo-600 shrink-0" />
                          <span>Note: Loans are issued strictly to <strong>IHMA Chapters</strong> (not individual members).</span>
                        </div>
                        <div className="relative">
                          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search chapter name or chapter ID..."
                            value={memberSearchTerm}
                            onChange={(e) => setMemberSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                          {filteredChapters.length === 0 ? (
                            <p className="text-xs text-slate-500 p-3 text-center">No matching chapters found.</p>
                          ) : (
                            filteredChapters.map((c) => (
                              <div
                                key={c.id}
                                onClick={() =>
                                  setFormData({
                                    ...formData,
                                    recipientCategory: "chapter",
                                    recipientId: c.id,
                                    recipientName: c.chapterName,
                                  })
                                }
                                className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex justify-between items-center ${
                                  formData.recipientId === c.id
                                    ? "border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-500/20"
                                    : "border-slate-200 hover:border-indigo-300 bg-white"
                                }`}
                              >
                                <div>
                                  <h4 className="font-bold text-xs text-slate-900">{c.chapterName}</h4>
                                  <p className="text-[10px] font-mono text-slate-500">{c.id} • {c.entityType || "Local Chapter"}</p>
                                </div>
                                {formData.recipientId === c.id && <CheckCircle2 className="h-5 w-5 text-indigo-600" />}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}

                    {/* Particulars */}
                    {currentStepConfig.id === "particulars" && (
                      <div className="space-y-3">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Loan Particulars & Purpose *
                        </label>
                        <textarea
                          rows={3}
                          placeholder="e.g. Advance seed fund for District CME Conference logistics"
                          value={formData.particulars || ""}
                          onChange={(e) => setFormData({ ...formData, particulars: e.target.value })}
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    )}

                    {/* Amount */}
                    {currentStepConfig.id === "amount" && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                            Principal Loan Amount (₹) *
                          </label>
                          <div className="relative">
                            <span className="absolute left-4 top-3.5 text-xl font-bold text-slate-400">₹</span>
                            <input
                              type="number"
                              min="1"
                              value={formData.loanAmount || ""}
                              onChange={(e) => setFormData({ ...formData, loanAmount: Number(e.target.value) })}
                              className="w-full pl-9 pr-4 py-3 border border-slate-300 rounded-xl text-2xl font-bold font-display text-indigo-950 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              placeholder="0"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <span className="text-[11px] font-semibold text-slate-500">Quick Presets:</span>
                          <div className="flex flex-wrap gap-2">
                            {[5000, 10000, 25000, 50000, 100000].map((amt) => (
                              <button
                                key={amt}
                                type="button"
                                onClick={() => setFormData({ ...formData, loanAmount: amt })}
                                className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                                  formData.loanAmount === amt
                                    ? "bg-indigo-600 text-white border-indigo-600"
                                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                                }`}
                              >
                                {formatINR(amt)}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Loan Return Date */}
                    {currentStepConfig.id === "loan_return_date" && (
                      <div className="space-y-3">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Agreed Loan Return Date *
                        </label>
                        <input
                          type="date"
                          value={formData.targetReturnDate || ""}
                          onChange={(e) => setFormData({ ...formData, targetReturnDate: e.target.value })}
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <p className="text-[11px] text-slate-500">
                          Agreed repayment deadline date for borrowing chapter.
                        </p>
                      </div>
                    )}

                    {/* Remarks */}
                    {currentStepConfig.id === "remarks" && (
                      <div className="space-y-3">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Remarks / Notes (Optional)
                        </label>
                        <textarea
                          rows={3}
                          placeholder="Optional additional notes or voucher remarks..."
                          value={formData.remarks || ""}
                          onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    )}

                    {/* Review */}
                    {currentStepConfig.id === "review" && (
                      <div className="space-y-4">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
                          <div className="flex justify-between py-1.5 border-b border-slate-200">
                            <span className="text-slate-500 font-semibold">Disbursement Date:</span>
                            <span className="font-bold text-slate-900">{formData.date ? formatDateDMY(formData.date) : "—"}</span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-slate-200">
                            <span className="text-slate-500 font-semibold">Paid To (Chapter):</span>
                            <span className="font-bold text-slate-900">{formData.recipientName} ({formData.recipientId})</span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-slate-200">
                            <span className="text-slate-500 font-semibold">Particulars:</span>
                            <span className="font-semibold text-slate-800">{formData.particulars}</span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-slate-200">
                            <span className="text-slate-500 font-semibold">Loan Amount:</span>
                            <span className="font-bold text-indigo-900 text-sm">{formatINR(formData.loanAmount)}</span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-slate-200">
                            <span className="text-slate-500 font-semibold">Agreed Return Date:</span>
                            <span className="font-bold text-slate-900">{formData.targetReturnDate ? formatDateDMY(formData.targetReturnDate) : "Not set"}</span>
                          </div>
                          {formData.remarks && (
                            <div className="flex justify-between py-1.5 border-b border-slate-200">
                              <span className="text-slate-500 font-semibold">Remarks:</span>
                              <span className="font-medium text-slate-800 italic">{formData.remarks}</span>
                            </div>
                          )}
                          <div className="flex justify-between py-1.5">
                            <span className="text-slate-500 font-semibold">Voucher #:</span>
                            <span className="font-mono font-bold text-slate-700">{formData.voucherNumber}</span>
                          </div>
                        </div>

                        <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200 text-xs text-indigo-900 flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 shrink-0 text-indigo-700" />
                          <span>Audit Lock: Issued loans will be logged into the Chapter Loan Ledger.</span>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* ---------------- MEMBER WIZARD STEPS ---------------- */}
                {activeWizard === "member" && (
                  <>
                    {/* Step 1: Member Name & Qualifications */}
                    {currentStepConfig.id === "member_info" && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Doctor / Member Name *
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Dr. Suresh Nair"
                            value={formData.memberName || ""}
                            onChange={(e) => setFormData({ ...formData, memberName: e.target.value })}
                            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-medium"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-1.5">
                            <label className="block text-xs font-bold text-slate-700">
                              Member Qualification(s) *
                            </label>
                            <span className="text-[10px] text-slate-500">Searchable & Multi-Select</span>
                          </div>

                          {/* Selected Qualifications Badges */}
                          <div className="min-h-[42px] p-2 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap gap-1.5 items-center mb-2">
                            {(!formData.qualifications || formData.qualifications.length === 0) ? (
                              <span className="text-xs text-slate-400 italic px-1">No qualifications selected yet (select from list below)</span>
                            ) : (
                              formData.qualifications.map((q: string) => (
                                <span
                                  key={q}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-2xs animate-fadeIn"
                                >
                                  <span>{q}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const next = formData.qualifications.filter((item: string) => item !== q);
                                      setFormData({ ...formData, qualifications: next });
                                    }}
                                    className="hover:bg-teal-800 rounded-full p-0.5"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </span>
                              ))
                            )}
                          </div>

                          {/* Qualification Search Input */}
                          <div className="relative mb-2">
                            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                            <input
                              type="text"
                              placeholder="Search or type custom qualification (e.g., BHMS, MBBS, LLB)..."
                              value={qualSearchTerm}
                              onChange={(e) => setQualSearchTerm(e.target.value)}
                              className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                            />
                          </div>

                          {/* Filtered Option Pills */}
                          <div className="max-h-40 overflow-y-auto p-2 border border-slate-200 rounded-xl bg-white flex flex-wrap gap-1.5">
                            {QUALIFICATION_OPTIONS.filter((opt) =>
                              opt.toLowerCase().includes(qualSearchTerm.toLowerCase())
                            ).map((opt) => {
                              const isSelected = (formData.qualifications || []).includes(opt);
                              return (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => {
                                    const current = formData.qualifications || [];
                                    const next = isSelected
                                      ? current.filter((i: string) => i !== opt)
                                      : [...current, opt];
                                    setFormData({ ...formData, qualifications: next });
                                  }}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                                    isSelected
                                      ? "bg-teal-600 text-white border-teal-600 shadow-2xs"
                                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                                  }`}
                                >
                                  {isSelected ? `✓ ${opt}` : `+ ${opt}`}
                                </button>
                              );
                            })}

                            {/* Custom Add Option if search term doesn't match standard list exactly */}
                            {qualSearchTerm.trim() !== "" &&
                              !QUALIFICATION_OPTIONS.some((opt) => opt.toLowerCase() === qualSearchTerm.trim().toLowerCase()) &&
                              !(formData.qualifications || []).includes(qualSearchTerm.trim()) && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const custom = qualSearchTerm.trim();
                                    const current = formData.qualifications || [];
                                    setFormData({ ...formData, qualifications: [...current, custom] });
                                    setQualSearchTerm("");
                                  }}
                                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200"
                                >
                                  + Add Custom "{qualSearchTerm.trim()}"
                                </button>
                              )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 2: Membership Type & Date */}
                    {currentStepConfig.id === "tier_status" && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-2">
                            Membership Type / Tier *
                          </label>
                          <div className="grid grid-cols-3 gap-2.5">
                            {[
                              { key: "Silver", label: "Silver", desc: "1 Year Tier", color: "border-slate-300 bg-slate-50" },
                              { key: "Gold", label: "Gold", desc: "12 Years Tier", color: "border-amber-300 bg-amber-50/50" },
                              { key: "Platinum", label: "Platinum", desc: "Lifelong / Lifetime", color: "border-teal-300 bg-teal-50/50" },
                            ].map((tier) => (
                              <button
                                key={tier.key}
                                type="button"
                                onClick={() => setFormData({ ...formData, membershipType: tier.key })}
                                className={`p-3 rounded-xl border-2 text-left transition-all flex flex-col justify-between ${
                                  formData.membershipType === tier.key
                                    ? "border-teal-600 bg-teal-50/90 ring-2 ring-teal-500/20"
                                    : "border-slate-200 hover:border-slate-300 bg-white"
                                }`}
                              >
                                <div>
                                  <span className="font-bold text-xs text-slate-900 block">{tier.label}</span>
                                  <span className="text-[10px] text-slate-500 block mt-0.5">{tier.desc}</span>
                                </div>
                                <div
                                  className={`w-4 h-4 rounded-full border mt-2 flex items-center justify-center text-[10px] ${
                                    formData.membershipType === tier.key
                                      ? "border-teal-600 bg-teal-600 text-white font-bold"
                                      : "border-slate-300 bg-white"
                                  }`}
                                >
                                  {formData.membershipType === tier.key && "✓"}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Membership Start Date *
                          </label>
                          <input
                            type="date"
                            value={formData.membershipDate || new Date().toISOString().slice(0, 10)}
                            onChange={(e) => setFormData({ ...formData, membershipDate: e.target.value })}
                            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs bg-white font-semibold focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Membership Status
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            {["Active", "Hold", "Expired"].map((st) => (
                              <button
                                key={st}
                                type="button"
                                onClick={() => setFormData({ ...formData, membershipStatus: st })}
                                className={`py-2 px-3 rounded-lg border text-xs font-bold ${
                                  formData.membershipStatus === st
                                    ? "bg-slate-800 text-white border-slate-800"
                                    : "bg-white border-slate-200 text-slate-700"
                                }`}
                              >
                                {st}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 3: Contact Information */}
                    {currentStepConfig.id === "contact_info" && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Mobile Number *
                          </label>
                          <input
                            type="text"
                            placeholder="+91 9876543210"
                            value={formData.mobileNumber || ""}
                            onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-medium"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="block text-xs font-bold text-slate-700">
                              WhatsApp Number
                            </label>
                            {formData.mobileNumber && (
                              <button
                                type="button"
                                onClick={() => setFormData({ ...formData, whatsappNumber: formData.mobileNumber })}
                                className="text-[10px] text-teal-700 font-bold hover:underline"
                              >
                                Same as Mobile
                              </button>
                            )}
                          </div>
                          <input
                            type="text"
                            placeholder="+91 9876543210"
                            value={formData.whatsappNumber || ""}
                            onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Email Address
                          </label>
                          <input
                            type="email"
                            placeholder="doctor@example.com"
                            value={formData.email || ""}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Office / Clinic Contact Number
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. 0484 2345678"
                            value={formData.clinicNumber || ""}
                            onChange={(e) => setFormData({ ...formData, clinicNumber: e.target.value })}
                            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                          />
                        </div>
                      </div>
                    )}

                    {/* Step 4: Confirm Member Profile */}
                    {currentStepConfig.id === "review" && (
                      <div className="space-y-4">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5 text-xs">
                          <div className="flex justify-between py-1 border-b border-slate-200">
                            <span className="text-slate-500 font-semibold">Doctor Name:</span>
                            <span className="font-bold text-slate-900">{formData.memberName}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-200">
                            <span className="text-slate-500 font-semibold">Qualifications:</span>
                            <span className="font-bold text-teal-800">
                              {Array.isArray(formData.qualifications)
                                ? formData.qualifications.join(", ")
                                : formData.qualification || "None"}
                            </span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-200">
                            <span className="text-slate-500 font-semibold">Membership Type:</span>
                            <span className="font-bold text-amber-900">{formData.membershipType} ({formData.membershipStatus || "Active"})</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-200">
                            <span className="text-slate-500 font-semibold">Start Date:</span>
                            <span className="font-bold text-slate-800">{formData.membershipDate ? formatDateDMY(formData.membershipDate) : "—"}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-200">
                            <span className="text-slate-500 font-semibold">Mobile Number:</span>
                            <span className="font-medium text-slate-900">{formData.mobileNumber}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-200">
                            <span className="text-slate-500 font-semibold">WhatsApp Number:</span>
                            <span className="font-medium text-slate-900">{formData.whatsappNumber || formData.mobileNumber}</span>
                          </div>
                          {formData.email && (
                            <div className="flex justify-between py-1 border-b border-slate-200">
                              <span className="text-slate-500 font-semibold">Email:</span>
                              <span className="font-medium text-slate-900">{formData.email}</span>
                            </div>
                          )}
                          {formData.clinicNumber && (
                            <div className="flex justify-between py-1">
                              <span className="text-slate-500 font-semibold">Clinic / Office Phone:</span>
                              <span className="font-medium text-slate-900">{formData.clinicNumber}</span>
                            </div>
                          )}
                        </div>

                        <div className="bg-teal-50 p-3 rounded-lg border border-teal-200 text-xs text-teal-900 flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-700" />
                          <span>Member profile will be registered under chapter {formData.chapterName || defaultChapterName}.</span>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* ---------------- ASSET WIZARD STEPS ---------------- */}
                {activeWizard === "asset" && (
                  <>
                    {currentStepConfig.id === "asset_info" && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Asset Name *</label>
                          <input
                            type="text"
                            placeholder="e.g. Projector, Office Chair, Laptop"
                            value={formData.assetName || ""}
                            onChange={(e) => setFormData({ ...formData, assetName: e.target.value })}
                            className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-2">Category</label>
                          <div className="grid grid-cols-2 gap-2">
                            {["Electronics", "Furniture", "Medical Equipment", "Real Estate"].map((cat) => (
                              <button
                                key={cat}
                                type="button"
                                onClick={() => setFormData({ ...formData, category: cat })}
                                className={`p-3 rounded-xl border text-xs font-bold ${
                                  formData.category === cat ? "bg-[#0F6E5D] text-white border-[#0F6E5D]" : "bg-white border-slate-200"
                                }`}
                              >
                                {cat}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {currentStepConfig.id === "value_custodian" && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Asset Value (₹) *</label>
                          <input
                            type="number"
                            min="1"
                            value={formData.assetValue || ""}
                            onChange={(e) => setFormData({ ...formData, assetValue: Number(e.target.value) })}
                            className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Custodian Name *</label>
                          <input
                            type="text"
                            value={formData.custodianName || ""}
                            onChange={(e) => setFormData({ ...formData, custodianName: e.target.value })}
                            className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
                          />
                        </div>
                      </div>
                    )}

                    {currentStepConfig.id === "review" && (
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                        <p><strong>Asset:</strong> {formData.assetName}</p>
                        <p><strong>Category:</strong> {formData.category}</p>
                        <p><strong>Value:</strong> {formatINR(formData.assetValue)}</p>
                        <p><strong>Custodian:</strong> {formData.custodianName}</p>
                      </div>
                    )}
                  </>
                )}

                {/* ---------------- BANK BALANCE WIZARD STEPS ---------------- */}
                {activeWizard === "bank_balance" && (
                  <>
                    {currentStepConfig.id === "balance_type" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div
                          onClick={() => setFormData({ ...formData, amountType: "Bank Balance" })}
                          className={`p-5 rounded-2xl border-2 cursor-pointer text-center ${
                            formData.amountType === "Bank Balance" ? "border-[#0F6E5D] bg-[#E4F1EE]" : "border-slate-200"
                          }`}
                        >
                          <div className="text-3xl">🏦</div>
                          <h4 className="font-bold text-sm">Liquid Bank Balance</h4>
                          <p className="text-xs text-slate-500">Operating bank savings/current balance.</p>
                        </div>

                        <div
                          onClick={() => setFormData({ ...formData, amountType: "FD" })}
                          className={`p-5 rounded-2xl border-2 cursor-pointer text-center ${
                            formData.amountType === "FD" ? "border-[#0F6E5D] bg-[#E4F1EE]" : "border-slate-200"
                          }`}
                        >
                          <div className="text-3xl">📜</div>
                          <h4 className="font-bold text-sm">Fixed Deposit (FD)</h4>
                          <p className="text-xs text-slate-500">Long-term fixed deposit instrument.</p>
                        </div>
                      </div>
                    )}

                    {currentStepConfig.id === "balance_amount" && (
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Balance Amount (₹) *</label>
                        <input
                          type="number"
                          min="1"
                          value={formData.amount || ""}
                          onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                          className="w-full text-2xl font-bold p-3 border border-slate-300 rounded-xl"
                          placeholder="0"
                        />
                      </div>
                    )}

                    {currentStepConfig.id === "review" && (
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                        <p><strong>Account Type:</strong> {formData.amountType}</p>
                        <p><strong>Balance:</strong> {formatINR(formData.amount)}</p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Wizard Footer Action Button */}
              <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 sm:gap-3">
                <button
                  onClick={currentStep === 0 ? handleCloseWizard : () => setCurrentStep((prev) => prev - 1)}
                  className="px-4 sm:px-5 py-2.5 bg-white text-slate-700 font-bold rounded-xl border border-slate-200 hover:bg-slate-100 cursor-pointer text-xs whitespace-nowrap shrink-0"
                >
                  {currentStep === 0 ? "Cancel" : "Back"}
                </button>

                {currentStep < steps.length - 1 ? (
                  <button
                    disabled={!isStepValid()}
                    onClick={() => setCurrentStep((prev) => prev + 1)}
                    className="px-5 sm:px-6 py-2.5 bg-[#0F6E5D] text-white font-bold rounded-xl hover:bg-[#0B5548] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all text-xs shadow-sm flex items-center gap-1.5 whitespace-nowrap shrink-0"
                  >
                    <span>Continue</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    disabled={!isStepValid()}
                    onClick={handleFinalSubmit}
                    className="px-5 sm:px-6 py-2.5 bg-[#0F6E5D] text-white font-bold rounded-xl hover:bg-[#0B5548] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all text-xs shadow-md flex items-center gap-1.5 whitespace-nowrap shrink-0"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Confirm & Save Entry</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
