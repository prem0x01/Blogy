import { useState, useEffect } from 'react'
import { useInView } from 'react-intersection-observer'
import { motion, AnimatePresence } from 'framer-motion'
import { BlogCard } from './BlogCard'
import { Loading } from '../common/Loading'
import api from '../../lib/api'

export function BlogList({
    initialPosts = [],
    category = null,
    tag = null,
    author = null,
    searchQuery = '',
    sortBy = 'latest'
}) {
    const [posts, setPosts] = useState(initialPosts)
    const [page, setPage] = useState(1)
    const [loading, setLoading] = useState(false)
    const [hasMore, setHasMore] = useState(true)
    const [error, setError] = useState(null)
    const { ref, inView } = useInView({
        threshold: 0,
        triggerOnce: false
    })

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    }

    useEffect(() => {
        const fetchPosts = async () => {
            if (!hasMore || loading) return

            setLoading(true)
            setError(null)

            try {
                const params = new URLSearchParams({
                    page,
                    limit: 10,
                    sortBy,
                    ...(category && { category }),
                    ...(tag && { tag }),
                    ...(author && { author }),
                    ...(searchQuery && { q: searchQuery })
                })

                const response = await api.get(`/posts?${params}`)
                const newPosts = response.data.posts

                if (page === 1) {
                    setPosts(newPosts)
                } else {
                    setPosts(prev => [...prev, ...newPosts])
                }

                setHasMore(newPosts.length === 10)
            } catch (err) {
                setError('Failed to load posts. Please try again later.')
            } finally {
                setLoading(false)
            }
        }

        if (inView) {
            setPage(prev => prev + 1)
            fetchPosts()
        }
    }, [inView, category, tag, author, searchQuery, sortBy])

    // Reset when filters change
    useEffect(() => {
        setPosts([])
        setPage(1)
        setHasMore(true)
    }, [category, tag, author, searchQuery, sortBy])

    if (error) {
        return (
            <div className="flex h-40 items-center justify-center text-destructive">
                {error}
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <AnimatePresence mode="wait">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                >
                    {posts.map((post, index) => (
                        <BlogCard
                            key={post.id}
                            post={post}
                            className={index >= posts.length - 3 ? 'opacity-0' : ''}
                        />
                    ))}
                </motion.div>
            </AnimatePresence>

            {/* Loading indicator */}
            {loading && (
                <div className="flex justify-center py-8">
                    <Loading />
                </div>
            )}

            {/* Infinite scroll trigger */}
            <div ref={ref} className="h-10" />

            {/* No posts message */}
            {!loading && posts.length === 0 && (
                <div className="flex h-40 items-center justify-center text-muted-foreground">
                    No posts found.
                </div>
            )}

            {/* End of posts message */}
            {!hasMore && posts.length > 0 && (
                <div className="text-center text-sm text-muted-foreground">
                    You've reached the end!
                </div>
            )}
        </div>
    )
}
