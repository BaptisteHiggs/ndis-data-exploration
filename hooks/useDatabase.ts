import { useState, useCallback } from "react";
import { checkConnection, fetchTables, fetchTableData, ApiError } from "@/lib/api";
import type { ConnectionStatus, TableData } from "@/types/database";

interface UseDatabaseReturn {
  status: ConnectionStatus;
  errorMessage: string;
  tables: string[];
  selectedTable: string;
  tableData: TableData | null;
  loadingData: boolean;
  initializeConnection: (password: string) => Promise<boolean>;
  selectTable: (tableName: string) => Promise<void>;
  clearError: () => void;
}

export function useDatabase(): UseDatabaseReturn {
  const [status, setStatus] = useState<ConnectionStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [loadingData, setLoadingData] = useState(false);

  const clearError = useCallback(() => {
    setErrorMessage("");
  }, []);

  const initializeConnection = useCallback(async (password: string): Promise<boolean> => {
    try {
      setStatus("loading");
      setErrorMessage("");

      // Check connection
      await checkConnection(password);

      // Fetch available tables
      const tableList = await fetchTables(password);
      setTables(tableList);
      setStatus("connected");

      return true;
    } catch (error) {
      if (error instanceof ApiError) {
        const attemptsMsg =
          error.data?.remainingAttempts !== undefined
            ? ` (${error.data.remainingAttempts} attempt${
                error.data.remainingAttempts !== 1 ? "s" : ""
              } remaining)`
            : "";
        setErrorMessage(error.message + attemptsMsg);
        setStatus("error");
        return false;
      }

      setErrorMessage(
        error instanceof Error ? error.message : "Unknown error occurred"
      );
      setStatus("error");
      return false;
    }
  }, []);

  const selectTable = useCallback(async (tableName: string) => {
    const password = sessionStorage.getItem("APP_PASSWORD");
    if (!password) return;

    setLoadingData(true);
    setSelectedTable(tableName);
    setTableData(null);

    try {
      const data = await fetchTableData(password, tableName);
      setTableData(data);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to fetch table data"
      );
    } finally {
      setLoadingData(false);
    }
  }, []);

  return {
    status,
    errorMessage,
    tables,
    selectedTable,
    tableData,
    loadingData,
    initializeConnection,
    selectTable,
    clearError,
  };
}
