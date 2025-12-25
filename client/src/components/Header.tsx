import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AppMode } from '../types';

interface HeaderProps {
    appMode?: AppMode;
    setAppMode?: (mode: AppMode) => void;
    setAppStatus?: (status: any) => void; // Using any to avoid circular dependency loop for now, ideally strictly typed
}

export const Header: React.FC<HeaderProps> = ({ appMode, setAppMode, setAppStatus }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout, isAuthenticated } = useAuth();

    const isLanding = location.pathname === '/';
    const isStudio = location.pathname.startsWith('/studio');

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <header className={`sticky top-0 z-50 w-full backdrop-blur-md border-b border-white/5 ${isLanding ? 'fixed bg-black/50' : 'bg-slate-900/50'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                {/* Logo Section */}
                <Link to="/" className="flex items-center space-x-3 cursor-pointer">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
                            <path d="M4.5 4.5a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h8.25a3 3 0 0 0 3-3v-9a3 3 0 0 0-3-3H4.5ZM19.94 18.75l-2.69-2.69V7.94l2.69-2.69c.944-.945 2.56-.276 2.56 1.06v11.38c0 1.336-1.616 2.005-2.56 1.06Z" />
                        </svg>
                    </div>
                    <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 tracking-tight">
                        VISIONARY
                    </span>
                </Link>

                {/* Navigation & User Actions */}
                <div className="flex items-center gap-4">
                    {isAuthenticated ? (
                        <>
                            {isStudio && setAppMode && setAppStatus && (
                                <div className="hidden md:flex bg-slate-800/80 p-1 rounded-xl border border-white/5 bg-opacity-40 backdrop-blur-sm mr-4">
                                    <button
                                        onClick={() => { setAppMode(AppMode.TUTORIAL); setAppStatus('INPUT'); }}
                                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${appMode === AppMode.TUTORIAL ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                                    >
                                        Video Studio
                                    </button>
                                    <button
                                        onClick={() => { setAppMode(AppMode.STORY_STUDIO); }}
                                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${appMode === AppMode.STORY_STUDIO ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                                    >
                                        Story Studio
                                    </button>
                                </div>
                            )}

                            <div className="w-px h-6 bg-white/10 mx-2 hidden md:block" />
                            <button onClick={() => navigate('/trend-studio')} className="text-slate-400 hover:text-white text-sm font-bold">Trend Studio</button>
                            <button onClick={() => navigate('/writing')} className="text-slate-400 hover:text-white text-sm font-bold">Writing Studio</button>
                            <button onClick={() => navigate('/library')} className="text-slate-400 hover:text-white text-sm font-bold">Library</button>
                            <button onClick={() => navigate('/brand')} className="text-slate-400 hover:text-white text-sm font-bold">Brand</button>

                            <div className="w-px h-6 bg-white/10 mx-2 hidden md:block" />

                            <div className="flex items-center gap-3 ml-2 group relative">
                                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/30">
                                    {user?.name?.[0]?.toUpperCase() || 'U'}
                                </div>
                                <span className="text-sm font-medium text-slate-300 hidden md:inline-block">{user?.name}</span>

                                {/* Logout Dropdown (Simple implementation) */}
                                <div className="absolute top-full right-0 mt-2 w-32 py-1 bg-slate-800 rounded-lg shadow-xl border border-slate-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                                    <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-700">
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center gap-6">
                            {isLanding && (
                                <button
                                    onClick={() => navigate('/studio')}
                                    className="px-5 py-2.5 rounded-full bg-white text-black font-semibold text-sm hover:scale-105 transition-transform shadow-lg shadow-white/10"
                                >
                                    Get Started &rarr;
                                </button>
                            )}
                            <button onClick={() => navigate('/login')} className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Sign In</button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};
