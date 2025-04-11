"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function TablasPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Proteger la ruta
  useEffect(() => {
    console.log("TablasPage: Estado de autenticación:", { loading, user });
    if (!loading && !user) {
      console.log("TablasPage: Usuario no autenticado, redirigiendo a login");
      router.push("/auth/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-xl">Cargando...</p>
      </div>
    );
  }

  if (!user) {
    return null; // No renderizar nada si no hay usuario (se redirigirá)
  }

  // Datos de ejemplo para mostrar en la tabla
  const datos = [
    {
      id: 1,
      nombre: "Juan Pérez",
      email: "juan@ejemplo.com",
      rol: "Administrador",
    },
    {
      id: 2,
      nombre: "María López",
      email: "maria@ejemplo.com",
      rol: "Usuario",
    },
    {
      id: 3,
      nombre: "Carlos Rodríguez",
      email: "carlos@ejemplo.com",
      rol: "Editor",
    },
    { id: 4, nombre: "Ana Martínez", email: "ana@ejemplo.com", rol: "Usuario" },
    {
      id: 5,
      nombre: "Roberto Sánchez",
      email: "roberto@ejemplo.com",
      rol: "Administrador",
    },
  ];

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Módulo de Tablas</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Usuarios del Sistema</CardTitle>
          <CardDescription>
            Lista de usuarios registrados en la plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex justify-end">
            <Button>Agregar Usuario</Button>
          </div>

          <Table>
            <TableCaption>Lista completa de usuarios</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {datos.map((usuario) => (
                <TableRow key={usuario.id}>
                  <TableCell>{usuario.id}</TableCell>
                  <TableCell>{usuario.nombre}</TableCell>
                  <TableCell>{usuario.email}</TableCell>
                  <TableCell>{usuario.rol}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" className="mr-2">
                      Editar
                    </Button>
                    <Button variant="destructive" size="sm">
                      Eliminar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Otra Tabla de Ejemplo</CardTitle>
          <CardDescription>
            Demostración del componente de tabla con diferentes datos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead className="text-right">Stock</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Laptop Pro</TableCell>
                <TableCell>Electrónica</TableCell>
                <TableCell>$1,200.00</TableCell>
                <TableCell className="text-right">15</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Teclado RGB</TableCell>
                <TableCell>Accesorios</TableCell>
                <TableCell>$89.99</TableCell>
                <TableCell className="text-right">42</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Monitor 27&quot;</TableCell>
                <TableCell>Electrónica</TableCell>
                <TableCell>$299.99</TableCell>
                <TableCell className="text-right">8</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
