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
  tables: string[];
}

export default function DataStory({ data, tables }: DataStoryProps) {
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
        col.toLowerCase().includes("date") ||
        col.toLowerCase().includes("created")
    );

    if (!dateCol) return [];

    const monthCounts: Record<string, number> = {};
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
      .slice(-12); // Last 12 months
  }, [data]);

  return (
    <div className="space-y-8">
      {/* Introduction */}
      <NarrativeSection>
        <div className="prose prose-zinc dark:prose-invert max-w-none">
          <p className="text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
            Hi. I'm <span className="font-semibold text-black dark:text-white">Baptiste</span>.
          </p>
          <p className="text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
            We'll be exploring the data behind{" "}
            <span className="font-semibold text-black dark:text-white">NDIS plan management</span>.
          </p>
          <p className="text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
            In the data, there are <span className="font-semibold text-black dark:text-white">{tables.length} tables</span>:
          </p>
        </div>
      </NarrativeSection>

      {/* Table Names Display */}
      <NarrativeSection>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {tables.map((table, index) => (
            <div
              key={table}
              className="group relative overflow-hidden rounded-lg border-2 border-zinc-200 dark:border-zinc-700 p-6 hover:border-black dark:hover:border-zinc-50 transition-all duration-300 hover:shadow-xl"
            >
              <div className="absolute top-2 left-2 text-4xl font-bold text-zinc-100 dark:text-zinc-800">
                {index + 1}
              </div>
              <div className="relative z-10">
                <p className="text-sm font-mono text-zinc-600 dark:text-zinc-400 mb-1">
                  TABLE {index + 1}
                </p>
                <h3 className="text-lg font-semibold text-black dark:text-zinc-50 break-words">
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
          <h2 className="text-2xl font-bold text-black dark:text-white mb-4">
            The Big Picture
          </h2>
          <p className="text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
            Each of these tables provide different pieces of valuable information. To give some context:
          </p>
        </div>

        {invoiceStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-8 text-center">
              <p className="text-sm uppercase tracking-wide text-zinc-600 dark:text-zinc-400 mb-2">
                Total Invoices
              </p>
              <p className="text-5xl font-bold text-black dark:text-white">
                {invoiceStats.totalInvoices.toLocaleString()}
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
                records in the system
              </p>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-8 text-center">
              <p className="text-sm uppercase tracking-wide text-zinc-600 dark:text-zinc-400 mb-2">
                Total Value
              </p>
              <p className="text-5xl font-bold text-black dark:text-white">
                ${(invoiceStats.totalAmount / 1000).toFixed(1)}k
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
                in managed funds
              </p>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-8 text-center">
              <p className="text-sm uppercase tracking-wide text-zinc-600 dark:text-zinc-400 mb-2">
                participants
              </p>
              <p className="text-5xl font-bold text-black dark:text-white">
                {invoiceStats.individualsHelped.toLocaleString()}
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
                individuals helped
              </p>
            </div>
          </div>
        )}
      </NarrativeSection>

      {/* Story Section 2: Trends */}
      {monthlyTrend.length > 0 && (
        <NarrativeSection>
          <div className="prose prose-zinc dark:prose-invert max-w-none mb-6">
            <h2 className="text-2xl font-bold text-black dark:text-white mb-4">
              Activity Over Time
            </h2>
            <p className="text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
              Looking at how invoice activity has changed over time reveals patterns in service
              delivery and plan management operations. The data shows both seasonal variations and
              overall trends.
            </p>
          </div>

          <div className="mt-8 bg-zinc-50 dark:bg-zinc-800 rounded-lg p-6">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                <XAxis
                  dataKey="month"
                  stroke="#71717a"
                  style={{ fontSize: "12px" }}
                />
                <YAxis stroke="#71717a" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    border: "1px solid #3f3f46",
                    borderRadius: "0.5rem",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#000000"
                  strokeWidth={3}
                  dot={{ fill: "#000000", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-6 prose prose-zinc dark:prose-invert max-w-none">
            <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
              The trend line shows invoice processing activity across months, helping identify peak
              periods and potential capacity planning needs.
            </p>
          </div>
        </NarrativeSection>
      )}

      {/* Story Section 3: What's Next */}
      <NarrativeSection className="border-2 border-black dark:border-zinc-50">
        <div className="prose prose-zinc dark:prose-invert max-w-none">
          <h2 className="text-2xl font-bold text-black dark:text-white mb-4">
            Dive Deeper
          </h2>
          <p className="text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
            This is just the beginning. The data holds much more—relationships between providers
            and participants, error patterns, service utilization trends, and operational insights.
          </p>
          <p className="text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
            Ready to explore the raw data? Use the table view to dig into specific records, apply
            filters, and download data for your own analysis.
          </p>
        </div>
      </NarrativeSection>
    </div>
  );
}
