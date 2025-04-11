"use client";

import { useState, useCallback } from "react";
import * as XLSX from "xlsx";
import { useToast } from "@/hooks/use-toast";
import { UploadCloud, File, X, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

type DropzoneProps = {
  onFileData: (data: any[]) => void;
};

export const Dropzone = ({ onFileData }: DropzoneProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const { toast } = useToast();

  const processExcel = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        setWarnings([]);
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheet];

        // Convertir a JSON con encabezados
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: "A",
          blankrows: false,
          raw: false,
        });

        if (jsonData.length <= 1) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "El archivo no contiene datos suficientes",
          });
          return;
        }

        // Extraer los encabezados
        const headers = jsonData[1] as Record<string, any>;

        // Identificar las columnas requeridas
        const cedulaIdx = Object.keys(headers).find((key) =>
          headers[key]?.toString().toLowerCase().includes("cedula")
        );
        const nombresIdx = Object.keys(headers).find((key) =>
          headers[key]?.toString().toLowerCase().includes("nombre")
        );
        const apellidosIdx = Object.keys(headers).find((key) =>
          headers[key]?.toString().toLowerCase().includes("apellido")
        );
        const telefonoIdx = Object.keys(headers).find((key) =>
          headers[key]?.toString().toLowerCase().includes("telefono")
        );
        const direccionIdx = Object.keys(headers).find((key) =>
          headers[key]?.toString().toLowerCase().includes("direcc")
        );
        const correoIdx = Object.keys(headers).find((key) =>
          headers[key]?.toString().toLowerCase().includes("correo")
        );
        const bautizoIdx = Object.keys(headers).find((key) =>
          headers[key]?.toString().toLowerCase().includes("bautizo")
        );
        const whatsappIdx = Object.keys(headers).find(
          (key) =>
            headers[key]?.toString().toLowerCase().includes("whasa") ||
            headers[key]?.toString().toLowerCase().includes("whats")
        );

        const newWarnings: string[] = [];

        if (!cedulaIdx) {
          newWarnings.push("No se encontró la columna para Cédula");
        }
        if (!nombresIdx) {
          newWarnings.push("No se encontró la columna para Nombres");
        }
        if (!apellidosIdx) {
          newWarnings.push("No se encontró la columna para Apellidos");
        }

        if (!cedulaIdx && !nombresIdx && !apellidosIdx) {
          toast({
            variant: "destructive",
            title: "Error",
            description:
              "El archivo no contiene las columnas mínimas requeridas (Cédula, Nombres, Apellidos)",
          });
          return;
        }

        // Procesar los datos
        const processedData = jsonData
          .slice(1)
          .map((row: any, index) => {
            // Limpiar y formatear los datos
            const cedula = cedulaIdx
              ? row[cedulaIdx]?.toString().trim() || ""
              : "";
            const nombres = nombresIdx
              ? row[nombresIdx]?.toString().trim() || ""
              : "";
            const apellidos = apellidosIdx
              ? row[apellidosIdx]?.toString().trim() || ""
              : "";
            const telefono = telefonoIdx
              ? row[telefonoIdx]?.toString().trim() || ""
              : "";
            const direccion = direccionIdx
              ? row[direccionIdx]?.toString().trim() || ""
              : "";
            const correo = correoIdx
              ? row[correoIdx]?.toString().trim() || ""
              : "";

            // Verificar datos mínimos por fila
            if (!cedula && !nombres && !apellidos) {
              // Ignorar filas completamente vacías sin generar advertencia
              return null;
            }

            // Verificar datos inválidos y registrar advertencias
            if (!cedula) {
              newWarnings.push(
                `Fila ${index + 2}: Falta cédula para "${nombres} ${apellidos}"`
              );
            }
            if (!nombres && !apellidos) {
              newWarnings.push(
                `Fila ${
                  index + 2
                }: Faltan nombre y apellido para cédula "${cedula}"`
              );
            }

            // Validación y corrección de correo electrónico
            let correoValidado = correo;
            if (correoIdx && correo) {
              if (!correo.includes("@") || !correo.includes(".")) {
                newWarnings.push(
                  `Fila ${index + 2}: Correo inválido "${correo}" para "${
                    cedula || nombres
                  }" - se asignará valor nulo`
                );
                correoValidado = ""; // Se asignará null en la base de datos
              }
            }

            // Procesar fecha de bautizo
            let fechaBautizo = null;
            let fechaValida = false;
            if (bautizoIdx && row[bautizoIdx]) {
              // Intentar interpretar la fecha en varios formatos
              if (typeof row[bautizoIdx] === "string") {
                const dateStr = row[bautizoIdx].trim();
                // Intentar detectar diferentes formatos de fecha
                if (dateStr.includes("/")) {
                  const parts = dateStr.split("/");
                  if (parts.length === 3) {
                    try {
                      // Formato DD/MM/YYYY o MM/DD/YYYY
                      const year =
                        parts[2].length === 2 ? `20${parts[2]}` : parts[2];
                      const month = parts[1].padStart(2, "0");
                      const day = parts[0].padStart(2, "0");
                      const dateObj = new Date(`${year}-${month}-${day}`);

                      // Verificar si es una fecha válida
                      if (!isNaN(dateObj.getTime())) {
                        fechaBautizo = `${year}-${month}-${day}`;
                        fechaValida = true;
                      }
                    } catch (e) {
                      // Fecha inválida - se mantendrá como null
                    }
                  }
                } else if (dateStr.includes("-")) {
                  try {
                    // Puede ser YYYY-MM-DD
                    const dateObj = new Date(dateStr);
                    if (!isNaN(dateObj.getTime())) {
                      fechaBautizo = dateStr;
                      fechaValida = true;
                    }
                  } catch (e) {
                    // Fecha inválida - se mantendrá como null
                  }
                } else if (/^\d{4}$/.test(dateStr)) {
                  // Solo año
                  fechaBautizo = `${dateStr}-01-01`;
                  fechaValida = true;
                } else {
                  // Intenta con month-year (Feb-10)
                  const months: Record<string, string> = {
                    ene: "01",
                    feb: "02",
                    mar: "03",
                    abr: "04",
                    may: "05",
                    jun: "06",
                    jul: "07",
                    ago: "08",
                    sep: "09",
                    oct: "10",
                    nov: "11",
                    dic: "12",
                  };

                  const monthMatch = Object.keys(months).find((m) =>
                    dateStr.toLowerCase().startsWith(m)
                  );

                  if (monthMatch) {
                    try {
                      const yearPart = dateStr.replace(/[a-zA-Z-]/g, "").trim();
                      const year =
                        yearPart.length === 2 ? `20${yearPart}` : yearPart;
                      if (!isNaN(parseInt(year))) {
                        fechaBautizo = `${year}-${months[monthMatch]}-01`;
                        fechaValida = true;
                      }
                    } catch (e) {
                      // Fecha inválida - se mantendrá como null
                    }
                  }
                }

                if (!fechaValida && dateStr) {
                  newWarnings.push(
                    `Fila ${
                      index + 2
                    }: Fecha de bautizo inválida "${dateStr}" para "${
                      cedula || nombres
                    }" - se asignará valor nulo`
                  );
                }
              }
            }

            // Procesar WhatsApp
            const whatsapp =
              whatsappIdx && row[whatsappIdx]
                ? row[whatsappIdx].toString().toLowerCase().includes("si") ||
                  row[whatsappIdx].toString().toLowerCase() === "true"
                : false;

            return {
              cedula,
              nombres,
              apellidos,
              telefono,
              direccion,
              correo: correoValidado, // Correo validado o vacío
              fechaBautizo, // Fecha validada o null
              whatsapp,
              // Contraseña por defecto
              password: "12345678",
            };
          })
          .filter((item) => item !== null); // Eliminar filas nulas

        if (processedData.length === 0) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "No se encontraron datos válidos en el archivo",
          });
          return;
        }

        // Limitar advertencias a 10 para no sobrecargar la interfaz
        if (newWarnings.length > 0) {
          setWarnings(newWarnings.slice(0, 10));
          if (newWarnings.length > 10) {
            setWarnings((prev) => [
              ...prev,
              `...y ${newWarnings.length - 10} advertencias más`,
            ]);
          }

          toast({
            variant: "destructive",
            title: "Advertencia",
            description: `Se encontraron ${newWarnings.length} posibles problemas en los datos. Revisa las advertencias debajo.`,
          });
        }

        onFileData(processedData);

        toast({
          title: "Archivo procesado",
          description: `Se encontraron ${processedData.length} registros para importar`,
        });
      } catch (error) {
        console.error("Error al procesar el archivo Excel:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description:
            "No se pudo procesar el archivo. Asegúrate de que sea un archivo Excel válido.",
        });
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        if (
          file.type ===
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
          file.type === "application/vnd.ms-excel"
        ) {
          setFile(file);
          processExcel(file);
        } else {
          toast({
            variant: "destructive",
            title: "Formato no válido",
            description: "Por favor, sube un archivo Excel (.xlsx o .xls)",
          });
        }
      }
    },
    [toast, onFileData]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (
          file.type ===
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
          file.type === "application/vnd.ms-excel"
        ) {
          setFile(file);
          processExcel(file);
        } else {
          toast({
            variant: "destructive",
            title: "Formato no válido",
            description: "Por favor, sube un archivo Excel (.xlsx o .xls)",
          });
        }
      }
    },
    [toast, onFileData]
  );

  const removeFile = useCallback(() => {
    setFile(null);
    setWarnings([]);
  }, []);

  return (
    <div className="space-y-6">
      <div
        className={`border-2 border-dashed rounded-lg p-12 flex flex-col items-center justify-center space-y-4 text-center transition-colors ${
          isDragging
            ? "border-primary bg-primary/10"
            : file
            ? "border-green-500 bg-green-50"
            : "border-gray-300 hover:border-primary"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {!file ? (
          <>
            <UploadCloud className="h-12 w-12 text-gray-400" />
            <div className="space-y-2">
              <h3 className="text-lg font-medium">
                Arrastra y suelta un archivo Excel o
              </h3>
              <p className="text-sm text-gray-500">
                Soporta archivos .xlsx y .xls
              </p>
              <label htmlFor="file-upload" className="cursor-pointer">
                <span className="relative inline-flex h-10 items-center justify-center rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-100">
                  Seleccionar archivo
                </span>
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  accept=".xlsx, .xls"
                  className="sr-only"
                  onChange={handleFileChange}
                />
              </label>
            </div>
          </>
        ) : (
          <div className="flex items-center space-x-4">
            <File className="h-8 w-8 text-green-500" />
            <div className="flex-1">
              <p className="font-medium">{file.name}</p>
              <p className="text-sm text-gray-500">
                {(file.size / 1024).toFixed(2)} KB
              </p>
            </div>
            <button
              type="button"
              onClick={removeFile}
              className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      {warnings.length > 0 && (
        <Alert className="bg-amber-50 border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600 mr-2" />
          <AlertDescription className="text-amber-700">
            <p className="font-medium mb-1">Advertencias:</p>
            <ul className="space-y-1 list-disc pl-5 text-sm">
              {warnings.map((warning, idx) => (
                <li key={idx}>{warning}</li>
              ))}
            </ul>
            <p className="text-xs mt-2">
              Nota: Los usuarios con datos incorrectos serán ignorados durante
              la importación.
            </p>
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <h4 className="font-medium">Formato esperado del archivo:</h4>
        <p className="text-sm text-gray-600">
          El archivo Excel debe contener las siguientes columnas (los nombres
          pueden variar):
        </p>
        <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
          <li>Cédula/ID (obligatorio)</li>
          <li>Nombres (obligatorio)</li>
          <li>Apellidos (obligatorio)</li>
          <li>Teléfono</li>
          <li>Dirección</li>
          <li>Correo electrónico</li>
          <li>Fecha de bautizo</li>
          <li>WhatsApp (si/no)</li>
        </ul>
      </div>
    </div>
  );
};
