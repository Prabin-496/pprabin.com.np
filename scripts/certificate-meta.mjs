/**
 * Derive a certificate's title, issuer and category from its filename alone.
 *
 * This is what makes "drop a PDF in public/certificates/ and push" work: the
 * build re-derives every entry, so a new file is categorised without anyone
 * editing a manifest. Anything the rules get wrong can be corrected by name in
 * `src/content/certificate-overrides.ts`, which always wins.
 */

/** Words that must not be naively title-cased. */
const LITERALS = new Map(
  Object.entries({
    aws: 'AWS',
    api: 'API',
    apis: 'APIs',
    css: 'CSS',
    html: 'HTML',
    ui: 'UI',
    ux: 'UX',
    pc: 'PC',
    ai: 'AI',
    npm: 'npm',
    sql: 'SQL',
    iam: 'IAM',
    ios: 'iOS',
    php: 'PHP',
    xml: 'XML',
    json: 'JSON',
    ssh: 'SSH',
    dns: 'DNS',
    vpn: 'VPN',
    tcp: 'TCP',
    ip: 'IP',
    oop: 'OOP',
    ci: 'CI',
    cd: 'CD',
    id: 'ID',
    it: 'IT',
    'objectoriented': 'Object-Oriented',
    javascript: 'JavaScript',
    typescript: 'TypeScript',
    nodejs: 'Node.js',
    openai: 'OpenAI',
    chatgpt: 'ChatGPT',
    github: 'GitHub',
    gitlab: 'GitLab',
    wordpress: 'WordPress',
    mysql: 'MySQL',
    postgresql: 'PostgreSQL',
    mongodb: 'MongoDB',
    linkedin: 'LinkedIn',
    devops: 'DevOps',
    handson: 'Hands-On',
    restful: 'RESTful',
    'asp': 'ASP',
    net: 'NET',
  })
);

/** Small words that stay lowercase unless they open the title. */
const MINOR = new Set([
  'a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'from', 'in', 'of', 'on',
  'or', 'the', 'to', 'with',
]);

/** Multi-word fixups applied after title-casing. */
const PHRASE_FIXES = [
  [/\bReact Js\b/gi, 'React.js'],
  [/\bNode Js\b/gi, 'Node.js'],
  [/\bVue Js\b/gi, 'Vue.js'],
  [/\bNext Js\b/gi, 'Next.js'],
  [/\bASP NET\b/g, 'ASP.NET'],
  [/\bObject Oriented\b/gi, 'Object-Oriented'],
  [/\bHands On\b/gi, 'Hands-On'],
  [/\bFirst Look\b/gi, 'First Look'],
];

/**
 * Course series that read better with a colon, e.g.
 * "Programming Foundations Algorithms" -> "Programming Foundations: Algorithms".
 */
const SERIES = [
  'Programming Foundations',
  'Networking Foundations',
  'Business Analysis Foundations',
  'Cisco Networking Foundations',
  'Java Essential Training',
  'Learning Arduino',
  'Generative AI',
  'OpenAI API',
  'Microsoft 365 Copilot',
];

/** Strip the download noise LinkedIn and friends put in front of a filename. */
export function baseName(filename) {
  return filename
    .replace(/\.[^.]+$/, '')
    .replace(/^CertificateOfCompletion[_-]*/i, '')
    .replace(/\s*[-_]?\s*Copy$/i, '')
    .replace(/\s*\(\d+\)$/, '')
    .replace(/[_]+/g, ' ')
    .replace(/-+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Normalised lowercase form used for keyword matching. */
export function searchable(filename) {
  return ` ${baseName(filename).toLowerCase()} `;
}

export function deriveTitle(filename) {
  const words = baseName(filename).split(' ').filter(Boolean);

  let title = words
    .map((word, i) => {
      const lower = word.toLowerCase();
      if (LITERALS.has(lower)) return LITERALS.get(lower);
      if (i > 0 && MINOR.has(lower)) return lower;
      // Leave a word that already mixes case alone (e.g. "iPhone").
      if (/[a-z][A-Z]/.test(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');

  for (const [pattern, replacement] of PHRASE_FIXES) {
    title = title.replace(pattern, replacement);
  }

  for (const series of SERIES) {
    if (title.startsWith(`${series} `) && !title.startsWith(`${series}:`)) {
      title = `${series}: ${title.slice(series.length + 1)}`;
      break;
    }
  }

  // A minor word is only lowercase mid-sentence; after a colon it starts one.
  title = title.replace(/: ([a-z])/g, (_, c) => `: ${c.toUpperCase()}`);

  // The issuer is displayed beside the title, so repeating it reads as a stutter.
  const issuer = deriveIssuer(filename);
  if (issuer && title.toLowerCase().startsWith(`${issuer.toLowerCase()} `)) {
    title = title.slice(issuer.length + 1);
  }

  return title;
}

export function deriveIssuer(filename) {
  const text = searchable(filename);
  // The original download name is the strongest signal and survives renaming
  // less often, so check the explicit brands first.
  if (/\baws\b/.test(text) && /academy/.test(text)) return 'AWS Academy';
  if (/\baws\b/.test(text)) return 'AWS';
  if (/coursera/.test(text)) return 'Coursera';
  if (/udemy/.test(text)) return 'Udemy';
  if (/credly/.test(text)) return 'Credly';
  if (/freecodecamp/.test(text)) return 'freeCodeCamp';
  if (/google/.test(text)) return 'Google';
  if (/\bcisco\b/.test(text)) return 'LinkedIn Learning';
  if (/microsoft/.test(text) && /linkedin/.test(text)) return 'Microsoft & LinkedIn';
  if (/microsoft/.test(text)) return 'Microsoft';
  if (/^CertificateOfCompletion/i.test(filename)) return 'LinkedIn Learning';
  return 'LinkedIn Learning';
}

/**
 * Category rules, in priority order — the first match wins.
 *
 * Order carries real weight. "Programming Foundations: Object-Oriented Design"
 * has to be caught by the series rule before the Design rule sees "design";
 * "JavaScript Essential Training" must not match Java, which is why that rule
 * uses a word boundary.
 */
const RULES = [
  ['Cloud & Infrastructure', /\baws\b|\bcloud\b|azure|\bgcp\b|terraform|docker|kubernetes|serverless|devops|\bs3\b|\bec2\b|infrastructure/],
  ['Networking & Linux', /network|cisco|routing|\blinux\b|\bdns\b|\bvpn\b|\btcp\b|subnet|firewall/],
  ['Programming Foundations', /programming foundations/],
  ['AI & Prompt Engineering', /\bai\b|openai|chatgpt|copilot|generative|prompt|machine learning|\bllm\b|neural/],
  ['Design & Accessibility', /figma|design|\bux\b|\bui\b|accessibility|photoshop|illustrator|typography|graphic/],
  ['Tooling & Practices', /\bgit\b|github|agile|scrum|chrome|devtools|developer tools|kanban|\bjira\b/],
  ['Hardware & Systems', /hardware|arduino|raspberry|\biot\b|pc build|from the bench|circuit/],
  ['Java', /\bjava\b/],
  ['Web Development', /html|css|javascript|typescript|react|\bnode\b|express|bootstrap|wordpress|\basp\b|\bnpm\b|python|django|flask|\bapi\b|\bapis\b|frontend|\bweb\b|tailwind|\bvue\b|angular/],
  ['Career & Business', /career|business|leadership|communication|project management|software development|interview|resume/],
];

export const FALLBACK_CATEGORY = 'Other';

export function deriveCategory(filename) {
  const text = searchable(filename);
  for (const [category, pattern] of RULES) {
    if (pattern.test(text)) return category;
  }
  return FALLBACK_CATEGORY;
}

export function deriveCertificate(filename) {
  return {
    title: deriveTitle(filename),
    issuer: deriveIssuer(filename),
    category: deriveCategory(filename),
    file: filename,
  };
}
