/**
 * Single source of truth for every piece of portfolio content.
 *
 * Sections read from here, so copy changes never require touching layout code.
 * Nothing in this file is decorative — if it is here, it renders somewhere.
 */

// WebP conversions of the originals in ../Assets — 95% smaller, same images.
// The source PNG/JPEG files are kept alongside them untouched.
import MM from '../Assets/optimized/mantramountain.webp';
import Ludo from '../Assets/optimized/Ludo.webp';
import TH from '../Assets/optimized/travelHimalayan.webp';
import MMWP from '../Assets/optimized/mmimage.webp';
import hotair from '../Assets/optimized/hotair.webp';
import travel from '../Assets/optimized/Tiktok_MantraPokhara.webp';
import gym from '../Assets/optimized/gymThumbnail.webp';
import loseWeight from '../Assets/optimized/how to lose weight.webp';
import market from '../Assets/optimized/market.webp';
import handpan from '../Assets/optimized/handpan.webp';

export const PLACEHOLDER_IMAGE =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2U1ZTdlYiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBub3QgYXZhaWxhYmxlPC90ZXh0Pjwvc3ZnPg==';

export const profile = {
  name: 'Prabin Parajuli',
  role: 'Cloud Infrastructure / AWS / Cloud DX Engineer',
  shortRole: 'Cloud Infrastructure Engineer',
  location: 'Ichikawa, Chiba (Tokyo area), Japan',
  locationShort: 'Tokyo area, Japan',
  availability: 'Available for cloud & infrastructure roles in Japan',
  email: 'prabin.parajuli.jp@gmail.com',
  summary:
    'Previously full-stack and frontend focused. Now working deeper on cloud infrastructure, AWS operations, migration workflows, and automation, while continuing to build software end-to-end.',
  positioning:
    'I build practical systems across cloud operations and software. Current emphasis is AWS/infrastructure reliability, migration support, and documentation, backed by full-stack delivery experience.',
  contactIntro:
    'Open to Cloud Infrastructure / AWS / Cloud DX opportunities in Japan. Also available for roles blending cloud and software development.',
  links: {
    github: 'https://github.com/Prabin-496',
    linkedin: 'https://www.linkedin.com/in/prabin-parajuli-techie496/',
    instagram: 'https://www.instagram.com/prabi.jp/',
    photography: 'https://www.instagram.com/prabininthecity/',
  },
};

/** Headline numbers for the hero — scannable proof, not decoration. */
export const heroStats = [
  { value: '5+', label: 'Years building for production' },
  { value: 'AWS', label: 'Infrastructure & operations focus' },
  { value: 'JP', label: 'Based in Japan, work-ready' },
];

export const aboutPoints = [
  {
    text: 'Computer Science graduate (BSc Computing, London Metropolitan University), based in',
    emphasis: 'Ichikawa, Chiba (Tokyo area)',
    tail: '.',
  },
  {
    text: 'Current direction:',
    emphasis: 'Cloud Infrastructure / AWS / Cloud DX',
    tail: ' with focus on practical operations, migration reliability, and documentation.',
  },
  {
    text: 'Infrastructure topics in active practice:',
    emphasis: 'AWS, IAM/Security, monitoring, deployment, file-server migration (FSx), JP1, Robocopy, QoS, UAT/testing',
    tail: '.',
  },
  {
    text: 'Previous foundation remains strong:',
    emphasis: 'React, Next.js, TypeScript, Node.js, MERN, REST APIs, MySQL, WordPress, UI/UX',
    tail: '.',
  },
  {
    text: 'Japanese advantage:',
    emphasis: 'JLPT N2 in progress (December 2026 sitting)',
    tail: ', working daily in a Japanese-language IT environment, plus English proficiency for international teams.',
  },
  {
    text: 'Ongoing trajectory: Cloud + AI + DX tooling with strong software engineering fundamentals.',
    emphasis: '',
    tail: '',
  },
  {
    text: 'Video editing stays as a creative side project (kept on this portfolio as additional work).',
    emphasis: '',
    tail: '',
  },
];

export const aboutCard = {
  title: 'Cloud Infrastructure Engineer',
  body: 'Current focus on AWS, cloud operations, infrastructure migration, and automation with full-stack development as a core strength.',
  lines: [
    "Education: Bachelor's Degree in Computing",
    'London Metropolitan University',
    'Ichikawa, Chiba, Japan',
  ],
};

export type SkillGroup = { category: string; icon: string; skills: string[] };

export const skills: SkillGroup[] = [
  {
    category: 'Cloud / Infrastructure (Current)',
    icon: 'cloud',
    skills: [
      'AWS Fundamentals',
      'Cloud Infrastructure',
      'Cloud Operations',
      'Security / IAM',
      'Monitoring',
      'Deployment',
      'Infrastructure Documentation',
      'Migration Workflows (FSx / Robocopy)',
    ],
  },
  {
    category: 'Automation & Delivery',
    icon: 'git',
    skills: ['Git', 'GitHub', 'DevOps Concepts', 'UAT / Testing', 'JP1 & Operational Workflow', 'QoS Awareness'],
  },
  {
    category: 'Full-stack Foundation',
    icon: 'code',
    skills: ['React', 'Next.js', 'JavaScript', 'TypeScript', 'Node.js', 'REST APIs', 'MERN Stack', 'MySQL'],
  },
  {
    category: 'Web / UI Experience',
    icon: 'design',
    skills: ['Tailwind CSS', 'Responsive Design', 'UI/UX Design', 'WordPress', 'WooCommerce', 'SEO Optimization'],
  },
  {
    category: 'Future Direction',
    icon: 'spark',
    skills: ['Cloud Architecture', 'Developer Experience (DX)', 'Generative AI', 'AI-assisted Operations'],
  },
];

export const workExperience = [
  {
    id: 0,
    company: 'Current Professional Focus',
    position: 'Cloud Infrastructure / AWS / Cloud DX Engineer',
    location: 'Japan',
    period: '2025 - Present',
    description:
      'Focused on cloud infrastructure operations and migration-oriented workflows while building a strong bridge between infrastructure and software delivery.',
    highlights: [
      'Hands-on focus on AWS, infrastructure operations, and deployment reliability.',
      'Working with migration and file-server related workflows (including AWS FSx, Robocopy, and process documentation).',
      'Supporting operational quality through monitoring, security/IAM awareness, UAT/testing, and incident-ready documentation.',
      'Applying automation and developer-experience thinking to reduce manual operational friction.',
    ],
    technologies: ['AWS', 'Infrastructure', 'Cloud Operations', 'FSx', 'Robocopy', 'JP1', 'QoS', 'UAT', 'IAM', 'Monitoring', 'Automation'],
  },
  {
    id: 1,
    company: 'Mantra Mountain',
    position: 'Full-Stack Developer',
    location: 'Nepal',
    period: 'Jan 2024 - 2025',
    description:
      'Built the initial company website using the MERN stack. Currently managing the live WordPress site, optimizing UX and content. Improved booking workflows, performance, and SEO visibility.',
    highlights: [
      'Built a production-ready MERN web application foundation for company bookings and workflows.',
      'Managed the live WordPress experience, focusing on UI/UX, content clarity, and usability.',
      'Improved booking flow usability and reduced friction in key user steps.',
      'Optimized frontend performance and strengthened SEO visibility for important pages.',
    ],
    technologies: ['MERN Stack', 'WordPress', 'React', 'Node.js', 'MongoDB', 'SEO'],
  },
  {
    id: 2,
    company: 'Basiyo',
    position: 'Campaign Manager / Web & UI Operations',
    location: 'Nepal',
    period: 'Feb 2022 - 2024',
    description:
      'Managed frontend content and admin dashboards for digital campaigns. Optimized UI/UX of landing pages to improve user experience. Tracked performance metrics and coordinated updates with design and dev teams.',
    highlights: [
      'Owned frontend campaign updates and kept admin dashboards usable for the team.',
      'Improved landing page UI/UX to increase clarity, engagement, and user experience.',
      'Tracked performance metrics and coordinated fast iterations with design and development.',
    ],
    technologies: ['UI/UX Design', 'Admin Dashboards', 'Content Management', 'Performance Analytics'],
  },
  {
    id: 3,
    company: 'S.A I.T Solution and Trade Concern',
    position: 'Web Developer',
    location: 'Nepal',
    period: 'Mar 2020 - Jan 2022',
    description:
      'Developed and maintained business websites and landing pages. Implemented responsive UI designs and optimized site performance. Collaborated with clients to deliver functional, production-ready solutions.',
    highlights: [
      'Developed and maintained business websites and landing pages from requirements to production.',
      'Implemented responsive UI and performance improvements for better loading and UX.',
      'Collaborated with clients to deliver functional, production-ready solutions.',
    ],
    technologies: ['Web Development', 'Responsive Design', 'Client Collaboration', 'Performance Optimization'],
  },
];

export const projects = [
  {
    id: 1,
    title: 'Mantra Mountain',
    description:
      'A comprehensive trekking package booking application built with the MERN stack. Features user authentication, package browsing, booking management, and an admin dashboard.',
    image: MM,
    technologies: ['React', 'Node.js', 'Express', 'MongoDB', 'Tailwind CSS'],
    liveLink: 'https://mantra-mountain.vercel.app/',
    githubLink: 'https://github.com/prabin-496',
    category: 'fullstack',
  },
  {
    id: 2,
    title: 'Ludo Blockchain',
    description: 'A revolutionary blockchain-based ludo game built with the MERN stack and Solidity smart contracts.',
    image: Ludo,
    technologies: ['React', 'Solidity', 'Node.js', 'Express', 'MongoDB', 'Web3'],
    liveLink: 'https://solana-ludo-kings.vercel.app/',
    githubLink: 'https://github.com/prabin-496',
    category: 'blockchain',
  },
  {
    id: 3,
    title: 'Travel Himalayan',
    description: 'Professional travel agency website with booking functionality, built using WordPress.',
    image: TH,
    technologies: ['WordPress', 'PHP', 'MySQL'],
    liveLink: 'https://www.travelhimalayanepal.com/',
    githubLink: 'https://github.com/prabin-496',
    category: 'wordpress',
  },
  {
    id: 4,
    title: 'Mantra Mountain Nepal Treks',
    description: 'Next.js booking website for trekking and adventure activities with WhatsApp inquiry notifications.',
    image: MMWP,
    technologies: ['Next.js 16.2.0', 'React 18.3.1', 'Tailwind CSS', 'Material UI', 'PHP 8.2.29', 'MySQL', 'Turbopack', 'Vercel'],
    liveLink: 'https://www.mantramountain.com',
    githubLink: 'https://github.com/prabin-496',
    category: 'nextjs',
  },
  {
    id: 5,
    title: 'Waters Gold',
    description: 'Modern Retreat in Pokhara, Nepal serving Muay Thai and wellness programs.',
    image: PLACEHOLDER_IMAGE,
    technologies: ['WordPress', 'Custom CSS', 'JavaScript'],
    liveLink: 'https://watersgold.io/',
    githubLink: 'https://github.com/prabin-496',
    category: 'wordpress',
  },
  {
    id: 6,
    title: 'Singapore Handpans',
    description: 'E-commerce website for handcrafted handpans, showcasing instruments, sound samples, and brand story.',
    image: handpan,
    technologies: ['WordPress', 'Elementor', 'Custom CSS', 'JavaScript'],
    liveLink: 'https://singaporehandpans.com/',
    githubLink: 'https://github.com/prabin-496',
    category: 'wordpress',
  },
];

export const projectNarratives: Record<
  number,
  { problem: string[]; solution: string[]; result: string[]; features: string[] }
> = {
  1: {
    problem: [
      'Bookings were hard to manage and users needed a clear booking flow.',
      'The admin needed a simple way to manage packages, users, and bookings.',
    ],
    solution: [
      'Built a full MERN application with user authentication and an admin dashboard.',
      'Created responsive UI for package browsing and booking management.',
      'Designed the booking workflow to reduce friction and improve conversions.',
    ],
    result: [
      'Working booking system with admin-controlled data and user journeys.',
      'Improved UX, performance, and SEO visibility for key pages.',
    ],
    features: ['Booking workflow UX', 'Admin dashboard', 'Responsive UI', 'SEO visibility', 'Performance-focused frontend'],
  },
  2: {
    problem: [
      'Needed a modern frontend for a blockchain-based game experience.',
      'Required wallet-style interactions and smooth UX for game flows.',
    ],
    solution: [
      'Built a React UI integrated with a MERN backend and smart-contract logic.',
      'Implemented game interactions with Web3-friendly patterns.',
    ],
    result: ['A playable blockchain game frontend with clear UI flows.'],
    features: ['React UX for Web3', 'MERN architecture', 'Smart-contract integration', 'Performance-conscious UI'],
  },
  3: {
    problem: [
      'Wanted a professional marketing + booking experience for travel services.',
      'Needed fast loading pages and clear information hierarchy.',
    ],
    solution: [
      'Delivered a WordPress site with booking functionality.',
      'Optimized responsive layout and content structure for usability.',
    ],
    result: ['Production-ready travel website with booking-ready UX.'],
    features: ['Responsive WordPress UI', 'Information architecture', 'Usability-focused booking pages', 'SEO-ready content structure'],
  },
  4: {
    problem: [
      'Needed a clear and simple booking workflow for trekking and adventure activities.',
      'Wanted to receive booking inquiries instantly via WhatsApp rather than processing online payments.',
    ],
    solution: [
      'Built a multi-step booking workflow using Next.js, React, Tailwind CSS, and Material UI.',
      'Step 1: Users select activities/adventures they want.',
      'Step 2: Users select the number of people for each activity.',
      'Step 3: Display total amount dynamically based on selections.',
      'Step 4: Collect personal details for the booking.',
      'All booking information is sent as a structured message to WhatsApp for real-time notifications.',
      'Used PHP & MySQL to handle backend logic and store booking inquiries.',
    ],
    result: [
      'A fast, responsive, and mobile-friendly booking site.',
      'Simplified booking flow with instant WhatsApp notifications.',
      'No online payment required; admin can manage inquiries efficiently.',
    ],
    features: [
      'Next.js + React frontend',
      'Tailwind CSS responsive design',
      'Material UI components for modern UI',
      'Multi-step booking workflow',
      'Dynamic total calculation',
      'WhatsApp notifications for bookings',
      'PHP & MySQL backend for storing inquiries',
      'Performance-optimized and SEO-friendly',
    ],
  },
  5: {
    problem: ['Needed a modern brand website for programs and events.'],
    solution: [
      'Designed and implemented a WordPress site with custom CSS/JS.',
      'Improved UI clarity and page responsiveness across devices.',
    ],
    result: ['A polished, modern web presence for Waters Gold.'],
    features: ['Custom CSS/JS UI polish', 'Responsive performance', 'Program-focused layout'],
  },
  6: {
    problem: ['Needed an e-commerce experience with rich product storytelling.'],
    solution: ['Implemented an Elementor-based storefront with custom styles.'],
    result: ['E-commerce website featuring product samples and brand story.'],
    features: ['E-commerce UX', 'Custom UI components', 'Responsive storefront'],
  },
};

export const videoProjects = [
  {
    id: 1,
    title: 'Share Market Channel on TikTok',
    description:
      'Nepali share market news and financial knowledge sharing. Created engaging content with high retention rates using algorithm-optimized editing techniques.',
    thumbnail: market,
    videoLink: 'https://www.tiktok.com/@money_mantra_np',
    software: 'Final Cut Pro',
  },
  {
    id: 2,
    title: 'Adventure Travel Channel on TikTok',
    description:
      'Travel and places in Nepal with discount offers for travel and adventure activities. Focused on hook creation and audience retention strategies.',
    thumbnail: hotair,
    videoLink: 'https://www.tiktok.com/@this.is.non.perso',
    software: 'Final Cut Pro',
  },
  {
    id: 3,
    title: 'Travel Promo Video',
    description:
      'Cinematic travel promotional video showcasing the beauty of Nepal with optimized editing for social media engagement.',
    thumbnail: travel,
    videoLink: 'https://www.youtube.com/shorts/VpZ3d9gNN1o',
    software: 'Final Cut Pro',
  },
  {
    id: 4,
    title: 'Fitness Motivation',
    description:
      'High-energy fitness video focused on weight loss motivation with strategic hook placement and retention techniques.',
    thumbnail: loseWeight,
    videoLink: 'https://www.youtube.com/shorts/--vdahx_6Kc',
    software: 'Final Cut Pro',
  },
  {
    id: 5,
    title: 'Lifestyle Content',
    description:
      'Creative lifestyle video with dynamic editing, color grading, and algorithm-optimized pacing for maximum engagement.',
    thumbnail: gym,
    videoLink: 'https://www.youtube.com/shorts/5Cl9mI-2HoE',
    software: 'Final Cut Pro',
  },
];

export const education = [
  {
    id: 1,
    degree: "Bachelor's Degree in Computing",
    institution: 'London Metropolitan University',
    location: 'Informatics College Pokhara',
    period: 'Mar 2023 – Dec 2025',
    focus: 'Focus on Web Development, Software Engineering, Databases, and Application Design.',
  },
  {
    id: 2,
    degree: 'High School Diploma',
    institution: 'Motherland Secondary School',
    location: 'Nepal',
    period: 'Jan 2017 – Oct 2019',
    focus: 'Business Administration & Management',
  },
];

export const certifications = [
  'Figma for UX Design',
  'Learning npm',
  'Microsoft 365 Copilot First Look',
  'Objects in JavaScript',
  'React & Node.js (Multiple Certifications)',
];

export const languages = [
  { name: 'English', level: 'Fluent' },
  { name: 'Nepali', level: 'Native' },
  { name: 'Japanese', level: 'JLPT N2 in progress (Dec 2026) · working daily in a Japanese IT environment' },
];

export const japanReadiness = {
  intro:
    'Hiring in Japan is a strong fit. I can contribute in cloud/infrastructure operations now while continuing to deliver software solutions.',
  cards: [
    {
      label: 'Based in Japan',
      points: ['Ichikawa, Chiba (Tokyo area)', 'Available for cloud & infrastructure roles in Japan', 'Ready for interviews and onboarding'],
    },
    {
      label: 'English + Japanese',
      points: [] as string[], // filled from `languages`
    },
    {
      label: 'Team-ready engineer',
      points: [
        'Cloud-infrastructure mindset (operations, migration, reliability)',
        'Works well with designers (Figma/UI/UX)',
        'Keeps full-stack skills active for cloud + development hybrid work',
      ],
    },
  ],
};

/** Things built on this site itself — live proof of the infra work. */
export const builtHere = [
  {
    title: 'Japanese Flashcards',
    href: '/flashcards',
    description:
      'Anki-style spaced repetition with an SM-2 scheduler, 5,700+ cards, and DynamoDB persistence behind serverless functions.',
    stack: ['Vercel Functions', 'DynamoDB', 'React', 'SM-2'],
  },
  {
    title: 'Voice AI Transcriber',
    href: '/voice-ai/',
    description:
      'Chunked browser recording with Gemini transcription and summarisation, backed by SQLite and an installable PWA shell.',
    stack: ['Gemini', 'Express', 'SQLite', 'PWA'],
  },
];

export const navLinks = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'skills', label: 'Skills' },
  { id: 'experience', label: 'Experience' },
  { id: 'projects', label: 'Projects' },
  { id: 'video-editing', label: 'Video' },
  { id: 'japan', label: 'Japan' },
  { id: 'contact', label: 'Contact' },
];
