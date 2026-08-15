/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Supabase Service Layer for IHMA Finance System
 * Fully mapped to standard PostgreSQL snake_case column schemas across all 7 tables.
 * Includes generic CRUD, JSON qualification array parsing/stringifying, and RBAC enforcement.
 */

import { supabase } from "./supabaseClient";
import { User, UserRole, OrgLevel } from "../types";

/* ==========================================================================
   1. TYPES & DATABASE ROW INTERFACES (PostgreSQL snake_case Schema)
   ========================================================================== */

/**
 * Standard Member Qualification Item
 */
export interface QualificationItem {
  degree: string;
  specialization?: string;
  college?: string;
  university?: string;
  year?: string;
  medical_council?: string;
  council_state?: string;
  council_reg_no?: string;
}

/**
 * 1. `members` Table Row (PostgreSQL snake_case)
 */
export interface DbMemberRow {
  sl_no?: number;
  member_id: string;
  member_name: string;
  chapter_id_no: string;
  chapter_name: string;
  members_qualification: string; // Stored in DB as stringified JSON array
  membership_type: string;
  membership_date: string;
  membership_status: string;
  gender?: string | null;
  blood_group?: string | null;
  dob?: string | null;
  mobile_number?: string | null;
  whatsapp_number?: string | null;
  email_address?: string | null;
}

export interface MemberModel {
  slNo?: number;
  memberId: string;
  memberName: string;
  chapterIdNo: string;
  chapterName: string;
  qualifications: QualificationItem[];
  membershipType: string;
  membershipDate: string;
  membershipStatus: string;
  gender?: string;
  bloodGroup?: string;
  dob?: string;
  mobileNumber?: string;
  whatsappNumber?: string;
  emailAddress?: string;
}

/**
 * 2. `income` Table Row (PostgreSQL snake_case)
 */
export interface DbIncomeRow {
  sl_no?: number;
  chapter_id_no: string;
  chapter_name: string;
  date: string;
  voucher_number?: string | null;
  collected_by: string;
  collected_from: string;
  accounts_head: string;
  offered_amount: number;
  paid_amount: number;
  balance_amount: number;
  payment_mode: string;
  remarks_comments?: string | null;
}

export interface IncomeModel {
  slNo?: number;
  chapterIdNo: string;
  chapterName: string;
  date: string;
  voucherNumber?: string;
  collectedBy: string;
  collectedFrom: string;
  accountsHead: string;
  offeredAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentMode: string;
  remarksComments?: string;
}

/**
 * 3. `expense` Table Row (PostgreSQL snake_case)
 */
export interface DbExpenseRow {
  sl_no?: number;
  chapter_id_number: string;
  chapter_name: string;
  date: string;
  voucher_number?: string | null;
  paid_by: string;
  paid_to: string;
  accounts_head: string;
  payable_amount: number;
  paid_amount: number;
  balance_amount: number;
  mode_of_payment: string;
  remarks_comments?: string | null;
}

export interface ExpenseModel {
  slNo?: number;
  chapterIdNumber: string;
  chapterName: string;
  date: string;
  voucherNumber?: string;
  paidBy: string;
  paidTo: string;
  accountsHead: string;
  payableAmount: number;
  paidAmount: number;
  balanceAmount: number;
  modeOfPayment: string;
  remarksComments?: string;
}

/**
 * 4. `fd` Table Row (PostgreSQL snake_case)
 */
export interface DbFDRow {
  sl_no?: number;
  date: string;
  chapter_id_no: string;
  chapter_name: string;
  amount_type: string;
  amount: number;
  fd_maturity_date?: string | null;
  bank_account_number?: string | null;
  bank_name?: string | null;
  bank_branch?: string | null;
  bank_branch_address?: string | null;
  bank_contact_number?: string | null;
  remarks_comments?: string | null;
}

export interface FDModel {
  slNo?: number;
  date: string;
  chapterIdNo: string;
  chapterName: string;
  amountType: string;
  amount: number;
  fdMaturityDate?: string;
  bankAccountNumber?: string;
  bankName?: string;
  bankBranch?: string;
  bankBranchAddress?: string;
  bankContactNumber?: string;
  remarksComments?: string;
}

/**
 * 5. `asset_liability` Table Row (PostgreSQL snake_case)
 */
export interface DbAssetLiabilityRow {
  sl_no?: number;
  date: string;
  chapter_id_no: string;
  chapter_name: string;
  asset_number_asset_id: string;
  asset_name: string;
  asset_purchase_date: string;
  asset_value_inr: number;
  asset_category: string;
  asset_life: number;
  custodian_name: string;
  depreciation_ratio?: number | null;
  depreciation_amount: number;
  net_amount: number;
  remarks?: string | null;
}

export interface AssetLiabilityModel {
  slNo?: number;
  date: string;
  chapterIdNo: string;
  chapterName: string;
  assetNumberAssetId: string;
  assetName: string;
  assetPurchaseDate: string;
  assetValueInr: number;
  assetCategory: string;
  assetLife: number;
  custodianName: string;
  depreciationRatio?: number;
  depreciationAmount: number;
  netAmount: number;
  remarks?: string;
}

/**
 * 6. `loan` Table Row (PostgreSQL snake_case)
 */
export interface DbLoanRow {
  sl_no?: number;
  chapter_id_no: string;
  chapter_name: string;
  date: string;
  voucher_number?: string | null;
  paid_to: string;
  paid_to_id: string;
  particulars: string;
  amount: number;
  transaction_type: string;
  loan_balance: number;
  loan_return_date?: string | null;
  loan_returned_date?: string | null;
  remarks_comments?: string | null;
  mode_of_payment: string;
}

export interface LoanModel {
  slNo?: number;
  chapterIdNo: string;
  chapterName: string;
  date: string;
  voucherNumber?: string;
  paidTo: string;
  paidToId: string;
  particulars: string;
  amount: number;
  transactionType: string;
  loanBalance: number;
  loanReturnDate?: string;
  loanReturnedDate?: string;
  remarksComments?: string;
  modeOfPayment: string;
}

/**
 * 7. `chapter` Table Row (PostgreSQL snake_case)
 */
export interface DbChapterRow {
  sl_no?: number;
  chapter_id: string;
  chapter_name: string;
  state: string;
  district: string;
  chapter_address: string;
  chapter_president_id_no?: string | null;
  chapter_president_name?: string | null;
  chapter_vp_id_no?: string | null;
  chapter_vp_name?: string | null;
  chapter_gen_secretary_id_no?: string | null;
  chapter_gen_secretary_name?: string | null;
  chapter_treasurer_id_no?: string | null;
  chapter_treasurer_name?: string | null;
  chapter_contact_no?: string | null;
  chapter_bank_name?: string | null;
  chapter_bank_ifsc_code?: string | null;
  chapter_bank_account_number?: string | null;
}

export interface ChapterModel {
  slNo?: number;
  chapterId: string;
  chapterName: string;
  state: string;
  district: string;
  chapterAddress: string;
  chapterPresidentIdNo?: string;
  chapterPresidentName?: string;
  chapterVpIdNo?: string;
  chapterVpName?: string;
  chapterGenSecretaryIdNo?: string;
  chapterGenSecretaryName?: string;
  chapterTreasurerIdNo?: string;
  chapterTreasurerName?: string;
  chapterContactNo?: string;
  chapterBankName?: string;
  chapterBankIfscCode?: string;
  chapterBankAccountNumber?: string;
}

/* ==========================================================================
   2. RBAC & PERMISSION ENFORCEMENT
   ========================================================================== */

/**
 * Evaluates whether a user has write permission.
 * - Treasurers have Read/Write access (scoped to their node/chapter or National).
 * - President, VP, Secretary, Gen Sec, GeneralUser/Member have Read-Only access.
 */
export function canUserWrite(user: User | null, targetChapterId?: string): boolean {
  if (!user) return false;

  if (user.role !== UserRole.Treasurer) {
    return false;
  }

  if (user.level === OrgLevel.National) {
    return true;
  }

  if (targetChapterId && user.nodeId) {
    return targetChapterId.toLowerCase().includes(user.nodeId.toLowerCase());
  }

  return true;
}

export function assertWritePermission(user: User | null, targetChapterId?: string): void {
  if (!canUserWrite(user, targetChapterId)) {
    throw new Error(
      `Access Denied: Role '${user?.role || "Anonymous"}' does not have write permissions for chapter '${targetChapterId || "unspecified"}'. Only Treasurers have write access.`
    );
  }
}

/* ==========================================================================
   3. DATA TRANSFORMATION & JSON QUALIFICATION HELPERS
   ========================================================================== */

export function parseQualifications(qualificationStr?: string | null): QualificationItem[] {
  if (!qualificationStr || typeof qualificationStr !== "string") {
    return [];
  }
  try {
    const parsed = JSON.parse(qualificationStr);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("Failed to parse qualification JSON from database:", qualificationStr, error);
    return [];
  }
}

export function stringifyQualifications(qualifications?: QualificationItem[] | null): string {
  if (!qualifications || !Array.isArray(qualifications)) {
    return JSON.stringify([]);
  }
  return JSON.stringify(qualifications);
}

/* --- Model <-> DB Mappers --- */

export function mapDbMemberToModel(row: any): MemberModel {
  return {
    slNo: row.sl_no,
    memberId: row.member_id,
    memberName: row.member_name,
    chapterIdNo: row.chapter_id_no || row.chapter_id,
    chapterName: row.chapter_name,
    qualifications: parseQualifications(row.members_qualification || row.member_qualification),
    membershipType: row.membership_type,
    membershipDate: row.membership_date,
    membershipStatus: row.membership_status,
    gender: row.gender || undefined,
    bloodGroup: row.blood_group || undefined,
    dob: row.dob || undefined,
    mobileNumber: row.mobile_number || undefined,
    whatsappNumber: row.whatsapp_number || undefined,
    emailAddress: row.email_address || undefined,
  };
}

export function mapModelToDbMember(model: MemberModel): DbMemberRow {
  return {
    sl_no: model.slNo,
    member_id: model.memberId,
    member_name: model.memberName,
    chapter_id_no: model.chapterIdNo,
    chapter_name: model.chapterName,
    members_qualification: stringifyQualifications(model.qualifications),
    membership_type: model.membershipType,
    membership_date: model.membershipDate,
    membership_status: model.membershipStatus,
    gender: model.gender || null,
    blood_group: model.bloodGroup || null,
    dob: model.dob || null,
    mobile_number: model.mobileNumber || null,
    whatsapp_number: model.whatsappNumber || null,
    email_address: model.emailAddress || null,
  };
}

export function mapDbIncomeToModel(row: any): IncomeModel {
  return {
    slNo: row.sl_no,
    chapterIdNo: row.chapter_id_no,
    chapterName: row.chapter_name,
    date: row.date,
    voucherNumber: row.voucher_number || undefined,
    collectedBy: row.collected_by,
    collectedFrom: row.collected_from,
    accountsHead: row.accounts_head,
    offeredAmount: Number(row.offered_amount) || 0,
    paidAmount: Number(row.paid_amount) || 0,
    balanceAmount: Number(row.balance_amount) || 0,
    paymentMode: row.payment_mode || row.mode_of_payment || "Cash",
    remarksComments: row.remarks_comments || row.remarks || undefined,
  };
}

export function mapModelToDbIncome(model: IncomeModel): DbIncomeRow {
  return {
    sl_no: model.slNo,
    chapter_id_no: model.chapterIdNo,
    chapter_name: model.chapterName,
    date: model.date,
    voucher_number: model.voucherNumber || null,
    collected_by: model.collectedBy,
    collected_from: model.collectedFrom,
    accounts_head: model.accountsHead,
    offered_amount: model.offeredAmount,
    paid_amount: model.paidAmount,
    balance_amount: model.balanceAmount,
    payment_mode: model.paymentMode,
    remarks_comments: model.remarksComments || null,
  };
}

export function mapDbExpenseToModel(row: any): ExpenseModel {
  return {
    slNo: row.sl_no,
    chapterIdNumber: row.chapter_id_number || row.chapter_id_no || row.chapter_id,
    chapterName: row.chapter_name,
    date: row.date,
    voucherNumber: row.voucher_number || undefined,
    paidBy: row.paid_by,
    paidTo: row.paid_to,
    accountsHead: row.accounts_head,
    payableAmount: Number(row.payable_amount) || 0,
    paidAmount: Number(row.paid_amount) || 0,
    balanceAmount: Number(row.balance_amount) || 0,
    modeOfPayment: row.mode_of_payment || row.payment_mode || "Cash",
    remarksComments: row.remarks_comments || row.remarks || undefined,
  };
}

export function mapModelToDbExpense(model: ExpenseModel): DbExpenseRow {
  return {
    sl_no: model.slNo,
    chapter_id_number: model.chapterIdNumber,
    chapter_name: model.chapterName,
    date: model.date,
    voucher_number: model.voucherNumber || null,
    paid_by: model.paidBy,
    paid_to: model.paidTo || null,
    accounts_head: model.accountsHead,
    payable_amount: model.payableAmount,
    paid_amount: model.paidAmount,
    balance_amount: model.balanceAmount,
    mode_of_payment: model.modeOfPayment,
    remarks_comments: model.remarksComments || null,
  };
}

export function mapDbFDToModel(row: any): FDModel {
  return {
    slNo: row.sl_no,
    date: row.date,
    chapterIdNo: row.chapter_id_no,
    chapterName: row.chapter_name,
    amountType: row.amount_type,
    amount: Number(row.amount) || 0,
    fdMaturityDate: row.fd_maturity_date || row.maturity_date || undefined,
    bankAccountNumber: row.bank_account_number || undefined,
    bankName: row.bank_name || undefined,
    bankBranch: row.bank_branch || undefined,
    bankBranchAddress: row.bank_branch_address || undefined,
    bankContactNumber: row.bank_contact_number || undefined,
    remarksComments: row.remarks_comments || row.remarks || undefined,
  };
}

export function mapModelToDbFD(model: FDModel): DbFDRow {
  return {
    sl_no: model.slNo,
    date: model.date,
    chapter_id_no: model.chapterIdNo,
    chapter_name: model.chapterName,
    amount_type: model.amountType,
    amount: model.amount,
    fd_maturity_date: model.fdMaturityDate || null,
    bank_account_number: model.bankAccountNumber || null,
    bank_name: model.bankName || null,
    bank_branch: model.bankBranch || null,
    bank_branch_address: model.bankBranchAddress || null,
    bank_contact_number: model.bankContactNumber || null,
    remarks_comments: model.remarksComments || null,
  };
}

export function mapDbAssetToModel(row: any): AssetLiabilityModel {
  return {
    slNo: row.sl_no,
    date: row.date,
    chapterIdNo: row.chapter_id_no,
    chapterName: row.chapter_name,
    assetNumberAssetId: row.asset_number_asset_id || row.asset_id || row.asset_number,
    assetName: row.asset_name,
    assetPurchaseDate: row.asset_purchase_date || row.purchase_date,
    assetValueInr: Number(row.asset_value_inr || row.asset_value) || 0,
    assetCategory: row.asset_category || row.category,
    assetLife: Number(row.asset_life) || 0,
    custodianName: row.custodian_name,
    depreciationRatio: row.depreciation_ratio ? Number(row.depreciation_ratio) : undefined,
    depreciationAmount: Number(row.depreciation_amount) || 0,
    netAmount: Number(row.net_amount) || 0,
    remarks: row.remarks || undefined,
  };
}

export function mapModelToDbAsset(model: AssetLiabilityModel): DbAssetLiabilityRow {
  return {
    sl_no: model.slNo,
    date: model.date,
    chapter_id_no: model.chapterIdNo,
    chapter_name: model.chapterName,
    asset_number_asset_id: model.assetNumberAssetId,
    asset_name: model.assetName,
    asset_purchase_date: model.assetPurchaseDate,
    asset_value_inr: model.assetValueInr,
    asset_category: model.assetCategory,
    asset_life: model.assetLife,
    custodian_name: model.custodianName,
    depreciation_ratio: model.depreciationRatio || null,
    depreciation_amount: model.depreciationAmount,
    net_amount: model.netAmount,
    remarks: model.remarks || null,
  };
}

export function mapDbLoanToModel(row: any): LoanModel {
  return {
    slNo: row.sl_no,
    chapterIdNo: row.chapter_id_no,
    chapterName: row.chapter_name,
    date: row.date,
    voucherNumber: row.voucher_number || undefined,
    paidTo: row.paid_to || row.paid_to_by || "",
    paidToId: row.paid_to_id || row.paid_to_by_id || "",
    particulars: row.particulars,
    amount: Number(row.amount) || 0,
    transactionType: row.transaction_type,
    loanBalance: Number(row.loan_balance) || 0,
    loanReturnDate: row.loan_return_date || undefined,
    loanReturnedDate: row.loan_returned_date || undefined,
    remarksComments: row.remarks_comments || row.remarks || undefined,
    modeOfPayment: row.mode_of_payment || row.payment_mode || "Cash",
  };
}

export function mapModelToDbLoan(model: LoanModel): DbLoanRow {
  return {
    sl_no: model.slNo,
    chapter_id_no: model.chapterIdNo,
    chapter_name: model.chapterName,
    date: model.date,
    voucher_number: model.voucherNumber || null,
    paid_to: model.paidTo,
    paid_to_id: model.paidToId,
    particulars: model.particulars,
    amount: model.amount,
    transaction_type: model.transactionType,
    loan_balance: model.loanBalance,
    loan_return_date: model.loanReturnDate || null,
    loan_returned_date: model.loanReturnedDate || null,
    remarks_comments: model.remarksComments || null,
    mode_of_payment: model.modeOfPayment,
  };
}

export function mapDbChapterToModel(row: any): ChapterModel {
  return {
    slNo: row.sl_no,
    chapterId: row.chapter_id,
    chapterName: row.chapter_name,
    state: row.state,
    district: row.district,
    chapterAddress: row.chapter_address,
    chapterPresidentIdNo: row.chapter_president_id_no || undefined,
    chapterPresidentName: row.chapter_president_name || undefined,
    chapterVpIdNo: row.chapter_vp_id_no || undefined,
    chapterVpName: row.chapter_vp_name || undefined,
    chapterGenSecretaryIdNo: row.chapter_gen_secretary_id_no || undefined,
    chapterGenSecretaryName: row.chapter_gen_secretary_name || undefined,
    chapterTreasurerIdNo: row.chapter_treasurer_id_no || undefined,
    chapterTreasurerName: row.chapter_treasurer_name || undefined,
    chapterContactNo: row.chapter_contact_no || undefined,
    chapterBankName: row.chapter_bank_name || undefined,
    chapterBankIfscCode: row.chapter_bank_ifsc_code || undefined,
    chapterBankAccountNumber: row.chapter_bank_account_number || undefined,
  };
}

export function mapModelToDbChapter(model: ChapterModel): DbChapterRow {
  return {
    sl_no: model.slNo,
    chapter_id: model.chapterId,
    chapter_name: model.chapterName,
    state: model.state,
    district: model.district,
    chapter_address: model.chapterAddress,
    chapter_president_id_no: model.chapterPresidentIdNo || null,
    chapter_president_name: model.chapterPresidentName || null,
    chapter_vp_id_no: model.chapterVpIdNo || null,
    chapter_vp_name: model.chapterVpName || null,
    chapter_gen_secretary_id_no: model.chapterGenSecretaryIdNo || null,
    chapter_gen_secretary_name: model.chapterGenSecretaryName || null,
    chapter_treasurer_id_no: model.chapterTreasurerIdNo || null,
    chapter_treasurer_name: model.chapterTreasurerName || null,
    chapter_contact_no: model.chapterContactNo || null,
    chapter_bank_name: model.chapterBankName || null,
    chapter_bank_ifsc_code: model.chapterBankIfscCode || null,
    chapter_bank_account_number: model.chapterBankAccountNumber || null,
  };
}

/* ==========================================================================
   4. GENERIC ASYNCHRONOUS CRUD OPERATIONS FOR SUPABASE
   ========================================================================== */

export async function fetchRecords<T>(
  tableName: string,
  options?: {
    filterColumn?: string;
    filterValue?: any;
    orderBy?: string;
    ascending?: boolean;
    limit?: number;
  }
): Promise<T[]> {
  let query = supabase.from(tableName).select("*");

  if (options?.filterColumn && options.filterValue !== undefined) {
    query = query.eq(options.filterColumn, options.filterValue);
  }

  if (options?.orderBy) {
    query = query.order(options.orderBy, { ascending: options.ascending ?? true });
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error(`Supabase error fetching from '${tableName}':`, error.message);
    throw new Error(`Failed to fetch from ${tableName}: ${error.message}`);
  }

  return (data as T[]) || [];
}

export async function insertRecord<T extends Record<string, any>, R = T>(
  tableName: string,
  record: T | T[]
): Promise<R[]> {
  const { data, error } = await supabase.from(tableName).insert(record as any).select();

  if (error) {
    console.error(`Supabase error inserting into '${tableName}':`, error.message);
    throw new Error(`Failed to insert into ${tableName}: ${error.message}`);
  }

  return (data as R[]) || [];
}

export async function updateRecord<T extends Record<string, any>, R = T>(
  tableName: string,
  matchColumn: string,
  matchValue: any,
  updates: Partial<T>
): Promise<R[]> {
  const { data, error } = await supabase
    .from(tableName)
    .update(updates as any)
    .eq(matchColumn, matchValue)
    .select();

  if (error) {
    console.error(`Supabase error updating '${tableName}':`, error.message);
    throw new Error(`Failed to update ${tableName}: ${error.message}`);
  }

  return (data as R[]) || [];
}

export async function deleteRecord(
  tableName: string,
  matchColumn: string,
  matchValue: any
): Promise<boolean> {
  const { error } = await supabase
    .from(tableName)
    .delete()
    .eq(matchColumn, matchValue);

  if (error) {
    console.error(`Supabase error deleting from '${tableName}':`, error.message);
    throw new Error(`Failed to delete from ${tableName}: ${error.message}`);
  }

  return true;
}

export async function upsertRecord<T extends Record<string, any>, R = T>(
  tableName: string,
  record: T | T[],
  onConflict?: string
): Promise<R[]> {
  const { data, error } = await supabase
    .from(tableName)
    .upsert(record as any, { onConflict })
    .select();

  if (error) {
    console.error(`Supabase error upserting into '${tableName}':`, error.message);
    throw new Error(`Failed to upsert into ${tableName}: ${error.message}`);
  }

  return (data as R[]) || [];
}

/* ==========================================================================
   5. SPECIFIC CRUD METHODS FOR THE 7 TABLES (snake_case)
   ========================================================================== */

export const TABLE_NAMES = {
  MEMBERS: "members",
  INCOME: "income",
  EXPENSE: "expense",
  FD: "fd",
  ASSET_LIABILITY: "asset_liability",
  LOAN: "loan",
  CHAPTER: "chapter",
} as const;

/* --- 1. Members CRUD --- */

export async function fetchMembers(chapterIdNo?: string): Promise<MemberModel[]> {
  const rows = await fetchRecords<DbMemberRow>(TABLE_NAMES.MEMBERS, {
    filterColumn: chapterIdNo ? "chapter_id_no" : undefined,
    filterValue: chapterIdNo,
    orderBy: "sl_no",
    ascending: true,
  });
  return rows.map(mapDbMemberToModel);
}

export async function insertMember(member: MemberModel, user?: User | null): Promise<MemberModel> {
  if (user) assertWritePermission(user, member.chapterIdNo);
  const dbRow = mapModelToDbMember(member);
  const [inserted] = await insertRecord<DbMemberRow>(TABLE_NAMES.MEMBERS, dbRow);
  return mapDbMemberToModel(inserted);
}

export async function updateMember(
  memberId: string,
  updates: Partial<MemberModel>,
  user?: User | null
): Promise<MemberModel> {
  if (user) assertWritePermission(user, updates.chapterIdNo);
  
  const partialDb: Partial<DbMemberRow> = {};
  if (updates.memberName !== undefined) partialDb.member_name = updates.memberName;
  if (updates.chapterIdNo !== undefined) partialDb.chapter_id_no = updates.chapterIdNo;
  if (updates.chapterName !== undefined) partialDb.chapter_name = updates.chapterName;
  if (updates.qualifications !== undefined) {
    partialDb.members_qualification = stringifyQualifications(updates.qualifications);
  }
  if (updates.membershipType !== undefined) partialDb.membership_type = updates.membershipType;
  if (updates.membershipDate !== undefined) partialDb.membership_date = updates.membershipDate;
  if (updates.membershipStatus !== undefined) partialDb.membership_status = updates.membershipStatus;
  if (updates.gender !== undefined) partialDb.gender = updates.gender;
  if (updates.bloodGroup !== undefined) partialDb.blood_group = updates.bloodGroup;
  if (updates.dob !== undefined) partialDb.dob = updates.dob;
  if (updates.mobileNumber !== undefined) partialDb.mobile_number = updates.mobileNumber;
  if (updates.whatsappNumber !== undefined) partialDb.whatsapp_number = updates.whatsappNumber;
  if (updates.emailAddress !== undefined) partialDb.email_address = updates.emailAddress;

  const [updated] = await updateRecord<DbMemberRow>(TABLE_NAMES.MEMBERS, "member_id", memberId, partialDb);
  return mapDbMemberToModel(updated);
}

/* --- 2. Income CRUD --- */

export async function fetchIncome(chapterIdNo?: string): Promise<IncomeModel[]> {
  const rows = await fetchRecords<DbIncomeRow>(TABLE_NAMES.INCOME, {
    filterColumn: chapterIdNo ? "chapter_id_no" : undefined,
    filterValue: chapterIdNo,
    orderBy: "date",
    ascending: false,
  });
  return rows.map(mapDbIncomeToModel);
}

export async function insertIncome(income: IncomeModel, user?: User | null): Promise<IncomeModel> {
  if (user) assertWritePermission(user, income.chapterIdNo);
  const dbRow = mapModelToDbIncome(income);
  const [inserted] = await insertRecord<DbIncomeRow>(TABLE_NAMES.INCOME, dbRow);
  return mapDbIncomeToModel(inserted);
}

export async function updateIncome(
  slNo: number,
  updates: Partial<IncomeModel>,
  user?: User | null
): Promise<IncomeModel> {
  if (user) assertWritePermission(user, updates.chapterIdNo);
  const partialDb: Partial<DbIncomeRow> = {};
  if (updates.chapterIdNo !== undefined) partialDb.chapter_id_no = updates.chapterIdNo;
  if (updates.chapterName !== undefined) partialDb.chapter_name = updates.chapterName;
  if (updates.date !== undefined) partialDb.date = updates.date;
  if (updates.voucherNumber !== undefined) partialDb.voucher_number = updates.voucherNumber;
  if (updates.collectedBy !== undefined) partialDb.collected_by = updates.collectedBy;
  if (updates.collectedFrom !== undefined) partialDb.collected_from = updates.collectedFrom;
  if (updates.accountsHead !== undefined) partialDb.accounts_head = updates.accountsHead;
  if (updates.offeredAmount !== undefined) partialDb.offered_amount = updates.offeredAmount;
  if (updates.paidAmount !== undefined) partialDb.paid_amount = updates.paidAmount;
  if (updates.balanceAmount !== undefined) partialDb.balance_amount = updates.balanceAmount;
  if (updates.paymentMode !== undefined) partialDb.payment_mode = updates.paymentMode;
  if (updates.remarksComments !== undefined) partialDb.remarks_comments = updates.remarksComments;

  const [updated] = await updateRecord<DbIncomeRow>(TABLE_NAMES.INCOME, "sl_no", slNo, partialDb);
  return mapDbIncomeToModel(updated);
}

/* --- 3. Expense CRUD --- */

export async function fetchExpense(chapterIdNumber?: string): Promise<ExpenseModel[]> {
  const rows = await fetchRecords<DbExpenseRow>(TABLE_NAMES.EXPENSE, {
    filterColumn: chapterIdNumber ? "chapter_id_number" : undefined,
    filterValue: chapterIdNumber,
    orderBy: "date",
    ascending: false,
  });
  return rows.map(mapDbExpenseToModel);
}

export async function insertExpense(expense: ExpenseModel, user?: User | null): Promise<ExpenseModel> {
  if (user) assertWritePermission(user, expense.chapterIdNumber);
  const dbRow = mapModelToDbExpense(expense);
  const [inserted] = await insertRecord<DbExpenseRow>(TABLE_NAMES.EXPENSE, dbRow);
  return mapDbExpenseToModel(inserted);
}

export async function updateExpense(
  slNo: number,
  updates: Partial<ExpenseModel>,
  user?: User | null
): Promise<ExpenseModel> {
  if (user) assertWritePermission(user, updates.chapterIdNumber);
  const partialDb: Partial<DbExpenseRow> = {};
  if (updates.chapterIdNumber !== undefined) partialDb.chapter_id_number = updates.chapterIdNumber;
  if (updates.chapterName !== undefined) partialDb.chapter_name = updates.chapterName;
  if (updates.date !== undefined) partialDb.date = updates.date;
  if (updates.voucherNumber !== undefined) partialDb.voucher_number = updates.voucherNumber;
  if (updates.paidBy !== undefined) partialDb.paid_by = updates.paidBy;
  if (updates.paidTo !== undefined) partialDb.paid_to = updates.paidTo;
  if (updates.accountsHead !== undefined) partialDb.accounts_head = updates.accountsHead;
  if (updates.payableAmount !== undefined) partialDb.payable_amount = updates.payableAmount;
  if (updates.paidAmount !== undefined) partialDb.paid_amount = updates.paidAmount;
  if (updates.balanceAmount !== undefined) partialDb.balance_amount = updates.balanceAmount;
  if (updates.modeOfPayment !== undefined) partialDb.mode_of_payment = updates.modeOfPayment;
  if (updates.remarksComments !== undefined) partialDb.remarks_comments = updates.remarksComments;

  const [updated] = await updateRecord<DbExpenseRow>(TABLE_NAMES.EXPENSE, "sl_no", slNo, partialDb);
  return mapDbExpenseToModel(updated);
}

/* --- 4. FD CRUD --- */

export async function fetchFD(chapterIdNo?: string): Promise<FDModel[]> {
  const rows = await fetchRecords<DbFDRow>(TABLE_NAMES.FD, {
    filterColumn: chapterIdNo ? "chapter_id_no" : undefined,
    filterValue: chapterIdNo,
    orderBy: "date",
    ascending: false,
  });
  return rows.map(mapDbFDToModel);
}

export async function insertFD(fd: FDModel, user?: User | null): Promise<FDModel> {
  if (user) assertWritePermission(user, fd.chapterIdNo);
  const dbRow = mapModelToDbFD(fd);
  const [inserted] = await insertRecord<DbFDRow>(TABLE_NAMES.FD, dbRow);
  return mapDbFDToModel(inserted);
}

export async function updateFD(
  slNo: number,
  updates: Partial<FDModel>,
  user?: User | null
): Promise<FDModel> {
  if (user) assertWritePermission(user, updates.chapterIdNo);
  const partialDb: Partial<DbFDRow> = {};
  if (updates.chapterIdNo !== undefined) partialDb.chapter_id_no = updates.chapterIdNo;
  if (updates.chapterName !== undefined) partialDb.chapter_name = updates.chapterName;
  if (updates.date !== undefined) partialDb.date = updates.date;
  if (updates.amountType !== undefined) partialDb.amount_type = updates.amountType;
  if (updates.amount !== undefined) partialDb.amount = updates.amount;
  if (updates.fdMaturityDate !== undefined) partialDb.fd_maturity_date = updates.fdMaturityDate;
  if (updates.bankAccountNumber !== undefined) partialDb.bank_account_number = updates.bankAccountNumber;
  if (updates.bankName !== undefined) partialDb.bank_name = updates.bankName;
  if (updates.bankBranch !== undefined) partialDb.bank_branch = updates.bankBranch;
  if (updates.bankBranchAddress !== undefined) partialDb.bank_branch_address = updates.bankBranchAddress;
  if (updates.bankContactNumber !== undefined) partialDb.bank_contact_number = updates.bankContactNumber;
  if (updates.remarksComments !== undefined) partialDb.remarks_comments = updates.remarksComments;

  const [updated] = await updateRecord<DbFDRow>(TABLE_NAMES.FD, "sl_no", slNo, partialDb);
  return mapDbFDToModel(updated);
}

/* --- 5. Asset_Liability CRUD --- */

export async function fetchAssetLiability(chapterIdNo?: string): Promise<AssetLiabilityModel[]> {
  const rows = await fetchRecords<DbAssetLiabilityRow>(TABLE_NAMES.ASSET_LIABILITY, {
    filterColumn: chapterIdNo ? "chapter_id_no" : undefined,
    filterValue: chapterIdNo,
    orderBy: "date",
    ascending: false,
  });
  return rows.map(mapDbAssetToModel);
}

export async function insertAssetLiability(asset: AssetLiabilityModel, user?: User | null): Promise<AssetLiabilityModel> {
  if (user) assertWritePermission(user, asset.chapterIdNo);
  const dbRow = mapModelToDbAsset(asset);
  const [inserted] = await insertRecord<DbAssetLiabilityRow>(TABLE_NAMES.ASSET_LIABILITY, dbRow);
  return mapDbAssetToModel(inserted);
}

export async function updateAssetLiability(
  assetId: string,
  updates: Partial<AssetLiabilityModel>,
  user?: User | null
): Promise<AssetLiabilityModel> {
  if (user) assertWritePermission(user, updates.chapterIdNo);
  const partialDb: Partial<DbAssetLiabilityRow> = {};
  if (updates.chapterIdNo !== undefined) partialDb.chapter_id_no = updates.chapterIdNo;
  if (updates.chapterName !== undefined) partialDb.chapter_name = updates.chapterName;
  if (updates.date !== undefined) partialDb.date = updates.date;
  if (updates.assetName !== undefined) partialDb.asset_name = updates.assetName;
  if (updates.assetPurchaseDate !== undefined) partialDb.asset_purchase_date = updates.assetPurchaseDate;
  if (updates.assetValueInr !== undefined) partialDb.asset_value_inr = updates.assetValueInr;
  if (updates.assetCategory !== undefined) partialDb.asset_category = updates.assetCategory;
  if (updates.assetLife !== undefined) partialDb.asset_life = updates.assetLife;
  if (updates.custodianName !== undefined) partialDb.custodian_name = updates.custodianName;
  if (updates.depreciationRatio !== undefined) partialDb.depreciation_ratio = updates.depreciationRatio;
  if (updates.depreciationAmount !== undefined) partialDb.depreciation_amount = updates.depreciationAmount;
  if (updates.netAmount !== undefined) partialDb.net_amount = updates.netAmount;
  if (updates.remarks !== undefined) partialDb.remarks = updates.remarks;

  const [updated] = await updateRecord<DbAssetLiabilityRow>(
    TABLE_NAMES.ASSET_LIABILITY,
    "asset_number_asset_id",
    assetId,
    partialDb
  );
  return mapDbAssetToModel(updated);
}

/* --- 6. Loan CRUD --- */

export async function fetchLoan(chapterIdNo?: string): Promise<LoanModel[]> {
  const rows = await fetchRecords<DbLoanRow>(TABLE_NAMES.LOAN, {
    filterColumn: chapterIdNo ? "chapter_id_no" : undefined,
    filterValue: chapterIdNo,
    orderBy: "date",
    ascending: false,
  });
  return rows.map(mapDbLoanToModel);
}

export async function insertLoan(loan: LoanModel, user?: User | null): Promise<LoanModel> {
  if (user) assertWritePermission(user, loan.chapterIdNo);
  const dbRow = mapModelToDbLoan(loan);
  const [inserted] = await insertRecord<DbLoanRow>(TABLE_NAMES.LOAN, dbRow);
  return mapDbLoanToModel(inserted);
}

export async function updateLoan(
  slNo: number,
  updates: Partial<LoanModel>,
  user?: User | null
): Promise<LoanModel> {
  if (user) assertWritePermission(user, updates.chapterIdNo);
  const partialDb: Partial<DbLoanRow> = {};
  if (updates.chapterIdNo !== undefined) partialDb.chapter_id_no = updates.chapterIdNo;
  if (updates.chapterName !== undefined) partialDb.chapter_name = updates.chapterName;
  if (updates.date !== undefined) partialDb.date = updates.date;
  if (updates.voucherNumber !== undefined) partialDb.voucher_number = updates.voucherNumber;
  if (updates.paidTo !== undefined) partialDb.paid_to = updates.paidTo;
  if (updates.paidToId !== undefined) partialDb.paid_to_id = updates.paidToId;
  if (updates.particulars !== undefined) partialDb.particulars = updates.particulars;
  if (updates.amount !== undefined) partialDb.amount = updates.amount;
  if (updates.transactionType !== undefined) partialDb.transaction_type = updates.transactionType;
  if (updates.loanBalance !== undefined) partialDb.loan_balance = updates.loanBalance;
  if (updates.loanReturnDate !== undefined) partialDb.loan_return_date = updates.loanReturnDate;
  if (updates.loanReturnedDate !== undefined) partialDb.loan_returned_date = updates.loanReturnedDate;
  if (updates.remarksComments !== undefined) partialDb.remarks_comments = updates.remarksComments;
  if (updates.modeOfPayment !== undefined) partialDb.mode_of_payment = updates.modeOfPayment;

  const [updated] = await updateRecord<DbLoanRow>(TABLE_NAMES.LOAN, "sl_no", slNo, partialDb);
  return mapDbLoanToModel(updated);
}

/* --- 7. Chapter CRUD --- */

export async function fetchChapters(): Promise<ChapterModel[]> {
  const rows = await fetchRecords<DbChapterRow>(TABLE_NAMES.CHAPTER, {
    orderBy: "chapter_id",
    ascending: true,
  });
  return rows.map(mapDbChapterToModel);
}

export async function insertChapter(chapter: ChapterModel, user?: User | null): Promise<ChapterModel> {
  if (user) assertWritePermission(user, chapter.chapterId);
  const dbRow = mapModelToDbChapter(chapter);
  const [inserted] = await insertRecord<DbChapterRow>(TABLE_NAMES.CHAPTER, dbRow);
  return mapDbChapterToModel(inserted);
}

export async function updateChapter(
  chapterId: string,
  updates: Partial<ChapterModel>,
  user?: User | null
): Promise<ChapterModel> {
  if (user) assertWritePermission(user, chapterId);
  const partialDb: Partial<DbChapterRow> = {};
  if (updates.chapterName !== undefined) partialDb.chapter_name = updates.chapterName;
  if (updates.state !== undefined) partialDb.state = updates.state;
  if (updates.district !== undefined) partialDb.district = updates.district;
  if (updates.chapterAddress !== undefined) partialDb.chapter_address = updates.chapterAddress;
  if (updates.chapterPresidentIdNo !== undefined) partialDb.chapter_president_id_no = updates.chapterPresidentIdNo;
  if (updates.chapterPresidentName !== undefined) partialDb.chapter_president_name = updates.chapterPresidentName;
  if (updates.chapterVpIdNo !== undefined) partialDb.chapter_vp_id_no = updates.chapterVpIdNo;
  if (updates.chapterVpName !== undefined) partialDb.chapter_vp_name = updates.chapterVpName;
  if (updates.chapterGenSecretaryIdNo !== undefined) partialDb.chapter_gen_secretary_id_no = updates.chapterGenSecretaryIdNo;
  if (updates.chapterGenSecretaryName !== undefined) partialDb.chapter_gen_secretary_name = updates.chapterGenSecretaryName;
  if (updates.chapterTreasurerIdNo !== undefined) partialDb.chapter_treasurer_id_no = updates.chapterTreasurerIdNo;
  if (updates.chapterTreasurerName !== undefined) partialDb.chapter_treasurer_name = updates.chapterTreasurerName;
  if (updates.chapterContactNo !== undefined) partialDb.chapter_contact_no = updates.chapterContactNo;
  if (updates.chapterBankName !== undefined) partialDb.chapter_bank_name = updates.chapterBankName;
  if (updates.chapterBankIfscCode !== undefined) partialDb.chapter_bank_ifsc_code = updates.chapterBankIfscCode;
  if (updates.chapterBankAccountNumber !== undefined) partialDb.chapter_bank_account_number = updates.chapterBankAccountNumber;

  const [updated] = await updateRecord<DbChapterRow>(TABLE_NAMES.CHAPTER, "chapter_id", chapterId, partialDb);
  return mapDbChapterToModel(updated);
}

/* ==========================================================================
   6. SUPABASE AUTHENTICATION (Username Workaround & Profile Extraction)
   ========================================================================== */

/**
 * Transforms a user-entered username into a valid email address for Supabase Auth.
 * If the input already contains '@', it is formatted cleanly as-is.
 * Otherwise, appends the standard domain '@ihma.demo'.
 */
export function formatAuthEmail(usernameInput: string): string {
  const trimmed = usernameInput.trim();
  if (trimmed.includes("@")) {
    return trimmed.toLowerCase();
  }
  return `${trimmed.toLowerCase()}@ihma.demo`;
}

/**
 * Extracts and maps the RBAC UserRole and OrgLevel from a member record.
 * Ensures:
 * - Treasurers get UserRole.Treasurer (Read/Write access).
 * - Presidents, VPs, Secretaries, Gen Secretaries, and Members get their respective Read-Only roles.
 * - Admin users get UserRole.Admin.
 */
export function determineUserRoleFromMember(
  member: DbMemberRow | MemberModel | null,
  authUsernameOrEmail: string
): { role: UserRole; level: OrgLevel; designation: string; nodeId?: string } {
  const cleanIdentifier = authUsernameOrEmail.toLowerCase();
  
  // 1. Admin Override Check
  if (cleanIdentifier.includes("admin") || cleanIdentifier.startsWith("admin@")) {
    return {
      role: UserRole.Admin,
      level: OrgLevel.National,
      designation: "System Administrator",
      nodeId: undefined,
    };
  }

  const membershipType = (member as any)?.membership_type || (member as MemberModel)?.membershipType || "";
  const memberName = (member as any)?.member_name || (member as MemberModel)?.memberName || "";
  const chapterId = (member as any)?.chapter_id_no || (member as any)?.chapter_id || (member as MemberModel)?.chapterIdNo || "";
  const combinedContext = `${membershipType} ${cleanIdentifier} ${memberName}`.toLowerCase();

  // 2. Treasurer Check (Read/Write permissions)
  if (combinedContext.includes("treasurer") || cleanIdentifier.includes("treasurer")) {
    const isNational = chapterId.toLowerCase().includes("nat") || combinedContext.includes("national");
    return {
      role: UserRole.Treasurer,
      level: isNational ? OrgLevel.National : OrgLevel.Local,
      designation: isNational ? "National Treasurer" : "Chapter Treasurer",
      nodeId: chapterId || "cochin",
    };
  }

  // 3. President Check (Read-Only)
  if (combinedContext.includes("president") || cleanIdentifier.includes("pres")) {
    const isNational = chapterId.toLowerCase().includes("nat") || combinedContext.includes("national");
    return {
      role: UserRole.President,
      level: isNational ? OrgLevel.National : OrgLevel.Local,
      designation: isNational ? "National President" : "Chapter President",
      nodeId: chapterId || "cochin",
    };
  }

  // 4. Secretary / General Secretary Check (Read-Only)
  if (combinedContext.includes("secretary") || cleanIdentifier.includes("sec")) {
    const isGenSec = combinedContext.includes("gen") || cleanIdentifier.includes("gen");
    return {
      role: isGenSec ? UserRole.GeneralSecretary : UserRole.Secretary,
      level: isGenSec ? OrgLevel.National : OrgLevel.Local,
      designation: isGenSec ? "General Secretary" : "Chapter Secretary",
      nodeId: chapterId || "cochin",
    };
  }

  // 5. Default General User / Member (Read-Only)
  return {
    role: UserRole.GeneralUser,
    level: OrgLevel.Local,
    designation: membershipType || "IHMA Member",
    nodeId: chapterId || undefined,
  };
}

/**
 * Fetches user profile from the `members` table by matching the `email_address` column
 * (or member_id / mobile_number fallback) and constructs the active User model.
 */
export async function fetchUserProfileFromMember(
  authEmail: string,
  rawUsername?: string
): Promise<User> {
  const cleanEmail = authEmail.trim().toLowerCase();
  const rawPrefix = rawUsername ? rawUsername.trim().toLowerCase() : cleanEmail.split("@")[0];

  try {
    // Look up member row matching email_address or member_id
    const { data, error } = await supabase
      .from(TABLE_NAMES.MEMBERS)
      .select("*")
      .or(`email_address.ilike.${cleanEmail},email_address.ilike.${rawPrefix}@%,member_id.ilike.${rawPrefix}`)
      .limit(1);

    if (error) {
      console.warn("Supabase query on members table returned:", error.message);
    }

    if (data && data.length > 0) {
      const memberRow: DbMemberRow = data[0];
      const roleConfig = determineUserRoleFromMember(memberRow, rawPrefix);

      return {
        username: rawPrefix,
        name: memberRow.member_name,
        role: roleConfig.role,
        level: roleConfig.level,
        nodeId: memberRow.chapter_id_no || roleConfig.nodeId,
        designation: roleConfig.designation,
      };
    }
  } catch (err: any) {
    console.warn("Error fetching member profile from Supabase:", err);
  }

  // Resilient fallback when member record is not yet in table
  const fallbackRole = determineUserRoleFromMember(null, rawPrefix);
  const formattedName = rawPrefix
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

  return {
    username: rawPrefix,
    name: formattedName || "IHMA Member",
    role: fallbackRole.role,
    level: fallbackRole.level,
    nodeId: fallbackRole.nodeId || "cochin",
    designation: fallbackRole.designation,
  };
}

/**
 * Performs Supabase Auth sign-in with username workaround:
 * 1. Appends dummy domain to username -> authEmail
 * 2. Calls supabase.auth.signInWithPassword({ email: authEmail, password })
 * 3. Fetches the user profile from the members table (email_address match)
 * 4. Extracts the role for RBAC enforcement.
 */
export async function signInWithUsernameWorkaround(
  usernameInput: string,
  passwordInput: string
): Promise<{ user: User | null; session: any; error?: string }> {
  const authEmail = formatAuthEmail(usernameInput);

  const { data, error } = await supabase.auth.signInWithPassword({
    email: authEmail,
    password: passwordInput,
  });

  if (error) {
    return { user: null, session: null, error: error.message };
  }

  const userProfile = await fetchUserProfileFromMember(authEmail, usernameInput);
  return { user: userProfile, session: data.session };
}

/**
 * Signs out from Supabase Auth.
 */
export async function signOutSupabaseAuth(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.warn("Supabase auth signOut error:", error.message);
  }
}
