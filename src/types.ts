/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum UserRole {
  Admin = "Admin",
  Treasurer = "Treasurer",
  President = "President",
  Secretary = "Secretary",
  GeneralSecretary = "GeneralSecretary",
  GeneralUser = "GeneralUser", // Viewer
}

export enum OrgLevel {
  National = "National",
  State = "State",
  District = "District",
  Local = "Local",
}

export type EntityType = 
  | "National Chapter"
  | "State Chapter"
  | "District Chapter"
  | "Local Chapter"
  | "Sub-Committee";

export interface StateNode {
  id: string;
  name: string;
}

export interface DistrictNode {
  id: string;
  name: string;
  stateId: string;
}

export interface ChapterNode {
  id: string;
  name: string;
  districtId: string;
}

export interface User {
  username: string;
  name: string;
  role: UserRole;
  level: OrgLevel;
  nodeId?: string; // id of State, District, or Chapter depending on level. Admin has none.
  designation: string; // e.g., "Treasurer", "President", "Secretary", etc.
  password?: string; // For mock logins
}

export enum HeadType {
  Income = "Income",
  Expense = "Expense",
  Loan = "Loan",
}

export interface AccountHead {
  id: string;
  name: string;
  type: HeadType;
  isSystem?: boolean; // System default heads
  isActive?: boolean; // Can be disabled
}

export interface FinancialUnit {
  id: string;
  name: string;
  level: OrgLevel;
  parentId?: string;
}

// 1. Asset Register Schema (Sheet 1)
export interface Asset {
  slNo: number;
  id: string;
  date: string; // Entry date YYYY-MM-DD
  chapterIdInput: string; // Reference chapter ID
  chapterNameInput: string; // Chapter name
  financialUnitId?: string; // Owning National, State, District, or Local financial unit
  assetId: string; // Unique asset ID e.g. AST-101
  assetName: string; // Asset details
  purchaseDate: string; // YYYY-MM-DD
  quantity: number; // Number of identical items purchased, e.g. 3 tables
  assetValue: number; // Unit price in INR (per item)
  totalValue: number; // assetValue * quantity
  paymentMode: "Cash" | "Bank"; // How the asset was paid for
  category: string; // Asset category (Electronics, Furniture, etc)
  assetLife: number; // Life in years
  custodianName: string; // Person responsible
  depreciationAmount: number; // Straight-line annual depreciation: totalValue / assetLife
  netAmount: number; // totalValue - depreciationAmount (written-down value after 1 year)
  remarks?: string; // Optional notes
}

// 2. FD Register Schema (Sheet 2)
export interface BankBalance {
  slNo: number;
  id: string;
  date: string; // YYYY-MM-DD
  chapterIdInput: string; // Reference chapter ID
  chapterNameInput: string; // Chapter name
  financialUnitId?: string; // Owning National, State, District, or Local financial unit
  amountType: "FD"; // FD only — bank interest is recorded straight to the income ledger
  amount: number; // FD principal in INR
  depositedBy?: string; // Office bearer who made the deposit
  maturityDate?: string; // YYYY-MM-DD, as stated on the FD certificate
  bankName?: string;
  bankBranch?: string;
  bankAccountNumber?: string;
  bankAddress?: string; // Bank / branch address
  bankContactNumber?: string;
  remarks?: string; // Optional notes

  // Legacy fields — FDs used to carry a rate and term so interest could be
  // projected and auto-posted. Interest is now entered by hand as it is
  // received, so new records never set these; old records still display them.
  termYears?: number;
  interestRate?: number;
  annualInterest?: number;
  totalInterest?: number;
  maturityValue?: number;
}

// 3. Chapter Directory / Master Schema (Sheet 3)
export interface ChapterMaster {
  slNo: number;
  id: string; // Chapter ID e.g. CHP-001
  chapterName: string;
  entityType: EntityType; // National, State, District, Local, Sub-Committee
  state: string;
  district: string;
  chapterAddress: string;
  presidentId: string;
  presidentName: string;
  vpId: string;
  vpName: string;
  secretaryId: string;
  secretaryName: string;
  treasurerId: string;
  treasurerName: string;
  contactNo: string;
  whatsappNo: string;
  officeNo: string;
  email: string;
  formationDate: string; // YYYY-MM-DD
}

// 4, 5, 6. Transaction Ledger (Payments / Receipts / Loans - Sheets 4, 5, 6)
export interface Transaction {
  slNo?: number;
  id: string;
  date: string; // YYYY-MM-DD
  type: HeadType; // Income (Receipts), Expense (Payments), Loan
  headId: string;
  headName: string; // Snapshot for durability
  amount: number; // Paid amount / Principal
  voucherNumber?: string;
  description?: string; // Remarks
  chapterId: string;
  financialUnitId?: string; // Authoritative financial-data owner; legacy records fall back to chapterId
  createdBy: string; // username
  createdAt: string; // ISO timestamp
  updatedAt?: string; // ISO timestamp

  // Reference chapter details
  chapterIdInput?: string; // Chapter ID No.
  chapterNameInput?: string; // Chapter Name

  // Receipts (Income) specific fields (Sheet 5)
  collectedBy?: string;
  paidBy?: string; // Paid By Name
  paidByMemberId?: string; // Optional member reference
  offeredAmount?: number; // Expected amount
  paidAmount?: number; // Amount received
  balanceAmount?: number; // Outstanding balance
  paymentMode?: "Cash" | "Bank"; // Payment Mode

  // Payments (Expense) specific fields (Sheet 4)
  paidByExpense?: string; // Paid By person
  paidTo?: string; // Recipient
  payableAmount?: number; // Amount due

  // Loans specific fields (Sheet 6)
  paidToCategory?: "member" | "chapter";
  paidToId?: string; // Recipient ID
  paidToName?: string; // Recipient Name
  particulars?: string; // Loan details
  amountReturned?: number; // Repaid amount
  loanBalance?: number; // Outstanding balance
  loanReturnDate?: string; // Agreed return date
  loanReturnedDate?: string; // Actual return date
  repaymentPaymentMode?: "Cash" | "Bank"; // Mode of payment for loan repayment
  repaymentDate?: string; // Date of repayment
  remarks?: string; // Additional notes

  // Capital purchase link (asset register cross-reference)
  assetRef?: string; // Asset ID this expense paid for, e.g. AST-[#009]

  // Bank interest linkage
  isFdInterest?: boolean; // True for bank / FD interest receipts logged from the FD entry screen
}

// 7. Member Directory Schema (Sheet 7)
export interface MemberQualification {
  id?: string;
  degree: string; // e.g., BHMS, MD (Homeo), MBBS, BAMS, BDS, DHMS, PhD, DNB, M.Sc, MPH, etc.
  degreeTitle?: string; // Specialization / Branch e.g., Homoeopathic Materia Medica
  institution?: string; // College / Institution e.g. Govt Homoeopathic Medical College
  university?: string; // University e.g. KUHS / Kerala University
  yearOfPassing?: string; // Year of passing e.g. 1998
  medicalCouncilName?: string; // Council Name e.g. Travancore-Cochin Medical Council
  medicalCouncilState?: string; // Council State e.g. Kerala
  registrationNumber?: string; // Medical Registration No e.g. TCMC/HOM/12345
}

export interface Member {
  slNo: number;
  id: string;
  memberId: string; // Unique member identifier e.g. MEM-001
  memberName: string; // Full name
  chapterIdInput: string; // Reference chapter ID
  chapterNameInput: string; // Chapter Name
  qualification: string; // Professional qualification summary
  qualificationsList?: MemberQualification[]; // Multi-qualification array
  membershipType: "General" | "Silver" | "Gold" | "Platinum";
  membershipDate: string; // YYYY-MM-DD
  membershipStatus: "Active" | "Hold" | "Expired";
  mobileNumber: string;
  whatsappNumber: string;
  email: string;
  clinicNumber: string;

  // Additional Related & General Doctor Attributes
  gender?: "Male" | "Female" | "Other" | string;
  dob?: string;
  bloodGroup?: string;
  specialization?: string; // Clinical practice specialty
  yearsOfPractice?: string;
  clinicAddress?: string;
  residentialAddress?: string;
  associationRole?: string; // Designation in IHMA
  emergencyContact?: string;
}

export interface FinancialYear {
  id: string;
  name: string; // e.g. "2025-26"
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}

export type ReportTab =
  | "assets"
  | "bank_balances"
  | "chapters"
  | "payments"
  | "receipts"
  | "loans"
  | "members"
  | "heads"
  | "monthly"
  | "yearly"
  | "raw";
