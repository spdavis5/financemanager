import { useState, FormEvent } from "react";
import { apiFetch } from "../api";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUsername: string;
  onCredentialsChanged: (newUsername: string) => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  currentUsername,
  onCredentialsChanged,
}: SettingsModalProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!currentPassword) {
      setError("Current password is required");
      return;
    }

    if (!newUsername && !newPassword) {
      setError("Enter a new username or password to change");
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (newPassword && newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const response = await apiFetch("/auth/change-credentials", {
        method: "POST",
        body: JSON.stringify({
          currentPassword,
          newUsername: newUsername || undefined,
          newPassword: newPassword || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to update credentials");
        return;
      }

      setSuccess("Credentials updated successfully!");
      setCurrentPassword("");
      setNewUsername("");
      setNewPassword("");
      setConfirmPassword("");

      if (data.username) {
        onCredentialsChanged(data.username);
      }

      // Close modal after success
      setTimeout(() => {
        onClose();
        setSuccess("");
      }, 1500);
    } catch (err) {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentPassword("");
    setNewUsername("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setSuccess("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" onClick={handleClose} />

      {/* Modal */}
      <div className="relative bg-ledger-bg border border-ledger-border w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ledger-border px-4 py-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide">
            Account Settings
          </h2>
          <button
            onClick={handleClose}
            className="text-ledger-accent hover:text-ledger-text transition-colors"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="text-xs text-ledger-accent mb-4">
            Logged in as:{" "}
            <span className="text-ledger-text">{currentUsername}</span>
          </div>

          {error && (
            <div className="bg-red-400/10 border border-red-400/30 text-red-400 px-3 py-2 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-400/10 border border-green-400/30 text-green-400 px-3 py-2 text-sm">
              {success}
            </div>
          )}

          {/* Current Password (always required) */}
          <div>
            <label
              htmlFor="currentPassword"
              className="block text-xs uppercase tracking-wide text-ledger-accent mb-2"
            >
              Current Password *
            </label>
            <input
              type="password"
              id="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-transparent border border-ledger-border px-3 py-2 text-sm focus:outline-none focus:border-ledger-accent"
              placeholder="Enter current password"
              autoComplete="current-password"
            />
          </div>

          <div className="border-t border-ledger-border pt-4">
            <p className="text-xs text-ledger-accent mb-4">
              Leave fields blank to keep current value
            </p>
          </div>

          {/* New Username */}
          <div>
            <label
              htmlFor="newUsername"
              className="block text-xs uppercase tracking-wide text-ledger-accent mb-2"
            >
              New Username
            </label>
            <input
              type="text"
              id="newUsername"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="w-full bg-transparent border border-ledger-border px-3 py-2 text-sm focus:outline-none focus:border-ledger-accent"
              placeholder="Enter new username"
              autoComplete="username"
            />
          </div>

          {/* New Password */}
          <div>
            <label
              htmlFor="newPassword"
              className="block text-xs uppercase tracking-wide text-ledger-accent mb-2"
            >
              New Password
            </label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-transparent border border-ledger-border px-3 py-2 text-sm focus:outline-none focus:border-ledger-accent"
              placeholder="Enter new password (min 6 characters)"
              autoComplete="new-password"
            />
          </div>

          {/* Confirm New Password */}
          {newPassword && (
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-xs uppercase tracking-wide text-ledger-accent mb-2"
              >
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-transparent border border-ledger-border px-3 py-2 text-sm focus:outline-none focus:border-ledger-accent"
                placeholder="Confirm new password"
                autoComplete="new-password"
              />
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 border border-ledger-border py-2 text-sm font-medium text-ledger-accent hover:text-ledger-text hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-ledger-text py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
