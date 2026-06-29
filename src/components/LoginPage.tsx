/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { User, ShieldAlert, Sparkles, AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { motion } from "motion/react";

interface LoginPageProps {
  onLogin: (email: string, name: string, isAnonymous: boolean) => Promise<void>;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [isPending, setIsPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email.trim()) {
      setErrorMsg("Please enter an email address.");
      return;
    }

    if (!email.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    setIsPending(true);
    try {
      // Name fallback from email
      const calculatedName = name.trim() || email.split("@")[0];
      await onLogin(email.toLowerCase().trim(), calculatedName, false);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to authenticate.");
    } finally {
      setIsPending(false);
    }
  };

  const handleAnonymousLogin = async () => {
    setErrorMsg("");
    setIsPending(true);
    try {
      await onLogin("", "", true);
    } catch (err: any) {
      setErrorMsg("Failed to start anonymous session.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col justify-center min-h-[85vh] px-4 text-white" id="login-splash-screen">
      {/* App branding */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#39FF14] shadow-xl shadow-brand/20 mb-3 border border-brand/30"
        >
          <span className="text-2xl font-black text-[#0A0A0A] font-mono">GZ</span>
        </motion.div>
        
        <h1 className="text-2xl font-black tracking-tight text-white font-sans uppercase">
          GROUND<span className="text-brand">ZERO</span>
        </h1>
        <p className="text-[10px] text-gray-400 font-mono tracking-widest uppercase mt-1">
          LIVE NEWS BY THE PEOPLE, FOR THE PEOPLE
        </p>
      </div>

      {/* Main card */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-[#0A0A0A]/95 border border-gray-800 rounded-xl p-6 shadow-2xl backdrop-blur"
      >
        <h2 className="text-sm font-bold font-mono text-gray-400 mb-4 uppercase tracking-wider text-center">
          Access GroundZero Grid
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Email input */}
          <div>
            <label className="block text-[9px] font-mono uppercase tracking-wider text-gray-500 mb-1">
              EMAIL ADDRESS
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="citizen@groundzero.news"
              required
              disabled={isPending}
              className="w-full px-3 py-2 text-xs bg-[#0A0A0A] border border-gray-800 rounded-lg text-white placeholder-gray-700 focus:outline-none focus:border-brand/50"
              id="login-email-input"
            />
          </div>

          {/* Full Name input (Optional) */}
          <div>
            <label className="block text-[9px] font-mono uppercase tracking-wider text-gray-500 mb-1">
              FULL NAME (OPTIONAL)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Rahul Sharma"
              disabled={isPending}
              className="w-full px-3 py-2 text-xs bg-[#0A0A0A] border border-gray-800 rounded-lg text-white placeholder-gray-700 focus:outline-none focus:border-brand/50"
              id="login-name-input"
            />
          </div>

          {/* Password input */}
          <div>
            <label className="block text-[9px] font-mono uppercase tracking-wider text-gray-500 mb-1">
              PASSWORD (SIMULATED SECURE)
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                disabled={isPending}
                className="w-full pl-3 pr-10 py-2 text-xs bg-[#0A0A0A] border border-gray-800 rounded-lg text-white placeholder-gray-700 focus:outline-none focus:border-brand/50"
                id="login-password-input"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-2 p-0.5 text-gray-500 hover:text-gray-300 transition-colors"
                id="login-toggle-pass-btn"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-2 bg-red-600/10 border border-red-500/30 rounded-lg text-[10px] text-red-400 flex items-center gap-1.5 font-sans">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full py-2.5 bg-brand hover:bg-[#32e011] text-[#0A0A0A] font-black rounded-lg text-xs tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-brand/20 uppercase cursor-pointer"
            id="login-submit-btn"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#0A0A0A]" />
            ) : (
              <span>VERIFY & ENTER GRID</span>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-5 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-800"></div>
          </div>
          <span className="relative px-3 bg-[#0A0A0A] text-[9px] text-gray-500 font-mono uppercase">OR</span>
        </div>

        {/* Anonymous login option */}
        <button
          onClick={handleAnonymousLogin}
          disabled={isPending}
          className="w-full py-2.5 bg-[#0A0A0A] border border-gray-800 hover:border-gray-700 text-gray-300 hover:text-white font-bold rounded-lg text-xs transition-all flex items-center justify-center gap-2 uppercase tracking-wide cursor-pointer"
          id="login-anonymous-btn"
        >
          <span className="text-brand">🛡️</span>
          <span>ENTER ANONYMOUSLY</span>
        </button>
      </motion.div>

      {/* Footer statistics decoration */}
      <div className="text-center mt-6 text-[9px] text-gray-600 font-mono tracking-wide flex flex-col gap-1">
        <p>● SECURE SHIELD ACTIVE (AES-256)</p>
        <p>GROUNDZERO © 2026 RADAR OPERATIONS</p>
      </div>
    </div>
  );
}
