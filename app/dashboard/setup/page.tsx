"use client";

import { useState } from "react";
import { PageContainer } from "@/app/components/ui/page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Loader2, Database, RefreshCcw, Code, Terminal, ArrowRight, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function SetupPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sqlInstructions, setSqlInstructions] = useState<{
    message: string;
    sqlCommand: string;
    nextStep: string;
  } | null>(null);

  const handleSetup = async () => {
    if (!email) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor ingresa tu correo electrónico",
      });
      return;
    }

    setLoading(true);
    setSqlInstructions(null);
    
    try {
      const response = await fetch(`/api/admin/db-setup?email=${encodeURIComponent(email)}`);
      const data = await response.json();

      if (data.requiresManualUpdate) {
        // Si se requiere una actualización manual, mostramos las instrucciones
        setSqlInstructions({
          message: data.message,
          sqlCommand: data.sqlCommand,
          nextStep: data.nextStep,
        });
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || "Error en la configuración");
      }

      toast({
        title: "Éxito",
        description: data.message,
      });

      // Redirigir a la página de verificación de roles
      setTimeout(() => {
        window.location.href = "/dashboard/check-role";
      }, 2000);
    } catch (error) {
      console.error("Error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo configurar la base de datos. Por favor intenta nuevamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <div className="px-4 py-6">
        <Card className="border shadow-lg max-w-lg mx-auto">
          <CardHeader className="bg-primary/5">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Database className="h-6 w-6 text-primary" />
              Configuración de Base de Datos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {sqlInstructions ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Se requiere acción manual</h3>
                  <p className="text-sm text-amber-600">
                    {sqlInstructions.message}
                  </p>
                </div>

                <div className="bg-gray-900 text-white rounded-md p-4 font-mono text-sm overflow-x-auto">
                  <div className="flex items-center gap-2 text-gray-400 mb-2">
                    <Terminal className="h-4 w-4" />
                    <span>Ejecuta este comando SQL en tu base de datos:</span>
                  </div>
                  <code>{sqlInstructions.sqlCommand}</code>
                </div>

                <div className="text-sm text-gray-600">
                  <p>{sqlInstructions.nextStep}</p>
                </div>

                <div className="flex flex-col space-y-3">
                  <Button 
                    onClick={() => {
                      navigator.clipboard.writeText(sqlInstructions.sqlCommand);
                      toast({
                        title: "Copiado",
                        description: "Comando SQL copiado al portapapeles",
                      });
                    }}
                    variant="outline"
                  >
                    <Code className="mr-2 h-4 w-4" />
                    Copiar SQL
                  </Button>
                  
                  <Link href="/dashboard/setup/manual-sql" passHref>
                    <Button className="w-full" variant="secondary">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Ir a Ejecución Manual de SQL
                    </Button>
                  </Link>
                  
                  <Button
                    onClick={() => setSqlInstructions(null)}
                    variant="ghost"
                  >
                    Volver
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Añadir Columna de Roles</h3>
                  <p className="text-sm text-muted-foreground">
                    Esta página añadirá la columna de roles a la tabla de usuarios y 
                    establecerá tu usuario como administrador para que puedas acceder 
                    a la página de configuración.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Tu Correo Electrónico</Label>
                    <Input
                      id="email"
                      placeholder="correo@ejemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Ingresa el correo con el que te registraste en el sistema
                    </p>
                  </div>

                  <Button
                    onClick={handleSetup}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Configurando...
                      </>
                    ) : (
                      <>
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        Configurar Base de Datos
                      </>
                    )}
                  </Button>
                  
                  <div className="flex justify-center mt-2">
                    <Link href="/dashboard/setup/manual-sql" passHref className="text-xs text-blue-600 hover:underline flex items-center">
                      Ir a ejecución manual de SQL
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </div>
                  
                  <div className="mt-2 text-xs text-center">
                    <Link href="/dashboard/setup/manual-sql/add-exec-sql" className="text-amber-600 hover:underline flex items-center justify-center">
                      ¿Error "exec_sql"? Crea la función aquí
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground border-t pt-4 mt-4">
                  <p className="font-medium mb-1">Nota:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Esta operación añadirá la columna 'role' a la tabla 'users' si no existe</li>
                    <li>Tu usuario será actualizado con el rol 'admin'</li>
                    <li>Después podrás acceder a la página de configuración</li>
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
} 