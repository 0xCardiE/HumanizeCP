export const DEFAULT_SETTINGS = {
  emDashes: true,
  doublePunctuation: true,
  fillerPhrases: true,
  forcedSass: true,
  cliches: true,
  formulaic: true,
  buzzwords: true,
};

export const RULE_GROUPS = [
  {
    name: "Symbols & punctuation",
    rules: ["emDashes", "doublePunctuation"],
  },
  {
    name: "Phrases & tone",
    rules: ["fillerPhrases", "forcedSass", "cliches", "formulaic", "buzzwords"],
  },
];

export const RULE_ORDER = RULE_GROUPS.flatMap((group) => group.rules);

export const RULE_LABELS = {
  emDashes: {
    name: "Em dashes",
    description:
      "Replace em dashes (—) with commas. AI often overuses tight em dashes—like this—instead of commas.",
  },
  doublePunctuation: {
    name: "Double punctuation",
    description: "Fix doubled exclamation or question marks (!! → !, ?? → ?).",
  },
  fillerPhrases: {
    name: "Filler phrases",
    description:
      'Remove or shorten filler like "Here\'s why that matters", "No fluff", and "The result?".',
  },
  forcedSass: {
    name: "Forced sass",
    description:
      'Tone down dramatic hooks like "But here\'s the thing:", "Hot take:", and "And honestly?".',
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
  buzzwords: {
    name: "AI buzzwords",
    description:
      "Swap overused phrases like delve into, leverage the real unlock, and navigate the landscape.",
  },
};

function replaceAll(text, pattern, replacement) {
  return text.replace(pattern, replacement);
}

function normalizeText(text) {
  return text
    .replace(/\u00a0/g, " ")
    .replace(/[\u200b-\u200d\ufeff]/g, "")
    .replace(/\s+/g, " ");
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

function fixSentenceCase(text) {
  return text.replace(/(^|[.!?]\s+)([a-z])/g, (_, boundary, letter) => {
    return boundary + letter.toUpperCase();
  });
}

function applyForcedSass(text) {
  const replacements = [
    [/\.\s*But here's the thing:\s*/gi, ". "],
    [/\.\s*But here is the thing:\s*/gi, ". "],
    [/But here's the thing:\s*/gi, ""],
    [/But here is the thing:\s*/gi, ""],
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
  const phraseMap = [
    [/\bleverag(?:e|ing)\s+the\s+real\s+unlock\b/gi, "use what matters"],
    [/\bthe\s+real\s+unlock\b/gi, "what matters"],
    [/\breal\s+unlock\b/gi, "key point"],
    [/\bdelve\s+into\s+this(?:\s+(?:landscape|field))?\b/gi, "look into this"],
    [/\bdelve\s+into\s+the\s+(?:landscape|field)\b/gi, "look into the area"],
    [/\bdelve\s+into\b/gi, "look into"],
    [/\bdelving\s+into\b/gi, "looking into"],
    [/\bnavigate\s+the\s+(?:landscape|field)\b/gi, "work through the area"],
    [/\bnavigate\s+this\s+(?:landscape|field)\b/gi, "work through this"],
    [/\btapestry\s+of\b/gi, "mix of"],
    [/\bdigital\s+landscape\b/gi, "space"],
    [/\bthis\s+landscape\b/gi, "this"],
    [/\bthe\s+landscape\b/gi, "the area"],
  ];

  const wordMap = [
    [/\bdelve\b/gi, "explore"],
    [/\bleverag(?:e|ing)\b/gi, (match) => (match.toLowerCase().endsWith("ing") ? "using" : "use")],
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
    [/\bgrounded\b/gi, "practical"],
    [/\bquietly\b/gi, ""],
    [/\bsignificant\b/gi, "notable"],
    [/\bcrucial\b/gi, "key"],
    [/\bparamount\b/gi, "main"],
  ];

  let result = text;
  for (const [pattern, replacement] of phraseMap) {
    result = replaceAll(result, pattern, replacement);
  }
  for (const [pattern, replacement] of wordMap) {
    result = replaceAll(result, pattern, replacement);
  }
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
  result = replaceAll(result, /That's the real unlock\b/gi, "That's what matters");
  result = replaceAll(result, /That is the real unlock\b/gi, "That is what matters");
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
  doublePunctuation: applyDoublePunctuation,
  fillerPhrases: applyFillerPhrases,
  forcedSass: applyForcedSass,
  cliches: applyCliches,
  formulaic: applyFormulaic,
  buzzwords: applyBuzzwords,
};

export function humanize(text, settings = DEFAULT_SETTINGS) {
  if (!text) return "";

  let result = normalizeText(text);
  for (const key of RULE_ORDER) {
    if (settings[key] !== false) {
      result = RULE_APPLIERS[key](result);
    }
  }
  return trimWhitespace(fixSentenceCase(result));
}
