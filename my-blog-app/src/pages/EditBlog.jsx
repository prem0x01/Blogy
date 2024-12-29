import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { toast } from '../utils/toast';
import MarkdownEditor from '../components/editor/MarkdownEditor';

export default function EditBlog() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }

    const fetchBlog = async () => {
      try {
        const response = await api.get(`/blogs/${id}`);
        const blog = response.data;
        setTitle(blog.title);
        setContent(blog.content);
        setTags(blog.tags);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to fetch blog. Please try again.'
        });
      }
    };

    fetchBlog();
  }, [id, navigate, user]);

  const handleSave = async () => {
    if (!title || !content) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please fill in all fields.'
      });
      return;
    }

    setIsSaving(true);

    try {
      const response = await api.put(`/blogs/${id}`, {
        title,
        content,
        tags
      });

      toast({
        title: 'Success',
        description: 'Blog updated successfully.'
      });

      navigate(`/blog/${id}`);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update blog. Please try again.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTagChange = (newTags) => {
    setTags(newTags);
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-semibold">Edit Blog</h1>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium" htmlFor="title">
          Title
        </label>
        <input
          className="border p-2 rounded-md w-full"
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium" htmlFor="content">
          Content
        </label>
        <MarkdownEditor
          value={content}
          onChange={setContent}
          placeholder="Start writing..."
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium" htmlFor="tags">
          Tags
        </label>
        <input
          className="border p-2 rounded-md w-full"
          type="text"
          id="tags"
          value={tags.join(', ')}
          onChange={(e) => handleTagChange(e.target.value.split(',').map((t) => t.trim()))}
        />
      </div>

      <button
        className="bg-accent text-accent-foreground px-4 py-2 rounded-md"
        onClick={handleSave}
        disabled={isSaving}
      >
        {isSaving ? 'Saving...' : 'Save'}
      </button>
    </div>
  );
}
