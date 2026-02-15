interface TableListProps {
  tables: string[];
  selectedTable: string;
  onTableSelect: (tableName: string) => void;
}

export default function TableList({
  tables,
  selectedTable,
  onTableSelect,
}: TableListProps) {
  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-lg shadow-xl border border-cyan-100 dark:border-slate-800 p-6">
      <h2 className="text-lg font-semibold mb-4 bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">
        Tables ({tables.length})
      </h2>
      <div className="space-y-2">
        {tables.map((table) => (
          <button
            key={table}
            onClick={() => onTableSelect(table)}
            className={`w-full text-left px-4 py-2 rounded-md transition-all ${
              selectedTable === table
                ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium shadow-lg shadow-cyan-500/30"
                : "bg-cyan-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-cyan-100 dark:hover:bg-slate-700 border border-cyan-200 dark:border-slate-700"
            }`}
          >
            {table}
          </button>
        ))}
        {tables.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No tables found
          </p>
        )}
      </div>
    </div>
  );
}
