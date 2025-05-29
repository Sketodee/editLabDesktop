import axiosInstance from '@/utils/api'; // Adjust the import path as necessary
import { UserType } from '@renderer/types/appScopeTypes';
import axios from 'axios';
import { useState } from 'react';
import { FaApple } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import { useNavigate } from 'react-router-dom';
import LoginSidebar from './LoginSidebar';

const SignIn = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  // const [password, setPassword] = useState('')
  // const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = 'Email is required.';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid.';
    }

    // if (!password) {
    //   newErrors.password = 'Password is required.';
    // } else if (password.length < 6) {
    //   newErrors.password = 'Password must be at least 6 characters.';
    // }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const login = async (email, otp) => {
    try {
      const response = await axios.post(
        'http://localhost:8080/api/auth/login',
        { email, otp },
        { withCredentials: true } // enable sending cookie for refresh token
      );
      console.log('Login response', response.data.data.accessToken);

      localStorage.setItem('token', response.data.data.accessToken);
      // refresh token should already be in cookie (set by server)

      return response.data;
    } catch (error) {
      console.error('Login error', error);
      throw error;
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validate()) {

      const dataToSend = {
        email, userType: UserType.USER
      }

      try {
        const res = await axiosInstance.post('/user/create', dataToSend);
        console.log('Response:', res.status);
        // Optional: Manual check for unusual 2xx/3xx success conditions
        if (res.status !== 200) {
          console.warn('Unexpected response status:', res.status);
          console.warn('Message:', res.data?.message || 'No message available');
          setErrors({ email: res.data?.message });
          return;
        }
        console.log(res.data);
      } catch (error: any) {
        // Axios wraps errors in the `response` object (if available)
        if (error.response) {
          console.error('Request failed:', error.response.data?.message || 'Unknown error');
          setErrors({ email: error.response.data?.message || 'Unknown error' });
        } else if (error.request) {
          console.error('No response received from server.');
          setErrors({ email: 'No response received from server.' });
        } else {
          console.error('Error setting up request:', error.message);
          setErrors({ email: 'Error setting up request: ' + error.message });
        }
      }


    }
  };

  return (
    <div className='h-screen  flex '>

      <LoginSidebar />

      <div className="w-[70%] bg-transparent p-12 flex flex-col justify-center h-screen overflow-y-auto">
        <div className="max-w-2xl mx-auto w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl font-bold">▶▶</span>
            </div>
            <h1 className="text-white text-2xl font-semibold">
              Welcome to Editlabs <span className="text-2xl">👋</span>
            </h1>
          </div>

          {/* Social Login Buttons */}
          <div className="space-y-3 mb-6">
            <button
              disabled={isLoading}
              className="w-full bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg flex items-center justify-center gap-3 transition-colors"
            >
              <FcGoogle className="w-5 h-5" />
              Continue with Google
            </button>

            <button
              disabled={isLoading}
              className="w-full bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg flex items-center justify-center gap-3 transition-colors"
            >
              <FaApple className="w-5 h-5" />
              Continue with Apple
            </button>

            {/* <button onClick={() => login("shobandejames@gmail.com", "9431")}> Press me</button> */}
          </div>

          {/* Divider */}
          <div className="flex items-center mb-6">
            <div className="flex-1 border-t border-gray-600"></div>
            <span className="px-4 text-gray-400 text-sm">or</span>
            <div className="flex-1 border-t border-gray-600"></div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-700 text-white placeholder-gray-400 py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* <div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-700 text-white placeholder-gray-400 py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
            </div> */}

            <button
              type="submit"
              className="w-full bg-white text-gray-900 font-semibold py-3 px-4 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Sign in
            </button>
          </form>

          {/* Footer */}
          <div className="text-center mt-6">
            <p className="text-gray-400 text-sm">
              Already have an account?{' '}
              <button onClick={() => navigate('/login')} className="text-white hover:text-purple-400 transition-colors">
                Log in
              </button>
            </p>
          </div>

          <div className="text-center mt-4">
            <p className="text-gray-500 text-xs">
              By continuing, you agree to Editlabs{' '}
              <button className="text-gray-400 hover:text-white transition-colors">
                Terms of Service
              </button>{' '}
              and{' '}
              <button className="text-gray-400 hover:text-white transition-colors">
                Privacy Policy
              </button>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignIn
