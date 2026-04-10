"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/authStore";
import { getSocket } from "@/lib/socket";
import api from "@/lib/axios";
import { Notification } from "@/types";


export function NotificationBell(){
    const {user}=useAuthStore();
    const [notifications,setNotifications]=useState<Notification[]>([]);
    const [loading,setLoading]=useState(true);
    const [open,setOpen]=useState(false);

    const unreadCount= notifications.filter((n)=>!n.read).length;
    useEffect(()=>{
        const fetchNotifications=async()=>{
            try{
                const res= await api.get("/notifications?limit=10");
                setNotifications(res.data.notifications);
            }catch{

            }finally{
                setLoading(false);
            }
        };
        fetchNotifications();
    },[]);
    useEffect(()=>{
        if(!user) return;
        const socket = getSocket();
        socket.on("notification",(notification:Notification)=>{
            setNotifications((prev)=>[notification,...prev]);
        });
        return ()=>{
            socket.off("notification");
        };
    },[user]);
    const markAllRead=async()=>{
        try{
            await api.patch("/notifications/read-all");
            setNotifications((prev)=>prev.map((n)=>({...n,read:true})));
        }catch{

        }
    };
    const getNotificationText = (n: Notification) => {
        switch (n.type) {
        case "LIKE": return `${n.actor.name} liked your project ${n.project?.title}`;
        case "COMMENT": return `${n.actor.name} commented on ${n.project?.title}`;
        case "FOLLOW": return `${n.actor.name} started following you`;
        case "REPLY": return `${n.actor.name} replied to your comment`;
        default: return "New notification";
        }
    };
    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                {unreadCount > 9 ? "9+" : unreadCount}
                </Badge>
            )}
            </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between px-3 py-2 border-b">
            <span className="font-semibold text-sm">Notifications</span>
            {unreadCount > 0 && (
                <button
                onClick={markAllRead}
                className="text-xs text-primary hover:underline"
                >
                Mark all read
                </button>
            )}
            </div>

            <div className="max-h-80 overflow-y-auto">
            {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-3 px-3 py-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-1 flex-1">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-20" />
                    </div>
                </div>
                ))
            ) : notifications.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                No notifications yet
                </p>
            ) : (
                notifications.map((n) => (
                <DropdownMenuItem
                    key={n.id}
                    className={`flex flex-col items-start px-3 py-3 cursor-pointer gap-1 ${
                    !n.read ? "bg-accent/50" : ""
                    }`}
                >
                    <p className="text-sm leading-snug">{getNotificationText(n)}</p>
                    <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </p>
                </DropdownMenuItem>
                ))
            )}
            </div>
        </DropdownMenuContent>
        </DropdownMenu>
    );
}