'use client';
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";

type Theme = "light" | "dark";

function getTheme(): Theme {
  if (typeof document === "undefined") {
    return "light";
  }

  const theme = document.documentElement.dataset.theme;
  if (theme === "light" || theme === "dark") {
    return theme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function subscribeToTheme(onThemeChange: () => void): () => void {
  window.addEventListener("theme-change", onThemeChange);
  return () => window.removeEventListener("theme-change", onThemeChange);
}

export default function Navbar() {
  const [islogin, setislogin] = useState(false);
  const [lang, setLang] = useState("en");
  const theme = useSyncExternalStore(subscribeToTheme, getTheme, () => "light");
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const initialTheme = savedTheme === "dark" || savedTheme === "light"
      ? savedTheme
      : window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    document.documentElement.dataset.theme = initialTheme;
    window.dispatchEvent(new Event("theme-change"));

    const checkAuth = () => {
      const token = localStorage.getItem("token");
      setislogin(token != null);
    };

    // Check on initial load
    checkAuth();

    // Listen for custom auth events when login/logout happens
    window.addEventListener("auth-change", checkAuth);
    window.addEventListener("storage", checkAuth); // Handles changes across tabs

    return () => {
      window.removeEventListener("auth-change", checkAuth);
      window.removeEventListener("storage", checkAuth);
    };
  }, []);
  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem("theme", nextTheme);
    window.dispatchEvent(new Event("theme-change"));
  };
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("expiration");
    localStorage.removeItem("userType");
    setislogin(false);
  }
  const handleToggle = () => {
    if (islogin) {
      return <Link href="/login" className="hover:text-blue-600 transition-colors"
        onClick={() => { handleLogout() }}>
        Logout
      </Link>
    } else {
      return <Link href="/login" className="hover:text-blue-600 transition-colors">Login</Link>
    }
  }
  const handleLangChange = () => {
    const newLang = lang === "en" ? "ar" : "en";
    setLang(newLang);
    if (typeof window !== "undefined") {
      document.documentElement.lang = newLang;
      document.documentElement.dir = newLang === "ar" ? "rtl" : "ltr";
    }
  };

  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-900 shadow-md border-b border-gray-100 dark:border-slate-800">
      <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
        <Link href="/" className="hover:text-blue-600 transition-colors">
          School Evaluations</Link>
      </div>
      <div className="flex items-center gap-4 sm:gap-6 font-medium text-gray-600 dark:text-gray-300">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          aria-pressed={theme === "dark"}
          className="rounded-lg border border-gray-200 dark:border-slate-700 px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
        >
          {theme === "light" ? "Dark mode" : "Light mode"}
        </button>
        {handleToggle()}

        <Link href="/about" className="hover:text-blue-600 transition-colors">About</Link>
        <button
          onClick={handleLangChange}
          className="px-3 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          aria-label="Change language"
        >
          {lang === "en" ? "العربية" : "English"}
        </button>
      </div>
    </nav>
  )
}
