"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import {
    Users,
    Eye,
    PlaySquare,
    TrendingUp,
    AlertCircle,
    MessageCircle,
    ThumbsUp,
    ChevronRight,
    ArrowUpRight
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from "recharts";

interface VideoStats {
    id: string;
    title: string;
    published_at: string;
    view_count: number;
    like_count: number;
    comment_count: number;
}

interface ChannelAnalytics {
    id: string;
    channel_name: string;
    subscriber_count: string;
    view_count: string;
    video_count: string;
    thumbnail?: string;
    recent_videos?: VideoStats[];
}

export default function AnalyticsPage() {
    const [analytics, setAnalytics] = useState<ChannelAnalytics[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchApi("/youtube/analytics")
            .then((data) => {
                setAnalytics(data.channels || []);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Analytics Error:", err);
                setError(err.message || "Failed to load channel data");
                setLoading(false);
            });
    }, []);

    const formatNumber = (num: number | string) => {
        const n = typeof num === 'string' ? parseInt(num) : num;
        if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
        if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
        return n.toString();
    };

    if (loading) {
        return (
            <div className="space-y-8 max-w-6xl">
                <div className="h-20 w-1/3 bg-[var(--color-bg-hover)] animate-pulse rounded-xl"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="card animate-pulse h-32 bg-[var(--color-bg-hover)]"></div>
                    ))}
                </div>
                <div className="card animate-pulse h-96 bg-[var(--color-bg-hover)]"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="card border-red-500/50 bg-red-500/5 flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <h3 className="text-lg font-bold">Analytics Unavailable</h3>
                <p className="text-[var(--color-text-secondary)] mt-1 max-w-md">{error}</p>
                <button onClick={() => window.location.reload()} className="btn-primary mt-6">Try Again</button>
            </div>
        );
    }

    if (analytics.length === 0) {
        return (
            <div className="card flex flex-col items-center justify-center py-20 text-center border-dashed border-[var(--color-border-strong)]">
                <PlaySquare className="w-16 h-16 text-[var(--color-text-secondary)] mb-6 opacity-20" />
                <h3 className="text-xl font-bold">No Channels Connected</h3>
                <p className="text-[var(--color-text-secondary)] mt-2 max-w-xs">Connect your YouTube channel in settings to start viewing real-time growth metrics.</p>
                <button onClick={() => window.location.assign('/settings')} className="btn-primary mt-8">Go to Settings</button>
            </div>
        );
    }

    // For simplicity, we show analytics for the first channel (mostly users have 1)
    const channel = analytics[0];
    const chartData = (channel.recent_videos || []).map(v => ({
        name: v.title.length > 20 ? v.title.substring(0, 17) + '...' : v.title,
        views: v.view_count,
        rawTitle: v.title
    })).reverse();

    const avgViews = channel.recent_videos?.length
        ? Math.round(channel.recent_videos.reduce((acc, v) => acc + v.view_count, 0) / channel.recent_videos.length)
        : 0;

    return (
        <div className="space-y-8 max-w-6xl pb-20">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    {channel.thumbnail ? (
                        <img src={channel.thumbnail} className="w-16 h-16 rounded-full border-2 border-[var(--color-primary)]" alt="" />
                    ) : (
                        <div className="w-16 h-16 rounded-full bg-[var(--color-bg-hover)] flex items-center justify-center border-2 border-[var(--color-border-strong)]">
                            <PlaySquare className="w-8 h-8 opacity-20" />
                        </div>
                    )}
                    <div>
                        <h1 className="text-3xl font-bold">{channel.channel_name}</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 rounded-md bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-[10px] font-bold uppercase tracking-wider">Verified YouTube Partner</span>
                            <span className="text-[10px] text-[var(--color-text-secondary)] uppercase font-bold tracking-widest">• Live Stats</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-4">
                    <button className="px-4 py-2 text-xs font-bold uppercase tracking-widest border border-[var(--color-border-strong)] rounded-xl hover:bg-[var(--color-bg-hover)] transition-all flex items-center gap-2">
                        Export Report <ArrowUpRight className="w-4 h-4" />
                    </button>
                    <button className="btn-primary flex items-center gap-2" onClick={() => window.location.assign('/scraper')}>
                        <PlaySquare className="w-4 h-4" /> New Content
                    </button>
                </div>
            </div>

            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="card group relative overflow-hidden bg-gradient-to-br from-[var(--color-background)] to-[var(--color-bg-hover)]">
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-widest">Subscribers</span>
                            <Users className="w-4 h-4 text-[var(--color-primary)]" />
                        </div>
                        <p className="text-3xl font-bold mono">{formatNumber(channel.subscriber_count)}</p>
                    </div>
                    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Users className="w-24 h-24" />
                    </div>
                </div>

                <div className="card group relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-widest">Total Views</span>
                            <Eye className="w-4 h-4 text-purple-500" />
                        </div>
                        <p className="text-3xl font-bold mono">{formatNumber(channel.view_count)}</p>
                        <p className="text-[10px] text-[var(--color-text-secondary)] mt-2 font-bold uppercase">Lifetime Reach</p>
                    </div>
                    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Eye className="w-24 h-24" />
                    </div>
                </div>

                <div className="card group relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-widest">Total Videos</span>
                            <PlaySquare className="w-4 h-4 text-red-500" />
                        </div>
                        <p className="text-3xl font-bold mono">{channel.video_count}</p>
                        <p className="text-[10px] text-[var(--color-text-secondary)] mt-2 font-bold uppercase">Active Distribution</p>
                    </div>
                    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <PlaySquare className="w-24 h-24" />
                    </div>
                </div>

                <div className="card group relative overflow-hidden border-dashed border-l-4 border-l-[var(--color-primary)]">
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-widest">Avg View Velocity</span>
                            <TrendingUp className="w-4 h-4 text-green-500" />
                        </div>
                        <p className="text-3xl font-bold mono">{formatNumber(avgViews)}</p>
                        <p className="text-[10px] text-[var(--color-text-secondary)] mt-2 font-bold uppercase">Last 5 Videos</p>
                    </div>
                    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <TrendingUp className="w-24 h-24" />
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 card">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-bold">Recent Upload Performance</h3>
                            <p className="text-xs text-[var(--color-text-secondary)] mt-1">View distribution across the last 5 published videos.</p>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest">
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[var(--color-primary)]"></div> Views</div>
                        </div>
                    </div>

                    <div className="h-[300px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'var(--color-text-secondary)', fontSize: 10, fontWeight: 'bold' }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'var(--color-text-secondary)', fontSize: 10, fontWeight: 'bold' }}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--color-background)', borderRadius: '12px', border: '1px solid var(--color-border-strong)', fontSize: '12px' }}
                                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                                />
                                <Bar
                                    dataKey="views"
                                    fill="var(--color-primary)"
                                    radius={[6, 6, 0, 0]}
                                    barSize={40}
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fillOpacity={0.5 + (index / chartData.length) * 0.5} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card flex flex-col">
                    <h3 className="text-xl font-bold mb-6">Recent Engagement</h3>
                    <div className="space-y-6 flex-grow">
                        {channel.recent_videos?.map((v, i) => (
                            <div key={v.id} className="flex items-center justify-between group cursor-pointer">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="w-8 h-8 rounded-lg bg-[var(--color-bg-hover)] flex items-center justify-center shrink-0 text-xs font-bold text-[var(--color-text-secondary)]">
                                        #{i + 1}
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-xs font-bold truncate pr-4">{v.title}</p>
                                        <div className="flex items-center gap-3 mt-1 opacity-60">
                                            <span className="flex items-center gap-1 text-[10px] font-bold"><ThumbsUp className="w-2.5 h-2.5" /> {v.like_count}</span>
                                            <span className="flex items-center gap-1 text-[10px] font-bold"><MessageCircle className="w-2.5 h-2.5" /> {v.comment_count}</span>
                                        </div>
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-[var(--color-text-secondary)] opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                            </div>
                        ))}
                    </div>
                    <button className="w-full mt-8 py-3 text-[10px] font-bold uppercase tracking-widest border border-[var(--color-border-strong)] rounded-xl hover:bg-[var(--color-bg-hover)] transition-all">
                        View Detailed History
                    </button>
                </div>
            </div>

            {/* End of Charts */}

        </div>
    );
}
