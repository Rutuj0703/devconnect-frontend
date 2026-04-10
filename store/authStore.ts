import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User{
    id:string;
    name: string;
    email: string;
    avatar: string | null;
    bio: string | null;
}

interface AuthState{
    user:User | null;
    accessToken: string | null;
    isLoggedIn: boolean;

    setUser: (user: User)=>void;
    setAccessToken: (token: string)=>void;
    login: (user: User,token: string)=>void;
    logout: ()=>void;
}

export const useAuthStore=create<AuthState>()(
    persist(
        (set)=>({
            user:null,
            accessToken:null,
            isLoggedIn:false,

            setUser: (user)=>set({user}),
            setAccessToken: (token)=> {
                localStorage.setItem("accessToken", token);
                set({accessToken:token});
            },
            login:(user,token)=>{
                localStorage.setItem("accessToken",token);
                set({user, accessToken:token, isLoggedIn:true});
            },
            logout:()=>{
                localStorage.removeItem("accessToken");
                set({user:null, accessToken:null, isLoggedIn:false});
            },
        }),
        {
            name: "auth-storage",
            partialize: (state)=>({
                user:state.user,
                accessToken: state.accessToken,
                isLoggedIn: state.isLoggedIn,
            }),
        }
    )
);