"use client";
import React from 'react';
import RulesModal from './RulesModal';

export default function WurpleHeader() {
    const [showRules, setShowRules] = React.useState(false);
    return (
        <header className="flex items-end justify-end text-white ">
<div className="mt-3 flex items-center justify-center gap-2">
<button
  onClick={() => setShowRules(true)}
  aria-label="Game rules"
  className="
    ml-2
    inline-flex h-7 w-7 items-center justify-center
    rounded-full
    bg-bg-soft
    text-xs font-extrabold
    text-text-muted
    ring-1 ring-black/10
    hover:text-text
    hover:bg-bg-panel
    transition
    dark:ring-white/10
  "
>
  ?
</button>


</div>

<RulesModal open={showRules} onClose={() => setShowRules(false)} />

        </header>
    );
}