"use client";

import { useMemo } from "react";
import Link from "next/link";
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
  errorsData: any[];
  tables: string[];
}

export default function DataStory({ data, sessionsData, errorsData, tables }: DataStoryProps) {
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

  // Efficiency score calculation - Top 100 individual invoices
  const topEfficiencyScores = useMemo(() => {
    if (!sessionsData || sessionsData.length === 0 || !data || data.length === 0) return [];

    // Find relevant columns
    const invoiceIdCol = Object.keys(sessionsData[0]).find((col) =>
      col.toLowerCase().includes("invoice") && col.toLowerCase().includes("id")
    );
    if (!invoiceIdCol) return [];

    // Aggregate data per invoice
    const invoiceMetrics: Record<string, { activeTime: number; sessionCount: number; errorCodes: string[]; ignoredErrorCodes: string[] }> = {};

    // Sum active duration and count sessions per invoice
    sessionsData.forEach((row) => {
      const invoiceId = row[invoiceIdCol];
      if (!invoiceId) return;

      if (!invoiceMetrics[invoiceId]) {
        invoiceMetrics[invoiceId] = { activeTime: 0, sessionCount: 0, errorCodes: [], ignoredErrorCodes: [] };
      }

      invoiceMetrics[invoiceId].activeTime += row.active_duration_seconds || 0;
      invoiceMetrics[invoiceId].sessionCount += 1;
    });

    // Extract error codes and ignored error codes from ndis_invoices state_management column
    const dataInvoiceIdCol = Object.keys(data[0]).find((col) =>
      col.toLowerCase().includes("id")
    );

    if (dataInvoiceIdCol) {
      data.forEach((row) => {
        const invoiceId = row[dataInvoiceIdCol];
        if (!invoiceId) return;

        // Parse state_management JSON to get errors and ignored_errors
        if (row.state_management) {
          try {
            const stateManagement = typeof row.state_management === 'string'
              ? JSON.parse(row.state_management)
              : row.state_management;

            const errors = stateManagement?.errors || [];
            const ignoredErrors = stateManagement?.ignored_errors || [];

            if (errors.length > 0 || ignoredErrors.length > 0) {
              if (!invoiceMetrics[invoiceId]) {
                invoiceMetrics[invoiceId] = { activeTime: 0, sessionCount: 0, errorCodes: [], ignoredErrorCodes: [] };
              }
              invoiceMetrics[invoiceId].errorCodes = errors;
              invoiceMetrics[invoiceId].ignoredErrorCodes = ignoredErrors;
            }
          } catch (e) {
            // Skip if JSON parsing fails
          }
        }
      });
    }

    // Extract values for normalization
    const invoiceEntries = Object.entries(invoiceMetrics);
    if (invoiceEntries.length === 0) return [];

    const values = invoiceEntries.map(([, metrics]) => metrics);
    const maxActiveTime = Math.max(...values.map(v => v.activeTime));
    const maxSessions = Math.max(...values.map(v => v.sessionCount));
    const maxErrors = Math.max(...values.map(v => v.errorCodes.length));
    const maxIgnoredErrors = Math.max(...values.map(v => v.ignoredErrorCodes.length));

    // Calculate efficiency scores for each invoice
    const invoiceScores = invoiceEntries.map(([invoiceId, metrics]) => {
      const normActiveTime = maxActiveTime > 0 ? metrics.activeTime / maxActiveTime : 0;
      const normSessions = maxSessions > 0 ? metrics.sessionCount / maxSessions : 0;
      const normErrors = maxErrors > 0 ? metrics.errorCodes.length / maxErrors : 0;
      const normIgnoredErrors = maxIgnoredErrors > 0 ? metrics.ignoredErrorCodes.length / maxIgnoredErrors : 0;

      const score = normActiveTime * 0.5 + normSessions * 0.2 + normErrors * 0.2 + normIgnoredErrors * 0.1;

      return {
        invoiceId,
        score,
        activeTime: metrics.activeTime,
        sessionCount: metrics.sessionCount,
        errorCodes: metrics.errorCodes,
        ignoredErrorCodes: metrics.ignoredErrorCodes,
      };
    });

    // Sort by score descending (worst first) and take top 100
    return invoiceScores
      .sort((a, b) => b.score - a.score)
      .slice(0, 100)
      .map((item, index) => ({ ...item, index: index + 1 }));
  }, [sessionsData, data]);

  // Error frequency analysis - count all errors (ignored and non-ignored)
  const errorFrequency = useMemo(() => {
    if (!data || data.length === 0) return [];

    const errorCounts: Record<string, number> = {};

    data.forEach((row) => {
      if (row.state_management) {
        try {
          const stateManagement = typeof row.state_management === 'string'
            ? JSON.parse(row.state_management)
            : row.state_management;

          const errors = stateManagement?.errors || [];
          const ignoredErrors = stateManagement?.ignored_errors || [];
          const allErrors = [...errors, ...ignoredErrors];

          allErrors.forEach((errorCode) => {
            errorCounts[errorCode] = (errorCounts[errorCode] || 0) + 1;
          });
        } catch (e) {
          // Skip if JSON parsing fails
        }
      }
    });

    return Object.entries(errorCounts)
      .map(([errorCode, count]) => ({ errorCode, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15); // Top 15 most frequent errors
  }, [data]);

  // Average efficiency score by error code
  const avgScoreByError = useMemo(() => {
    if (!sessionsData || sessionsData.length === 0 || !data || data.length === 0) return [];

    // First, calculate efficiency scores for all invoices (not just top 100)
    const invoiceIdCol = Object.keys(sessionsData[0]).find((col) =>
      col.toLowerCase().includes("invoice") && col.toLowerCase().includes("id")
    );
    if (!invoiceIdCol) return [];

    const invoiceMetrics: Record<string, { activeTime: number; sessionCount: number; errorCodes: string[]; ignoredErrorCodes: string[] }> = {};

    sessionsData.forEach((row) => {
      const invoiceId = row[invoiceIdCol];
      if (!invoiceId) return;
      if (!invoiceMetrics[invoiceId]) {
        invoiceMetrics[invoiceId] = { activeTime: 0, sessionCount: 0, errorCodes: [], ignoredErrorCodes: [] };
      }
      invoiceMetrics[invoiceId].activeTime += row.active_duration_seconds || 0;
      invoiceMetrics[invoiceId].sessionCount += 1;
    });

    const dataInvoiceIdCol = Object.keys(data[0]).find((col) =>
      col.toLowerCase().includes("id")
    );

    if (dataInvoiceIdCol) {
      data.forEach((row) => {
        const invoiceId = row[dataInvoiceIdCol];
        if (!invoiceId) return;
        if (row.state_management) {
          try {
            const stateManagement = typeof row.state_management === 'string'
              ? JSON.parse(row.state_management)
              : row.state_management;
            const errors = stateManagement?.errors || [];
            const ignoredErrors = stateManagement?.ignored_errors || [];
            if (errors.length > 0 || ignoredErrors.length > 0) {
              if (!invoiceMetrics[invoiceId]) {
                invoiceMetrics[invoiceId] = { activeTime: 0, sessionCount: 0, errorCodes: [], ignoredErrorCodes: [] };
              }
              invoiceMetrics[invoiceId].errorCodes = errors;
              invoiceMetrics[invoiceId].ignoredErrorCodes = ignoredErrors;
            }
          } catch (e) {
            // Skip if JSON parsing fails
          }
        }
      });
    }

    const values = Object.values(invoiceMetrics);
    const maxActiveTime = Math.max(...values.map(v => v.activeTime));
    const maxSessions = Math.max(...values.map(v => v.sessionCount));
    const maxErrors = Math.max(...values.map(v => v.errorCodes.length));
    const maxIgnoredErrors = Math.max(...values.map(v => v.ignoredErrorCodes.length));

    const invoiceScoresWithErrors = Object.entries(invoiceMetrics).map(([invoiceId, metrics]) => {
      const normActiveTime = maxActiveTime > 0 ? metrics.activeTime / maxActiveTime : 0;
      const normSessions = maxSessions > 0 ? metrics.sessionCount / maxSessions : 0;
      const normErrors = maxErrors > 0 ? metrics.errorCodes.length / maxErrors : 0;
      const normIgnoredErrors = maxIgnoredErrors > 0 ? metrics.ignoredErrorCodes.length / maxIgnoredErrors : 0;
      const score = normActiveTime * 0.5 + normSessions * 0.2 + normErrors * 0.2 + normIgnoredErrors * 0.1;

      return {
        invoiceId,
        score,
        allErrors: [...metrics.errorCodes, ...metrics.ignoredErrorCodes],
      };
    });

    // Calculate average score per error code
    const errorScores: Record<string, { totalScore: number; count: number }> = {};

    invoiceScoresWithErrors.forEach((invoice) => {
      invoice.allErrors.forEach((errorCode) => {
        if (!errorScores[errorCode]) {
          errorScores[errorCode] = { totalScore: 0, count: 0 };
        }
        errorScores[errorCode].totalScore += invoice.score;
        errorScores[errorCode].count += 1;
      });
    });

    return Object.entries(errorScores)
      .map(([errorCode, { totalScore, count }]) => ({
        errorCode,
        avgScore: totalScore / count,
        count,
      }))
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 15); // Top 15 errors by worst average score
  }, [sessionsData, data]);

  // Total cumulative time by error code
  const cumulativeTimeByError = useMemo(() => {
    if (!sessionsData || sessionsData.length === 0 || !data || data.length === 0) return [];

    const invoiceIdCol = Object.keys(sessionsData[0]).find((col) =>
      col.toLowerCase().includes("invoice") && col.toLowerCase().includes("id")
    );
    if (!invoiceIdCol) return [];

    // Build mapping of invoice ID to active time
    const invoiceActiveTimes: Record<string, number> = {};
    sessionsData.forEach((row) => {
      const invoiceId = row[invoiceIdCol];
      if (!invoiceId) return;
      invoiceActiveTimes[invoiceId] = (invoiceActiveTimes[invoiceId] || 0) + (row.active_duration_seconds || 0);
    });

    // Build mapping of invoice ID to all error codes
    const invoiceErrors: Record<string, string[]> = {};
    const dataInvoiceIdCol = Object.keys(data[0]).find((col) =>
      col.toLowerCase().includes("id")
    );

    if (dataInvoiceIdCol) {
      data.forEach((row) => {
        const invoiceId = row[dataInvoiceIdCol];
        if (!invoiceId) return;
        if (row.state_management) {
          try {
            const stateManagement = typeof row.state_management === 'string'
              ? JSON.parse(row.state_management)
              : row.state_management;
            const errors = stateManagement?.errors || [];
            const ignoredErrors = stateManagement?.ignored_errors || [];
            const allErrors = [...errors, ...ignoredErrors];
            if (allErrors.length > 0) {
              invoiceErrors[invoiceId] = allErrors;
            }
          } catch (e) {
            // Skip if JSON parsing fails
          }
        }
      });
    }

    // Calculate cumulative time per error code
    const errorTimes: Record<string, number> = {};
    Object.entries(invoiceErrors).forEach(([invoiceId, errorCodes]) => {
      const activeTime = invoiceActiveTimes[invoiceId] || 0;
      errorCodes.forEach((errorCode) => {
        errorTimes[errorCode] = (errorTimes[errorCode] || 0) + activeTime;
      });
    });

    return Object.entries(errorTimes)
      .map(([errorCode, totalTime]) => ({
        errorCode,
        totalTime: totalTime / 60, // Convert to minutes
        totalTimeSeconds: totalTime,
      }))
      .sort((a, b) => b.totalTime - a.totalTime)
      .slice(0, 15); // Top 15 errors by cumulative time
  }, [sessionsData, data]);

  // Priority errors - combine top 3 from each metric
  const priorityErrors = useMemo(() => {
    if (!errorsData || errorsData.length === 0) return [];

    // Get top 3 from each chart
    const topFrequent = errorFrequency.slice(0, 3).map(e => e.errorCode);
    const topImpact = avgScoreByError.slice(0, 3).map(e => e.errorCode);
    const topTime = cumulativeTimeByError.slice(0, 3).map(e => e.errorCode);

    // Create unique set of priority errors
    const prioritySet = new Set([...topFrequent, ...topImpact, ...topTime]);

    // Match with error catalogue and add metric info
    return Array.from(prioritySet).map(errorCode => {
      // Try to find in catalogue by different possible column names
      const catalogueEntry = errorsData.find(e =>
        e.error_code === errorCode ||
        e.code === errorCode ||
        e.id === errorCode ||
        e.error_id === errorCode
      );

      return {
        errorCode,
        isFrequent: topFrequent.includes(errorCode),
        isHighImpact: topImpact.includes(errorCode),
        isHighTime: topTime.includes(errorCode),
        details: catalogueEntry || null,
      };
    });
  }, [errorFrequency, avgScoreByError, cumulativeTimeByError, errorsData]);

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

        {/* Sessions per Invoice Section */}
        <NarrativeSection>
          <div className="prose prose-zinc dark:prose-invert max-w-none mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent mb-4">
              What makes a bad invoice experience?
            </h2>
            <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-300 mb-4">
              As a proxy of invoice efficiency, let's take into consideration, in order of importance:
            </p>

            <ul className="space-y-3 mb-6 ml-4">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-2 h-2 mt-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"></span>
                <span className="text-lg text-slate-700 dark:text-slate-300">
                  Total <span className="italic font-medium">active</span> time spent on the invoice
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-2 h-2 mt-2.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"></span>
                <span className="text-lg text-slate-700 dark:text-slate-300">
                  Number of sessions
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-2 h-2 mt-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"></span>
                <span className="text-lg text-slate-700 dark:text-slate-300">
                  Number of unignored errors
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-2 h-2 mt-2.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"></span>
                <span className="text-lg text-slate-700 dark:text-slate-300">
                  Number of ignored errors
                </span>
              </li>
            </ul>

            {/* Aesthetic Equation */}
            <div className="mt-8 p-6 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30 rounded-lg border-2 border-cyan-200 dark:border-cyan-800 shadow-lg">
              <div className="flex flex-col items-center justify-center gap-1 font-mono text-lg">
                <div className="flex items-center gap-2.5">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 text-base">Score =</span>
                  <span className="text-cyan-600 dark:text-cyan-400 font-medium">normalised(</span>
                  <span className="text-slate-700 dark:text-slate-300 italic">total</span>
                  <span className="text-cyan-600 dark:text-cyan-400 font-medium">)</span>
                  <span className="text-slate-600 dark:text-slate-400">×</span>
                  <span className="font-bold text-cyan-600 dark:text-cyan-400">0.5</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-slate-500 dark:text-slate-400 text-xl">+</span>
                  <span className="text-blue-600 dark:text-blue-400 font-medium">normalised(</span>
                  <span className="text-slate-700 dark:text-slate-300 italic">sessions</span>
                  <span className="text-blue-600 dark:text-blue-400 font-medium">)</span>
                  <span className="text-slate-600 dark:text-slate-400">×</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">0.2</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-slate-500 dark:text-slate-400 text-xl">+</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-medium">normalised(</span>
                  <span className="text-slate-700 dark:text-slate-300 italic">errors</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-medium">)</span>
                  <span className="text-slate-600 dark:text-slate-400">×</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">0.2</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-slate-500 dark:text-slate-400 text-xl">+</span>
                  <span className="text-purple-600 dark:text-purple-400 font-medium">normalised(</span>
                  <span className="text-slate-700 dark:text-slate-300 italic">ignored errors</span>
                  <span className="text-purple-600 dark:text-purple-400 font-medium">)</span>
                  <span className="text-slate-600 dark:text-slate-400">×</span>
                  <span className="font-bold text-purple-600 dark:text-purple-400">0.1</span>
                </div>
              </div>
            </div>
            <br />
            <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-300">
              Let's use this equation to identify the worst invoices, and see what they have in common:
            </p>
          </div>

        </NarrativeSection>

        <NarrativeSection>
          <div className="prose prose-zinc dark:prose-invert max-w-none mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent mb-4">
              Invoice Efficiency Scores
            </h2>
            <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-300">
              Using our efficiency formula, here are the top 100 worst-performing invoices (higher score = worse experience). Hover over each bar for details:
            </p>
          </div>

          {/* Efficiency Score Chart */}
          {topEfficiencyScores.length > 0 && (
            <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-2 border-red-200 dark:border-red-900/50 rounded-lg p-6 shadow-lg">
              <h3 className="text-lg font-semibold mb-4 bg-gradient-to-r from-red-600 to-orange-600 dark:from-red-400 dark:to-orange-400 bg-clip-text text-transparent">
                Top 100 Problem Invoices
              </h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={topEfficiencyScores} margin={{ top: 5, right: 5, bottom: 20, left: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ef4444" opacity={0.1} />
                  <XAxis
                    dataKey="index"
                    stroke="#dc2626"
                    tick={false}
                    label={{ value: "Invoice Rank (1 = Worst)", position: "insideBottom", offset: -10, fill: "#dc2626" }}
                  />
                  <YAxis
                    stroke="#dc2626"
                    label={{ value: "Efficiency Score", angle: -90, position: "insideLeft", fill: "#dc2626" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#991b1b",
                      border: "2px solid #dc2626",
                      borderRadius: "0.5rem",
                      color: "#fff",
                    }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-red-900 border-2 border-red-600 rounded-lg p-4 shadow-xl max-w-xs">
                            <p className="font-bold text-white mb-2">Invoice #{data.invoiceId}</p>
                            <p className="text-red-100 text-sm">Rank: #{data.index} of {topEfficiencyScores.length}</p>
                            <p className="text-red-100 text-sm">Score: {data.score.toFixed(3)}</p>
                            <hr className="my-2 border-red-700" />
                            <p className="text-red-100 text-sm">Active Time: {Math.floor(data.activeTime / 60)}m {data.activeTime % 60}s</p>
                            <p className="text-red-100 text-sm">Sessions: {data.sessionCount}</p>
                            {data.errorCodes && data.errorCodes.length > 0 ? (
                              <div className="text-red-100 text-sm mt-1">
                                <p className="font-medium">Errors:</p>
                                <p className="ml-2">{data.errorCodes.join(", ")}</p>
                              </div>
                            ) : (
                              <p className="text-red-100 text-sm">Errors: None</p>
                            )}
                            {data.ignoredErrorCodes && data.ignoredErrorCodes.length > 0 ? (
                              <div className="text-red-100 text-sm mt-1">
                                <p className="font-medium">Ignored Errors:</p>
                                <p className="ml-2">{data.ignoredErrorCodes.join(", ")}</p>
                              </div>
                            ) : (
                              <p className="text-red-100 text-sm">Ignored Errors: None</p>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="score" fill="url(#colorGradient7)" />
                  <defs>
                    <linearGradient id="colorGradient7" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" />
                      <stop offset="100%" stopColor="#dc2626" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </NarrativeSection>

        {/* Error Analysis Section */}
        <NarrativeSection>
          <div className="prose prose-zinc dark:prose-invert max-w-none mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent mb-4">
              Which Errors Should We Address?
            </h2>
            <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-300">
              One way efficiency can be improved is by automating error resolution. If errors are able to be resolved to increase efficiency, which errors should be prioritised?
            </p>
          </div>

          {/* Three column grid for charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
            {/* Error Frequency Chart */}
            {errorFrequency.length > 0 && (
              <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-2 border-orange-200 dark:border-orange-900/50 rounded-lg p-6 shadow-lg">
                <h3 className="text-lg font-semibold mb-4 bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-400 dark:to-red-400 bg-clip-text text-transparent">
                  Most Frequent Errors
                </h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={errorFrequency} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#fb923c" opacity={0.1} />
                    <XAxis type="number" stroke="#ea580c" />
                    <YAxis
                      type="category"
                      dataKey="errorCode"
                      stroke="#ea580c"
                      width={55}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#7c2d12",
                        border: "2px solid #ea580c",
                        borderRadius: "0.5rem",
                        color: "#fff",
                      }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-orange-900 border-2 border-orange-600 rounded-lg p-3 shadow-xl">
                              <p className="font-bold text-white mb-1">Error {data.errorCode}</p>
                              <p className="text-orange-100 text-sm">Occurrences: {data.count}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="count" fill="url(#colorGradient8)" />
                    <defs>
                      <linearGradient id="colorGradient8" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#fb923c" />
                        <stop offset="100%" stopColor="#ea580c" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Average Score by Error Chart */}
            {avgScoreByError.length > 0 && (
              <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-2 border-rose-200 dark:border-rose-900/50 rounded-lg p-6 shadow-lg">
                <h3 className="text-lg font-semibold mb-4 bg-gradient-to-r from-rose-600 to-pink-600 dark:from-rose-400 dark:to-pink-400 bg-clip-text text-transparent">
                  Errors with Worst Avg. Efficiency
                </h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={avgScoreByError} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#fb7185" opacity={0.1} />
                    <XAxis type="number" stroke="#e11d48" />
                    <YAxis
                      type="category"
                      dataKey="errorCode"
                      stroke="#e11d48"
                      width={55}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#881337",
                        border: "2px solid #e11d48",
                        borderRadius: "0.5rem",
                        color: "#fff",
                      }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-rose-900 border-2 border-rose-600 rounded-lg p-3 shadow-xl">
                              <p className="font-bold text-white mb-1">Error {data.errorCode}</p>
                              <p className="text-rose-100 text-sm">Avg. Score: {data.avgScore.toFixed(3)}</p>
                              <p className="text-rose-100 text-sm">Occurrences: {data.count}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="avgScore" fill="url(#colorGradient9)" />
                    <defs>
                      <linearGradient id="colorGradient9" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#fb7185" />
                        <stop offset="100%" stopColor="#e11d48" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Cumulative Time by Error Chart */}
            {cumulativeTimeByError.length > 0 && (
              <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-2 border-emerald-200 dark:border-emerald-900/50 rounded-lg p-6 shadow-lg">
                <h3 className="text-lg font-semibold mb-4 bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
                  Total Time Spent on Errors
                </h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={cumulativeTimeByError} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#34d399" opacity={0.1} />
                    <XAxis type="number" stroke="#059669" />
                    <YAxis
                      type="category"
                      dataKey="errorCode"
                      stroke="#059669"
                      width={55}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#064e3b",
                        border: "2px solid #059669",
                        borderRadius: "0.5rem",
                        color: "#fff",
                      }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          const hours = Math.floor(data.totalTime / 60);
                          const minutes = Math.floor(data.totalTime % 60);
                          return (
                            <div className="bg-emerald-900 border-2 border-emerald-600 rounded-lg p-3 shadow-xl">
                              <p className="font-bold text-white mb-1">Error {data.errorCode}</p>
                              <p className="text-emerald-100 text-sm">
                                Total Time: {hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`}
                              </p>
                              <p className="text-emerald-100 text-sm text-xs opacity-75">
                                ({data.totalTime.toFixed(0)} minutes)
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="totalTime" fill="url(#colorGradient10)" />
                    <defs>
                      <linearGradient id="colorGradient10" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#34d399" />
                        <stop offset="100%" stopColor="#059669" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="mt-6 prose prose-zinc dark:prose-invert max-w-none">
            <p className="text-base leading-relaxed text-slate-600 dark:text-slate-400">
              While this doesn't tell the whole story, it provides a helpful starting point for identifying where efficiency could be improved.
            </p>
          </div>

          {/* Priority Errors Display */}
          {priorityErrors.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xl font-semibold bg-gradient-to-r from-red-600 to-orange-600 dark:from-red-400 dark:to-orange-400 bg-clip-text text-transparent mb-4">
                Priority Errors to Address
              </h3>
              <p className="text-base leading-relaxed text-slate-600 dark:text-slate-400 mb-6">
                Based on the analysis above, these errors appear in the top 3 of at least one metric and should be prioritized:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {priorityErrors.map((error) => (
                  <div
                    key={error.errorCode}
                    className="group relative overflow-hidden rounded-lg border-2 border-red-200 dark:border-red-900/50 p-5 hover:border-red-500 dark:hover:border-red-600 hover:shadow-lg hover:shadow-red-500/20 transition-all duration-300 bg-gradient-to-br from-white to-red-50/30 dark:from-slate-800 dark:to-red-950/30"
                  >
                    {/* Error Code Header */}
                    <div className="mb-3">
                      <h4 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-1">
                        {error.errorCode}
                      </h4>
                      {error.details && (
                        <div className="space-y-1">
                          {error.details.error_description && (
                            <p className="text-sm text-slate-700 dark:text-slate-300">
                              {error.details.error_description}
                            </p>
                          )}
                          {error.details.description && (
                            <p className="text-sm text-slate-700 dark:text-slate-300">
                              {error.details.description}
                            </p>
                          )}
                          {error.details.message && (
                            <p className="text-sm text-slate-700 dark:text-slate-300">
                              {error.details.message}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Metric Badges */}
                    <div className="flex flex-wrap gap-2">
                      {error.isFrequent && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full shadow-sm">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
                          </svg>
                          High Frequency
                        </span>
                      )}
                      {error.isHighImpact && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full shadow-sm">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          High Impact
                        </span>
                      )}
                      {error.isHighTime && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full shadow-sm">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          High Time Cost
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
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
          <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-300 mb-6">
            Look at the data for yourself using the table view:
          </p>
          <Link
            href="/table"
            className="inline-block px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-md font-medium shadow-lg shadow-cyan-500/30 transition-all"
          >
            View Tables
          </Link>
        </div>
      </NarrativeSection>
    </div>
  );
}
