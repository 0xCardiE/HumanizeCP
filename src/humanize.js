export const DEFAULT_SETTINGS = {
  emDashes: true,
  doublePunctuation: true,
  fillerPhrases: true,
  forcedSass: true,
  cliches: true,
  formulaic: true,
  buzzwords: true,
  transitionFillers: true,
  hedgePhrases: false,
  corporateCliches: true,
  academicFormal: false,
};

export const RULE_GROUPS = [
  {
    name: "Symbols & punctuation",
    rules: ["emDashes", "doublePunctuation"],
  },
  {
    name: "Phrases & tone",
    rules: [
      "fillerPhrases",
      "forcedSass",
      "cliches",
      "formulaic",
      "transitionFillers",
      "hedgePhrases",
    ],
  },
  {
    name: "Vocabulary",
    rules: ["buzzwords", "corporateCliches", "academicFormal"],
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
      "Swap overused AI vocabulary: delve, pivotal, testament, showcase, underscore, vibrant, and similar.",
  },
  transitionFillers: {
    name: "Transition fillers",
    description:
      'Trim connective fluff like "when it comes to", "in other words", "the reality is", and "let\'s unpack".',
  },
  hedgePhrases: {
    name: "Hedge phrases",
    description:
      'Remove cautious openers like "arguably", "generally speaking", and "one might argue that". Can strengthen claims the author meant to soften, so off by default.',
  },
  corporateCliches: {
    name: "Corporate clichés",
    description:
      'Swap marketing-speak like "paradigm shift", "game changer", "synergy", and "unlock the power of".',
  },
  academicFormal: {
    name: "Academic formal",
    description:
      'Simplify stiff academic phrasing like "our findings suggest" and "this paper presents". Off by default.',
  },
};

// Copies the leading capitalization of the matched text onto the replacement,
// so "Delve" → "Explore" but "delve" → "explore".
function matchCase(replacement, match) {
  if (!replacement || !/[a-z]/.test(replacement.charAt(0))) return replacement;
  return /[A-Z]/.test(match.charAt(0))
    ? replacement.charAt(0).toUpperCase() + replacement.slice(1)
    : replacement;
}

// Runs a list of [pattern, replacement] pairs. Plain string replacements
// (no $n backreferences) inherit the capitalization of the matched text.
function applyReplacements(text, rules) {
  let result = text;
  for (const [pattern, replacement] of rules) {
    if (typeof replacement === "function" || replacement.includes("$")) {
      result = result.replace(pattern, replacement);
    } else {
      result = result.replace(pattern, (match) => matchCase(replacement, match));
    }
  }
  return result;
}

// Builds a replacer that conjugates the replacement based on the captured
// suffix, e.g. /\butiliz(e|es|ed|ing)\b/ with { e: "use", es: "uses", ... }.
// Patterns with an optional suffix group use "" as the base-form key.
function pickForm(forms) {
  return (match, suffix = "") => matchCase(forms[suffix.toLowerCase()], match);
}

function normalizeText(text) {
  return text
    .replace(/\u00a0/g, " ")
    .replace(/[\u200b-\u200d\ufeff]/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n");
}

function applyEmDashes(text) {
  let result = text;
  // Tight em dashes without spaces: word—word → word, word
  result = result.replace(/(\w)—(\w)/g, "$1, $2");
  // Spaced em dashes used as parentheticals. Requires a non-space before the
  // match so line-leading dashes (attributions, lists) survive, and stays on
  // one line so newlines are never swallowed.
  result = result.replace(/(?<=\S)[ \t]*—[ \t]*/g, ", ");
  // Spaced en dash between words used as an em dash (number ranges are kept)
  result = result.replace(/(?<=[A-Za-z])[ \t]+–[ \t]+(?=[A-Za-z])/g, ", ");
  // Hyphen used as a dash between words; the lookbehind on a word character
  // keeps markdown list bullets at the start of a line intact
  result = result.replace(/(?<=\w)[ \t]+-[ \t]+(?=[A-Za-z])/g, ", ");
  // Collapse artifacts from the swaps above
  result = result.replace(/,\s*,/g, ",");
  result = result.replace(/,\s*([.!?;:])/g, "$1");
  return result;
}

const ABBREVIATION_BEFORE_BOUNDARY = /\b(?:e\.g|i\.e|etc|vs|cf|al)\.$/i;

function fixSentenceCase(text) {
  // Boundaries: start of text, end of a sentence, or a paragraph break.
  // Hard-wrapped lines mid-sentence are deliberately left alone.
  return text.replace(
    /(^|[.!?]\s+|\n\s*\n\s*)([a-z])/g,
    (match, boundary, letter, offset) => {
      const before = text.slice(Math.max(0, offset - 6), offset + 1);
      if (ABBREVIATION_BEFORE_BOUNDARY.test(before)) return match;
      return boundary + letter.toUpperCase();
    }
  );
}

const FORCED_SASS_RULES = [
  [/\.\s*But here(?:'s| is) the thing:\s*/gi, ". "],
  [/But here(?:'s| is) the thing:\s*/gi, ""],
  [/Then I realized:\s*/gi, "I realized "],
  [/Hot take:\s*/gi, ""],
  [/And honestly[?,]\s*/gi, ""],
  [/Spoiler alert:\s*/gi, ""],
  [/Let me be clear:\s*/gi, ""],
  [/Let's be (?:honest|real):\s*/gi, ""],
  [/Plot twist:\s*/gi, ""],
  [/Here's what nobody(?:'s| is) saying:\s*/gi, ""],
  [/But here(?:'s| is) the truth:\s*/gi, "but "],
];

function applyForcedSass(text) {
  return applyReplacements(text, FORCED_SASS_RULES);
}

const BUZZWORD_RULES = [
  // Phrases first so they win over single-word swaps
  [/\bleverag(?:e|es|ed|ing)\s+the\s+real\s+unlock\b/gi, "use what matters"],
  [/\bthe\s+real\s+unlock\b/gi, "what matters"],
  [/\breal\s+unlock\b/gi, "key point"],
  [/\bdelve\s+into\s+this(?:\s+(?:landscape|field))?\b/gi, "look into this"],
  [/\bdelve\s+into\s+the\s+(?:landscape|field)\b/gi, "look into the area"],
  [
    /\bdelv(e|es|ed|ing)\s+into\b/gi,
    pickForm({ e: "look into", es: "looks into", ed: "looked into", ing: "looking into" }),
  ],
  [/\bnavigate\s+(?:the|this)\s+(?:landscape|field)\b/gi, "work through the area"],
  [/\bplays\s+a\s+pivotal\s+role\b/gi, "plays a key role"],
  [/\bmarking\s+a\s+pivotal\s+moment\b/gi, "marking a turning point"],
  [/\bis\s+a\s+testament\s+to\b/gi, "shows"],
  [/\bstands\s+as\s+a\b/gi, "is a"],
  [/\bserves\s+as\s+a\b/gi, "is a"],
  [/\bserves\s+as\s+an\b/gi, "is an"],
  [/\bunderscor(e|es|ed|ing)\s+the\s+(?:importance|significance)\s+of\b/gi,
    pickForm({
      e: "show the importance of",
      es: "shows the importance of",
      ed: "showed the importance of",
      ing: "showing the importance of",
    }),
  ],
  [/\bhighlights?\s+the\s+(?:importance|significance)\s+of\b/gi, "shows the importance of"],
  [/\bvaluable\s+insights\b/gi, "insights"],
  [/\brich\s+tapestry\s+of\b/gi, "mix of"],
  [/\btapestry\s+of\b/gi, "mix of"],
  [/\bdigital\s+landscape\b/gi, "space"],
  [/\bevolving\s+landscape\b/gi, "changing field"],
  [/\bthis\s+landscape\b/gi, "this"],
  [/\bthe\s+landscape\b/gi, "the area"],
  [/\bdiverse\s+array\s+of\b/gi, "range of"],
  [/\bin\s+the\s+heart\s+of\b/gi, "in"],
  // Single words
  [/\bdelv(e|es|ed|ing)\b/gi, pickForm({ e: "explore", es: "explores", ed: "explored", ing: "exploring" })],
  [/\bleverag(e|es|ed|ing)\b/gi, pickForm({ e: "use", es: "uses", ed: "used", ing: "using" })],
  [/\bempower(s|ed|ing)?\b/gi, pickForm({ "": "enable", s: "enables", ed: "enabled", ing: "enabling" })],
  [/\belevat(e|es|ed|ing)\b/gi, pickForm({ e: "raise", es: "raises", ed: "raised", ing: "raising" })],
  [/\bnavigat(e|es|ed|ing)\b/gi, pickForm({ e: "handle", es: "handles", ed: "handled", ing: "handling" })],
  [/\bfoster(s|ed|ing)?\b/gi, pickForm({ "": "build", s: "builds", ed: "built", ing: "building" })],
  [/\butiliz(e|es|ed|ing)\b/gi, pickForm({ e: "use", es: "uses", ed: "used", ing: "using" })],
  [/\bboast(s)?\b/gi, pickForm({ "": "have", s: "has" })],
  [/\bbolster(s|ed|ing)?\b/gi, pickForm({ "": "support", s: "supports", ed: "supported", ing: "supporting" })],
  [/\bgarner(s|ed|ing)?\b/gi, pickForm({ "": "get", s: "gets", ed: "got", ing: "getting" })],
  [/\bshowcas(e|es|ed|ing)\b/gi, pickForm({ e: "show", es: "shows", ed: "showed", ing: "showing" })],
  [/\bemphasiz(e|es|ed|ing)\b/gi, pickForm({ e: "stress", es: "stresses", ed: "stressed", ing: "stressing" })],
  [/\benhanc(e|es|ed|ing)\b/gi, pickForm({ e: "improve", es: "improves", ed: "improved", ing: "improving" })],
  [/\bexemplif(y|ies|ied|ying)\b/gi, pickForm({ y: "show", ies: "shows", ied: "showed", ying: "showing" })],
  [/\bmeticulous(ly)?\b/gi, pickForm({ "": "careful", ly: "carefully" })],
  [/\bintricately\b/gi, "closely"],
  [/\bintricate\b/gi, "complex"],
  [/\btapestry\b/gi, "mix"],
  [/\binterplay\b/gi, "interaction"],
  [/\bpivotal\b/gi, "key"],
  [/\btestament\b/gi, "sign"],
  [/\bvibrant\b/gi, "lively"],
  [/\brobust\b/gi, "strong"],
  [/\bseamless\b/gi, "smooth"],
  [/\bcomprehensive\b/gi, "full"],
  [/\benduring\b/gi, "lasting"],
  [/\brenowned\b/gi, "known"],
  [/\bgroundbreaking\b/gi, "new"],
  [/\bcrucial\b/gi, "key"],
  [/\bparamount\b/gi, "main"],
];

function applyBuzzwords(text) {
  return applyReplacements(text, BUZZWORD_RULES);
}

const CLICHE_RULES = [
  [/In today's fast-paced (?:digital landscape|world),?\s*/gi, ""],
  [/In the (?:dynamic|ever-evolving) (?:world|landscape|field) of\s+/gi, "in "],
  [/As the world continues to evolve,?\s*/gi, ""],
  [/In an era of constant change,?\s*/gi, ""],
  [/(^|[.!?]\s+)(?:Additionally|Moreover|Furthermore),\s*/gim, "$1"],
  [/Nestled (?:within|in)\s+/gi, "in "],
  [/shouting into the void/gi, "posting online"],
  [/(^|[.!?]\s+)No fluff[.!]\s*/gim, "$1"],
  [/,\s*no fluff/gi, ""],
  [/cutting through the noise/gi, "getting to the point"],
  [/at the end of the day/gi, "ultimately"],
  [/it(?:'s| is) worth noting that\s*/gi, ""],
  [/it(?:'s| is) important to (?:note|recognize) that\s*/gi, ""],
  [/setting the stage for\s+/gi, "leading to "],
  [/reflects broader\s+/gi, "reflects "],
  [/contributing to the\s+/gi, "adding to the "],
  [/in conclusion/gi, "finally"],
];

function applyCliches(text) {
  return applyReplacements(text, CLICHE_RULES);
}

function applyFormulaic(text) {
  let result = text;
  result = result.replace(
    /It's not just ([^.]+)\.\s*It's also ([^.]+)\./gi,
    "It's $1 and $2."
  );
  result = result.replace(
    /It is not just ([^.]+)\.\s*It is also ([^.]+)\./gi,
    "It is $1 and $2."
  );
  result = result.replace(/That's the real unlock\b/gi, "That's what matters");
  result = result.replace(/That is the real unlock\b/gi, "That is what matters");
  result = result.replace(/not only ([^,]+?),?\s+but also\s+/gi, "$1 and ");
  result = result.replace(/It's not ([^,]+),\s*it's\s+/gi, "It's ");
  result = result.replace(/It is not ([^,]+),\s*it is\s+/gi, "It is ");
  // "No X. No Y. Just Z." → keep only the Z sentence
  result = result.replace(
    /No ([^.]+)\.\s*No ([^.]+)\.\s*Just ([^.]+)\./gi,
    (_, _n1, _n2, ending) => {
      const sentence = ending.trim();
      return `${sentence.charAt(0).toUpperCase()}${sentence.slice(1)}.`;
    }
  );
  return result;
}

const FILLER_PHRASE_RULES = [
  [/Here(?:'s| is) why that matters[.:]?\s*/gi, ""],
  [/Here(?:'s| is) the deal[.:]?\s*/gi, ""],
  [/Here(?:'s| is) what you need to know[.:]?\s*/gi, ""],
  [/The result\?\s*/gi, ""],
  [/The bottom line\?\s*/gi, ""],
  [/Long story short[,:]?\s*/gi, ""],
  [/At its core[,:]?\s*/gi, ""],
  [/Simply put[,:]?\s*/gi, ""],
  [/To put it simply[,:]?\s*/gi, ""],
  [/Needless to say[,:]?\s*/gi, ""],
  [/It(?:'s| is) important to note that\s*/gi, ""],
  [/It(?:'s| is) worth mentioning that\s*/gi, ""],
  [/Key highlights:\s*/gi, ""],
  [/In summary[,:]?\s*/gi, ""],
];

function applyFillerPhrases(text) {
  return applyReplacements(text, FILLER_PHRASE_RULES);
}

function applyDoublePunctuation(text) {
  return text.replace(/!{2,}/g, "!").replace(/\?{2,}/g, "?");
}

const TRANSITION_FILLER_RULES = [
  [/When it comes to\s+/gi, "for "],
  [/That being said,?\s*/gi, "but "],
  [/In other words,?\s*/gi, ""],
  [/On the other hand,?\s*/gi, "but "],
  [/(^|[.!?]\s+)(?:Therefore|Consequently|Subsequently|Nonetheless),?\s*/gim, "$1"],
  [/The reality is[,:]\s*/gi, ""],
  [/A key takeaway is[,:]\s*/gi, ""],
  [/From a broader perspective,?\s*/gi, ""],
  // Sentence-start only (case-sensitive on purpose) so mid-sentence
  // occurrences like "we live in a world where..." are not mangled
  [/(^|[.!?]\s+)In a world where\s+/g, "$1"],
  [/(^|[.!?]\s+)In today's world,?\s*/g, "$1"],
  [/Have you ever wondered(?: if| whether| why| how| what)?\s*/g, ""],
  [/Let(?:'s| us) unpack[.:]?\s*/gi, ""],
];

function applyTransitionFillers(text) {
  return applyReplacements(text, TRANSITION_FILLER_RULES);
}

const HEDGE_RULES = [
  [/Generally speaking,?\s*/gi, ""],
  [/Broadly speaking,?\s*/gi, ""],
  [/To some extent,?\s*/gi, ""],
  [/Arguably,?\s*/gi, ""],
  [/One might argue that\s*/gi, ""],
  [/It could be suggested that\s*/gi, ""],
  [/It should be mentioned that\s*/gi, ""],
  [/(^|[.!?]\s+)Indeed,?\s*/gim, "$1"],
];

function applyHedgePhrases(text) {
  return applyReplacements(text, HEDGE_RULES);
}

const CORPORATE_CLICHE_RULES = [
  // Phrases first so they win over single-word swaps
  [
    /\brevolutioniz(e|es|ed|ing)\s+the\s+way\b/gi,
    pickForm({ e: "change how", es: "changes how", ed: "changed how", ing: "changing how" }),
  ],
  [/\btransformative\s+(?:power|effect|impact)\b/gi, "major impact"],
  [/\bseamless\s+integration\b/gi, "smooth setup"],
  [/\bscalable\s+solution\b/gi, "system that can grow"],
  [/\bbest-in-class\b/gi, "top quality"],
  [/\bunparalleled\s+excellence\b/gi, "high quality"],
  [/\bparadigm\s+shift\b/gi, "big change"],
  [/\bgame[\s-]changer\b/gi, "major shift"],
  [/\bgame[\s-]changing\b/gi, "major"],
  [
    /\bmov(e|es|ed|ing)\s+the\s+needle\b/gi,
    pickForm({ e: "make progress", es: "makes progress", ed: "made progress", ing: "making progress" }),
  ],
  [/\bspeaks\s+volumes\b/gi, "says a lot"],
  [
    /\bpav(e|es|ed|ing)\s+the\s+way\s+for\b/gi,
    pickForm({ e: "lead to", es: "leads to", ed: "led to", ing: "leading to" }),
  ],
  [/\bcan(?:not|'t)\s+be\s+overstated\b/gi, "is significant"],
  [/\bunlock\s+the\s+power\s+of\b/gi, "use"],
  [
    /\bdoubl(e|es|ed|ing)\s+down\s+on\b/gi,
    pickForm({ e: "focus on", es: "focuses on", ed: "focused on", ing: "focusing on" }),
  ],
  [
    /\bshed(s|ding)?\s+light\s+on\b/gi,
    pickForm({ "": "explain", s: "explains", ding: "explaining" }),
  ],
  [
    /\bembark(s|ed|ing)?\s+(?:up)?on\b/gi,
    pickForm({ "": "start", s: "starts", ed: "started", ing: "starting" }),
  ],
  [
    /\bgrappl(e|es|ed|ing)\s+with\b/gi,
    pickForm({ e: "deal with", es: "deals with", ed: "dealt with", ing: "dealing with" }),
  ],
  [/\bplays\s+a\s+(?:crucial|vital|significant)\s+role\b/gi, "matters"],
  [/\bthought[\s-]provoking\b/gi, "interesting"],
  [/\bcutting[\s-]edge\b/gi, "latest"],
  // Single words
  [/\bsynerg(?:y|ies)\b/gi, "teamwork"],
  [
    /\bthought[\s-]lead(er|ers|ership)\b/gi,
    pickForm({ er: "expert", ers: "experts", ership: "expertise" }),
  ],
  [/\brealms\b/gi, "areas"],
  [/\brealm\b/gi, "area"],
  [/\bharness(es|ed|ing)?\b/gi, pickForm({ "": "use", es: "uses", ed: "used", ing: "using" })],
  [/\billuminat(e|es|ed|ing)\b/gi, pickForm({ e: "explain", es: "explains", ed: "explained", ing: "explaining" })],
  [/\bfacilitat(e|es|ed|ing)\b/gi, pickForm({ e: "help", es: "helps", ed: "helped", ing: "helping" })],
  [/\bstreamlin(e|es|ed|ing)\b/gi, pickForm({ e: "simplify", es: "simplifies", ed: "simplified", ing: "simplifying" })],
  [
    /\bdifferentiat(e|es|ed|ing)\b/gi,
    pickForm({ e: "distinguish", es: "distinguishes", ed: "distinguished", ing: "distinguishing" }),
  ],
  [/\bmultifaceted\b/gi, "complex"],
  [/\bunwavering\b/gi, "steady"],
  [/\bunyielding\b/gi, "firm"],
  [/\bnuanced\b/gi, "subtle"],
  [/\bnuances\b/gi, "details"],
  [/\bnuance\b/gi, "detail"],
];

function applyCorporateCliches(text) {
  return applyReplacements(text, CORPORATE_CLICHE_RULES);
}

const ACADEMIC_FORMAL_RULES = [
  [/our findings suggest(?: that)?\s+/gi, "we found "],
  [/this paper presents\s+/gi, "this covers "],
  [/important implications for\s+/gi, "effects on "],
  [/it remains to be seen/gi, "it's unclear"],
  [/further research is needed/gi, "more study is needed"],
  [/In this (?:article|guide|blog post),?\s*(?:we will|we'll|I will|I'll)\s*/gi, ""],
];

function applyAcademicFormal(text) {
  return applyReplacements(text, ACADEMIC_FORMAL_RULES);
}

function trimWhitespace(text) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .replace(/[ \t]+([.,!?;:])/g, "$1")
    .replace(/ {2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const RULE_APPLIERS = {
  emDashes: applyEmDashes,
  doublePunctuation: applyDoublePunctuation,
  fillerPhrases: applyFillerPhrases,
  forcedSass: applyForcedSass,
  cliches: applyCliches,
  formulaic: applyFormulaic,
  transitionFillers: applyTransitionFillers,
  hedgePhrases: applyHedgePhrases,
  buzzwords: applyBuzzwords,
  corporateCliches: applyCorporateCliches,
  academicFormal: applyAcademicFormal,
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
