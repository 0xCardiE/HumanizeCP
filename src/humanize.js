export const DEFAULT_SETTINGS = {
  emDashes: true,
  doublePunctuation: true,
  fillerPhrases: true,
  forcedSass: true,
  cliches: true,
  formulaic: true,
  buzzwords: true,
  transitionFillers: true,
  hedgePhrases: true,
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
      'Remove cautious openers like "arguably", "generally speaking", and "one might argue that".',
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

function replaceAll(text, pattern, replacement) {
  return text.replace(pattern, replacement);
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
    [/\balign(?:s|ed|ing)?\s+with\b/gi, "matches"],
    [/\bplays\s+a\s+pivotal\s+role\b/gi, "plays a key role"],
    [/\bmarking\s+a\s+pivotal\s+moment\b/gi, "marking a turning point"],
    [/\bis\s+a\s+testament\s+to\b/gi, "shows"],
    [/\bstands\s+as\s+a\b/gi, "is a"],
    [/\bserves\s+as\s+a\b/gi, "is a"],
    [/\bserves\s+as\s+an\b/gi, "is an"],
    [/\bunderscores?\s+the\s+(?:importance|significance)\s+of\b/gi, "shows the importance of"],
    [/\bhighlights?\s+the\s+(?:importance|significance)\s+of\b/gi, "shows the importance of"],
    [/\bvaluable\s+insights\b/gi, "insights"],
    [/\brich\s+tapestry\s+of\b/gi, "mix of"],
    [/\btapestry\s+of\b/gi, "mix of"],
    [/\bdigital\s+landscape\b/gi, "space"],
    [/\bevolving\s+landscape\b/gi, "changing field"],
    [/\bthis\s+landscape\b/gi, "this"],
    [/\bthe\s+landscape\b/gi, "the area"],
    [/\bcommitment\s+to\b/gi, "focus on"],
    [/\bdiverse\s+array\s+of\b/gi, "range of"],
    [/\bin\s+the\s+heart\s+of\b/gi, "in"],
  ];

  const wordMap = [
    [/\bdelve\b/gi, "explore"],
    [/\bleverag(?:e|ing)\b/gi, (match) => (match.toLowerCase().endsWith("ing") ? "using" : "use")],
    [/\bempower(?:s|ed|ing)?\b/gi, (m) => (m.toLowerCase().endsWith("ing") ? "enabling" : m.toLowerCase().endsWith("ed") ? "enabled" : m.toLowerCase().endsWith("s") ? "enables" : "enable")],
    [/\belevat(?:e|es|ed|ing)\b/gi, (m) => (m.toLowerCase().includes("ing") ? "raising" : m.toLowerCase().endsWith("s") ? "raises" : m.toLowerCase().endsWith("ed") ? "raised" : "raise")],
    [/\btapestry\b/gi, "mix"],
    [/\bnavigat(?:e|es|ed|ing)\b/gi, (m) => (m.toLowerCase().includes("ing") ? "handling" : m.toLowerCase().endsWith("s") ? "handles" : m.toLowerCase().endsWith("ed") ? "handled" : "handle")],
    [/\bfoster(?:s|ed|ing)?\b/gi, (m) => (m.toLowerCase().endsWith("ing") ? "building" : m.toLowerCase().endsWith("ed") ? "built" : m.toLowerCase().endsWith("s") ? "builds" : "build")],
    [/\butiliz(?:e|es|ed|ing)\b/gi, (m) => (m.toLowerCase().includes("ing") ? "using" : m.toLowerCase().endsWith("s") ? "uses" : m.toLowerCase().endsWith("ed") ? "used" : "use")],
    [/\bboasts?\b/gi, (m) => (m.toLowerCase().endsWith("s") ? "has" : "has")],
    [/\bbolster(?:s|ed|ing)?\b/gi, (m) => (m.toLowerCase().endsWith("ing") ? "supporting" : m.toLowerCase().endsWith("ed") ? "supported" : m.toLowerCase().endsWith("s") ? "supports" : "support")],
    [/\bgarner(?:s|ed|ing)?\b/gi, (m) => (m.toLowerCase().endsWith("ing") ? "getting" : m.toLowerCase().endsWith("ed") ? "got" : m.toLowerCase().endsWith("s") ? "gets" : "get")],
    [/\bshowcas(?:e|es|ed|ing)\b/gi, (m) => (m.toLowerCase().includes("ing") ? "showing" : m.toLowerCase().endsWith("s") ? "shows" : m.toLowerCase().endsWith("ed") ? "showed" : "show")],
    [/\bemphasiz(?:e|es|ed|ing)\b/gi, (m) => (m.toLowerCase().includes("ing") ? "stressing" : m.toLowerCase().endsWith("s") ? "stresses" : m.toLowerCase().endsWith("ed") ? "stressed" : "stress")],
    [/\benhanc(?:e|es|ed|ing)\b/gi, (m) => (m.toLowerCase().includes("ing") ? "improving" : m.toLowerCase().endsWith("s") ? "improves" : m.toLowerCase().endsWith("ed") ? "improved" : "improve")],
    [/\bintricat(?:e|es|ely)\b/gi, (m) => (m.toLowerCase().includes("ly") ? "closely" : m.toLowerCase().endsWith("s") ? "details" : "complex")],
    [/\binterplay\b/gi, "interaction"],
    [/\bmeticulous(?:ly)?\b/gi, (m) => (m.toLowerCase().includes("ly") ? "carefully" : "careful")],
    [/\bpivotal\b/gi, "key"],
    [/\btestament\b/gi, "sign"],
    [/\bvibrant\b/gi, "lively"],
    [/\brobust\b/gi, "strong"],
    [/\bseamless\b/gi, "smooth"],
    [/\bcomprehensive\b/gi, "full"],
    [/\bgrounded\b/gi, "practical"],
    [/\benduring\b/gi, "lasting"],
    [/\brenowned\b/gi, "known"],
    [/\bgroundbreaking\b/gi, "new"],
    [/\bexemplif(?:y|ies|ied|ying)\b/gi, (m) => (m.toLowerCase().includes("ying") || m.toLowerCase().includes("ies") ? "shows" : m.toLowerCase().endsWith("ied") ? "showed" : "show")],
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
    [/(^|[.!?]\s+)Additionally,\s*/gim, "$1"],
    [/(^|[.!?]\s+)Moreover,\s*/gim, "$1"],
    [/(^|[.!?]\s+)Furthermore,\s*/gim, "$1"],
    [/Nestled (?:within|in)\s+/gi, "In "],
    [/shouting into the void/gi, "posting online"],
    [/no fluff/gi, ""],
    [/cutting through the noise/gi, ""],
    [/at the end of the day/gi, "ultimately"],
    [/it's worth noting that\s*/gi, ""],
    [/it is worth noting that\s*/gi, ""],
    [/it's important to (?:note|recognize) that\s*/gi, ""],
    [/it is important to (?:note|recognize) that\s*/gi, ""],
    [/setting the stage for\s+/gi, "leading to "],
    [/reflects broader\s+/gi, "reflects "],
    [/contributing to the\s+/gi, "adding to the "],
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
  result = replaceAll(
    result,
    /(?:^|[.!?]\s+)Not only [^.]+\.\s*/gi,
    (match) => match.match(/^([.!?]\s+)/)?.[1] ?? ""
  );
  result = replaceAll(result, /not only ([^,]+?),?\s+but also\s+/gi, "$1 and ");
  result = replaceAll(
    result,
    /It's not ([^,]+),\s*it's\s+/gi,
    "It's "
  );
  result = replaceAll(
    result,
    /It is not ([^,]+),\s*it is\s+/gi,
    "It is "
  );
  result = replaceAll(
    result,
    /No ([^.]+)\.\s*No ([^.]+)\.\s*Just ([^.]+)\./gi,
    (_, _n1, _n2, ending) => {
      const words = ending.trim().split(/\s+/);
      if (words.length <= 2) return "";
      const sentence = ending.trim();
      return `${sentence.charAt(0).toUpperCase()}${sentence.slice(1)}. `;
    }
  );
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
    [/It is important to note that\s*/gi, ""],
    [/It's important to note that\s*/gi, ""],
    [/It is worth mentioning that\s*/gi, ""],
    [/It's worth mentioning that\s*/gi, ""],
    [/Key highlights:\s*/gi, ""],
    [/In summary[,:]?\s*/gi, ""],
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

function applyTransitionFillers(text) {
  const replacements = [
    [/When it comes to\s+/gi, "For "],
    [/That being said,?\s*/gi, "But "],
    [/In other words,?\s*/gi, ""],
    [/On the other hand,?\s*/gi, "But "],
    [/(^|[.!?]\s+)Therefore,?\s*/gim, "$1"],
    [/(^|[.!?]\s+)Consequently,?\s*/gim, "$1"],
    [/(^|[.!?]\s+)Subsequently,?\s*/gim, "$1"],
    [/(^|[.!?]\s+)Nonetheless,?\s*/gim, "$1"],
    [/The reality is,?\s*/gi, ""],
    [/A key takeaway is,?\s*/gi, ""],
    [/From a broader perspective,?\s*/gi, ""],
    [/In a world where\s+/gi, ""],
    [/In today's world,?\s*/gi, ""],
    [/Have you ever wondered(?: if| whether| why| how| what)?\s*/gi, ""],
    [/Let's unpack[.:]?\s*/gi, ""],
    [/Let us unpack[.:]?\s*/gi, ""],
  ];
  let result = text;
  for (const [pattern, replacement] of replacements) {
    result = replaceAll(result, pattern, replacement);
  }
  return result;
}

function applyHedgePhrases(text) {
  const replacements = [
    [/Generally speaking,?\s*/gi, ""],
    [/Broadly speaking,?\s*/gi, ""],
    [/To some extent,?\s*/gi, ""],
    [/Arguably,?\s*/gi, ""],
    [/One might argue that\s*/gi, ""],
    [/It could be suggested that\s*/gi, ""],
    [/It should be mentioned that\s*/gi, ""],
    [/(^|[.!?]\s+)Indeed,?\s*/gim, "$1"],
  ];
  let result = text;
  for (const [pattern, replacement] of replacements) {
    result = replaceAll(result, pattern, replacement);
  }
  return result;
}

function applyCorporateCliches(text) {
  const phraseMap = [
    [/\brevolutioniz(?:e|es|ed|ing)\s+the\s+way\b/gi, "change how"],
    [/\btransformative\s+(?:power|effect|impact)\b/gi, "major impact"],
    [/\bseamless\s+integration\b/gi, "smooth setup"],
    [/\bscalable\s+solution\b/gi, "system that can grow"],
    [/\bbest-in-class\b/gi, "top quality"],
    [/\bunparalleled\s+excellence\b/gi, "high quality"],
    [/\bparadigm\s+shift\b/gi, "big change"],
    [/\bgame[\s-]changer\b/gi, "major shift"],
    [/\bgame[\s-]changing\b/gi, "major"],
    [/\bmove\s+the\s+needle\b/gi, "make progress"],
    [/\bspeaks\s+volumes\b/gi, "says a lot"],
    [/\bpaving\s+the\s+way\s+for\b/gi, "leading to"],
    [/\bcannot\s+be\s+overstated\b/gi, "is significant"],
    [/\bcan(?:not|'t)\s+be\s+overstated\b/gi, "is significant"],
    [/\bunlock\s+the\s+power\s+of\b/gi, "use"],
    [/\bdouble\s+down\s+on\b/gi, "focus on"],
    [/\bshed\s+light\s+on\b/gi, "explain"],
    [/\bembark\s+on\b/gi, "start"],
    [/\bgrapple\s+with\b/gi, "deal with"],
    [/\bplays\s+a\s+(?:crucial|vital|significant)\s+role\b/gi, "matters"],
    [/\bthought[\s-]provoking\b/gi, "interesting"],
    [/\bcutting[\s-]edge\b/gi, "latest"],
  ];

  const wordMap = [
    [/\bsynerg(?:y|ies)\b/gi, (m) => (m.toLowerCase().endsWith("ies") ? "teamwork" : "teamwork")],
    [/\bthought[\s-]lead(?:er|ers|ership)\b/gi, (m) =>
      m.toLowerCase().includes("ship") ? "expertise" : m.toLowerCase().endsWith("s") ? "experts" : "expert"],
    [/\brealm\b/gi, "area"],
    [/\brealms\b/gi, "areas"],
    [/\bharness(?:es|ed|ing)?\b/gi, (m) =>
      m.toLowerCase().endsWith("ing") ? "using" : m.toLowerCase().endsWith("ed") ? "used" : m.toLowerCase().endsWith("es") ? "uses" : "use"],
    [/\billuminat(?:e|es|ed|ing)\b/gi, (m) =>
      m.toLowerCase().includes("ing") ? "explaining" : m.toLowerCase().endsWith("s") ? "explains" : m.toLowerCase().endsWith("ed") ? "explained" : "explain"],
    [/\bfacilitat(?:e|es|ed|ing)\b/gi, (m) =>
      m.toLowerCase().includes("ing") ? "helping" : m.toLowerCase().endsWith("s") ? "helps" : m.toLowerCase().endsWith("ed") ? "helped" : "help"],
    [/\bstreamlin(?:e|es|ed|ing)\b/gi, (m) =>
      m.toLowerCase().includes("ing") ? "simplifying" : m.toLowerCase().endsWith("s") ? "simplifies" : m.toLowerCase().endsWith("ed") ? "simplified" : "simplify"],
    [/\bdifferentiat(?:e|es|ed|ing)\b/gi, (m) =>
      m.toLowerCase().includes("ing") ? "distinguishing" : m.toLowerCase().endsWith("s") ? "distinguishes" : m.toLowerCase().endsWith("ed") ? "distinguished" : "distinguish"],
    [/\bmultifaceted\b/gi, "complex"],
    [/\bunwavering\b/gi, "steady"],
    [/\bunyielding\b/gi, "firm"],
    [/\bcompelling\b/gi, "strong"],
    [/\bfundamentally\b/gi, ""],
    [/\bnuanc(?:e|es|ed)\b/gi, (m) =>
      m.toLowerCase().endsWith("es") ? "details" : m.toLowerCase().endsWith("ed") ? "subtle" : "detail"],
    [/\bnuanced\b/gi, "subtle"],
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

function applyAcademicFormal(text) {
  const replacements = [
    [/Our findings suggest(?: that)?\s*/gi, "We found "],
    [/our findings suggest(?: that)?\s*/gi, "we found "],
    [/This paper presents\s+/gi, "This covers "],
    [/this paper presents\s+/gi, "this covers "],
    [/Important implications for\s+/gi, "Effects on "],
    [/important implications for\s+/gi, "effects on "],
    [/It remains to be seen(?: whether| if)?\s*/gi, "It's unclear "],
    [/it remains to be seen(?: whether| if)?\s*/gi, "it's unclear "],
    [/Further research is needed(?: to)?\s*/gi, "More study is needed "],
    [/further research is needed(?: to)?\s*/gi, "more study is needed "],
    [/In this (?:article|guide|blog post),?\s*(?:we will|we'll|I will|I'll)\s*/gi, ""],
  ];
  let result = text;
  for (const [pattern, replacement] of replacements) {
    result = replaceAll(result, pattern, replacement);
  }
  return result;
}

function trimWhitespace(text) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
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
