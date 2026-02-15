"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useDatabase } from "@/hooks/useDatabase";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorDisplay from "@/components/ErrorDisplay";
import TableList from "@/components/TableList";
import TableView from "@/components/TableView";

export default function TableExplorer() {
  const router = useRouter();
  const {
    status,
    errorMessage,
    tables,
    selectedTable,
    tableData,
    loadingData,
    initializeConnection,
    selectTable,
  } = useDatabase();

  useEffect(() => {
    const password = sessionStorage.getItem("APP_PASSWORD");

    if (!password) {
      router.push("/setup");
      return;
    }

    // Initialize connection and fetch tables
    initializeConnection(password).then((success) => {
      if (!success) {
        // If authentication failed, clear session and redirect
        sessionStorage.clear();
        setTimeout(() => router.push("/setup"), 2000);
      }
    });
  }, [router, initializeConnection]);

  const handleLogout = () => {
    sessionStorage.clear();
    router.push("/setup");
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 font-sans p-4">
      <div className="w-full max-w-7xl mx-auto">
        {/* Header */}
        <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b-4 border-cyan-500 dark:border-cyan-600 rounded-lg shadow-xl p-6 mb-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors font-medium"
              >
                ← Dashboard
              </Link>
              <h1 className="text-2xl font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">
                Table Explorer
              </h1>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 border-2 border-cyan-500 dark:border-cyan-600 text-cyan-700 dark:text-cyan-400 rounded-md font-medium hover:bg-cyan-50 dark:hover:bg-cyan-950/30 transition-colors text-sm"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Loading State */}
        {status === "loading" && (
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-lg shadow-xl p-8">
            <LoadingSpinner />
          </div>
        )}

        {/* Error State */}
        {status === "error" && <ErrorDisplay message={errorMessage} />}

        {/* Connected State - Show Tables */}
        {status === "connected" && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Sidebar - Table List */}
            <aside className="lg:col-span-1">
              <TableList
                tables={tables}
                selectedTable={selectedTable}
                onTableSelect={selectTable}
              />
            </aside>

            {/* Main Content - Table Data */}
            <main className="lg:col-span-3">
              <TableView tableData={tableData} loading={loadingData} />
            </main>
          </div>
        )}
      </div>
    </div>
  );
}
