"use client";

import { useState } from "react";
import { PageContainer } from "@/app/components/ui/page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Database, ShieldCheck, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";

export default function ExecuteRLSPoliciesPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null);

  const executeRLSPolicies = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      // Políticas para permissions
      await supabase.rpc('exec_sql', {
        sql: `
        -- Desactivar y reactivar RLS para permissions
        ALTER TABLE permissions DISABLE ROW LEVEL SECURITY;
        ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;

        -- Crear política para permitir acceso de lectura a todos los usuarios autenticados
        DROP POLICY IF EXISTS "Permitir lectura a usuarios autenticados" ON permissions;
        CREATE POLICY "Permitir lectura a usuarios autenticados" ON permissions
            FOR SELECT
            USING (auth.role() = 'authenticated');

        -- Crear política para permitir operaciones CRUD a usuarios con rol 'admin'
        DROP POLICY IF EXISTS "Permitir CRUD a administradores" ON permissions;
        CREATE POLICY "Permitir CRUD a administradores" ON permissions
            FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM users
                    WHERE users.id = auth.uid()
                    AND users.role = 'admin'
                )
            );
        `
      });

      // Políticas para role_permissions
      await supabase.rpc('exec_sql', {
        sql: `
        -- Desactivar y reactivar RLS para role_permissions
        ALTER TABLE role_permissions DISABLE ROW LEVEL SECURITY;
        ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

        -- Crear política para permitir lectura a todos los usuarios autenticados
        DROP POLICY IF EXISTS "Permitir lectura a usuarios autenticados" ON role_permissions;
        CREATE POLICY "Permitir lectura a usuarios autenticados" ON role_permissions
            FOR SELECT
            USING (auth.role() = 'authenticated');

        -- Crear política para permitir operaciones CRUD a usuarios con rol 'admin'
        DROP POLICY IF EXISTS "Permitir CRUD a administradores" ON role_permissions;
        CREATE POLICY "Permitir CRUD a administradores" ON role_permissions
            FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM users
                    WHERE users.id = auth.uid()
                    AND users.role = 'admin'
                )
            );
        `
      });

      // Permisos de acceso
      await supabase.rpc('exec_sql', {
        sql: `
        -- Asegurarse de que el esquema público sea accesible para el rol anon y authenticated
        GRANT USAGE ON SCHEMA public TO anon, authenticated;

        -- Dar permisos de SELECT a anon y authenticated
        GRANT SELECT ON permissions TO anon, authenticated;
        GRANT SELECT ON role_permissions TO anon, authenticated;

        -- Dar permisos completos a authenticated (los administradores serán filtrados por RLS)
        GRANT ALL ON permissions TO authenticated;
        GRANT ALL ON role_permissions TO authenticated;

        -- Dar permisos completos en las secuencias asociadas si es necesario
        GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
        `
      });

      setResult({
        success: true,
        message: "Las políticas RLS han sido actualizadas correctamente."
      });

      toast({
        title: "Éxito",
        description: "Las políticas RLS han sido actualizadas correctamente.",
      });
    } catch (error: any) {
      console.error("Error:", error);
      setResult({
        success: false,
        error: error.message || "Error al actualizar las políticas RLS"
      });
      
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Error al actualizar las políticas RLS",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <div className="px-4 py-6">
        <Card className="border shadow-lg max-w-2xl mx-auto">
          <CardHeader className="bg-primary/5">
            <CardTitle className="flex items-center gap-2 text-xl">
              <ShieldCheck className="h-6 w-6 text-primary" />
              Actualización de Políticas RLS
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Precaución</AlertTitle>
                <AlertDescription>
                  Esta herramienta actualizará las políticas de seguridad (RLS) para las tablas
                  permissions y role_permissions. Asegúrate de tener permisos de administrador.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="text-sm text-gray-700">
                  <p>Esta operación realizará los siguientes cambios:</p>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>Establecerá políticas RLS para las tablas <code>permissions</code> y <code>role_permissions</code></li>
                    <li>Permitirá a usuarios con rol &apos;admin&apos; realizar operaciones CRUD en ambas tablas</li>
                    <li>Permitirá a todos los usuarios autenticados consultar las tablas</li>
                    <li>Configurará los permisos necesarios a nivel de base de datos</li>
                  </ul>
                </div>

                <Button
                  onClick={executeRLSPolicies}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Actualizando políticas...
                    </>
                  ) : (
                    <>
                      <Database className="mr-2 h-4 w-4" />
                      Actualizar Políticas RLS
                    </>
                  )}
                </Button>
              </div>

              {result && (
                <div className={`p-4 rounded-md ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <p className={`font-medium ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                    {result.success ? 'Éxito' : 'Error'}
                  </p>
                  <p className={`text-sm mt-1 ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                    {result.message || result.error}
                  </p>
                </div>
              )}

              <div className="text-xs text-muted-foreground border-t pt-4 mt-4">
                <p className="font-medium mb-1">Notas:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Esta operación requiere permisos de administrador para ejecutarse correctamente</li>
                  <li>Si encuentras errores, es posible que necesites ejecutar los comandos directamente en Supabase</li>
                  <li>Después de ejecutar, puedes regresar a la configuración y verificar que las operaciones funcionen correctamente</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
} 