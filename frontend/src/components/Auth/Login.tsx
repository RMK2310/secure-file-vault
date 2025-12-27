import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { startAuthentication } from '@simplewebauthn/browser';
import { useAuth } from '../../context/AuthContext';
import { Fingerprint, Lock } from 'lucide-react';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handlePasswordLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
            login(res.data.token, res.data.user);
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Login failed');
        }
    };

    const handleWebAuthnLogin = async () => {
        if (!email) {
            setError('Please enter your email first');
            return;
        }

        try {
            // 1. Get options from server
            const optionsRes = await axios.post('http://localhost:5000/api/auth/webauthn/login/options', { email });

            // 2. Browser handles biometrics
            const asseResp = await startAuthentication(optionsRes.data);

            // 3. Verify with server
            const verifyRes = await axios.post('http://localhost:5000/api/auth/webauthn/login/verify', {
                email,
                output: asseResp,
            });

            if (verifyRes.data.verified) {
                login(verifyRes.data.token, verifyRes.data.user);
                navigate('/dashboard');
            }
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.error || 'Biometric login failed');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900">
            <div className="w-full max-w-md p-8 bg-gray-800 rounded-lg shadow-xl border border-gray-700">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cyan-500/20 mb-4">
                        <Lock className="w-8 h-8 text-cyan-400" />
                    </div>
                    <h2 className="text-3xl font-bold text-white">Welcome Back</h2>
                    <p className="text-gray-400 mt-2">Access your secure vault</p>
                </div>

                {error && <div className="p-3 mb-4 text-sm text-red-500 bg-red-900/20 rounded border border-red-500/50 text-center">{error}</div>}

                <form onSubmit={handlePasswordLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400">Email Address</label>
                        <input
                            type="email"
                            required
                            className="w-full px-4 py-3 mt-1 text-white bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none placeholder-gray-500 transition-all"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400">Password</label>
                        <input
                            type="password"
                            required
                            className="w-full px-4 py-3 mt-1 text-white bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none placeholder-gray-500 transition-all"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3 text-lg font-bold text-gray-900 bg-cyan-400 rounded-lg hover:bg-cyan-300 focus:outline-none focus:ring-4 focus:ring-cyan-500/50 transition-all transform hover:scale-[1.02]"
                    >
                        Login with Password
                    </button>
                </form>

                <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-700"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-gray-800 text-gray-500">Or continue with</span>
                    </div>
                </div>

                <button
                    onClick={handleWebAuthnLogin}
                    type="button"
                    className="w-full flex items-center justify-center gap-3 py-3 text-gray-300 bg-gray-700/50 border border-gray-600 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-cyan-900 transition-all transform hover:scale-[1.02]"
                >
                    <Fingerprint className="w-6 h-6 text-cyan-400" />
                    <span className="font-medium">Biometrics / Passkey</span>
                </button>

                <p className="mt-8 text-center text-gray-400">
                    Don't have an account?{' '}
                    <a href="/register" className="text-cyan-400 hover:text-cyan-300 font-medium hover:underline">
                        Register
                    </a>
                </p>
            </div>
        </div>
    );
};

export default Login;
