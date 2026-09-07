"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getCurrentUser, login as requestLogin, logout as requestLogout, refreshSession, register as requestRegister, type AuthUser, type LoginInput, type RegisterInput } from "@/lib/api/auth";

type AuthContextValue={user:AuthUser|null;isLoading:boolean;isAuthenticated:boolean;error:string|null;login:(input:LoginInput)=>Promise<void>;register:(input:RegisterInput)=>Promise<void>;logout:()=>Promise<void>;refreshUser:()=>Promise<void>};
const AuthContext=createContext<AuthContextValue|undefined>(undefined);
const message=(error:unknown)=>error instanceof Error?error.message:"Something went wrong. Please try again.";

export function AuthProvider({children}:{children:ReactNode}) {
  const [user,setUser]=useState<AuthUser|null>(null);
  const [isLoading,setLoading]=useState(true);
  const [error,setError]=useState<string|null>(null);
  const restoreSession=async()=>{try { setUser(await getCurrentUser()); } catch { try { setUser(await refreshSession()); } catch { setUser(null); } }};

  useEffect(()=>{
    let active=true;
    const restore=async()=>{
      await restoreSession();
      if (active) setLoading(false);
    };
    void restore();
    return()=>{active=false;};
  },[]);

  const value=useMemo(()=>({
    user,isLoading,isAuthenticated:!!user,error,
    refreshUser:async()=>{setLoading(true);await restoreSession();setLoading(false);},
    login:async(input:LoginInput)=>{setError(null);setLoading(true);try{setUser(await requestLogin(input));}catch(e){setError(message(e));throw e;}finally{setLoading(false);}},
    register:async(input:RegisterInput)=>{setError(null);setLoading(true);try{setUser(await requestRegister(input));}catch(e){setError(message(e));throw e;}finally{setLoading(false);}},
    logout:async()=>{setLoading(true);try{await requestLogout();}finally{setUser(null);setLoading(false);}},
  }),[user,isLoading,error]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth(){const value=useContext(AuthContext);if(!value)throw new Error("useAuth must be used within AuthProvider");return value;}
