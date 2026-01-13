import { COLS } from "../helpers/constants";
import { padGuess } from "../helpers/helpers";
import { GuessFeedback } from "../helpers/types";
import GuessSwatch from "./GuessSwatch";
import PreviewTile from "./PreviewTile";
import Tile from "./Tile";

type GuessesDisplayProps = {
    feedbackHistory: GuessFeedback[];
    input: string;
    status: "playing" | "won" | "lost";
    lastRevealedRow: number;
    revealId: number;
    rowsToDisplay: number;
};

export default function GuessesDisplay({feedbackHistory, input, status, lastRevealedRow, revealId, rowsToDisplay}: GuessesDisplayProps){
    return(
    <div style={{ marginTop: 18 }}>

        <div style={{ display: "grid", gap: 10 }}>
            {Array.from({ length: rowsToDisplay }).map((_, rowIdx) => {
            const revealed = feedbackHistory[rowIdx]; // GuessFeedback | undefined
            const isCurrentRow = rowIdx === feedbackHistory.length && status === "playing";

            // 1) Revealed rows (submitted guesses)
            if (revealed) {
                const shouldAnimateRow = rowIdx === lastRevealedRow;
                return (
                <div
                    key={`row-${rowIdx}`}
                    style={{ display: "flex", gap: 8, alignItems: "center" }}
                >
                    {revealed.tiles.map((t, colIdx) => {
                        const isNewest = rowIdx === feedbackHistory.length - 1;
                        
                        return (
                            <Tile
                                key={`${rowIdx}-${colIdx}-${isNewest ? revealId : "stable"}`}
                                char={revealed.guess[colIdx] ?? " "}
                                status={t}
                                delayMs={colIdx * 90}
                                animate={shouldAnimateRow}
                            />)
            })}
            <GuessSwatch guess={revealed.guess} distance={revealed.distance} />
   
            </div>
            );
        }

        // 2) Current typing row (pending)
        if (isCurrentRow) {
            const padded = padGuess(input);
            const cursorIndex = input.length;

            return (
            <div
                key={`row-${rowIdx}`}
                style={{ display: "flex", gap: 8, alignItems: "center" }}
            >
                {Array.from({ length: COLS }).map((_, colIdx) => (
                <PreviewTile
                    key={colIdx}
                    char={padded[colIdx]}
                    kind="pending"
                    isCursor={colIdx === cursorIndex}
                />

                ))}
            </div>
            );
        }

        // 3) Empty placeholder rows
        return (
            <div
            key={`row-${rowIdx}`}
            style={{ display: "flex", gap: 8, alignItems: "center" }}
            >
            {Array.from({ length: COLS }).map((_, colIdx) => (
                <PreviewTile key={colIdx} char=" " kind="empty" />
            ))}
            </div>
        );
        })}
    </div>
    </div>
)
}