"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { PageContainer } from "@/app/components/ui/page-container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Settings, Users, Shield } from "lucide-react";
import { RolesTab } from "./roles-tab";
import { UsersRolesTab } from "./users-roles-tab";
import { useRouter } from "next/navigation";

export default function ConfiguracionPage() {
  const { user, loading, hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState("roles");
  const [accessDenied, setAccessDenied] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Verificar si el usuario tiene acceso
    if (!loading && user && !hasRole(["admin", "staff"])) {
      setAccessDenied(true);
      // Redirigir al dashboard después de un pequeño retraso
      const timer = setTimeout(() => {
        router.push("/dashboard");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [loading, user, hasRole, router]);

  if (loading) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-xl text-gray-600">Cargando configuración...</p>
        </div>
      </PageContainer>
    );
  }

  if (accessDenied) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
          <Shield className="h-16 w-16 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-red-500 mb-2">Acceso Denegado</h1>
          <p className="text-gray-600 text-center max-w-md">
            No tienes permisos para acceder a esta sección. 
            Serás redirigido al dashboard en breve.
          </p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="px-4 pt-6 pb-4 space-y-6">
        <div className="mb-2">
          <Breadcrumb
            items={[
              { label: "Dashboard", href: "/dashboard" },
              { label: "Configuración", href: "/dashboard/configuracion" },
            ]}
          />
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Settings className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl font-bold text-primary">
                Configuración del Sistema
              </CardTitle>
            </div>
            <CardDescription>
              Gestiona roles, permisos y accesos de usuarios en el sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              defaultValue={activeTab}
              onValueChange={setActiveTab}
              className="space-y-4"
            >
              <TabsList className="grid grid-cols-2 w-[400px]">
                <TabsTrigger value="roles" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span>Roles y Permisos</span>
                </TabsTrigger>
                <TabsTrigger value="users" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>Usuarios y Roles</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="roles" className="space-y-4">
                <RolesTab />
              </TabsContent>

              <TabsContent value="users" className="space-y-4">
                <UsersRolesTab />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
} 