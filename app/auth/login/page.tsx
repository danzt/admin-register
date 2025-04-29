"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { loginSchema } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";

export default function LoginPage() {
  const { login } = useAuth();
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: any) {
    setIsSubmitting(true);
    setErrorMessage("");
    const result = await login(data.email, data.password);

    if (result.error) {
      setErrorMessage(result.error);
    }
    setIsSubmitting(false);
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Iniciar sesión
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.email.message as string}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                {...register("password")}
                className={errors.password ? "border-red-500" : ""}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.password.message as string}
                </p>
              )}
            </div>
          </div>

          {errorMessage && (
            <p className="text-center text-red-500">{errorMessage}</p>
          )}

          <div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Iniciando sesión..." : "Iniciar sesión"}
            </Button>
          </div>
        </form>

        <p className="mt-2 text-center text-sm text-gray-600">
          ¿No tienes una cuenta?{" "}
          <Link
            href="/auth/register"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Registrarse
          </Link>
        </p>
      </div>
    </div>
  );
}
