import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import { UserType } from '@renderer/types/appScopeTypes';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const GOOGLE_CLIENT_ID = '530872671299-rl75q5e1il0k2060v6s29e0g5e5tb04k.apps.googleusercontent.com';

const GoogleSignInButton = () => {
    const login = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            const decoded = jwtDecode<any>(tokenResponse.credential);
            const userPayload = {
                userType: UserType.USER,
                email: decoded.email,
                provider: 'google',
                providerId: decoded.sub,
            };
            await axios.post('http://localhost:8080/api/user/createuser', userPayload);
        },
        flow: 'implicit',
    });

    return (
        <button onClick={() => login()} className="bg-blue-600 text-white px-4 py-2 rounded">
            Sign in with Google
        </button>
    );
};

export const Test = () => {
    const handleAppleLogin = () => {
        window.AppleID.auth.init({
            clientId: 'com.your.app.id',
            scope: 'name email',
            redirectURI: 'https://your-backend.com/callback',
            usePopup: true,
        });

        window.AppleID.auth.signIn().then(async (response: any) => {
            const email = response.user?.email ?? 'unknown@email.com';
            const providerId = response.user?.sub;

            const userPayload = {
                email,
                provider: 'apple',
                providerId,
            };

            await axios.post('http://localhost:8080/api/user/createuser', userPayload);
        });
    };

    return (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <div className="flex flex-col gap-4 items-center">
                <GoogleSignInButton />
                <button
                    onClick={handleAppleLogin}
                    className="bg-black text-white px-4 py-2 rounded"
                >
                    Sign in with Apple
                </button>
            </div>
        </GoogleOAuthProvider>
    );
};
