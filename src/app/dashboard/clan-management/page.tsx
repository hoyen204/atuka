"use client";

import ClanManagementDashboard from '@/components/clan/ClanManagementDashboard';
import { useAuth } from '@/hooks/useAuth';

export default function ClanManagementPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading || !isAuthenticated) return <div>Loading...</div>;
  return <ClanManagementDashboard />;
} 