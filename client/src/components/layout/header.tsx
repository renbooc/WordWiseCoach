import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { BookOpen, Moon, Sun, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth, User } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

// Navigation links component to avoid repetition
const MainNav = ({ className, onLinkClick }: { className?: string, onLinkClick?: () => void }) => {
  const [location] = useLocation();
  const isActive = (path: string) => {
    if (path === "/dashboard" && location === "/") return true;
    return location === path;
  };

  const navLinks = [
    { href: "/dashboard", label: "学习概况" },
    { href: "/study", label: "记单词" },
    { href: "/practice", label: "练单词" },
    { href: "/plan", label: "学习计划" },
    { href: "/wordbank", label: "单词库" },
  ];

  return (
    <nav
      className={cn("flex items-center space-x-4 lg:space-x-6", className)}
    >
      {navLinks.map(link => (
        <Link
          key={link.href}
          href={link.href}
          onClick={onLinkClick}
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            isActive(link.href) ? "text-primary" : "text-muted-foreground"
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
};

// Mobile navigation component using a Sheet
const MobileNav = ({ user }: { user: User | null }) => {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();

  const handleLinkClick = (path: string) => {
    setLocation(path);
    setOpen(false);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className="md:hidden transition-transform duration-150 ease-in-out active:scale-95"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="pr-0">
        <Link href="/" className="flex items-center space-x-2 mb-6" onClick={() => setOpen(false)}>
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <BookOpen className="text-primary-foreground text-sm" />
            </div>
            <h1 className="text-xl font-bold text-foreground">智学单词</h1>
        </Link>
        <div className="flex flex-col space-y-4">
          {user ? (
            <MainNav className="flex-col space-y-4 space-x-0 items-start" onLinkClick={() => setOpen(false)} />
          ) : (
            <div className="flex flex-col space-y-2">
              <Button variant="ghost" onClick={() => handleLinkClick('/login')} className="justify-start">登录</Button>
              <Button onClick={() => handleLinkClick('/signup')} className="justify-start">注册</Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

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
      console.error("Logout failed", error);
    }
  };

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center">
          {/* Left: Mobile Nav and Logo */}
          <div className="flex items-center">
            <MobileNav user={user} />
            <Link href="/" className="hidden md:flex items-center space-x-2 mr-6">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <BookOpen className="text-primary-foreground text-sm" />
              </div>
              <h1 className="text-xl font-bold text-foreground">智学单词</h1>
            </Link>
          </div>

          {/* Center: Desktop Navigation */}
          <div className="flex-1 flex items-center justify-center">
             {user && <MainNav />}
          </div>

          {/* Right: Theme Toggle and User Menu */}
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={toggleTheme} data-testid="button-theme-toggle" className="transition-transform duration-150 ease-in-out active:scale-95">
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full transition-transform duration-150 ease-in-out active:scale-95">
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
              <div className="hidden md:flex items-center space-x-2">
                <Button variant="ghost" onClick={() => setLocation('/login')} className="transition-transform duration-150 ease-in-out active:scale-95">登录</Button>
                <Button onClick={() => setLocation('/signup')} className="transition-transform duration-150 ease-in-out active:scale-95">注册</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
