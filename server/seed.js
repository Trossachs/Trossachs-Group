
/* Starter content. Everything here is editable from /admin/dashboard.
   Nothing below claims metrics, certifications or proprietary technology. */

const singletons = {
  site: {
    name: 'Trossachs Group',
    tagline: 'Digital Experiences • Web Development • AI',
    title: 'Trossachs Group — Web Development, AI & Digital Experiences',
    description:
      'Trossachs Group builds modern websites, AI-powered applications and interactive digital experiences that help businesses turn ideas into useful products.',
    logo: '',
    favicon: '',
    ogImage: '',
    accentColor: '#8aa4c0',
    defaultTheme: 'system',
    navCtaLabel: 'Start a Project',
    navCtaHref: '#contact',
  },
  hero: {
    eyebrow: 'Digital Experiences • Web Development • AI',
    headline: 'We Build Digital Experiences That Move Ideas Forward.',
    description:
      'Trossachs Group creates modern websites, AI-powered applications and interactive digital experiences designed to help businesses turn ideas into useful products.',
    ctaPrimaryLabel: 'View Our Work',
    ctaPrimaryHref: '#work',
    ctaSecondaryLabel: 'Start a Project',
    ctaSecondaryHref: '#contact',
    heroImage: '',
    scene3d: 'full',
    sceneIntensity: 'normal',
  },
  about: {
    headline: 'We turn ideas into working digital products.',
    body:
      'Trossachs Group brings together web development, thoughtful interface design and AI tooling to build products that are practical to use and straightforward to maintain. The aim is simple: take an idea from a conversation to something people can actually open, use and rely on.',
    capabilities: ['Web development', 'Modern UI/UX', 'AI', 'Automation', 'Interactive experiences', 'Responsive engineering'],
    flow: ['Idea', 'Design', 'Build', 'Test', 'Deploy', 'Grow'],
    developerHeadline: 'The person behind Trossachs Group',
    developerName: 'Prince Beckham',
    developerTitle: 'Founder / Web Developer',
    developerBio:
      "I’m a web developer and law student with a strong interest in technology, AI and digital product development. I enjoy turning ideas into functional websites and applications, combining clean interfaces with modern development tools and AI-powered workflows.",
    developerImage: '',
    experience: [
      'Business websites',
      'Healthcare websites',
      'Agricultural websites',
      'Interactive web experiences',
      'AI applications',
      'AI companion systems',
      'Social / discovery concepts',
    ],
  },
  philosophy: {
    eyebrow: 'Philosophy',
    headline: 'Technology should serve the experience.',
  },
  ai: {
    eyebrow: 'AI & Technology',
    headline: 'Building With Intelligence',
    intro:
      'Modern AI tools are part of how Trossachs Group designs, prototypes and builds. They speed up the work and open up new kinds of products. They are tools in the workflow, not a substitute for judgement, testing or craft.',
    topics: [
      { title: 'Conversational AI', text: 'Chat experiences that keep context and feel natural to talk to.' },
      { title: 'AI agents', text: 'Assistants that can follow a workflow and help complete a task.' },
      { title: 'AI-generated interfaces', text: 'Using AI to explore layouts and ideas quickly, then refining them by hand.' },
      { title: 'Intelligent matching', text: 'Connecting people, content or capabilities based on what they need.' },
      { title: 'Automation', text: 'Removing repetitive steps from everyday business processes.' },
      { title: 'AI-assisted development', text: 'Faster prototyping and iteration, with every result reviewed and tested.' },
      { title: 'Image generation', text: 'Visual identities and avatars created with generative tools.' },
      { title: 'Voice interfaces', text: 'Speech input and output for products that are easier to use hands-free.' },
      { title: 'Interactive AI experiences', text: 'Products where the AI is part of the interface, not a bolt-on.' },
    ],
    note: 'Trossachs Group builds on existing AI platforms and APIs. It does not claim proprietary AI models.',
  },
  stack: {
    eyebrow: 'Toolbox',
    headline: 'Technology stack',
    note: 'The tools used across projects. Individual projects list only what they actually use.',
    items: [
      { name: 'HTML', group: 'Front end' },
      { name: 'CSS', group: 'Front end' },
      { name: 'JavaScript', group: 'Front end' },
      { name: 'TypeScript', group: 'Front end' },
      { name: 'React', group: 'Front end' },
      { name: 'Vite', group: 'Front end' },
      { name: 'Three.js', group: 'Interactive' },
      { name: 'Responsive web design', group: 'Interactive' },
      { name: 'AI APIs', group: 'AI' },
      { name: 'REST APIs', group: 'Back end' },
      { name: 'Modern back-end technologies', group: 'Back end' },
    ],
  },
  contact: {
    eyebrow: 'Contact',
    headline: "Have an idea? Let's build it.",
    intro: 'Tell me what you want to build. A few details are enough to get started, and I will reply personally.',
    email: '',
    phone: '',
    upwork: '',
    linkedin: '',
    github: '',
    submitLabel: 'Send Project Brief',
    successMessage: 'Thank you. Your brief has been received and you will hear back soon.',
    projectTypes: ['Business website', 'Web application', 'AI-powered application', 'Interactive / 3D experience', 'Something else'],
    budgetRanges: ['Not sure yet', 'Under $500', '$500 – $1,500', '$1,500 – $5,000', '$5,000+'],
    formEnabled: true,
  },
  footer: {
    text: 'Digital experiences, web development and AI.',
    copyright: '© {year} Trossachs Group. All rights reserved.',
    links: [
      { label: 'Work', href: '#work' },
      { label: 'Services', href: '#services' },
      { label: 'Contact', href: '#contact' },
    ],
    showBackToTop: true,
  },
};

const nav = [
  ['Home', '#top'],
  ['About', '#about'],
  ['Services', '#services'],
  ['Work', '#work'],
  ['AI & Technology', '#ai'],
  ['Contact', '#contact'],
].map(([label, href]) => ({ label, href, visible: true }));

const services = [
  {
    title: 'Web Development',
    icon: 'code',
    description: 'Responsive, modern websites and web applications built around real business objectives.',
    details:
      'From a single marketing site to a multi-page web application: structured content, fast loading, clean code and a result that is easy to maintain and extend.',
  },
  {
    title: 'AI-Powered Applications',
    icon: 'spark',
    description: 'Conversational AI, AI assistants, intelligent workflows and AI-enabled products.',
    details:
      'Products where AI is part of the experience: chat, memory, voice, matching and automation, built on established AI platforms and APIs.',
  },
  {
    title: 'Interactive Experiences',
    icon: 'cube',
    description: '3D interfaces, animations, immersive interfaces and highly interactive web experiences.',
    details:
      'Motion and depth used with restraint: interfaces that react to the visitor and stay fast, readable and accessible on every device.',
  },
  {
    title: 'Business Websites',
    icon: 'building',
    description: 'Professional websites for hospitals, farms, businesses, organizations and personal brands.',
    details:
      'Clear services, trustworthy presentation, contact and ordering paths that fit how customers actually reach you, including WhatsApp where it makes sense.',
  },
  {
    title: 'UI / UX Development',
    icon: 'layout',
    description: 'Clean, intuitive interfaces designed for usability across mobile, tablet and desktop.',
    details:
      'Layouts designed intentionally for each screen size, with clear hierarchy, accessible contrast and interactions that explain themselves.',
  },
  {
    title: 'AI-Assisted Product Development',
    icon: 'wand',
    description:
      'Rapid prototyping and development using modern AI development workflows while maintaining attention to functionality and user experience.',
    details:
      'AI speeds up exploration and first drafts; every feature is still reviewed, tested and refined by hand before it ships.',
  },
];

const processSteps = [
  ['DISCOVER', 'Understand the idea, problem and audience.'],
  ['DESIGN', 'Translate the idea into a clear user experience.'],
  ['BUILD', 'Develop the product and its functionality.'],
  ['TEST', 'Identify issues and refine the experience.'],
  ['DEPLOY', 'Launch the product.'],
  ['EVOLVE', 'Improve and expand based on real-world use.'],
].map(([title, description]) => ({ title, description }));

const principles = [
  ['Human First', 'Technology should make products easier and more useful.'],
  ['Built To Work', 'Beautiful interfaces must also function correctly.'],
  ['Responsive By Default', 'Every experience should work across phones, tablets and desktops.'],
  ['Continuous Improvement', 'Products should evolve as users and businesses evolve.'],
].map(([title, description]) => ({ title, description }));

const projects = [
  {
    slug: 'mira',
    title: 'Mira',
    subtitle: 'AI Companion',
    category: 'AI companion application',
    status: 'Product build',
    accent: '#8aa4c0',
    mockup: 'phone',
    featured: true,
    summary:
      'An AI companion designed around conversational interaction, persistent memory, a visual identity and voice.',
    features: [
      'Conversational AI',
      'Persistent conversations',
      'Memory system',
      'AI-generated avatar',
      'Speech interaction',
      'Animated avatar',
      'Roadmap toward real-time 3D avatar interaction',
    ],
    technologies: ['Conversational AI APIs', 'Speech interaction', 'AI image generation'],
    challenge:
      'Make talking to an AI feel continuous and personal rather than a series of disconnected chats.',
    solution:
      'A companion built around persistent conversations and a memory system, given a generated visual identity, an animated avatar and speech so it feels present.',
    approach:
      'Conversational AI APIs for dialogue, speech for voice interaction and generative tools for the avatar, with real-time 3D avatar interaction planned as the next step.',
    process:
      'Started from the conversation experience, added memory so context carries over, then layered on identity, voice and the avatar.',
    outcome:
      'An AI companion experience that brings conversation, memory, voice and an animated avatar together. Real-time 3D avatar interaction is on the roadmap.',
    cover: '',
    gallery: [],
  },
  {
    slug: 'humara',
    title: 'Humara',
    subtitle: 'Human discovery platform',
    category: 'Platform concept',
    status: 'Concept',
    accent: '#9aa8b8',
    mockup: 'screens',
    featured: true,
    summary:
      'An AI-powered human discovery and collaboration platform concept: find the person who can help, and work with them.',
    features: [
      'Capability discovery',
      'Personalized human content',
      'Communities',
      'Messaging',
      'Project collaboration',
      'Creator content',
      'Reputation and trust',
      'AI-powered matching',
    ],
    technologies: ['Product design', 'Interface prototyping', 'AI-powered matching (concept)'],
    challenge:
      'Finding the right person for a need is still mostly luck. Search engines find pages, not people who can actually help.',
    solution:
      'A platform concept that organises people by what they can do, pairs discovery with content, communities, messaging and collaboration, and uses AI to suggest good matches.',
    approach:
      'Designed as a set of connected screens covering discovery, profiles, content, messaging and project spaces, with trust signals built into the experience.',
    process:
      'Defined the core idea, mapped the user journeys, then designed the main screens and visual system before any build.',
    outcome:
      'A clear product concept and interface direction that shows how discovery, community and collaboration fit together. Presented as a concept.',
    cover: '',
    gallery: [],
  },
  {
    slug: 'nnewi-hospital',
    title: 'Nnewi Hospital Website',
    subtitle: 'Healthcare website concept',
    category: 'Healthcare website concept',
    status: 'Concept',
    accent: '#7fb0a6',
    mockup: 'browser',
    featured: true,
    summary: 'A professional, easy-to-navigate website concept for a Nigerian hospital.',
    features: [
      'Modern healthcare interface',
      'Responsive design',
      'Appointment functionality',
      'Services',
      'Team section',
      'Gallery',
      'News and events',
      'Contact system',
      'Administrative management concept',
    ],
    technologies: ['Responsive web design', 'Appointment request forms', 'Content management concept'],
    challenge:
      'Patients need to find services, doctors and contact routes quickly, often on a phone, and the site must feel trustworthy.',
    solution:
      'A clean, calm interface that puts services, appointments and contact first, backed by a team section, gallery and news area that staff could manage.',
    approach:
      'Mobile-first layouts, clear navigation and an appointment request flow, with an admin concept so the hospital could keep content current.',
    process:
      'Structured the information around what visitors look for first, then designed and built the responsive pages and the appointment flow.',
    outcome:
      'A professional healthcare website concept that presents services, people and contact options clearly on any device.',
    cover: '',
    gallery: [],
  },
  {
    slug: 'umuojinkeyaeme-farms',
    title: 'Umuojinkeyaeme Farms',
    subtitle: 'Agricultural business website',
    category: 'Agricultural business website',
    status: 'Website',
    accent: '#a3b18a',
    mockup: 'browser',
    featured: false,
    summary: 'A Nigerian agricultural business website that presents the farm, its practices and its produce.',
    features: [
      'Responsive portfolio',
      'Farm statistics',
      'Gallery',
      'Testimonials',
      'Bio-security information',
      'Interactive sections',
      'Mobile optimization',
    ],
    technologies: ['Responsive web design', 'Interactive sections', 'Image galleries'],
    challenge:
      'A working farm needs to look credible online and explain its standards, such as bio-security, to customers and partners.',
    solution:
      'A site that tells the farm’s story visually, backs it up with key figures, testimonials and bio-security information, and works well on mobile.',
    approach:
      'A visual, image-led layout with interactive sections and a mobile-first structure for visitors on slower connections.',
    process:
      'Gathered the farm’s story and photography, organised it into clear sections, then built and tuned it for mobile.',
    outcome:
      'A clear, credible online presence for the farm that works comfortably on phones.',
    cover: '',
    gallery: [],
  },
  {
    slug: 'samice',
    title: 'Samice',
    subtitle: 'Ice-block company website',
    category: 'Business website',
    status: 'Website',
    accent: '#8fb8d6',
    mockup: 'browser',
    featured: false,
    summary: 'A modern business website for an ice-block company, built around easy ordering.',
    features: [
      'Branded visual identity',
      'Product presentation',
      'WhatsApp ordering',
      'Interactive product sections',
      'Reviews',
      'Responsive design',
    ],
    technologies: ['Responsive web design', 'WhatsApp ordering links', 'Interactive product sections'],
    challenge:
      'Customers want to see what is on offer and order quickly, usually from their phones and usually through WhatsApp.',
    solution:
      'A fresh, branded site that presents the products clearly and lets customers start an order on WhatsApp in a tap.',
    approach:
      'Branding, product sections and reviews in a responsive layout, with WhatsApp ordering as the main call to action.',
    process:
      'Defined the brand look, laid out the product range, then built the ordering path around how customers already communicate.',
    outcome:
      'A branded, mobile-friendly site that makes the products clear and ordering simple.',
    cover: '',
    gallery: [],
  },
];

const collections = { nav, services, process: processSteps, principles, projects };

async function writeSeed(store) {
  const { kv } = store;
  await Promise.all([
    ...Object.entries(singletons).map(([k, v]) => store.setSingleton(k, v)),
    ...Object.entries(collections).map(([k, list]) =>
      kv.set(`i:${k}`, { next: list.length + 1, list: list.map((d, i) => ({ id: i + 1, ...d })) })),
  ]);
}

/** Seed starter content exactly once, even if several cold starts race. */
export async function seedIfEmpty(store) {
  const { kv } = store;
  if (await kv.get('seeded')) return false;
  if (await kv.setnx('seed-lock', 1, { ex: 60 })) {
    try {
      await writeSeed(store);
      await kv.set('seeded', 1);
    } finally {
      await kv.del('seed-lock');
    }
    return true;
  }
  for (let i = 0; i < 40; i += 1) { // another instance is seeding: wait for it
    await new Promise((r) => setTimeout(r, 250));
    if (await kv.get('seeded')) return false;
  }
  throw new Error('Timed out waiting for initial content to be created.');
}
