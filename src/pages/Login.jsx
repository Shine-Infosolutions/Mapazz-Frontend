import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import mapazzLogo from '../assets/Mapazz.png';

const Login = () => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await login(credentials.email, credentials.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const currentDate = new Date();
  const day = currentDate.getDate();
  const month = currentDate.toLocaleDateString('en-US', { month: 'long' });
  const year = currentDate.getFullYear();

  return (
    <div className="min-h-screen flex">
      <div className="flex w-full">
        {/* Left Side - Login Form */}
        <div className="w-1/2 p-12 bg-background min-h-screen flex flex-col justify-center">

            
            <div className="space-y-6">
              <div className="text-center">
                <img src={mapazzLogo} alt="Mapazz" className="h-48 w-auto mx-auto mb-4" />
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Login</h1>
                <p className="text-gray-500 text-sm">Please use your email and password to login</p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                )}
                
                <div className="relative">
                  <input
                    type="email"
                    placeholder="Email"
                    className="w-full px-4 py-3 bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={credentials.email}
                    onChange={(e) => setCredentials({...credentials, email: e.target.value})}
                    required
                  />
                  <div className="absolute right-3 top-3 w-4 h-4 bg-accent rounded-full"></div>
                </div>
                
                <div className="relative">
                  <input
                    type="password"
                    placeholder="Password"
                    className="w-full px-4 py-3 bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={credentials.password}
                    onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                    required
                  />
                  <div className="absolute right-3 top-3 w-4 h-4 text-text">
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="keepLoggedIn"
                    checked={keepLoggedIn}
                    onChange={(e) => setKeepLoggedIn(e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="keepLoggedIn" className="text-sm text-gray-600">Keep me logged in</label>
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-hover text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50"
                >
                  {loading ? 'LOGGING IN...' : 'LOGIN'}
                </button>
              </form>
              
              <div className="text-center">
                <a href="#" className="text-sm text-gray-500 hover:text-gray-700">Trouble Logging in?</a>
              </div>
            </div>
          </div>
          
        {/* Right Side - Calendar Design */}
        <div className="w-1/2 bg-gradient-to-br from-primary via-secondary to-accent relative overflow-hidden min-h-screen">
            {/* Date Display */}
            <div className="absolute top-16 left-16 text-white z-10">
              <div className="text-9xl font-light">{day}th {month},</div>
              <div className="text-9xl font-light">{year}</div>
            </div>
            
            {/* Decorative Elements */}
            <div className="absolute bottom-0 left-0 w-full h-2/3">
              {/* Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-t from-teal-400 to-transparent"></div>
              
              {/* Decorative Circles and Stems */}
              <div className="absolute bottom-16 left-12">
                <div className="w-16 h-16 bg-purple-500 rounded-full opacity-80"></div>
                <div className="w-1 h-20 bg-gray-800 mx-auto"></div>
              </div>
              
              <div className="absolute bottom-24 left-32">
                <div className="w-12 h-12 bg-purple-600 rounded-full opacity-90"></div>
                <div className="w-1 h-16 bg-gray-800 mx-auto"></div>
              </div>
              
              <div className="absolute bottom-8 right-20">
                <div className="w-20 h-20 bg-purple-400 rounded-full opacity-70"></div>
                <div className="w-1 h-24 bg-gray-800 mx-auto"></div>
              </div>
              
              {/* Small dots */}
              <div className="absolute bottom-20 left-24 w-3 h-3 bg-gray-800 rounded-full"></div>
              <div className="absolute bottom-32 left-40 w-2 h-2 bg-gray-800 rounded-full"></div>
              <div className="absolute bottom-16 right-32 w-4 h-4 bg-gray-800 rounded-full"></div>
              <div className="absolute bottom-40 right-16 w-2 h-2 bg-gray-800 rounded-full"></div>
              
              {/* Teal circle in top right */}
              <div className="absolute top-20 right-8 w-12 h-12 border-4 border-teal-300 rounded-full"></div>
            </div>
          </div>
      </div>
    </div>
  );
};

export default Login;