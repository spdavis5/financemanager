import { useState, FormEvent } from "react";
import { apiFetch } from "../api";

interface LoginProps {
  onLogin: (username: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login failed");
        return;
      }

      onLogin(data.username);
    } catch (err) {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ledger-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-ledger-text">
            Finance GPT
          </h1>
          <p className="text-sm text-ledger-accent mt-2">
            Sign in to access your finances
          </p>
        </div>

        {/* Login Form */}
        <form
          onSubmit={handleSubmit}
          className="border border-ledger-border p-6 space-y-4"
        >
          {error && (
            <div className="bg-red-400/10 border border-red-400/30 text-red-400 px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="username"
              className="block text-xs uppercase tracking-wide text-ledger-accent mb-2"
            >
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-transparent border border-ledger-border px-3 py-2 text-sm focus:outline-none focus:border-ledger-accent"
              placeholder="Enter username"
              autoComplete="username"
              autoFocus
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs uppercase tracking-wide text-ledger-accent mb-2"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent border border-ledger-border px-3 py-2 text-sm focus:outline-none focus:border-ledger-accent"
              placeholder="Enter password"
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-zinc-800 hover:bg-zinc-700 text-ledger-text py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-xs text-ledger-accent mt-6">
          Protected financial data
        </p>
      </div>
    </div>
  );
}
