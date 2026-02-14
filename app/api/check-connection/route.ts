import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, recordFailedAttempt, resetAttempts } from "@/lib/rate-limiter";

function getClientIp(request: NextRequest): string {
  // Try to get IP from various headers (for proxied requests)
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  if (realIp) {
    return realIp;
  }
  // Fallback for local development
  return "127.0.0.1";
}

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);

    // Check rate limit
    const rateLimit = checkRateLimit(clientIp);
    if (!rateLimit.allowed) {
      const minutesRemaining = Math.ceil(
        (rateLimit.blockedUntil!.getTime() - Date.now()) / 60000
      );
      return NextResponse.json(
        {
          error: `Too many failed attempts. Try again in ${minutesRemaining} minute${minutesRemaining !== 1 ? "s" : ""}.`,
        },
        { status: 429 }
      );
    }

    const { password } = await request.json();

    // Validate password
    if (password !== process.env.APP_PASSWORD) {
      recordFailedAttempt(clientIp);
      const updatedLimit = checkRateLimit(clientIp);

      return NextResponse.json(
        {
          error: "Invalid password",
          remainingAttempts: updatedLimit.remainingAttempts,
        },
        { status: 401 }
      );
    }

    // Reset attempts on successful auth
    resetAttempts(clientIp);

    // Get Supabase credentials from environment
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "Supabase credentials not configured on server" },
        { status: 500 }
      );
    }

    // Create Supabase client and test connection
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase
      .from("ndis_invoices")
      .select("*")
      .limit(10);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Connected successfully",
      recordCount: data?.length || 0,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
