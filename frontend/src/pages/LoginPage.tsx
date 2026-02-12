import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button, Input } from '../components/ui';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch {
      setError('メールアドレスまたはパスワードが正しくありません');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">HR Evaluation</h1>
            <p className="text-sm text-gray-500 mt-2">人事評価システム</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                {error}
              </div>
            )}

            <Input
              label="メールアドレス"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              required
            />

            <Input
              label="パスワード"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="パスワード"
              required
            />

            <Button type="submit" loading={loading} className="w-full">
              ログイン
            </Button>
          </form>
        </div>

        {/* デモアカウント */}
        <div className="mt-6 bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 font-medium mb-2">デモアカウント</p>
          <div className="space-y-1 text-xs text-gray-600">
            {[
              { role: '管理者', email: 'admin@demo.example.com' },
              { role: '部門長', email: 'manager@demo.example.com' },
              { role: '評価者', email: 'evaluator@demo.example.com' },
              { role: '一般職員', email: 'staff@demo.example.com' },
            ].map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => { setEmail(account.email); setPassword('demo1234'); }}
                className="block w-full text-left px-2 py-1 rounded hover:bg-gray-50"
              >
                <span className="font-medium">{account.role}</span>: {account.email}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
