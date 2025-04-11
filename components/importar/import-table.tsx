"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  Mail,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

type ImportTableProps = {
  data: any[];
};

export const ImportTable = ({ data }: ImportTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const totalPages = Math.ceil(data.length / itemsPerPage);

  if (!data || data.length === 0) return null;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = data.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const goToFirstPage = () => goToPage(1);
  const goToLastPage = () => goToPage(totalPages);
  const goToPreviousPage = () => goToPage(currentPage - 1);
  const goToNextPage = () => goToPage(currentPage + 1);

  return (
    <div className="border rounded-md flex flex-col h-full">
      <div className="overflow-x-auto flex-grow">
        <Table className="w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Cédula</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Correo</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead className="hidden md:table-cell">Bautizo</TableHead>
              <TableHead className="hidden md:table-cell">WhatsApp</TableHead>
              <TableHead className="w-12 text-right">Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.map((user, index) => (
              <TableRow key={startIndex + index}>
                <TableCell className="font-medium">{user.cedula}</TableCell>
                <TableCell>{`${user.nombres} ${user.apellidos}`}</TableCell>
                <TableCell>
                  {user.correo ? (
                    <div className="flex items-center space-x-1">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="truncate max-w-[150px]">
                        {user.correo}
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">No disponible</span>
                  )}
                </TableCell>
                <TableCell>
                  {user.telefono || (
                    <span className="text-gray-400 text-sm">No disponible</span>
                  )}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {user.fechaBautizo ? (
                    <Badge variant="outline" className="bg-blue-50">
                      {new Date(user.fechaBautizo).toLocaleDateString()}
                    </Badge>
                  ) : (
                    <span className="text-gray-400 text-sm">No</span>
                  )}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {user.whatsapp ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-gray-300" />
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menú</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="text-xs">
                        Ver detalles
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-xs">
                        Editar antes de importar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      <div className="px-4 py-3 border-t flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Mostrando <span className="font-medium">{startIndex + 1}</span> a{" "}
          <span className="font-medium">{Math.min(endIndex, data.length)}</span>{" "}
          de <span className="font-medium">{data.length}</span> registros
        </div>
        <div className="flex space-x-1">
          <Button
            variant="outline"
            size="sm"
            onClick={goToFirstPage}
            disabled={currentPage === 1}
            className="hidden sm:flex"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Números de página */}
          <div className="flex space-x-1 sm:hidden">
            <span className="text-sm flex items-center px-2">
              {currentPage} / {totalPages}
            </span>
          </div>

          <div className="hidden sm:flex space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              let pageNumber;

              // Calcular los números de página que se mostrarán
              if (totalPages <= 5) {
                pageNumber = i + 1;
              } else if (currentPage <= 3) {
                pageNumber = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNumber = totalPages - 4 + i;
              } else {
                pageNumber = currentPage - 2 + i;
              }

              return (
                <Button
                  key={pageNumber}
                  variant={currentPage === pageNumber ? "default" : "outline"}
                  size="sm"
                  onClick={() => goToPage(pageNumber)}
                  className="w-9"
                >
                  {pageNumber}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={goToLastPage}
            disabled={currentPage === totalPages}
            className="hidden sm:flex"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
