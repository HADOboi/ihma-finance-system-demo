/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Supabase React Context Provider & Custom Hooks
 * Exposes reactive state, Supabase Auth with username workaround, and RBAC-guarded mutations.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { User, UserRole } from "../types";
import {
  MemberModel,
  IncomeModel,
  ExpenseModel,
  FDModel,
  AssetLiabilityModel,
  LoanModel,
  ChapterModel,
  fetchMembers,
  insertMember,
  updateMember,
  fetchIncome,
  insertIncome,
  updateIncome,
  fetchExpense,
  insertExpense,
  updateExpense,
  fetchFD,
  insertFD,
  updateFD,
  fetchAssetLiability,
  insertAssetLiability,
  updateAssetLiability,
  fetchLoan,
  insertLoan,
  updateLoan,
  fetchChapters,
  insertChapter,
  updateChapter,
  canUserWrite,
  signInWithUsernameWorkaround,
  signOutSupabaseAuth,
  fetchUserProfileFromMember,
  formatAuthEmail,
} from "../services/supabaseService";
import { supabase, isSupabaseConfigured } from "../services/supabaseClient";

export interface SupabaseContextValue {
  // Connection & Auth State
  isConfigured: boolean;
  loading: boolean;
  error: string | null;
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  authLoading: boolean;
  authError: string | null;

  // Auth Operations
  loginWithUsername: (
    username: string,
    password: string
  ) => Promise<{ success: boolean; user?: User; error?: string }>;
  logout: () => Promise<void>;

  // 7 Tables Data
  members: MemberModel[];
  income: IncomeModel[];
  expenses: ExpenseModel[];
  fds: FDModel[];
  assets: AssetLiabilityModel[];
  loans: LoanModel[];
  chapters: ChapterModel[];

  // RBAC Helper
  canWrite: (chapterId?: string) => boolean;

  // Refetch / Refresh
  refreshAll: () => Promise<void>;
  refreshMembers: (chapterId?: string) => Promise<void>;
  refreshIncome: (chapterId?: string) => Promise<void>;
  refreshExpenses: (chapterId?: string) => Promise<void>;
  refreshFDs: (chapterId?: string) => Promise<void>;
  refreshAssets: (chapterId?: string) => Promise<void>;
  refreshLoans: (chapterId?: string) => Promise<void>;
  refreshChapters: () => Promise<void>;

  // Mutations (Members)
  createMember: (member: MemberModel) => Promise<MemberModel>;
  editMember: (memberId: string, updates: Partial<MemberModel>) => Promise<MemberModel>;

  // Mutations (Income)
  createIncome: (income: IncomeModel) => Promise<IncomeModel>;
  editIncome: (slNo: number, updates: Partial<IncomeModel>) => Promise<IncomeModel>;

  // Mutations (Expense)
  createExpense: (expense: ExpenseModel) => Promise<ExpenseModel>;
  editExpense: (slNo: number, updates: Partial<ExpenseModel>) => Promise<ExpenseModel>;

  // Mutations (FD)
  createFD: (fd: FDModel) => Promise<FDModel>;
  editFD: (slNo: number, updates: Partial<FDModel>) => Promise<FDModel>;

  // Mutations (Asset/Liability)
  createAsset: (asset: AssetLiabilityModel) => Promise<AssetLiabilityModel>;
  editAsset: (assetId: string, updates: Partial<AssetLiabilityModel>) => Promise<AssetLiabilityModel>;

  // Mutations (Loan)
  createLoan: (loan: LoanModel) => Promise<LoanModel>;
  editLoan: (slNo: number, updates: Partial<LoanModel>) => Promise<LoanModel>;

  // Mutations (Chapter)
  createChapter: (chapter: ChapterModel) => Promise<ChapterModel>;
  editChapter: (chapterId: string, updates: Partial<ChapterModel>) => Promise<ChapterModel>;
}

const SupabaseDataContext = createContext<SupabaseContextValue | null>(null);

export interface SupabaseDataProviderProps {
  children: React.ReactNode;
  currentUser?: User | null;
  onUserChange?: (user: User | null) => void;
  chapterFilter?: string;
}

export const SupabaseDataProvider: React.FC<SupabaseDataProviderProps> = ({
  children,
  currentUser: externalCurrentUser,
  onUserChange,
  chapterFilter,
}) => {
  // Local or external user state
  const [internalUser, setInternalUser] = useState<User | null>(null);
  const activeUser = externalCurrentUser !== undefined ? externalCurrentUser : internalUser;

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // 7 Tables Reactive State
  const [members, setMembers] = useState<MemberModel[]>([]);
  const [income, setIncome] = useState<IncomeModel[]>([]);
  const [expenses, setExpenses] = useState<ExpenseModel[]>([]);
  const [fds, setFds] = useState<FDModel[]>([]);
  const [assets, setAssets] = useState<AssetLiabilityModel[]>([]);
  const [loans, setLoans] = useState<LoanModel[]>([]);
  const [chapters, setChapters] = useState<ChapterModel[]>([]);

  const configured = useMemo(() => isSupabaseConfigured(), []);

  const handleSetCurrentUser = useCallback(
    (user: User | null) => {
      setInternalUser(user);
      if (onUserChange) {
        onUserChange(user);
      }
    },
    [onUserChange]
  );

  // RBAC Permission Check
  const canWrite = useCallback(
    (targetChapterId?: string) => {
      return canUserWrite(activeUser, targetChapterId || chapterFilter);
    },
    [activeUser, chapterFilter]
  );

  /* ---------------- Supabase Auth Lifecycle & Username Workaround ---------------- */

  // Check active session on mount
  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function restoreSession() {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.warn("Could not restore Supabase session:", sessionError.message);
          return;
        }

        if (session?.user?.email && isMounted && !activeUser) {
          const profile = await fetchUserProfileFromMember(session.user.email);
          if (isMounted && profile) {
            handleSetCurrentUser(profile);
          }
        }
      } catch (err: any) {
        console.warn("Session restore error:", err);
      }
    }

    restoreSession();

    // Listen to Auth State Changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user?.email) {
        const profile = await fetchUserProfileFromMember(session.user.email);
        if (isMounted && profile) {
          handleSetCurrentUser(profile);
        }
      } else if (event === "SIGNED_OUT") {
        if (isMounted) {
          handleSetCurrentUser(null);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [configured, activeUser, handleSetCurrentUser]);

  // Login handler using username workaround
  const loginWithUsername = useCallback(
    async (
      username: string,
      password: string
    ): Promise<{ success: boolean; user?: User; error?: string }> => {
      setAuthLoading(true);
      setAuthError(null);

      try {
        const result = await signInWithUsernameWorkaround(username, password);

        if (result.error) {
          setAuthError(result.error);
          return { success: false, error: result.error };
        }

        if (result.user) {
          handleSetCurrentUser(result.user);
          return { success: true, user: result.user };
        }

        return { success: false, error: "Failed to load user profile." };
      } catch (err: any) {
        const errMsg = err.message || "An unexpected login error occurred.";
        setAuthError(errMsg);
        return { success: false, error: errMsg };
      } finally {
        setAuthLoading(false);
      }
    },
    [handleSetCurrentUser]
  );

  // Logout handler
  const logout = useCallback(async () => {
    setAuthLoading(true);
    try {
      await signOutSupabaseAuth();
    } catch (err) {
      console.warn("Error signing out:", err);
    } finally {
      handleSetCurrentUser(null);
      setAuthLoading(false);
    }
  }, [handleSetCurrentUser]);

  /* ---------------- Fetch Callbacks ---------------- */

  const refreshMembers = useCallback(async (filter?: string) => {
    try {
      const data = await fetchMembers(filter || chapterFilter);
      setMembers(data);
    } catch (err: any) {
      console.warn("Could not fetch members from Supabase:", err.message);
    }
  }, [chapterFilter]);

  const refreshIncome = useCallback(async (filter?: string) => {
    try {
      const data = await fetchIncome(filter || chapterFilter);
      setIncome(data);
    } catch (err: any) {
      console.warn("Could not fetch income from Supabase:", err.message);
    }
  }, [chapterFilter]);

  const refreshExpenses = useCallback(async (filter?: string) => {
    try {
      const data = await fetchExpense(filter || chapterFilter);
      setExpenses(data);
    } catch (err: any) {
      console.warn("Could not fetch expenses from Supabase:", err.message);
    }
  }, [chapterFilter]);

  const refreshFDs = useCallback(async (filter?: string) => {
    try {
      const data = await fetchFD(filter || chapterFilter);
      setFds(data);
    } catch (err: any) {
      console.warn("Could not fetch FDs from Supabase:", err.message);
    }
  }, [chapterFilter]);

  const refreshAssets = useCallback(async (filter?: string) => {
    try {
      const data = await fetchAssetLiability(filter || chapterFilter);
      setAssets(data);
    } catch (err: any) {
      console.warn("Could not fetch assets from Supabase:", err.message);
    }
  }, [chapterFilter]);

  const refreshLoans = useCallback(async (filter?: string) => {
    try {
      const data = await fetchLoan(filter || chapterFilter);
      setLoans(data);
    } catch (err: any) {
      console.warn("Could not fetch loans from Supabase:", err.message);
    }
  }, [chapterFilter]);

  const refreshChapters = useCallback(async () => {
    try {
      const data = await fetchChapters();
      setChapters(data);
    } catch (err: any) {
      console.warn("Could not fetch chapters from Supabase:", err.message);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.allSettled([
        refreshMembers(),
        refreshIncome(),
        refreshExpenses(),
        refreshFDs(),
        refreshAssets(),
        refreshLoans(),
        refreshChapters(),
      ]);
    } catch (err: any) {
      setError(err.message || "Failed to load Supabase dataset");
    } finally {
      setLoading(false);
    }
  }, [
    refreshMembers,
    refreshIncome,
    refreshExpenses,
    refreshFDs,
    refreshAssets,
    refreshLoans,
    refreshChapters,
  ]);

  // Initial load
  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  /* ---------------- Mutation Callbacks (guarded with RBAC) ---------------- */

  // 1. Members
  const createMember = useCallback(
    async (member: MemberModel) => {
      const created = await insertMember(member, activeUser);
      setMembers((prev) => [...prev, created]);
      return created;
    },
    [activeUser]
  );

  const editMember = useCallback(
    async (memberId: string, updates: Partial<MemberModel>) => {
      const updated = await updateMember(memberId, updates, activeUser);
      setMembers((prev) =>
        prev.map((m) => (m.memberId === memberId ? updated : m))
      );
      return updated;
    },
    [activeUser]
  );

  // 2. Income
  const createIncome = useCallback(
    async (inc: IncomeModel) => {
      const created = await insertIncome(inc, activeUser);
      setIncome((prev) => [created, ...prev]);
      return created;
    },
    [activeUser]
  );

  const editIncome = useCallback(
    async (slNo: number, updates: Partial<IncomeModel>) => {
      const updated = await updateIncome(slNo, updates, activeUser);
      setIncome((prev) =>
        prev.map((item) => (item.slNo === slNo ? updated : item))
      );
      return updated;
    },
    [activeUser]
  );

  // 3. Expense
  const createExpense = useCallback(
    async (exp: ExpenseModel) => {
      const created = await insertExpense(exp, activeUser);
      setExpenses((prev) => [created, ...prev]);
      return created;
    },
    [activeUser]
  );

  const editExpense = useCallback(
    async (slNo: number, updates: Partial<ExpenseModel>) => {
      const updated = await updateExpense(slNo, updates, activeUser);
      setExpenses((prev) =>
        prev.map((item) => (item.slNo === slNo ? updated : item))
      );
      return updated;
    },
    [activeUser]
  );

  // 4. FD
  const createFD = useCallback(
    async (fd: FDModel) => {
      const created = await insertFD(fd, activeUser);
      setFds((prev) => [created, ...prev]);
      return created;
    },
    [activeUser]
  );

  const editFD = useCallback(
    async (slNo: number, updates: Partial<FDModel>) => {
      const updated = await updateFD(slNo, updates, activeUser);
      setFds((prev) =>
        prev.map((item) => (item.slNo === slNo ? updated : item))
      );
      return updated;
    },
    [activeUser]
  );

  // 5. Asset/Liability
  const createAsset = useCallback(
    async (asset: AssetLiabilityModel) => {
      const created = await insertAssetLiability(asset, activeUser);
      setAssets((prev) => [created, ...prev]);
      return created;
    },
    [activeUser]
  );

  const editAsset = useCallback(
    async (assetId: string, updates: Partial<AssetLiabilityModel>) => {
      const updated = await updateAssetLiability(assetId, updates, activeUser);
      setAssets((prev) =>
        prev.map((item) => (item.assetNumberAssetId === assetId ? updated : item))
      );
      return updated;
    },
    [activeUser]
  );

  // 6. Loan
  const createLoan = useCallback(
    async (loan: LoanModel) => {
      const created = await insertLoan(loan, activeUser);
      setLoans((prev) => [created, ...prev]);
      return created;
    },
    [activeUser]
  );

  const editLoan = useCallback(
    async (slNo: number, updates: Partial<LoanModel>) => {
      const updated = await updateLoan(slNo, updates, activeUser);
      setLoans((prev) =>
        prev.map((item) => (item.slNo === slNo ? updated : item))
      );
      return updated;
    },
    [activeUser]
  );

  // 7. Chapter
  const createChapter = useCallback(
    async (chapter: ChapterModel) => {
      const created = await insertChapter(chapter, activeUser);
      setChapters((prev) => [...prev, created]);
      return created;
    },
    [activeUser]
  );

  const editChapter = useCallback(
    async (chapterId: string, updates: Partial<ChapterModel>) => {
      const updated = await updateChapter(chapterId, updates, activeUser);
      setChapters((prev) =>
        prev.map((item) => (item.chapterId === chapterId ? updated : item))
      );
      return updated;
    },
    [activeUser]
  );

  const contextValue = useMemo<SupabaseContextValue>(
    () => ({
      isConfigured: configured,
      loading,
      error,
      currentUser: activeUser,
      setCurrentUser: handleSetCurrentUser,
      authLoading,
      authError,
      loginWithUsername,
      logout,
      members,
      income,
      expenses,
      fds,
      assets,
      loans,
      chapters,
      canWrite,
      refreshAll,
      refreshMembers,
      refreshIncome,
      refreshExpenses,
      refreshFDs,
      refreshAssets,
      refreshLoans,
      refreshChapters,
      createMember,
      editMember,
      createIncome,
      editIncome,
      createExpense,
      editExpense,
      createFD,
      editFD,
      createAsset,
      editAsset,
      createLoan,
      editLoan,
      createChapter,
      editChapter,
    }),
    [
      configured,
      loading,
      error,
      activeUser,
      handleSetCurrentUser,
      authLoading,
      authError,
      loginWithUsername,
      logout,
      members,
      income,
      expenses,
      fds,
      assets,
      loans,
      chapters,
      canWrite,
      refreshAll,
      refreshMembers,
      refreshIncome,
      refreshExpenses,
      refreshFDs,
      refreshAssets,
      refreshLoans,
      refreshChapters,
      createMember,
      editMember,
      createIncome,
      editIncome,
      createExpense,
      editExpense,
      createFD,
      editFD,
      createAsset,
      editAsset,
      createLoan,
      editLoan,
      createChapter,
      editChapter,
    ]
  );

  return (
    <SupabaseDataContext.Provider value={contextValue}>
      {children}
    </SupabaseDataContext.Provider>
  );
};

/**
 * Custom Hook to easily consume Supabase data and auth operations in any component.
 */
export function useSupabaseData(): SupabaseContextValue {
  const context = useContext(SupabaseDataContext);
  if (!context) {
    throw new Error("useSupabaseData must be used within a <SupabaseDataProvider>");
  }
  return context;
}
