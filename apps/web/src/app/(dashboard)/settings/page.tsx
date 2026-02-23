"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { Youtube, Instagram, Sparkles, FileVideo, Video, Upload, Trash2 } from "lucide-react";
import { useDropzone } from "react-dropzone";

export default function SettingsPage() {
    const [youtubeConnected, setYoutubeConnected] = useState(false);
    const [channelName, setChannelName] = useState("");

    // Hook Settings State
    const [hookMode, setHookMode] = useState("single_video");
    const [selectedHookUrl, setSelectedHookUrl] = useState("");
    const [availableHooks, setAvailableHooks] = useState<{ name: string, url: string }[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [igAccounts, setIgAccounts] = useState<{ username: string }[]>([]);
    const [ytChannels, setYtChannels] = useState<any[]>([]);
    const [newIgUsername, setNewIgUsername] = useState("");
    const [publishTimeStart, setPublishTimeStart] = useState("09:00");
    const [publishTimeEnd, setPublishTimeEnd] = useState("21:00");

    const searchParams = useSearchParams();
    const router = useRouter();

    const refreshAccounts = async () => {
        try {
            const igs = await fetchApi("/settings/instagram");
            setIgAccounts(igs || []);
            const yts = await fetchApi("/settings/youtube/channels");
            setYtChannels(yts || []);
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        // Handle results from the new Direct Callback route
        const success = searchParams.get("success");
        const error = searchParams.get("error");

        if (success) {
            alert("YouTube Channel Connected Successfully! 🎉");
            router.replace("/settings");
            refreshAccounts();
        } else if (error) {
            alert("YouTube Connection Failed: " + error);
            router.replace("/settings");
        }

        // Load YouTube state
        fetchApi("/youtube/status").then((data) => {
            setYoutubeConnected(data.connected);
            if (data.channel) setChannelName(data.channel.channel_name);
        }).catch(console.error);

        // Load combined settings and library
        fetchApi("/settings").then((data) => {
            setHookMode(data.hook_mode || "single_video");
            setSelectedHookUrl(data.selected_hook_url || "");
            setPublishTimeStart(data.publish_time_start || "09:00");
            setPublishTimeEnd(data.publish_time_end || "21:00");
        });

        fetchApi("/settings/hooks").then((data) => {
            if (data.hooks) setAvailableHooks(data.hooks);
        });

        refreshAccounts();
    }, []);

    const connectYoutube = async () => {
        try {
            const origin = window.location.origin;
            const redirect_uri = `${origin}/api/auth/youtube/callback`;
            const data = await fetchApi(`/youtube/auth-url?redirect_uri=${encodeURIComponent(redirect_uri)}`);
            window.location.href = data.url;
        } catch (e) { console.error(e); }
    };

    const addIgAccount = async () => {
        if (!newIgUsername) return;
        try {
            await fetchApi("/settings/instagram", {
                method: "POST",
                body: JSON.stringify({ username: newIgUsername })
            });
            setNewIgUsername("");
            refreshAccounts();
        } catch (e: any) { alert(e.message); }
    };

    const deleteIgAccount = async (username: string) => {
        await fetchApi(`/settings/instagram/${username}`, { method: "DELETE" });
        refreshAccounts();
    };

    const deleteYtChannel = async (id: string) => {
        await fetchApi(`/settings/youtube/channels/${id}`, { method: "DELETE" });
        refreshAccounts();
    };

    const saveSettings = async (overrides: any = {}) => {
        const payload = {
            hook_mode: overrides.hook_mode || hookMode,
            selected_hook_url: overrides.selected_hook_url !== undefined ? overrides.selected_hook_url : selectedHookUrl,
            publish_time_start: overrides.publish_time_start || publishTimeStart,
            publish_time_end: overrides.publish_time_end || publishTimeEnd
        };

        if (overrides.hook_mode) setHookMode(overrides.hook_mode);
        if (overrides.selected_hook_url !== undefined) setSelectedHookUrl(overrides.selected_hook_url);
        if (overrides.publish_time_start) setPublishTimeStart(overrides.publish_time_start);
        if (overrides.publish_time_end) setPublishTimeEnd(overrides.publish_time_end);

        try {
            await fetch("http://localhost:8000/api/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
        } catch (e) { console.error(e); }
    };

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return;
        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", acceptedFiles[0]);

        try {
            const res = await fetch("http://localhost:8000/api/settings/upload-hook", {
                method: "POST",
                body: formData
            });
            const data = await res.json();
            if (data.status === "success" && data.files) {
                setAvailableHooks(data.files);
                if (data.url && hookMode === "single_video" && !selectedHookUrl) {
                    saveSettings({ hook_mode: "single_video", selected_hook_url: data.url });
                }
            }
        } catch (e) { console.error(e); }
        finally { setIsUploading(false); }
    }, [hookMode, selectedHookUrl, publishTimeStart, publishTimeEnd]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { "video/mp4": [".mp4"] },
        maxFiles: 1
    });

    return (
        <div className="space-y-8 max-w-5xl pb-20">
            <div>
                <h1 className="text-3xl font-bold">Automation Command Center</h1>
                <p className="text-[var(--color-text-secondary)] mt-2">Manage multiple traffic sources and publishing destinations.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* IG Accounts */}
                <div className="card space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <Instagram className="text-pink-500" /> Instagram Accounts ({igAccounts.length}/5)
                        </h3>
                    </div>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            className="input text-sm"
                            placeholder="username"
                            value={newIgUsername}
                            onChange={(e) => setNewIgUsername(e.target.value)}
                        />
                        <button
                            className="bg-[var(--color-primary)] text-black px-4 py-2 rounded-lg font-bold text-sm"
                            onClick={addIgAccount}
                            disabled={igAccounts.length >= 5}
                        >
                            Add
                        </button>
                    </div>

                    <div className="space-y-2">
                        {igAccounts.map(acc => (
                            <div key={acc.username} className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-background-elevated)] border border-[var(--color-border-subtle)]">
                                <span className="font-medium">@{acc.username}</span>
                                <button onClick={() => deleteIgAccount(acc.username)} className="text-red-500 hover:text-red-400">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* YT Channels */}
                <div className="card space-y-6">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <Youtube className="text-red-600" /> YouTube Channels ({ytChannels.length}/5)
                    </h3>

                    <button
                        className="btn-primary w-full justify-center"
                        onClick={connectYoutube}
                        disabled={ytChannels.length >= 5}
                    >
                        + Connect New Channel
                    </button>

                    <div className="space-y-2">
                        {ytChannels.map(ch => (
                            <div key={ch.id} className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-background-elevated)] border border-[var(--color-border-subtle)]">
                                <div className="flex flex-col">
                                    <span className="font-medium">{ch.channel_name}</span>
                                    <span className="text-[10px] text-[var(--color-text-secondary)] uppercase">ID: {ch.youtube_channel_id}</span>
                                </div>
                                <button onClick={() => deleteYtChannel(ch.id)} className="text-red-500 hover:text-red-400">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="card space-y-4">
                    <h3 className="text-lg font-bold">Smart-Spacing Window</h3>
                    <p className="text-xs text-[var(--color-text-secondary)]">Videos will be scheduled with 24h+ gaps within this window.</p>
                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase text-[10px]">Start Time</label>
                            <input
                                type="time"
                                className="input h-10"
                                value={publishTimeStart}
                                onChange={(e) => saveSettings({ publish_time_start: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase text-[10px]">End Time</label>
                            <input
                                type="time"
                                className="input h-10"
                                value={publishTimeEnd}
                                onChange={(e) => saveSettings({ publish_time_end: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                <div className="card space-y-4">
                    <h3 className="text-lg font-bold">Auto-Hook Logic</h3>
                    <div className="flex gap-2">
                        {['single_video', 'random_video'].map(mode => (
                            <button
                                key={mode}
                                onClick={() => saveSettings({ hook_mode: mode })}
                                className={`flex-1 p-3 rounded-lg border text-xs font-bold transition-all ${hookMode === mode ? 'border-[var(--color-primary)] bg-[var(--color-primary-dim)] text-[var(--color-primary)]' : 'border-[var(--color-border-subtle)] hover:border-gray-500'}`}
                            >
                                {mode.replace('_', ' ').toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Intro Library Section */}
            <div className="card space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold">Intro Video Library</h3>
                        <p className="text-xs text-[var(--color-text-secondary)] mt-1">Upload MP4 files for prepending to your Reels.</p>
                    </div>
                </div>

                {/* Dropzone */}
                <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${isDragActive ? "border-[var(--color-primary)] bg-[var(--color-primary-dim)]" : "border-[var(--color-border-subtle)] hover:border-gray-500 bg-[var(--color-background)]"
                        }`}
                >
                    <input {...getInputProps()} />
                    <Upload className="w-8 h-8 text-[var(--color-text-secondary)] mb-3" />
                    {isUploading ? (
                        <p className="font-semibold animate-pulse">Uploading to Supabase...</p>
                    ) : (
                        <>
                            <p className="font-semibold">Drag & drop your MP4 intro here</p>
                            <p className="text-sm text-[var(--color-text-secondary)] mt-1">or click to browse</p>
                        </>
                    )}
                </div>

                {/* Video List */}
                {availableHooks.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                        {availableHooks.map((file, idx) => (
                            <div key={idx} className={`p-3 rounded-lg flex items-center justify-between border ${hookMode === 'single_video' && selectedHookUrl === file.url ? 'border-[var(--color-primary)] bg-[#00ff8808]' : 'border-[var(--color-border-subtle)] bg-[var(--color-background)]'}`}>
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-black rounded overflow-hidden flex items-center justify-center">
                                        <video src={file.url} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="text-xs font-medium truncate w-32">{file.name}</div>
                                </div>

                                {hookMode === "single_video" && selectedHookUrl !== file.url && (
                                    <button
                                        className="text-[10px] px-3 py-1 rounded bg-[var(--color-primary)] text-black font-bold"
                                        onClick={() => saveSettings({ selected_hook_url: file.url })}
                                    >
                                        SELECT
                                    </button>
                                )}
                                {hookMode === "single_video" && selectedHookUrl === file.url && (
                                    <span className="text-[10px] px-3 py-1 rounded text-[var(--color-primary)] font-bold border border-[var(--color-primary)] uppercase">
                                        Active
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </div>
    );
}
