"use client";

import { useState, useEffect } from "react";
import { fetchApi } from "@/lib/api";

export default function ScraperPage() {
    const [accounts, setAccounts] = useState<{ username: string }[]>([]);
    const [selectedUsername, setSelectedUsername] = useState("");
    const [jobs, setJobs] = useState<any[]>([]);
    const [minScore, setMinScore] = useState(75);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const isScraping = jobs.some(j => j.status === 'running' || j.status === 'pending' || j.status === 'started');

    // Initialize data
    const refreshData = async () => {
        try {
            const accs = await fetchApi("/settings/instagram");
            setAccounts(accs || []);
            const jobHistory = await fetchApi("/jobs");
            setJobs(jobHistory || []);
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        refreshData();
        const interval = setInterval(refreshData, 5000); // Polling for job status
        return () => clearInterval(interval);
    }, []);

    const handleScrape = async () => {
        if (!selectedUsername) return;
        setLoading(true);
        setMessage("");
        try {
            await fetchApi("/jobs/scrape", {
                method: "POST",
                body: JSON.stringify({ instagram_username: selectedUsername, min_ai_score: minScore })
            });
            setMessage("Scrape job started!");
            refreshData();
        } catch (e: any) {
            setMessage(`Error: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 max-w-4xl pb-10">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Autopilot Scraper</h1>
                    <p className="text-[var(--color-text-secondary)] mt-2">Trigger AI-powered scans on your connected accounts.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Control Panel */}
                <div className="md:col-span-1 card h-fit space-y-6">
                    <h3 className="text-lg font-bold">New Scan</h3>

                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase">Target Account</label>
                            <select
                                className="input"
                                value={selectedUsername}
                                onChange={(e) => setSelectedUsername(e.target.value)}
                            >
                                <option value="">Select an account...</option>
                                {accounts.map(a => <option key={a.username} value={a.username}>@{a.username}</option>)}
                            </select>
                            {accounts.length === 0 && (
                                <p className="text-[10px] text-orange-400 mt-1">No accounts added in Settings yet.</p>
                            )}
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase">Min AI Score ({minScore})</label>
                            <input
                                type="range"
                                className="w-full accent-[var(--color-primary)]"
                                value={minScore}
                                onChange={(e) => setMinScore(Number(e.target.value))}
                                min={0} max={100}
                            />
                        </div>
                    </div>

                    <button
                        className={`w-full justify-center font-bold py-3 rounded-xl transition-all ${isScraping ? 'bg-blue-500/10 text-blue-500 border border-blue-500/50 cursor-not-allowed animate-pulse' : 'btn-primary'}`}
                        onClick={handleScrape}
                        disabled={loading || !selectedUsername || isScraping}
                    >
                        {loading ? "Initializing..." : isScraping ? "🧠 AI is Scanning... Please Wait" : "Run Autopilot Scan"}
                    </button>

                    {message && !isScraping && (
                        <p className={`text-xs text-center ${message.includes('Error') ? 'text-red-500' : 'text-[var(--color-primary)]'}`}>
                            {message}
                        </p>
                    )}
                </div>

                {/* Job History */}
                <div className="md:col-span-2 space-y-4">
                    <h3 className="text-lg font-bold">Recent Job History</h3>
                    <div className="card p-0 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-[var(--color-background-elevated)] border-b border-[var(--color-border-subtle)]">
                                <tr>
                                    <th className="px-4 py-3 text-xs font-bold uppercase">Account</th>
                                    <th className="px-4 py-3 text-xs font-bold uppercase">Status</th>
                                    <th className="px-4 py-3 text-xs font-bold uppercase">Found</th>
                                    <th className="px-4 py-3 text-xs font-bold uppercase text-right">Started</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--color-border-subtle)]">
                                {jobs.map((job) => (
                                    <tr key={job.id} className="hover:bg-[var(--color-background-elevated)] transition-colors">
                                        <td className="px-4 py-3 font-medium text-sm">@{job.instagram_username}</td>
                                        <td className="px-4 py-3">
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${job.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                                                job.status === 'running' || job.status === 'pending' || job.status === 'started' ? 'bg-blue-500/10 text-blue-500 animate-pulse' :
                                                    job.status === 'failed' ? 'bg-red-500/10 text-red-500' : 'bg-gray-500/10 text-gray-500'
                                                }`}>
                                                {job.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            {job.videos_found > 0
                                                ? <span className="text-green-500 font-bold">{job.videos_found} Sent to Queue</span>
                                                : job.status === 'completed' ? <span className="text-[var(--color-text-secondary)] italic">None met AI criteria</span> : <span className="text-[var(--color-text-secondary)]">-</span>
                                            }
                                        </td>
                                        <td className="px-4 py-3 text-xs text-[var(--color-text-secondary)] text-right">
                                            {new Date(job.created_at).toLocaleTimeString()}
                                        </td>
                                    </tr>
                                ))}
                                {jobs.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-10 text-center text-sm text-[var(--color-text-secondary)]">
                                            No scrape jobs found. Run a scan to see history.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
