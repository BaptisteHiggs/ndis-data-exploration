"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDatabase } from "@/hooks/useDatabase";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorDisplay from "@/components/ErrorDisplay";
import TableList from "@/components/TableList";
import TableView from "@/components/TableView";

export default function Home() {
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
    <div className="flex min-h-screen bg-zinc-50 font-sans dark:bg-black p-4">
      <div className="w-full max-w-7xl mx-auto">
        {/* Header */}
        <header className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6 mb-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
              Database Explorer
            </h1>
            <button
              onClick={handleLogout}
              className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 text-black dark:text-zinc-50 rounded-md font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-sm"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Loading State */}
        {status === "loading" && (
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-8">
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
