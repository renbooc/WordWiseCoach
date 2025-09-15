import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { BookOpen, Moon, Sun, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Header() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(savedTheme || (prefersDark ? "dark" : "light"));
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === "light" ? "dark" : "light");
  };

  const handleLogout = async () => {
    try {
      await logout();
      setLocation("/login");
    } catch (error) {
      // Handle or log the error if needed
      console.error("Logout failed", error);
    }
  };

  const [location] = useLocation();
  const isActive = (path: string) => {
    // Special case for dashboard
    if (path === "/dashboard" && location === "/") return true;
    if (path === "/dashboard" && location === "/dashboard") return true;
    if (path !== "/dashboard" && path !== "/" && location.startsWith(path)) return true;
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
            {user && (
              <nav className="hidden md:flex space-x-6">
                <Link 
                  href="/dashboard" 
                  className={`transition-colors ${isActive("/dashboard") ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}
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
            )}
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={toggleTheme} data-testid="button-theme-toggle">
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{user.email.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>注销</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="space-x-2">
                <Button variant="ghost" onClick={() => setLocation('/login')}>登录</Button>
                <Button onClick={() => setLocation('/signup')}>注册</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
