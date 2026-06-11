export const DEFAULT_SETTINGS = {
  emDashes: true,
  forcedSass: true,
  buzzwords: true,
  cliches: true,
  formulaic: true,
  fillerPhrases: true,
  doublePunctuation: true,
};

export const RULE_LABELS = {
  emDashes: {
    name: "Em dashes",
    description:
      "Replace em dashes (—) with commas. AI often overuses tight em dashes—like this—instead of commas.",
  },
  forcedSass: {
    name: "Forced sass",
    description:
      'Tone down dramatic hooks like "But here\'s the thing:", "Hot take:", and "And honestly?".',
  },
  buzzwords: {
    name: "AI buzzwords",
    description:
      "Swap overused words like delve, leverage, unlock, tapestry, and navigate for plainer alternatives.",
  },
  cliches: {
    name: "Cliché openers",
    description:
      'Trim stock phrases like "In today\'s fast-paced digital landscape" or "As the world continues to evolve".',
  },
  formulaic: {
    name: "Formulaic structures",
    description:
      'Simplify patterns like "It\'s not just X. It\'s also Y." and "That\'s the real unlock."',
  },
  fillerPhrases: {
    name: "Filler phrases",
    description:
      'Remove or shorten filler like "Here\'s why that matters", "No fluff", and "The result?".',
  },
  doublePunctuation: {
    name: "Double punctuation",
    description: "Fix doubled exclamation or question marks (!! → !, ?? → ?).",
  },
};

function replaceAll(text, pattern, replacement) {
  return text.replace(pattern, replacement);
}

function applyEmDashes(text) {
  let result = text;
  // Tight em dashes without spaces: word—word → word, word
  result = replaceAll(result, /(\w)—(\w)/g, "$1, $2");
  // Spaced em dashes used as parenthetical
  result = replaceAll(result, /\s*—\s*/g, ", ");
  // En dash or hyphen used as em dash
  result = replaceAll(result, /\s+-\s+(?=[A-Za-z])/g, ", ");
  // Collapse duplicate commas from replacements
  result = replaceAll(result, /,\s*,/g, ",");
  result = replaceAll(result, /,\s+\./g, ".");
  return result;
}

function applyForcedSass(text) {
  const replacements = [
    [/But here's the thing:\s*/gi, "But "],
    [/But here is the thing:\s*/gi, "But "],
    [/Then I realized:\s*/gi, "I realized "],
    [/Hot take:\s*/gi, ""],
    [/And honestly\?\s*/gi, ""],
    [/And honestly,\s*/gi, ""],
    [/Spoiler alert:\s*/gi, ""],
    [/Let me be clear:\s*/gi, ""],
    [/Let's be honest:\s*/gi, ""],
    [/Let's be real:\s*/gi, ""],
    [/Plot twist:\s*/gi, ""],
    [/Here's what nobody(?:'s| is) saying:\s*/gi, ""],
    [/But here's the truth:\s*/gi, "But "],
    [/But here is the truth:\s*/gi, "But "],
  ];
  let result = text;
  for (const [pattern, replacement] of replacements) {
    result = replaceAll(result, pattern, replacement);
  }
  return result;
}

function applyBuzzwords(text) {
  const wordMap = [
    [/\bdelve into\b/gi, "look into"],
    [/\bdelving into\b/gi, "looking into"],
    [/\bdelve\b/gi, "explore"],
    [/\bleverage\b/gi, "use"],
    [/\bleveraging\b/gi, "using"],
    [/\bunlock\b/gi, "open"],
    [/\bunlocking\b/gi, "opening"],
    [/\bempower\b/gi, "enable"],
    [/\bempowering\b/gi, "enabling"],
    [/\belevate\b/gi, "raise"],
    [/\belevating\b/gi, "raising"],
    [/\btapestry\b/gi, "mix"],
    [/\bnavigate\b/gi, "handle"],
    [/\bnavigating\b/gi, "handling"],
    [/\bfoster\b/gi, "build"],
    [/\bfostering\b/gi, "building"],
    [/\butilize\b/gi, "use"],
    [/\butilizing\b/gi, "using"],
    [/\brobust\b/gi, "strong"],
    [/\bseamless\b/gi, "smooth"],
    [/\bcomprehensive\b/gi, "full"],
    [/\blandscape\b/gi, "field"],
    [/\bgrounded\b/gi, "practical"],
    [/\bquietly\b/gi, ""],
    [/\bsignificant\b/gi, "notable"],
    [/\bcrucial\b/gi, "key"],
    [/\bparamount\b/gi, "main"],
  ];
  let result = text;
  for (const [pattern, replacement] of wordMap) {
    result = replaceAll(result, pattern, replacement);
  }
  // Clean double spaces from removed words
  result = replaceAll(result, /  +/g, " ");
  return result;
}

function applyCliches(text) {
  const replacements = [
    [/In today's fast-paced digital landscape,?\s*/gi, ""],
    [/In today's fast-paced world,?\s*/gi, ""],
    [/In the dynamic (?:world|landscape|field) of\s+/gi, "In "],
    [/In the ever-evolving (?:world|landscape|field) of\s+/gi, "In "],
    [/As the world continues to evolve,?\s*/gi, ""],
    [/In an era of constant change,?\s*/gi, ""],
    [/shouting into the void/gi, "posting online"],
    [/no fluff/gi, ""],
    [/cutting through the noise/gi, ""],
    [/at the end of the day/gi, "ultimately"],
    [/it's worth noting that\s*/gi, ""],
    [/it is worth noting that\s*/gi, ""],
    [/in conclusion/gi, "finally"],
  ];
  let result = text;
  for (const [pattern, replacement] of replacements) {
    result = replaceAll(result, pattern, replacement);
  }
  return result;
}

function applyFormulaic(text) {
  let result = text;
  result = replaceAll(
    result,
    /It's not just ([^.]+)\.\s*It's also ([^.]+)\./gi,
    "It's $1 and $2."
  );
  result = replaceAll(
    result,
    /It is not just ([^.]+)\.\s*It is also ([^.]+)\./gi,
    "It is $1 and $2."
  );
  result = replaceAll(result, /That's the real ([^.!?]+)/gi, "That's the $1");
  result = replaceAll(result, /That is the real ([^.!?]+)/gi, "That is the $1");
  result = replaceAll(result, /No ([^.]+)\.\s*No ([^.]+)\.\s*Just ([^.]+)\./gi, "$3.");
  return result;
}

function applyFillerPhrases(text) {
  const replacements = [
    [/Here's why that matters[.:]?\s*/gi, ""],
    [/Here is why that matters[.:]?\s*/gi, ""],
    [/Here's the deal[.:]?\s*/gi, ""],
    [/Here is the deal[.:]?\s*/gi, ""],
    [/Here's what you need to know[.:]?\s*/gi, ""],
    [/The result\?\s*/gi, ""],
    [/The bottom line\?\s*/gi, ""],
    [/Long story short[,:]?\s*/gi, ""],
    [/At its core[,:]?\s*/gi, ""],
    [/Simply put[,:]?\s*/gi, ""],
    [/To put it simply[,:]?\s*/gi, ""],
    [/Needless to say[,:]?\s*/gi, ""],
  ];
  let result = text;
  for (const [pattern, replacement] of replacements) {
    result = replaceAll(result, pattern, replacement);
  }
  return result;
}

function applyDoublePunctuation(text) {
  let result = text;
  result = replaceAll(result, /!{2,}/g, "!");
  result = replaceAll(result, /\?{2,}/g, "?");
  return result;
}

function trimWhitespace(text) {
  return text
    .replace(/^\s+/, "")
    .replace(/\s+$/, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n");
}

const RULE_APPLIERS = {
  emDashes: applyEmDashes,
  forcedSass: applyForcedSass,
  buzzwords: applyBuzzwords,
  cliches: applyCliches,
  formulaic: applyFormulaic,
  fillerPhrases: applyFillerPhrases,
  doublePunctuation: applyDoublePunctuation,
};

export function humanize(text, settings = DEFAULT_SETTINGS) {
  if (!text) return "";

  let result = text;
  for (const [key, apply] of Object.entries(RULE_APPLIERS)) {
    if (settings[key] !== false) {
      result = apply(result);
    }
  }
  return trimWhitespace(result);
}
