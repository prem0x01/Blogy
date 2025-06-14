import { cn } from "../../lib/utils"

export function Loading({ className, size = "md" }) {
    const sizeClasses = {
        sm: "h-4 w-4",
        md: "h-8 w-8",
        lg: "h-12 w-12",
    }

    return (
        <div
            className={cn(
                "animate-spin rounded-full border-4 border-primary border-t-transparent",
                sizeClasses[size],
                className
            )}
        />
    )
}
