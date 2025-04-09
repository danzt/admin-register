import { NextResponse } from "next/server";
import { login, loginSchema } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const loginResult = await login(result.data);

    if (loginResult.error) {
      return NextResponse.json({ error: loginResult.error }, { status: 400 });
    }

    // Configurar cookie de autenticación
    const response = NextResponse.json(loginResult);

    // Establecer cookie con token de sesión
    if (loginResult.user?.session) {
      response.cookies.set(
        "supabase-auth",
        loginResult.user.session.access_token,
        {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7, // 1 semana
          path: "/",
        }
      );
    }

    return response;
  } catch (error) {
    console.error("Login route error:", error);
    return NextResponse.json(
      { error: "Ocurrió un error durante el inicio de sesión" },
      { status: 500 }
    );
  }
}
