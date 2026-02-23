"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Job = {
    id: string;
    video_id: string;
    status: string;
    current_step: string;
    error_message: string | null;
    created_at: string;
};

export default function QueuePage() {
    const [jobs, setJobs] = useState<Job[]>([]);

    useEffect(() => {
        const loadJobs = async () => {
            const { data } = await supabase
                .from("pipeline_jobs")
                .select("*")
                .order("created_at", { ascending: false });
            if (data) setJobs(data);
        };

        loadJobs();

        const channel = supabase
            .channel('schema-db-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'pipeline_jobs',
                },
                () => {
                    loadJobs();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl">Pipeline Queue</h1>
                <p className="text-[var(--color-text-secondary)] mt-2">Manage videos currently moving through the AI pipeline.</p>
            </div>

            <div className="card p-0 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-[var(--color-bg-overlay)] border-b border-[var(--color-border-subtle)]">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Task ID</th>
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Step</th>
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Status</th>
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Error</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border-subtle)]">
                        {jobs.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-[var(--color-text-tertiary)]">
                                    The queue is currently empty.
                                </td>
                            </tr>
                        ) : (
                            jobs.map(job => (
                                <tr key={job.id} className="hover:bg-[var(--color-bg-hover)] transition-colors">
                                    <td className="px-6 py-4 mono text-sm">{job.id.slice(0, 8)}...</td>
                                    <td className="px-6 py-4 text-sm">{job.current_step}</td>
                                    <td className="px-6 py-4 text-sm">
                                        <span className={`badge px-2 py-1 rounded text-xs ${job.status === 'completed' ? 'text-[var(--color-primary)] bg-[var(--color-primary-dim)]' :
                                                job.status === 'error' || job.status === 'failed' ? 'text-[var(--color-danger)] bg-red-500/10' :
                                                    'text-[var(--color-warning)] bg-yellow-500/10'
                                            }`}>
                                            {job.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-[var(--color-text-secondary)] truncate max-w-xs">{job.error_message || "-"}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
