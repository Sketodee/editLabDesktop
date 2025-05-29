import axiosInstance from '@/utils/api';
import React, { useEffect, useState } from 'react';
import { FaApple } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import { useNavigate } from 'react-router-dom';
import LoginSidebar from './LoginSidebar';

interface LoginErrors {
    email?: string;
    otp?: string;
}

type LoginStep = 'email' | 'otp';

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState<string>('');
    const [otp, setOtp] = useState<string>('');
    const [currentStep, setCurrentStep] = useState<LoginStep>('email');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [errors, setErrors] = useState<LoginErrors>({});
    const [countdown, setCountdown] = useState<number>(0);
    const [isResendDisabled, setIsResendDisabled] = useState<boolean>(false);

    // Countdown timer effect
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;

        if (countdown > 0) {
            interval = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        setIsResendDisabled(false);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [countdown]);

    // Start countdown timer
    const startCountdown = (): void => {
        setCountdown(30);
        setIsResendDisabled(true);
    };

    // Verify email endpoint
    const verifyEmail = async (email: string): Promise<void> => {
        try {
            setIsLoading(true);
            const dataToSend = {
                email
            };

            const res = await axiosInstance.post('/auth/generateotp', dataToSend);
            console.log('Response:', res.status);

            if (res.status !== 200) {
                console.warn('Unexpected response status:', res.status);
                console.warn('Message:', res.data?.message || 'No message available');
                setErrors({ email: res.data?.message });
                return;
            }

            setCurrentStep('otp');
            startCountdown(); // Start countdown when OTP is sent

        } catch (error: any) {
            if (error.response) {
                setErrors(prev => ({ ...prev, email: error.response.data?.message || 'Unknown error' }));
            } else if (error.request) {
                setErrors(prev => ({ ...prev, email: 'No response received from server.' }));
            } else {
                setErrors(prev => ({ ...prev, email: 'Error setting up request: ' + error.message }));
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Submit OTP and email
    const submitLogin = async (email: string, otp: string): Promise<void> => {
        try {
            setIsLoading(true);
            const dataToSend = {
                email,
                otp
            };

            const res = await axiosInstance.post('/auth/login', dataToSend, {
                skipAuthRefresh: true
            });
            console.log('Response:', res.status);

            if (res.status !== 200) {
                console.warn('Unexpected response status:', res.status);
                console.warn('Message:', res.data?.message || 'No message available');
                setErrors({ email: res.data?.message });
                return;
            }

            localStorage.setItem('token', res.data.data.accessToken);
            navigate('/home');

        } catch (error: any) {
            if (error.response) {
                setErrors(prev => ({ ...prev, otp: error.response.data?.message || 'Unknown error' }));
            } else if (error.request) {
                setErrors(prev => ({ ...prev, otp: 'No response received from server.' }));
            } else {
                setErrors(prev => ({ ...prev, otp: 'Error setting up request: ' + error.message }));
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Handle form submission
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
        e.preventDefault();
        if (currentStep === 'email') {
            if (!email) {
                setErrors({ email: 'Email is required' });
                return;
            }
            verifyEmail(email);
        } else {
            if (!otp) {
                setErrors({ otp: 'OTP is required' });
                return;
            }
            submitLogin(email, otp);
        }
    };

    // Resend OTP
    const resendOtp = (): void => {
        if (isResendDisabled) return;

        setOtp(''); // Clear OTP input
        setErrors(prev => ({ ...prev, otp: undefined })); // Clear OTP errors
        verifyEmail(email);
    };

    // Create new account (placeholder)
    const createNewAccount = (): void => {
        navigate('/');
    };

    return (
        <div className="h-screen flex ">
            <LoginSidebar />

            <div className="w-[70%] bg-transparent p-12 flex flex-col justify-center h-screen overflow-y-auto">
                <div className='max-w-2xl mx-auto w-full'>
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <span className="text-white text-2xl font-bold">▶▶</span>
                        </div>
                        <h1 className="text-white text-2xl font-semibold">
                            Welcome to Editlabs <span className="text-2xl">👋</span>
                        </h1>
                    </div>

                    {/* Email Step */}
                    {currentStep === 'email' && (
                        <>
                            <form onSubmit={handleSubmit} className="space-y-4 mb-6">
                                <div>
                                    <input
                                        type="email"
                                        placeholder="Email address"
                                        value={email}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                                        className="w-full bg-gray-900 text-white placeholder-gray-500 py-4 px-4 rounded-xl border border-gray-800 focus:outline-none focus:border-purple-500 transition-colors"
                                        disabled={isLoading}
                                    />
                                    {errors.email && (
                                        <p className="text-red-500 text-sm mt-2">{errors.email}</p>
                                    )}
                                </div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-white text-black font-medium py-4 px-4 rounded-xl hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isLoading ? 'Sending...' : 'Continue'}
                                </button>
                            </form>

                            <div className="text-center mb-6">
                                <p className="text-gray-500 text-sm">
                                    We will send you a verification code to the email
                                </p>
                            </div>

                            {/* Social Login Buttons */}
                            <div className="space-y-3 mb-6">
                                <button
                                    disabled={isLoading}
                                    className="w-full bg-gray-900 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 px-4 rounded-xl flex items-center justify-center gap-3 transition-colors border border-gray-800"
                                >
                                    <FcGoogle className="w-5 h-5" />
                                    Continue with Google
                                </button>
                                <button
                                    disabled={isLoading}
                                    className="w-full bg-gray-900 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 px-4 rounded-xl flex items-center justify-center gap-3 transition-colors border border-gray-800"
                                >
                                    <FaApple className="w-5 h-5" />
                                    Continue with Apple
                                </button>
                            </div>

                            {/* Footer */}
                            <div className="text-center">
                                <p className="text-gray-500 text-sm">
                                    Don't have an account yet?{' '}
                                    <button
                                        onClick={createNewAccount}
                                        className="text-white hover:text-purple-400 transition-colors font-medium"
                                    >
                                        Create new account
                                    </button>
                                </p>
                            </div>
                        </>
                    )}

                    {/* OTP Step */}
                    {currentStep === 'otp' && (
                        <>
                            <div className="text-center mb-6">
                                <h2 className="text-white text-xl font-medium mb-2">
                                    Check your email for the 4 digit code
                                </h2>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4 mb-6">
                                <div>
                                    <input
                                        type="text"
                                        placeholder="Enter the 4 digit code"
                                        value={otp}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOtp(e.target.value)}
                                        className="w-full bg-gray-900 text-white placeholder-gray-500 py-4 px-4 rounded-xl border border-gray-800 focus:outline-none focus:border-purple-500 transition-colors text-center text-lg tracking-wider"
                                        maxLength={6}
                                        disabled={isLoading}
                                    />
                                    {errors.otp && (
                                        <p className="text-red-500 text-sm mt-2">{errors.otp}</p>
                                    )}
                                </div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-white text-black font-medium py-4 px-4 rounded-xl hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isLoading ? 'Verifying...' : 'Submit'}
                                </button>
                            </form>

                            {/* Resend OTP */}
                            <div className="text-center">
                                <p className="text-gray-500 text-sm">
                                    Don't received a code, try{' '}
                                    <button
                                        onClick={resendOtp}
                                        disabled={isLoading || isResendDisabled}
                                        className={`font-medium transition-colors ${isLoading || isResendDisabled
                                                ? 'text-gray-600 cursor-not-allowed'
                                                : 'text-white hover:text-purple-400'
                                            }`}
                                    >
                                        {isResendDisabled ? `resend (${countdown}s)` : 'resend'}
                                    </button>
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LoginPage;