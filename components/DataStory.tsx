"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import NarrativeSection from "./NarrativeSection";

interface DataStoryProps {
  data: any[];
  sessionsData: any[];
  tables: string[];
}

export default function DataStory({ data, sessionsData, tables }: DataStoryProps) {
  // Sample aggregations for storytelling
  const invoiceStats = useMemo(() => {
    if (!data || data.length === 0) return null;

    const totalInvoices = data.length;

    // Try to find amount/value column
    const numericColumns = Object.keys(data[0]).filter((col) => {
      const value = data[0][col];
      return typeof value === "number" && !col.toLowerCase().includes("id");
    });

    let totalAmount = 0;
    if (numericColumns.length > 0) {
      totalAmount = data.reduce((sum, row) => sum + (row[numericColumns[0]] || 0), 0);
    }

    let individualsHelped = 0;
    const participantIdCol = Object.keys(data[0]).find((col) =>
      col.toLowerCase().includes("participant") && col.toLowerCase().includes("id")
    );

    if (participantIdCol) {
      const uniqueParticipants = new Set();
      data.forEach((row) => {
        if (row[participantIdCol]) {
          uniqueParticipants.add(row[participantIdCol]);
        }
      });
      individualsHelped = uniqueParticipants.size;
    }

    return { totalInvoices, totalAmount, individualsHelped }; // Assuming 1 invoice per individual for simplicity
  }, [data]);

  // Create monthly trend data
  const monthlyTrend = useMemo(() => {
    if (!data || data.length === 0) return [];

    const dateCol = Object.keys(data[0]).find(
      (col) =>
        col.toLowerCase().includes("invoice_date")
    );

    if (!dateCol) return [];

    const monthCounts: Record<string, number> = {};
    console.log("DATA:", data)
    data.forEach((row) => {
      if (row[dateCol]) {
        const date = new Date(row[dateCol]);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
      }
    });

    return Object.entries(monthCounts)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month))
  }, [data]);

  // Distribution of invoices per customer
  const invoicesPerCustomer = useMemo(() => {
    if (!data || data.length === 0) return [];

    const participantIdCol = Object.keys(data[0]).find((col) =>
      col.toLowerCase().includes("participant") && col.toLowerCase().includes("id")
    );

    if (!participantIdCol) return [];

    // Count invoices per participant
    const participantCounts: Record<string, number> = {};
    data.forEach((row) => {
      if (row[participantIdCol]) {
        const id = row[participantIdCol];
        participantCounts[id] = (participantCounts[id] || 0) + 1;
      }
    });

    // Create distribution buckets
    const distribution: Record<string, number> = {};
    Object.values(participantCounts).forEach((count) => {
      let bucket = "";
      if (count === 1) bucket = "1";
      else if (count === 2) bucket = "2";
      else if (count <= 5) bucket = "3-5";
      else if (count <= 10) bucket = "6-10";
      else bucket = "11+";

      distribution[bucket] = (distribution[bucket] || 0) + 1;
    });

    const order = ["1", "2", "3-5", "6-10", "11+"];
    return order
      .filter((bucket) => distribution[bucket])
      .map((bucket) => ({ bucket, count: distribution[bucket] }));
  }, [data]);

  // Distribution of $ per invoice
  const invoiceValueDistribution = useMemo(() => {
    if (!data || data.length === 0) return [];

    const numericColumns = Object.keys(data[0]).filter((col) => {
      const value = data[0][col];
      return typeof value === "number" && !col.toLowerCase().includes("id");
    });

    if (numericColumns.length === 0) return [];

    const valueCol = numericColumns[0];
    const distribution: Record<string, number> = {};

    data.forEach((row) => {
      const value = row[valueCol] || 0;
      let bucket = "";
      if (value < 300) bucket = "$0-$300";
      else if (value < 1000) bucket = "$300-$1k";
      else if (value < 5000) bucket = "$1k-$5k";
      else if (value < 10000) bucket = "$5k-$10k";
      else if (value < 20000) bucket = "$10k-$20k";
      else bucket = "$20k+";

      distribution[bucket] = (distribution[bucket] || 0) + 1;
    });

    const order = ["$0-$300", "$300-$1k", "$1k-$5k", "$5k-$10k", "$10k-$20k", "$20k+"];
    return order
      .filter((bucket) => distribution[bucket])
      .map((bucket) => ({ bucket, count: distribution[bucket] }));
  }, [data]);

  // Helper function to create time-based distribution
  const createTimeDistribution = (data: any[], columnName: string) => {
    const order = ["0-30s", "30-60s", "1-5m", "5-10m", "10-30m", "30m+"];

    if (!data || data.length === 0) {
      // Return all buckets with 0 count to maintain consistency
      return order.map((bucket) => ({ bucket, count: 0 }));
    }

    const distribution: Record<string, number> = {};

    // Initialize all buckets with 0
    order.forEach((bucket) => {
      distribution[bucket] = 0;
    });

    data.forEach((row) => {
      const seconds = row[columnName] || 0;
      let bucket = "";
      if (seconds < 30) bucket = "0-30s";
      else if (seconds < 60) bucket = "30-60s";
      else if (seconds < 300) bucket = "1-5m";
      else if (seconds < 600) bucket = "5-10m";
      else if (seconds < 1800) bucket = "10-30m";
      else bucket = "30m+";

      distribution[bucket] = (distribution[bucket] || 0) + 1;
    });

    // Return all buckets in order, even if count is 0
    return order.map((bucket) => ({ bucket, count: distribution[bucket] }));
  };

  // Duration distributions from invoice_view_sessions
  const durationDistribution = useMemo(() => {
    return createTimeDistribution(sessionsData, "duration_seconds");
  }, [sessionsData]);

  const activeDurationDistribution = useMemo(() => {
    return createTimeDistribution(sessionsData, "active_duration_seconds");
  }, [sessionsData]);

  const engagedDurationDistribution = useMemo(() => {
    return createTimeDistribution(sessionsData, "engaged_duration_seconds");
  }, [sessionsData]);

  // Sessions per invoice distribution
  const sessionsPerInvoice = useMemo(() => {
    if (!sessionsData || sessionsData.length === 0) return [];

    // Find the invoice ID column
    const invoiceIdCol = Object.keys(sessionsData[0]).find((col) =>
      col.toLowerCase().includes("invoice") && col.toLowerCase().includes("id")
    );

    if (!invoiceIdCol) return [];

    // Count sessions per invoice
    const sessionCounts: Record<string, number> = {};
    sessionsData.forEach((row) => {
      if (row[invoiceIdCol]) {
        const id = row[invoiceIdCol];
        sessionCounts[id] = (sessionCounts[id] || 0) + 1;
      }
    });

    // Create distribution buckets
    const distribution: Record<string, number> = {};
    Object.values(sessionCounts).forEach((count) => {
      let bucket = "";
      if (count === 1) bucket = "1";
      else if (count === 2) bucket = "2";
      else if (count <= 5) bucket = "3-5";
      else if (count <= 10) bucket = "6-10";
      else bucket = "11+";

      distribution[bucket] = (distribution[bucket] || 0) + 1;
    });

    const order = ["1", "2", "3-5", "6-10", "11+"];
    return order
      .filter((bucket) => distribution[bucket])
      .map((bucket) => ({ bucket, count: distribution[bucket] }));
  }, [sessionsData]);

  return (
    <div className="space-y-8">
      {/* Introduction */}
      <NarrativeSection>
        <div className="prose prose-zinc dark:prose-invert max-w-none">
          <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-300">
            Hi. I'm <span className="font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">Baptiste</span>.
          </p>
          <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-300">
            We'll be exploring the data behind{" "}
            <span className="font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">NDIS plan management</span>.
          </p>
          <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-300">
            In the data, there are <span className="font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">{tables.length} tables</span>:
          </p>
        </div>
      </NarrativeSection>

      {/* Table Names Display */}
      <NarrativeSection>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {tables.map((table, index) => (
            <div
              key={table}
              className="group relative overflow-hidden rounded-lg border-2 border-cyan-200 dark:border-cyan-900/50 p-6 hover:border-cyan-500 dark:hover:border-cyan-600 hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-300 bg-gradient-to-br from-white to-cyan-50/30 dark:from-slate-800 dark:to-cyan-950/30"
            >
              <div className="absolute top-2 left-2 text-4xl font-bold text-cyan-100/50 dark:text-cyan-900/50">
                {index + 1}
              </div>
              <div className="relative z-10">
                <p className="text-sm font-mono text-cyan-600 dark:text-cyan-400 mb-1">
                  TABLE {index + 1}
                </p>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-50 break-words">
                  {table}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </NarrativeSection>

      {/* Story Section 1: Overview */}
      <NarrativeSection>
        <div className="prose prose-zinc dark:prose-invert max-w-none mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent mb-4">
            The Big Picture
          </h2>
          <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-300">
            Each of these tables provide different pieces of valuable information. To give some context:
          </p>
        </div>

        {invoiceStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-gradient-to-br from-cyan-500 to-blue-500 dark:from-cyan-600 dark:to-blue-600 rounded-lg p-8 text-center shadow-lg shadow-cyan-500/30">
              <p className="text-sm uppercase tracking-wide text-cyan-100 dark:text-cyan-200 mb-2">
                participants
              </p>
              <p className="text-5xl font-bold text-white">
                {invoiceStats.individualsHelped.toLocaleString()}
              </p>
              <p className="text-sm text-cyan-100 dark:text-cyan-200 mt-2">
                individuals helped
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-indigo-500 dark:from-blue-600 dark:to-indigo-600 rounded-lg p-8 text-center shadow-lg shadow-blue-500/30">
              <p className="text-sm uppercase tracking-wide text-blue-100 dark:text-blue-200 mb-2">
                Total Invoices
              </p>
              <p className="text-5xl font-bold text-white">
                {invoiceStats.totalInvoices.toLocaleString()}
              </p>
              <p className="text-sm text-blue-100 dark:text-blue-200 mt-2">
                records in the system
              </p>
            </div>
            <div className="bg-gradient-to-br from-indigo-500 to-purple-500 dark:from-indigo-600 dark:to-purple-600 rounded-lg p-8 text-center shadow-lg shadow-indigo-500/30">
              <p className="text-sm uppercase tracking-wide text-indigo-100 dark:text-indigo-200 mb-2">
                Total Value
              </p>
              <p className="text-5xl font-bold text-white">
                ${(invoiceStats.totalAmount / 1000).toFixed(1)}k
              </p>
              <p className="text-sm text-indigo-100 dark:text-indigo-200 mt-2">
                in managed funds
              </p>
            </div>
          </div>
        )}
      </NarrativeSection>

      {/* Story Section 2: Trends */}
      {monthlyTrend.length > 0 && (
        <>
        <NarrativeSection>
          <div className="prose prose-zinc dark:prose-invert max-w-none mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent mb-4">
              All is not equal
            </h2>
            <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-300">
              At first, it may look like there are about 2 invoices per participant, and each invoice is for about $600. But looking at the data helps us see the real story:


            </p>
          </div>

          {/* Distribution Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            {/* Invoices per Customer Distribution */}
            {invoicesPerCustomer.length > 0 && (
              <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-2 border-cyan-200 dark:border-cyan-900/50 rounded-lg p-6 shadow-lg">
                <h3 className="text-lg font-semibold mb-4 bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">
                  Invoices per Participant
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={invoicesPerCustomer}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#22d3ee" opacity={0.1} />
                    <XAxis dataKey="bucket" stroke="#06b6d4" />
                    <YAxis stroke="#06b6d4" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0e7490",
                        border: "2px solid #06b6d4",
                        borderRadius: "0.5rem",
                        color: "#fff",
                      }}
                    />
                    <Bar dataKey="count" fill="url(#colorGradient1)" />
                    <defs>
                      <linearGradient id="colorGradient1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#06b6d4" />
                        <stop offset="100%" stopColor="#0891b2" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Invoice Value Distribution */}
            {invoiceValueDistribution.length > 0 && (
              <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-2 border-blue-200 dark:border-blue-900/50 rounded-lg p-6 shadow-lg">
                <h3 className="text-lg font-semibold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                  Invoice Value Distribution
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={invoiceValueDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3b82f6" opacity={0.1} />
                    <XAxis dataKey="bucket" stroke="#2563eb" />
                    <YAxis stroke="#2563eb" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e40af",
                        border: "2px solid #2563eb",
                        borderRadius: "0.5rem",
                        color: "#fff",
                      }}
                    />
                    <Bar dataKey="count" fill="url(#colorGradient2)" />
                    <defs>
                      <linearGradient id="colorGradient2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#2563eb" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="mt-6 prose prose-zinc dark:prose-invert max-w-none">
            <p className="text-base leading-relaxed text-slate-600 dark:text-slate-400">
              Most invoices are small (under $300), and most participants only have 1 invoice. But there are some big outliers—participants with many invoices, and some very high-value invoices.
            </p>
          </div>
        </NarrativeSection>
        <NarrativeSection>
          <div className="prose prose-zinc dark:prose-invert max-w-none mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent mb-4">
              Invoice Management
            </h2>
            <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-300">
              The same is true for invoice management:
            </p>
          </div>

          {/* Duration Distribution Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
            {/* Total Duration Distribution */}
            {durationDistribution.length > 0 && (
              <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-2 border-cyan-200 dark:border-cyan-900/50 rounded-lg p-6 shadow-lg">
                <h3 className="text-lg font-semibold mb-4 bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">
                  Total Session Duration
                </h3>
                <ResponsiveContainer width="100%" height={340}>
                  <BarChart data={durationDistribution} margin={{ top: 5, right: 5, bottom: 50, left: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#22d3ee" opacity={0.1} />
                    <XAxis dataKey="bucket" stroke="#06b6d4" angle={-45} textAnchor="end" height={20} tick={{ dy: 16 }} />
                    <YAxis stroke="#06b6d4" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0e7490",
                        border: "2px solid #06b6d4",
                        borderRadius: "0.5rem",
                        color: "#fff",
                      }}
                    />
                    <Bar dataKey="count" fill="url(#colorGradient3)" />
                    <defs>
                      <linearGradient id="colorGradient3" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#06b6d4" />
                        <stop offset="100%" stopColor="#0891b2" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Active Duration Distribution */}
            {activeDurationDistribution.length > 0 && (
              <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-2 border-blue-200 dark:border-blue-900/50 rounded-lg p-6 shadow-lg">
                <h3 className="text-lg font-semibold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                  Active Duration
                </h3>
                <ResponsiveContainer width="100%" height={340}>
                  <BarChart data={activeDurationDistribution} margin={{ top: 5, right: 5, bottom: 20, left: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3b82f6" opacity={0.1} />
                    <XAxis dataKey="bucket" stroke="#2563eb" angle={-45} textAnchor="end" height={50} tick={{ dy: 16 }} />
                    <YAxis stroke="#2563eb" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e40af",
                        border: "2px solid #2563eb",
                        borderRadius: "0.5rem",
                        color: "#fff",
                      }}
                    />
                    <Bar dataKey="count" fill="url(#colorGradient4)" />
                    <defs>
                      <linearGradient id="colorGradient4" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#2563eb" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Engaged Duration Distribution */}
            {engagedDurationDistribution.length > 0 && (
              <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-2 border-indigo-200 dark:border-indigo-900/50 rounded-lg p-6 shadow-lg">
                <h3 className="text-lg font-semibold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                  Engaged Duration
                </h3>
                <ResponsiveContainer width="100%" height={340}>
                  <BarChart data={engagedDurationDistribution} margin={{ top: 5, right: 5, bottom: 20, left: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#6366f1" opacity={0.1} />
                    <XAxis dataKey="bucket" stroke="#4f46e5" angle={-45} textAnchor="end" height={50} tick={{ dy: 16 }} />
                    <YAxis stroke="#4f46e5" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#4338ca",
                        border: "2px solid #4f46e5",
                        borderRadius: "0.5rem",
                        color: "#fff",
                      }}
                    />
                    <Bar dataKey="count" fill="url(#colorGradient5)" />
                    <defs>
                      <linearGradient id="colorGradient5" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#4f46e5" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="mt-6 prose prose-zinc dark:prose-invert max-w-none">
            <p className="text-base leading-relaxed text-slate-600 dark:text-slate-400">
              Most invoices take less than 5 minutes. But some take upwards of half an hour (although this is likely due to people leaving sessions open while doing something else).
            </p>
          </div>
        </NarrativeSection>

        {/* Sessions per Invoice Section */}
        <NarrativeSection>
          <div className="prose prose-zinc dark:prose-invert max-w-none mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent mb-4">
              Multiple Sessions
            </h2>
            <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-300">
              Most invoices are viewed just once. But some require coming back multiple times:
            </p>
          </div>

          {/* Sessions per Invoice Chart */}
          {sessionsPerInvoice.length > 0 && (
            <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-2 border-purple-200 dark:border-purple-900/50 rounded-lg p-6 shadow-lg">
              <h3 className="text-lg font-semibold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                Sessions per Invoice
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sessionsPerInvoice}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#a855f7" opacity={0.1} />
                  <XAxis dataKey="bucket" stroke="#9333ea" />
                  <YAxis stroke="#9333ea" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#7e22ce",
                      border: "2px solid #9333ea",
                      borderRadius: "0.5rem",
                      color: "#fff",
                    }}
                  />
                  <Bar dataKey="count" fill="url(#colorGradient6)" />
                  <defs>
                    <linearGradient id="colorGradient6" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#9333ea" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </NarrativeSection>
        </>
      )}

      {/* Story Section 3: What's Next */}
      <NarrativeSection className="border-4 border-cyan-500 dark:border-cyan-600 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30">
        <div className="prose prose-zinc dark:prose-invert max-w-none">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent mb-4">
            Dive Deeper
          </h2>
          <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-300">
            This is just the beginning. The data holds much more—relationships between providers
            and participants, error patterns, service utilization trends, and operational insights.
          </p>
          <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-300">
            Ready to explore the raw data? Use the table view to dig into specific records, apply
            filters, and download data for your own analysis.
          </p>
        </div>
      </NarrativeSection>
    </div>
  );
}
