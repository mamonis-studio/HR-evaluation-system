import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationApi } from '../api/client';
import type { Notification } from '../types';
import { PageHeader, Card, EmptyState } from '../components/ui';
import { Bell, Check } from 'lucide-react';
import clsx from 'clsx';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    notificationApi.list().then(({ data }) => {
      setNotifications(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleClick = async (notif: Notification) => {
    if (!notif.isRead) {
      await notificationApi.markRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
      );
    }
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  if (loading) {
    return <div className="text-center text-gray-500 py-12">読み込み中...</div>;
  }

  return (
    <div>
      <PageHeader title="通知" description="お知らせを確認します" />

      {notifications.length === 0 ? (
        <EmptyState message="通知はありません" />
      ) : (
        <Card>
          <div className="divide-y divide-gray-100">
            {notifications.map((notif) => (
              <button
                key={notif.id}
                onClick={() => handleClick(notif)}
                className={clsx(
                  'w-full text-left px-6 py-4 hover:bg-gray-50 transition-colors flex items-start gap-3',
                  !notif.isRead && 'bg-blue-50/50'
                )}
              >
                <div className="mt-0.5">
                  {notif.isRead ? (
                    <Check size={16} className="text-gray-400" />
                  ) : (
                    <Bell size={16} className="text-gray-900" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={clsx('text-sm', notif.isRead ? 'text-gray-600' : 'font-medium text-gray-900')}>
                    {notif.title}
                  </p>
                  {notif.message && (
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{notif.message}</p>
                  )}
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap">{formatDate(notif.createdAt)}</span>
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
