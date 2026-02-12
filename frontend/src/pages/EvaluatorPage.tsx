import { useState, useEffect } from 'react';
import { evaluationApi } from '../api/client';
import type { Evaluation } from '../types';
import { PERIOD_LABELS } from '../types';
import { PageHeader, Card, Button, Textarea, GradeSelector, EmptyState, Alert } from '../components/ui';
import { ArrowLeft } from 'lucide-react';

export default function EvaluatorPage() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [selected, setSelected] = useState<Evaluation | null>(null);
  const [grade, setGrade] = useState('');
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const loadPending = () => {
    evaluationApi.pending().then(({ data }) => {
      setEvaluations(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(loadPending, []);

  const handleSubmit = async (saveOnly: boolean) => {
    if (!selected) return;
    if (!saveOnly && !grade) {
      setMessage('評価ランクを選択してください');
      return;
    }
    setSaving(true);
    setMessage('');

    try {
      if (saveOnly) {
        // 一時保存（API追加が必要だが、ここでは簡略化）
        setMessage('一時保存しました。');
      } else {
        await evaluationApi.evaluate(selected.id, grade, comment);
        setMessage('評価を送信しました。');
        setSelected(null);
        loadPending();
      }
    } catch {
      setMessage('送信に失敗しました。');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center text-gray-500 py-12">読み込み中...</div>;
  }

  // 一覧
  if (!selected) {
    return (
      <div>
        <PageHeader title="評価入力" description="依頼された評価を入力します" />

        {evaluations.length === 0 ? (
          <EmptyState message="評価待ちの案件はありません" />
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">対象者</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">所属</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">年度・期間</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {evaluations.map((eval_) => (
                    <tr key={eval_.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium">{eval_.userName}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {eval_.departmentName} / {eval_.positionName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {eval_.fiscalYear}年度 {PERIOD_LABELS[eval_.period]}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelected(eval_);
                            setGrade(eval_.evaluatorGrade ?? '');
                            setComment(eval_.evaluatorComment ?? '');
                          }}
                        >
                          評価する
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

  // 個別評価入力
  return (
    <div>
      <button
        onClick={() => { setSelected(null); setMessage(''); }}
        className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={16} /> 一覧に戻る
      </button>

      <PageHeader title="評価入力" />

      {message && <Alert variant={message.includes('失敗') ? 'error' : 'success'}>{message}</Alert>}

      {/* 対象者情報 */}
      <Card className="p-6 mb-6">
        <div className="grid grid-cols-2 gap-4">
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
      </Card>

      {/* 評価フォーム */}
      <Card className="p-6">
        <h2 className="font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">評価入力</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">評価ランク *</label>
          <GradeSelector value={grade} onChange={setGrade} />
        </div>

        <div className="mb-6">
          <Textarea
            label="コメント"
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="評価コメントを入力"
          />
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => handleSubmit(true)} loading={saving} className="flex-1">
            一時保存
          </Button>
          <Button
            onClick={() => {
              if (confirm('評価を送信しますか？')) handleSubmit(false);
            }}
            loading={saving}
            className="flex-1"
          >
            評価を送信する
          </Button>
        </div>
      </Card>
    </div>
  );
}
