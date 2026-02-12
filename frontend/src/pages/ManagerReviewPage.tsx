import { useState, useEffect } from 'react';
import { evaluationApi } from '../api/client';
import type { Evaluation } from '../types';
import { PERIOD_LABELS } from '../types';
import {
  PageHeader, Card, Button, Textarea, GradeSelector, GradeBadge,
  EmptyState, Alert,
} from '../components/ui';
import { ArrowLeft } from 'lucide-react';

export default function ManagerReviewPage() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [selected, setSelected] = useState<Evaluation | null>(null);
  const [grade, setGrade] = useState('');
  const [comment, setComment] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const loadPending = () => {
    setLoading(true);
    evaluationApi.managerPending().then(({ data }) => {
      setEvaluations(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(loadPending, []);

  const handleApprove = async () => {
    if (!selected || !grade) {
      setMessage('評価ランクを選択してください');
      return;
    }
    setSaving(true);
    try {
      await evaluationApi.approve(selected.id, grade, comment);
      setMessage('評価を承認しました。');
      setSelected(null);
      loadPending();
    } catch {
      setMessage('送信に失敗しました。');
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

  if (loading) {
    return <div className="text-center text-gray-500 py-12">読み込み中...</div>;
  }

  // 個別確認画面
  if (selected) {
    return (
      <div>
        <button
          onClick={() => { setSelected(null); setMessage(''); setShowReject(false); }}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={16} /> 一覧に戻る
        </button>

        <PageHeader title="評価確認・修正" />
        {message && <Alert variant={message.includes('失敗') ? 'error' : 'success'}>{message}</Alert>}

        {/* 対象者情報 */}
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
            <div>
              <p className="text-sm text-gray-500">評価者</p>
              <p className="font-medium">{selected.evaluatorName ?? '-'}</p>
            </div>
          </div>

          {/* 評価者の評価 */}
          <div className="bg-gray-100 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm text-gray-600">評価者の評価:</span>
              <GradeBadge grade={selected.evaluatorGrade} />
            </div>
            {selected.evaluatorComment && (
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{selected.evaluatorComment}</p>
            )}
          </div>
        </Card>

        {/* 確認フォーム */}
        <Card className="p-6">
          <h2 className="font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">管理者確認</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">評価ランク（変更する場合）</label>
            <GradeSelector value={grade} onChange={setGrade} />
          </div>

          <div className="mb-6">
            <Textarea
              label="管理者コメント"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="コメントを追加"
            />
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" disabled>一時保存</Button>
            <Button
              onClick={() => { if (confirm('承認しますか？')) handleApprove(); }}
              loading={saving}
              className="flex-1"
            >
              承認して役員に送る
            </Button>
          </div>

          {/* 差し戻し */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            {!showReject ? (
              <button
                onClick={() => setShowReject(true)}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                評価を差し戻す ▸
              </button>
            ) : (
              <div className="p-3 bg-red-50 rounded-lg">
                <Textarea
                  label="差し戻し理由"
                  rows={2}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="評価者への差し戻し理由を入力"
                />
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => { if (confirm('評価者に差し戻しますか？')) handleReject(); }}
                  loading={saving}
                  className="mt-2 w-full"
                >
                  評価者に差し戻す
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
      <PageHeader title="評価確認・修正" description="評価者の評価を確認・修正します" />

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
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">評価者</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">評価</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {evaluations.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">{e.userName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{e.departmentName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{e.fiscalYear}年度 {PERIOD_LABELS[e.period]}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{e.evaluatorName}</td>
                    <td className="px-4 py-3 text-sm"><GradeBadge grade={e.evaluatorGrade} /></td>
                    <td className="px-4 py-3 text-sm">
                      <Button size="sm" onClick={() => {
                        setSelected(e);
                        setGrade(e.evaluatorGrade ?? '');
                        setComment('');
                        setMessage('');
                      }}>
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
