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
  Trash2,
} from "lucide-react";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PageContainer } from "@/app/components/ui/page-container";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, AlertCircle } from "lucide-react";

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
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ id: string; nombre: string } | null>(null);

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
    router.push(`/dashboard/usuarios/${user.id}`);
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al eliminar el usuario");
      }
      setIsDeleteDialogOpen(false);
      
      toast({
        title: "Usuario eliminado",
        description: "El usuario ha sido eliminado exitosamente.",
        variant: "default",
        duration: 5000,
        className: "bg-green-50 border-green-200 text-green-800",
      });
      
      fetchUsers();
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      
      toast({
        title: "Error",
        description: (error as Error).message || "Ocurrió un error al eliminar el usuario.",
        variant: "destructive",
        duration: 7000,
      });
    }
  };

  const openDeleteConfirmation = (user: User) => {
    setUserToDelete({
      id: user.id,
      nombre: `${user.nombres} ${user.apellidos}`,
    });
    setIsDeleteDialogOpen(true);
  };

  const handleAddUser = () => {
    router.push("/dashboard/usuarios/new");
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

  const getInitials = (nombres: string, apellidos: string) => {
    return `${nombres?.[0] || ""}${apellidos?.[0] || ""}`.toUpperCase();
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
    <div className="min-h-screen flex flex-col bg-gray-100">
      <PageContainer>
        <div className="flex-grow px-2 sm:px-4 md:px-8 pt-6 pb-4 overflow-auto w-full">
          <div className="mb-2 ml-1">
            <Breadcrumb
              items={[
                { label: "Dashboard", href: "/dashboard" },
                { label: "Usuarios", href: "/dashboard/usuarios" },
              ]}
            />
          </div>
          <Card className="h-full flex flex-col mt-4 shadow-xl border-0">
            <CardHeader className="pb-3 bg-white rounded-t-lg sticky top-0 z-10 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl font-bold text-primary">
                    Gestión de Usuarios
                  </CardTitle>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      type="search"
                      placeholder="Buscar usuarios..."
                      className="pl-8 w-full sm:w-[250px] rounded-lg border-gray-300"
                      value={searchTerm}
                      onChange={handleSearch}
                    />
                  </div>
                  <Button onClick={handleAddUser} className="bg-primary text-white hover:bg-primary/90">
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Usuario
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-grow overflow-hidden pt-2">
              <div className="h-full flex flex-col">
                <div className="flex-grow overflow-auto border rounded-lg bg-white">
                  <Table className="min-w-full">
                    <TableHeader className="sticky top-0 bg-white z-10 shadow-sm">
                      <TableRow>
                        <TableHead className="w-[60px]"> </TableHead>
                        <TableHead className="w-[100px]">Cédula</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Correo</TableHead>
                        <TableHead className="hidden md:table-cell">Teléfono</TableHead>
                        <TableHead className="hidden lg:table-cell">Bautizo</TableHead>
                        <TableHead className="hidden lg:table-cell">WhatsApp</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentUsers.length > 0 ? (
                        currentUsers.map((user) => (
                          <TableRow key={user.id} className="hover:bg-gray-50 transition-colors">
                            <TableCell className="font-medium">
                              <div className="flex items-center justify-center">
                                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                                  {getInitials(user.nombres, user.apellidos)}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{user.cedula}</TableCell>
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
                            <TableCell className="hidden md:table-cell">
                              {user.telefono ? (
                                <span>{user.telefono}</span>
                              ) : (
                                <span className="text-gray-400 text-sm">No disponible</span>
                              )}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              {user.fecha_bautizo ? (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                  {formatDate(user.fecha_bautizo)}
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="bg-gray-100 text-gray-400 border-gray-200">No</Badge>
                              )}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              {user.whatsapp ? (
                                <Badge className="bg-green-100 text-green-700 border-green-200">Sí</Badge>
                              ) : (
                                <Badge variant="secondary" className="bg-gray-100 text-gray-400 border-gray-200">No</Badge>
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
                                  <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                    <UserCog className="mr-2 h-4 w-4" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openDeleteConfirmation(user)} className="text-red-600 hover:text-red-600 hover:bg-red-50">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Eliminar
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={8} className="h-24 text-center text-gray-400">
                            No se encontraron usuarios.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex flex-col md:flex-row items-center justify-between mt-4 gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Mostrar</span>
                    <Select
                      value={itemsPerPage.toString()}
                      onValueChange={(value) => setItemsPerPage(Number(value))}
                    >
                      <SelectTrigger className="w-[80px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-sm text-gray-600">registros</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    <span className="text-sm text-gray-600">
                      Página {currentPage} de {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
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
      </PageContainer>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Confirmar eliminación</DialogTitle>
            <DialogDescription className="text-gray-500 pt-2">
              {userToDelete && (
                <>
                  ¿Estás seguro de que quieres eliminar a <span className="font-semibold">{userToDelete.nombre}</span>?
                  <p className="mt-2">Esta acción no se puede deshacer.</p>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 sm:justify-between gap-2">
            <DialogClose asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                Cancelar
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              className="w-full sm:w-auto"
              onClick={() => userToDelete && handleDeleteUser(userToDelete.id)}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
