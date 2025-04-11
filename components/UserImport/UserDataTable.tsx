"use client";

import { useState, useMemo } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Edit,
  Search,
  Trash,
  X,
} from "lucide-react";
import * as XLSX from "xlsx";

export type UserRow = {
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
  temporaryPassword?: string;
};

interface UserDataTableProps {
  data: UserRow[];
  onEdit: (index: number, updatedUser: UserRow) => void;
  onDelete: (index: number) => void;
  onValidityChange: (newData: UserRow[]) => void;
}

export function UserDataTable({
  data,
  onEdit,
  onDelete,
  onValidityChange,
}: UserDataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [editingUser, setEditingUser] = useState<{
    index: number;
    user: UserRow;
  } | null>(null);
  const [rowSelection, setRowSelection] = useState({});

  const columns = useMemo<ColumnDef<UserRow>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => {
              table.toggleAllPageRowsSelected(!!value);
            }}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => {
              row.toggleSelected(!!value);
            }}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        id: "status",
        header: "Estado",
        cell: ({ row }) => {
          const isValid = row.original.valid;
          const error = row.original.error;

          return (
            <div className="flex justify-center">
              {isValid ? (
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-700 border-green-200"
                >
                  Válido
                </Badge>
              ) : (
                <Badge variant="destructive" title={error}>
                  Error
                </Badge>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "cedula",
        header: "Cédula",
      },
      {
        accessorKey: "nombres",
        header: "Nombres",
      },
      {
        accessorKey: "apellidos",
        header: "Apellidos",
      },
      {
        accessorKey: "correo",
        header: "Correo",
      },
      {
        accessorKey: "telefono",
        header: "Teléfono",
      },
      {
        accessorKey: "whatsapp",
        header: "WhatsApp",
        cell: ({ row }) => (
          <div className="text-center">
            {row.original.whatsapp ? "Sí" : "No"}
          </div>
        ),
      },
      {
        accessorKey: "fecha_bautizo",
        header: "Fecha Bautizo",
        cell: ({ row }) => <div>{row.original.fecha_bautizo || "-"}</div>,
      },
      {
        id: "actions",
        header: "Acciones",
        cell: ({ row }) => {
          const index = row.index;

          return (
            <div className="flex items-center justify-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEdit(index)}
                title="Editar"
              >
                <Edit size={16} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(index)}
                title="Eliminar"
              >
                <Trash size={16} />
              </Button>
            </div>
          );
        },
      },
    ],
    [onDelete]
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      rowSelection,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const handleEdit = (index: number) => {
    setEditingUser({
      index,
      user: { ...data[index] }, // Crear una copia para editar
    });
  };

  const handleSaveEdit = () => {
    if (editingUser) {
      // Validar
      const { user } = editingUser;
      const valid = !!(
        user.cedula &&
        user.nombres &&
        user.apellidos &&
        user.telefono &&
        user.direccion &&
        user.correo
      );

      let errorMsg = valid ? undefined : "Faltan campos obligatorios";

      // Validar formato de correo
      if (valid && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.correo)) {
        errorMsg = "Formato de correo inválido";
      }

      const updatedUser = {
        ...user,
        valid: !errorMsg,
        error: errorMsg,
      };

      onEdit(editingUser.index, updatedUser);
      setEditingUser(null);
    }
  };

  const exportToExcel = () => {
    // Seleccionar solo las filas seleccionadas o todas si no hay selección
    const selectedRows =
      Object.keys(rowSelection).length > 0
        ? table.getSelectedRowModel().rows.map((row) => row.original)
        : data;

    // Crear las filas de datos para Excel
    const excelData = [
      // Cabecera
      [
        "CÉDULA",
        "NOMBRES",
        "APELLIDOS",
        "TELÉFONO",
        "DIRECCIÓN",
        "CORREO",
        "FECHA_BAUTIZO",
        "WHATSAPP",
      ],
      // Datos
      ...selectedRows.map((user) => [
        user.cedula,
        user.nombres,
        user.apellidos,
        user.telefono,
        user.direccion,
        user.correo,
        user.fecha_bautizo || "",
        user.whatsapp ? "Sí" : "No",
      ]),
    ];

    // Crear el libro y la hoja
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(excelData);

    // Añadir la hoja al libro
    XLSX.utils.book_append_sheet(workbook, worksheet, "Usuarios");

    // Guardar el archivo
    XLSX.writeFile(workbook, "usuarios_exportados.xlsx");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar en todos los campos..."
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-8 w-full sm:w-[300px]"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportToExcel}
            className="flex items-center gap-1"
            disabled={data.length === 0}
          >
            <Download size={16} />
            Exportar Excel
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={!row.original.valid ? "bg-red-50" : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No hay datos
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <p className="text-sm text-muted-foreground">
            Página {table.getState().pagination.pageIndex + 1} de{" "}
            {table.getPageCount()}
          </p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Dialog para editar usuario */}
      <Dialog
        open={!!editingUser}
        onOpenChange={(open) => !open && setEditingUser(null)}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="cedula">Cédula *</Label>
                  <Input
                    id="cedula"
                    value={editingUser.user.cedula}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        user: { ...editingUser.user, cedula: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="correo">Correo *</Label>
                  <Input
                    id="correo"
                    value={editingUser.user.correo}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        user: { ...editingUser.user, correo: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="nombres">Nombres *</Label>
                  <Input
                    id="nombres"
                    value={editingUser.user.nombres}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        user: { ...editingUser.user, nombres: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="apellidos">Apellidos *</Label>
                  <Input
                    id="apellidos"
                    value={editingUser.user.apellidos}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        user: {
                          ...editingUser.user,
                          apellidos: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="telefono">Teléfono *</Label>
                  <Input
                    id="telefono"
                    value={editingUser.user.telefono}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        user: { ...editingUser.user, telefono: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="fecha_bautizo">Fecha de Bautizo</Label>
                  <Input
                    id="fecha_bautizo"
                    type="date"
                    value={editingUser.user.fecha_bautizo || ""}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        user: {
                          ...editingUser.user,
                          fecha_bautizo: e.target.value || undefined,
                        },
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="direccion">Dirección *</Label>
                  <Input
                    id="direccion"
                    value={editingUser.user.direccion}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        user: {
                          ...editingUser.user,
                          direccion: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="whatsapp"
                  checked={editingUser.user.whatsapp}
                  onCheckedChange={(checked) =>
                    setEditingUser({
                      ...editingUser,
                      user: { ...editingUser.user, whatsapp: !!checked },
                    })
                  }
                />
                <Label htmlFor="whatsapp" className="cursor-pointer">
                  Tiene WhatsApp
                </Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit}>Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
