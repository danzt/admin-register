"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { registerSchema } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";
import type { z } from "zod";

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [esBautizado, setEsBautizado] = useState(false);
  const { register: registerUser, loading } = useAuth();
  const [errorMessage, setErrorMessage] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      whatsapp: false,
    },
  });

  const whatsappValue = watch("whatsapp");

  async function onSubmit(data: any) {
    try {
      // Si no es bautizado, eliminamos la fecha de bautizo
      if (!esBautizado) {
        data.fechaBautizo = null;
      }

      setErrorMessage("");
      const result = await registerUser(data);
      if (result.error) {
        setErrorMessage(result.error);
      }
    } catch (error) {
      console.error("Error in onSubmit:", error);
      setErrorMessage("Ocurrió un error durante el registro");
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Crear nueva cuenta
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <Label htmlFor="cedula">Cédula</Label>
              <Input
                id="cedula"
                type="text"
                {...register("cedula")}
                className={errors.cedula ? "border-red-500" : ""}
              />
              {errors.cedula && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.cedula.message as string}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Debe ser única en el sistema. Si ya estás registrado, ve a
                iniciar sesión.
              </p>
            </div>

            <div>
              <Label htmlFor="nombres">Nombres</Label>
              <Input
                id="nombres"
                type="text"
                {...register("nombres")}
                className={errors.nombres ? "border-red-500" : ""}
              />
              {errors.nombres && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.nombres.message as string}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="apellidos">Apellidos</Label>
              <Input
                id="apellidos"
                type="text"
                {...register("apellidos")}
                className={errors.apellidos ? "border-red-500" : ""}
              />
              {errors.apellidos && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.apellidos.message as string}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                type="tel"
                {...register("telefono")}
                className={errors.telefono ? "border-red-500" : ""}
              />
              {errors.telefono && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.telefono.message as string}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="direccion">Dirección</Label>
              <Input
                id="direccion"
                type="text"
                {...register("direccion")}
                className={errors.direccion ? "border-red-500" : ""}
              />
              {errors.direccion && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.direccion.message as string}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="correo">Correo electrónico</Label>
              <Input
                id="correo"
                type="email"
                {...register("correo")}
                className={errors.correo ? "border-red-500" : ""}
              />
              {errors.correo && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.correo.message as string}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Debe ser único en el sistema. Si ya estás registrado, ve a
                iniciar sesión.
              </p>
            </div>

            <div className="flex items-center space-x-2 mb-2">
              <Switch
                id="esBautizado"
                checked={esBautizado}
                onCheckedChange={setEsBautizado}
              />
              <Label htmlFor="esBautizado">¿Es bautizado?</Label>
            </div>

            {esBautizado && (
              <div>
                <Label htmlFor="fechaBautizo">Fecha de Bautizo</Label>
                <Input
                  id="fechaBautizo"
                  type="date"
                  {...register("fechaBautizo")}
                  className={errors.fechaBautizo ? "border-red-500" : ""}
                />
                {errors.fechaBautizo && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.fechaBautizo.message as string}
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Switch
                id="whatsapp"
                checked={whatsappValue}
                onCheckedChange={(checked) => setValue("whatsapp", checked)}
              />
              <Label htmlFor="whatsapp">¿Pertenece al grupo de WhatsApp?</Label>
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
              <p className="mt-1 text-xs text-gray-500">
                Mínimo 8 caracteres
              </p>
            </div>
          </div>

          {errorMessage && (
            <p className="text-center text-red-500">{errorMessage}</p>
          )}

          <div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Registrando..." : "Registrarse"}
            </Button>
          </div>
        </form>

        <p className="mt-2 text-center text-sm text-gray-600">
          ¿Ya tienes una cuenta?{" "}
          <Link
            href="/auth/login"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
