"use client";

import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { AppRole } from '@/constants/roles';
import { ShieldAlert } from 'lucide-react';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
  permission?: string;
  fallback?: React.ReactNode;
}

/**
 * Composant de protection de contenu basé sur les rôles et permissions.
 */
export default function RoleGuard({ 
  children, 
  allowedRoles, 
  permission, 
  fallback 
}: RoleGuardProps) {
  const { user, can, isAuthenticated } = useAuth();

  // 1. Si pas connecté, on ne montre rien (ou le fallback)
  if (!isAuthenticated || !user) {
    return <>{fallback || null}</>;
  }

  // 2. Vérification par Rôle
  const hasRequiredRole = allowedRoles 
    ? allowedRoles.includes(user.role as AppRole) 
    : true;

  // 3. Vérification par Permission spécifique (ex: 'apply_discount')
  const hasRequiredPermission = permission 
    ? can(permission) 
    : true;

  // 4. Si l'une des conditions échoue
  if (!hasRequiredRole || !hasRequiredPermission) {
    // Fallback par défaut si aucun n'est fourni
    const defaultFallback = (
      <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl opacity-50">
        <ShieldAlert className="h-10 w-10 mb-2" />
        <p className="text-xs font-bold uppercase tracking-widest">Accès Restreint</p>
      </div>
    );

    return <>{fallback || defaultFallback}</>;
  }

  // 5. Tout est OK, on affiche le contenu protégé
  return <>{children}</>;
}