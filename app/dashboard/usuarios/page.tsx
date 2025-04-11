"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserDialog } from "@/components/usuarios/user-dialog";
import {
  Loader2,
  Search,
  MoreHorizontal,
  Plus,
  UserCog,
  Mail,
  CheckCircle2,
  XCircle,
} from "lucide-react";

type User = {
  id: string;
  cedula: string;
  nombres: string;
  apellidos: string;
  telefono: string | null;
  direccion: string | null;
  correo: string | null;
  fecha_bautizo: string | null;
  whatsapp: boolean;
  created_at: string;
};

export default function UsuariosPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (user) {
      fetchUsers();
    }
  }, [user]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredUsers(users);
    } else {
      const lowercaseSearch = searchTerm.toLowerCase();
      setFilteredUsers(
        users.filter(
          (user) =>
            user.cedula.toLowerCase().includes(lowercaseSearch) ||
            user.nombres.toLowerCase().includes(lowercaseSearch) ||
            user.apellidos.toLowerCase().includes(lowercaseSearch) ||
            (user.correo && user.correo.toLowerCase().includes(lowercaseSearch))
        )
      );
    }
    setCurrentPage(1);
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/users");
      if (!response.ok) {
        throw new Error("Error al cargar los usuarios");
      }
      const data = await response.json();
      setUsers(data.users);
      setFilteredUsers(data.users);
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsDialogOpen(true);
  };

  const handleAddUser = () => {
    setSelectedUser(null);
    setIsDialogOpen(true);
  };

  const handleUserSaved = () => {
    setIsDialogOpen(false);
    fetchUsers();
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredUsers.length);
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No especificada";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (loading || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
        <p className="text-xl">Cargando usuarios...</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <div className="flex-grow p-4 overflow-auto">
        <Card className="h-full flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-2xl font-bold">
                  Gestión de Usuarios
                </CardTitle>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="search"
                    placeholder="Buscar usuarios..."
                    className="pl-8 w-full sm:w-[250px]"
                    value={searchTerm}
                    onChange={handleSearch}
                  />
                </div>
                <Button onClick={handleAddUser}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Usuario
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-grow overflow-hidden pt-2">
            <div className="h-full flex flex-col">
              <div className="flex-grow overflow-auto border rounded-md">
                <Table>
                  <TableHeader className="sticky top-0 bg-white">
                    <TableRow>
                      <TableHead className="w-[100px]">Cédula</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Correo</TableHead>
                      <TableHead className="hidden md:table-cell">
                        Teléfono
                      </TableHead>
                      <TableHead className="hidden lg:table-cell">
                        Bautizo
                      </TableHead>
                      <TableHead className="hidden lg:table-cell">
                        WhatsApp
                      </TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentUsers.length > 0 ? (
                      currentUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            {user.cedula}
                          </TableCell>
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
                              <span className="text-gray-400 text-sm">
                                No disponible
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {user.telefono || (
                              <span className="text-gray-400 text-sm">
                                No disponible
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {formatDate(user.fecha_bautizo)}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {user.whatsapp ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            ) : (
                              <XCircle className="h-5 w-5 text-gray-300" />
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                >
                                  <span className="sr-only">Abrir menú</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleEditUser(user)}
                                >
                                  <UserCog className="mr-2 h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          No se encontraron usuarios.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {filteredUsers.length > 0 && (
                <div className="py-4 flex items-center justify-between border-t mt-2">
                  <div className="text-sm text-gray-600">
                    Mostrando {startIndex + 1} a {endIndex} de{" "}
                    {filteredUsers.length} usuarios
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage(Math.max(1, currentPage - 1))
                      }
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage(Math.min(totalPages, currentPage + 1))
                      }
                      disabled={currentPage === totalPages}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <UserDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        user={selectedUser}
        onSave={handleUserSaved}
      />
    </div>
  );
}
