import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    // Get total users
    const { count: totalUsers, error: totalUsersError } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });

    if (totalUsersError) {
      console.error("Error fetching total users:", totalUsersError);
      return NextResponse.json(
        { error: "Error fetching total users", details: totalUsersError.message },
        { status: 500 }
      );
    }

    // Get new users this month
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();
    
    const { count: newUsersThisMonth, error: newUsersError } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .gte("created_at", firstDayOfMonth)
      .lte("created_at", lastDayOfMonth);

    if (newUsersError) {
      console.error("Error fetching new users this month:", newUsersError);
      return NextResponse.json(
        { error: "Error fetching new users this month", details: newUsersError.message },
        { status: 500 }
      );
    }
    
    // Placeholder for active/inactive users as criteria are not defined yet
    // For now, we can set them based on total users or a fixed value if needed
    const activeUsers = totalUsers; // Example: assuming all users are active for now
    const inactiveUsers = 0; // Example: assuming no inactive users for now

    return NextResponse.json({
      totalUsers: totalUsers ?? 0,
      activeUsers: activeUsers ?? 0, // Will be revisited
      inactiveUsers: inactiveUsers ?? 0, // Will be revisited
      newUsersThisMonth: newUsersThisMonth ?? 0,
    });

  } catch (error: any) {
    console.error("Error fetching summary stats:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
} 