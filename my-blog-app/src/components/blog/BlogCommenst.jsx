import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../common/Button'
import { Input } from '../common/Input'
import  Avatar  from '../common/Avatar'
import { formatDate } from '../../lib/utils'
import { Reply, ThumbsUp, MoreVertical, Edit, Trash2, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import MDEditor from '@uiw/react-md-editor'
import api from '../../lib/api'
import { toast } from 'react-hot-toast'

export function BlogComments({ postId }) {
    const [comments, setComments] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [replyTo, setReplyTo] = useState(null)
    const [editingComment, setEditingComment] = useState(null)
    const [newComment, setNewComment] = useState('')
    const { user } = useAuth()

    useEffect(() => {
        fetchComments()
    }, [postId])

    const fetchComments = async () => {
        try {
            const response = await api.get(`/posts/${postId}/comments`)
            setComments(response.data.comments)
        } catch (error) {
            toast.error('Failed to load comments')
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubmitComment = async (e) => {
        e.preventDefault()
        if (!newComment.trim()) return

        try {
            const response = await api.post(`/posts/${postId}/comments`, {
                content: newComment,
                parentId: replyTo?.id
            })

            if (replyTo) {
                // Add reply to existing comment
                setComments(prev => prev.map(comment =>
                    comment.id === replyTo.id
                        ? { ...comment, replies: [...(comment.replies || []), response.data] }
                        : comment
                ))
            } else {
                // Add new top-level comment
                setComments(prev => [response.data, ...prev])
            }

            setNewComment('')
            setReplyTo(null)
            toast.success('Comment posted successfully')
        } catch (error) {
            toast.error('Failed to post comment')
        }
    }

    const handleEditComment = async (commentId, newContent) => {
        try {
            const response = await api.put(`/posts/${postId}/comments/${commentId}`, {
                content: newContent
            })

            setComments(prev => prev.map(comment =>
                comment.id === commentId ? response.data : comment
            ))
            setEditingComment(null)
            toast.success('Comment updated successfully')
        } catch (error) {
            toast.error('Failed to update comment')
        }
    }

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm('Are you sure you want to delete this comment?')) return

        try {
            await api.delete(`/posts/${postId}/comments/${commentId}`)
            setComments(prev => prev.filter(comment => comment.id !== commentId))
            toast.success('Comment deleted successfully')
        } catch (error) {
            toast.error('Failed to delete comment')
        }
    }

    const handleLikeComment = async (commentId) => {
        try {
            const response = await api.post(`/posts/${postId}/comments/${commentId}/like`)
            setComments(prev => prev.map(comment =>
                comment.id === commentId
                    ? { ...comment, likes: response.data.likes, isLiked: response.data.isLiked }
                    : comment
            ))
        } catch (error) {
            toast.error('Failed to like comment')
        }
    }

    const Comment = ({ comment, isReply = false }) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`relative ${isReply ? 'ml-12' : 'border-t'} py-4`}
        >
            <div className="flex items-start space-x-4">
                <Avatar
                    src={comment.author.avatar}
                    alt={comment.author.name}
                    className="h-10 w-10"
                />
                <div className="flex-1">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <span className="font-medium">{comment.author.name}</span>
                            <span className="text-sm text-muted-foreground">
                                {formatDate(comment.createdAt)}
                            </span>
                            {comment.edited && (
                                <span className="text-xs text-muted-foreground">(edited)</span>
                            )}
                        </div>
                        {user?.id === comment.author.id && (
                            <div className="relative">
                                <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                                <div className="absolute right-0 top-full z-10 mt-1 w-32 rounded-md border bg-background shadow-lg">
                                    <Button
                                        variant="ghost"
                                        className="w-full justify-start"
                                        onClick={() => setEditingComment(comment.id)}
                                    >
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        className="w-full justify-start text-destructive"
                                        onClick={() => handleDeleteComment(comment.id)}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {editingComment === comment.id ? (
                        <div className="mt-2">
                            <MDEditor
                                value={comment.content}
                                onChange={value => handleEditComment(comment.id, value)}
                                preview="edit"
                                height={100}
                            />
                            <div className="mt-2 flex justify-end space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setEditingComment(null)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() => handleEditComment(comment.id, comment.content)}
                                >
                                    Save
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="mt-2 prose prose-sm max-w-none dark:prose-invert">
                            <MDEditor.Markdown source={comment.content} />
                        </div>
                    )}

                    <div className="mt-4 flex items-center space-x-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center space-x-1"
                            onClick={() => handleLikeComment(comment.id)}
                        >
                            <ThumbsUp
                                className={`h-4 w-4 ${comment.isLiked ? 'fill-primary' : ''}`}
                            />
                            <span>{comment.likes}</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center space-x-1"
                            onClick={() => setReplyTo(comment)}
                        >
                            <Reply className="h-4 w-4" />
                            <span>Reply</span>
                        </Button>
                    </div>

                    {comment.replies?.length > 0 && (
                        <div className="mt-4 space-y-4">
                            {comment.replies.map(reply => (
                                <Comment key={reply.id} comment={reply} isReply />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    )

    if (isLoading) {
        return <div className="flex justify-center py-8">Loading comments...</div>
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Comments ({comments.length})</h2>

            {user ? (
                <form onSubmit={handleSubmitComment} className="space-y-4">
                    {replyTo && (
                        <div className="flex items-center space-x-2 rounded-md bg-muted p-2">
                            <span className="text-sm">
                                Replying to {replyTo.author.name}
                            </span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setReplyTo(null)}
                            >
                                Cancel
                            </Button>
                        </div>
                    )}
                    <MDEditor
                        value={newComment}
                        onChange={setNewComment}
                        preview="edit"
                        height={150}
                    />
                    <Button type="submit" disabled={!newComment.trim()}>
                        Post Comment
                    </Button>
                </form>
            ) : (
                <div className="flex items-center space-x-2 rounded-md border p-4">
                    <AlertCircle className="h-5 w-5 text-muted-foreground" />
                    <span>Please log in to comment</span>
                </div>
            )}

            <AnimatePresence>
                <div className="space-y-6">
                    {comments.map(comment => (
                        <Comment key={comment.id} comment={comment} />
                    ))}
                </div>
            </AnimatePresence>
        </div>
    )
}
