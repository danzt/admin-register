import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { Role } from "@/hooks/use-auth";

export async function GET() {
  try {
    // Obtener todos los permisos por rol
    const { data, error } = await supabase
      .from("role_permissions")
      .select("role, permission_id, permissions(id, name)");

    if (error) {
      console.error("Error al obtener permisos de roles:", error);
      return NextResponse.json(
        { error: "Error al cargar los permisos de roles" },
        { status: 500 }
      );
    }

    // Organizar los datos por rol
    const roles: Role[] = ["admin", "staff", "usuario"];
    const rolePermissions = roles.map(role => {
      // Filtrar los permisos para este rol
      const permissions = data
        .filter(item => item.role === role)
        .map(item => item.permission_id);
      
      return {
        role,
        permissions
      };
    });

    return NextResponse.json({ rolePermissions });
  } catch (error: any) {
    console.error("Error en API de permisos de roles:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// Actualizar permisos de roles
export async function PUT(req: NextRequest) {
  try {
    const { rolePermissions } = await req.json();

    // Verificar datos
    if (!rolePermissions || !Array.isArray(rolePermissions)) {
      return NextResponse.json(
        { error: "Formato de datos inválido" },
        { status: 400 }
      );
    }

    // Para cada rol, actualizar sus permisos
    const updatedRoles = [];

    for (const roleData of rolePermissions) {
      const { role, permissions } = roleData;
      
      if (!role || !permissions || !Array.isArray(permissions)) {
        continue;
      }

      // 1. Eliminar todos los permisos actuales del rol
      const { error: deleteError } = await supabase
        .from("role_permissions")
        .delete()
        .eq("role", role);

      if (deleteError) {
        console.error(`Error al eliminar permisos para ${role}:`, deleteError);
        continue;
      }

      // 2. Insertar los nuevos permisos
      if (permissions.length > 0) {
        const permissionRecords = permissions.map(permissionId => ({
          role,
          permission_id: permissionId
        }));

        const { error: insertError } = await supabase
          .from("role_permissions")
          .insert(permissionRecords);

        if (insertError) {
          console.error(`Error al insertar permisos para ${role}:`, insertError);
          continue;
        }
      }

      updatedRoles.push(role);
    }

    return NextResponse.json({ 
      success: true, 
      message: `Roles actualizados: ${updatedRoles.join(", ")}` 
    });

  } catch (error: any) {
    console.error("Error al actualizar permisos de roles:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
} 