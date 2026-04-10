import {io,Socket} from "socket.io-client";

let socket: Socket | null= null;

export const getSocket=(): Socket=>{
    if(!socket){
        const token = localStorage.getItem("accessToken");
        socket=  io(process.env.NEXT_PUBLIC_SOCKET_URL!,{
            auth:{token},
            reconnection:true,
            reconnectionAttempts:5,
            reconnectionDelay:1000,
        });
        socket.on("connect",()=>{
            console.log("Socket connected: ",socket?.id);
        });
        socket.on("disconnect",(reason)=>{
            console.log("Socket disconnected: ",reason);
        });
        socket.on("connect_error",(err)=>{
            console.log("Socket connection error: ",err.message);
        });
    }
    return socket;
};

export const disconnectSocket=()=>{
    if(socket){
        socket.disconnect();
        socket=null;
    }
};