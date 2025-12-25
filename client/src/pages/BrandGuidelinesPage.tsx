import React, { useState, useEffect } from 'react';
import api from '../services/api';

interface BrandGuidelines {
    toneOfVoice: string;
    bannedTerms: string[];
    defaultDisclaimer: string;
    defaultLinks: string;
}

export const BrandGuidelinesPage = () => {
    const [guidelines, setGuidelines] = useState<BrandGuidelines>({
        toneOfVoice: '',
        bannedTerms: [],
        defaultDisclaimer: '',
        defaultLinks: ''
    });
    const [bannedTermsInput, setBannedTermsInput] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchGuidelines();
    }, []);

    const fetchGuidelines = async () => {
        try {
            const res = await api.get('/brand');
            setGuidelines(res.data);
            setBannedTermsInput(res.data.bannedTerms.join(', '));
        } catch (error) {
            console.error('Error fetching guidelines:', error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setGuidelines(prev => ({ ...prev, [name]: value }));
    };

    const handleBannedTermsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setBannedTermsInput(e.target.value);
        setGuidelines(prev => ({
            ...prev,
            bannedTerms: e.target.value.split(',').map(term => term.trim()).filter(t => t)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.put('/brand', guidelines);
            setMessage('Guidelines saved successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('Error saving guidelines:', error);
            setMessage('Error saving guidelines.');
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-slate-900 min-h-screen">
            <h1 className="text-3xl font-bold mb-6 text-white">Brand Guidelines</h1>

            {message && (
                <div className={`p-4 mb-4 rounded ${message.includes('Error') ? 'bg-red-900/20 text-red-300' : 'bg-green-900/20 text-green-300'}`}>
                    {message}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 bg-slate-800 shadow px-4 py-5 sm:rounded-lg sm:p-6 border border-slate-700">

                <div>
                    <label className="block text-sm font-medium text-slate-300">Tone of Voice Notes</label>
                    <div className="mt-1">
                        <textarea
                            name="toneOfVoice"
                            rows={4}
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-slate-600 bg-slate-900 text-white rounded-md p-2 border"
                            placeholder="e.g. Professional yet approachable, avoid slang..."
                            value={guidelines.toneOfVoice}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-300">Banned Terms (comma separated)</label>
                    <div className="mt-1">
                        <input
                            type="text"
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-slate-600 bg-slate-900 text-white rounded-md p-2 border"
                            placeholder="guaranteed admission, easy acceptance"
                            value={bannedTermsInput}
                            onChange={handleBannedTermsChange}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-300">Default Disclaimer</label>
                    <div className="mt-1">
                        <textarea
                            name="defaultDisclaimer"
                            rows={3}
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-slate-600 bg-slate-900 text-white rounded-md p-2 border"
                            placeholder="This content is for informational purposes only..."
                            value={guidelines.defaultDisclaimer}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-300">Default Links / Call to Action</label>
                    <div className="mt-1">
                        <textarea
                            name="defaultLinks"
                            rows={3}
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-slate-600 bg-slate-900 text-white rounded-md p-2 border"
                            placeholder="Book a consultation at..."
                            value={guidelines.defaultLinks}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Save Guidelines
                    </button>
                </div>
            </form>
        </div>
    );
};
