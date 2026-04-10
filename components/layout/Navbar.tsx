"use client";

import api from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";
import { Code2, LogOut, Plus, Search, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { NotificationBell } from "../notifications/NotificationBell";


export default function Navbar(){
    const router = useRouter();
    const {user,isLoggedIn,logout}=useAuthStore();
    const handleLogout=async()=>{
        try{
            await api.post("/auth/logout");
        }catch{
            //proceed even if API fails
        } finally{
            logout();
            router.push("/login");
            toast.success("Logged out successfully");
        }
    };
    return (
        <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">

            {/* Logo */}
            <Link href="/feed" className="flex items-center gap-2 font-bold text-xl">
            <Code2 className="h-6 w-6 text-primary" />
            <span>DevConnect</span>
            </Link>

            {/* Search */}
            <Link
            href="/search"
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full border bg-muted text-muted-foreground text-sm hover:bg-accent transition-colors w-64"
            >
            <Search className="h-4 w-4" />
            <span>Search projects, developers...</span>
            </Link>

            {/* Right side */}
            {isLoggedIn ? (
            <div className="flex items-center gap-2">
                {/* Post project button */}
                <Button size="sm" asChild>
                <Link href="/projects/create">
                    <Plus className="h-4 w-4 mr-1" />
                    Post Project
                </Link>
                </Button>

                {/* Notification Bell */}
                <NotificationBell />

                {/* User Dropdown */}
                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Avatar className="h-9 w-9 cursor-pointer">
                    <AvatarImage src={user?.avatar ?? ""} alt={user?.name} />
                    <AvatarFallback>
                        {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                    </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                    <Link href={`/users/${user?.id}`}>
                        <User className="mr-2 h-4 w-4" />
                        My Profile
                    </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                    </DropdownMenuItem>
                </DropdownMenuContent>
                </DropdownMenu>
            </div>
            ) : (
            <div className="flex items-center gap-2">
                <Button variant="ghost" asChild>
                <Link href="/login">Sign in</Link>
                </Button>
                <Button asChild>
                <Link href="/register">Sign up</Link>
                </Button>
            </div>
            )}
        </div>
        </nav>
    );
}