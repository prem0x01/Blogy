import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import  api  from '../lib/api';
import {MarkdownEditor} from '../components/editor/MarkdownEditor';

export default function CreatePost() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Redirect if not logged in
    useEffect(() => {
        if (!user) {
            navigate('/login');
        }
    }, [user, navigate]);

    const handleSubmit = async (postData) => {
        setLoading(true);
        setError('');

        try {
            const response = await api.createPost(postData);
            navigate(`/post/${response.data.id}`);
        } catch (err) {
            setError(err.message || 'Failed to create post');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Top Navigation */}
            <motion.nav
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50
          border-b border-gray-100"
            >
                <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
                    {/* Back Button */}
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-gray-600 
              hover:text-gray-900 transition-colors duration-300"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round"
                                strokeWidth="1.5" d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                        <span className="text-sm">Back</span>
                    </button>

                    {/* Status */}
                    <div className="text-sm text-gray-500">
                        {loading ? 'Saving...' : 'Draft'}
                    </div>
                </div>
            </motion.nav>

            {/* Main Content */}
            <motion.main
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="pt-24 pb-16"
            >
                {/* Error Message */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="max-w-3xl mx-auto px-4 mb-8"
                        >
                            <div className="bg-red-50 text-red-500 px-4 py-3 rounded-lg 
                text-sm text-center"
                            >
                                {error}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Editor */}
                <MarkdownEditor onSubmit={handleSubmit} />

                {/* Writing Tips */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="fixed bottom-8 right-8 max-w-xs bg-white/80 
            backdrop-blur-md rounded-lg shadow-lg shadow-gray-100/20 p-4"
                >
                    <h3 className="text-sm font-medium text-gray-800 mb-2">
                        Writing Tips
                    </h3>
                    <ul className="text-sm text-gray-600 space-y-2">
                        <li className="flex items-center gap-2">
                            <span className="w-1 h-1 bg-gray-400 rounded-full" />
                            Use markdown for formatting
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="w-1 h-1 bg-gray-400 rounded-full" />
                            Preview your post before publishing
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="w-1 h-1 bg-gray-400 rounded-full" />
                            Keep titles concise and engaging
                        </li>
                    </ul>
                </motion.div>
            </motion.main>

            {/* Background Decorations */}
            <div className="fixed top-0 right-0 w-1/3 h-screen bg-gradient-to-l 
        from-gray-50 to-transparent opacity-60 pointer-events-none"/>
            <div className="fixed bottom-0 left-0 w-1/3 h-screen bg-gradient-to-r 
        from-gray-50 to-transparent opacity-60 pointer-events-none"/>
        </div>
    );
}
