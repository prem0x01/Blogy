import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import  api  from '../lib/api';

export default function Register() {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await api.register({
        username: formData.username,
        email: formData.email,
        password: formData.password
      });
      
      if (response && response.token) {
        login(response.user, response.token);
        navigate('/');
      } else {
        setError('Registration failed: Invalid server response');
      }
    } catch (err) {
      setError(err.message || 'Server connection failed');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white"/>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ duration: 1 }}
          className="absolute inset-0"
          style={{
            backgroundImage: 
              'linear-gradient(gray 1px, transparent 1px), linear-gradient(90deg, gray 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            opacity: 0.1
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center 
        justify-center px-4 py-12"
      >
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/')}
          className="absolute top-8 left-8 flex items-center gap-2 text-gray-600 
            hover:text-gray-900 transition-colors duration-300"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" 
            viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" 
              d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          <span className="text-sm">Back</span>
        </motion.button>

        {/* Form Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white/50 backdrop-blur-sm rounded-2xl 
            p-8 shadow-xl shadow-gray-100/20"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-light text-gray-900 mb-2">
              Create your account
            </h1>
            <p className="text-gray-600">
              Join our community of writers and readers
            </p>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Input */}
            <div className="space-y-2">
              <label className="block text-sm font-light text-gray-600">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-white/50 border border-gray-100
                  rounded-lg focus:outline-none focus:border-gray-200
                  focus:ring-1 focus:ring-gray-200 transition-all duration-300"
                required
              />
            </div>

            {/* Email Input */}
            <div className="space-y-2">
              <label className="block text-sm font-light text-gray-600">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-white/50 border border-gray-100
                  rounded-lg focus:outline-none focus:border-gray-200
                  focus:ring-1 focus:ring-gray-200 transition-all duration-300"
                required
              />
            </div>

            {/* Password Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-light text-gray-600">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-white/50 border border-gray-100
                    rounded-lg focus:outline-none focus:border-gray-200
                    focus:ring-1 focus:ring-gray-200 transition-all duration-300"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-light text-gray-600">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-white/50 border border-gray-100
                    rounded-lg focus:outline-none focus:border-gray-200
                    focus:ring-1 focus:ring-gray-200 transition-all duration-300"
                  required
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-500 text-sm text-center"
              >
                {error}
              </motion.p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 bg-gradient-to-r from-gray-900 to-gray-800
                text-white rounded-lg transition-all duration-300
                transform hover:scale-[1.02] disabled:opacity-50
                disabled:cursor-not-allowed disabled:transform-none
                ${loading ? 'animate-pulse' : ''}`}
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        </motion.div>
      </div>

      {/* Decorative Elements */}
      <div className="fixed top-0 right-0 w-96 h-96 bg-gradient-to-b 
        from-gray-50 to-transparent opacity-60 transform rotate-45"/>
      <div className="fixed bottom-0 left-0 w-96 h-96 bg-gradient-to-t 
        from-gray-50 to-transparent opacity-60 transform -rotate-45"/>
    </div>
  );
}