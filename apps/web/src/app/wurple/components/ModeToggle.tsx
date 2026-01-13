import { usePathname, useRouter, useSearchParams } from "next/navigation";


export default function ModeToggle({mode, setMode,}: {mode: "easy" | "challenge"; setMode: (mode: "easy" | "challenge") => void}) { 
    
    function useModeUrlSync() {
        const router = useRouter();
        const pathname = usePathname();
        const searchParams = useSearchParams();

        return (mode: "easy" | "challenge") => {
            const params = new URLSearchParams(searchParams.toString());
            params.set("mode", mode);
            router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        };
    }
    const setModeInUrl = useModeUrlSync();
    function onToggleMode(nextMode: "easy" | "challenge") {
        setMode(nextMode);        // your existing state update
        setModeInUrl(nextMode);   // keep URL honest
    }
    return(<div className = 'flex gap-3 mb-4'>
    <button
        type="button"
        onClick={() => onToggleMode("easy")}
        style={{
            padding: "8px 12px ",
            borderRadius: "10px 0 0 10px",
            marginRight: "-5px",
            fontWeight: 800,
            background: mode === "easy" ? "#2563eb" : "#1f2937",
            color: "#fff",
            width: "100px",
            border: "1px solid rgba(255,255,255,0.15)",
        }}
    >
        Easy
    </button>

    <button
        type="button"
        onClick={() => {
            onToggleMode("challenge");
        }}
        style={{
            padding: "8px 12px",
            borderRadius: "0 10px 10px 0 ",
            marginLeft: "-5px",
            fontWeight: 800,
            background: mode === "challenge" ? "#2563eb" : "#1f2937",
            color: "#fff",
            width: "100px",
            border: "1px solid rgba(255,255,255,0.15)",
        }}
    >
        Challenge
    </button>
    </div>
    )
}
