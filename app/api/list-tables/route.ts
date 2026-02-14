import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    // Validate password
    if (password !== process.env.APP_PASSWORD) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }

    // Get table names from environment variable
    const tablesEnv = process.env.DATABASE_TABLES;

    if (!tablesEnv) {
      return NextResponse.json(
        { error: "DATABASE_TABLES not configured in environment" },
        { status: 500 }
      );
    }

    // Parse comma-separated list and trim whitespace
    const tables = tablesEnv
      .split(",")
      .map((table) => table.trim())
      .filter((table) => table.length > 0);

    return NextResponse.json({
      tables,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
