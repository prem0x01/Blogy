import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Clock, Eye, MessageCircle } from 'lucide-react'
import { LikeButton } from './LikeButton'
import { TagList } from './TagList'
import { formatDate } from '../../lib/utils'

export function BlogCard({ post, className }) {
    const [isHovered, setIsHovered] = useState(false)

    const cardVariants = {
        initial: { y: 20, opacity: 0 },
        animate: { y: 0, opacity: 1 },
        hover: { y: -5, transition: { duration: 0.2 } }
    }

    return (
        <motion.article
            className={`group relative overflow-hidden rounded-lg border bg-card p-5 transition-shadow hover:shadow-lg ${className}`}
            variants={cardVariants}
            initial="initial"
            animate="animate"
            whileHover="hover"
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
        >
            {/* Image */}
            <div className="relative aspect-video overflow-hidden rounded-md">
                <img
                    src={post.coverImage || '/placeholder.jpg'}
                    alt={post.title}
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {post.premium && (
                    <span className="absolute right-2 top-2 rounded-full bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
                        Premium
                    </span>
                )}
            </div>

            {/* Content */}
            <div className="mt-4 space-y-2">
                <div className="flex items-center space-x-2">
                    <Link to={`/profile/${post.author.username}`} className="flex items-center">
                        <img
                            src={post.author.avatar}
                            alt={post.author.name}
                            className="h-6 w-6 rounded-full"
                        />
                        <span className="ml-2 text-sm font-medium text-muted-foreground">
                            {post.author.name}
                        </span>
                    </Link>
                    <span className="text-muted-foreground">•</span>
                    <time className="text-sm text-muted-foreground" dateTime={post.createdAt}>
                        {formatDate(post.createdAt)}
                    </time>
                </div>

                <Link to={`/blog/${post.slug}`}>
                    <h2 className="line-clamp-2 text-xl font-semibold tracking-tight hover:underline">
                        {post.title}
                    </h2>
                </Link>

                <p className="line-clamp-3 text-sm text-muted-foreground">
                    {post.excerpt}
                </p>

                <TagList tags={post.tags} className="mt-4" />

                <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center">
                            <Clock className="mr-1 h-4 w-4" />
                            <span>{post.readingTime} min read</span>
                        </div>
                        <div className="flex items-center">
                            <Eye className="mr-1 h-4 w-4" />
                            <span>{post.views} views</span>
                        </div>
                        <div className="flex items-center">
                            <MessageCircle className="mr-1 h-4 w-4" />
                            <span>{post.commentsCount} comments</span>
                        </div>
                    </div>

                    <LikeButton
                        postId={post.id}
                        initialLikes={post.likes}
                        initialLiked={post.isLiked}
                    />
                </div>
            </div>

            {/* Hover overlay with quick actions */}
            {isHovered && (
                <motion.div
                    className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <div className="flex space-x-2">
                        <Link
                            to={`/blog/${post.slug}`}
                            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                        >
                            Read More
                        </Link>
                        {post.isAuthor && (
                            <Link
                                to={`/edit/${post.slug}`}
                                className="rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/90"
                            >
                                Edit
                            </Link>
                        )}
                    </div>
                </motion.div>
            )}
        </motion.article>
    )
}
