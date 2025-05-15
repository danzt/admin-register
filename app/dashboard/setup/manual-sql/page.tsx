"use client";

import { useState } from "react";
import { PageContainer } from "@/app/components/ui/page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Loader2, Database, Play, AlertCircle, Code, ShieldCheck, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";

export default function ManualSqlPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [sql, setSql] = useState("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'usuario';");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null);

  const executeSQL = async () => {
    if (!sql.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor ingresa una consulta SQL",
      });
      return;
    }

    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch(`/api/admin/db-setup/sql?key=special_setup_key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sql,
          email: email.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setResult({
          success: false,
          error: data.error || "Error ejecutando SQL",
        });
        return;
      }

      setResult({
        success: true,
        message: data.message,
      });

      toast({
        title: "Éxito",
        description: data.message,
      });
    } catch (error) {
      console.error("Error:", error);
      setResult({
        success: false,
        error: "Error de conexión o servidor",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <div className="px-4 py-6">
        <Card className="border shadow-lg max-w-2xl mx-auto mb-6">
          <CardHeader className="bg-primary/5">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Code className="h-6 w-6 text-primary" />
              Ejecución Manual de SQL
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Herramientas Administrativas</AlertTitle>
                <AlertDescription>
                  Esta sección contiene herramientas para ejecutar SQL manualmente en la base de datos.
                  Estas operaciones son de nivel administrativo y deben ser utilizadas con precaución.
                </AlertDescription>
              </Alert>

              <div className="grid gap-4 md:grid-cols-2">
                <Link href="/dashboard/setup/manual-sql/add-exec-sql" passHref>
                  <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center justify-center text-left" asChild>
                    <div>
                      <Code className="h-10 w-10 mb-2 text-amber-500" />
                      <h3 className="text-base font-medium">Crear Función Exec SQL</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Crea la función necesaria para ejecutar comandos SQL administrativos.
                      </p>
                    </div>
                  </Button>
                </Link>

                <Link href="/dashboard/setup/manual-sql/execute-rls" passHref>
                  <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center justify-center text-left" asChild>
                    <div>
                      <ShieldCheck className="h-10 w-10 mb-2 text-green-500" />
                      <h3 className="text-base font-medium">Ejecutar Políticas RLS</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Aplica políticas de seguridad para tablas de permisos.
                      </p>
                    </div>
                  </Button>
                </Link>
              </div>

              <div className="text-xs text-muted-foreground border-t pt-4 mt-4">
                <p className="font-medium mb-1">Importante:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Si encuentras errores relacionados con "exec_sql", usa primero la opción "Crear Función Exec SQL"</li>
                  <li>Las políticas RLS son necesarias para el funcionamiento correcto del sistema de permisos</li>
                  <li>Estas operaciones requieren permisos de administrador</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Link href="/dashboard/setup" className="text-sm text-blue-600 hover:underline">
            Volver a la configuración principal
          </Link>
        </div>
      </div>
    </PageContainer>
  );
} 