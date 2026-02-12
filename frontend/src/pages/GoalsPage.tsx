import { useState, useEffect } from 'react';
import { goalApi, adminApi } from '../api/client';
import type { Goal, FiscalYear } from '../types';
import { PageHeader, Card, Button, Textarea, Select, Alert } from '../components/ui';
import { Plus, Trash2 } from 'lucide-react';

export default function GoalsPage() {
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<FiscalYear | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalTexts, setGoalTexts] = useState<string[]>(['']);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    adminApi.fiscalYears().then(({ data }) => {
      setFiscalYears(data);
      const current = data.find((fy) => fy.isCurrent);
      if (current) {
        setSelectedYearId(current.id);
        setSelectedYear(current);
      }
    });
  }, []);

  useEffect(() => {
    if (!selectedYearId) return;
    const year = fiscalYears.find((fy) => fy.id === selectedYearId);
    setSelectedYear(year ?? null);

    goalApi.list(selectedYearId).then(({ data }) => {
      setGoals(data);
      setGoalTexts(data.length > 0 ? data.map((g) => g.goalText) : ['']);
    });
  }, [selectedYearId, fiscalYears]);

  const addGoal = () => {
    if (goalTexts.length >= 5) return;
    setGoalTexts([...goalTexts, '']);
  };

  const removeGoal = (index: number) => {
    setGoalTexts(goalTexts.filter((_, i) => i !== index));
  };

  const updateGoal = (index: number, text: string) => {
    const updated = [...goalTexts];
    updated[index] = text;
    setGoalTexts(updated);
  };

  const handleSave = async () => {
    if (!selectedYearId) return;
    setSaving(true);
    setMessage('');

    try {
      const filtered = goalTexts.filter((t) => t.trim());
      await goalApi.save({ fiscalYearId: selectedYearId, goals: filtered });
      setMessage('目標を保存しました。');
    } catch {
      setMessage('保存に失敗しました。');
    } finally {
      setSaving(false);
    }
  };

  const isOpen = selectedYear?.goalSettingOpen ?? false;

  return (
    <div>
      <PageHeader title="目標設定" description="年度ごとに目標を設定します（最大5つ）" />

      <div className="mb-6">
        <Select
          options={fiscalYears.map((fy) => ({ value: String(fy.id), label: `${fy.year}年度` }))}
          value={String(selectedYearId ?? '')}
          onChange={(e) => setSelectedYearId(Number(e.target.value))}
        />
      </div>

      {message && <Alert variant="success">{message}</Alert>}

      {selectedYear && !isOpen && (
        <Alert variant="warning">現在、目標設定の受付期間外です。</Alert>
      )}

      {selectedYear && (
        <Card className="p-6">
          <div className="mb-4">
            <p className="text-lg font-semibold text-gray-900">{selectedYear.year}年度の目標</p>
            <p className="text-sm text-gray-500">
              対象期間: {selectedYear.year}年4月〜{selectedYear.year + 1}年3月
            </p>
          </div>

          {isOpen ? (
            <>
              <div className="space-y-4">
                {goalTexts.map((text, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <label className="text-sm font-medium text-gray-700">目標 {index + 1}</label>
                      {index > 0 && (
                        <button onClick={() => removeGoal(index)} className="text-gray-400 hover:text-gray-600">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                    <Textarea
                      rows={3}
                      value={text}
                      onChange={(e) => updateGoal(index, e.target.value)}
                      placeholder="目標を入力してください"
                    />
                  </div>
                ))}
              </div>

              {goalTexts.length < 5 && (
                <div className="mt-4">
                  <Button variant="ghost" size="sm" onClick={addGoal}>
                    <Plus size={16} className="mr-1" /> 目標を追加
                  </Button>
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-gray-200">
                <Button onClick={handleSave} loading={saving} className="w-full">
                  保存する
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              {goals.length === 0 ? (
                <p className="text-gray-500">目標が設定されていません</p>
              ) : (
                goals.map((goal, index) => (
                  <div key={goal.id} className="border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-500 mb-1">目標 {index + 1}</p>
                    <p className="text-gray-900">{goal.goalText}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
