import type { TableData } from "@/types/database";
import LoadingSpinner from "./LoadingSpinner";
import DownloadCSVButton from "./DownloadCSVButton";

interface TableViewProps {
  tableData: TableData | null;
  loading: boolean;
}

export default function TableView({ tableData, loading }: TableViewProps) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6">
        <LoadingSpinner />
      </div>
    );
  }

  if (!tableData) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6">
        <div className="text-center py-12">
          <p className="text-lg text-zinc-500 dark:text-zinc-400">
            Select a table to view its data
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6">
      <div className="mb-4 flex justify-between items-start">
        <div>
          <h2 className="text-xl font-semibold text-black dark:text-zinc-50">
            {tableData.tableName}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {tableData.rowCount} rows, {tableData.columns.length} columns
          </p>
        </div>
        <DownloadCSVButton
          data={tableData.data}
          filename={tableData.tableName}
        />
      </div>

      {tableData.data.length === 0 ? (
        <p className="text-zinc-500 dark:text-zinc-400">
          No data in this table
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-700">
                {tableData.columns.map((column) => (
                  <th
                    key={column}
                    className="text-left px-4 py-2 font-semibold text-black dark:text-zinc-50"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.data.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                >
                  {tableData.columns.map((column) => (
                    <td
                      key={column}
                      className="px-4 py-2 text-zinc-700 dark:text-zinc-300"
                    >
                      {typeof row[column] === "object" && row[column] !== null
                        ? JSON.stringify(row[column])
                        : String(row[column] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
