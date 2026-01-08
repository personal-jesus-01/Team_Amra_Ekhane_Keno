import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import Logo from "./logo";
import {
  Grid,
  FileText,
  Users,
  Mic,
  CreditCard,
  Settings,
  Zap,
  LogOut,
  CodeXml,
  FileSearch,
  Menu,
  X,
  Presentation,
  BarChart3,
  Share2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    {
      name: "Dashboard",
      href: "/",
      icon: Grid,
    },
    {
      name: "My Presentations",
      href: "/presentations",
      icon: FileText,
    },
    {
      name: "Analytics",
      href: "/analytics",
      icon: BarChart3,
    },
    {
      name: "Collaboration",
      href: "/collaboration",
      icon: Share2,
    },
    {
      name: "Presentation Coach",
      href: "/coach",
      icon: Mic,
    },
    {
      name: "Subscription",
      href: "/subscription",
      icon: CreditCard,
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
    },
  ];

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const userInitials = user?.name
    ? `${user.name.split(" ")[0][0]}${
        user.name.split(" ")[1]?.[0] || user.name.split(" ")[0][1]
      }`
    : user?.username?.substring(0, 2).toUpperCase() || "U";

  const NavigationItems = () => (
    <>
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map((item, index) => (
          <Link
            key={item.name}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center px-3 py-3 text-sm font-medium rounded-lg smooth-transition group relative overflow-hidden z-10",
              "hover:scale-105 active:scale-95 focus-ring cursor-pointer",
              location === item.href
                ? "bg-indigo-600 text-white shadow-lg animate-pulse-glow"
                : "text-gray-300 hover:bg-gray-700/50 hover:text-white hover:shadow-md"
            )}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {/* Background shimmer effect */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"></div>
            
            <item.icon
              className={cn(
                "mr-3 h-5 w-5 smooth-transition",
                location === item.href
                  ? "text-white"
                  : "text-gray-400 group-hover:text-white group-hover:scale-105"
              )}
            />
            <span className="relative z-10">{item.name}</span>
          </Link>
        ))}
      </nav>

      <div className="p-4 mt-auto animate-slide-up">
        <div className="flex items-center mb-4 p-2 rounded-lg hover:bg-gray-800/30 smooth-transition group">
          <Avatar className="h-10 w-10 bg-indigo-600 text-white smooth-transition group-hover:scale-105">
            <AvatarFallback>{userInitials}</AvatarFallback>
          </Avatar>
          <div className="ml-3">
            <p className="text-sm font-medium text-white smooth-transition group-hover:text-indigo-300">
              {user?.name || user?.username}
            </p>
            <p className="text-xs text-gray-400 smooth-transition group-hover:text-gray-300">{user?.email}</p>
          </div>
        </div>

        {user?.subscription_type !== "pro" && (
          <div className="bg-gray-800/50 p-4 rounded-lg mb-4 border border-gray-700 card-interactive hover-lift animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Zap className="h-5 w-5 text-indigo-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white smooth-transition hover:text-indigo-300">
                  Upgrade to Pro
                </p>
                <p className="text-xs text-gray-400 smooth-transition hover:text-gray-300">
                  Get unlimited presentations
                </p>
              </div>
            </div>
            <Button
              className="mt-3 w-full bg-indigo-600 hover:bg-indigo-700 btn-primary focus-ring"
              size="sm"
              asChild
            >
              <Link href="/subscription">Upgrade Now</Link>
            </Button>
          </div>
        )}

        <Button
          variant="outline"
          className="w-full justify-start text-gray-300 border-gray-600 hover:bg-gray-700 hover:text-white smooth-transition hover:scale-[1.02] active:scale-95 focus-ring animate-slide-up"
          onClick={handleLogout}
          style={{ animationDelay: '0.2s' }}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign out
        </Button>
      </div>
    </>
  );

  // Mobile menu
  const MobileNavigation = () => (
    <div className="lg:hidden">
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="mr-2">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0 bg-gray-900 border-gray-700">
          <div className="flex h-16 shrink-0 items-center px-4 border-b border-gray-700">
            <Logo />
          </div>
          <div className="flex flex-col h-[calc(100vh-4rem)] overflow-y-auto sidebar-nav">
            <NavigationItems />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );

  return (
    <>
      {/* Mobile Navigation */}
      <MobileNavigation />
      
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0 h-full relative z-20">
        <div className="flex flex-col w-64 border-r border-gray-700 bg-gray-900">
          <div className="flex flex-col h-full">
            <div className="flex items-center h-16 flex-shrink-0 px-4 border-b border-gray-700">
              <Logo />
            </div>
            <div className="flex-1 flex flex-col overflow-y-auto sidebar-nav">
              <NavigationItems />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
