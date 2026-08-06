/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { User } from "../types";
import { USERS } from "../mockData";
import { Lock, UserCheck, Shield, KeyRound, AlertCircle } from "lucide-react";

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedUsername = username.trim().toLowerCase();
    const foundUser = USERS.find(
      (u) => u.username === trimmedUsername && u.password === password
    );

    if (foundUser) {
      onLoginSuccess(foundUser);
    } else {
      setError("Invalid username or password.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-md border border-blue-500">
            <Shield className="h-9 w-9 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-slate-900 font-sans">
          IHMA FinApp
        </h2>
        <p className="mt-2 text-center text-base font-semibold text-slate-800">
          Indian Homeopathic Medical Association
        </p>
        <p className="text-center text-xs text-slate-500 font-medium mt-0.5">
          (Finance Portal)
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md" id="login-container">
        <div className="bg-white py-8 px-4 shadow-md sm:rounded-2xl sm:px-10 border border-slate-200">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start gap-2.5">
                <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <span className="text-sm text-red-700 font-medium">{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-700">
                Username
              </label>
              <div className="mt-1.5 relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserCheck className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-slate-900"
                  placeholder="e.g. cochin_treasurer"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="mt-1.5 relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-slate-900"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                id="login-submit-button"
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-xs text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer transition-colors"
              >
                Sign In
              </button>
            </div>
          </form>

          {/* General Accounts Help Panel */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <h3 className="font-bold text-slate-700 flex items-center gap-1.5 mb-3 text-[11px] uppercase tracking-wider">
              <KeyRound className="h-3.5 w-3.5 text-blue-600" />
              General Accounts (Click to Autofill)
            </h3>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  setUsername("cochin_treasurer");
                  setPassword("pass");
                }}
                className="w-full text-left p-2.5 bg-slate-50 hover:bg-blue-50/50 border border-slate-200/60 hover:border-blue-200 rounded-xl transition-all cursor-pointer flex justify-between items-center group"
              >
                <div>
                  <span className="font-semibold text-slate-900 block text-xs group-hover:text-blue-700 transition-colors">Cochin Chapter Treasurer</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Full Editor: can add & edit ledger entries</span>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <span className="font-mono bg-white border border-slate-200 text-slate-600 group-hover:border-blue-100 group-hover:text-blue-700 px-2 py-0.5 rounded text-[10px] block font-medium">cochin_treasurer</span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Password: pass</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setUsername("national_pres");
                  setPassword("pass");
                }}
                className="w-full text-left p-2.5 bg-slate-50 hover:bg-blue-50/50 border border-slate-200/60 hover:border-blue-200 rounded-xl transition-all cursor-pointer flex justify-between items-center group"
              >
                <div>
                  <span className="font-semibold text-slate-900 block text-xs group-hover:text-blue-700 transition-colors">National President</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Viewer: can view all levels of organization</span>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <span className="font-mono bg-white border border-slate-200 text-slate-600 group-hover:border-blue-100 group-hover:text-blue-700 px-2 py-0.5 rounded text-[10px] block font-medium">national_pres</span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Password: pass</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setUsername("admin");
                  setPassword("admin");
                }}
                className="w-full text-left p-2.5 bg-slate-50 hover:bg-blue-50/50 border border-slate-200/60 hover:border-blue-200 rounded-xl transition-all cursor-pointer flex justify-between items-center group"
              >
                <div>
                  <span className="font-semibold text-slate-900 block text-xs group-hover:text-blue-700 transition-colors">System Administrator</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Admin: manage organization levels & heads</span>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <span className="font-mono bg-white border border-slate-200 text-slate-600 group-hover:border-blue-100 group-hover:text-blue-700 px-2 py-0.5 rounded text-[10px] block font-medium">admin</span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Password: admin</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
