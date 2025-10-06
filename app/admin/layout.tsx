import { EnvVarWarning } from "@/components/env-var-warning";
import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { AdminLayoutWrapper } from "@/components/admin/admin-layout-wrapper";
import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navigation */}
      <div style={{ 
        background: 'var(--ant-color-bg-container)',
        borderBottom: '1px solid var(--ant-color-border)',
        padding: '0 24px',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link href={"/"} style={{ fontWeight: 'bold', color: 'var(--ant-color-text)' }}>
            Knight Devs Platform
          </Link>
          <Link href={"/admin"} style={{ color: 'var(--ant-color-error)' }}>
            Admin Dashboard
          </Link>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ThemeSwitcher />
          {!hasEnvVars ? <EnvVarWarning /> : <AuthButton />}
        </div>
      </div>

      {/* Main Content with Sidebar - Client Component */}
      <AdminLayoutWrapper>
        {children}
      </AdminLayoutWrapper>
    </div>
  );
}
