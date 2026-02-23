"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Download, ListVideo, BarChart3, Settings } from "lucide-react";

const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Scraper", href: "/scraper", icon: Download },
    { name: "Queue", href: "/queue", icon: ListVideo },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
    { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 flex flex-col h-full bg-[var(--color-bg-elevated)] border-r border-[var(--color-border-subtle)] p-4">
            <div className="flex items-center gap-3 px-3 py-4 mb-6">
                <div className="w-8 h-8 rounded-md bg-[var(--color-primary)] flex items-center justify-center text-black font-bold">
                    RF
                </div>
                <span className="font-bold text-lg tracking-tight">ReelFlow</span>
            </div>

            <nav className="flex flex-col gap-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-[var(--color-bg-selected)] text-white"
                                    : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-white"
                            )}
                        >
                            <item.icon className={cn("w-4 h-4", isActive ? "text-[var(--color-primary)]" : "text-[var(--color-text-tertiary)]")} />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-auto px-3 py-4">
                <div className="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-background)]">
                    <div className="w-8 h-8 rounded bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)]"></div>
                    <div className="flex flex-col">
                        <span className="text-xs font-semibold text-white">Admin User</span>
                        <span className="text-[10px] text-[var(--color-text-tertiary)] mono">Local Auth</span>
                    </div>
                </div>
            </div>
        </aside>
    );
}
