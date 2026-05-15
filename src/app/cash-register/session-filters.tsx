"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState } from "react";

export function SessionHistoryFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();

    const [from, setFrom] = useState(searchParams.get("from") || "");
    const [to, setTo] = useState(searchParams.get("to") || "");

    function handleFilter() {
        const params = new URLSearchParams(searchParams);
        if (from) params.set("from", from);
        else params.delete("from");

        if (to) params.set("to", to);
        else params.delete("to");

        params.set("tab", "history");
        router.push(`${pathname}?${params.toString()}`);
    }

    return (
        <div className="flex flex-wrap items-end gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm mb-6">
            <div className="space-y-1.5 flex-1 min-w-[200px]">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Du</label>
                <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-10" />
            </div>
            <div className="space-y-1.5 flex-1 min-w-[200px]">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Au</label>
                <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-10" />
            </div>
            <Button onClick={handleFilter} className="bg-slate-900 text-white hover:bg-slate-800 rounded-lg h-10 px-6 gap-2">
                <Search size={16} />
                Filtrer
            </Button>
        </div>
    );
}
