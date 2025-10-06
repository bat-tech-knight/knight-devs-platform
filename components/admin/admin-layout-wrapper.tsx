"use client";

import { useState, useEffect } from "react";
import { AdminSidebar } from "./admin-sidebar";
 

interface AdminLayoutWrapperProps {
  children: React.ReactNode;
}

export function AdminLayoutWrapper({ children }: AdminLayoutWrapperProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Load sidebar state from localStorage
    const savedCollapsed = localStorage.getItem('admin-sidebar-collapsed');
    if (savedCollapsed !== null) {
      setCollapsed(JSON.parse(savedCollapsed));
    }

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setCollapsed(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Save sidebar state to localStorage
    localStorage.setItem('admin-sidebar-collapsed', JSON.stringify(collapsed));
  }, [collapsed]);

  

  return (
    <>
      

      {/* Main Content with Sidebar */}
      <div style={{ display: 'flex', flex: 1 }}>
        {!isMobile && <AdminSidebar collapsed={collapsed} />}
        <div style={{ 
          flex: 1,
          background: 'var(--ant-color-bg-container)',
          overflow: 'auto',
          transition: 'margin-left 0.2s ease-in-out'
        }}>
          <div style={{ padding: '24px' }}>
            {children}
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobile && !collapsed && (
        <>
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1000
            }}
            onClick={() => setCollapsed(true)}
          />
          <div style={{
            position: 'fixed',
            top: '64px',
            left: 0,
            bottom: 0,
            zIndex: 1001
          }}>
            <AdminSidebar collapsed={false} />
          </div>
        </>
      )}
    </>
  );
}
