"use client";

import { useState, useEffect } from 'react';
import { PageContainer } from "@/app/components/ui/page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { InfoIcon, RefreshCw, Shield } from "lucide-react";

export default function CheckRolePage() {
  const { toast } = useToast();
  const { user, hasRole } = useAuth();
  const [roleInfo, setRoleInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchRoleInfo = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/check-role');
      if (!response.ok) throw new Error('Error fetching role info');
      const data = await response.json();
      setRoleInfo(data);
    } catch (error) {
      console.error('Error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo obtener la información del rol",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoleInfo();
  }, []);

  return (
    <PageContainer>
      <div className="px-4 py-6">
        <Card className="border shadow-lg">
          <CardHeader className="bg-primary/5">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Shield className="h-6 w-6 text-primary" />
              Verificador de Roles
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Información de Roles</h3>
                <Button 
                  onClick={fetchRoleInfo}
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <RefreshCw className="h-4 w-4" />
                  Actualizar
                </Button>
              </div>

              <div className="grid gap-4 border rounded-lg p-4 bg-muted/30">
                <div className="flex items-center gap-2 text-amber-600">
                  <InfoIcon className="h-5 w-5" />
                  <p className="text-sm">
                    Esta página muestra la información actual de tu rol para ayudar a diagnosticar problemas de acceso.
                  </p>
                </div>

                <div className="space-y-3 mt-2">
                  <div className="flex justify-between p-2 bg-background border rounded">
                    <span className="font-medium">Rol desde useAuth:</span>
                    <span>{user?.role || 'No disponible'}</span>
                  </div>
                  
                  <div className="flex justify-between p-2 bg-background border rounded">
                    <span className="font-medium">Admin desde useAuth:</span>
                    <span>{hasRole('admin') ? 'Sí' : 'No'}</span>
                  </div>
                  
                  <div className="flex justify-between p-2 bg-background border rounded">
                    <span className="font-medium">Staff desde useAuth:</span>
                    <span>{hasRole('staff') ? 'Sí' : 'No'}</span>
                  </div>
                  
                  {roleInfo && (
                    <>
                      <div className="flex justify-between p-2 bg-background border rounded">
                        <span className="font-medium">Rol desde Cookie:</span>
                        <span>{roleInfo.roleFromCookie || 'No disponible'}</span>
                      </div>
                      
                      <div className="flex justify-between p-2 bg-background border rounded">
                        <span className="font-medium">Rol desde Base de Datos:</span>
                        <span>{roleInfo.roleFromDb || 'No disponible'}</span>
                      </div>
                      
                      <div className="flex justify-between p-2 bg-background border rounded">
                        <span className="font-medium">Email:</span>
                        <span>{roleInfo.email || 'No disponible'}</span>
                      </div>
                      
                      <div className="flex justify-between p-2 bg-background border rounded">
                        <span className="font-medium">Cookie Auth Presente:</span>
                        <span>{roleInfo.authCookieExists ? 'Sí' : 'No'}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">Soluciones Comunes:</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Asegúrate que tu usuario tenga el rol 'admin' o 'staff' en la base de datos</li>
                  <li>Cierra sesión completamente y vuelve a iniciar sesión</li>
                  <li>Borra las cookies del navegador y vuelve a iniciar sesión</li>
                  <li>Verifica que el middleware esté cargando correctamente el rol desde la cookie</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
} 