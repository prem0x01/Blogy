import { Moon, Sun } from "lucide-react"
import { Button } from "./Button"
import { useTheme } from "../../context/ThemeContext"

export function ThemeToggle() {
    const { theme, toggleTheme } = useTheme()

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="relative h-9 w-9"
        >
            <div className="relative h-5 w-5">
                <Sun 
                    className={`absolute h-5 w-5 text-black transition-all ${
                        theme === 'dark' ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
                    }`}
                />
                <Moon 
                    className={`absolute h-5 w-5 text-slate-900 transition-all ${
                        theme === 'light' ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
                    }`}
                />
            </div>
            <span className="sr-only">Toggle theme</span>
        </Button>
    )
}