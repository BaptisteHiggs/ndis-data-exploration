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

    // Fetch data from ndis_invoices for dashboard
    const { data: invoicesData, error: invoicesError } = await supabase
      .from("ndis_invoices")
      .select("*")
      .limit(1000); // Limit for performance

    if (invoicesError) {
      return NextResponse.json(
        { error: `Failed to fetch invoices data: ${invoicesError.message}` },
        { status: 500 }
      );
    }

    // Fetch data from invoice_view_sessions for duration analysis
    const { data: sessionsData, error: sessionsError } = await supabase
      .from("invoice_view_sessions")
      .select("*")
      .limit(1000); // Limit for performance

    if (sessionsError) {
      return NextResponse.json(
        { error: `Failed to fetch sessions data: ${sessionsError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: invoicesData || [],
      sessionsData: sessionsData || [],
      rowCount: invoicesData?.length || 0,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
