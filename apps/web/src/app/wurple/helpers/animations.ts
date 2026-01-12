export const keyframes = `
        @keyframes shake {
  0% { transform: translateX(0); }
  25% { transform: translateX(-6px); }
  50% { transform: translateX(6px); }
  75% { transform: translateX(-4px); }
  100% { transform: translateX(0); }
}

  @keyframes readyPulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.04); }
    100% { transform: scale(1); }
  }

  @keyframes keyPop {
    0%   { transform: scale(1); }
    60%  { transform: scale(1.08); }
    100% { transform: scale(1); }
  }
  @keyframes tileFlip {
    0%   { transform: rotateX(0deg); }
    100% { transform: rotateX(180deg); }
  }

  @keyframes tilePopIn {
    0%   { transform: scale(0.92); opacity: 0; }
    100% { transform: scale(1); opacity: 1; }
  }
    @keyframes revealStatic {
    0%   { transform: rotateX(180deg); }
    100% { transform: rotateX(180deg); }
  }
`