"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type UserProps = {
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

type UserDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  user: UserProps | null;
  onSave: () => void;
};

export function UserDialog({ isOpen, onClose, user, onSave }: UserDialogProps) {
  const isEditing = !!user;
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    cedula: user?.cedula || "",
    nombres: user?.nombres || "",
    apellidos: user?.apellidos || "",
    telefono: user?.telefono || "",
    direccion: user?.direccion || "",
    correo: user?.correo || "",
    fecha_bautizo: user?.fecha_bautizo || null,
    whatsapp: user?.whatsapp || false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, whatsapp: checked }));
  };

  const handleDateChange = (value: string | null) => {
    setFormData((prev) => ({ ...prev, fecha_bautizo: value }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.cedula.trim()) {
      newErrors.cedula = "La cédula es obligatoria";
    } else if (!/^\d+$/.test(formData.cedula)) {
      newErrors.cedula = "La cédula debe contener solo números";
    }

    if (!formData.nombres.trim()) {
      newErrors.nombres = "El nombre es obligatorio";
    }

    if (!formData.apellidos.trim()) {
      newErrors.apellidos = "El apellido es obligatorio";
    }

    if (formData.correo && !/^\S+@\S+\.\S+$/.test(formData.correo)) {
      newErrors.correo = "El correo electrónico no es válido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = isEditing
        ? `/api/admin/users/${user.id}`
        : "/api/admin/users";

      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al guardar el usuario");
      }

      onSave();
    } catch (error) {
      console.error("Error al guardar usuario:", error);
      setErrors((prev) => ({
        ...prev,
        form: "Ocurrió un error al guardar el usuario",
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Usuario" : "Nuevo Usuario"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cedula" className="text-right">
                Cédula*
              </Label>
              <Input
                id="cedula"
                name="cedula"
                value={formData.cedula}
                onChange={handleChange}
                className="col-span-3"
                disabled={isLoading}
              />
              {errors.cedula && (
                <p className="text-red-500 text-sm col-span-3 col-start-2">
                  {errors.cedula}
                </p>
              )}
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nombres" className="text-right">
                Nombres*
              </Label>
              <Input
                id="nombres"
                name="nombres"
                value={formData.nombres}
                onChange={handleChange}
                className="col-span-3"
                disabled={isLoading}
              />
              {errors.nombres && (
                <p className="text-red-500 text-sm col-span-3 col-start-2">
                  {errors.nombres}
                </p>
              )}
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="apellidos" className="text-right">
                Apellidos*
              </Label>
              <Input
                id="apellidos"
                name="apellidos"
                value={formData.apellidos}
                onChange={handleChange}
                className="col-span-3"
                disabled={isLoading}
              />
              {errors.apellidos && (
                <p className="text-red-500 text-sm col-span-3 col-start-2">
                  {errors.apellidos}
                </p>
              )}
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="correo" className="text-right">
                Correo
              </Label>
              <Input
                id="correo"
                name="correo"
                type="email"
                value={formData.correo || ""}
                onChange={handleChange}
                className="col-span-3"
                disabled={isLoading}
              />
              {errors.correo && (
                <p className="text-red-500 text-sm col-span-3 col-start-2">
                  {errors.correo}
                </p>
              )}
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="telefono" className="text-right">
                Teléfono
              </Label>
              <Input
                id="telefono"
                name="telefono"
                value={formData.telefono || ""}
                onChange={handleChange}
                className="col-span-3"
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="direccion" className="text-right">
                Dirección
              </Label>
              <Input
                id="direccion"
                name="direccion"
                value={formData.direccion || ""}
                onChange={handleChange}
                className="col-span-3"
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fecha_bautizo" className="text-right">
                Fecha Bautizo
              </Label>
              <Input
                id="fecha_bautizo"
                name="fecha_bautizo"
                type="date"
                value={
                  formData.fecha_bautizo
                    ? new Date(formData.fecha_bautizo)
                        .toISOString()
                        .split("T")[0]
                    : ""
                }
                onChange={(e) => handleDateChange(e.target.value || null)}
                className="col-span-3"
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="whatsapp" className="text-right">
                WhatsApp
              </Label>
              <div className="flex items-center space-x-2 col-span-3">
                <Checkbox
                  id="whatsapp"
                  checked={formData.whatsapp}
                  onCheckedChange={handleCheckboxChange}
                  disabled={isLoading}
                />
                <Label htmlFor="whatsapp" className="text-sm font-normal">
                  Tiene WhatsApp
                </Label>
              </div>
            </div>

            {errors.form && (
              <p className="text-red-500 text-sm text-center">{errors.form}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
