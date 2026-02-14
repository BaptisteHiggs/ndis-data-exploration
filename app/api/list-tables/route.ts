import { createClient } from "@supabase/supabase-js";
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

    // Query to get all tables in the public schema
    const { data, error } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .eq("table_type", "BASE TABLE");

    if (error) {
      // Fallback: Try using raw SQL query
      const { data: sqlData, error: sqlError } = await supabase.rpc(
        "get_tables",
        {}
      );

      if (sqlError) {
        // If RPC doesn't exist, use a different approach
        // Query the tables by trying to access pg_tables
        const { data: pgData, error: pgError } = await supabase
          .from("pg_tables")
          .select("tablename")
          .eq("schemaname", "public");

        if (pgError) {
          return NextResponse.json(
            { error: "Could not retrieve tables. Please ensure proper permissions." },
            { status: 500 }
          );
        }

        return NextResponse.json({
          tables: pgData?.map((t: any) => t.tablename) || [],
        });
      }

      return NextResponse.json({
        tables: sqlData || [],
      });
    }

    return NextResponse.json({
      tables: data?.map((t: any) => t.table_name) || [],
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
