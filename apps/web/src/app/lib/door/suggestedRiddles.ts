import type { SuggestedRiddle } from "./types";

export const SUGGESTED_RIDDLES: SuggestedRiddle[] = [
  {
    id: "electric_train",
    title: "Electric Train",
    riddleText: "An electric train is headed east. Where does the smoke go?",
    tags: ["classic", "trick"],
  },
  {
    id: "darkness",
    title: "Cannot be seen",
    riddleText:
      "It can’t be seen, can’t be felt, can’t be heard, can’t be smelt.\n" +
      "It lies behind stars and under hills, and empty holes it fills.\n" +
      "It comes first and follows after, ends life, kills laughter.",
    tags: ["classic", "poetic"],
  },
];

export function getSuggestedById(id: string): SuggestedRiddle | undefined {
  return SUGGESTED_RIDDLES.find((r) => r.id === id);
}
