import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("created_at")
      .gte("created_at", sixMonthsAgo.toISOString());

    if (usersError) {
      console.error("Error fetching users for by-month stats:", usersError);
      return NextResponse.json(
        { error: "Error fetching users data", details: usersError.message },
        { status: 500 }
      );
    }

    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const usersByMonth: { [key: string]: number } = {};

    // Initialize counts for the last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthKey = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
      usersByMonth[monthKey] = 0;
    }
    
    if (users) {
      users.forEach((user) => {
        if (user.created_at) {
          const createdAtDate = new Date(user.created_at);
          const monthKey = `${monthNames[createdAtDate.getMonth()]} ${createdAtDate.getFullYear().toString().slice(-2)}`;
          if (usersByMonth.hasOwnProperty(monthKey)) {
            usersByMonth[monthKey]++;
          }
        }
      });
    }
    
    const chartData = Object.entries(usersByMonth).map(([name, count]) => ({
      name,
      usuarios: count,
    }));

    return NextResponse.json(chartData);

  } catch (error: any) {
    console.error("Error fetching users-by-month stats:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
} 