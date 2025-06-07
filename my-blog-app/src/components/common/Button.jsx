import { forwardRef } from "react"
import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils"
import { Loader2 } from "lucide-react"

const buttonVariants = cva(
    "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
    {
        variants: {
            variant: {
                default: "bg-primary text-primary-foreground hover:bg-primary/90",
                destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                outline: "border border-input hover:bg-accent hover:text-accent-foreground",
                secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                ghost: "hover:bg-accent hover:text-accent-foreground",
                link: "underline-offset-4 hover:underline text-primary",
                success: "bg-green-500 text-white hover:bg-green-600",
                warning: "bg-yellow-500 text-white hover:bg-yellow-600",
                info: "bg-blue-500 text-white hover:bg-blue-600",
            },
            size: {
                default: "h-10 py-2 px-4",
                sm: "h-9 px-3 rounded-md",
                lg: "h-11 px-8 rounded-md",
                icon: "h-10 w-10",
                xl: "h-12 px-10 rounded-lg text-base",
            },
            animation: {
                none: "",
                bounce: "transform transition-transform hover:-translate-y-1",
                pulse: "hover:animate-pulse",
                wiggle: "hover:animate-wiggle",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
            animation: "none",
        },
    }
)

const Button = forwardRef(({
    className,
    children,
    variant,
    isLoading,
    size,
    animation,
    leftIcon,
    rightIcon,
    ...props
}, ref) => {
    return (
        <button
            className={cn(buttonVariants({ variant, size, animation, className }))}
            ref={ref}
            disabled={isLoading}
            {...props}
        >
            {isLoading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {typeof children === 'string' ? 'Loading...' : children}
                </>
            ) : (
                <>
                    {leftIcon && <span className="mr-2">{leftIcon}</span>}
                    {children}
                    {rightIcon && <span className="ml-2">{rightIcon}</span>}
                </>
            )}
        </button>
    )
})

Button.displayName = "Button"

export { Button, buttonVariants }
