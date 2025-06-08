import { useState, useEffect } from 'react'
import { ScrollArea } from '../common/Scroll-area'
import { Alert, AlertDescription } from '../blog/Alert'
import { ExternalLink, AlertTriangle } from 'lucide-react'

export function Preview({
    content = '',
    className = '',
    onImageLoad,
    sanitize = true
}) {
    const [renderedContent, setRenderedContent] = useState('')
    const [error, setError] = useState(null)

    // Basic markdown parsing functions
    const parseMarkdown = (text) => {
        try {
            // Replace headers
            let parsed = text
                .replace(/^### (.*$)/gm, '<h3>$1</h3>')
                .replace(/^## (.*$)/gm, '<h2>$1</h2>')
                .replace(/^# (.*$)/gm, '<h1>$1</h1>')

            // Replace bold and italic
            parsed = parsed
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/\_\_(.*?)\_\_/g, '<strong>$1</strong>')
                .replace(/\_(.*?)\_/g, '<em>$1</em>')

            // Replace code blocks and inline code
            parsed = parsed
                .replace(/```(.*?)\n(.*?)```/gs, '<pre><code>$2</code></pre>')
                .replace(/`([^`]+)`/g, '<code>$1</code>')

            // Replace lists
            parsed = parsed
                .replace(/^\s*\d+\.\s+(.*$)/gm, '<li>$1</li>')
                .replace(/^\s*[-*]\s+(.*$)/gm, '<li>$1</li>')

            // Wrap lists
            parsed = parsed
                .replace(/((<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>')

            // Replace links and images
            parsed = parsed
                .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
                .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" onError="this.style.display=\'none\'" />')

            // Replace blockquotes
            parsed = parsed
                .replace(/^\> (.*$)/gm, '<blockquote>$1</blockquote>')

            // Replace paragraphs
            parsed = parsed
                .replace(/\n\n([^<].*)\n/g, '<p>$1</p>')
                .replace(/^([^<].*)\n/g, '<p>$1</p>')

            return parsed
        } catch (err) {
            setError('Error parsing markdown content')
            return text
        }
    }

    useEffect(() => {
        const parsed = parseMarkdown(content)
        setRenderedContent(parsed)
    }, [content])

    return (
        <div className={`relative ${className}`}>
            <ScrollArea className="h-full">
                {error && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <div
                    className="prose prose-sm dark:prose-invert max-w-none p-4"
                    dangerouslySetInnerHTML={{ __html: renderedContent }}
                />
            </ScrollArea>

            <style jsx global>{`
        .prose {
          max-width: 100%;
        }
        .prose img {
          margin: 1rem 0;
          border-radius: 0.5rem;
          max-width: 100%;
          height: auto;
        }
        .prose pre {
          background-color: hsl(var(--muted));
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
        }
        .prose code {
          background-color: hsl(var(--muted));
          padding: 0.2rem 0.4rem;
          border-radius: 0.25rem;
          font-size: 0.875em;
        }
        .prose blockquote {
          border-left: 4px solid hsl(var(--border));
          padding-left: 1rem;
          font-style: italic;
          margin: 1rem 0;
        }
        .prose a {
          color: hsl(var(--primary));
          text-decoration: underline;
          text-decoration-thickness: 1px;
        }
        .prose ul {
          list-style-type: disc;
          padding-left: 1.5rem;
        }
        .prose ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
        }
        .prose h1, .prose h2, .prose h3 {
          margin-top: 2rem;
          margin-bottom: 1rem;
          font-weight: 600;
        }
      `}</style>
        </div>
    )
}

// Optional wrapper with fullscreen capability
export function PreviewWithFullscreen({ content, ...props }) {
    const [isFullscreen, setIsFullscreen] = useState(false)

    return (
        <div className="relative">
            {isFullscreen ? (
                <div className="fixed inset-0 z-50 bg-background p-4">
                    <div className="flex h-full flex-col">
                        <div className="flex justify-end pb-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsFullscreen(false)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <Preview content={content} className="flex-1" {...props} />
                    </div>
                </div>
            ) : (
                <div className="relative">
                    <Preview content={content} {...props} />
                    <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-2"
                        onClick={() => setIsFullscreen(true)}
                    >
                        <Maximize2 className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    )
}
