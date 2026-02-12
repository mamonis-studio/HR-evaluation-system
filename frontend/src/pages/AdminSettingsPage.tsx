import { useState, useEffect } from 'react';
import { adminApi } from '../api/client';
import type { FiscalYear } from '../types';
import { PageHeader, Card, Alert, Badge } from '../components/ui';

export default function AdminSettingsPage() {
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    adminApi.fiscalYears().then(({ data }) => {
      setFiscalYears(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const togglePeriod = async (fyId: number, field: keyof FiscalYear, currentValue: boolean) => {
    // APIが未実装のためUIだけ反転
    setFiscalYears((prev) =>
      prev.map((fy) =>
        fy.id === fyId ? { ...fy, [field]: !currentValue } : fy
      )
    );
    setMessage(`設定を更新しました（デモモード）`);
  };

  if (loading) return <div className="text-center text-gray-500 py-12">読み込み中...</div>;

  const periods = [
    { key: 'goalSettingOpen' as const, label: '目標設定' },
    { key: 'summerSelfOpen' as const, label: '夏・自己評価' },
    { key: 'summerEvalOpen' as const, label: '夏・評価入力' },
    { key: 'winterSelfOpen' as const, label: '冬・自己評価' },
    { key: 'winterEvalOpen' as const, label: '冬・評価入力' },
  ];

  return (
    <div>
      <PageHeader title="評価期間管理" description="目標設定・自己評価・評価の受付を切り替えます" />

      {message && <Alert variant="success">{message}</Alert>}

      <div className="space-y-6">
        {fiscalYears.map((fy) => (
          <Card key={fy.id} className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-lg font-semibold text-gray-900">{fy.year}年度</h2>
              {fy.isCurrent && <Badge variant="info">現在の年度</Badge>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {periods.map(({ key, label }) => {
                const isOpen = fy[key] as boolean;
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                  >
                    <span className="text-sm text-gray-700">{label}</span>
                    <button
                      onClick={() => togglePeriod(fy.id, key, isOpen)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        isOpen ? 'bg-gray-900' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          isOpen ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
