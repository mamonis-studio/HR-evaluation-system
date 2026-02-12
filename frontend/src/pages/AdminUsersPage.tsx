import { useState, useEffect } from 'react';
import { adminApi } from '../api/client';
import type { User, Department, Position } from '../types';
import { PageHeader, Card, Button, Input, Select, EmptyState, Alert, Badge } from '../components/ui';
import { Plus, X } from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // フォーム
  const [name, setName] = useState('');
  const [nameKana, setNameKana] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [positionId, setPositionId] = useState('');
  const [canEvaluate, setCanEvaluate] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      adminApi.users(),
      adminApi.departments(),
      adminApi.positions(),
    ]).then(([usersRes, deptsRes, posRes]) => {
      setUsers(usersRes.data);
      setDepartments(deptsRes.data);
      setPositions(posRes.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(loadData, []);

  const resetForm = () => {
    setName(''); setNameKana(''); setEmail(''); setPassword('');
    setDepartmentId(''); setPositionId(''); setCanEvaluate(false);
    setEditingId(null); setShowForm(false);
  };

  const openEdit = (user: User) => {
    setEditingId(user.id);
    setName(user.name);
    setNameKana(user.nameKana ?? '');
    setEmail(user.email);
    setPassword('');
    setDepartmentId(user.department?.id?.toString() ?? '');
    setPositionId(user.position?.id?.toString() ?? '');
    setCanEvaluate(user.canEvaluate);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    const data: Record<string, unknown> = {
      name, nameKana, email,
      departmentId: departmentId ? Number(departmentId) : null,
      positionId: positionId ? Number(positionId) : null,
      canEvaluate,
    };
    if (password) data.password = password;

    try {
      if (editingId) {
        await adminApi.updateUser(editingId, data);
        setMessage('ユーザーを更新しました。');
      } else {
        data.password = password || 'changeme123';
        await adminApi.createUser(data);
        setMessage('ユーザーを作成しました。');
      }
      resetForm();
      loadData();
    } catch {
      setMessage('保存に失敗しました。');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center text-gray-500 py-12">読み込み中...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <PageHeader title="ユーザー管理" description="ユーザーの追加・編集を行います" />
        {!showForm && (
          <Button onClick={() => { resetForm(); setShowForm(true); }} size="sm">
            <Plus size={16} className="mr-1" /> 新規追加
          </Button>
        )}
      </div>

      {message && <Alert variant={message.includes('失敗') ? 'error' : 'success'}>{message}</Alert>}

      {/* フォーム */}
      {showForm && (
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">
              {editingId ? 'ユーザー編集' : '新規ユーザー'}
            </h2>
            <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="氏名 *" value={name} onChange={(e) => setName(e.target.value)} required />
              <Input label="フリガナ" value={nameKana} onChange={(e) => setNameKana(e.target.value)} />
              <Input label="メール *" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <Input
                label={editingId ? 'パスワード（変更する場合）' : 'パスワード'}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={editingId ? '変更しない場合は空欄' : '初期パスワード'}
              />
              <Select
                label="部署"
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                options={[
                  { value: '', label: '-- 選択 --' },
                  ...departments.map((d) => ({ value: String(d.id), label: d.name })),
                ]}
              />
              <Select
                label="役職"
                value={positionId}
                onChange={(e) => setPositionId(e.target.value)}
                options={[
                  { value: '', label: '-- 選択 --' },
                  ...positions.map((p) => ({ value: String(p.id), label: p.name })),
                ]}
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={canEvaluate}
                onChange={(e) => setCanEvaluate(e.target.checked)}
                className="rounded border-gray-300"
              />
              評価者権限を付与
            </label>

            <div className="flex gap-3 pt-2">
              <Button variant="secondary" type="button" onClick={resetForm} className="flex-1">キャンセル</Button>
              <Button type="submit" loading={saving} className="flex-1">
                {editingId ? '更新' : '作成'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* ユーザー一覧 */}
      {users.length === 0 ? (
        <EmptyState message="ユーザーが登録されていません" />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">氏名</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">メール</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">部署</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">役職</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">状態</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">{u.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{u.department?.name ?? '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{u.position?.name ?? '-'}</td>
                    <td className="px-4 py-3 text-sm">
                      <Badge variant={u.isActive ? 'success' : 'default'}>
                        {u.isActive ? '有効' : '無効'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(u)}>編集</Button>
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
