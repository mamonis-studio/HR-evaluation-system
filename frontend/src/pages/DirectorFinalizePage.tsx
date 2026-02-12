import { useState, useEffect } from 'react';
import { evaluationApi } from '../api/client';
import type { Evaluation } from '../types';
import { PERIOD_LABELS } from '../types';
import {
  PageHeader, Card, Button, Textarea, GradeBadge,
  EmptyState, Alert,
} from '../components/ui';
import { ArrowLeft } from 'lucide-react';

export default function DirectorFinalizePage() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [selected, setSelected] = useState<Evaluation | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const loadPending = () => {
    setLoading(true);
    evaluationApi.finalizePending().then(({ data }) => {
      setEvaluations(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(loadPending, []);

  const handleFinalize = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await evaluationApi.finalize(selected.id);
      setMessage('評価を確定しました。');
      setSelected(null);
      loadPending();
    } catch {
      setMessage('確定に失敗しました。');
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await evaluationApi.reject(selected.id, rejectReason);
      setMessage('評価を差し戻しました。');
      setSelected(null);
      setShowReject(false);
      loadPending();
    } catch {
      setMessage('差し戻しに失敗しました。');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center text-gray-500 py-12">読み込み中...</div>;

  // 個別確認
  if (selected) {
    return (
      <div>
        <button
          onClick={() => { setSelected(null); setMessage(''); setShowReject(false); }}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={16} /> 一覧に戻る
        </button>

        <PageHeader title="最終確認" />
        {message && <Alert variant={message.includes('失敗') ? 'error' : 'success'}>{message}</Alert>}

        <Card className="p-6 mb-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-500">対象者</p>
              <p className="font-medium">{selected.userName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">所属</p>
              <p className="font-medium">{selected.departmentName} / {selected.positionName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">評価期間</p>
              <p className="font-medium">{selected.fiscalYear}年度 {PERIOD_LABELS[selected.period]}</p>
            </div>
          </div>

          {/* 全段階の評価を表示 */}
          <div className="space-y-3">
            <div className="bg-gray-100 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-sm text-gray-600">評価者:</span>
                <GradeBadge grade={selected.evaluatorGrade} />
              </div>
              {selected.evaluatorComment && (
                <p className="text-sm text-gray-700 mt-1">{selected.evaluatorComment}</p>
              )}
            </div>

            {selected.managerGrade && (
              <div className="bg-gray-100 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-sm text-gray-600">管理者:</span>
                  <GradeBadge grade={selected.managerGrade} />
                </div>
                {selected.managerComment && (
                  <p className="text-sm text-gray-700 mt-1">{selected.managerComment}</p>
                )}
              </div>
            )}

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-sm text-gray-600">役員（最終）:</span>
                <span className="inline-flex items-center justify-center px-3 py-1 bg-blue-900 text-white rounded text-sm font-bold min-w-[3rem]">
                  {selected.directorGrade}
                </span>
              </div>
              {selected.directorComment && (
                <p className="text-sm text-gray-700 mt-1">{selected.directorComment}</p>
              )}
            </div>
          </div>
        </Card>

        {/* 確定ボタン */}
        <Card className="p-6">
          <h2 className="font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">最終確認</h2>

          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">確定される評価</p>
            <span className="inline-flex items-center justify-center px-4 py-2 bg-blue-900 text-white rounded text-xl font-bold">
              {selected.directorGrade}
            </span>
          </div>

          <Button
            onClick={() => { if (confirm('評価を確定しますか？本人に通知されます。')) handleFinalize(); }}
            loading={saving}
            className="w-full"
          >
            評価を確定する
          </Button>

          {/* 差し戻し */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            {!showReject ? (
              <button onClick={() => setShowReject(true)} className="text-sm text-gray-600 hover:text-gray-900">
                評価を差し戻す ▸
              </button>
            ) : (
              <div className="p-3 bg-red-50 rounded-lg">
                <Textarea
                  label="差し戻し理由"
                  rows={2}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="差し戻し理由を入力"
                />
                <Button
                  variant="danger" size="sm"
                  onClick={() => { if (confirm('差し戻しますか？')) handleReject(); }}
                  loading={saving}
                  className="mt-2 w-full"
                >
                  差し戻す
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  }

  // 一覧
  return (
    <div>
      <PageHeader title="最終確認" description="役員評価の最終確認・確定を行います" />

      {evaluations.length === 0 ? (
        <EmptyState message="確認待ちの評価はありません" />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">対象者</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">所属</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">年度・期間</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">役員評価</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {evaluations.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">{e.userName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{e.departmentName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{e.fiscalYear}年度 {PERIOD_LABELS[e.period]}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="inline-flex items-center justify-center px-2 py-1 bg-blue-900 text-white rounded text-sm font-bold">
                        {e.directorGrade}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Button size="sm" onClick={() => { setSelected(e); setMessage(''); }}>
                        確認する
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
