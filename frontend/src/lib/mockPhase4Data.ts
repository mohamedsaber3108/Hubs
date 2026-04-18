import { MOCK_USERS, type MockUser } from "./mockData";

const u = MOCK_USERS;

export interface Event {
  id: string;
  title: string;
  description: string;
  type: "workshop" | "webinar" | "hackathon" | "meetup" | "conference" | "competition";
  community: string;
  cover: string;
  date: string;
  time: string;
  endTime: string;
  timezone: string;
  location: { type: "online" | "in-person" | "hybrid"; platform?: string; city?: string; country?: string };
  speakers: MockUser[];
  registered: number;
  capacity: number;
  price: "free" | number;
  tags: string[];
  organizer: MockUser;
  agenda?: { time: string; title: string }[];
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: "hackathon" | "design-sprint" | "case-competition" | "skill-contest" | "innovation";
  community: string;
  cover: string;
  deadline: string;
  daysLeft: number;
  prizes: { place: string; reward: string }[];
  teamSize: "solo" | "team-small" | "team-large" | "any";
  participants: number;
  submissions: number;
  judges: MockUser[];
  tags: string[];
  rules: string[];
  faq: { q: string; a: string }[];
}

export interface Opportunity {
  id: string;
  title: string;
  type: "gig" | "full-time" | "part-time" | "internship" | "volunteer" | "scholarship" | "mentorship" | "collaboration";
  community: string;
  company: { name: string; logo: string; industry: string; size: string };
  description: string;
  skills: string[];
  location: string;
  duration: string;
  budget?: string;
  postedAt: string;
  deadline: string;
  featured: boolean;
  poster: MockUser;
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  type: "pdf" | "doc" | "sheet" | "link" | "video" | "tool";
  community: string;
  category: "template" | "guide" | "tool" | "calculator" | "case-study" | "toolkit";
  downloads: number;
  saves: number;
  author: MockUser;
  free: boolean;
  tags: string[];
}

export interface LeaderboardEntry {
  user: MockUser;
  points: number;
  rank: number;
  trend: "up" | "down" | "same";
  trendAmount: number;
}

export const MOCK_EVENTS: Event[] = [
  {
    id: "e1", title: "MENA Design Summit 2025", description: "The largest design conference in the Arab world. Three days of workshops, talks, and networking with top designers from across MENA. Topics include RTL design systems, Arabic typography, and inclusive design for diverse audiences.",
    type: "conference", community: "freelancespace", cover: "https://picsum.photos/seed/designsummit/800/400",
    date: "2025-03-15", time: "09:00", endTime: "17:00", timezone: "GST (UTC+4)",
    location: { type: "hybrid", city: "Dubai", country: "UAE", platform: "Zoom" },
    speakers: [u[0], u[1], u[5]], registered: 342, capacity: 500, price: "free",
    tags: ["Design", "UX", "Arabic", "MENA"], organizer: u[0],
    agenda: [{ time: "09:00", title: "Opening Keynote" }, { time: "10:30", title: "Workshop: RTL Design Systems" }, { time: "13:00", title: "Panel: Future of Arab Design" }, { time: "15:00", title: "Networking Session" }],
  },
  {
    id: "e2", title: "React Advanced Workshop", description: "Deep dive into React 19 features, Server Components, and performance optimization. Hands-on coding session with real-world examples.",
    type: "workshop", community: "freelancespace", cover: "https://picsum.photos/seed/reactws/800/400",
    date: "2025-03-20", time: "14:00", endTime: "17:00", timezone: "EET (UTC+2)",
    location: { type: "online", platform: "Google Meet" },
    speakers: [u[1]], registered: 89, capacity: 100, price: "free",
    tags: ["React", "WebDev", "JavaScript"], organizer: u[1],
    agenda: [{ time: "14:00", title: "React 19 Overview" }, { time: "15:00", title: "Hands-on: Server Components" }, { time: "16:00", title: "Q&A" }],
  },
  {
    id: "e3", title: "Student Leadership Forum", description: "Annual forum bringing together student leaders from across Arab universities. Share best practices, build networks, and plan cross-university initiatives.",
    type: "conference", community: "studentzone", cover: "https://picsum.photos/seed/leaderforum/800/400",
    date: "2025-04-05", time: "10:00", endTime: "16:00", timezone: "AST (UTC+3)",
    location: { type: "in-person", city: "Riyadh", country: "KSA" },
    speakers: [u[2]], registered: 200, capacity: 250, price: "free",
    tags: ["Leadership", "Students", "Networking"], organizer: u[2],
  },
  {
    id: "e4", title: "HR Tech Trends Webinar", description: "Exploring the latest HR technology trends: AI in recruitment, people analytics, and the future of work in the GCC.",
    type: "webinar", community: "hrconnect", cover: "https://picsum.photos/seed/hrtech/800/400",
    date: "2025-03-18", time: "11:00", endTime: "12:30", timezone: "GST (UTC+4)",
    location: { type: "online", platform: "Zoom" },
    speakers: [u[3]], registered: 156, capacity: 200, price: "free",
    tags: ["HRTech", "AI", "Recruitment"], organizer: u[3],
  },
  {
    id: "e5", title: "Fresh Grad Networking Night", description: "Casual networking event for fresh graduates to connect with industry professionals, get career advice, and explore opportunities.",
    type: "meetup", community: "launchpad", cover: "https://picsum.photos/seed/gradnight/800/400",
    date: "2025-03-25", time: "18:00", endTime: "21:00", timezone: "EET (UTC+2)",
    location: { type: "in-person", city: "Cairo", country: "Egypt" },
    speakers: [u[4], u[1]], registered: 78, capacity: 80, price: "free",
    tags: ["Networking", "Career", "FreshGrad"], organizer: u[4],
  },
  {
    id: "e6", title: "AI Hackathon: Build Smart Tools", description: "48-hour hackathon to build AI-powered tools for freelancers. Teams of 3-5. Mentors from top tech companies.",
    type: "hackathon", community: "freelancespace", cover: "https://picsum.photos/seed/aihack/800/400",
    date: "2025-04-12", time: "09:00", endTime: "09:00", timezone: "GST (UTC+4)",
    location: { type: "hybrid", city: "Dubai", country: "UAE", platform: "Discord" },
    speakers: [u[1], u[0]], registered: 120, capacity: 150, price: "free",
    tags: ["AI", "Hackathon", "Coding"], organizer: u[1],
  },
  {
    id: "e7", title: "Employer Branding Masterclass", description: "Learn how to build and promote your employer brand to attract top talent in competitive MENA markets.",
    type: "workshop", community: "hrconnect", cover: "https://picsum.photos/seed/empbrand/800/400",
    date: "2025-03-28", time: "13:00", endTime: "16:00", timezone: "AST (UTC+3)",
    location: { type: "online", platform: "Zoom" },
    speakers: [u[3], u[5]], registered: 67, capacity: 100, price: 25,
    tags: ["Branding", "HR", "Talent"], organizer: u[3],
  },
  {
    id: "e8", title: "Startup Pitch Night", description: "10 startups pitch their ideas to a panel of investors and mentors. Great networking opportunity for aspiring entrepreneurs.",
    type: "competition", community: "launchpad", cover: "https://picsum.photos/seed/pitchnight/800/400",
    date: "2025-04-02", time: "19:00", endTime: "22:00", timezone: "EET (UTC+2)",
    location: { type: "in-person", city: "Amman", country: "Jordan" },
    speakers: [u[4]], registered: 45, capacity: 60, price: "free",
    tags: ["Startup", "Pitch", "Investment"], organizer: u[4],
  },
];

export const MOCK_CHALLENGES: Challenge[] = [
  {
    id: "ch1", title: "Design for Local Artisans", description: "Create a mobile marketplace concept that helps traditional Arab artisans sell their handcrafted products globally. Focus on cultural authenticity, accessibility, and e-commerce UX.",
    type: "design-sprint", community: "freelancespace", cover: "https://picsum.photos/seed/artisan/800/400",
    deadline: "2025-03-20", daysLeft: 14,
    prizes: [{ place: "1st", reward: "$500 + Featured on USAM" }, { place: "2nd", reward: "$250" }, { place: "3rd", reward: "Premium membership" }],
    teamSize: "solo", participants: 67, submissions: 23, judges: [u[0], u[5]],
    tags: ["Design", "Mobile", "E-commerce"], rules: ["Original work only", "Submit Figma or PDF", "Include at least 5 screens", "Arabic & English versions"],
    faq: [{ q: "Can I use AI tools?", a: "Yes, but the final design must show significant human creativity." }, { q: "Can I submit existing work?", a: "No, all submissions must be created specifically for this challenge." }],
  },
  {
    id: "ch2", title: "React Dashboard Challenge", description: "Build a fully functional analytics dashboard using React and TypeScript. Must include real-time data visualization, responsive design, and dark mode support.",
    type: "hackathon", community: "freelancespace", cover: "https://picsum.photos/seed/reactdash/800/400",
    deadline: "2025-03-25", daysLeft: 19,
    prizes: [{ place: "1st", reward: "$1,000 + Job offer" }, { place: "2nd", reward: "$500" }, { place: "3rd", reward: "$250" }],
    teamSize: "team-small", participants: 45, submissions: 12, judges: [u[1]],
    tags: ["React", "TypeScript", "Dashboard"], rules: ["Use React 18+", "TypeScript required", "Must include tests", "Deploy on Vercel/Netlify"],
    faq: [{ q: "Can I use component libraries?", a: "Yes, any open-source library is allowed." }],
  },
  {
    id: "ch3", title: "Social Impact Innovation Hack", description: "Develop innovative solutions to social challenges facing Arab communities. Projects can be tech-based or community-driven initiatives.",
    type: "innovation", community: "studentzone", cover: "https://picsum.photos/seed/socialhack/800/400",
    deadline: "2025-04-01", daysLeft: 26,
    prizes: [{ place: "1st", reward: "$10,000 + Incubator" }, { place: "2nd", reward: "$5,000" }, { place: "3rd", reward: "$2,500" }],
    teamSize: "team-small", participants: 89, submissions: 0, judges: [u[2]],
    tags: ["Innovation", "Social Impact", "Students"], rules: ["Teams of 3-5", "At least one student member", "Prototype required", "5-min pitch video"],
    faq: [{ q: "Do we need a working prototype?", a: "An MVP or detailed mockup is sufficient." }],
  },
  {
    id: "ch4", title: "HR Case Competition", description: "Solve a real HR challenge: Design a retention strategy for a tech company experiencing 30% annual turnover in the GCC region.",
    type: "case-competition", community: "hrconnect", cover: "https://picsum.photos/seed/hrcase/800/400",
    deadline: "2025-03-30", daysLeft: 24,
    prizes: [{ place: "1st", reward: "Executive mentorship + Certificate" }, { place: "2nd", reward: "HR toolkit access" }, { place: "3rd", reward: "Featured article" }],
    teamSize: "team-small", participants: 34, submissions: 8, judges: [u[3]],
    tags: ["HR", "Case Study", "Retention"], rules: ["Submit PDF report", "Max 15 pages", "Include data analysis", "Present recommendations"],
    faq: [{ q: "Is real company data provided?", a: "Yes, anonymized data will be shared upon registration." }],
  },
  {
    id: "ch5", title: "Fresh Grad Portfolio Sprint", description: "Build and polish your professional portfolio in 7 days. Daily prompts, peer feedback, and mentor reviews.",
    type: "skill-contest", community: "launchpad", cover: "https://picsum.photos/seed/portfolio/800/400",
    deadline: "2025-03-22", daysLeft: 16,
    prizes: [{ place: "1st", reward: "Career coaching package" }, { place: "2nd", reward: "Resume review" }, { place: "3rd", reward: "LinkedIn optimization" }],
    teamSize: "solo", participants: 112, submissions: 45, judges: [u[0], u[4]],
    tags: ["Portfolio", "Career", "FreshGrad"], rules: ["Submit portfolio URL", "Must include 3+ projects", "Personal branding section required"],
    faq: [{ q: "What if I don't have projects?", a: "We provide project prompts you can use to build portfolio pieces." }],
  },
  {
    id: "ch6", title: "Content Marketing Sprint", description: "Create a complete content marketing strategy for a fictional Arab tech startup. Deliverables include content calendar, sample posts, and analytics framework.",
    type: "skill-contest", community: "freelancespace", cover: "https://picsum.photos/seed/contentsprint/800/400",
    deadline: "2025-04-10", daysLeft: 35,
    prizes: [{ place: "1st", reward: "$300 + Client referral" }, { place: "2nd", reward: "$150" }, { place: "3rd", reward: "Course access" }],
    teamSize: "solo", participants: 56, submissions: 0, judges: [u[5]],
    tags: ["Marketing", "Content", "Strategy"], rules: ["Original strategy only", "Include Arabic content", "Minimum 30-day calendar"],
    faq: [],
  },
];

export const MOCK_OPPORTUNITIES: Opportunity[] = [
  {
    id: "op1", title: "Senior UI/UX Designer", type: "gig", community: "freelancespace",
    company: { name: "TechFlow", logo: "https://picsum.photos/seed/techflow/40/40", industry: "SaaS", size: "50-200" },
    description: "Design a complete SaaS dashboard for our fintech platform. Must have experience with Arabic RTL layouts and banking interfaces.",
    skills: ["UI/UX", "Figma", "RTL Design", "SaaS"], location: "Remote", duration: "2-3 months", budget: "$5,000-8,000",
    postedAt: "2d ago", deadline: "Mar 25", featured: true, poster: u[3],
  },
  {
    id: "op2", title: "React Developer — E-commerce", type: "gig", community: "freelancespace",
    company: { name: "ShopArab", logo: "https://picsum.photos/seed/shoparab/40/40", industry: "E-commerce", size: "10-50" },
    description: "Build a Next.js e-commerce storefront with Arabic/English support, payment integration, and inventory management.",
    skills: ["React", "Next.js", "TypeScript", "E-commerce"], location: "Remote", duration: "3-4 months", budget: "$8,000-12,000",
    postedAt: "1d ago", deadline: "Apr 1", featured: true, poster: u[1],
  },
  {
    id: "op3", title: "Marketing Intern", type: "internship", community: "launchpad",
    company: { name: "GrowthLab", logo: "https://picsum.photos/seed/growthlab/40/40", industry: "Marketing", size: "10-50" },
    description: "Join our marketing team for a 3-month internship. You'll work on social media campaigns, content creation, and analytics.",
    skills: ["Social Media", "Content", "Analytics"], location: "Cairo, Egypt", duration: "3 months", budget: "Paid",
    postedAt: "3d ago", deadline: "Mar 30", featured: false, poster: u[5],
  },
  {
    id: "op4", title: "HR Business Partner", type: "full-time", community: "hrconnect",
    company: { name: "MegaCorp MENA", logo: "https://picsum.photos/seed/megacorp/40/40", industry: "Technology", size: "1000+" },
    description: "Strategic HR partner role supporting engineering and product teams. Lead talent acquisition, performance management, and organizational development.",
    skills: ["HR Strategy", "Talent Acquisition", "Performance Management"], location: "Riyadh, KSA", duration: "Permanent", budget: "Competitive",
    postedAt: "5d ago", deadline: "Apr 15", featured: true, poster: u[3],
  },
  {
    id: "op5", title: "Volunteer Event Coordinator", type: "volunteer", community: "studentzone",
    company: { name: "USAM Hub", logo: "https://picsum.photos/seed/usam/40/40", industry: "Community", size: "10-50" },
    description: "Help organize our annual student leadership summit. Responsibilities include venue coordination, speaker management, and attendee experience.",
    skills: ["Event Planning", "Communication", "Leadership"], location: "Amman, Jordan", duration: "2 months",
    postedAt: "1w ago", deadline: "Mar 20", featured: false, poster: u[2],
  },
  {
    id: "op6", title: "Data Science Mentorship", type: "mentorship", community: "launchpad",
    company: { name: "DataMinds", logo: "https://picsum.photos/seed/dataminds/40/40", industry: "AI/ML", size: "50-200" },
    description: "3-month mentorship program for aspiring data scientists. Weekly 1:1 sessions, project guidance, and career coaching.",
    skills: ["Python", "Machine Learning", "Data Analysis"], location: "Remote", duration: "3 months", budget: "Free",
    postedAt: "4d ago", deadline: "Apr 5", featured: false, poster: u[1],
  },
  {
    id: "op7", title: "Brand Identity Project", type: "gig", community: "freelancespace",
    company: { name: "Arabesque Foods", logo: "https://picsum.photos/seed/arabesque/40/40", industry: "F&B", size: "10-50" },
    description: "Complete brand identity for a premium Arab food brand expanding internationally. Logo, packaging, brand guidelines, and social templates.",
    skills: ["Branding", "Logo Design", "Packaging", "Brand Strategy"], location: "Remote", duration: "1-2 months", budget: "$3,000-5,000",
    postedAt: "6h ago", deadline: "Mar 28", featured: false, poster: u[0],
  },
  {
    id: "op8", title: "STEM Scholarship 2025", type: "scholarship", community: "studentzone",
    company: { name: "Arab Future Foundation", logo: "https://picsum.photos/seed/arabfuture/40/40", industry: "Education", size: "50-200" },
    description: "Full scholarship for Arab students pursuing STEM degrees abroad. Covers tuition, living expenses, and mentorship.",
    skills: ["STEM", "Academic Excellence"], location: "International", duration: "4 years", budget: "Full scholarship",
    postedAt: "1w ago", deadline: "Apr 30", featured: true, poster: u[2],
  },
];

export const MOCK_RESOURCES: Resource[] = [
  { id: "r1", title: "Freelance Contract Template", description: "Professionally drafted contract template for freelancers. Covers scope, payment terms, IP rights, and dispute resolution.", type: "doc", community: "freelancespace", category: "template", downloads: 1234, saves: 456, author: u[5], free: true, tags: ["Contract", "Legal", "Freelancing"] },
  { id: "r2", title: "Pricing Calculator", description: "Interactive spreadsheet to calculate project pricing based on hours, complexity, and market rates.", type: "sheet", community: "freelancespace", category: "calculator", downloads: 890, saves: 234, author: u[0], free: true, tags: ["Pricing", "Business", "Calculator"] },
  { id: "r3", title: "Event Planning Toolkit", description: "Complete guide and templates for planning student events. Includes budget templates, timeline planners, and promotion checklists.", type: "pdf", community: "studentzone", category: "toolkit", downloads: 567, saves: 189, author: u[2], free: true, tags: ["Events", "Planning", "Students"] },
  { id: "r4", title: "Interview Question Bank", description: "500+ interview questions organized by role, skill, and competency. Includes behavioral, technical, and situational questions.", type: "pdf", community: "hrconnect", category: "guide", downloads: 2345, saves: 890, author: u[3], free: false, tags: ["Interview", "Recruitment", "HR"] },
  { id: "r5", title: "CV Template Pack", description: "5 professional CV templates designed for the Arab job market. ATS-friendly, bilingual (Arabic/English).", type: "doc", community: "launchpad", category: "template", downloads: 3456, saves: 1234, author: u[4], free: true, tags: ["CV", "Resume", "Career"] },
  { id: "r6", title: "Employer Branding Guide", description: "Step-by-step guide to building your employer brand in the GCC. Includes case studies and EVP framework.", type: "pdf", community: "hrconnect", category: "guide", downloads: 678, saves: 234, author: u[3], free: true, tags: ["Branding", "HR", "EVP"] },
  { id: "r7", title: "Portfolio Structure Guide", description: "How to structure your design portfolio for maximum impact. Includes examples and common mistakes to avoid.", type: "link", community: "launchpad", category: "guide", downloads: 1890, saves: 567, author: u[0], free: true, tags: ["Portfolio", "Design", "Career"] },
  { id: "r8", title: "Social Media Campaign Toolkit", description: "Templates and strategies for running effective social media campaigns for student organizations.", type: "pdf", community: "studentzone", category: "toolkit", downloads: 789, saves: 321, author: u[2], free: true, tags: ["Social Media", "Campaign", "Students"] },
  { id: "r9", title: "Invoice Template", description: "Professional invoice template with automatic calculations. Supports multiple currencies.", type: "sheet", community: "freelancespace", category: "template", downloads: 2100, saves: 678, author: u[5], free: true, tags: ["Invoice", "Finance", "Freelancing"] },
  { id: "r10", title: "Startup Pitch Deck Template", description: "10-slide pitch deck template used by successful Arab startups. Includes talking points and design tips.", type: "pdf", community: "launchpad", category: "template", downloads: 1567, saves: 890, author: u[4], free: true, tags: ["Startup", "Pitch", "Presentation"] },
];

export const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { user: u[0], points: 4250, rank: 1, trend: "same", trendAmount: 0 },
  { user: u[1], points: 3890, rank: 2, trend: "up", trendAmount: 1 },
  { user: u[2], points: 3456, rank: 3, trend: "up", trendAmount: 2 },
  { user: u[5], points: 3120, rank: 4, trend: "down", trendAmount: 1 },
  { user: u[3], points: 2890, rank: 5, trend: "up", trendAmount: 3 },
  { user: u[4], points: 2450, rank: 6, trend: "down", trendAmount: 2 },
];
