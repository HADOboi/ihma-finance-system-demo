/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  User,
  UserRole,
  OrgLevel,
  StateNode,
  DistrictNode,
  ChapterNode,
  AccountHead,
  HeadType,
  Transaction,
  Asset,
  BankBalance,
  ChapterMaster,
  Member,
} from "./types";

// Organizational hierarchy nodes
export const STATES: StateNode[] = [
  { id: "kerala", name: "Kerala" },
  { id: "tamil_nadu", name: "Tamil Nadu" },
  { id: "karnataka", name: "Karnataka" },
];

export const DISTRICTS: DistrictNode[] = [
  // Kerala districts
  { id: "ernakulam", name: "Ernakulam", stateId: "kerala" },
  { id: "kozhikode", name: "Kozhikode", stateId: "kerala" },
  // Tamil Nadu districts
  { id: "chennai", name: "Chennai", stateId: "tamil_nadu" },
  // Karnataka districts
  { id: "bangalore", name: "Bangalore Rural", stateId: "karnataka" },
];

export const CHAPTERS: ChapterNode[] = [
  // Ernakulam chapters
  { id: "cochin", name: "Cochin Chapter", districtId: "ernakulam" },
  { id: "aluva", name: "Aluva Chapter", districtId: "ernakulam" },
  // Kozhikode chapters
  { id: "calicut_city", name: "Calicut City", districtId: "kozhikode" },
  { id: "vadakara", name: "Vadakara Chapter", districtId: "kozhikode" },
  // Chennai chapters
  { id: "chennai_central", name: "Chennai Central", districtId: "chennai" },
  { id: "chennai_south", name: "Chennai South", districtId: "chennai" },
  // Bangalore chapters
  { id: "bangalore_north", name: "Bangalore North", districtId: "bangalore" },
];

// Default Account Heads
export const DEFAULT_ACCOUNT_HEADS: AccountHead[] = [
  // Income Heads
  { id: "inc_sponsorship", name: "Sponsorship", type: HeadType.Income, isSystem: true, isActive: true },
  { id: "inc_donations", name: "Donations", type: HeadType.Income, isSystem: true, isActive: true },
  { id: "inc_coaching", name: "Coaching programs", type: HeadType.Income, isSystem: true, isActive: true },
  { id: "inc_profit_share", name: "Profit Share", type: HeadType.Income, isSystem: true, isActive: true },
  { id: "inc_bank", name: "Bank income", type: HeadType.Income, isSystem: true, isActive: true },
  { id: "inc_member_ordinary", name: "Membership - ordinary", type: HeadType.Income, isSystem: true, isActive: true },
  { id: "inc_member_gold", name: "Membership - gold", type: HeadType.Income, isSystem: true, isActive: true },
  { id: "inc_member_platinum", name: "Membership - platinum", type: HeadType.Income, isSystem: true, isActive: true },

  // Expense Heads
  { id: "exp_tada", name: "TA&DA", type: HeadType.Expense, isSystem: true, isActive: true },
  { id: "exp_meeting", name: "Meeting expense", type: HeadType.Expense, isSystem: true, isActive: true },
  { id: "exp_printing", name: "Printing", type: HeadType.Expense, isSystem: true, isActive: true },
  { id: "exp_postage", name: "Postage", type: HeadType.Expense, isSystem: true, isActive: true },
  { id: "exp_digital_media", name: "Digital media", type: HeadType.Expense, isSystem: true, isActive: true },
  { id: "exp_bank", name: "Bank expense", type: HeadType.Expense, isSystem: true, isActive: true },
];

// Predefined Users
export const USERS: User[] = [
  {
    username: "admin",
    name: "System Admin",
    role: UserRole.Admin,
    level: OrgLevel.National,
    designation: "Administrator",
    password: "admin",
  },
  {
    username: "national_pres",
    name: "Dr. K. S. Menon",
    role: UserRole.President,
    level: OrgLevel.National,
    designation: "National President",
    password: "pass",
  },
  {
    username: "national_treas",
    name: "Dr. Sandeep Kumar",
    role: UserRole.Treasurer,
    level: OrgLevel.National,
    designation: "National Treasurer",
    password: "pass",
  },
  {
    username: "kerala_sec",
    name: "Dr. Faisal Rahman",
    role: UserRole.Secretary,
    level: OrgLevel.State,
    nodeId: "kerala",
    designation: "Kerala State Secretary",
    password: "pass",
  },
  {
    username: "kerala_treas",
    name: "Dr. Mini Joseph",
    role: UserRole.Treasurer,
    level: OrgLevel.State,
    nodeId: "kerala",
    designation: "Kerala State Treasurer",
    password: "pass",
  },
  {
    username: "ekm_president",
    name: "Dr. George Paul",
    role: UserRole.President,
    level: OrgLevel.District,
    nodeId: "ernakulam",
    designation: "Ernakulam District President",
    password: "pass",
  },
  {
    username: "cochin_treasurer",
    name: "Dr. Basheer",
    role: UserRole.Treasurer,
    level: OrgLevel.Local,
    nodeId: "cochin",
    designation: "Cochin Chapter Treasurer",
    password: "pass",
  },
  {
    username: "cochin_member",
    name: "Dr. Smitha Sen",
    role: UserRole.GeneralUser,
    level: OrgLevel.Local,
    nodeId: "cochin",
    designation: "Cochin Chapter Member",
    password: "pass",
  },
  {
    username: "aluva_treasurer",
    name: "Dr. Abraham Mathew",
    role: UserRole.Treasurer,
    level: OrgLevel.Local,
    nodeId: "aluva",
    designation: "Aluva Chapter Treasurer",
    password: "pass",
  },
  {
    username: "chennai_treasurer",
    name: "Dr. R. Ramanujan",
    role: UserRole.Treasurer,
    level: OrgLevel.Local,
    nodeId: "chennai_central",
    designation: "Chennai Central Treasurer",
    password: "pass",
  },
];

/// Sheet 1: Assets Master Register
export const PRELOADED_ASSETS: Asset[] = [
  {
    slNo: 1,
    id: "ast_1",
    date: "2026-01-15",
    chapterIdInput: "KL-EK-CO01",
    chapterNameInput: "Cochin Chapter",
    assetId: "AST-[#001]",
    assetName: "High-Lumen Projector & Sound System",
    purchaseDate: "2026-01-10",
    assetValue: 45000,
    category: "Electronics",
    assetLife: 5,
    custodianName: "Dr. Basheer",
  },
  {
    slNo: 2,
    id: "ast_2",
    date: "2026-02-01",
    chapterIdInput: "KL-EK-CO01",
    chapterNameInput: "Cochin Chapter",
    assetId: "AST-[#002]",
    assetName: "Executive Conference Table & 12 Chairs",
    purchaseDate: "2026-01-28",
    assetValue: 32000,
    category: "Furniture",
    assetLife: 10,
    custodianName: "Dr. Basheer",
  },
  {
    slNo: 3,
    id: "ast_3",
    date: "2026-03-10",
    chapterIdInput: "KL-EK-AL02",
    chapterNameInput: "Aluva Chapter",
    assetId: "AST-[#003]",
    assetName: "Digital Health Kiosk & Diagnostic Monitor",
    purchaseDate: "2026-03-05",
    assetValue: 68000,
    category: "Medical Equipment",
    assetLife: 7,
    custodianName: "Dr. Abraham Mathew",
  },
  {
    slNo: 4,
    id: "ast_4",
    date: "2026-04-12",
    chapterIdInput: "TN-CN-CC01",
    chapterNameInput: "Chennai Central",
    assetId: "AST-[#004]",
    assetName: "Laser Printer & Document Scanner",
    purchaseDate: "2026-04-10",
    assetValue: 24000,
    category: "Office Electronics",
    assetLife: 4,
    custodianName: "Dr. R. Ramanujan",
  },
];

// Sheet 2: FD & Bank Balances
export const PRELOADED_BANK_BALANCES: BankBalance[] = [
  {
    slNo: 1,
    id: "bank_1",
    date: "2026-06-30",
    chapterIdInput: "KL-EK-CO01",
    chapterNameInput: "Cochin Chapter",
    amountType: "Bank Balance",
    amount: 145200,
  },
  {
    slNo: 2,
    id: "bank_2",
    date: "2026-06-30",
    chapterIdInput: "KL-EK-CO01",
    chapterNameInput: "Cochin Chapter",
    amountType: "FD",
    amount: 300000,
  },
  {
    slNo: 3,
    id: "bank_3",
    date: "2026-06-30",
    chapterIdInput: "KL-EK-AL02",
    chapterNameInput: "Aluva Chapter",
    amountType: "Bank Balance",
    amount: 88400,
  },
  {
    slNo: 4,
    id: "bank_4",
    date: "2026-06-30",
    chapterIdInput: "KL-EK-AL02",
    chapterNameInput: "Aluva Chapter",
    amountType: "FD",
    amount: 150000,
  },
  {
    slNo: 5,
    id: "bank_5",
    date: "2026-06-30",
    chapterIdInput: "TN-CN-CC01",
    chapterNameInput: "Chennai Central",
    amountType: "Bank Balance",
    amount: 210500,
  },
  {
    slNo: 6,
    id: "bank_6",
    date: "2026-06-30",
    chapterIdInput: "TN-CN-CC01",
    chapterNameInput: "Chennai Central",
    amountType: "FD",
    amount: 500000,
  },
];

// Sheet 3: Chapter Master Directory
export const PRELOADED_CHAPTER_DIRECTORY: ChapterMaster[] = [
  {
    slNo: 1,
    id: "KL-EK-CO01",
    chapterName: "Cochin Chapter",
    entityType: "Local Chapter",
    state: "Kerala",
    district: "Ernakulam",
    chapterAddress: "IHMA House, MG Road, Ernakulam, Cochin - 682011",
    presidentId: "MEM-KRL-101",
    presidentName: "Dr. George Paul",
    vpId: "MEM-KRL-102",
    vpName: "Dr. Joseph Kurian",
    secretaryId: "MEM-KRL-103",
    secretaryName: "Dr. Smitha Sen",
    treasurerId: "MEM-KRL-104",
    treasurerName: "Dr. Basheer",
    contactNo: "+91 98470 12345",
    whatsappNo: "+91 98470 12345",
    officeNo: "0484 2356789",
    email: "cochin@ihma.in",
    formationDate: "2010-04-15",
  },
  {
    slNo: 2,
    id: "KL-EK-AL02",
    chapterName: "Aluva Chapter",
    entityType: "Local Chapter",
    state: "Kerala",
    district: "Ernakulam",
    chapterAddress: "Subhash Nagar, Near Bank Junction, Aluva - 683101",
    presidentId: "MEM-KRL-201",
    presidentName: "Dr. Roy Antony",
    vpId: "MEM-KRL-202",
    vpName: "Dr. Thomas Mathew",
    secretaryId: "MEM-KRL-203",
    secretaryName: "Dr. Anil Varghese",
    treasurerId: "MEM-KRL-204",
    treasurerName: "Dr. Abraham Mathew",
    contactNo: "+91 98471 23456",
    whatsappNo: "+91 98471 23456",
    officeNo: "0484 2623456",
    email: "aluva@ihma.in",
    formationDate: "2012-08-20",
  },
  {
    slNo: 3,
    id: "TN-CN-CC01",
    chapterName: "Chennai Central",
    entityType: "Local Chapter",
    state: "Tamil Nadu",
    district: "Chennai",
    chapterAddress: "22 Anna Salai, Thousand Lights, Chennai - 600006",
    presidentId: "MEM-TN-301",
    presidentName: "Dr. Vijay Balaji",
    vpId: "MEM-TN-302",
    vpName: "Dr. K. Swaminathan",
    secretaryId: "MEM-TN-303",
    secretaryName: "Dr. S. Sundaram",
    treasurerId: "MEM-TN-304",
    treasurerName: "Dr. R. Ramanujan",
    contactNo: "+91 98400 34567",
    whatsappNo: "+91 98400 34567",
    officeNo: "044 28291000",
    email: "chennai.central@ihma.in",
    formationDate: "2008-11-05",
  },
  {
    slNo: 4,
    id: "DL-ND-HQ00",
    chapterName: "National Headquarters",
    entityType: "National Chapter",
    state: "Delhi",
    district: "New Delhi",
    chapterAddress: "IHMA National Bhavan, Janakpuri, New Delhi - 110058",
    presidentId: "MEM-NAT-001",
    presidentName: "Dr. K. S. Menon",
    vpId: "MEM-NAT-002",
    vpName: "Dr. Ramesh Chandra",
    secretaryId: "MEM-NAT-003",
    secretaryName: "Dr. P. K. Sharma",
    treasurerId: "MEM-NAT-004",
    treasurerName: "Dr. Sandeep Kumar",
    contactNo: "+91 98100 99999",
    whatsappNo: "+91 98100 99999",
    officeNo: "011 25501234",
    email: "hq@ihma.in",
    formationDate: "1998-01-26",
  },
];

// Sheet 7: Member Directory
export const PRELOADED_MEMBERS: Member[] = [
  {
    slNo: 1,
    id: "mem_1",
    memberId: "MEM-KRL-101",
    memberName: "Dr. George Paul",
    chapterIdInput: "KL-EK-CO01",
    chapterNameInput: "Cochin Chapter",
    qualification: "MD(Hom)",
    membershipType: "Platinum",
    membershipDate: "2010-05-10",
    membershipStatus: "Active",
    mobileNumber: "+91 98470 11111",
    whatsappNumber: "+91 98470 11111",
    email: "george.paul@gmail.com",
    clinicNumber: "0484 2300111",
  },
  {
    slNo: 2,
    id: "mem_2",
    memberId: "MEM-KRL-104",
    memberName: "Dr. Basheer",
    chapterIdInput: "KL-EK-CO01",
    chapterNameInput: "Cochin Chapter",
    qualification: "BHMS",
    membershipType: "Gold",
    membershipDate: "2012-03-15",
    membershipStatus: "Active",
    mobileNumber: "+91 98470 22222",
    whatsappNumber: "+91 98470 22222",
    email: "dr.basheer@yahoo.com",
    clinicNumber: "0484 2300222",
  },
  {
    slNo: 3,
    id: "mem_3",
    memberId: "MEM-KRL-204",
    memberName: "Dr. Abraham Mathew",
    chapterIdInput: "KL-EK-AL02",
    chapterNameInput: "Aluva Chapter",
    qualification: "BHMS, MSc",
    membershipType: "Gold",
    membershipDate: "2013-09-01",
    membershipStatus: "Active",
    mobileNumber: "+91 98471 33333",
    whatsappNumber: "+91 98471 33333",
    email: "abraham.m@gmail.com",
    clinicNumber: "0484 2620333",
  },
  {
    slNo: 4,
    id: "mem_4",
    memberId: "MEM-TN-301",
    memberName: "Dr. Vijay Balaji",
    chapterIdInput: "TN-CN-CC01",
    chapterNameInput: "Chennai Central",
    qualification: "MD(Hom), PhD",
    membershipType: "Platinum",
    membershipDate: "2009-01-20",
    membershipStatus: "Active",
    mobileNumber: "+91 98400 44444",
    whatsappNumber: "+91 98400 44444",
    email: "vijay.balaji@chennaihomoeo.org",
    clinicNumber: "044 28290444",
  },
];

// Sheets 4, 5, 6: Transaction Ledger (Receipts, Payments, Loans)
export const PRELOADED_TRANSACTIONS: Transaction[] = [
  // --- Receipts (Sheet 5) ---
  {
    slNo: 1,
    id: "tx_1",
    date: "2026-06-01",
    type: HeadType.Income,
    headId: "inc_member_ordinary",
    headName: "Membership - ordinary",
    amount: 1500,
    voucherNumber: "RV-101",
    description: "Annual Subscription paid by Dr. Thomas Mathew",
    chapterId: "cochin",
    chapterIdInput: "KL-EK-CO01",
    chapterNameInput: "Cochin Chapter",
    collectedBy: "Dr. Basheer",
    paidBy: "Dr. Thomas Mathew",
    paidByMemberId: "MEM-KRL-108",
    offeredAmount: 1500,
    paidAmount: 1500,
    balanceAmount: 0,
    paymentMode: "Bank",
    createdBy: "cochin_treasurer",
    createdAt: "2026-06-01T10:00:00Z",
  },
  {
    slNo: 2,
    id: "tx_2",
    date: "2026-06-05",
    type: HeadType.Income,
    headId: "inc_sponsorship",
    headName: "Sponsorship",
    amount: 25000,
    voucherNumber: "RV-102",
    description: "Sponsorship for National Homeopathic Seminar 2026",
    chapterId: "cochin",
    chapterIdInput: "KL-EK-CO01",
    chapterNameInput: "Cochin Chapter",
    collectedBy: "Dr. Basheer",
    paidBy: "Hahnemann Pharmacy Pvt Ltd",
    offeredAmount: 30000,
    paidAmount: 25000,
    balanceAmount: 5000,
    paymentMode: "Bank",
    createdBy: "cochin_treasurer",
    createdAt: "2026-06-05T14:00:00Z",
  },

  // --- Payments (Sheet 4) ---
  {
    slNo: 3,
    id: "tx_3",
    date: "2026-06-08",
    type: HeadType.Expense,
    headId: "exp_meeting",
    headName: "Meeting expense",
    amount: 2450,
    voucherNumber: "PV-201",
    description: "Executive committee monthly meeting venue and refreshments",
    chapterId: "cochin",
    chapterIdInput: "KL-EK-CO01",
    chapterNameInput: "Cochin Chapter",
    paidByExpense: "Dr. Basheer",
    paidTo: "Grand Hotel Catering",
    payableAmount: 2450,
    paidAmount: 2450,
    balanceAmount: 0,
    paymentMode: "Cash",
    createdBy: "cochin_treasurer",
    createdAt: "2026-06-08T20:30:00Z",
  },
  {
    slNo: 4,
    id: "tx_4",
    date: "2026-06-12",
    type: HeadType.Expense,
    headId: "exp_printing",
    headName: "Printing",
    amount: 3200,
    voucherNumber: "PV-202",
    description: "CME Seminar Souvenir and Certificate printing charges",
    chapterId: "cochin",
    chapterIdInput: "KL-EK-CO01",
    chapterNameInput: "Cochin Chapter",
    paidByExpense: "Dr. Basheer",
    paidTo: "Cochin Offset Printers",
    payableAmount: 3500,
    paidAmount: 3200,
    balanceAmount: 300,
    paymentMode: "Bank",
    createdBy: "cochin_treasurer",
    createdAt: "2026-06-12T16:45:00Z",
  },

  // --- Loans (Sheet 6) ---
  {
    slNo: 5,
    id: "tx_5",
    date: "2026-05-10",
    type: HeadType.Loan,
    headId: "loan_head",
    headName: "Loan",
    amount: 50000,
    voucherNumber: "LN-301",
    description: "Emergency medical relief advance for clinic setup",
    chapterId: "cochin",
    chapterIdInput: "KL-EK-CO01",
    chapterNameInput: "Cochin Chapter",
    paidTo: "Member",
    paidToId: "MEM-KRL-104",
    paidToName: "Dr. Basheer",
    particulars: "Emergency clinic renovation loan advance",
    amountReturned: 20000,
    loanBalance: 30000,
    loanReturnDate: "2026-08-10",
    loanReturnedDate: "2026-06-10",
    remarks: "First installment paid via Bank transfer",
    createdBy: "cochin_treasurer",
    createdAt: "2026-05-10T11:00:00Z",
  },
];

// Database Management Helpers
export function loadDatabase() {
  const users = localStorage.getItem("ihma_users");
  const accountHeads = localStorage.getItem("ihma_account_heads");
  const transactions = localStorage.getItem("ihma_transactions");
  const assets = localStorage.getItem("ihma_assets");
  const bankBalances = localStorage.getItem("ihma_bank_balances");
  const chapterDirectory = localStorage.getItem("ihma_chapter_directory");
  const members = localStorage.getItem("ihma_members");

  if (
    !users ||
    !accountHeads ||
    !transactions ||
    !assets ||
    !bankBalances ||
    !chapterDirectory ||
    !members
  ) {
    // Initialize defaults
    localStorage.setItem("ihma_users", JSON.stringify(USERS));
    localStorage.setItem("ihma_account_heads", JSON.stringify(DEFAULT_ACCOUNT_HEADS));
    localStorage.setItem("ihma_transactions", JSON.stringify(PRELOADED_TRANSACTIONS));
    localStorage.setItem("ihma_assets", JSON.stringify(PRELOADED_ASSETS));
    localStorage.setItem("ihma_bank_balances", JSON.stringify(PRELOADED_BANK_BALANCES));
    localStorage.setItem("ihma_chapter_directory", JSON.stringify(PRELOADED_CHAPTER_DIRECTORY));
    localStorage.setItem("ihma_members", JSON.stringify(PRELOADED_MEMBERS));

    return {
      users: USERS,
      accountHeads: DEFAULT_ACCOUNT_HEADS,
      transactions: PRELOADED_TRANSACTIONS,
      assets: PRELOADED_ASSETS,
      bankBalances: PRELOADED_BANK_BALANCES,
      chapterDirectory: PRELOADED_CHAPTER_DIRECTORY,
      members: PRELOADED_MEMBERS,
    };
  }

  return {
    users: JSON.parse(users),
    accountHeads: JSON.parse(accountHeads),
    transactions: JSON.parse(transactions),
    assets: JSON.parse(assets),
    bankBalances: JSON.parse(bankBalances),
    chapterDirectory: JSON.parse(chapterDirectory),
    members: JSON.parse(members),
  };
}

export function saveDatabase(data: {
  users: User[];
  accountHeads: AccountHead[];
  transactions: Transaction[];
  assets: Asset[];
  bankBalances: BankBalance[];
  chapterDirectory: ChapterMaster[];
  members: Member[];
}) {
  localStorage.setItem("ihma_users", JSON.stringify(data.users));
  localStorage.setItem("ihma_account_heads", JSON.stringify(data.accountHeads));
  localStorage.setItem("ihma_transactions", JSON.stringify(data.transactions));
  localStorage.setItem("ihma_assets", JSON.stringify(data.assets));
  localStorage.setItem("ihma_bank_balances", JSON.stringify(data.bankBalances));
  localStorage.setItem("ihma_chapter_directory", JSON.stringify(data.chapterDirectory));
  localStorage.setItem("ihma_members", JSON.stringify(data.members));
}

export function resetToDefaults() {
  localStorage.setItem("ihma_users", JSON.stringify(USERS));
  localStorage.setItem("ihma_account_heads", JSON.stringify(DEFAULT_ACCOUNT_HEADS));
  localStorage.setItem("ihma_transactions", JSON.stringify(PRELOADED_TRANSACTIONS));
  localStorage.setItem("ihma_assets", JSON.stringify(PRELOADED_ASSETS));
  localStorage.setItem("ihma_bank_balances", JSON.stringify(PRELOADED_BANK_BALANCES));
  localStorage.setItem("ihma_chapter_directory", JSON.stringify(PRELOADED_CHAPTER_DIRECTORY));
  localStorage.setItem("ihma_members", JSON.stringify(PRELOADED_MEMBERS));

  return {
    users: USERS,
    accountHeads: DEFAULT_ACCOUNT_HEADS,
    transactions: PRELOADED_TRANSACTIONS,
    assets: PRELOADED_ASSETS,
    bankBalances: PRELOADED_BANK_BALANCES,
    chapterDirectory: PRELOADED_CHAPTER_DIRECTORY,
    members: PRELOADED_MEMBERS,
  };
}

