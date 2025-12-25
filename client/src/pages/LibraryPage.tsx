import { useEffect, useState } from 'react';
import api from '../services/api';
import { Link } from 'react-router-dom';
import type { StoryProject } from '../types';

export const LibraryPage = () => {
    const [stories, setStories] = useState<StoryProject[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    useEffect(() => {
        fetchStories();
    }, []);

    const fetchStories = async () => {
        try {
            const res = await api.get('/stories');
            setStories(res.data);
        } catch (error) {
            console.error('Failed to fetch stories', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this story?')) return;
        try {
            await api.delete(`/stories/${id}`);
            setStories(stories.filter(s => s._id !== id));
        } catch (error) {
            console.error('Failed to delete story', error);
        }
    };

    const handleDuplicate = async (id: string) => {
        try {
            const res = await api.post(`/stories/${id}/duplicate`);
            setStories([res.data, ...stories]);
        } catch (error) {
            console.error('Failed to duplicate story', error);
            alert('Failed to duplicate story.');
        }
    };

    const filteredStories = stories.filter(story => {
        const matchesSearch = story.inputs.topic.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || story.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    if (loading) return <div className="p-8 text-white">Loading library...</div>;

    return (
        <div className="max-w-7xl mx-auto p-8 bg-slate-900 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 space-y-4 md:space-y-0">
                <div>
                    <h1 className="text-3xl font-bold text-white">Story Library</h1>
                    <p className="text-slate-400 mt-1">Manage all your generated admissions stories.</p>
                </div>
                <Link to="/studio/new" className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition font-medium shadow-sm">
                    + New Story
                </Link>
            </div>

            {/* Filters */}
            <div className="bg-slate-800 p-4 rounded-xl shadow-sm mb-6 flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 border border-slate-700">
                <div className="flex-1 relative">
                    <input
                        type="text"
                        placeholder="Search by topic..."
                        className="w-full pl-4 pr-4 py-2 border border-slate-600 bg-slate-900 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="w-full md:w-48">
                    <select
                        className="w-full px-4 py-2 border border-slate-600 bg-slate-900 text-white rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="All">All Statuses</option>
                        <option value="Draft">Draft</option>
                        <option value="Saved">Saved</option>
                        <option value="Archived">Archived</option>
                    </select>
                </div>
            </div>

            <div className="bg-slate-800 shadow-sm border border-slate-700 overflow-hidden rounded-xl">
                <ul className="divide-y divide-slate-700">
                    {filteredStories.length === 0 ? (
                        <li className="p-12 text-center">
                            <div className="text-slate-500 mb-2">
                                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                            <p className="text-slate-500">No stories found matching your criteria.</p>
                        </li>
                    ) : filteredStories.map((story) => (
                        <li key={story._id} className="block hover:bg-slate-700/50 transition">
                            <div className="px-6 py-5">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 truncate pr-4">
                                        <Link to={`/studio/${story._id}`} className="block">
                                            <div className="flex items-center space-x-3">
                                                <p className="text-lg font-semibold text-indigo-400 truncate">{story.inputs.topic}</p>
                                                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${story.status === 'Draft' ? 'bg-slate-700 text-slate-300' :
                                                    story.status === 'Archived' ? 'bg-red-900/20 text-red-400' :
                                                        'bg-green-900/20 text-green-400'
                                                    }`}>
                                                    {story.status}
                                                </span>
                                            </div>
                                            <div className="mt-2 text-sm text-slate-400 flex items-center space-x-4">
                                                <span className="flex items-center">
                                                    <span className="w-2 h-2 rounded-full bg-indigo-400 mr-2"></span>
                                                    {story.inputs.storyType}
                                                </span>
                                                <span>•</span>
                                                <span>{story.inputs.platform}</span>
                                                <span>•</span>
                                                <span>{story.inputs.length}</span>
                                            </div>
                                            <p className="mt-2 text-xs text-slate-500">
                                                Updated {story.updatedAt ? new Date(story.updatedAt).toLocaleDateString() : 'N/A'}
                                            </p>
                                        </Link>
                                    </div>
                                    <div className="flex space-x-4 items-center">
                                        <button
                                            onClick={() => handleDuplicate(story._id!)}
                                            className="text-slate-500 hover:text-indigo-400 text-sm font-medium transition"
                                        >
                                            Duplicate
                                        </button>
                                        <button
                                            onClick={() => handleDelete(story._id!)}
                                            className="text-slate-500 hover:text-red-400 text-sm font-medium transition"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};
