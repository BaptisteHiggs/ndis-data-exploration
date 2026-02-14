"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface DashboardProps {
  data: any[];
}

export default function Dashboard({ data }: DashboardProps) {
  // Calculate summary statistics
  const stats = useMemo(() => {
    if (!data || data.length === 0) return null;

    const totalRecords = data.length;
    const columns = Object.keys(data[0]);

    // Try to find numeric columns for aggregation
    const numericColumns = columns.filter((col) => {
      const value = data[0][col];
      return typeof value === "number";
    });

    // Calculate sum of first numeric column if available
    let totalValue = 0;
    if (numericColumns.length > 0) {
      const firstNumericCol = numericColumns[0];
      totalValue = data.reduce((sum, row) => sum + (row[firstNumericCol] || 0), 0);
    }

    return { totalRecords, totalValue, numericColumns };
  }, [data]);

  // Create data for bar chart - count records by first categorical column
  const barChartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const columns = Object.keys(data[0]);
    // Find first string column that's not an ID
    const categoricalCol = columns.find(
      (col) =>
        typeof data[0][col] === "string" &&
        !col.toLowerCase().includes("id") &&
        !col.toLowerCase().includes("description")
    );

    if (!categoricalCol) return [];

    // Count occurrences
    const counts: Record<string, number> = {};
    data.forEach((row) => {
      const value = String(row[categoricalCol] || "Unknown");
      counts[value] = (counts[value] || 0) + 1;
    });

    // Convert to array and take top 10
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [data]);

  // Create data for line chart - aggregate by date if available
  const lineChartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const columns = Object.keys(data[0]);
    // Find date column
    const dateCol = columns.find(
      (col) =>
        col.toLowerCase().includes("date") ||
        col.toLowerCase().includes("created") ||
        col.toLowerCase().includes("time")
    );

    if (!dateCol) return [];

    // Group by date
    const dateCounts: Record<string, number> = {};
    data.forEach((row) => {
      if (row[dateCol]) {
        const date = new Date(row[dateCol]).toLocaleDateString();
        dateCounts[date] = (dateCounts[date] || 0) + 1;
      }
    });

    return Object.entries(dateCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30); // Last 30 data points
  }, [data]);

  // Create data for pie chart - status distribution if available
  const pieChartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const columns = Object.keys(data[0]);
    const statusCol = columns.find(
      (col) =>
        col.toLowerCase().includes("status") ||
        col.toLowerCase().includes("state") ||
        col.toLowerCase().includes("type")
    );

    if (!statusCol) return [];

    const counts: Record<string, number> = {};
    data.forEach((row) => {
      const value = String(row[statusCol] || "Unknown");
      counts[value] = (counts[value] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .slice(0, 6);
  }, [data]);

  const COLORS = ["#000000", "#3f3f46", "#71717a", "#a1a1aa", "#d4d4d8", "#e4e4e7"];

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-zinc-500 dark:text-zinc-400">
          No data available for visualization
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Total Records</p>
            <p className="text-3xl font-bold text-black dark:text-zinc-50">
              {stats.totalRecords.toLocaleString()}
            </p>
          </div>
          {stats.numericColumns.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Total {stats.numericColumns[0]}
              </p>
              <p className="text-3xl font-bold text-black dark:text-zinc-50">
                ${stats.totalValue.toLocaleString()}
              </p>
            </div>
          )}
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Data Points</p>
            <p className="text-3xl font-bold text-black dark:text-zinc-50">
              {Object.keys(data[0]).length}
            </p>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        {barChartData.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-black dark:text-zinc-50">
              Distribution by Category
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                <XAxis dataKey="name" stroke="#71717a" />
                <YAxis stroke="#71717a" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    border: "1px solid #3f3f46",
                    borderRadius: "0.5rem",
                  }}
                />
                <Bar dataKey="count" fill="#000000" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Line Chart */}
        {lineChartData.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-black dark:text-zinc-50">
              Trend Over Time
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={lineChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                <XAxis dataKey="date" stroke="#71717a" />
                <YAxis stroke="#71717a" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    border: "1px solid #3f3f46",
                    borderRadius: "0.5rem",
                  }}
                />
                <Line type="monotone" dataKey="count" stroke="#000000" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Pie Chart */}
        {pieChartData.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-black dark:text-zinc-50">
              Status Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
