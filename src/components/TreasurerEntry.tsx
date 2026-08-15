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
  MemberQualification,
  Asset,
  BankBalance,
  ChapterMaster,
  ReportTab,
} from "../types";
import { CHAPTERS } from "../mockData";
import { formatDateDMY, formatINR, ensureDoctorPrefix } from "../utils/formatters";
import { getChapterCode, getFinancialUnitName, getUserFinancialUnitId } from "../utils/financialUnits";
import AmountInput from "./AmountInput";
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
  Phone,
  Lock,
  Wallet,
  Landmark,
  Building2,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

interface TreasurerEntryProps {
  currentUser: User;
  accountHeads: AccountHead[];
  membersList?: Member[];
  chapterDirectory?: ChapterMaster[];
  transactions?: Transaction[];
  assetsList?: Asset[];
  onAddTransaction: (tx: Omit<Transaction, "id" | "createdBy" | "createdAt" | "chapterId" | "headName">) => void;
  onUpdateTransaction: (tx: Transaction) => void;
  editingTransaction: Transaction | null;
  onCancelEdit: () => void;
  onAddMember?: (member: Omit<Member, "id" | "slNo">) => void;
  onAddAsset?: (asset: Omit<Asset, "id" | "slNo">) => void;
  onAddBankBalance?: (bankBalance: Omit<BankBalance, "id" | "slNo">) => void;
  onOpenReports?: (tab?: ReportTab) => void;
  activeHomeWizard?: string | null;
  onHomeWizardChange?: (wizard: string | null) => void;
}

export type EntryWizardType = "income" | "expense" | "loan" | "loans_dashboard" | "repay_loan" | "member" | "asset" | "bank_balance" | null;

const mapUrlToWizard = (param?: string | null): EntryWizardType => {
  if (!param) return null;
  if (param === "fixed_deposit") return "bank_balance";
  const valid: EntryWizardType[] = ["income", "expense", "loan", "loans_dashboard", "repay_loan", "member", "asset", "bank_balance"];
  return valid.includes(param as any) ? (param as EntryWizardType) : null;
};

const mapWizardToUrl = (type: EntryWizardType): string | null => {
  if (!type) return null;
  if (type === "bank_balance") return "fixed_deposit";
  return type;
};

export default function TreasurerEntry({
  currentUser,
  accountHeads,
  membersList = [],
  chapterDirectory = [],
  transactions = [],
  assetsList = [],
  onAddTransaction,
  onUpdateTransaction,
  editingTransaction,
  onCancelEdit,
  onAddMember,
  onAddAsset,
  onAddBankBalance,
  onOpenReports,
  activeHomeWizard,
  onHomeWizardChange,
}: TreasurerEntryProps) {
  // Determine chapter details
  const userUnitId = getUserFinancialUnitId(currentUser);
  const defaultChapterId = getChapterCode(userUnitId);
  const defaultChapterName = getFinancialUnitName(userUnitId);

  // Active Wizard Mode
  const [activeWizard, setActiveWizard] = useState<EntryWizardType>(() => mapUrlToWizard(activeHomeWizard));
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // Repayment Flow State
  const [selectedLoan, setSelectedLoan] = useState<Transaction | null>(null);
  const [repaymentAmount, setRepaymentAmount] = useState<number>(0);
  const [repaymentRemarks, setRepaymentRemarks] = useState<string>("");
  const [repaymentMode, setRepaymentMode] = useState<"Cash" | "Bank">("Cash");
  const [repaymentDate, setRepaymentDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [repaymentStep, setRepaymentStep] = useState<number>(0);

  // Wizard Data State
  const [formData, setFormData] = useState<any>({});
  const [memberSearchTerm, setMemberSearchTerm] = useState<string>("");
  const [qualSearchTerm, setQualSearchTerm] = useState<string>("");

  useEffect(() => {
    const targetWizard = mapUrlToWizard(activeHomeWizard);
    if (targetWizard !== activeWizard) {
      if (targetWizard) {
        handleStartWizard(targetWizard, false);
      } else {
        handleCloseWizard(false);
      }
    }
  }, [activeHomeWizard]);

  useEffect(() => {
    if (activeWizard) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeWizard]);

  useEffect(() => {
    setMemberSearchTerm("");
  }, [currentStep, activeWizard]);

  const DEGREE_OPTIONS = [
    "B.Sc",
    "BHMS",
    "DHMS",
    "Fellowship",
    "MBA (Hospital Mgmt)",
    "MD (General)",
    "MD (Homeo)",
    "MPH (Public Health)",
    "M.Sc",
    "MS",
    "Others (specify)",
    "PhD",
  ];

  const MEDICAL_COUNCIL_OPTIONS = [
    "Central Council of Homoeopathy (CCH)",
    "Delhi Homoeopathic Medical Council",
    "Karnataka Board of Homoeopathic System of Medicine",
    "Maharashtra Council of Homoeopathy",
    "National Medical Commission (NMC)",
    "Other Medical Council",
    "State Council of Homoeopathy, Kerala",
    "Tamil Nadu Board of Homoeopathy",
    "Travancore-Cochin Medical Council (TCMC)",
  ];

  const currentYear = new Date().getFullYear();
  const YEAR_OF_PASSING_OPTIONS = Array.from({ length: 51 }, (_, i) => String(currentYear - i));

  const INDIAN_STATES = [
    "Andaman and Nicobar Islands",
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chandigarh",
    "Chhattisgarh",
    "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jammu and Kashmir",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Ladakh",
    "Lakshadweep",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Puducherry",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
  ];

  // Populate data when editing an existing transaction
  useEffect(() => {
    if (editingTransaction) {
      // Strip the RV-/PV-/LV- prefix so the manual voucher number step shows only the typed suffix
      const stripVoucherPrefix = (v?: string) => (v ? v.replace(/^(RV|PV|LV)-/i, "") : "");
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
          voucherNumber: stripVoucherPrefix(editingTransaction.voucherNumber),
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
          voucherNumber: stripVoucherPrefix(editingTransaction.voucherNumber),
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
          voucherNumber: stripVoucherPrefix(editingTransaction.voucherNumber),
          date: editingTransaction.date || new Date().toISOString().slice(0, 10),
        });
      }
      setCurrentStep(0);
      setIsSuccess(false);
    }
  }, [editingTransaction]);

  // Capital asset categories offered in the asset register dropdown
  const ASSET_CATEGORIES = [
    "Electronics",
    "Office Electronics",
    "Furniture",
    "Medical Equipment",
    "Electrical Equipment",
    "Appliances",
    "Real Estate",
    "Vehicles",
    "Books & Library",
    "Others",
  ];

  // Next sequential asset number, unique across the existing register (AST-[#009] style)
  const generateAssetNumber = () => {
    const highest = assetsList.reduce((max, a) => {
      const digits = String(a.assetId || "").match(/(\d+)/);
      const n = digits ? parseInt(digits[1], 10) : 0;
      return n > max ? n : max;
    }, 0);
    return `AST-[#${String(highest + 1).padStart(3, "0")}]`;
  };

  // Total value = unit price x number of items
  const totalValueOf = (data: any) =>
    (Number(data?.assetValue) || 0) * (Number(data?.quantity) || 0);

  // Straight-line annual depreciation: total value spread evenly across the asset's life
  const depreciationAmountOf = (data: any) => {
    const life = Number(data?.assetLife) || 0;
    if (life <= 0) return 0;
    return Math.round(totalValueOf(data) / life);
  };

  // Written-down value after one year of depreciation
  const netAmountOf = (data: any) => totalValueOf(data) - depreciationAmountOf(data);

  // Reset Wizard State
  const handleStartWizard = (type: EntryWizardType, updateUrl = true) => {
    setActiveWizard(type);
    setCurrentStep(0);
    setIsSuccess(false);
    setMemberSearchTerm("");

    if (updateUrl && onHomeWizardChange) {
      onHomeWizardChange(mapWizardToUrl(type));
    }

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
        voucherNumber: "",
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
        voucherNumber: "",
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
        paymentMode: "Cash",
        loanAmount: 0,
        targetReturnDate: todayStr,
        remarks: "",
        voucherNumber: "",
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
        gender: null, // NO PREFILL
        bloodGroup: null, // NO PREFILL
        dob: "",
        qualifications: [],
        qualificationsList: [],
        qualification: "",
        specialization: "",
        yearsOfPractice: "",
        clinicAddress: "",
        residentialAddress: "",
        associationRole: "",
        emergencyContact: "",
        chapterId: defaultChapterId,
        chapterName: defaultChapterName,
        membershipType: null, // STRICT NO PREFILL - Explicit tap required!
        membershipDate: todayStr, // Date set as today
        membershipStatus: null, // STRICT NO PREFILL - Explicit tap required!
        mobileNumber: "",
        whatsappNumber: "",
        email: "",
        clinicNumber: "",
        // Form builder state for adding individual qualification records
        tempDegree: "",
        tempDegreeTitle: "",
        tempInstitution: "",
        tempUniversity: "",
        tempYearOfPassing: "",
        tempMedicalCouncilName: "",
        tempMedicalCouncilState: "",
        tempRegistrationNumber: "",
      });
      setQualSearchTerm("");
    } else if (type === "asset") {
      setFormData({
        assetName: "",
        category: null,
        chapterId: defaultChapterId,
        chapterName: defaultChapterName,
        assetNumber: generateAssetNumber(),
        purchaseDate: "", // NO PREFILL
        quantity: 1,
        assetValue: 0,
        paymentMode: null, // STRICT NO-DEFAULT RULE
        assetLife: 0,
        custodianName: "", // NO PREFILL
        custodianMemberId: "",
        remarks: "",
      });
    } else if (type === "bank_balance") {
      setFormData({
        amountType: null, // STRICT NO-DEFAULT RULE — FD or Bank interest must be tapped
        chapterId: defaultChapterId,
        chapterName: defaultChapterName,
        depositedBy: "", // NO PREFILL
        depositedByMemberId: "",
        amount: 0,
        interestAmount: 0,
        remarks: "",
        date: todayStr,
        fdTermYears: "",
        maturityDate: "",
        bankName: "",
        bankBranch: "",
        bankAccountNumber: "",
        bankAddress: "",
        bankContactNumber: "",
        voucherNumber: `RV-${Math.floor(100 + Math.random() * 900)}`,
      });
    }
  };

  const handleCloseWizard = (updateUrl = true) => {
    setActiveWizard(null);
    setCurrentStep(0);
    setFormData({});
    setIsSuccess(false);
    if (editingTransaction) {
      onCancelEdit();
    }

    if (updateUrl) {
      if (window.location.hash.includes("wizard=")) {
        window.history.back();
      } else if (onHomeWizardChange) {
        onHomeWizardChange(null);
      }
    }
  };

  // Define step configurations dynamically
  const getWizardSteps = () => {
    if (activeWizard === "income") {
      const isMembership = formData.category === "membership";
      const isOthers = formData.category === "others";

      const steps = [
        { id: "date", title: "Select Receipt Date", sub: "" },
        { id: "category", title: "Select Income Head", sub: "" },
      ];

      if (isMembership) {
        steps.push(
          { id: "membership_tier", title: "Select Membership Tier", sub: "" }
        );
      }

      if (isOthers) {
        steps.push(
          { id: "other_category_text", title: "Specify Income Category", sub: "" }
        );
      }

      steps.push(
        { id: "payment_mode", title: "Select Mode of Payment", sub: "" },
        { id: "amount", title: "Receivable and Received Amount", sub: "" },
        { id: "remarks", title: "Remarks / Notes", sub: "" },
        { id: "collected_by", title: "Who collected this income?", sub: "" },
        { id: "paid_by", title: "Who paid this amount?", sub: "" },
        { id: "voucher_number", title: "Voucher Number", sub: "" },
        { id: "review", title: "Review and Save", sub: "" }
      );
      return steps;
    }

    if (activeWizard === "expense") {
      const isDigitalMedia = formData.category === "digital_media";
      const isWebsiteOrApp =
        isDigitalMedia && (formData.digitalMediaType === "Website" || formData.digitalMediaType === "Application");
      const isOthers = formData.category === "others";

      const steps = [
        { id: "date", title: "Select Payment Date", sub: "" },
        { id: "category", title: "Select Expense Head", sub: "" },
      ];

      if (isDigitalMedia) {
        steps.push(
          { id: "digital_media_type", title: "Select Digital Media Type", sub: "" }
        );
        if (isWebsiteOrApp) {
          steps.push(
            { id: "digital_media_charge", title: "Select Charge Type", sub: "" }
          );
        }
      }

      if (isOthers) {
        steps.push(
          { id: "other_category_text", title: "Specify Expense Category", sub: "" }
        );
      }

      steps.push(
        { id: "payment_mode", title: "Select Mode of Payment", sub: "" },
        { id: "amount", title: "Payable and Paid Amount", sub: "" },
        { id: "remarks", title: "Remarks / Notes", sub: "" },
        { id: "paid_by", title: "Who paid this expense?", sub: "" },
        { id: "paid_to", title: "Who was this paid to?", sub: "" },
        { id: "voucher_number", title: "Voucher Number", sub: "" },
        { id: "review", title: "Review and Save", sub: "" }
      );
      return steps;
    }

    if (activeWizard === "loan") {
      return [
        { id: "date", title: "Select Loan Date", sub: "" },
        { id: "paid_to", title: "Paid To Chapter", sub: "" },
        { id: "particulars", title: "Loan Particulars", sub: "" },
        { id: "payment_mode", title: "Mode of Payment", sub: "" },
        { id: "amount", title: "Loan Amount", sub: "" },
        { id: "remarks", title: "Remarks / Notes", sub: "" },
        { id: "loan_return_date", title: "Agreed Return Date", sub: "" },
        { id: "voucher_number", title: "Voucher Number", sub: "" },
        { id: "review", title: "Review and Save", sub: "" },
      ];
    }

    if (activeWizard === "member") {
      return [
        { id: "member_basic", title: "Doctor's Name & Demographics", sub: "" },
        { id: "member_qualifications", title: "Academic Degrees & Qualifications", sub: "" },
        { id: "member_practice", title: "Clinical Specialty & Address", sub: "" },
        { id: "member_contact", title: "Contact Information", sub: "" },
        { id: "review", title: "Review and Save", sub: "" },
      ];
    }

    if (activeWizard === "asset") {
      return [
        { id: "asset_purchase_date", title: "Asset Purchase Date", sub: "" },
        { id: "asset_category", title: "Asset Category", sub: "" },
        { id: "asset_name", title: "Asset Name", sub: "" },
        { id: "asset_quantity", title: "Number of Items", sub: "" },
        { id: "asset_value", title: "Asset Value", sub: "" },
        { id: "asset_payment_mode", title: "Mode of Payment", sub: "" },
        { id: "asset_life", title: "Asset Life", sub: "" },
        { id: "asset_custodian", title: "Custodian Name", sub: "" },
        { id: "asset_remarks", title: "Remarks / Notes", sub: "" },
        { id: "review", title: "Review and Save", sub: "" },
      ];
    }

    if (activeWizard === "bank_balance") {
      if (formData.amountType === "Bank Interest") {
        return [
          { id: "fd_date", title: "Select Date", sub: "" },
          { id: "fd_amount_type", title: "Amount Type", sub: "" },
          { id: "fd_interest_amount", title: "Interest Amount", sub: "" },
          { id: "fd_remarks", title: "Remarks / Notes", sub: "" },
          { id: "review", title: "Review and Save", sub: "" },
        ];
      }

      return [
        { id: "fd_date", title: "Select Date", sub: "" },
        { id: "fd_amount_type", title: "Amount Type", sub: "" },
        { id: "balance_amount", title: "FD Amount", sub: "" },
        { id: "fd_term", title: "FD Term & Maturity Date", sub: "" },
        { id: "fd_bank_details", title: "Bank Details", sub: "" },
        { id: "fd_remarks", title: "Remarks / Notes", sub: "" },
        { id: "review", title: "Review and Save", sub: "" },
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
    if (sId === "voucher_number") return !!formData.voucherNumber && !!formData.voucherNumber.trim();

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

    if (sId === "member_basic") return !!formData.memberName?.trim() && !!formData.gender && !!formData.bloodGroup && !!formData.dob;
    if (sId === "member_qualifications") {
      const hasList = Array.isArray(formData.qualificationsList) && formData.qualificationsList.length > 0;
      const hasQuals = Array.isArray(formData.qualifications) && formData.qualifications.length > 0;
      const hasQualStr = !!formData.qualification?.trim();
      const hasTempDegree = !!formData.tempDegree;
      return hasList || hasQuals || hasQualStr || hasTempDegree;
    }
    if (sId === "member_practice") return true;
    if (sId === "member_contact") {
      const digits = (formData.mobileNumber || "").replace(/\D/g, "");
      return digits.length === 10;
    }

    if (sId === "asset_name") return !!formData.assetName?.trim();
    if (sId === "asset_purchase_date") return !!formData.purchaseDate;
    if (sId === "asset_quantity") return Number(formData.quantity) > 0;
    if (sId === "asset_value") return Number(formData.assetValue) > 0;
    if (sId === "asset_payment_mode") return !!formData.paymentMode; // STRICT NO-DEFAULT RULE
    if (sId === "asset_category") return !!formData.category;
    if (sId === "asset_life") return Number(formData.assetLife) > 0;
    if (sId === "asset_custodian") return !!formData.custodianName?.trim();
    if (sId === "asset_depreciation") return true; // Fully auto-calculated
    if (sId === "asset_remarks") return true; // Optional

    if (sId === "fd_date") return !!formData.date;
    if (sId === "fd_amount_type") return !!formData.amountType; // STRICT NO-DEFAULT RULE
    if (sId === "balance_amount") return formData.amount > 0;
    if (sId === "fd_interest_amount") return Number(formData.interestAmount) > 0;
    if (sId === "fd_remarks") return true; // Optional
    if (sId === "fd_term") return !!formData.fdTermYears;
    if (sId === "fd_bank_details") return !!formData.bankName?.trim();

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
        voucherNumber: `RV-${formData.voucherNumber}`,
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
        voucherNumber: `PV-${formData.voucherNumber}`,
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
        voucherNumber: `LV-${formData.voucherNumber}`,
        chapterIdInput: formData.chapterId || defaultChapterId,
        chapterNameInput: formData.chapterName || defaultChapterName,
        paidToCategory: "chapter" as const,
        paidTo: formData.recipientName,
        paidToId: formData.recipientId,
        paidToName: formData.recipientName,
        particulars: formData.particulars || "Temporary loan disbursement",
        paymentMode: (formData.paymentMode || "Cash") as "Cash" | "Bank",
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
      let qualList: MemberQualification[] = formData.qualificationsList || [];
      if (qualList.length === 0 && formData.tempDegree) {
        qualList = [{
          degree: formData.tempDegree,
          degreeTitle: formData.tempDegreeTitle?.trim() || undefined,
          institution: formData.tempInstitution?.trim() || undefined,
          university: formData.tempUniversity?.trim() || undefined,
          yearOfPassing: formData.tempYearOfPassing?.trim() || undefined,
          medicalCouncilName: formData.tempMedicalCouncilName || undefined,
          medicalCouncilState: formData.tempMedicalCouncilState || undefined,
          registrationNumber: formData.tempRegistrationNumber?.trim() || undefined,
        }];
      }

      let qualSummary = "";
      if (qualList.length > 0) {
        qualSummary = qualList
          .map(
            (q) =>
              `${q.degree}${q.degreeTitle ? ` in ${q.degreeTitle}` : ""}${
                q.university ? ` (${q.university})` : q.institution ? ` (${q.institution})` : ""
              }${q.yearOfPassing ? ` '${q.yearOfPassing.slice(-2)}` : ""}`
          )
          .join(" | ");
      } else if (Array.isArray(formData.qualifications) && formData.qualifications.length > 0) {
        qualSummary = formData.qualifications.join(", ");
      } else {
        qualSummary = formData.qualification || "BHMS";
      }

      onAddMember({
        memberId: `MEM-${Math.floor(100 + Math.random() * 900)}`,
        memberName: ensureDoctorPrefix(formData.memberName || "Unnamed"),
        chapterIdInput: formData.chapterId || defaultChapterId,
        chapterNameInput: formData.chapterName || defaultChapterName,
        qualification: qualSummary,
        qualificationsList: qualList,
        membershipType: formData.membershipType || "Silver",
        membershipDate: formData.membershipDate || todayStr,
        membershipStatus: formData.membershipStatus || "Active",
        mobileNumber: formData.mobileNumber || "",
        whatsappNumber: formData.whatsappNumber || formData.mobileNumber || "",
        email: formData.email || "",
        clinicNumber: formData.clinicNumber || "",
        gender: formData.gender || undefined,
        dob: formData.dob || undefined,
        bloodGroup: formData.bloodGroup || undefined,
        specialization: formData.specialization || undefined,
        yearsOfPractice: formData.yearsOfPractice || undefined,
        clinicAddress: formData.clinicAddress || undefined,
        residentialAddress: formData.residentialAddress || undefined,
        associationRole: formData.associationRole || undefined,
        emergencyContact: formData.emergencyContact || undefined,
      });
    } else if (activeWizard === "asset" && onAddAsset) {
      onAddAsset({
        date: formData.purchaseDate || todayStr,
        chapterIdInput: formData.chapterId || defaultChapterId,
        chapterNameInput: formData.chapterName || defaultChapterName,
        assetId: formData.assetNumber || generateAssetNumber(),
        assetName: formData.assetName,
        purchaseDate: formData.purchaseDate,
        quantity: Number(formData.quantity) || 1,
        assetValue: Number(formData.assetValue),
        totalValue: totalValueOf(formData),
        paymentMode: formData.paymentMode || "Cash",
        category: formData.category || "General Asset",
        assetLife: Number(formData.assetLife) || 0,
        custodianName: formData.custodianName,
        depreciationAmount: depreciationAmountOf(formData),
        netAmount: netAmountOf(formData),
        remarks: formData.remarks?.trim() || undefined,
      });
    } else if (activeWizard === "bank_balance" && formData.amountType === "Bank Interest") {
      // Bank interest is plain income — the treasurer types the exact amount the bank
      // credited, and it posts straight to the Bank income head so every report picks
      // it up. Nothing is added to the FD register.
      const interestAmount = Number(formData.interestAmount) || 0;
      onAddTransaction({
        date: formData.date || todayStr,
        type: HeadType.Income,
        headId: "inc_bank",
        amount: interestAmount,
        voucherNumber: formData.voucherNumber,
        chapterIdInput: formData.chapterId || defaultChapterId,
        chapterNameInput: formData.chapterName || defaultChapterName,
        collectedBy: currentUser.name,
        paidBy: "Bank (Interest)",
        offeredAmount: interestAmount,
        paidAmount: interestAmount,
        balanceAmount: 0,
        paymentMode: "Bank",
        isFdInterest: true,
        remarks: formData.remarks?.trim() || undefined,
        description: formData.remarks?.trim() || "Bank / FD interest received",
      });
    } else if (activeWizard === "bank_balance" && onAddBankBalance) {
      onAddBankBalance({
        date: formData.date || todayStr,
        chapterIdInput: formData.chapterId || defaultChapterId,
        chapterNameInput: formData.chapterName || defaultChapterName,
        amountType: "FD",
        amount: Number(formData.amount),
        depositedBy: formData.depositedBy?.trim() || undefined,
        maturityDate: formData.maturityDate || undefined,
        bankName: formData.bankName?.trim() || undefined,
        bankBranch: formData.bankBranch?.trim() || undefined,
        bankAccountNumber: formData.bankAccountNumber?.trim() || undefined,
        bankAddress: formData.bankAddress?.trim() || undefined,
        bankContactNumber: formData.bankContactNumber?.trim() || undefined,
        remarks: formData.remarks?.trim() || undefined,
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
    { key: "bank_expense", label: "Bank charges", sub: "Bank ledger charges, cheque book fees", icon: "🏦" },
    { key: "others", label: "Others", sub: "Unclassified or custom expense category", icon: "📎" },
  ];

  // Filter members for picker in alphabetical order
  const filteredMembers = [...membersList]
    .filter(
      (m) =>
        m.memberName.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
        m.memberId.toLowerCase().includes(memberSearchTerm.toLowerCase())
    )
    .sort((a, b) => a.memberName.localeCompare(b.memberName));

  // Filter chapters for loan picker (own chapter can never borrow from itself)
  const filteredChapters = chapterDirectory.filter(
    (c) =>
      c.id !== defaultChapterId &&
      c.chapterName.trim().toLowerCase() !== defaultChapterName.trim().toLowerCase() &&
      c.id !== getChapterCode(defaultChapterId) &&
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
                  Logged by
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
            {/* Primary Highlight Card: Financial Reports */}
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
                    <h3 className="font-bold text-base sm:text-lg text-white font-display">
                      Financial Reports
                    </h3>
                  </div>
                </div>
                <div className="px-3.5 py-1.5 sm:px-4 sm:py-2 bg-teal-600 group-hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0 border border-teal-400/30 whitespace-nowrap">
                  <span>Open Reports</span>
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </button>

            {/* 1. Add Receipt (Income) */}
            <button
              onClick={() => handleStartWizard("income")}
              className="group bg-white p-5 rounded-2xl border border-teal-100 shadow-xs hover:shadow-md hover:border-teal-500 transition-all text-left flex flex-col justify-between cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                  💰
                </div>
                <ChevronRight className="h-5 w-5 text-teal-600 group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="font-bold text-base text-slate-900 group-hover:text-teal-800 transition-colors mt-4">
                Add Receipt (Income)
              </h3>
            </button>

            {/* 2. Add Payment (Expense) */}
            <button
              onClick={() => handleStartWizard("expense")}
              className="group bg-white p-5 rounded-2xl border border-amber-100 shadow-xs hover:shadow-md hover:border-amber-500 transition-all text-left flex flex-col justify-between cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                  🧾
                </div>
                <ChevronRight className="h-5 w-5 text-amber-600 group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="font-bold text-base text-slate-900 group-hover:text-amber-800 transition-colors mt-4">
                Add Payment (Expense)
              </h3>
            </button>

            {/* 3. Internal Loans Dashboard */}
            <button
              onClick={() => handleStartWizard("loans_dashboard")}
              className="group bg-white p-5 rounded-2xl border border-indigo-100 shadow-xs hover:shadow-md hover:border-indigo-500 transition-all text-left flex flex-col justify-between cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-800 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                  💼
                </div>
                <ChevronRight className="h-5 w-5 text-indigo-600 group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="font-bold text-base text-slate-900 group-hover:text-indigo-800 transition-colors mt-4">
                Internal Loans Dashboard
              </h3>
            </button>

            {/* 4. Add Member */}
            <button
              onClick={() => handleStartWizard("member")}
              className="group bg-white p-5 rounded-2xl border border-emerald-100 shadow-xs hover:shadow-md hover:border-emerald-500 transition-all text-left flex flex-col justify-between cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                  👥
                </div>
                <ChevronRight className="h-5 w-5 text-emerald-600 group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="font-bold text-base text-slate-900 group-hover:text-emerald-800 transition-colors mt-4">
                Add Member
              </h3>
            </button>

            {/* 5. Add Asset */}
            <button
              onClick={() => handleStartWizard("asset")}
              className="group bg-white p-5 rounded-2xl border border-sky-100 shadow-xs hover:shadow-md hover:border-sky-500 transition-all text-left flex flex-col justify-between cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-800 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                  🏢
                </div>
                <ChevronRight className="h-5 w-5 text-sky-600 group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="font-bold text-base text-slate-900 group-hover:text-sky-800 transition-colors mt-4">
                Add Asset
              </h3>
            </button>

            {/* 6. Add Fixed Deposit (FD) */}
            <button
              onClick={() => handleStartWizard("bank_balance")}
              className="group bg-white p-5 rounded-2xl border border-purple-100 shadow-xs hover:shadow-md hover:border-purple-500 transition-all text-left flex flex-col justify-between cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-800 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                  📜
                </div>
                <ChevronRight className="h-5 w-5 text-purple-600 group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="font-bold text-base text-slate-900 group-hover:text-purple-800 transition-colors mt-4">
                Add Fixed Deposit (FD)
              </h3>
            </button>
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
                  Treasurer Internal Loan Ledger
                </span>
              </div>
              <h2 className="text-2xl font-bold font-display text-white">
                Internal Loans Dashboard
              </h2>
              <p className="text-xs text-indigo-200/80 mt-1">
                Monitor chapter internal loans, track agreed return dates, and log internal loan repayments.
              </p>
            </div>

            <button
              onClick={() => handleStartWizard("loan")}
              id="log-new-loan-top-btn"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0 border border-indigo-400/30"
            >
              <Plus className="h-4 w-4" />
              <span>Add Internal Loan</span>
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
                      No Internal Loans Logged Yet
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      There are no active or historical chapter internal loan disbursements recorded in this ledger.
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => handleStartWizard("loan")}
                      id="log-new-loan-highlighted-btn"
                      className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 hover:from-indigo-500 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg ring-4 ring-indigo-500/20 animate-pulse transition-all cursor-pointer"
                    >
                      <Plus className="h-5 w-5" />
                      <span>Add Internal Loan</span>
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Recorded Chapter Internal Loans ({loanList.length})
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">
                    Showing all active & settled internal loans
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
                              <strong className="text-slate-700">Loan Date:</strong> {loan.date ? formatDateDMY(loan.date) : "—"} • <strong className="text-slate-700">Voucher #:</strong> {loan.voucherNumber || "LV-N/A"} • <strong className="text-slate-700">Out Mode:</strong> {loan.paymentMode || "Cash"}
                              {returnedAmt > 0 && (
                                <> • <strong className="text-emerald-700">Repay Mode:</strong> {loan.repaymentPaymentMode || loan.paymentMode || "Cash"}</>
                              )}
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
                                  setRepaymentMode("Cash");
                                  setRepaymentDate(new Date().toISOString().slice(0, 10));
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
                  <span>Internal Loans Dashboard</span>
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
                    <AmountInput
                      value={repaymentAmount}
                      onValueChange={(v) => setRepaymentAmount(v)}
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

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Mode of Repayment Received <span className="text-rose-600">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRepaymentMode("Cash")}
                      className={`py-2.5 px-4 text-xs font-bold rounded-xl border flex items-center justify-center gap-2 cursor-pointer transition-all ${
                        repaymentMode === "Cash"
                          ? "bg-emerald-700 border-emerald-700 text-white shadow-xs"
                          : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span className="text-base">💵</span>
                      <span>Cash</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRepaymentMode("Bank")}
                      className={`py-2.5 px-4 text-xs font-bold rounded-xl border flex items-center justify-center gap-2 cursor-pointer transition-all ${
                        repaymentMode === "Bank"
                          ? "bg-emerald-700 border-emerald-700 text-white shadow-xs"
                          : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span className="text-base">🏦</span>
                      <span>Bank Transfer / Cheque</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Repayment Date Received <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="date"
                    max={new Date().toISOString().slice(0, 10)}
                    value={repaymentDate}
                    onChange={(e) => setRepaymentDate(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-bold bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

                  {/* Mode of Repayment */}
                  <div className="flex justify-between py-1.5 border-b border-slate-200">
                    <span className="text-slate-500 font-semibold">Mode of Repayment:</span>
                    <span className="font-bold text-emerald-800">
                      {repaymentMode === "Cash" ? "💵 Cash" : "🏦 Bank Transfer / Cheque"}
                    </span>
                  </div>

                  {/* Repayment Date */}
                  <div className="flex justify-between py-1.5 border-b border-slate-200">
                    <span className="text-slate-500 font-semibold">Repayment Date Received:</span>
                    <span className="font-bold text-slate-900">{formatDateDMY(repaymentDate)}</span>
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
                  const returnedDate = newBal <= 0 ? repaymentDate : selectedLoan.loanReturnedDate;

                  const updatedLoan: Transaction = {
                    ...selectedLoan,
                    amountReturned: newReturned,
                    loanBalance: newBal,
                    repaymentPaymentMode: repaymentMode,
                    repaymentDate: repaymentDate,
                    loanReturnedDate: returnedDate,
                    updatedAt: new Date().toISOString(),
                    remarks: repaymentRemarks
                      ? `${selectedLoan.remarks ? selectedLoan.remarks + " | " : ""}Repaid ₹${repaymentAmount} via ${repaymentMode} on ${formatDateDMY(repaymentDate)}: ${repaymentRemarks}`
                      : `${selectedLoan.remarks ? selectedLoan.remarks + " | " : ""}Repaid ₹${repaymentAmount} via ${repaymentMode} on ${formatDateDMY(repaymentDate)}`,
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
              <div className="w-20 h-20 bg-teal-50 text-teal-700 rounded-full flex items-center justify-center text-4xl mx-auto shadow-inner border border-teal-100">
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
                    {activeWizard === "income" && "Add Receipt (Income)"}
                    {activeWizard === "expense" && "Add Payment (Expense)"}
                    {activeWizard === "loan" && "Add Internal Loan"}
                    {activeWizard === "member" && "Add Member"}
                    {activeWizard === "asset" && "Add Asset"}
                    {activeWizard === "bank_balance" && "Add Fixed Deposit (FD)"}
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

              {/* Step Content Workspace */}
              <div className="p-6 space-y-4">
                {/* ---------------- INCOME WIZARD STEPS ---------------- */}
                {activeWizard === "income" && (
                  <>
                    {/* Step: Date */}
                    {currentStepConfig.id === "date" && (
                      <div className="space-y-4">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Select Receipt Date
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
                            Today
                          </button>
                        </div>
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
                          {/* Guest / Non-registered Option (Top when no search, bottom when searching) */}
                          {!memberSearchTerm && (
                            <div
                              onClick={() => {
                                const typedName = memberSearchTerm.trim();
                                const guestName = formData.collectedById === "GUEST" ? formData.collectedBy : (typedName || formData.collectedBy || "");
                                setFormData({
                                  ...formData,
                                  collectedBy: guestName,
                                  collectedById: "GUEST",
                                });
                              }}
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
                          )}

                          {/* Registered Members in Alphabetical Order */}
                          {filteredMembers.map((m) => (
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

                          {/* Guest / Non-registered Option (Bottom when searching) */}
                          {memberSearchTerm && (
                            <div
                              onClick={() => {
                                const typedName = memberSearchTerm.trim();
                                const guestName = formData.collectedById === "GUEST" ? formData.collectedBy : (typedName || formData.collectedBy || "");
                                setFormData({
                                  ...formData,
                                  collectedBy: guestName,
                                  collectedById: "GUEST",
                                });
                              }}
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
                          )}
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
                          {/* Guest / Non-registered Payer option (Top when no search, bottom when searching) */}
                          {!memberSearchTerm && (
                            <div
                              onClick={() => {
                                const typedName = memberSearchTerm.trim();
                                const guestName = formData.paidByMemberId === "GUEST" ? formData.paidBy : (typedName || formData.paidBy || "");
                                setFormData({
                                  ...formData,
                                  paidBy: guestName,
                                  paidByMemberId: "GUEST",
                                });
                              }}
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
                          )}

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

                          {/* Guest / Non-registered Payer option (Bottom when searching) */}
                          {memberSearchTerm && (
                            <div
                              onClick={() => {
                                const typedName = memberSearchTerm.trim();
                                const guestName = formData.paidByMemberId === "GUEST" ? formData.paidBy : (typedName || formData.paidBy || "");
                                setFormData({
                                  ...formData,
                                  paidBy: guestName,
                                  paidByMemberId: "GUEST",
                                });
                              }}
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
                          )}
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
                      <div className="space-y-3">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Select Income Head
                        </label>
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
                      </div>
                    )}

                    {/* Step: Membership Tier (When Membership is selected) */}
                    {currentStepConfig.id === "membership_tier" && (
                      <div className="space-y-3">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Select Membership Tier
                        </label>
                        {[
                          { key: "Silver (1 year)", label: "Silver", tenure: "1 Year", sub: "1 Year membership subscription", icon: "🥈" },
                          { key: "Gold (12 years)", label: "Gold", tenure: "12 Years", sub: "12 Years long-term membership", icon: "🥇" },
                          { key: "Platinum (lifelong)", label: "Platinum", tenure: "Lifelong", sub: "Lifelong permanent membership", icon: "💎" },
                        ].map((tier) => (
                          <div
                            key={tier.key}
                            onClick={() => setFormData({ ...formData, membershipTier: tier.key, offeredAmount: tier.key.startsWith("Silver") ? 400 : tier.key.startsWith("Gold") ? 4000 : tier.key.startsWith("Platinum") ? 7000 : formData.offeredAmount })}
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
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Specify Income Category Detail
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
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Receivable and Received Amount
                        </label>

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Receivable Amount
                          </label>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-slate-500">₹</span>
                            <AmountInput
                              readOnly={formData.category === "membership"}
                              value={formData.offeredAmount}
                              onValueChange={(v) => setFormData({ ...formData, offeredAmount: v })}
                              className="w-full text-2xl font-bold font-display text-slate-900 bg-transparent focus:outline-hidden disabled:opacity-70"
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
                            Received Amount
                          </label>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-emerald-700">₹</span>
                            <AmountInput
                              value={formData.paidAmount}
                              onValueChange={(v) => setFormData({ ...formData, paidAmount: v })}
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
                      <div className="space-y-3">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Select Mode of Payment
                        </label>
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
                      </div>
                    )}

                    {/* Step: Remarks */}
                    {currentStepConfig.id === "remarks" && (
                      <div className="space-y-3">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Remarks / Notes
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


                    {/* Step: Voucher Number */}
                    {currentStepConfig.id === "voucher_number" && (
                      <div className="space-y-3">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Voucher Number *
                        </label>
                        <div className="flex items-stretch rounded-xl border border-slate-300 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-[#0F6E5D]">
                          <span className="px-3.5 flex items-center bg-slate-100 border-r border-slate-300 text-xs font-mono font-bold text-slate-600">
                            RV-
                          </span>
                          <input
                            type="text"
                            placeholder="e.g. 101"
                            value={formData.voucherNumber || ""}
                            onChange={(e) => setFormData({ ...formData, voucherNumber: e.target.value })}
                            className="flex-1 px-3.5 py-3 text-sm font-mono font-semibold bg-transparent focus:outline-none"
                          />
                        </div>
                      </div>
                    )}

                    {/* Step: Review & Save */}
                    {currentStepConfig.id === "review" && (
                      <div className="space-y-4">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Review and Save
                        </label>
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
                            <span className="font-mono font-bold text-slate-700">RV-{formData.voucherNumber}</span>
                          </div>
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
                          Select Payment Date
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
                            Today
                          </button>
                        </div>
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
                          {/* Guest / Custom Payer option (Top when no search, bottom when searching) */}
                          {!memberSearchTerm && (
                            <div
                              onClick={() => {
                                const typedName = memberSearchTerm.trim();
                                const guestName = formData.paidByMemberId === "GUEST" ? formData.paidBy : (typedName || formData.paidBy || "");
                                setFormData({
                                  ...formData,
                                  paidBy: guestName,
                                  paidByMemberId: "GUEST",
                                });
                              }}
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
                          )}

                          {/* Registered members in alphabetical order */}
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

                          {/* Guest / Custom Payer option (Bottom when searching) */}
                          {memberSearchTerm && (
                            <div
                              onClick={() => {
                                const typedName = memberSearchTerm.trim();
                                const guestName = formData.paidByMemberId === "GUEST" ? formData.paidBy : (typedName || formData.paidBy || "");
                                setFormData({
                                  ...formData,
                                  paidBy: guestName,
                                  paidByMemberId: "GUEST",
                                });
                              }}
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
                          )}
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
                      <div className="space-y-3">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Select Expense Head
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {expenseHeads.map((head) => (
                            <div
                              key={head.key}
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  category: head.key,
                                  paymentMode: head.key === "bank_expense" ? "Bank" : formData.paymentMode,
                                })
                              }
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
                      </div>
                    )}

                    {/* Step: Digital Media Type (When Digital Media is selected) */}
                    {currentStepConfig.id === "digital_media_type" && (
                      <div className="space-y-3">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Select Digital Media Type
                        </label>

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
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Select Charge Type
                        </label>

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
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Specify Expense Category Detail
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
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Payable and Paid Amount
                        </label>

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Payable Amount
                          </label>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-slate-500">₹</span>
                            <AmountInput
                              value={formData.payableAmount}
                              onValueChange={(v) => setFormData({ ...formData, payableAmount: v })}
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
                                className="px-3 py-1 bg-teal-100 text-teal-800 text-xs font-bold rounded-full hover:bg-teal-200 cursor-pointer"
                              >
                                ₹{v.toLocaleString()}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200">
                          <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider mb-1">
                            Paid Amount
                          </label>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-emerald-700">₹</span>
                            <AmountInput
                              value={formData.paidAmount}
                              onValueChange={(v) => setFormData({ ...formData, paidAmount: v })}
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

                          {formData.payableAmount > formData.paidAmount && formData.paidAmount > 0 && (
                            <div className="mt-2 text-xs text-emerald-800 font-semibold bg-emerald-100 p-2 rounded-lg flex items-center gap-1.5">
                              <AlertTriangle className="h-4 w-4 shrink-0 text-emerald-700" />
                              <span>
                                Outstanding balance of {formatINR(formData.payableAmount - formData.paidAmount)} will be tracked as payable.
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
                      <div className="space-y-3">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Select Mode of Payment
                        </label>

                        {formData.category === "bank_expense" ? (
                          <div className="p-5 rounded-2xl border-2 border-blue-500 bg-blue-50/60 text-center space-y-2">
                            <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-1">
                              <Lock className="h-6 w-6" />
                            </div>
                            <h4 className="font-bold text-base text-blue-900">Bank Transfer (Locked)</h4>
                            <p className="text-xs text-blue-700 font-medium">Bank charges are strictly processed via direct bank debit / transfer.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div
                              onClick={() => setFormData({ ...formData, paymentMode: "Cash" })}
                              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer text-center space-y-2 ${
                                formData.paymentMode === "Cash"
                                  ? "border-amber-600 bg-amber-50 ring-2 ring-amber-500/20"
                                  : "border-slate-200 hover:border-slate-300 bg-white"
                              }`}
                            >
                              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
                                <Wallet className="h-5 w-5" />
                              </div>
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
                              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center mx-auto">
                                <Landmark className="h-5 w-5" />
                              </div>
                              <h4 className="font-bold text-base text-slate-900">Bank Transfer / Cheque</h4>
                              <p className="text-xs text-slate-500">Paid directly from bank account via cheque, NEFT, or UPI.</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Step: Remarks */}
                    {currentStepConfig.id === "remarks" && (
                      <div className="space-y-3">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Remarks / Notes
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


                    {/* Step: Voucher Number */}
                    {currentStepConfig.id === "voucher_number" && (
                      <div className="space-y-3">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Voucher Number *
                        </label>
                        <div className="flex items-stretch rounded-xl border border-slate-300 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-amber-500">
                          <span className="px-3.5 flex items-center bg-slate-100 border-r border-slate-300 text-xs font-mono font-bold text-slate-600">
                            PV-
                          </span>
                          <input
                            type="text"
                            placeholder="e.g. 101"
                            value={formData.voucherNumber || ""}
                            onChange={(e) => setFormData({ ...formData, voucherNumber: e.target.value })}
                            className="flex-1 px-3.5 py-3 text-sm font-mono font-semibold bg-transparent focus:outline-none"
                          />
                        </div>
                      </div>
                    )}

                    {/* Step: Review & Save Expense */}
                    {currentStepConfig.id === "review" && (
                      <div className="space-y-4">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Review and Save
                        </label>
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
                            <span className="font-mono font-bold text-slate-700">PV-{formData.voucherNumber}</span>
                          </div>
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
                      </div>
                    )}

                    {/* Paid To Chapter */}
                    {currentStepConfig.id === "paid_to" && (
                      <div className="space-y-3">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Paid To (Chapter)
                        </label>
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

                    {/* Mode of Payment */}
                    {currentStepConfig.id === "payment_mode" && (
                      <div className="space-y-3">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Select Mode of Payment *
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { mode: "Cash", icon: "💵", label: "Cash", sub: "Hand physical cash" },
                            { mode: "Bank", icon: "🏦", label: "Bank Transfer", sub: "NEFT / RTGS / Cheque" },
                          ].map((item) => (
                            <button
                              key={item.mode}
                              type="button"
                              onClick={() => setFormData({ ...formData, paymentMode: item.mode })}
                              className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                                formData.paymentMode === item.mode
                                  ? "border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-500/20"
                                  : "border-slate-200 hover:border-indigo-300 bg-white"
                              }`}
                            >
                              <div className="text-2xl mb-1">{item.icon}</div>
                              <div className="font-bold text-xs text-slate-900">{item.label}</div>
                              <div className="text-[10px] text-slate-500">{item.sub}</div>
                            </button>
                          ))}
                        </div>
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
                            <AmountInput
                              value={formData.loanAmount}
                              onValueChange={(v) => setFormData({ ...formData, loanAmount: v })}
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
                      </div>
                    )}

                    {/* Remarks */}
                    {currentStepConfig.id === "remarks" && (
                      <div className="space-y-3">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Remarks / Notes
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


                    {/* Step: Voucher Number */}
                    {currentStepConfig.id === "voucher_number" && (
                      <div className="space-y-3">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Voucher Number *
                        </label>
                        <div className="flex items-stretch rounded-xl border border-slate-300 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500">
                          <span className="px-3.5 flex items-center bg-slate-100 border-r border-slate-300 text-xs font-mono font-bold text-slate-600">
                            LV-
                          </span>
                          <input
                            type="text"
                            placeholder="e.g. 101"
                            value={formData.voucherNumber || ""}
                            onChange={(e) => setFormData({ ...formData, voucherNumber: e.target.value })}
                            className="flex-1 px-3.5 py-3 text-sm font-mono font-semibold bg-transparent focus:outline-none"
                          />
                        </div>
                      </div>
                    )}

                    {/* Review */}
                    {currentStepConfig.id === "review" && (
                      <div className="space-y-4">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Review and Save
                        </label>
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
                            <span className="text-slate-500 font-semibold">Payment Mode:</span>
                            <span className="font-bold text-slate-900">{formData.paymentMode || "Cash"}</span>
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
                            <span className="font-mono font-bold text-slate-700">LV-{formData.voucherNumber}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* ---------------- MEMBER WIZARD STEPS ---------------- */}
                {activeWizard === "member" && (
                  <>
                    {/* Step 1: Doctor Name & Demographics */}
                    {currentStepConfig.id === "member_basic" && (
                      <div className="space-y-5">
                        <div>
                          <label className="block text-xs font-bold text-slate-800 mb-1.5 uppercase tracking-wider">
                            Full Name *
                          </label>
                          <div className="flex items-stretch rounded-xl border border-slate-300 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-teal-500 shadow-2xs">
                            <span className="px-3.5 flex items-center bg-slate-100 border-r border-slate-300 text-xs font-mono font-bold text-slate-600">
                              Dr.
                            </span>
                            <input
                              type="text"
                              placeholder="Suresh Nair"
                              value={formData.memberName || ""}
                              onChange={(e) => setFormData({ ...formData, memberName: e.target.value })}
                              className="flex-1 px-3.5 py-3 text-sm font-semibold text-slate-900 bg-transparent focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* Gender Selection */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                            Gender *
                          </label>
                          <div className="grid grid-cols-3 gap-2.5">
                            {[
                              { key: "Male", label: "👨 Male" },
                              { key: "Female", label: "👩 Female" },
                              { key: "Other", label: "👤 Other" },
                            ].map((g) => (
                              <button
                                key={g.key}
                                type="button"
                                onClick={() => setFormData({ ...formData, gender: g.key })}
                                className={`py-3 px-3 rounded-xl border-2 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                  formData.gender === g.key
                                    ? "bg-teal-700 text-white border-teal-700 shadow-xs"
                                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                                }`}
                              >
                                {g.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Blood Group Selection */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                            Blood Group *
                          </label>
                          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                            {["O+", "A+", "B+", "AB+", "O-", "A-", "B-", "AB-"].map((bg) => (
                              <button
                                key={bg}
                                type="button"
                                onClick={() => setFormData({ ...formData, bloodGroup: bg })}
                                className={`py-2 px-2 rounded-lg border font-bold text-xs transition-all cursor-pointer ${
                                  formData.bloodGroup === bg
                                    ? "bg-rose-700 text-white border-rose-700 shadow-2xs"
                                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                                }`}
                              >
                                {bg}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Date of Birth */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                            Date of Birth *
                          </label>
                          <input
                            type="date"
                            value={formData.dob || ""}
                            onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                            className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-xs bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-medium"
                          />
                        </div>
                      </div>
                    )}

                    {/* Step 2: Academic Qualifications Builder */}
                    {currentStepConfig.id === "member_qualifications" && (
                      <div className="space-y-5">
                        {/* Qualification Add Form FIRST */}
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                            <span>+ Add New Qualification Entry</span>
                            <span className="text-[11px] font-normal text-slate-500 font-sans">Fill details & click Add</span>
                          </h4>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                Degree / Qualification *
                              </label>
                              <select
                                value={formData.tempDegree || ""}
                                onChange={(e) => setFormData({ ...formData, tempDegree: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-semibold text-slate-800"
                              >
                                <option value="">-- Select Degree / Qualification --</option>
                                {DEGREE_OPTIONS.map((d) => (
                                  <option key={d} value={d}>
                                    {d}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                Specialization / Field of Study
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. Homoeopathic Materia Medica"
                                value={formData.tempDegreeTitle || ""}
                                onChange={(e) => setFormData({ ...formData, tempDegreeTitle: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                College / Institution Name
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. Govt. Homoeopathic Medical College"
                                value={formData.tempInstitution || ""}
                                onChange={(e) => setFormData({ ...formData, tempInstitution: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                University Name
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. KUHS / MG University"
                                value={formData.tempUniversity || ""}
                                onChange={(e) => setFormData({ ...formData, tempUniversity: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                Year of Passing
                              </label>
                              <select
                                value={formData.tempYearOfPassing || ""}
                                onChange={(e) => setFormData({ ...formData, tempYearOfPassing: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-mono"
                              >
                                <option value="">-- Select Year --</option>
                                {YEAR_OF_PASSING_OPTIONS.map((year) => (
                                  <option key={year} value={year}>
                                    {year}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                Medical Council
                              </label>
                              <select
                                value={formData.tempMedicalCouncilName || ""}
                                onChange={(e) => setFormData({ ...formData, tempMedicalCouncilName: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                              >
                                <option value="">-- Select Council --</option>
                                {MEDICAL_COUNCIL_OPTIONS.map((mc) => <option key={mc} value={mc}>{mc}</option>)}
                              </select>
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                Council State
                              </label>
                              <select
                                value={formData.tempMedicalCouncilState || ""}
                                onChange={(e) => setFormData({ ...formData, tempMedicalCouncilState: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                              >
                                <option value="">-- Select State --</option>
                                {INDIAN_STATES.map((state) => <option key={state} value={state}>{state}</option>)}
                              </select>
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                Council Registration #
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. TCMC/HOM/1234"
                                value={formData.tempRegistrationNumber || ""}
                                onChange={(e) => setFormData({ ...formData, tempRegistrationNumber: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-mono"
                              />
                            </div>
                          </div>

                          {(!formData.qualificationsList || formData.qualificationsList.length === 0) ? (
                            <button
                              type="button"
                              onClick={() => {
                                if (!formData.tempDegree) return;
                                const newQual: MemberQualification = {
                                  degree: formData.tempDegree,
                                  degreeTitle: formData.tempDegreeTitle?.trim() || undefined,
                                  institution: formData.tempInstitution?.trim() || undefined,
                                  university: formData.tempUniversity?.trim() || undefined,
                                  yearOfPassing: formData.tempYearOfPassing?.trim() || undefined,
                                  medicalCouncilName: formData.tempMedicalCouncilName || undefined,
                                  medicalCouncilState: formData.tempMedicalCouncilState || undefined,
                                  registrationNumber: formData.tempRegistrationNumber?.trim() || undefined,
                                };
                                const currentList = formData.qualificationsList || [];
                                setFormData({
                                  ...formData,
                                  qualificationsList: [...currentList, newQual],
                                  tempDegree: "",
                                  tempDegreeTitle: "",
                                  tempInstitution: "",
                                  tempUniversity: "",
                                  tempYearOfPassing: "",
                                  tempMedicalCouncilName: "",
                                  tempMedicalCouncilState: "",
                                  tempRegistrationNumber: "",
                                });
                              }}
                              disabled={!formData.tempDegree}
                              className="w-full py-2.5 bg-[#0F6E5D] text-white font-bold text-xs rounded-lg shadow-2xs hover:bg-[#0B5548] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center justify-center gap-2 mt-2"
                            >
                              <Plus className="h-4 w-4" />
                              <span>Add More Qualifications</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                if (!formData.tempDegree) return;
                                const newQual: MemberQualification = {
                                  degree: formData.tempDegree,
                                  degreeTitle: formData.tempDegreeTitle?.trim() || undefined,
                                  institution: formData.tempInstitution?.trim() || undefined,
                                  university: formData.tempUniversity?.trim() || undefined,
                                  yearOfPassing: formData.tempYearOfPassing?.trim() || undefined,
                                  medicalCouncilName: formData.tempMedicalCouncilName || undefined,
                                  medicalCouncilState: formData.tempMedicalCouncilState || undefined,
                                  registrationNumber: formData.tempRegistrationNumber?.trim() || undefined,
                                };
                                const currentList = formData.qualificationsList || [];
                                setFormData({
                                  ...formData,
                                  qualificationsList: [...currentList, newQual],
                                  tempDegree: "",
                                  tempDegreeTitle: "",
                                  tempInstitution: "",
                                  tempUniversity: "",
                                  tempYearOfPassing: "",
                                  tempMedicalCouncilName: "",
                                  tempMedicalCouncilState: "",
                                  tempRegistrationNumber: "",
                                });
                              }}
                              disabled={!formData.tempDegree}
                              className="w-full py-2.5 bg-[#0F6E5D] text-white font-bold text-xs rounded-lg shadow-2xs hover:bg-[#0B5548] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center justify-center gap-2 mt-2"
                            >
                              <Plus className="h-4 w-4" />
                              <span>Add This Qualification to Profile</span>
                            </button>
                          )}
                        </div>

                        {/* Added Qualifications List DOWN BELOW */}
                        <div>
                          <label className="block text-xs font-bold text-slate-800 mb-2 uppercase tracking-wider flex items-center justify-between">
                            <span>Qualifications Added So Far ({(formData.qualificationsList || []).length})</span>
                          </label>

                          {(!formData.qualificationsList || formData.qualificationsList.length === 0) ? (
                            <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center">
                              <p className="text-xs text-slate-500 font-medium">No qualification entries added yet.</p>
                              <p className="text-[11px] text-slate-400 mt-0.5">Fill out the form above and tap "+ Add Qualification To Profile".</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {formData.qualificationsList.map((q: any, idx: number) => (
                                <div
                                  key={idx}
                                  className="p-3 bg-white border border-teal-200 rounded-xl shadow-2xs flex items-start justify-between gap-3"
                                >
                                  <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                      <span className="bg-teal-700 text-white text-xs font-bold px-2 py-0.5 rounded-md">
                                        {q.degree}
                                      </span>
                                      {q.degreeTitle && (
                                        <span className="text-xs font-bold text-slate-800">in {q.degreeTitle}</span>
                                      )}
                                      {q.yearOfPassing && (
                                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono font-semibold">
                                          Passed: {q.yearOfPassing}
                                        </span>
                                      )}
                                    </div>

                                    {(q.institution || q.university) && (
                                      <p className="text-xs text-slate-600 font-medium">
                                        {[q.institution, q.university].filter(Boolean).join(" • ")}
                                      </p>
                                    )}

                                    {q.registrationNumber && (
                                      <p className="text-[11px] text-teal-800 font-mono">
                                        {q.medicalCouncilName && `${q.medicalCouncilName}${q.medicalCouncilState ? ` (${q.medicalCouncilState})` : ""} • `}Reg #: {q.registrationNumber}
                                      </p>
                                    )}
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      const nextList = formData.qualificationsList.filter((_: any, i: number) => i !== idx);
                                      setFormData({ ...formData, qualificationsList: nextList });
                                    }}
                                    className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                                    title="Remove Qualification"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Clinical Specialty & Address */}
                    {currentStepConfig.id === "member_practice" && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                            Clinical Specialization
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. General Clinical Homoeopathy, Paediatric Care"
                            value={formData.specialization || ""}
                            onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs bg-white font-medium text-slate-900"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                            Practice Start Year
                          </label>
                          <input
                            type="number"
                            placeholder="e.g. 2012"
                            value={formData.yearsOfPractice || ""}
                            onChange={(e) => setFormData({ ...formData, yearsOfPractice: e.target.value })}
                            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs bg-white font-medium text-slate-900"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                            Clinic / Hospital Address
                          </label>
                          <textarea
                            rows={2}
                            placeholder="e.g. Suite #204, Doctor's Plaza, MG Road, Cochin"
                            value={formData.clinicAddress || ""}
                            onChange={(e) => setFormData({ ...formData, clinicAddress: e.target.value })}
                            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs bg-white font-medium text-slate-900"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                            Residential Address
                          </label>
                          <textarea
                            rows={2}
                            placeholder="e.g. House #14, Green Valley Enclave, Aluva"
                            value={formData.residentialAddress || ""}
                            onChange={(e) => setFormData({ ...formData, residentialAddress: e.target.value })}
                            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs bg-white font-medium text-slate-900"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                            IHMA Role
                          </label>
                          <select
                            value={formData.associationRole || ""}
                            onChange={(e) => setFormData({ ...formData, associationRole: e.target.value })}
                            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs bg-white font-medium text-slate-900"
                          >
                            <option value="">Select role</option>
                            <option value="President">President</option>
                            <option value="Vice President">Vice President</option>
                            <option value="Secretary">Secretary</option>
                            <option value="General Secretary">General Secretary</option>
                            <option value="Treasurer">Treasurer</option>
                            <option value="Member">Member</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* Step 5: Contact Information */}
                    {currentStepConfig.id === "member_contact" && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-800 mb-1 uppercase tracking-wider">
                            Mobile Phone Number (10 digits) *
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={10}
                            placeholder="9876543210"
                            value={formData.mobileNumber || ""}
                            onChange={(e) => {
                              const cleaned = e.target.value.replace(/\D/g, "").slice(0, 10);
                              setFormData({ ...formData, mobileNumber: cleaned });
                            }}
                            className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-xs bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-bold text-slate-900"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                              WhatsApp Number
                            </label>
                            {formData.mobileNumber && (
                              <button
                                type="button"
                                onClick={() => setFormData({ ...formData, whatsappNumber: formData.mobileNumber })}
                                className="text-[11px] text-teal-700 font-bold hover:underline cursor-pointer"
                              >
                                Copy Mobile Number
                              </button>
                            )}
                          </div>
                          <input
                            type="text"
                            placeholder="+91 9876543210"
                            value={formData.whatsappNumber || ""}
                            onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                            className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-xs bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-bold text-slate-900"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                            Email Address
                          </label>
                          <input
                            type="email"
                            placeholder="doctor@example.com"
                            value={formData.email || ""}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-xs bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                            Office / Clinic Contact Number
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. 0484 2345678"
                            value={formData.clinicNumber || ""}
                            onChange={(e) => setFormData({ ...formData, clinicNumber: e.target.value })}
                            className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-xs bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-medium"
                          />
                        </div>
                      </div>
                    )}

                    {/* Step 6: Final Review & Confirm Doctor Profile */}
                    {currentStepConfig.id === "review" && (
                      <div className="space-y-4">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3.5 text-xs">
                          <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center justify-between">
                            <span>Doctor Profile Audit & Verification</span>
                            <span className="text-[10px] text-teal-800 bg-teal-50 px-2 py-0.5 rounded font-mono font-bold">Ready to Register</span>
                          </h4>

                          {/* 1. Identity & Demographics */}
                          <div className="space-y-1.5">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Identity & Demographics</div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white p-2.5 rounded-lg border border-slate-200">
                              <div>
                                <span className="text-slate-500 text-[11px] block">Full Name:</span>
                                <span className="font-bold text-slate-900 text-sm">{formData.memberName || "Dr. Unnamed"}</span>
                              </div>
                              <div>
                                <span className="text-slate-500 text-[11px] block">Gender:</span>
                                <span className="font-semibold text-slate-800">{formData.gender || "Not Specified"}</span>
                              </div>
                              <div>
                                <span className="text-slate-500 text-[11px] block">Blood Group:</span>
                                <span className="font-semibold text-rose-700">{formData.bloodGroup || "Not Specified"}</span>
                              </div>
                              <div>
                                <span className="text-slate-500 text-[11px] block">Date of Birth:</span>
                                <span className="font-semibold text-slate-800">{formData.dob || "Not Specified"}</span>
                              </div>
                            </div>
                          </div>

                          {/* 2. Academic Degrees & Qualifications */}
                          <div className="space-y-1.5">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Academic Qualifications</div>
                            <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1.5">
                              {formData.qualificationsList && formData.qualificationsList.length > 0 ? (
                                formData.qualificationsList.map((q: any, i: number) => (
                                  <div key={i} className="text-xs border-b border-slate-100 last:border-0 pb-1.5 last:pb-0">
                                    <span className="font-bold text-teal-800">{q.degree}</span>
                                    {q.degreeTitle && <span className="font-medium text-slate-800"> in {q.degreeTitle}</span>}
                                    {(q.institution || q.university) && (
                                      <span className="text-slate-600 block text-[11px]">
                                        {[q.institution, q.university].filter(Boolean).join(", ")}
                                        {q.yearOfPassing ? ` (${q.yearOfPassing})` : ""}
                                      </span>
                                    )}
                                  </div>
                                ))
                              ) : (
                                <span className="font-semibold text-teal-800">
                                  {formData.qualification || "BHMS"}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* 3. Medical Council Details */}
                          <div className="space-y-1.5">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Medical Council Registration</div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white p-2.5 rounded-lg border border-slate-200">
                              <div>
                                <span className="text-slate-500 text-[11px] block">Council Name & State:</span>
                                <span className="font-semibold text-slate-800">
                                  {formData.tempMedicalCouncilName || "Medical Council"} ({formData.tempMedicalCouncilState || "Kerala"})
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-500 text-[11px] block">Primary Registration #:</span>
                                <span className="font-mono font-bold text-teal-900">{formData.tempRegistrationNumber || "Not Provided"}</span>
                              </div>
                            </div>
                          </div>

                          {/* 4. Clinical Specialty & Practice */}
                          <div className="space-y-1.5">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Clinical Practice & Addresses</div>
                            <div className="space-y-2 bg-white p-2.5 rounded-lg border border-slate-200">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div>
                                  <span className="text-slate-500 text-[11px] block">Specialization:</span>
                                  <span className="font-semibold text-slate-800">{formData.specialization || "General Practice"}</span>
                                </div>
                                <div>
                                  <span className="text-slate-500 text-[11px] block">Practice Experience:</span>
                                  <span className="font-semibold text-slate-800">{formData.yearsOfPractice || "Not Specified"}</span>
                                </div>
                              </div>
                              {formData.clinicAddress && (
                                <div>
                                  <span className="text-slate-500 text-[11px] block">Clinic / Hospital Address:</span>
                                  <span className="font-medium text-slate-800">{formData.clinicAddress}</span>
                                </div>
                              )}
                              {formData.residentialAddress && (
                                <div>
                                  <span className="text-slate-500 text-[11px] block">Residential Address:</span>
                                  <span className="font-medium text-slate-800">{formData.residentialAddress}</span>
                                </div>
                              )}
                              {formData.associationRole && (
                                <div>
                                  <span className="text-slate-500 text-[11px] block">IHMA Association Role:</span>
                                  <span className="font-semibold text-amber-900">{formData.associationRole}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* 5. Contact Information */}
                          <div className="space-y-1.5">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Contact Information</div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white p-2.5 rounded-lg border border-slate-200">
                              <div>
                                <span className="text-slate-500 text-[11px] block">Mobile Phone #:</span>
                                <span className="font-mono font-bold text-slate-900">{formData.mobileNumber || "Not Provided"}</span>
                              </div>
                              <div>
                                <span className="text-slate-500 text-[11px] block">WhatsApp #:</span>
                                <span className="font-mono font-semibold text-slate-800">{formData.whatsappNumber || "Same as Mobile"}</span>
                              </div>
                              {formData.email && (
                                <div>
                                  <span className="text-slate-500 text-[11px] block">Email Address:</span>
                                  <span className="font-medium text-slate-800">{formData.email}</span>
                                </div>
                              )}
                              {formData.clinicNumber && (
                                <div>
                                  <span className="text-slate-500 text-[11px] block">Clinic Landline #:</span>
                                  <span className="font-mono text-slate-800">{formData.clinicNumber}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="bg-teal-50 p-3 rounded-lg border border-teal-200 text-xs text-teal-900 flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-700" />
                          <span>Member profile will be registered under <strong>{formData.chapterName || defaultChapterName}</strong>.</span>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* ---------------- ASSET WIZARD STEPS ---------------- */}
                {activeWizard === "asset" && (
                  <>
                    {/* Step 2: Asset Name */}
                    {currentStepConfig.id === "asset_name" && (
                      <div className="space-y-3">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Asset Name *
                        </label>
                        <input
                          type="text"
                          autoFocus
                          placeholder="e.g. Projector, Office Chair, Laptop"
                          value={formData.assetName || ""}
                          onChange={(e) => setFormData({ ...formData, assetName: e.target.value })}
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm font-semibold bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                        />
                      </div>
                    )}

                    {/* Step 3: Purchase Date */}
                    {currentStepConfig.id === "asset_purchase_date" && (
                      <div className="space-y-4">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Asset Purchase Date *
                        </label>
                        <input
                          type="date"
                          max={new Date().toISOString().slice(0, 10)}
                          value={formData.purchaseDate || ""}
                          onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm font-semibold bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                        />
                      </div>
                    )}

                    {/* Step 4: Number of Items */}
                    {currentStepConfig.id === "asset_quantity" && (
                      <div className="space-y-3">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Number of Items *
                        </label>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          autoFocus
                          value={formData.quantity || ""}
                          onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                          className="w-full text-2xl font-bold px-4 py-3 border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                          placeholder="1"
                        />
                      </div>
                    )}

                    {/* Step 5: Asset Value (per item) */}
                    {currentStepConfig.id === "asset_value" && (
                      <div className="space-y-4">
                        <div className="space-y-3">
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Asset Value — Price Per Item (₹) *
                          </label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400 pointer-events-none">
                              ₹
                            </span>
                            <AmountInput
                              autoFocus
                              value={formData.assetValue}
                              onValueChange={(v) => setFormData({ ...formData, assetValue: v })}
                              className="w-full text-2xl font-bold pl-10 pr-4 py-3 border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                              placeholder="0"
                            />
                          </div>
                        </div>

                        {/* Auto-calculated total */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                          <div className="flex justify-between py-1.5 border-b border-slate-200">
                            <span className="text-slate-500 font-semibold">Price Per Item:</span>
                            <span className="font-bold text-slate-900">{formatINR(formData.assetValue)}</span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-slate-200">
                            <span className="text-slate-500 font-semibold">Number of Items:</span>
                            <span className="font-bold text-slate-900">{Number(formData.quantity) || 0}</span>
                          </div>
                          <div className="flex justify-between py-1.5">
                            <span className="text-slate-500 font-semibold">
                              Total Value
                              <span className="text-[10px] text-slate-400 font-medium block">Auto-calculated</span>
                            </span>
                            <span className="font-black text-sky-800 text-sm">{formatINR(totalValueOf(formData))}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 6: Mode of Payment */}
                    {currentStepConfig.id === "asset_payment_mode" && (
                      <div className="space-y-3">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Select Mode of Payment
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div
                            onClick={() => setFormData({ ...formData, paymentMode: "Cash" })}
                            className={`p-5 rounded-2xl border-2 cursor-pointer text-center transition-all ${
                              formData.paymentMode === "Cash"
                                ? "border-sky-600 bg-sky-50"
                                : "border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            <div className="text-3xl">💵</div>
                            <h4 className="font-bold text-sm mt-1">Cash</h4>
                            <p className="text-xs text-slate-500">Paid from chapter cash in hand.</p>
                          </div>

                          <div
                            onClick={() => setFormData({ ...formData, paymentMode: "Bank" })}
                            className={`p-5 rounded-2xl border-2 cursor-pointer text-center transition-all ${
                              formData.paymentMode === "Bank"
                                ? "border-sky-600 bg-sky-50"
                                : "border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            <div className="text-3xl">🏦</div>
                            <h4 className="font-bold text-sm mt-1">Bank</h4>
                            <p className="text-xs text-slate-500">Paid by cheque, transfer or UPI.</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 7: Remarks */}
                    {currentStepConfig.id === "asset_remarks" && (
                      <div className="space-y-3">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Remarks / Notes
                        </label>
                        <textarea
                          rows={3}
                          placeholder="Optional notes or remarks regarding this asset..."
                          value={formData.remarks || ""}
                          onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl text-xs bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                        />
                      </div>
                    )}

                    {/* Step 8: Category */}
                    {currentStepConfig.id === "asset_category" && (
                      <div className="space-y-3">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Asset Category *
                        </label>
                        <select
                          value={formData.category || ""}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm font-semibold bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500 cursor-pointer"
                        >
                          <option value="" disabled>
                            Select asset category...
                          </option>
                          {ASSET_CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Step 9: Asset Life */}
                    {currentStepConfig.id === "asset_life" && (
                      <div className="space-y-3">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Asset Life (Years) *
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          autoFocus
                          value={formData.assetLife || ""}
                          onChange={(e) => setFormData({ ...formData, assetLife: Number(e.target.value) })}
                          className="w-full text-2xl font-bold px-4 py-3 border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                          placeholder="0"
                        />
                      </div>
                    )}

                    {/* Step 10: Custodian */}
                    {currentStepConfig.id === "asset_custodian" && (
                      <div className="space-y-3">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Custodian Name *
                        </label>

                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Search IHMA doctor member name or member ID..."
                            value={memberSearchTerm}
                            onChange={(e) => setMemberSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
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
                                  custodianName: m.memberName,
                                  custodianMemberId: m.memberId,
                                })
                              }
                              className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                                formData.custodianMemberId === m.memberId
                                  ? "border-sky-600 bg-sky-50"
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
                                  formData.custodianMemberId === m.memberId
                                    ? "border-sky-600 bg-sky-600 text-white"
                                    : "border-slate-300 bg-white"
                                }`}
                              >
                                {formData.custodianMemberId === m.memberId && <Check className="h-3 w-3" />}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Step 11: Depreciation Summary (fully auto-calculated) */}
                    {currentStepConfig.id === "asset_depreciation" && (
                      <div className="space-y-4">
                        <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 text-xs text-sky-900 flex items-start gap-2">
                          <ShieldCheck className="h-4 w-4 shrink-0 text-sky-700 mt-0.5" />
                          <span>
                            Straight-line depreciation: the total value is written off evenly across the
                            asset's life, so nothing needs to be typed here.
                          </span>
                        </div>

                      </div>
                    )}

                    {/* Step 12: Review & Save */}
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
                            <span className="text-slate-500 font-semibold">Asset Number:</span>
                            <span className="font-mono font-bold text-amber-800">{formData.assetNumber}</span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-slate-200">
                            <span className="text-slate-500 font-semibold">Asset Name:</span>
                            <span className="font-bold text-slate-900">{formData.assetName}</span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-slate-200">
                            <span className="text-slate-500 font-semibold">Purchase Date:</span>
                            <span className="font-bold text-slate-900">
                              {formData.purchaseDate ? formatDateDMY(formData.purchaseDate) : "—"}
                            </span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-slate-200">
                            <span className="text-slate-500 font-semibold">No. of Items:</span>
                            <span className="font-bold text-slate-900">{Number(formData.quantity) || 0}</span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-slate-200">
                            <span className="text-slate-500 font-semibold">Price Per Item:</span>
                            <span className="font-bold text-slate-900">{formatINR(formData.assetValue)}</span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-slate-200">
                            <span className="text-slate-500 font-semibold">Total Value:</span>
                            <span className="font-bold text-slate-900">{formatINR(totalValueOf(formData))}</span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-slate-200">
                            <span className="text-slate-500 font-semibold">Mode of Payment:</span>
                            <span className="font-bold text-slate-900">{formData.paymentMode}</span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-slate-200">
                            <span className="text-slate-500 font-semibold">Category:</span>
                            <span className="font-bold text-blue-700">{formData.category}</span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-slate-200">
                            <span className="text-slate-500 font-semibold">Asset Life:</span>
                            <span className="font-bold text-slate-900">{formData.assetLife} Years</span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-slate-200">
                            <span className="text-slate-500 font-semibold">Custodian:</span>
                            <span className="font-bold text-slate-900">{formData.custodianName}</span>
                          </div>
                          {formData.remarks && (
                            <div className="flex justify-between py-1.5 border-b border-slate-200">
                              <span className="text-slate-500 font-semibold">Remarks:</span>
                              <span className="font-medium text-slate-800 italic">{formData.remarks}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* ---------------- FD WIZARD STEPS ---------------- */}
                {activeWizard === "bank_balance" && (
                  <>
                    {/* Step 1: Date */}
                    {currentStepConfig.id === "fd_date" && (
                      <div className="space-y-4">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Date *
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="date"
                            max={new Date().toISOString().slice(0, 10)}
                            value={formData.date || new Date().toISOString().slice(0, 10)}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            className="flex-1 px-4 py-3 border border-slate-300 rounded-xl text-sm font-semibold bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                          />
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, date: new Date().toISOString().slice(0, 10) })}
                            className="px-4 py-3 bg-purple-50 text-purple-800 text-xs font-bold rounded-xl border border-purple-200 hover:bg-purple-100 cursor-pointer"
                          >
                            Today
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Step 2: Amount Type — FD or Bank Interest */}
                    {currentStepConfig.id === "fd_amount_type" && (
                      <div className="space-y-3">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Amount Type *
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div
                            onClick={() => setFormData({ ...formData, amountType: "FD" })}
                            className={`p-5 rounded-2xl border-2 cursor-pointer text-center transition-all ${
                              formData.amountType === "FD"
                                ? "border-purple-600 bg-purple-50"
                                : "border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            <div className="text-3xl">📜</div>
                            <h4 className="font-bold text-sm mt-1">FD</h4>
                            <p className="text-xs text-slate-500">New fixed deposit opened with the bank.</p>
                          </div>

                          <div
                            onClick={() => setFormData({ ...formData, amountType: "Bank Interest" })}
                            className={`p-5 rounded-2xl border-2 cursor-pointer text-center transition-all ${
                              formData.amountType === "Bank Interest"
                                ? "border-purple-600 bg-purple-50"
                                : "border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            <div className="text-3xl">🏦</div>
                            <h4 className="font-bold text-sm mt-1">Bank Interest</h4>
                            <p className="text-xs text-slate-500">Interest credited by the bank, entered as received.</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 3: FD Amount */}
                    {currentStepConfig.id === "balance_amount" && (
                      <div className="space-y-3">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          FD Amount (₹) *
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400 pointer-events-none">
                            ₹
                          </span>
                          <AmountInput
                            autoFocus
                            value={formData.amount}
                            onValueChange={(v) => setFormData({ ...formData, amount: v })}
                            className="w-full text-2xl font-bold pl-10 pr-4 py-3 border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    )}

                    {/* Bank Interest: exact amount received */}
                    {currentStepConfig.id === "fd_interest_amount" && (
                      <div className="space-y-3">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Interest Amount (₹) *
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400 pointer-events-none">
                            ₹
                          </span>
                          <AmountInput
                            autoFocus
                            value={formData.interestAmount}
                            onValueChange={(v) => setFormData({ ...formData, interestAmount: v })}
                            className="w-full text-2xl font-bold pl-10 pr-4 py-3 border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    )}

                    {/* Remarks */}
                    {currentStepConfig.id === "fd_remarks" && (
                      <div className="space-y-3">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Remarks / Notes
                        </label>
                        <textarea
                          rows={3}
                          placeholder={
                            formData.amountType === "Bank Interest"
                              ? "Optional notes, e.g. quarterly savings interest for Q1..."
                              : "Optional notes or remarks regarding this deposit..."
                          }
                          value={formData.remarks || ""}
                          onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl text-xs bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    )}

                    {/* FD Term & Maturity Date */}
                    {currentStepConfig.id === "fd_term" && (
                      <div className="space-y-4">
                        <div className="space-y-3">
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                            FD Term (Years) *
                          </label>
                          <select
                            value={formData.fdTermYears || ""}
                            onChange={(e) => {
                              const years = Number(e.target.value);
                              const base = formData.date ? new Date(formData.date) : new Date();
                              base.setFullYear(base.getFullYear() + years);
                              const maturityDate = base.toISOString().slice(0, 10);
                              setFormData({ ...formData, fdTermYears: years, maturityDate });
                            }}
                            className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm font-semibold bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500 cursor-pointer"
                          >
                            <option value="" disabled>
                              Select FD term...
                            </option>
                            {Array.from({ length: 25 }, (_, i) => i + 1).map((y) => (
                              <option key={y} value={y}>
                                {y} {y === 1 ? "Year" : "Years"}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                            FD Maturity Date
                          </label>
                          <div className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold bg-slate-50 text-slate-700">
                            {formData.maturityDate ? formatDateDMY(formData.maturityDate) : "Select FD term to compute"}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Bank Details */}
                    {currentStepConfig.id === "fd_bank_details" && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Bank Account Number</label>
                            <input type="text" inputMode="numeric" autoFocus placeholder="FD / linked account number" value={formData.bankAccountNumber || ""} onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })} className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500" />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Bank Name *</label>
                            <input type="text" placeholder="e.g. State Bank of India" value={formData.bankName || ""} onChange={(e) => setFormData({ ...formData, bankName: e.target.value })} className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm font-semibold bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500" />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Bank Branch</label>
                            <input type="text" placeholder="Branch name" value={formData.bankBranch || ""} onChange={(e) => setFormData({ ...formData, bankBranch: e.target.value })} className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500" />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Bank Contact Number</label>
                            <input type="tel" placeholder="Phone number" value={formData.bankContactNumber || ""} onChange={(e) => setFormData({ ...formData, bankContactNumber: e.target.value })} className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500" />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Bank Branch Address</label>
                            <textarea rows={2} placeholder="Branch address" value={formData.bankAddress || ""} onChange={(e) => setFormData({ ...formData, bankAddress: e.target.value })} className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500" />
                          </div>
                          <div className="sm:col-span-2 space-y-2">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Deposited By</label>
                            <select
                              value={formData.depositedByMemberId || ""}
                              onChange={(e) => {
                                const memberId = e.target.value;
                                const m = membersList.find((mm) => mm.memberId === memberId);
                                setFormData({ ...formData, depositedByMemberId: memberId, depositedBy: m?.memberName || "" });
                              }}
                              className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500 cursor-pointer"
                            >
                              <option value="" disabled>
                                Select member...
                              </option>
                              {membersList.map((m) => (
                                <option key={m.memberId} value={m.memberId}>
                                  {m.memberName} ({m.memberId})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Review & Save */}
                    {currentStepConfig.id === "review" && (
                      <div className="space-y-4">
                        {formData.amountType === "Bank Interest" ? (
                          <>
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
                                <span className="text-slate-500 font-semibold">Date:</span>
                                <span className="font-bold text-slate-900">{formData.date ? formatDateDMY(formData.date) : "—"}</span>
                              </div>
                              <div className="flex justify-between py-1.5 border-b border-slate-200">
                                <span className="text-slate-500 font-semibold">Interest Amount:</span>
                                <span className="font-black text-teal-800 text-sm">{formatINR(Number(formData.interestAmount) || 0)}</span>
                              </div>
                              {formData.remarks && (
                                <div className="flex justify-between py-1.5 border-b border-slate-200">
                                  <span className="text-slate-500 font-semibold">Remarks:</span>
                                  <span className="font-medium text-slate-800 italic">{formData.remarks}</span>
                                </div>
                              )}
                              <div className="flex justify-between py-1.5">
                                <span className="text-slate-500 font-semibold">Account Head:</span>
                                <span className="font-bold text-slate-900">Bank income</span>
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
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
                                <span className="text-slate-500 font-semibold">FD Date:</span>
                                <span className="font-bold text-slate-900">{formData.date ? formatDateDMY(formData.date) : "—"}</span>
                              </div>
                              <div className="flex justify-between py-1.5 border-b border-slate-200">
                                <span className="text-slate-500 font-semibold">FD Amount:</span>
                                <span className="font-black text-purple-800 text-sm">{formatINR(formData.amount)}</span>
                              </div>
                              <div className="flex justify-between py-1.5 border-b border-slate-200">
                                <span className="text-slate-500 font-semibold">FD Term:</span>
                                <span className="font-bold text-slate-900">{formData.fdTermYears ? `${formData.fdTermYears} Years` : "—"}</span>
                              </div>
                              <div className="flex justify-between py-1.5 border-b border-slate-200">
                                <span className="text-slate-500 font-semibold">Maturity Date:</span>
                                <span className="font-bold text-slate-900">{formData.maturityDate ? formatDateDMY(formData.maturityDate) : "—"}</span>
                              </div>
                              <div className="flex justify-between py-1.5 border-b border-slate-200">
                                <span className="text-slate-500 font-semibold">Bank Account No.:</span>
                                <span className="font-mono font-bold text-slate-900">{formData.bankAccountNumber || "—"}</span>
                              </div>
                              <div className="flex justify-between py-1.5 border-b border-slate-200">
                                <span className="text-slate-500 font-semibold">Bank Name:</span>
                                <span className="font-bold text-slate-900">{formData.bankName || "—"}</span>
                              </div>
                              <div className="flex justify-between py-1.5 border-b border-slate-200">
                                <span className="text-slate-500 font-semibold">Bank Branch:</span>
                                <span className="font-bold text-slate-900">{formData.bankBranch || "—"}</span>
                              </div>
                              <div className="flex justify-between py-1.5 border-b border-slate-200">
                                <span className="text-slate-500 font-semibold">Bank Branch Address:</span>
                                <span className="font-medium text-slate-800">{formData.bankAddress || "—"}</span>
                              </div>
                              <div className="flex justify-between py-1.5 border-b border-slate-200">
                                <span className="text-slate-500 font-semibold">Bank Contact Number:</span>
                                <span className="font-medium text-slate-800">{formData.bankContactNumber || "—"}</span>
                              </div>
                              {formData.depositedBy && (
                                <div className="flex justify-between py-1.5 border-b border-slate-200">
                                  <span className="text-slate-500 font-semibold">Deposited By:</span>
                                  <span className="font-bold text-slate-900">{formData.depositedBy}</span>
                                </div>
                              )}
                              {formData.remarks && (
                                <div className="flex justify-between py-1.5 border-b border-slate-200">
                                  <span className="text-slate-500 font-semibold">Remarks:</span>
                                  <span className="font-medium text-slate-800 italic">{formData.remarks}</span>
                                </div>
                              )}
                            </div>
                          </>
                        )}
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
                    <span>Review and submit</span>
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
