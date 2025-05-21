"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Loader2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { PageContainer } from "@/app/components/ui/page-container";

type UserFormData = {
  cedula: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  direccion: string;
  correo: string;
  fecha_bautizo: string;
  whatsapp: boolean;
  bautizado: boolean;
  password: string;
};

export default function NewUserPage() {
  const { user: currentUser, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<UserFormData | null>({
    cedula: "",
    nombres: "",
    apellidos: "",
    telefono: "",
    direccion: "",
    correo: "",
    fecha_bautizo: "",
    whatsapp: false,
    bautizado: false,
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => (prev ? { ...prev, [name]: value } : null));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (!formData) return;
      const dataToSend = {
        ...formData,
        fecha_bautizo: formData.bautizado ? formData.fecha_bautizo : "",
      };
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        throw new Error("Error al crear el usuario");
      }

      toast({
        title: "Éxito",
        description: "Usuario creado correctamente",
      });

      router.push("/dashboard/usuarios");
    } catch (error) {
      console.error("Error al crear usuario:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo crear el usuario",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
        <p className="text-xl">Cargando...</p>
      </div>
    );
  }

  return (
    <PageContainer>
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Usuarios", href: "/dashboard/usuarios" },
          { label: "Nuevo Usuario", href: "/dashboard/usuarios/new" },
        ]}
      />
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
          <CardTitle>Nuevo Usuario</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="cedula">Cédula</Label>
                <Input
                  id="cedula"
                  name="cedula"
                  value={formData?.cedula || ""}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="nombres">Nombres</Label>
                <Input
                  id="nombres"
                  name="nombres"
                  value={formData?.nombres || ""}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="apellidos">Apellidos</Label>
                <Input
                  id="apellidos"
                  name="apellidos"
                  value={formData?.apellidos || ""}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  name="telefono"
                  value={formData?.telefono || ""}
                  onChange={handleChange}
                />
              </div>

              <div>
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  name="direccion"
                  value={formData?.direccion || ""}
                  onChange={handleChange}
                />
              </div>

              <div>
                <Label htmlFor="correo">Correo electrónico</Label>
                <Input
                  id="correo"
                  name="correo"
                  type="email"
                  value={formData?.correo || ""}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData?.password || ""}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="bautizado"
                  checked={formData?.bautizado || false}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => (prev ? { ...prev, bautizado: checked, fecha_bautizo: checked ? prev.fecha_bautizo : "" } : null))
                  }
                />
                <Label htmlFor="bautizado">¿Bautizado?</Label>
              </div>

              {formData?.bautizado && (
                <div>
                  <Label htmlFor="fecha_bautizo">Fecha de Bautizo</Label>
                  <Input
                    id="fecha_bautizo"
                    name="fecha_bautizo"
                    type="date"
                    value={formData?.fecha_bautizo || ""}
                    onChange={handleChange}
                  />
                </div>
              )}

              

              <div className="flex items-center space-x-2">
                <Switch
                  id="whatsapp"
                  checked={formData?.whatsapp || false}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => (prev ? { ...prev, whatsapp: checked } : null))
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
                  "Crear Usuario"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </PageContainer>
  );
} 