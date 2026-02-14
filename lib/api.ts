import type { ConnectionResponse, TablesResponse, TableData } from "@/types/database";

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function fetchApi<T>(endpoint: string, body: any): Promise<T> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(
      data.error || "Request failed",
      response.status,
      data
    );
  }

  return data;
}

export async function checkConnection(password: string): Promise<ConnectionResponse> {
  return fetchApi<ConnectionResponse>("/api/check-connection", { password });
}

export async function fetchTables(password: string): Promise<string[]> {
  const response = await fetchApi<TablesResponse>("/api/list-tables", { password });
  return response.tables;
}

export async function fetchTableData(password: string, tableName: string): Promise<TableData> {
  return fetchApi<TableData>("/api/get-table-data", { password, tableName });
}

export { ApiError };
