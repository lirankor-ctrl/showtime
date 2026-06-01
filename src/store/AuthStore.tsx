import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  displayName: string;
  loading: boolean;
  configured: boolean;
  /** True after a password-recovery link is opened — show the reset screen. */
  recovery: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ needsConfirm: boolean }>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  sendReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  clearRecovery: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Turn Supabase's English auth errors into clear Hebrew messages. */
export function translateAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login")) return "אימייל או סיסמה שגויים";
  if (m.includes("already registered") || m.includes("already been registered"))
    return "כתובת האימייל כבר רשומה";
  if (m.includes("email not confirmed")) return "יש לאמת את כתובת האימייל לפני ההתחברות";
  if (m.includes("at least 6")) return "הסיסמה חייבת להכיל לפחות 6 תווים";
  if (m.includes("unable to validate email")) return "כתובת אימייל לא תקינה";
  if (m.includes("rate limit") || m.includes("too many"))
    return "יותר מדי ניסיונות. נסו שוב בעוד מספר דקות.";
  if (m.includes("network") || m.includes("fetch")) return "בעיית תקשורת. בדקו את החיבור לאינטרנט.";
  return "אירעה שגיאה. נסו שוב.";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [recovery, setRecovery] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      setLoading(false);
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const user = session?.user ?? null;
  const displayName =
    (user?.user_metadata?.full_name as string | undefined) || user?.email || "";

  async function signUp(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw new Error(translateAuthError(error.message));
    // No session back => the project requires email confirmation.
    return { needsConfirm: !data.session };
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(translateAuthError(error.message));
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function sendReset(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) throw new Error(translateAuthError(error.message));
  }

  async function updatePassword(password: string) {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw new Error(translateAuthError(error.message));
    setRecovery(false);
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      displayName,
      loading,
      configured: isSupabaseConfigured,
      recovery,
      signUp,
      signIn,
      signOut,
      sendReset,
      updatePassword,
      clearRecovery: () => setRecovery(false),
    }),
    [session, user, displayName, loading, recovery],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
