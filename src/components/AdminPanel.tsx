/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { User, AccountHead, HeadType } from "../types";
import { USERS } from "../mockData";
import {
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  Database,
  RefreshCw,
  Download,
  Upload,
  Search,
  Key,
  FolderOpen,
  Edit2,
  AlertTriangle,
} from "lucide-react";

interface AdminPanelProps {
  currentUser: User;
  accountHeads: AccountHead[];
  onUpdateAccountHeads: (heads: AccountHead[]) => void;
  users: User[];
  onUpdateUsers: (users: User[]) => void;
  onResetDatabase: () => void;
  onImportDatabase: (data: any) => boolean;
  onExportDatabase: () => void;
}

export default function AdminPanel({
  currentUser,
  accountHeads,
  onUpdateAccountHeads,
  users,
  onUpdateUsers,
  onResetDatabase,
  onImportDatabase,
  onExportDatabase,
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<"heads" | "users" | "backup">("heads");

  // Account Heads state
  const [newHeadName, setNewHeadName] = useState("");
  const [newHeadType, setNewHeadType] = useState<HeadType>(HeadType.Income);
  const [editingHeadId, setEditingHeadId] = useState<string | null>(null);
  const [editingHeadName, setEditingHeadName] = useState("");

  // User Reset Password state
  const [userSearch, setUserSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetMessage, setResetMessage] = useState("");

  // Import State
  const [importError, setImportError] = useState("");
  const [importSuccess, setImportSuccess] = useState(false);

  // Add Account Head
  const handleAddHead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHeadName.trim()) return;

    const id = `head_${Date.now()}`;
    const newHead: AccountHead = {
      id,
      name: newHeadName.trim(),
      type: newHeadType,
      isSystem: false,
      isActive: true,
    };

    onUpdateAccountHeads([...accountHeads, newHead]);
    setNewHeadName("");
  };

  // Toggle Account Head Active status
  const handleToggleHeadActive = (id: string) => {
    const updated = accountHeads.map((head) =>
      head.id === id ? { ...head, isActive: !head.isActive } : head
    );
    onUpdateAccountHeads(updated);
  };

  // Start Edit Account Head
  const startEditHead = (head: AccountHead) => {
    setEditingHeadId(head.id);
    setEditingHeadName(head.name);
  };

  // Save Account Head Edit
  const saveEditHead = (id: string) => {
    if (!editingHeadName.trim()) return;
    const updated = accountHeads.map((head) =>
      head.id === id ? { ...head, name: editingHeadName.trim() } : head
    );
    onUpdateAccountHeads(updated);
    setEditingHeadId(null);
  };

  // Delete Account Head (only non-system ones)
  const handleDeleteHead = (id: string) => {
    const head = accountHeads.find((h) => h.id === id);
    if (head?.isSystem) {
      alert("System default categories cannot be deleted, but they can be disabled.");
      return;
    }
    const updated = accountHeads.filter((h) => h.id !== id);
    onUpdateAccountHeads(updated);
  };

  // Reset password for a user
  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !newPassword.trim()) return;

    const updatedUsers = users.map((u) =>
      u.username === selectedUser.username ? { ...u, password: newPassword.trim() } : u
    );

    onUpdateUsers(updatedUsers);
    setResetMessage(`Password successfully reset for ${selectedUser.name}!`);
    setNewPassword("");
    // Refresh selected user context in screen
    setSelectedUser({ ...selectedUser, password: newPassword.trim() });
    setTimeout(() => setResetMessage(""), 4000);
  };

  // Import JSON Database
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError("");
    setImportSuccess(false);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const success = onImportDatabase(parsed);
        if (success) {
          setImportSuccess(true);
        } else {
          setImportError("Invalid data format in JSON. Make sure the schema matches.");
        }
      } catch (err) {
        setImportError("Error parsing JSON file. Please check file integrity.");
      }
    };
    reader.readAsText(file);
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.designation.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden font-sans">
      <div className="bg-slate-50/50 p-6 text-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
            <Key className="h-5 w-5 text-blue-600" />
            System Control Panel
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Access: {currentUser.role} | Organization level: {currentUser.level}
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/50">
          <button
            onClick={() => setActiveTab("heads")}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
              activeTab === "heads" ? "bg-white text-blue-700 shadow-xs font-semibold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Account Heads
          </button>
          {currentUser.role === "Admin" && (
            <>
              <button
                onClick={() => setActiveTab("users")}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                  activeTab === "users" ? "bg-white text-blue-700 shadow-xs font-semibold" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Password Reset
              </button>
              <button
                onClick={() => setActiveTab("backup")}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                  activeTab === "backup" ? "bg-white text-blue-700 shadow-xs font-semibold" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Database Admin
              </button>
            </>
          )}
        </div>
      </div>

      <div className="p-6">
        {/* TAB 1: ACCOUNT HEADS MANAGEMENT */}
        {activeTab === "heads" && (
          <div className="space-y-6">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-md font-bold text-slate-800">Income & Expense Heads</h3>
                <p className="text-slate-500 text-xs mt-0.5">
                  View, add, disable or edit the heads used in transactions.
                </p>
              </div>
            </div>

            {/* Quick Add Form */}
            <form onSubmit={handleAddHead} className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1 w-full">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  value={newHeadName}
                  onChange={(e) => setNewHeadName(e.target.value)}
                  placeholder="e.g. CSR Grants"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div className="w-full sm:w-48">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Category Type
                </label>
                <select
                  value={newHeadType}
                  onChange={(e) => setNewHeadType(e.target.value as HeadType)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value={HeadType.Income}>Income Head</option>
                  <option value={HeadType.Expense}>Expense Head</option>
                </select>
              </div>

              <button
                type="submit"
                id="add-head-submit"
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-4 py-2 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors shrink-0"
              >
                <Plus className="h-4.5 w-4.5" />
                Add Head
              </button>
            </form>

            {/* Heads Table */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Income Heads */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50/50 border-b border-slate-200 px-4 py-3">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                    Income Heads
                  </h4>
                </div>
                <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                  {accountHeads
                    .filter((h) => h.type === HeadType.Income)
                    .map((head) => (
                      <div key={head.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                        <div className="flex-1 mr-3">
                          {editingHeadId === head.id ? (
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={editingHeadName}
                                onChange={(e) => setEditingHeadName(e.target.value)}
                                className="px-2 py-1 text-sm border border-blue-500 rounded-md focus:outline-hidden"
                                autoFocus
                              />
                              <button
                                onClick={() => saveEditHead(head.id)}
                                className="px-2.5 py-1 text-xs bg-blue-600 text-white rounded-md cursor-pointer"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingHeadId(null)}
                                className="px-2.5 py-1 text-xs bg-slate-200 text-slate-700 rounded-md cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-medium ${head.isActive ? "text-slate-800" : "text-slate-400 line-through"}`}>
                                {head.name}
                              </span>
                              {head.isSystem && (
                                <span className="text-[10px] bg-blue-50 text-blue-700 font-semibold px-1.5 py-0.5 rounded-full">
                                  Default
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {editingHeadId !== head.id && (
                            <>
                              <button
                                onClick={() => startEditHead(head)}
                                className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-700 rounded-lg cursor-pointer transition-colors"
                                title="Edit Head Name"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleToggleHeadActive(head.id)}
                                className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                                  head.isActive
                                    ? "hover:bg-slate-100 text-blue-600"
                                    : "hover:bg-slate-100 text-slate-400"
                                }`}
                                title={head.isActive ? "Disable Head" : "Enable Head"}
                              >
                                {head.isActive ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                              </button>
                              {!head.isSystem && (
                                <button
                                  onClick={() => handleDeleteHead(head.id)}
                                  className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-700 rounded-lg cursor-pointer transition-colors"
                                  title="Delete Head"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Expense Heads */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50/50 border-b border-slate-200 px-4 py-3">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-rose-500 rounded-full" />
                    Expense Heads
                  </h4>
                </div>
                <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                  {accountHeads
                    .filter((h) => h.type === HeadType.Expense)
                    .map((head) => (
                      <div key={head.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                        <div className="flex-1 mr-3">
                          {editingHeadId === head.id ? (
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={editingHeadName}
                                onChange={(e) => setEditingHeadName(e.target.value)}
                                className="px-2 py-1 text-sm border border-blue-500 rounded-md focus:outline-hidden"
                                autoFocus
                              />
                              <button
                                onClick={() => saveEditHead(head.id)}
                                className="px-2.5 py-1 text-xs bg-blue-600 text-white rounded-md cursor-pointer"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingHeadId(null)}
                                className="px-2.5 py-1 text-xs bg-slate-200 text-slate-700 rounded-md cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-medium ${head.isActive ? "text-slate-800" : "text-slate-400 line-through"}`}>
                                {head.name}
                              </span>
                              {head.isSystem && (
                                <span className="text-[10px] bg-blue-50 text-blue-700 font-semibold px-1.5 py-0.5 rounded-full">
                                  Default
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {editingHeadId !== head.id && (
                            <>
                              <button
                                onClick={() => startEditHead(head)}
                                className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-700 rounded-lg cursor-pointer transition-colors"
                                title="Edit Head Name"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleToggleHeadActive(head.id)}
                                className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                                  head.isActive
                                    ? "hover:bg-slate-100 text-blue-600"
                                    : "hover:bg-slate-100 text-slate-400"
                                }`}
                                title={head.isActive ? "Disable Head" : "Enable Head"}
                              >
                                {head.isActive ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                              </button>
                              {!head.isSystem && (
                                <button
                                  onClick={() => handleDeleteHead(head.id)}
                                  className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-700 rounded-lg cursor-pointer transition-colors"
                                  title="Delete Head"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: USER PASSWORD RESET (Admin Only) */}
        {activeTab === "users" && currentUser.role === "Admin" && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-md font-bold text-slate-800">User Account Reset Panel</h3>
              <p className="text-slate-500 text-xs mt-0.5">
                Review users and reset passwords to enable login or recover credentials.
              </p>
            </div>

            {resetMessage && (
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-md">
                <p className="text-sm text-blue-800 font-medium">{resetMessage}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* User list */}
              <div className="md:col-span-2 space-y-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search users..."
                    className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-96 overflow-y-auto">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.username}
                      onClick={() => setSelectedUser(user)}
                      className={`p-3.5 flex items-center justify-between cursor-pointer transition-colors ${
                        selectedUser?.username === user.username ? "bg-blue-50/70" : "hover:bg-slate-50"
                      }`}
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{user.name}</p>
                        <p className="text-xs text-slate-500">
                          {user.designation} • Username: <span className="font-mono bg-slate-100 px-1 py-0.5 rounded-sm">{user.username}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] bg-slate-200 text-slate-800 font-semibold px-2 py-0.5 rounded-full uppercase">
                          {user.level}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-1">Role: {user.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reset Box */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 self-start">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mb-3">
                  <Key className="h-4.5 w-4.5 text-blue-600" />
                  Credentials Manager
                </h4>

                {selectedUser ? (
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div>
                      <p className="text-xs text-slate-500">Selected Account</p>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">{selectedUser.name}</p>
                      <p className="text-xs text-blue-700 font-mono mt-0.5">@{selectedUser.username}</p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                        New Password
                      </label>
                      <input
                        type="text"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter custom password"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs py-2 px-4 rounded-lg cursor-pointer transition-colors"
                    >
                      Reset Password
                    </button>
                  </form>
                ) : (
                  <div className="text-center py-6">
                    <FolderOpen className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-400">Select a user from the list to reset password.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: BACKUP & DATABASE (Admin Only) */}
        {activeTab === "backup" && currentUser.role === "Admin" && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-md font-bold text-slate-800">Database & State Control</h3>
              <p className="text-slate-500 text-xs mt-0.5">
                Export/Import state or wipe databases back to clean mock templates for demonstrative safety.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Backups Panel */}
              <div className="p-5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-4">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Database className="h-4.5 w-4.5 text-blue-600" />
                  Backup & Export
                </h4>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Export the complete state of users, account heads, and recorded transactions as a standardized JSON file. This can be stored as a backup and restored at any time.
                </p>

                <button
                  onClick={onExportDatabase}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs px-4 py-2.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                >
                  <Download className="h-4 w-4" />
                  Export Database (JSON)
                </button>
              </div>

              {/* Restore Panel */}
              <div className="p-5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-4">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Upload className="h-4.5 w-4.5 text-blue-600" />
                  Restore State
                </h4>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Upload a previously exported database JSON file. Warning: This action will replace all current ledger records and configurations.
                </p>

                <div className="relative">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportFile}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    id="import-upload-input"
                  />
                  <div className="bg-white border border-dashed border-slate-300 rounded-lg p-4 text-center hover:border-blue-500 transition-colors">
                    <Upload className="h-6 w-6 text-slate-400 mx-auto mb-1" />
                    <span className="text-xs font-semibold text-slate-600 block">Click to upload JSON backup</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Only accept standard backup files</span>
                  </div>
                </div>

                {importSuccess && (
                  <p className="text-xs font-semibold text-blue-700 flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5" /> Database state restored successfully!
                  </p>
                )}
                {importError && (
                  <p className="text-xs font-semibold text-red-600 flex items-center gap-1">
                    <XCircle className="h-3.5 w-3.5" /> {importError}
                  </p>
                )}
              </div>
            </div>

            {/* Wipe & Reset Database */}
            <div className="bg-red-50/50 border border-red-200 rounded-2xl p-5 mt-6 space-y-3">
              <h4 className="text-sm font-bold text-red-950 flex items-center gap-1.5">
                <AlertTriangle className="h-4.5 w-4.5 text-red-700" />
                Factory Data Reset
              </h4>
              <p className="text-red-900/80 text-xs leading-relaxed">
                Resetting the database wipes all newly added chapters, account heads, users, or transactions, and restores the pristine default multi-chapter demo database state. This is perfect if you would like to start the demonstration fresh.
              </p>
              <button
                onClick={() => {
                  if (confirm("Are you sure you want to restore the default demo data? All custom transactions will be lost.")) {
                    onResetDatabase();
                    alert("Database reset to pristine default demo state!");
                  }
                }}
                className="bg-red-750 hover:bg-red-800 text-white font-medium text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reload Default Demo Data
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
