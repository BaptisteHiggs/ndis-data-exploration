export interface TableData {
  tableName: string;
  columns: string[];
  data: Record<string, any>[];
  rowCount: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface ConnectionResponse {
  success: boolean;
  message: string;
  recordCount: number;
}

export interface TablesResponse {
  tables: string[];
}

export type ConnectionStatus = "loading" | "connected" | "error";
