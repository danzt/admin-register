"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Dropzone } from "@/components/importar/dropzone";
import { ImportTable } from "@/components/importar/import-table";
import { Loader2, Upload, Check, AlertCircle } from "lucide-react";

export default function ImportarPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [fileData, setFileData] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{
    success: number;
    failed: number;
    skipped: number;
    errors?: Array<{ cedula: string; error: string }>;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<
    "idle" | "ready" | "processing" | "success" | "error"
  >("idle");

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-xl">Cargando...</p>
      </div>
    );
  }

  if (!user) {
    router.push("/auth/login");
    return null;
  }

  const handleFileData = (data: any[]) => {
    setFileData(data);
    setStatus("ready");
    setError(null);
  };

  const handleImport = async () => {
    if (fileData.length === 0) {
      setError("No hay datos para importar");
      return;
    }

    setIsProcessing(true);
    setStatus("processing");
    setProgress(0);
    setResult(null);
    setError(null);

    try {
      const totalItems = fileData.length;
      let processed = 0;
      let success = 0;
      let failed = 0;
      let skipped = 0;
      let errors: Array<{ cedula: string; error: string }> = [];

      // Procesar lotes de 5 usuarios a la vez
      for (let i = 0; i < fileData.length; i += 5) {
        const batch = fileData.slice(i, i + 5);

        const response = await fetch("/api/admin/import-users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ users: batch }),
        });

        const result = await response.json();

        processed += batch.length;
        success += result.success || 0;
        failed += result.failed || 0;
        skipped += result.skipped || 0;

        // Acumular errores
        if (result.errors) {
          errors = [...errors, ...result.errors];
        }

        setProgress(Math.round((processed / totalItems) * 100));

        // Pequeña pausa para no sobrecargar el servidor
        if (i + 5 < fileData.length) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }

      setResult({ success, failed, skipped, errors });
      setStatus("success");
    } catch (error) {
      console.error("Error importando usuarios:", error);
      setError(
        "Ocurrió un error al importar los usuarios. Por favor, inténtalo de nuevo."
      );
      setStatus("error");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <div className="flex-grow p-4 overflow-auto">
        <Card className="h-full flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold">
                  Importar Usuarios
                </CardTitle>
                <CardDescription>
                  Importa usuarios desde un archivo Excel (.xlsx) con toda su
                  información personal.
                </CardDescription>
              </div>
              {status === "ready" && (
                <Button onClick={handleImport} disabled={isProcessing}>
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Importar Usuarios
                    </>
                  )}
                </Button>
              )}
              {(status === "success" || status === "error") && (
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFileData([]);
                      setStatus("idle");
                      setResult(null);
                      setError(null);
                    }}
                  >
                    Importar otro archivo
                  </Button>
                  <Button onClick={() => router.push("/dashboard")}>
                    Volver al Dashboard
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-grow overflow-hidden pt-2">
            {status === "idle" && (
              <div className="h-full flex items-center justify-center">
                <div className="w-full max-w-3xl mx-auto">
                  <Dropzone onFileData={handleFileData} />
                </div>
              </div>
            )}

            {status === "ready" && fileData.length > 0 && (
              <div className="h-full flex flex-col">
                <div className="mb-4">
                  <h3 className="text-lg font-medium">
                    {fileData.length} usuarios listos para importar
                  </h3>
                </div>
                <div className="flex-grow overflow-hidden">
                  <ImportTable data={fileData} />
                </div>
              </div>
            )}

            {status === "processing" && (
              <div className="h-full flex flex-col items-center justify-center space-y-4">
                <div className="flex items-center">
                  <Loader2 className="h-5 w-5 mr-2 animate-spin text-primary" />
                  <span>Importando usuarios ({progress}%)...</span>
                </div>
                <div className="w-full max-w-md">
                  <Progress value={progress} />
                </div>
              </div>
            )}

            {status === "success" && result && (
              <div className="h-full flex flex-col">
                <Alert className="bg-green-50 border-green-200 mb-4">
                  <Check className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800">
                    Importación completada
                  </AlertTitle>
                  <AlertDescription className="text-green-700">
                    Se importaron {result.success} usuarios exitosamente.
                    {result.skipped > 0 &&
                      ` ${result.skipped} usuarios fueron ignorados por tener datos incorrectos.`}
                    {result.failed > 0 &&
                      ` ${result.failed} usuarios no pudieron ser importados.`}
                  </AlertDescription>
                </Alert>

                {result.errors && result.errors.length > 0 && (
                  <div className="mb-4 p-4 rounded-md bg-gray-50 border">
                    <h4 className="font-medium mb-2">
                      Detalles de los problemas:
                    </h4>
                    <div className="max-h-40 overflow-y-auto text-sm">
                      <ul className="space-y-1 list-disc pl-5">
                        {result.errors.slice(0, 10).map((error, idx) => (
                          <li
                            key={idx}
                            className={
                              error.error.includes("Ignorado")
                                ? "text-amber-600"
                                : "text-red-600"
                            }
                          >
                            <span className="font-medium">{error.cedula}:</span>{" "}
                            {error.error}
                          </li>
                        ))}
                        {result.errors.length > 10 && (
                          <li className="text-gray-500">
                            Y {result.errors.length - 10} problemas más...
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                )}

                {fileData.length > 0 && (
                  <div className="flex-grow overflow-hidden">
                    <ImportTable data={fileData} />
                  </div>
                )}
              </div>
            )}

            {status === "error" && error && (
              <div className="h-full flex flex-col">
                <Alert className="bg-red-50 border-red-200 mb-4">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertTitle className="text-red-800">Error</AlertTitle>
                  <AlertDescription className="text-red-700">
                    {error}
                  </AlertDescription>
                </Alert>
                {fileData.length > 0 && (
                  <div className="flex-grow overflow-hidden">
                    <ImportTable data={fileData} />
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
