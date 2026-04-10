import { disconnectSocket, getSocket } from "@/lib/socket";
import { useEffect } from "react"


export const useSocket = (userId:string|null)=>{
    useEffect(()=>{
        if(!userId) return;
        const socket=getSocket();
        return()=>{
            disconnectSocket();
        };
    },[userId]);
    return getSocket;
};