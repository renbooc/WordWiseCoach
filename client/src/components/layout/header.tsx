import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { BookOpen, Bell, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Header() {
  const [location] = useLocation();
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
    localStorage.setItem("theme", newTheme);
  };

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2" data-testid="link-home">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <BookOpen className="text-primary-foreground text-sm" />
              </div>
              <h1 className="text-xl font-bold text-foreground">智学单词</h1>
            </Link>
            <nav className="hidden md:flex space-x-6">
              <Link 
                href="/" 
                className={`transition-colors ${isActive("/") ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}
                data-testid="link-dashboard"
              >
                学习概况
              </Link>
              <Link 
                href="/study" 
                className={`transition-colors ${isActive("/study") ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}
                data-testid="link-study"
              >
                记单词
              </Link>
              <Link 
                href="/practice" 
                className={`transition-colors ${isActive("/practice") ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}
                data-testid="link-practice"
              >
                练单词
              </Link>
              <Link 
                href="/plan" 
                className={`transition-colors ${isActive("/plan") ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}
                data-testid="link-plan"
              >
                学习计划
              </Link>
              <Link 
                href="/wordbank" 
                className={`transition-colors ${isActive("/wordbank") ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}
                data-testid="link-wordbank"
              >
                单词库
              </Link>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" data-testid="button-notifications">
              <Bell className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleTheme} data-testid="button-theme-toggle">
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground text-sm font-medium">学</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
