import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const cookieStore = cookies();
    const roleFromCookie = cookieStore.get("user-role")?.value;
    const authToken = cookieStore.get("supabase-auth")?.value;
    
    // Get user info from session if authenticated
    let userFromDb = null;
    let roleFromDb = null;
    let email = null;
    
    if (authToken) {
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (sessionData.session?.user?.email) {
        email = sessionData.session.user.email;
        
        // Get user data from database
        const { data: userData } = await supabase
          .from("users")
          .select("*")
          .eq("correo", email)
          .single();
        
        if (userData) {
          userFromDb = userData;
          roleFromDb = userData.role;
        }
      }
    }
    
    return NextResponse.json({
      roleFromCookie,
      authCookieExists: !!authToken,
      email,
      roleFromDb,
      userExists: !!userFromDb
    });
  } catch (error) {
    console.error("Check role error:", error);
    return NextResponse.json(
      { error: "Error checking role" },
      { status: 500 }
    );
  }
} 