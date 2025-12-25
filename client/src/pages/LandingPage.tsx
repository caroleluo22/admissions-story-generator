import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';

export const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-black text-white selection:bg-indigo-500 selection:text-white font-sans overflow-x-hidden">
            {/* Background Gradients */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-900/20 rounded-full blur-[120px] animate-pulse-slow" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-violet-900/20 rounded-full blur-[120px] animate-pulse-slow delay-1000" />
            </div>

            <Header />

            <main className="relative z-10 pt-32 pb-20">

                {/* Hero Section */}
                <section className="max-w-7xl mx-auto px-6 text-center mb-32">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-8 animate-fade-in-up">
                        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
                        AI-Powered Video Generation
                    </div>
                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight animate-fade-in-up delay-100">
                        Turn your knowledge into <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">cinematic videos</span>
                    </h1>
                    <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in-up delay-200">
                        Transform simple text descriptions into high-quality video lessons, storyboards, and audio guides in seconds. No filming required.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up delay-300">
                        <button
                            onClick={() => navigate('/studio')}
                            className="px-8 py-4 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-lg shadow-xl shadow-indigo-600/20 hover:shadow-indigo-600/40 transition-all w-full sm:w-auto"
                        >
                            Start Creating Now
                        </button>
                        <button onClick={() => navigate('/library')} className="px-8 py-4 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold text-lg transition-all w-full sm:w-auto">
                            View Examples
                        </button>
                    </div>

                    {/* Hero Image/Preview */}
                    <div className="mt-20 relative max-w-5xl mx-auto rounded-2xl overflow-hidden shadow-2xl border border-white/10 animate-fade-in-up delay-500 aspect-video bg-slate-900 group cursor-pointer" onClick={() => navigate('/studio')}>
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10 opacity-60"></div>
                        {/* Placeholder UI Representation */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-white ml-1">
                                    <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
                                </svg>
                            </div>
                        </div>
                        <div className="absolute bottom-8 left-8 z-20 text-left">
                            <div className="text-sm font-medium text-indigo-400 mb-1">FEATURED GENERATION</div>
                            <div className="text-2xl font-bold text-white">Advanced Quantum Mechanics</div>
                        </div>
                        <img src="https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=2600&auto=format&fit=crop" alt="App Preview" className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity duration-700" />
                    </div>
                </section>

                {/* Features Grid */}
                <section className="max-w-7xl mx-auto px-6 py-20 border-t border-white/5">
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                title: "AI Scriptwriting",
                                description: "Our LLM agent crafts educational scripts tailored to your specific audience and learning goals instantly.",
                                icon: (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                                    </svg>
                                )
                            },
                            {
                                title: "Cinematic Visuals",
                                description: "Generate stunning 4K video clips or storyboards that perfectly match your educational narrative.",
                                icon: (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                                    </svg>
                                )
                            },
                            {
                                title: "Human-Like Voiceovers",
                                description: "Natural sounding narration brings your stories to life, available in multiple styles and tones.",
                                icon: (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
                                    </svg>
                                )
                            }
                        ].map((feature, idx) => (
                            <div key={idx} className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group">
                                <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                                <p className="text-slate-400 leading-relaxed">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* CTA Section */}
                <section className="max-w-4xl mx-auto px-6 py-32 text-center">
                    <h2 className="text-4xl font-bold mb-6">Ready to revolutionize your content?</h2>
                    <p className="text-slate-400 mb-10 text-lg">Join thousands of educators and creators using AI to scale their video production.</p>
                    <button
                        onClick={() => navigate('/studio')}
                        className="px-10 py-5 rounded-full bg-white text-black font-bold text-lg hover:scale-105 transition-transform"
                    >
                        Launch App Free
                    </button>
                </section>

            </main>

            <footer className="border-t border-white/5 py-12 bg-black/50">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between text-slate-500 text-sm">
                    <div>© 2024 Visionary Tutor. All rights reserved.</div>
                    <div className="flex gap-6 mt-4 md:mt-0">
                        <a href="#" className="hover:text-white transition-colors">Privacy</a>
                        <a href="#" className="hover:text-white transition-colors">Terms</a>
                        <a href="#" className="hover:text-white transition-colors">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};
