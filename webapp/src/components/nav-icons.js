// Unicode glyphs for OSRM maneuver modifiers — used by NavBanner +
// NavPreviewCard so the visual language stays in one place.

const MODIFIER_GLYPH = {
  left: "↰",
  right: "↱",
  "slight left": "↖",
  "slight right": "↗",
  "sharp left": "⤴",
  "sharp right": "⤵",
  straight: "↑",
  uturn: "⤺",
};

const TYPE_GLYPH = {
  depart: "▲",
  arrive: "●",
  roundabout: "⟳",
  rotary: "⟳",
};

export function maneuverGlyph(step) {
  if (!step) return "↑";
  return TYPE_GLYPH[step.type] || MODIFIER_GLYPH[step.modifier] || "↑";
}

// Short human label for the "Then ↙" hint line. Falls back to the glyph
// alone when we can't infer a verb.
export function maneuverHint(step) {
  if (!step) return "Continue";
  if (step.type === "arrive") return "Arrive";
  if (step.type === "depart") return "Head out";
  switch (step.modifier) {
    case "left":
      return "Turn left";
    case "right":
      return "Turn right";
    case "slight left":
      return "Slight left";
    case "slight right":
      return "Slight right";
    case "sharp left":
      return "Sharp left";
    case "sharp right":
      return "Sharp right";
    case "uturn":
      return "U-turn";
    case "straight":
      return "Continue";
    default:
      return "Continue";
  }
}
