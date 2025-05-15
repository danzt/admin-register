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
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Shield, Info, Save, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Role } from "@/hooks/use-auth";

type Permission = {
  id: string;
  name: string;
  description: string;
};

type RolePermission = {
  role: Role;
  permissions: string[];
};

export function RolesTab() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Cargar permisos
        const permsResponse = await fetch("/api/admin/permissions");
        const rolePermsResponse = await fetch("/api/admin/roles/permissions");

        if (!permsResponse.ok || !rolePermsResponse.ok) {
          throw new Error("Error al cargar los datos de permisos");
        }

        const { permissions } = await permsResponse.json();
        const { rolePermissions } = await rolePermsResponse.json();

        setPermissions(permissions);
        setRolePermissions(rolePermissions);
      } catch (error) {
        console.error("Error cargando permisos:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar los permisos",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const handlePermissionChange = (role: Role, permissionId: string, checked: boolean) => {
    setRolePermissions((prev) =>
      prev.map((rp) => {
        if (rp.role === role) {
          return {
            ...rp,
            permissions: checked
              ? [...rp.permissions, permissionId]
              : rp.permissions.filter((p) => p !== permissionId),
          };
        }
        return rp;
      })
    );
  };

  const saveRolePermissions = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/roles/permissions", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rolePermissions }),
      });

      if (!response.ok) {
        throw new Error("Error al guardar los permisos");
      }

      toast({
        title: "Permisos guardados",
        description: "Los permisos han sido actualizados exitosamente",
        className: "bg-green-50 border-green-200 text-green-800",
      });
    } catch (error) {
      console.error("Error guardando permisos:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron guardar los permisos",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2">Cargando permisos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle>Gestión de Roles y Permisos</CardTitle>
            </div>
            <Button 
              onClick={saveRolePermissions} 
              disabled={isSaving}
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
                  Guardar Cambios
                </>
              )}
            </Button>
          </div>
          <CardDescription>
            Configura los permisos para cada rol en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Permiso</TableHead>
                  <TableHead className="w-[350px]">Descripción</TableHead>
                  <TableHead className="text-center">Administrador</TableHead>
                  <TableHead className="text-center">Staff</TableHead>
                  <TableHead className="text-center">Usuario</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissions.map((permission) => (
                  <TableRow key={permission.id}>
                    <TableCell className="font-medium">{permission.name}</TableCell>
                    <TableCell>{permission.description}</TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={
                          rolePermissions
                            .find((rp) => rp.role === "admin")
                            ?.permissions.includes(permission.id) ?? false
                        }
                        disabled={true} // Administrador siempre tiene todos los permisos
                        onCheckedChange={(checked) =>
                          handlePermissionChange("admin", permission.id, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={
                          rolePermissions
                            .find((rp) => rp.role === "staff")
                            ?.permissions.includes(permission.id) ?? false
                        }
                        onCheckedChange={(checked) =>
                          handlePermissionChange("staff", permission.id, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={
                          rolePermissions
                            .find((rp) => rp.role === "usuario")
                            ?.permissions.includes(permission.id) ?? false
                        }
                        onCheckedChange={(checked) =>
                          handlePermissionChange("usuario", permission.id, checked as boolean)
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <div className="flex items-center space-x-2 mt-4 text-sm text-gray-500">
            <Info className="h-4 w-4" />
            <p>El rol de Administrador tiene acceso a todas las funcionalidades del sistema.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 