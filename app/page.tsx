"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorDisplay from "@/components/ErrorDisplay";
import Dashboard from "@/components/Dashboard";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const password = sessionStorage.getItem("APP_PASSWORD");

      if (!password) {
        router.push("/setup");
        return;
      }

      try {
        setLoading(true);
        const response = await fetch("/api/dashboard-data", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ password }),
        });

        const result = await response.json();

        if (!response.ok) {
          if (response.status === 401) {
            sessionStorage.clear();
            router.push("/setup");
            return;
          }
          setError(result.error || "Failed to load dashboard data");
        } else {
          setData(result.data || []);
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
    <div className="flex min-h-screen bg-zinc-50 font-sans dark:bg-black p-4">
      <div className="w-full max-w-7xl mx-auto">
        {/* Header */}
        <header className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6 mb-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
              NDIS Data Dashboard
            </h1>
            <div className="flex gap-3">
              <Link
                href="/table"
                className="px-4 py-2 bg-black dark:bg-zinc-50 text-white dark:text-black rounded-md font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors text-sm"
              >
                View Tables
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 text-black dark:text-zinc-50 rounded-md font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Loading State */}
        {loading && (
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-8">
            <LoadingSpinner />
          </div>
        )}

        {/* Error State */}
        {error && !loading && <ErrorDisplay message={error} />}

        {/* Dashboard */}
        {!loading && !error && <Dashboard data={data} />}
      </div>
    </div>
  );
}
