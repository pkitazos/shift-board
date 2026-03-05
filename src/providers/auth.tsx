import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { db } from "@/lib/supabase";
import type { User } from "@/types";

interface AuthState {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    isAdmin: false,
    loading: true,
    error: null,
  });

  const loadUser = useCallback(async (session: Session) => {
    const email = session.user.email;
    if (!email) {
      await db.auth.signOut();
      setState((s) => ({
        ...s,
        session: null,
        user: null,
        isAdmin: false,
        loading: false,
        error: "No email found in session.",
      }));
      return;
    }

    const result = await db
      .from("users")
      .select("*")
      .eq("email", email)
      .single()
      .overrideTypes<User>();

    if (result.error || !result.data) {
      await db.auth.signOut();
      setState((s) => ({
        ...s,
        session: null,
        user: null,
        isAdmin: false,
        loading: false,
        error: "Your email is not authorized. Contact an admin.",
      }));
      return;
    }

    const user: User = { ...result.data };

    // Link auth_id on first login
    if (!user.auth_id) {
      await db
        .from("users")
        .update({
          auth_id: session.user.id,
          name: session.user.user_metadata?.full_name ?? user.name,
        })
        .eq("id", user.id);
      user.auth_id = session.user.id;
      user.name = session.user.user_metadata?.full_name ?? user.name;
    }

    setState({
      session,
      user,
      isAdmin: user.is_admin,
      loading: false,
      error: null,
    });
  }, []);

  useEffect(() => {
    db.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        loadUser(session);
      } else {
        setState((s) => ({ ...s, loading: false }));
      }
    });

    const {
      data: { subscription },
    } = db.auth.onAuthStateChange((_event, session) => {
      if (session) {
        loadUser(session);
      } else {
        setState({
          session: null,
          user: null,
          isAdmin: false,
          loading: false,
          error: null,
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [loadUser]);

  const signIn = useCallback(async () => {
    setState((s) => ({ ...s, error: null }));
    const { error } = await db.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      setState((s) => ({ ...s, error: error.message }));
    }
  }, []);

  const signOut = useCallback(async () => {
    await db.auth.signOut();
    setState({
      session: null,
      user: null,
      isAdmin: false,
      loading: false,
      error: null,
    });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
