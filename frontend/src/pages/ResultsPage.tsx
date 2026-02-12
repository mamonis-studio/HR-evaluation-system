import { useState, useEffect } from 'react';
import { evaluationApi, adminApi } from '../api/client';
import type { Evaluation, FiscalYear } from '../types';
import { PERIOD_LABELS } from '../types';
import {
  PageHeader, Card, Select, GradeBadge, StatusBadge, EmptyState,
} from '../components/ui';

export default function ResultsPage() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminApi.fiscalYears(),
      // 全評価を取得（仮に mine を使用。本来は別エンドポイント）
      evaluationApi.mine(),
    ]).then(([fyRes, evalRes]) => {
      setFiscalYears(fyRes.data);
      setEvaluations(evalRes.data);
      const current = fyRes.data.find((fy) => fy.isCurrent);
      if (current) setSelectedYearId(String(current.id));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = evaluations.filter((e) => {
    if (selectedYearId && e.fiscalYearId !== Number(selectedYearId)) return false;
    if (selectedPeriod && e.period !== selectedPeriod) return false;
    return true;
  });

  // グレード分布（簡易集計）
  const gradeDistribution: Record<string, number> = {};
  filtered.filter((e) => e.directorGrade).forEach((e) => {
    const g = e.directorGrade!;
    gradeDistribution[g] = (gradeDistribution[g] ?? 0) + 1;
  });

  if (loading) return <div className="text-center text-gray-500 py-12">読み込み中...</div>;

  return (
    <div>
      <PageHeader title="評価結果一覧" description="全職員の評価結果を閲覧します" />

      <div className="flex flex-wrap gap-4 mb-6">
        <Select
          options={[
            { value: '', label: '全年度' },
            ...fiscalYears.map((fy) => ({ value: String(fy.id), label: `${fy.year}年度` })),
          ]}
          value={selectedYearId}
          onChange={(e) => setSelectedYearId(e.target.value)}
        />
        <Select
          options={[
            { value: '', label: '全期間' },
            { value: 'SUMMER', label: '夏評価' },
            { value: 'WINTER', label: '冬評価' },
          ]}
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
        />
      </div>

      {/* グレード分布 */}
      {Object.keys(gradeDistribution).length > 0 && (
        <Card className="p-6 mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">評価グレード分布</h3>
          <div className="flex flex-wrap gap-4">
            {Object.entries(gradeDistribution)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([grade, count]) => (
                <div key={grade} className="text-center">
                  <GradeBadge grade={grade} />
                  <p className="text-xs text-gray-500 mt-1">{count}人</p>
                </div>
              ))}
          </div>
        </Card>
      )}

      {/* 一覧 */}
      {filtered.length === 0 ? (
        <EmptyState message="該当する評価結果はありません" />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">氏名</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">部署</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">期間</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">ステータス</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">評価者</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">管理者</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">最終</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">{e.userName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{e.departmentName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {e.fiscalYear}年度 {PERIOD_LABELS[e.period]}
                    </td>
                    <td className="px-4 py-3 text-sm"><StatusBadge status={e.status} /></td>
                    <td className="px-4 py-3 text-sm"><GradeBadge grade={e.evaluatorGrade} /></td>
                    <td className="px-4 py-3 text-sm"><GradeBadge grade={e.managerGrade} /></td>
                    <td className="px-4 py-3 text-sm"><GradeBadge grade={e.directorGrade} /></td>
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
