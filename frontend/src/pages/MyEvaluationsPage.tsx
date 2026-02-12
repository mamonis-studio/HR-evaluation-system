import { useState, useEffect } from 'react';
import { evaluationApi } from '../api/client';
import type { Evaluation } from '../types';
import { PERIOD_LABELS } from '../types';
import { PageHeader, Card, StatusBadge, GradeBadge, EmptyState } from '../components/ui';

export default function MyEvaluationsPage() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    evaluationApi.mine().then(({ data }) => {
      setEvaluations(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center text-gray-500 py-12">読み込み中...</div>;
  }

  return (
    <div>
      <PageHeader title="評価履歴" description="過去の評価結果を確認します" />

      {evaluations.length === 0 ? (
        <EmptyState message="評価履歴はありません" />
      ) : (
        <div className="space-y-4">
          {evaluations.map((eval_) => (
            <Card key={eval_.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-semibold text-gray-900">
                    {eval_.fiscalYear}年度 {PERIOD_LABELS[eval_.period]}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {eval_.departmentName} / {eval_.positionName}
                  </p>
                </div>
                <StatusBadge status={eval_.status} />
              </div>

              {eval_.status !== 'NOT_STARTED' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                  {/* 評価者 */}
                  <div>
                    <p className="text-xs text-gray-500 mb-1">評価者</p>
                    <div className="flex items-center gap-2">
                      <GradeBadge grade={eval_.evaluatorGrade} />
                      <span className="text-sm text-gray-600">{eval_.evaluatorName ?? '-'}</span>
                    </div>
                    {eval_.evaluatorComment && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{eval_.evaluatorComment}</p>
                    )}
                  </div>

                  {/* 管理者 */}
                  <div>
                    <p className="text-xs text-gray-500 mb-1">管理者</p>
                    <div className="flex items-center gap-2">
                      <GradeBadge grade={eval_.managerGrade} />
                      <span className="text-sm text-gray-600">{eval_.managerName ?? '-'}</span>
                    </div>
                    {eval_.managerComment && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{eval_.managerComment}</p>
                    )}
                  </div>

                  {/* 役員 */}
                  <div>
                    <p className="text-xs text-gray-500 mb-1">役員（最終）</p>
                    <GradeBadge grade={eval_.directorGrade} />
                    {eval_.directorComment && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{eval_.directorComment}</p>
                    )}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
