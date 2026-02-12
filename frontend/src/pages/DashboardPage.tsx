import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { evaluationApi } from '../api/client';
import type { DashboardCounts } from '../types';
import { Card, PageHeader } from '../components/ui';
import {
  Target,
  ClipboardCheck,
  FileText,
  Bell,
  UserCheck,
  ShieldCheck,
  CheckCircle,
  Users,
  Settings,
} from 'lucide-react';

interface DashCard {
  to: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: number;
  show: boolean;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [counts, setCounts] = useState<DashboardCounts>({
    pendingEvaluations: 0,
    managerPending: 0,
    directorPending: 0,
    finalizePending: 0,
  });

  useEffect(() => {
    evaluationApi.counts().then(({ data }) => setCounts(data)).catch(() => {});
  }, []);

  if (!user) return null;

  const cards: DashCard[] = [
    // 一般職員
    { to: '/goals', icon: <Target size={24} />, title: '目標設定', description: '今年度の目標を設定します', show: true },
    { to: '/self-evaluation', icon: <ClipboardCheck size={24} />, title: '自己評価入力', description: '夏/冬の自己評価を入力します', show: true },
    { to: '/my-evaluations', icon: <FileText size={24} />, title: '評価履歴', description: '過去の評価結果を確認します', show: true },
    { to: '/notifications', icon: <Bell size={24} />, title: '通知', description: 'お知らせを確認します', show: true },

    // 評価者
    { to: '/evaluator', icon: <UserCheck size={24} />, title: '評価入力', description: '依頼された評価を入力します',
      badge: counts.pendingEvaluations, show: user.canEvaluate },

    // 管理者
    { to: '/manager/review', icon: <ShieldCheck size={24} />, title: '評価確認・修正', description: '評価者の評価を確認・修正します',
      badge: counts.managerPending, show: user.canViewAll && !user.canFinalApprove },

    // 役員
    { to: '/director/evaluate', icon: <ShieldCheck size={24} />, title: '役員評価入力', description: '管理者承認済みの評価を入力します',
      badge: counts.directorPending, show: user.canFinalApprove },
    { to: '/director/finalize', icon: <CheckCircle size={24} />, title: '最終確認', description: '役員評価の最終確認・確定',
      badge: counts.finalizePending, show: user.canFinalApprove },

    // 閲覧権限
    { to: '/results', icon: <FileText size={24} />, title: '評価結果一覧', description: '全職員の評価結果を閲覧', show: user.canViewAll },

    // 管理者設定
    { to: '/admin/users', icon: <Users size={24} />, title: 'ユーザー管理', description: 'ユーザーの追加・編集', show: user.canFinalApprove },
    { to: '/admin/settings', icon: <Settings size={24} />, title: '期間管理', description: '評価期間の開閉を管理', show: user.canFinalApprove },
  ];

  const visibleCards = cards.filter((c) => c.show);

  return (
    <div>
      <PageHeader title={`ようこそ、${user.name}さん`} />

      <p className="text-sm text-gray-600 mb-6">
        {user.departmentName} / {user.positionName}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleCards.map((card) => (
          <Link key={card.to} to={card.to}>
            <Card hover className="p-6 h-full">
              <div className="flex items-start justify-between">
                <div className="text-gray-400">{card.icon}</div>
                {card.badge ? (
                  <span className="inline-flex items-center px-2 py-1 bg-gray-900 text-white rounded text-xs font-medium">
                    {card.badge}件待ち
                  </span>
                ) : null}
              </div>
              <h2 className="font-semibold text-gray-900 mt-3">{card.title}</h2>
              <p className="text-sm text-gray-600 mt-1">{card.description}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
