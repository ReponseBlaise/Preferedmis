import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login({ email, password });
      toast.success(t('welcome'));
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      console.error('Error response:', error.response);
      const errorMsg = error.response?.data?.error || error.message || 'Login failed. Check console for details.';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 to-primary-800">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-600">Preferred Contractors</h1>
          <p className="text-gray-600 mt-2">Management System</p>
        </div>

        <div className="flex justify-center gap-2 mb-6">
          <button
            onClick={() => i18n.changeLanguage('en')}
            className={`px-4 py-2 rounded ${i18n.language === 'en' ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}
          >
            English
          </button>
          <button
            onClick={() => i18n.changeLanguage('rw')}
            className={`px-4 py-2 rounded ${i18n.language === 'rw' ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}
          >
            Kinyarwanda
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('email')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('password')}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary disabled:opacity-50"
          >
            {loading ? t('loading') : t('login')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
