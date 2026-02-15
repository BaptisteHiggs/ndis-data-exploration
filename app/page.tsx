"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorDisplay from "@/components/ErrorDisplay";
import DataStory from "@/components/DataStory";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [data, setData] = useState<any[]>([]);
  const [tables, setTables] = useState<string[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const password = sessionStorage.getItem("APP_PASSWORD");

      if (!password) {
        router.push("/setup");
        return;
      }

      try {
        setLoading(true);

        // Fetch both dashboard data and table names in parallel
        const [dataResponse, tablesResponse] = await Promise.all([
          fetch("/api/dashboard-data", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password }),
          }),
          fetch("/api/list-tables", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password }),
          }),
        ]);

        const dataResult = await dataResponse.json();
        const tablesResult = await tablesResponse.json();

        if (!dataResponse.ok) {
          if (dataResponse.status === 401) {
            sessionStorage.clear();
            router.push("/setup");
            return;
          }
          setError(dataResult.error || "Failed to load dashboard data");
        } else {
          setData(dataResult.data || []);
          setTables(tablesResult.tables || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [router]);

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
            <h1 className="text-2xl font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">
              NDIS Data Story
            </h1>
            <div className="flex gap-3">
              <Link
                href="/table"
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-md font-medium shadow-lg shadow-cyan-500/30 transition-all text-sm"
              >
                View Tables
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 border-2 border-cyan-500 dark:border-cyan-600 text-cyan-700 dark:text-cyan-400 rounded-md font-medium hover:bg-cyan-50 dark:hover:bg-cyan-950/30 transition-colors text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Loading State */}
        {loading && (
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-lg shadow-xl p-8">
            <LoadingSpinner />
          </div>
        )}

        {/* Error State */}
        {error && !loading && <ErrorDisplay message={error} />}

        {/* Data Story */}
        {!loading && !error && <DataStory data={data} tables={tables} />}
      </div>
    </div>
  );
}
