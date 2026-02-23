"use client";

import { Video, Clock, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function DashboardOverview() {
    const router = useRouter();
    const [stats, setStats] = useState({ total: 0, pipeline: 0, published: 0, youtube_channels: 0, instagram_accounts: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchApi("/videos/stats")
            .then((data) => {
                setStats(data);
                setLoading(false);
            })
            .catch(console.error);
    }, []);

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl">Overview</h1>
                <button
                    className="btn-primary flex items-center gap-2"
                    onClick={() => router.push('/scraper')}
                >
                    <Video className="w-4 h-4" /> New Scrape
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card flex items-center gap-4">
                    <div className="p-3 bg-[var(--color-bg-hover)] rounded-lg">
                        <Video className="w-6 h-6 text-[var(--color-text-secondary)]" />
                    </div>
                    <div>
                        <h3 className="text-[var(--color-text-secondary)] text-xs font-bold uppercase tracking-wider">Total Discovered</h3>
                        <p className="text-3xl mt-1 mono">{loading ? "-" : stats.total}</p>
                    </div>
                </div>
                <div className="card flex items-center gap-4 border-l-4 border-l-[var(--color-warning)]">
                    <div className="p-3 bg-[var(--color-bg-hover)] rounded-lg">
                        <Clock className="w-6 h-6 text-[var(--color-warning)]" />
                    </div>
                    <div>
                        <h3 className="text-[var(--color-text-secondary)] text-xs font-bold uppercase tracking-wider">In Pipeline</h3>
                        <p className="text-3xl mt-1 mono text-[var(--color-warning)]">{loading ? "-" : stats.pipeline}</p>
                    </div>
                </div>
                <div className="card flex items-center gap-4 border-l-4 border-l-[var(--color-primary)]">
                    <div className="p-3 bg-[var(--color-bg-hover)] rounded-lg">
                        <CheckCircle className="w-6 h-6 text-[var(--color-primary)]" />
                    </div>
                    <div>
                        <h3 className="text-[var(--color-text-secondary)] text-xs font-bold uppercase tracking-wider">Published</h3>
                        <p className="text-3xl mt-1 mono text-[var(--color-primary)]">{loading ? "-" : stats.published}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="card">
                    <h2 className="text-xl mb-6">Recent Activity</h2>
                    <div className="text-center p-12 border border-dashed border-[var(--color-border-strong)] rounded-xl">
                        <p className="text-[var(--color-text-secondary)]">Pipeline logs or recent processed videos will appear here.</p>
                    </div>
                </div>

                <div className="card space-y-6">
                    <h2 className="text-xl">Connected Sources</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--color-bg-hover)]">
                            <div className="flex items-center gap-3">
                                <Video className="w-5 h-5 text-pink-500" />
                                <div>
                                    <p className="text-sm font-bold">Instagram Accounts</p>
                                    <p className="text-xs text-[var(--color-text-secondary)]">{stats.instagram_accounts > 0 ? "Active & Syncing" : "Waiting for scan"}</p>
                                </div>
                            </div>
                            <span className="px-3 py-1 bg-black rounded-full text-[10px] uppercase font-bold tracking-widest border border-[var(--color-border-strong)]">
                                {stats.instagram_accounts || 0} Linked
                            </span>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--color-bg-hover)]">
                            <div className="flex items-center gap-3">
                                <CheckCircle className="w-5 h-5 text-red-500" />
                                <div>
                                    <p className="sm:text-sm text-xs font-bold">YouTube Channels</p>
                                    <p className="text-[10px] text-[var(--color-text-secondary)]">{stats.youtube_channels > 0 ? "Active & Ready" : "No channels linked"}</p>
                                </div>
                            </div>
                            <span className="px-3 py-1 bg-black rounded-full text-[10px] uppercase font-bold tracking-widest border border-[var(--color-border-strong)]">
                                {stats.youtube_channels || 0} Linked
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={() => router.push('/settings')}
                        className="w-full py-3 text-xs font-bold uppercase tracking-widest border border-[var(--color-border-strong)] rounded-xl hover:bg-[var(--color-bg-hover)] transition-all"
                    >
                        Manage Connections
                    </button>
                </div>
            </div>
        </div>
    );
}
