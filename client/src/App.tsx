import { useState, useEffect } from "react";
import { Routes, Route, NavLink } from "react-router-dom";
import MonthlyDashboard from "./components/MonthlyDashboard";
import SavingsGoals from "./components/SavingsGoals";
import YearlyReview from "./components/YearlyReview";
import Login from "./components/Login";
import SettingsModal from "./components/SettingsModal";
import { apiFetch } from "./api";

function App() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [username, setUsername] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Check auth status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await apiFetch("/auth/me");
        const data = await response.json();
        setAuthenticated(data.authenticated);
        if (data.username) {
          setUsername(data.username);
        }
      } catch {
        setAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  const handleLogin = (user: string) => {
    setAuthenticated(true);
    setUsername(user);
  };

  const handleLogout = async () => {
    try {
      await apiFetch("/auth/logout", {
        method: "POST",
      });
    } catch {
      // Ignore errors
    }
    setAuthenticated(false);
    setUsername("");
  };

  // Loading state
  if (authenticated === null) {
    return (
      <div className="min-h-screen bg-ledger-bg flex items-center justify-center">
        <div className="text-ledger-accent">Loading...</div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!authenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-ledger-bg">
      {/* Navigation */}
      <nav className="border-b border-ledger-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center">
              <NavLink
                to="/"
                className="text-lg font-semibold tracking-tight text-ledger-text hover:text-ledger-accent transition-colors"
              >
                Finance GPT
              </NavLink>
            </div>
            <div className="flex items-center space-x-1">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `px-4 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "text-ledger-text bg-zinc-800"
                      : "text-ledger-accent hover:text-ledger-text hover:bg-zinc-800/50"
                  }`
                }
              >
                Monthly View
              </NavLink>
              <NavLink
                to="/savings"
                className={({ isActive }) =>
                  `px-4 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "text-ledger-text bg-zinc-800"
                      : "text-ledger-accent hover:text-ledger-text hover:bg-zinc-800/50"
                  }`
                }
              >
                Savings Goals
              </NavLink>
              <NavLink
                to="/yearly"
                className={({ isActive }) =>
                  `px-4 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "text-ledger-text bg-zinc-800"
                      : "text-ledger-accent hover:text-ledger-text hover:bg-zinc-800/50"
                  }`
                }
              >
                Yearly Review
              </NavLink>

              {/* Divider */}
              <div className="w-px h-6 bg-ledger-border mx-2" />

              {/* Settings Button */}
              <button
                onClick={() => setSettingsOpen(true)}
                className="p-2 text-ledger-accent hover:text-ledger-text hover:bg-zinc-800/50 transition-colors"
                title="Account Settings"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="p-2 text-ledger-accent hover:text-red-400 hover:bg-zinc-800/50 transition-colors"
                title="Sign Out"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Routes>
          <Route path="/" element={<MonthlyDashboard />} />
          <Route path="/savings" element={<SavingsGoals />} />
          <Route path="/yearly" element={<YearlyReview />} />
        </Routes>
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        currentUsername={username}
        onCredentialsChanged={setUsername}
      />
    </div>
  );
}

export default App;
