import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { startRegistration } from '@simplewebauthn/browser';
import { FileText, Download, Upload, Fingerprint, LogOut, ShieldCheck, Trash2 } from 'lucide-react';

interface FileItem {
    _id: string;
    originalName: string;
    mimeType: string;
    size: number;
    createdAt: string;
}

const FileVault: React.FC = () => {
    const { user, logout } = useAuth();
    const [files, setFiles] = useState<FileItem[]>([]);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchFiles();
    }, []);

    const fetchFiles = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/files');
            setFiles(res.data.files);
        } catch (error) {
            console.error('Fetch error:', error);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile) return;

        const formData = new FormData();
        formData.append('file', selectedFile);

        setUploading(true);
        try {
            await axios.post('http://localhost:5000/api/files/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setMessage('File uploaded successfully!');
            setSelectedFile(null);
            fetchFiles();
        } catch (error: any) {
            setMessage(error.response?.data?.error || 'Upload failed');
        } finally {
            setUploading(false);
            setTimeout(() => setMessage(''), 3000);
        }
    };

    const downloadFile = async (id: string, name: string) => {
        try {
            const res = await axios.get(`http://localhost:5000/api/files/${id}`, {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', name);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Download error', error);
            alert('Download failed');
        }
    };

    // New Delete Function
    const deleteFile = async (id: string, name: string) => {
        if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;

        try {
            await axios.delete(`http://localhost:5000/api/files/${id}`);
            // Optimistic update
            setFiles(files.filter(f => f._id !== id));
        } catch (error) {
            console.error('Delete error', error);
            alert('Failed to delete file');
        }
    };

    const registerBiometrics = async () => {
        try {
            const optionsRes = await axios.get('http://localhost:5000/api/auth/webauthn/register/options');
            const attResp = await startRegistration(optionsRes.data);
            const verifyRes = await axios.post('http://localhost:5000/api/auth/webauthn/register/verify', attResp);

            if (verifyRes.data.verified) {
                alert('Biometrics registered successfully! You can now login with this device.');
            }
        } catch (error: any) {
            console.error(error);
            alert(error.response?.data?.error || 'Biometric registration failed');
        }
    };

    const formatSize = (bytes: number) => {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let i = 0;
        while (size >= 1024 && i < units.length - 1) {
            size /= 1024;
            i++;
        }
        return `${size.toFixed(1)} ${units[i]}`;
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-10 bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
                    <div>
                        <h1 className="text-3xl font-bold text-cyan-400 flex items-center gap-2">
                            <ShieldCheck className="w-8 h-8" /> Secure Vault
                        </h1>
                        <p className="text-gray-400 mt-1">Logged in as <span className="text-white font-medium">{user?.email}</span></p>
                    </div>

                    <div className="flex gap-4 mt-4 md:mt-0">
                        <button
                            onClick={registerBiometrics}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm font-medium border border-gray-600"
                        >
                            <Fingerprint className="w-4 h-4 text-cyan-400" />
                            Register Passkey
                        </button>
                        <button
                            onClick={logout}
                            className="flex items-center gap-2 px-4 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-lg transition-colors text-sm font-medium border border-red-900/50"
                        >
                            <LogOut className="w-4 h-4" />
                            Logout
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Upload Section */}
                    <div className="lg:col-span-1">
                        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 sticky top-6">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
                                <Upload className="w-5 h-5 text-cyan-400" /> Upload File
                            </h2>

                            <form onSubmit={handleUpload} className="space-y-4">
                                <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-cyan-500/50 transition-colors bg-gray-700/30">
                                    <input
                                        type="file"
                                        onChange={handleFileChange}
                                        className="hidden"
                                        id="fileInput"
                                    />
                                    <label htmlFor="fileInput" className="cursor-pointer flex flex-col items-center">
                                        <FileText className="w-12 h-12 text-gray-500 mb-2" />
                                        <span className="text-sm text-gray-300">
                                            {selectedFile ? selectedFile.name : 'Click to select file'}
                                        </span>
                                    </label>
                                </div>

                                {message && <div className={`text-sm text-center p-2 rounded ${message.includes('success') ? 'text-green-400 bg-green-900/20' : 'text-red-400 bg-red-900/20'}`}>{message}</div>}

                                <button
                                    type="submit"
                                    disabled={!selectedFile || uploading}
                                    className={`w-full py-2.5 rounded-lg font-bold transition-all ${!selectedFile || uploading
                                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                        : 'bg-cyan-500 hover:bg-cyan-400 text-gray-900 transform hover:scale-[1.02]'
                                        }`}
                                >
                                    {uploading ? 'Uploading...' : 'Secure Upload'}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Files List */}
                    <div className="lg:col-span-2">
                        <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 overflow-hidden">
                            <div className="p-6 border-b border-gray-700">
                                <h2 className="text-xl font-bold text-white">Your Files</h2>
                            </div>

                            {files.length === 0 ? (
                                <div className="p-12 text-center text-gray-500">
                                    No files uploaded yet.
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-700">
                                    {files.map((file) => (
                                        <div key={file._id} className="p-4 flex items-center justify-between hover:bg-gray-700/50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-gray-700 rounded-lg">
                                                    <FileText className="w-6 h-6 text-cyan-400" />
                                                </div>
                                                <div>
                                                    <h3 className="font-medium text-white truncate max-w-[200px] sm:max-w-md" title={file.originalName}>
                                                        {file.originalName}
                                                    </h3>
                                                    <p className="text-xs text-gray-400">
                                                        {formatSize(file.size)} • {new Date(file.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => downloadFile(file._id, file.originalName)}
                                                    className="p-2 hover:bg-gray-600 rounded-lg text-gray-400 hover:text-cyan-400 transition-colors"
                                                    title="Download"
                                                >
                                                    <Download className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => deleteFile(file._id, file.originalName)}
                                                    className="p-2 hover:bg-gray-600 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FileVault;
