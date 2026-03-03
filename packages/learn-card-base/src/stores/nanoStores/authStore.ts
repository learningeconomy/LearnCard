import { atom } from "nanostores";

interface AuthState {
  did: string | null;
}

// Initialize with null values - we'll update from localStorage on the client
const initialState: AuthState = { did: null };

export const auth = atom<AuthState>(initialState);

// Initialize auth state from localStorage on the client side
if (typeof window !== "undefined") {
  const did = window.localStorage.getItem("did");

  if (did) auth.set({ did });
}

export function setAuth(did: string) {
  if (typeof window !== "undefined") window.localStorage.setItem("did", did);

  auth.set({ did });
}

export function getDid() {
  return auth.get().did;
}

export function clearAuth() {
  if (typeof window !== "undefined") window.localStorage.removeItem("did");

  auth.set({ did: null });
}

export function isAuthenticated() {
  const state = auth.get();

  return Boolean(state.did);
}
