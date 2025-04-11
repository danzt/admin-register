"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, FileSpreadsheet, Upload, X } from "lucide-react";

type UserRow = {
  cedula: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  direccion: string;
  correo: string;
  fecha_bautizo?: string;
  whatsapp: boolean;
  error?: string;
  valid: boolean;
};

interface UserImportDropzoneProps {
  onUsersImported: (users: UserRow[]) => void;
  isProcessing: boolean;
}

export default function UserImportDropzone({
  onUsersImported,
  isProcessing,
}: UserImportDropzoneProps) {
  const [fileSelected, setFileSelected] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const processExcelFile = (file: File) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
        }) as any[][];

        // Validar encabezados
        const expectedHeaders = [
          "CEDULA",
          "NOMBRES",
          "APELLIDOS",
          "TELÉFONO",
          "DIRECCIÓN",
          "CORREO",
          "FECHA_BAUTIZO",
          "WHATSAPP",
        ];
        const headers = jsonData[0]?.map((header) =>
          String(header).toUpperCase().trim()
        );

        console.log("headers", headers);

        const missingHeaders = expectedHeaders.filter(
          (header) => !headers?.includes(header)
        );

        console.log("missingHeaders", missingHeaders);
        if (missingHeaders.length > 0) {
          setError(
            `Faltan columnas en el archivo: ${missingHeaders.join(", ")}`
          );
          return;
        }

        // Mapear índices de columnas
        const headerMap = headers.reduce((map, header, index) => {
          map[header] = index;
          return map;
        }, {} as Record<string, number>);

        // Procesar los datos
        const processedUsers: UserRow[] = [];

        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length === 0 || !row[headerMap["CÉDULA"]]) continue;

          // Convertir 'si/no' a boolean para whatsapp
          const whatsappValue = String(
            row[headerMap["WHATSAPP"]] || ""
          ).toLowerCase();
          const isWhatsapp =
            whatsappValue === "si" ||
            whatsappValue === "sí" ||
            whatsappValue === "yes" ||
            whatsappValue === "true" ||
            whatsappValue === "1";

          // Formatear fecha de bautizo si existe
          let fechaBautizo = row[headerMap["FECHA_BAUTIZO"]];
          if (fechaBautizo) {
            // Si es un número de Excel (fecha serializada)
            if (typeof fechaBautizo === "number") {
              fechaBautizo = XLSX.SSF.format("yyyy-mm-dd", fechaBautizo);
            } else {
              // Intentar convertir a formato ISO
              const date = new Date(fechaBautizo);
              if (!isNaN(date.getTime())) {
                fechaBautizo = date.toISOString().split("T")[0];
              }
            }
          }

          const cedula = String(row[headerMap["CÉDULA"]] || "").trim();
          const nombres = String(row[headerMap["NOMBRES"]] || "").trim();
          const apellidos = String(row[headerMap["APELLIDOS"]] || "").trim();
          const telefono = String(row[headerMap["TELÉFONO"]] || "").trim();
          const direccion = String(row[headerMap["DIRECCIÓN"]] || "").trim();
          const correo = String(row[headerMap["CORREO"]] || "").trim();

          // Validar datos obligatorios
          const valid = !!(
            cedula &&
            nombres &&
            apellidos &&
            telefono &&
            direccion &&
            correo
          );
          let errorMsg = valid ? undefined : "Faltan campos obligatorios";

          // Validar formato de correo
          if (valid && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
            errorMsg = "Formato de correo inválido";
          }

          processedUsers.push({
            cedula,
            nombres,
            apellidos,
            telefono,
            direccion,
            correo,
            fecha_bautizo: fechaBautizo ? String(fechaBautizo) : undefined,
            whatsapp: isWhatsapp,
            error: errorMsg,
            valid: !errorMsg,
          });
        }

        if (processedUsers.length === 0) {
          setError("No se encontraron datos válidos en el archivo");
          return;
        }

        onUsersImported(processedUsers);
        setError(null);
      } catch (err) {
        console.error("Error procesando archivo:", err);
        setError(
          "Error al procesar el archivo. Asegúrate de que es un archivo Excel válido."
        );
      }
    };

    reader.onerror = () => {
      setError("Error al leer el archivo");
    };

    reader.readAsBinaryString(file);
  };

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        setFileSelected(file);
        processExcelFile(file);
      }
    },
    [onUsersImported]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "application/vnd.ms-excel": [".xls"],
    },
    maxFiles: 1,
    disabled: isProcessing,
  });

  const resetSelection = () => {
    setFileSelected(null);
    setError(null);
  };

  return (
    <div className="mb-6">
      {!fileSelected ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors
            ${
              isDragActive
                ? "border-primary bg-primary/10"
                : "border-gray-300 hover:border-primary hover:bg-primary/5"
            }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center space-y-3">
            <FileSpreadsheet size={48} className="text-gray-400" />
            <div className="font-medium">
              {isDragActive ? (
                <p>Suelta el archivo aquí...</p>
              ) : (
                <p>
                  Arrastra un archivo Excel (.xlsx) o haz clic para
                  seleccionarlo
                </p>
              )}
            </div>
            <p className="text-sm text-gray-500">
              El archivo debe incluir las columnas: CÉDULA, NOMBRES, APELLIDOS,
              TELÉFONO, DIRECCIÓN, CORREO, FECHA_BAUTIZO, WHATSAPP
            </p>
          </div>
        </div>
      ) : (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileSpreadsheet size={24} className="text-green-600" />
              <div>
                <p className="font-medium">{fileSelected.name}</p>
                <p className="text-sm text-gray-500">
                  {Math.round(fileSelected.size / 1024)} KB
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={resetSelection}
              disabled={isProcessing}
            >
              <X size={20} />
            </Button>
          </div>
        </Card>
      )}

      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end mt-4">
        <Button
          onClick={() => fileSelected && processExcelFile(fileSelected)}
          disabled={!fileSelected || isProcessing}
          className="flex items-center gap-2"
        >
          <Upload size={18} />
          Procesar Archivo
        </Button>
      </div>
    </div>
  );
}
