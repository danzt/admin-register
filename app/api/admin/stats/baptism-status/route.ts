import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("fecha_bautizo");

    if (usersError) {
      console.error("Error fetching users for baptism stats:", usersError);
      return NextResponse.json(
        { error: "Error fetching users data", details: usersError.message },
        { status: 500 }
      );
    }

    let baptizedCount = 0;
    let notBaptizedCount = 0;

    if (users) {
      users.forEach((user: any) => {
        if (user.fecha_bautizo) {
          baptizedCount++;
        } else {
          notBaptizedCount++;
        }
      });
    }

    const baptismData = [
      { name: "Bautizados", value: baptizedCount },
      { name: "No Bautizados", value: notBaptizedCount },
    ];

    return NextResponse.json(baptismData);

  } catch (error: any) {
    console.error("Error fetching baptism stats:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
} 