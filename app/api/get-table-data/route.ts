import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { password, tableName } = await request.json();

    // Validate password
    if (password !== process.env.APP_PASSWORD) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }

    // Validate table name
    if (!tableName || typeof tableName !== "string") {
      return NextResponse.json(
        { error: "Table name is required" },
        { status: 400 }
      );
    }

    // Get Supabase credentials from environment
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "Supabase credentials not configured on server" },
        { status: 500 }
      );
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all data from the specified table
    const { data, error } = await supabase
      .from(tableName)
      .select("*");

    if (error) {
      return NextResponse.json(
        { error: `Failed to fetch data from ${tableName}: ${error.message}` },
        { status: 500 }
      );
    }

    // Get column names from the first row (if data exists)
    const columns = data && data.length > 0 ? Object.keys(data[0]) : [];

    return NextResponse.json({
      tableName,
      columns,
      data: data || [],
      rowCount: data?.length || 0,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
