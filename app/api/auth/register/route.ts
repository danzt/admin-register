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
      return NextResponse.json(
        { error: registerResult.error },
        { status: 400 }
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
