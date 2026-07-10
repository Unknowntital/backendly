import { useEffect, useState, useRef } from "react";
import { createRealtimeClient } from "backendly-sdk";
import { API } from "@/contexts/AuthContext";

export default function RealtimeTab({ project }) {
    const [events, setEvents] = useState([]);
    const [connected, setConnected] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        const client = createRealtimeClient({ projectUrl: `ws://localhost:3003/realtime?projectId=${project.project_id}` });
        
        const sub = client.table('*')
            .on('*', (row) => {
                setEvents((prev) => {
                    const newEvents = [row, ...prev].slice(0, 100);
                    return newEvents;
                });
            })
            .subscribe();
            
        // Assuming client emits some connection state if needed, or we just assume connected
        setConnected(true);

        return () => {
            sub.unsubscribe();
            setConnected(false);
        };
    }, [project.project_id]);

    return (
        <div className="bg-[#0A0C10] border border-white/[0.08] rounded-xl overflow-hidden h-[600px] flex flex-col">
            <div className="p-4 border-b border-white/[0.06] flex items-center justify-between bg-black/20">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${connected ? 'bg-teal-400' : 'bg-red-500'}`} />
                    <span className="text-sm font-medium text-white">Live Events</span>
                </div>
                <div className="text-xs text-zinc-500">Auto-scrolling</div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs" ref={scrollRef}>
                {events.length === 0 && (
                    <div className="text-zinc-500 text-center mt-10">No events yet. Waiting...</div>
                )}
                {events.map((ev, i) => (
                    <div key={i} className="p-3 bg-white/[0.02] border border-white/[0.05] rounded-md text-zinc-300">
                        <div className="flex items-center gap-2 mb-2 text-white">
                            <span className="text-teal-400 font-bold">[{ev.operation}]</span>
                            <span>{ev.table}</span>
                            <span className="text-zinc-500 text-[10px] ml-auto">{new Date(ev.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <pre className="text-zinc-400 overflow-x-auto">
                            {JSON.stringify(ev.operation === 'DELETE' ? ev.old : ev.new, null, 2)}
                        </pre>
                    </div>
                ))}
            </div>
        </div>
    );
}
