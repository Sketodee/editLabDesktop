import axiosInstance from '@/utils/api';
import { useAuth } from '@renderer/context/AuthContext';
import { AllowedProviders, UserType } from '@renderer/types/appScopeTypes';
import { useEffect, useState } from 'react';
import AppleSignin from 'react-apple-signin-auth';
import { FaApple } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import { useNavigate } from 'react-router-dom';
import LoginSidebar from './LoginSidebar';

// Add this enum to your types file or import it


const SignIn = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/home');
    }
  }, [isAuthenticated, navigate]);

  // Check for OAuth callback on component mount
  useEffect(() => {
    handleOAuthCallback();
  }, []);

  // Handle OAuth callback from URL
  const handleOAuthCallback = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const hash = window.location.hash;

    // Check for OAuth response in URL parameters or hash
    let accessToken = urlParams.get('access_token');

    // If not in params, check hash (for implicit flow)
    if (!accessToken && hash) {
      const hashParams = new URLSearchParams(hash.substring(1));
      accessToken = hashParams.get('access_token');
    }

    if (accessToken) {
      setIsLoading(true);
      try {
        // Get user info from Google API
        const response = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`);
        const userData = await response.json();

        console.log('Google OAuth user data:', userData);

        const userPayload = {
          email: userData.email,
          name: userData.name,
          userType: UserType.USER,
          provider: AllowedProviders.GOOGLE,
          providerId: userData.id,
        };

        await createUser(userPayload);

        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (error) {
        console.error('Error processing OAuth callback:', error);
        setErrors({ email: 'Failed to process Google sign-in. Please try again.' });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = 'Email is required.';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Create user with provider info
  const createUser = async (userData) => {
    try {
      const response = await axiosInstance.post('/user/create', userData);
      console.log('User creation response:', response.data);

      if (response.status === 200) {
        console.log('User created successfully');
        navigate('/home');
      }

      return response.data;
    } catch (error: any) {
      console.error('User creation error:', error);

      if (error.response) {
        setErrors({ email: error.response.data?.message || 'Registration failed' });
      } else if (error.request) {
        setErrors({ email: 'No response received from server.' });
      } else {
        setErrors({ email: 'Error setting up request: ' + error.message });
      }
      throw error;
    }
  };

  // Direct OAuth redirect (most reliable method)
  const redirectToGoogleOAuth = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const redirectUri = encodeURIComponent(window.location.origin + window.location.pathname);
    const scope = encodeURIComponent('email profile');
    const state = encodeURIComponent(JSON.stringify({
      returnUrl: window.location.pathname,
      timestamp: Date.now()
    }));

    const authUrl = `https://accounts.google.com/oauth/authorize?` +
      `client_id=${clientId}&` +
      `redirect_uri=${redirectUri}&` +
      `scope=${scope}&` +
      `response_type=token&` +  // Use token for client-side handling
      `state=${state}&` +
      `prompt=select_account&` +  // Force account selection
      `include_granted_scopes=true`;

    console.log('Redirecting to Google OAuth:', authUrl);
    window.location.href = authUrl;
  };

  // Handle Google Sign-In with fallback to OAuth
  const handleGoogleSignIn = async (response) => {
    setIsLoading(true);
    setErrors({});

    try {
      // Decode the JWT token to get user info
      const decoded = JSON.parse(atob(response.credential.split('.')[1]));

      const userData = {
        email: decoded.email,
        name: decoded.name,
        userType: UserType.USER,
        provider: AllowedProviders.GOOGLE,
        providerId: decoded.sub,
      };

      await createUser(userData);
    } catch (error) {
      console.error('Google sign-in error:', error);
      setErrors({ email: 'Google sign-in failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google button click - Skip One Tap, go straight to OAuth
  const handleGoogleButtonClick = () => {
    console.log('Google button clicked - using OAuth redirect');

    // Clear any existing errors
    setErrors({});

    // Go directly to OAuth redirect (most reliable method)
    redirectToGoogleOAuth();
  };

  // Initialize Google Sign-In (disabled for now due to FedCM issues)
  // useEffect(() => {
  //   // Commented out to avoid FedCM errors
  //   // We'll rely on OAuth redirect only
  // }, []);

  // Handle Apple Sign-In
  const handleAppleSignIn = async (response) => {
    setIsLoading(true);
    setErrors({});

    try {
      let userEmail = null;
      let userName = 'Apple User';

      // Try to get email from ID token
      if (response.authorization.id_token) {
        const decoded = JSON.parse(atob(response.authorization.id_token.split('.')[1]));
        userEmail = decoded.email;
      }

      // Get name if provided
      if (response.user?.name) {
        userName = `${response.user.name.firstName} ${response.user.name.lastName}`;
      }

      const userData = {
        email: userEmail,
        name: userName,
        userType: UserType.USER,
        provider: AllowedProviders.APPLE,
        providerId: response.authorization.code,
      };

      await createUser(userData);
    } catch (error) {
      console.error('Apple sign-in error:', error);
      setErrors({ email: 'Apple sign-in failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle regular email submission (custom provider)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validate()) {
      setIsLoading(true);

      const dataToSend = {
        email,
        userType: UserType.USER,
        provider: AllowedProviders.CUSTOM,
        providerId: null,
      };

      try {
        await createUser(dataToSend);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className='h-screen flex'>
      <LoginSidebar />

      <div className="w-[70%] bg-transparent p-12 flex flex-col justify-center h-screen overflow-y-auto">
        <div className="max-w-2xl mx-auto w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl font-bold">▶▶</span>
            </div>
            <h1 className="text-white text-3xl font-bold">
              Welcome to Editlabs <span className="text-2xl">👋</span>
            </h1>
          </div>

          {/* Social Login Buttons */}
          <div className="space-y-3 mb-6">
            {/* Google Sign-In Button */}
            <button
              onClick={handleGoogleButtonClick}
              disabled={isLoading}
              className="w-full h-[44px] rounded-lg border border-[#323133] flex items-center justify-center gap-2.5 px-6 py-3 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'radial-gradient(53.53% 66.97% at 50% 0%, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.02) 100%)',
                boxShadow: '0px 0px 12px 1px #FFFFFF1A inset'
              }}
            >
              <FcGoogle className="w-5 h-5" />
              {isLoading ? 'Processing...' : 'Continue with Google'}
            </button>

            {/* Apple Sign-In Button */}
            <AppleSignin
              authOptions={{
                clientId: import.meta.env.VITE_APPLE_CLIENT_ID,
                scope: 'email name',
                redirectURI: window.location.origin,
                state: 'state',
                nonce: 'nonce',
                usePopup: true,
              }}
              uiType="dark"
              onSuccess={handleAppleSignIn}
              onError={(error) => {
                console.error('Apple sign-in error:', error);
                setErrors({ email: 'Apple sign-in failed. Please try again.' });
              }}
              skipScript={false}
              render={(props) => (
                <button
                  {...props}
                  disabled={isLoading}
                  className="w-full h-[44px] rounded-lg border border-[#323133] flex items-center justify-center gap-2.5 px-6 py-3 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: 'radial-gradient(53.53% 66.97% at 50% 0%, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.02) 100%)',
                    boxShadow: '0px 0px 12px 1px #FFFFFF1A inset'
                  }}
                >
                  <FaApple className="w-5 h-5" />
                  {isLoading ? 'Processing...' : 'Continue with Apple'}
                </button>
              )}
            />
          </div>

          {/* Divider */}
          <div className="flex items-center mb-6">
            <div className="flex-1 border-t border-[#323133]"></div>
            <span className="px-4 text-gray-400 text-sm">or</span>
            <div className="flex-1 border-t border-[#323133]"></div>
          </div>

          {/* Email Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="w-full h-[44px] bg-transparent border-[1px] border-[#282729] text-white placeholder-gray-400 py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-[44px] bg-white text-gray-900 py-3 px-4 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Processing...' : 'Sign in'}
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
  );
};

export default SignIn;





// import axiosInstance from '@/utils/api';
// import { useAuth } from '@renderer/context/AuthContext';
// import { UserType } from '@renderer/types/appScopeTypes';
// import { useEffect, useState } from 'react';
// import AppleSignin from 'react-apple-signin-auth';
// import { FaApple } from 'react-icons/fa';
// import { FcGoogle } from 'react-icons/fc';
// import { useNavigate } from 'react-router-dom';
// import LoginSidebar from './LoginSidebar';

// // Add this enum to your types file or import it
// export enum AllowedProviders {
//   GOOGLE = 'google',
//   APPLE = 'apple',
//   CUSTOM = 'custom',
// }

// const SignIn = () => {
//   const { isAuthenticated } = useAuth();
//   const navigate = useNavigate();
//   const [email, setEmail] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
//   const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

//   useEffect(() => {
//     if (isAuthenticated) {
//       navigate('/home');
//     }
//   }, [isAuthenticated, navigate]);

//   // Initialize Google Sign-In
//   useEffect(() => {
//     const initializeGoogleSignIn = () => {
//       if (window.google) {
//         window.google.accounts.id.initialize({
//           client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
//           callback: handleGoogleSignIn,
//         });
//       }
//     };

//     // Check if Google script is loaded
//     if (window.google) {
//       initializeGoogleSignIn();
//     } else {
//       // Wait for script to load
//       const checkGoogle = setInterval(() => {
//         if (window.google) {
//           initializeGoogleSignIn();
//           clearInterval(checkGoogle);
//         }
//       }, 100);

//       // Cleanup interval after 10 seconds
//       setTimeout(() => clearInterval(checkGoogle), 10000);
//     }
//   }, []);

//   const validate = () => {
//     const newErrors: { email?: string; password?: string } = {};

//     if (!email) {
//       newErrors.email = 'Email is required.';
//     } else if (!/\S+@\S+\.\S+/.test(email)) {
//       newErrors.email = 'Email is invalid.';
//     }

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };


//   // Create user with provider info
//   const createUser = async (userData) => {
//     try {
//       const response = await axiosInstance.post('/user/create', userData);
//       console.log('User creation response:', response.data);

//       if (response.status === 200) {
//         // Handle successful user creation
//         // You might want to automatically log them in or redirect
//         console.log('User created successfully');
//         navigate('/home'); // Uncomment if you want to auto-redirect
//       }

//       return response.data;
//     } catch (error: any) {
//       console.error('User creation error:', error);

//       if (error.response) {
//         setErrors({ email: error.response.data?.message || 'Registration failed' });
//       } else if (error.request) {
//         setErrors({ email: 'No response received from server.' });
//       } else {
//         setErrors({ email: 'Error setting up request: ' + error.message });
//       }
//       throw error;
//     }
//   };

//   // Handle Google Sign-In
//   const handleGoogleSignIn = async (response) => {
//     setIsLoading(true);
//     setErrors({});

//     try {
//       // Decode the JWT token to get user info
//       const decoded = JSON.parse(atob(response.credential.split('.')[1]));

//       const userData = {
//         email: decoded.email,
//         name: decoded.name,
//         userType: UserType.USER,
//         provider: AllowedProviders.GOOGLE,
//         providerId: decoded.sub,
//       };

//       await createUser(userData);
//     } catch (error) {
//       console.error('Google sign-in error:', error);
//       setErrors({ email: 'Google sign-in failed. Please try again.' });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Handle Apple Sign-In
//   const handleAppleSignIn = async (response) => {
//     setIsLoading(true);
//     setErrors({});

//     try {
//       let userEmail = null;
//       let userName = 'Apple User';

//       // Try to get email from ID token
//       if (response.authorization.id_token) {
//         const decoded = JSON.parse(atob(response.authorization.id_token.split('.')[1]));
//         userEmail = decoded.email;
//       }

//       // Get name if provided
//       if (response.user?.name) {
//         userName = `${response.user.name.firstName} ${response.user.name.lastName}`;
//       }

//       const userData = {
//         email: userEmail,
//         name: userName,
//         userType: UserType.USER,
//         provider: AllowedProviders.APPLE,
//         providerId: response.authorization.code,
//       };

//       await createUser(userData);
//     } catch (error) {
//       console.error('Apple sign-in error:', error);
//       setErrors({ email: 'Apple sign-in failed. Please try again.' });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Handle Google button click
//   const handleGoogleButtonClick = () => {
//     if (window.google) {
//       window.google.accounts.id.prompt();
//     } else {
//       setErrors({ email: 'Google Sign-In not loaded. Please refresh the page.' });
//     }
//   };

//   // Handle regular email submission (custom provider)
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     if (validate()) {
//       setIsLoading(true);

//       const dataToSend = {
//         email,
//         userType: UserType.USER,
//         provider: AllowedProviders.CUSTOM,
//         providerId: null, // No provider ID for custom registration
//       };

//       try {
//         await createUser(dataToSend);
//       } finally {
//         setIsLoading(false);
//       }
//     }
//   };

//   return (
//     <div className='h-screen flex'>
//       <LoginSidebar />

//       <div className="w-[70%] bg-transparent p-12 flex flex-col justify-center h-screen overflow-y-auto">
//         <div className="max-w-2xl mx-auto w-full">
//           {/* Header */}
//           <div className="text-center mb-8">
//             <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
//               <span className="text-white text-2xl font-bold">▶▶</span>
//             </div>
//             <h1 className="text-white text-3xl font-bold">
//               Welcome to Editlabs <span className="text-2xl">👋</span>
//             </h1>
//           </div>

//           {/* Social Login Buttons */}
//           <div className="space-y-3 mb-6">
//             {/* Google Sign-In Button */}
//             <button
//               onClick={handleGoogleButtonClick}
//               disabled={isLoading}
//               className="w-full h-[44px] rounded-lg border border-[#323133] flex items-center justify-center gap-2.5 px-6 py-3 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
//               style={{
//                 background: 'radial-gradient(53.53% 66.97% at 50% 0%, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.02) 100%)',
//                 boxShadow: '0px 0px 12px 1px #FFFFFF1A inset'
//               }}
//             >
//               <FcGoogle className="w-5 h-5" />
//               {isLoading ? 'Processing...' : 'Continue with Google'}
//             </button>

//             {/* Apple Sign-In Button */}
//             <AppleSignin
//               authOptions={{
//                 clientId: import.meta.env.VITE_APPLE_CLIENT_ID,
//                 scope: 'email name',
//                 redirectURI: window.location.origin,
//                 state: 'state',
//                 nonce: 'nonce',
//                 usePopup: true,
//               }}
//               uiType="dark"
//               onSuccess={handleAppleSignIn}
//               onError={(error) => {
//                 console.error('Apple sign-in error:', error);
//                 setErrors({ email: 'Apple sign-in failed. Please try again.' });
//               }}
//               skipScript={false}
//               render={(props) => (
//                 <button
//                   {...props}
//                   disabled={isLoading}
//                   className="w-full h-[44px] rounded-lg border border-[#323133] flex items-center justify-center gap-2.5 px-6 py-3 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
//                   style={{
//                     background: 'radial-gradient(53.53% 66.97% at 50% 0%, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.02) 100%)',
//                     boxShadow: '0px 0px 12px 1px #FFFFFF1A inset'
//                   }}
//                 >
//                   <FaApple className="w-5 h-5" />
//                   {isLoading ? 'Processing...' : 'Continue with Apple'}
//                 </button>
//               )}
//             />
//           </div>

//           {/* Divider */}
//           <div className="flex items-center mb-6">
//             <div className="flex-1 border-t border-[#323133]"></div>
//             <span className="px-4 text-gray-400 text-sm">or</span>
//             <div className="flex-1 border-t border-[#323133]"></div>
//           </div>

//           {/* Email Form */}
//           <form onSubmit={handleSubmit} className="space-y-4">
//             <div>
//               <input
//                 type="email"
//                 placeholder="Email address"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 disabled={isLoading}
//                 className="w-full h-[44px] bg-transparent border-[1px] border-[#282729] text-white placeholder-gray-400 py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
//               />
//               {errors.email && (
//                 <p className="text-red-500 text-sm mt-1">{errors.email}</p>
//               )}
//             </div>

//             <button
//               type="submit"
//               disabled={isLoading}
//               className="w-full h-[44px] bg-white text-gray-900 py-3 px-4 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//             >
//               {isLoading ? 'Processing...' : 'Sign in'}
//             </button>
//           </form>

//           {/* Footer */}
//           <div className="text-center mt-6">
//             <p className="text-gray-400 text-sm">
//               Already have an account?{' '}
//               <button onClick={() => navigate('/login')} className="text-white hover:text-purple-400 transition-colors">
//                 Log in
//               </button>
//             </p>
//           </div>

//           <div className="text-center mt-4">
//             <p className="text-gray-500 text-xs">
//               By continuing, you agree to Editlabs{' '}
//               <button className="text-gray-400 hover:text-white transition-colors">
//                 Terms of Service
//               </button>{' '}
//               and{' '}
//               <button className="text-gray-400 hover:text-white transition-colors">
//                 Privacy Policy
//               </button>
//               .
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default SignIn;

