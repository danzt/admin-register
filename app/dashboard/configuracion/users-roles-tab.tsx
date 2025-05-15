"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Users,
  Search,
  Save,
  Loader2,
  User,
  Mail,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Role } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface UserWithRole {
  id: string;
  cedula: string;
  nombres: string;
  apellidos: string;
  correo: string;
  role: Role;
}

export function UsersRolesTab() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithRole[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [changedUsers, setChangedUsers] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [paginatedUsers, setPaginatedUsers] = useState<UserWithRole[]>([]);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/admin/users");
        
        if (!response.ok) {
          throw new Error("Error al cargar los usuarios");
        }
        
        const data = await response.json();
        setUsers(data.users);
        setFilteredUsers(data.users);
      } catch (error) {
        console.error("Error cargando usuarios:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar los usuarios",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [toast]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredUsers(users);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredUsers(
        users.filter(
          (user) =>
            user.cedula.toLowerCase().includes(term) ||
            user.nombres.toLowerCase().includes(term) ||
            user.apellidos.toLowerCase().includes(term) ||
            user.correo.toLowerCase().includes(term)
        )
      );
    }
    // Restablecer a la primera página cuando se busca
    setCurrentPage(1);
  }, [searchTerm, users]);
  
  // Efecto para la paginación
  useEffect(() => {
    // Calcular total de páginas
    const totalItems = filteredUsers.length;
    const pages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    setTotalPages(pages);
    
    // Asegurar que currentPage está dentro del rango válido
    const validPage = Math.min(currentPage, pages);
    if (validPage !== currentPage) {
      setCurrentPage(validPage);
    }
    
    // Calcular inicio y fin del slice para esta página
    const startIndex = (validPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    
    // Actualizar usuarios paginados
    setPaginatedUsers(filteredUsers.slice(startIndex, endIndex));
  }, [filteredUsers, currentPage, itemsPerPage]);

  const handleRoleChange = (userId: string, newRole: Role) => {
    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.id === userId ? { ...user, role: newRole } : user
      )
    );
    
    // Marcar este usuario como modificado
    setChangedUsers((prev) => new Set(prev).add(userId));
  };

  const saveUserRoles = async () => {
    if (changedUsers.size === 0) return;
    
    setIsSaving(true);
    try {
      // Obtener solo los usuarios que han cambiado
      const usersToUpdate = users.filter(user => changedUsers.has(user.id))
        .map(user => ({ id: user.id, role: user.role }));
      
      const response = await fetch("/api/admin/users/roles", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ users: usersToUpdate }),
      });

      if (!response.ok) {
        throw new Error("Error al actualizar los roles");
      }

      setChangedUsers(new Set()); // Limpiar los cambios

      toast({
        title: "Roles actualizados",
        description: "Los roles de usuario han sido actualizados exitosamente",
        className: "bg-green-50 border-green-200 text-green-800",
      });
    } catch (error) {
      console.error("Error actualizando roles:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron actualizar los roles de usuario",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleBadgeColor = (role: Role) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 border-red-200";
      case "staff":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "usuario":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };
  
  const renderPagination = () => {
    // No mostrar paginación si hay solo una página
    if (totalPages <= 1) return null;
    
    // Calcular rango de páginas a mostrar (máximo 5)
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    // Ajustar startPage si endPage está en el límite
    if (endPage === totalPages) {
      startPage = Math.max(1, endPage - 4);
    }
    
    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return (
      <Pagination className="mt-4">
        <PaginationContent>
          <PaginationItem>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8"
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Página anterior</span>
            </Button>
          </PaginationItem>
          
          {startPage > 1 && (
            <>
              <PaginationItem>
                <PaginationLink 
                  isActive={currentPage === 1}
                  onClick={() => handlePageChange(1)}
                >
                  1
                </PaginationLink>
              </PaginationItem>
              {startPage > 2 && (
                <PaginationItem>
                  <div className="flex items-center px-2">...</div>
                </PaginationItem>
              )}
            </>
          )}
          
          {pages.map((page) => (
            <PaginationItem key={page}>
              <PaginationLink
                isActive={page === currentPage}
                onClick={() => handlePageChange(page)}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          ))}
          
          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && (
                <PaginationItem>
                  <div className="flex items-center px-2">...</div>
                </PaginationItem>
              )}
              <PaginationItem>
                <PaginationLink 
                  isActive={currentPage === totalPages}
                  onClick={() => handlePageChange(totalPages)}
                >
                  {totalPages}
                </PaginationLink>
              </PaginationItem>
            </>
          )}
          
          <PaginationItem>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8"
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Página siguiente</span>
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2">Cargando usuarios...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle>Usuarios y Roles</CardTitle>
            </div>
            <Button 
              onClick={saveUserRoles} 
              disabled={isSaving || changedUsers.size === 0}
              className="bg-primary hover:bg-primary/90"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar Cambios ({changedUsers.size})
                </>
              )}
            </Button>
          </div>
          <CardDescription>
            Asigna roles a los usuarios para controlar su nivel de acceso
          </CardDescription>
          
          <div className="flex flex-col md:flex-row md:items-center gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Buscar usuarios..."
                className="pl-8 w-full rounded-lg border-gray-300"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center w-full md:w-auto">
              <span className="text-sm text-gray-500 mr-2 whitespace-nowrap">Registros por página:</span>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => {
                  setItemsPerPage(Number(value));
                  setCurrentPage(1);
                }}
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
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Correo</TableHead>
                  <TableHead>Rol Actual</TableHead>
                  <TableHead>Asignar Rol</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.length > 0 ? (
                  paginatedUsers.map((user) => (
                    <TableRow key={user.id} className={changedUsers.has(user.id) ? "bg-yellow-50" : ""}>
                      <TableCell>
                        <div className="flex items-center justify-center">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                            {(user.nombres[0] || "") + (user.apellidos[0] || "")}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium flex items-center">
                        <User className="h-4 w-4 mr-2 text-gray-400" />
                        {user.nombres} {user.apellidos} 
                        <span className="ml-2 text-xs text-gray-500">
                          ({user.cedula})
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Mail className="h-4 w-4 text-gray-500" />
                          <span>{user.correo}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getRoleBadgeColor(user.role)}>
                          {user.role === "admin" ? "Administrador" : 
                           user.role === "staff" ? "Staff" : "Usuario"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={user.role}
                          onValueChange={(value: Role) => handleRoleChange(user.id, value)}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Administrador</SelectItem>
                            <SelectItem value="staff">Staff</SelectItem>
                            <SelectItem value="usuario">Usuario</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-gray-500">
                      No se encontraron usuarios
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Paginación */}
          {renderPagination()}
          
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-500">
              Mostrando {paginatedUsers.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} a {Math.min(currentPage * itemsPerPage, filteredUsers.length)} de {filteredUsers.length} registros
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <p>Los cambios pendientes se resaltan en amarillo. Haz clic en Guardar para confirmar.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 