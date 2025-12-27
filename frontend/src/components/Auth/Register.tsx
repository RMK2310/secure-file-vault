import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { startRegistration } from '@simplewebauthn/browser';

const Register: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handlePasswordRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/api/auth/register', { email, password });
            navigate('/login');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Registration failed');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900">
            <div className="w-full max-w-md p-8 bg-gray-800 rounded-lg shadow-xl border border-gray-700">
                <h2 className="text-3xl font-bold text-center text-cyan-400 mb-6">Create Account</h2>
                {error && <div className="p-3 mb-4 text-sm text-red-500 bg-red-900/20 rounded border border-red-500/50">{error}</div>}

                <form onSubmit={handlePasswordRegister} className="space-y-6">
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
                        Sign Up
                    </button>
                </form>

                <p className="mt-6 text-center text-gray-400">
                    Already have an account?{' '}
                    <a href="/login" className="text-cyan-400 hover:text-cyan-300 font-medium hover:underline">
                        Login
                    </a>
                </p>
            </div>
        </div>
    );
};

export default Register;
