import { useState, useEffect } from 'react';
import { goalApi, evaluationApi, adminApi } from '../api/client';
import type { Goal, FiscalYear, EvaluationPeriod } from '../types';
import { PERIOD_LABELS } from '../types';
import { PageHeader, Card, Button, Textarea, Select, Alert } from '../components/ui';

export default function SelfEvaluationPage() {
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<FiscalYear | null>(null);
  const [period, setPeriod] = useState<EvaluationPeriod>('SUMMER');
  const [goals, setGoals] = useState<Goal[]>([]);
  const [assessments, setAssessments] = useState<Record<number, string>>({});
  const [evaluationId, setEvaluationId] = useState<number | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    adminApi.fiscalYears().then(({ data }) => {
      setFiscalYears(data);
      const current = data.find((fy) => fy.isCurrent);
      if (current) setSelectedYearId(current.id);
    });
  }, []);

  useEffect(() => {
    if (!selectedYearId) return;
    const year = fiscalYears.find((fy) => fy.id === selectedYearId);
    setSelectedYear(year ?? null);

    // 目標取得（夏評価は前年度の目標）
    const goalYearId = period === 'SUMMER'
      ? fiscalYears.find((fy) => fy.year === (year?.year ?? 0) - 1)?.id ?? selectedYearId
      : selectedYearId;

    goalApi.list(goalYearId).then(({ data }) => {
      setGoals(data);
      const initial: Record<number, string> = {};
      data.forEach((g) => {
        initial[g.id] = (period === 'SUMMER' ? g.summerSelfAssessment : g.winterSelfAssessment) ?? '';
      });
      setAssessments(initial);
    });

    // 評価ステータス確認
    evaluationApi.mine().then(({ data }) => {
      const eval_ = data.find(
        (e) => e.fiscalYearId === selectedYearId && e.period === period
      );
      if (eval_) {
        setEvaluationId(eval_.id);
        setCanEdit(eval_.status === 'NOT_STARTED');
      } else {
        setEvaluationId(null);
        setCanEdit(false);
      }
    });
  }, [selectedYearId, period, fiscalYears]);

  const isOpen = selectedYear
    ? (period === 'SUMMER' ? selectedYear.summerSelfOpen : selectedYear.winterSelfOpen)
    : false;

  const handleSave = async (submit: boolean) => {
    if (!evaluationId) return;
    setSaving(true);
    setMessage('');

    try {
      // TODO: 自己評価テキストをgoalに保存してからsubmit
      if (submit) {
        await evaluationApi.submitSelf(evaluationId);
        setCanEdit(false);
        setMessage('自己評価を提出しました。');
      } else {
        setMessage('一時保存しました。');
      }
    } catch {
      setMessage('保存に失敗しました。');
    } finally {
      setSaving(false);
    }
  };

  const targetPeriod = selectedYear
    ? period === 'SUMMER'
      ? `${selectedYear.year - 1}年10月〜${selectedYear.year}年3月`
      : `${selectedYear.year}年4月〜${selectedYear.year}年9月`
    : '';

  return (
    <div>
      <PageHeader title="自己評価入力" description="各目標に対する自己評価を入力します" />

      <div className="mb-6 flex flex-wrap gap-4">
        <Select
          options={fiscalYears.map((fy) => ({ value: String(fy.id), label: `${fy.year}年度` }))}
          value={String(selectedYearId ?? '')}
          onChange={(e) => setSelectedYearId(Number(e.target.value))}
        />
        <Select
          options={[
            { value: 'SUMMER', label: PERIOD_LABELS.SUMMER },
            { value: 'WINTER', label: PERIOD_LABELS.WINTER },
          ]}
          value={period}
          onChange={(e) => setPeriod(e.target.value as EvaluationPeriod)}
        />
      </div>

      {message && <Alert variant="success">{message}</Alert>}

      {!isOpen && selectedYear && (
        <Alert variant="warning">
          現在、{PERIOD_LABELS[period]}の自己評価受付期間外です。
        </Alert>
      )}

      {!canEdit && isOpen && (
        <Alert variant="info">自己評価は提出済みです。評価完了までお待ちください。</Alert>
      )}

      {selectedYear && goals.length === 0 && (
        <Alert variant="warning">目標が設定されていません。先に目標設定を行ってください。</Alert>
      )}

      {selectedYear && goals.length > 0 && (
        <Card className="p-6">
          <div className="mb-4">
            <p className="text-lg font-semibold text-gray-900">
              {selectedYear.year}年度 {PERIOD_LABELS[period]}
            </p>
            <p className="text-sm text-gray-500">対象期間: {targetPeriod}</p>
          </div>

          <div className="space-y-6">
            {goals.map((goal, index) => (
              <div key={goal.id} className="border border-gray-200 rounded-lg p-4">
                <div className="mb-3">
                  <p className="text-sm text-gray-500">目標 {index + 1}</p>
                  <p className="font-medium text-gray-900">{goal.goalText}</p>
                </div>
                {isOpen && canEdit ? (
                  <Textarea
                    label="自己評価"
                    rows={4}
                    value={assessments[goal.id] ?? ''}
                    onChange={(e) =>
                      setAssessments({ ...assessments, [goal.id]: e.target.value })
                    }
                    placeholder="この目標に対する振り返りを入力してください"
                  />
                ) : (
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm text-gray-500 mb-1">自己評価</p>
                    <p className="text-sm text-gray-700">
                      {assessments[goal.id] || '未入力'}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {isOpen && canEdit && (
            <div className="mt-6 pt-4 border-t border-gray-200 flex gap-3">
              <Button variant="secondary" onClick={() => handleSave(false)} loading={saving} className="flex-1">
                一時保存
              </Button>
              <Button
                onClick={() => {
                  if (confirm('提出後は編集できなくなります。よろしいですか？')) {
                    handleSave(true);
                  }
                }}
                loading={saving}
                className="flex-1"
              >
                提出する
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
