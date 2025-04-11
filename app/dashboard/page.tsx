"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [localLoading, setLocalLoading] = useState(true);

  // Usar un efecto con un temporizador para evitar que la carga se quede atascada
  useEffect(() => {
    // Solo aplicamos el timer cuando el componente se monta inicialmente
    const timer = setTimeout(() => {
      setLocalLoading(false);
    }, 2000); // Después de 2 segundos, forzamos que no se muestre "cargando"

    return () => clearTimeout(timer);
  }, []);

  // Si todavía está cargando y no ha pasado el tiempo máximo, mostrar indicador
  if (loading && localLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-xl">Cargando...</p>
      </div>
    );
  }

  // Si no hay usuario después de cargar, redirigir al login
  if (!user) {
    router.push("/auth/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="container mx-auto px-4">
        <div className="bg-white shadow-md rounded-lg p-6 max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">
              Bienvenido,{" "}
              {user?.nombres || user?.correo?.split("@")[0] || "Usuario"}
            </h1>
            <Button onClick={logout} variant="outline">
              Cerrar sesión
            </Button>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Módulos disponibles</h2>
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={() => router.push("/dashboard/tablas")}
                variant="default"
              >
                Módulo de Tablas
              </Button>
              <Button
                onClick={() => router.push("/dashboard/importar")}
                variant="default"
              >
                Importar Usuarios
              </Button>
              <Button variant="outline" disabled>
                Módulo de Reportes (Próximamente)
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Datos personales</h2>
              <div className="space-y-3">
                <p>
                  <span className="font-medium">Cédula:</span>{" "}
                  {user?.cedula || "No disponible"}
                </p>
                <p>
                  <span className="font-medium">Nombre completo:</span>{" "}
                  {user?.nombres || "No disponible"} {user?.apellidos || ""}
                </p>
                <p>
                  <span className="font-medium">Correo:</span>{" "}
                  {user?.correo || "No disponible"}
                </p>
                <p>
                  <span className="font-medium">Teléfono:</span>{" "}
                  {user?.telefono || "No disponible"}
                </p>
                <p>
                  <span className="font-medium">Dirección:</span>{" "}
                  {user?.direccion || "No disponible"}
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">
                Información adicional
              </h2>
              <div className="space-y-3">
                <p>
                  <span className="font-medium">Estado de bautizo:</span>{" "}
                  {user?.fecha_bautizo ? "Bautizado" : "No bautizado"}
                </p>
                {user?.fecha_bautizo && (
                  <p>
                    <span className="font-medium">Fecha de bautizo:</span>{" "}
                    {new Date(user?.fecha_bautizo || "").toLocaleDateString()}
                  </p>
                )}
                <p>
                  <span className="font-medium">WhatsApp:</span>{" "}
                  {user?.whatsapp ? "Sí" : "No"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
