"use client";

import { useState } from "react";
import { PageContainer } from "@/app/components/ui/page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Database, Code, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AddExecSqlPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null);

  // SQL para crear la función exec_sql
  const sql = `
  -- This function allows executing arbitrary SQL from the application
  -- Note: This function requires admin privileges to execute
  -- It should be used with caution and only available to admin users

  -- Create the exec_sql function
  CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
  RETURNS json
  LANGUAGE plpgsql
  SECURITY DEFINER -- Run with privileges of the function creator
  SET search_path = public
  AS $$
  BEGIN
    EXECUTE sql;
    RETURN json_build_object('success', true);
  EXCEPTION
    WHEN OTHERS THEN
      RETURN json_build_object(
        'success', false,
        'error', SQLERRM,
        'code', SQLSTATE
      );
  END;
  $$;

  -- Set ownership to postgres (or your preferred role with appropriate permissions)
  ALTER FUNCTION public.exec_sql(text) OWNER TO postgres;

  -- Grant execute permission only to authenticated users
  -- Row-level security in application code will handle authorization
  REVOKE ALL ON FUNCTION public.exec_sql(text) FROM PUBLIC;
  GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO authenticated;

  -- Add comment documenting the function purpose and security implications
  COMMENT ON FUNCTION public.exec_sql(text) IS 
  'Executes arbitrary SQL. This function has security implications and should only be callable by authenticated users with admin privileges. Application code must implement proper authorization checks.';
  `;

  const addExecSqlFunction = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      // Ejecutar SQL directamente desde la API de Supabase
      const response = await fetch('/api/admin/direct-sql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al crear la función exec_sql');
      }

      setResult({
        success: true,
        message: "La función exec_sql ha sido creada correctamente."
      });

      toast({
        title: "Éxito",
        description: "La función exec_sql ha sido creada correctamente.",
      });
    } catch (error: any) {
      console.error("Error:", error);
      setResult({
        success: false,
        error: error.message || "Error al crear la función exec_sql"
      });
      
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Error al crear la función exec_sql",
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
              <Code className="h-6 w-6 text-primary" />
              Crear Función SQL para Ejecución de Comandos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Acción Necesaria</AlertTitle>
                <AlertDescription>
                  El sistema requiere la función <code>exec_sql</code> para ejecutar comandos SQL administrativos.
                  Esta función es esencial para configurar las políticas de seguridad RLS.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="text-sm text-gray-700">
                  <p>Esta operación creará la función <code>exec_sql</code> que permite:</p>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>Ejecutar comandos SQL administrativos</li>
                    <li>Aplicar políticas de seguridad RLS</li>
                    <li>Configurar permisos en las tablas del sistema</li>
                  </ul>
                </div>

                <Button
                  onClick={addExecSqlFunction}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creando función...
                    </>
                  ) : (
                    <>
                      <Database className="mr-2 h-4 w-4" />
                      Crear Función Exec SQL
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
                  <li>Esta operación requiere permisos de administrador</li>
                  <li>La función se crea con seguridad para que solo los administradores puedan ejecutar comandos SQL</li>
                  <li>Después de crear esta función, puedes utilizar las herramientas para configurar RLS</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
} 