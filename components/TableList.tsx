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
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6">
      <h2 className="text-lg font-semibold mb-4 text-black dark:text-zinc-50">
        Tables ({tables.length})
      </h2>
      <div className="space-y-2">
        {tables.map((table) => (
          <button
            key={table}
            onClick={() => onTableSelect(table)}
            className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
              selectedTable === table
                ? "bg-black dark:bg-zinc-50 text-white dark:text-black font-medium"
                : "bg-zinc-100 dark:bg-zinc-800 text-black dark:text-zinc-50 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            }`}
          >
            {table}
          </button>
        ))}
        {tables.length === 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No tables found
          </p>
        )}
      </div>
    </div>
  );
}
