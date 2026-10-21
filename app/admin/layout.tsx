import AdminShell from '@/components/admin/AdminShell'

// 모든 관리자 화면 공통 — 관리자 확인 + 왼쪽 메뉴
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>
}
