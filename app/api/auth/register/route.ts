import { NextResponse } from "next/server";
import { register, registerSchema } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const registerResult = await register(result.data);

    if (registerResult.error) {
      let statusCode = 400;

      if (
        registerResult.error.includes("ya está registrado") ||
        registerResult.error.includes("already exists")
      ) {
        statusCode = 409;
      }

      return NextResponse.json(
        { error: registerResult.error },
        { status: statusCode }
      );
    }

    return NextResponse.json(registerResult);
  } catch (error) {
    console.error("Registration route error:", error);
    return NextResponse.json(
      { error: "Ocurrió un error durante el registro" },
      { status: 500 }
    );
  }
}
