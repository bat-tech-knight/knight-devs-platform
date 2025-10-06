"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { AdminStats } from "./admin-data";

export function useAdminStats(initialStats: AdminStats) {
  const [stats, setStats] = useState<AdminStats>(initialStats);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshStats = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const supabase = createClient();
      
      const [configResult, userResult, activeConfigResult] = await Promise.all([
        supabase
          .from('scraping_config')
          .select('*', { count: 'exact', head: true }),
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true }),
        supabase
          .from('scraping_config')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true)
      ]);

      setStats({
        configCount: configResult.count || 0,
        userCount: userResult.count || 0,
        activeConfigCount: activeConfigResult.count || 0,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh stats');
    } finally {
      setLoading(false);
    }
  };

  return {
    stats,
    loading,
    error,
    refreshStats,
  };
}

export function useAdminAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient();
        
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          setUser(user);
          setIsAuthenticated(true);
          
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
            
          if (profile?.role === 'admin') {
            setIsAdmin(true);
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  return {
    isAuthenticated,
    isAdmin,
    loading,
    user,
  };
}
