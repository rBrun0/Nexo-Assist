const REMEMBER_ME_STORAGE_KEY = "nexo_remember_me";

export function readRememberMePreference() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(REMEMBER_ME_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function writeRememberMePreference(value: boolean) {
  try {
    window.localStorage.setItem(
      REMEMBER_ME_STORAGE_KEY,
      value ? "true" : "false",
    );
  } catch {
    // Preferência local é best-effort; falha de storage não bloqueia o login.
  }
}
