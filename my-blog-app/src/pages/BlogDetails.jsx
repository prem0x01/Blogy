import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import CommentSection from '../components/CommentSection';

export default function BlogPost() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      const response = await api.getPost(id);
      setPost(response.data);
    } catch (err) {
      setError('Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.deletePost(id);
      navigate('/');
    } catch (err) {
      setError('Failed to delete post');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-800 rounded-full 
          animate-spin border-t-transparent"/>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="text-sm px-6 py-2 bg-gray-900 text-white rounded-full
              hover:bg-black transition-colors duration-300"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50
          border-b border-gray-100"
      >
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-600 
              hover:text-gray-900 transition-colors duration-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" 
              viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" 
                strokeWidth="1.5" d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            <span className="text-sm">Back</span>
          </button>

          {user?.id === post?.author_id && (
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(`/edit/${post.id}`)}
                className="text-sm text-gray-600 hover:text-gray-900 
                  transition-colors duration-300"
              >
                Edit
              </button>
              <button
                onClick={() => setDeleteModal(true)}
                className="text-sm text-red-500 hover:text-red-600 
                  transition-colors duration-300"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </motion.nav>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 pt-24 pb-16">
        <article className="prose prose-gray max-w-none">
          {/* Author Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex items-center gap-4"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br 
              from-gray-700 to-gray-900 flex items-center justify-center 
              text-white text-sm"
            >
              {post.author?.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-gray-800 font-medium">
                {post.author?.username}
              </p>
              <p className="text-sm text-gray-500">
                {new Date(post.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </motion.div>

          {/* Post Content */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-3xl font-light text-gray-900 mb-8">
              {post.title}
            </h1>
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </motion.div>
        </article>

        {/* Comments Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-16"
        >
          <CommentSection postId={id} />
        </motion.div>
      </main>

      {/* Delete Modal */}
      <AnimatePresence>
        {deleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 
              flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-lg p-6 max-w-sm w-full"
            >
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Delete Post
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this post? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setDeleteModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900
                    transition-colors duration-300"
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg
                    hover:bg-red-600 transition-colors duration-300
                    disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}