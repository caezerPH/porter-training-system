import React, { createContext, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { assertConfig } from "../config";
import { useSettings } from "../context/SettingsContext";
import { AccessibilityMenu } from "./AccessibilityMenu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock } from "lucide-react";

interface AuthCtx {
  user: User | null;
  role: string;
  isAdmin: boolean;
}
const AuthContext = createContext<AuthCtx>({ user: null, role: "user", isAdmin: false });
export const useAuth = () => useContext(AuthContext);

// Gates the whole app behind Supabase Auth and exposes the current user's role.
// Logins are created by an admin (in-app or via the Admin API) — no self-signup.
// RLS enforces what each role can read.
export const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const configError = assertConfig();
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (configError) {
      setChecking(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, [configError]);

  if (configError) {
    return (
      <Centered>
        <div className="max-w-md rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <h1 className="text-base font-bold text-red-900">Configuration error</h1>
          <p className="mt-2 text-sm text-red-700">{configError}</p>
        </div>
      </Centered>
    );
  }

  if (checking) {
    return (
      <Centered>
        <Loader2 className="h-6 w-6 animate-spin text-slate-400 dark:text-slate-500" />
      </Centered>
    );
  }

  if (!session) return <Login />;

  const user = session.user;
  const role = (user.app_metadata as Record<string, unknown>)?.role === "admin" ? "admin" : "user";
  return (
    <AuthContext.Provider value={{ user, role, isAdmin: role === "admin" }}>
      {children}
    </AuthContext.Provider>
  );
};

const Centered: React.FC<{ children: React.ReactNode; bgUrl?: string }> = ({ children, bgUrl }) => (
  <div
    className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 p-4 bg-cover bg-center"
    style={bgUrl ? { backgroundImage: `url(${bgUrl})` } : undefined}
  >
    {bgUrl && <div className="absolute inset-0 bg-slate-900/60" />}
    <div className="relative z-10 w-full flex items-center justify-center">{children}</div>
  </div>
);

const Login: React.FC = () => {
  const { resolved } = useSettings();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(error.message);
    // on success, onAuthStateChange swaps in the app
  };

  return (
    <Centered bgUrl={resolved.loginBgUrl}>
      <AccessibilityMenu />
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-7 shadow-xl"
      >
        <div className="mb-5 flex flex-col items-center text-center">
          {resolved.logoUrl ? (
            <img src={resolved.logoUrl} alt={resolved.clientName} className="mb-3 h-14 w-14 rounded-xl object-cover" />
          ) : (
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white shadow-md shadow-brand-500/20">
              <Lock className="h-5 w-5" />
            </div>
          )}
          <h1 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            {resolved.loginHeadline}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">{resolved.loginSubtext}</p>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
        </div>

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
            {error}
          </p>
        )}

        <Button type="submit" disabled={loading} className="mt-5 w-full bg-slate-900 hover:bg-slate-800">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
        </Button>
        <p className="mt-4 text-center text-[11px] text-slate-400 dark:text-slate-500">
          Access is managed by your administrator.
        </p>
      </form>
    </Centered>
  );
};
