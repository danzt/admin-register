"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Loader2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PageContainer } from "@/app/components/ui/page-container";

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
};

export default function EditUserPage({ params }: { params: { id: string } }) {
  const { user: currentUser, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<User | null>(null);

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push("/auth/login");
    }
  }, [loading, currentUser, router]);

  useEffect(() => {
    if (currentUser) {
      fetchUser();
    }
  }, [currentUser, params.id]);

  const fetchUser = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${params.id}`);
      if (!response.ok) {
        throw new Error("Error al cargar el usuario");
      }
      const data = await response.json();
      const userData = {
        ...data.user,
        fecha_bautizo: data.user.fecha_bautizo ? data.user.fecha_bautizo.split("T")[0] : "",
      };
      setUser(userData);
      setFormData(userData);
    } catch (error) {
      console.error("Error al cargar usuario:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cargar la información del usuario",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/users/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Error al actualizar el usuario");
      }

      toast({
        title: "Éxito",
        description: "Usuario actualizado correctamente",
      });

      router.push("/dashboard/usuarios");
    } catch (error) {
      console.error("Error al actualizar usuario:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el usuario",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => (prev ? { ...prev, [name]: value } : null));
  };

  if (loading || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
        <p className="text-xl">Cargando usuario...</p>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-xl">Usuario no encontrado</p>
      </div>
    );
  }

  return (
    <PageContainer>
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard/usuarios")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Editar Usuario</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="cedula">Cédula</Label>
                <Input
                  id="cedula"
                  name="cedula"
                  value={formData.cedula}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="nombres">Nombres</Label>
                <Input
                  id="nombres"
                  name="nombres"
                  value={formData.nombres}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="apellidos">Apellidos</Label>
                <Input
                  id="apellidos"
                  name="apellidos"
                  value={formData.apellidos}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  name="telefono"
                  value={formData.telefono || ""}
                  onChange={handleChange}
                />
              </div>

              <div>
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  name="direccion"
                  value={formData.direccion || ""}
                  onChange={handleChange}
                />
              </div>

              <div>
                <Label htmlFor="correo">Correo electrónico</Label>
                <Input
                  id="correo"
                  name="correo"
                  type="email"
                  value={formData.correo || ""}
                  onChange={handleChange}
                />
              </div>

              <div>
                <Label htmlFor="fecha_bautizo">Fecha de Bautizo</Label>
                <Input
                  id="fecha_bautizo"
                  name="fecha_bautizo"
                  type="date"
                  value={formData.fecha_bautizo || ""}
                  onChange={handleChange}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="whatsapp"
                  checked={formData.whatsapp}
                  onCheckedChange={(checked) =>
                    setFormData((prev) =>
                      prev ? { ...prev, whatsapp: checked } : null
                    )
                  }
                />
                <Label htmlFor="whatsapp">¿Tiene WhatsApp?</Label>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard/usuarios")}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar Cambios"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </PageContainer>
  );
} 