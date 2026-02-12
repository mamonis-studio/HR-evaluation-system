import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  Target,
  ClipboardCheck,
  FileText,
  Bell,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  show?: boolean;
}

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems: NavItem[] = [
    { to: '/', label: 'ダッシュボード', icon: <LayoutDashboard size={20} /> },
    { to: '/goals', label: '目標設定', icon: <Target size={20} /> },
    { to: '/self-evaluation', label: '自己評価', icon: <ClipboardCheck size={20} /> },
    { to: '/my-evaluations', label: '評価履歴', icon: <FileText size={20} /> },
    { to: '/notifications', label: '通知', icon: <Bell size={20} /> },
    {
      to: '/evaluator',
      label: '評価入力',
      icon: <ClipboardCheck size={20} />,
      show: user?.canEvaluate,
    },
    {
      to: '/manager/review',
      label: '評価確認',
      icon: <FileText size={20} />,
      show: user?.canViewAll,
    },
    {
      to: '/admin/users',
      label: 'ユーザー管理',
      icon: <Users size={20} />,
      show: user?.canFinalApprove,
    },
    {
      to: '/admin/settings',
      label: '設定',
      icon: <Settings size={20} />,
      show: user?.canFinalApprove,
    },
  ];

  const filteredNav = navItems.filter((item) => item.show === undefined || item.show);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* モバイルヘッダー */}
      <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <button onClick={() => setSidebarOpen(true)} className="text-gray-600">
          <Menu size={24} />
        </button>
        <h1 className="font-bold text-gray-900">HR Evaluation</h1>
        <div className="w-6" />
      </header>

      {/* サイドバーオーバーレイ（モバイル） */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* サイドバー */}
      <aside
        className={clsx(
          'fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 transform transition-transform lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
          <h1 className="font-bold text-lg text-gray-900">HR Evaluation</h1>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400">
            <X size={20} />
          </button>
        </div>

        {/* ユーザー情報 */}
        <div className="px-6 py-4 border-b border-gray-100">
          <p className="font-medium text-gray-900 text-sm">{user?.name}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {user?.departmentName} / {user?.positionName}
          </p>
        </div>

        {/* ナビゲーション */}
        <nav className="px-3 py-4 space-y-1 flex-1 overflow-y-auto">
          {filteredNav.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                  isActive
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* ログアウト */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <LogOut size={20} />
            ログアウト
          </button>
        </div>
      </aside>

      {/* メインコンテンツ */}
      <main className="lg:ml-64 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
