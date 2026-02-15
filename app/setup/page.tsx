"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function Setup() {
  const router = useRouter();
  const [password, setPassword] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (password) {
      sessionStorage.setItem("APP_PASSWORD", password);
      router.push("/");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 font-sans">
      <main className="w-full max-w-md p-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-lg shadow-2xl border-2 border-cyan-200 dark:border-cyan-900/50">
        <h1 className="text-2xl font-semibold mb-6 bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">
          Access Required
        </h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-3 py-2 border-2 border-cyan-300 dark:border-cyan-800 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 focus:border-cyan-500 dark:focus:border-cyan-600 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-md font-medium shadow-lg shadow-cyan-500/30 transition-all"
          >
            Connect
          </button>
        </form>
        <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
          Your password is stored in your browser session and will be cleared when you close the browser.
        </p>
      </main>
    </div>
  );
}
