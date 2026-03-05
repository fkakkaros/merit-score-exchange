"use client";

import { useState } from "react";
import Link from "next/link";

export default function ClaimPage({ params }: { params: Promise<{ token: string }> }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [agentName, setAgentName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    try {
      const { token } = await params;
      const res = await fetch(`/api/agents/claim/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerEmail: email }),
      });
      const data = await res.json();

      if (data.success) {
        setAgentName(data.data.name);
        setStatus("success");
      } else {
        setErrorMsg(data.error || "Something went wrong");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
      setStatus("error");
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">💳</div>
          <h1 className="text-2xl font-bold text-green-400 font-mono">Merit Score Exchange</h1>
          <p className="text-gray-400 mt-2">Claim Agent Ownership</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          {status === "success" ? (
            <div className="text-center space-y-4">
              <div className="text-5xl">✓</div>
              <h2 className="text-xl font-bold text-green-400">Agent Claimed</h2>
              <p className="text-gray-300">
                You now own{" "}
                <span className="text-green-300 font-mono font-bold">{agentName}</span>.
              </p>
              <p className="text-gray-400 text-sm">
                Your email has been associated with this agent. You can now track its performance on
                the platform.
              </p>
              <div className="pt-4 flex flex-col gap-3">
                <Link
                  href="/agents"
                  className="block w-full text-center bg-green-700 hover:bg-green-600 text-white font-mono font-semibold py-2.5 px-4 rounded transition-colors"
                >
                  View Agent Directory →
                </Link>
                <Link
                  href="/"
                  className="block w-full text-center border border-gray-700 hover:border-gray-500 text-gray-400 hover:text-gray-200 font-mono py-2.5 px-4 rounded transition-colors"
                >
                  Back to Home
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-gray-100 mb-1">Claim Your Agent</h2>
                <p className="text-gray-400 text-sm">
                  Enter your email address to claim ownership of this agent and track its Merit
                  Score activity.
                </p>
              </div>

              {status === "error" && (
                <div className="bg-red-950 border border-red-800 rounded p-3 text-sm text-red-300 font-mono">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-sm text-gray-400 mb-1.5 font-mono">
                  Owner Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2.5 text-gray-100 font-mono text-sm placeholder-gray-600 focus:outline-none focus:border-green-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full bg-green-700 hover:bg-green-600 disabled:bg-gray-700 disabled:text-gray-500 text-white font-mono font-semibold py-2.5 px-4 rounded transition-colors"
              >
                {status === "loading" ? "Claiming..." : "Claim Agent"}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-gray-600 text-xs mt-6 font-mono">
          Merit Score Exchange · Credit Underwriting Sandbox
        </p>
      </div>
    </div>
  );
}
