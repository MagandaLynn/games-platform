// apps/web/src/styles/wurpleColors.ts
// Centralized color tokens for Wurple

export const wurpleColors = {
  /* Backgrounds */
  bgApp: "#0B0E14",        // app background
  bgPanel: "#121826",      // cards, modals
  bgSoft: "#1A2133",       // keyboards, inactive surfaces

  /* Easy (primary) */
  easy: "#2FA4A9",
  easyHover: "#3BBBC0",
  easyMuted: "#1F7F83",

  /* Challenge (secondary) */
  challenge: "#6B4EFF",
  challengeHover: "#7C63FF",
  challengeMuted: "#4C3AB8",

  /* Tile states */
  correct: "#2ECC71",
  correctMuted: "#1F9D55",

  present: "#F4C430",
  presentMuted: "#D1A81F",

  absent: "#2A2F3A",
  absentMuted: "#1E232D",

  /* Buttons */
  btnPrimaryBg: "#2FA4A9",
  btnPrimaryText: "#E6FFFB",
  btnPrimaryHover: "#3BBBC0",

  btnSecondaryBg: "#6B4EFF",
  btnSecondaryText: "#F5F3FF",
  btnSecondaryHover: "#7C63FF",

  /* Links */
  link: "#93C5FD",
  linkHover: "#BFDBFE",

  /* Optional accents */
  sparkle: "#F472B6",
  sparkleSoft: "#FDA4AF",
} as const;

export type WurpleColorKey = keyof typeof wurpleColors;
