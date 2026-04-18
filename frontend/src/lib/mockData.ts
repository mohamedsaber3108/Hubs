export interface MockUser {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
  bio: string;
  location: { country: string; flag: string; city: string };
  communities: string[];
  primaryCommunity: string;
  skills: string[];
  links: { linkedin?: string; github?: string; behance?: string; website?: string; twitter?: string };
  stats: { posts: number; connections: number; events: number; challenges: number };
  availability: boolean;
  level: number;
  points: number;
  joinDate: string;
  role?: string;
  company?: string;
}

export const MOCK_USERS: MockUser[] = [
  {
    id: "u1",
    name: "Sara Al-Rashid",
    username: "sara_designs",
    email: "sara@example.com",
    avatar: "https://i.pravatar.cc/150?img=1",
    bio: "Senior UX Designer passionate about creating accessible digital products for the MENA region. Speaker, mentor, and community builder.",
    location: { country: "UAE", flag: "🇦🇪", city: "Dubai" },
    communities: ["freelancespace", "hrconnect"],
    primaryCommunity: "freelancespace",
    skills: ["UI/UX", "Branding", "Figma", "Design Systems", "Accessibility", "User Research", "Prototyping", "Illustration"],
    links: { linkedin: "https://linkedin.com/in/sara", behance: "https://behance.net/sara", website: "https://sara.design" },
    stats: { posts: 87, connections: 342, events: 23, challenges: 5 },
    availability: true,
    level: 8,
    points: 4250,
    joinDate: "2024-03-15",
  },
  {
    id: "u2",
    name: "Ahmed Khalil",
    username: "ahmed_dev",
    email: "ahmed@example.com",
    avatar: "https://i.pravatar.cc/150?img=3",
    bio: "Full-stack developer building tools for Arab freelancers. React, Node, and everything in between.",
    location: { country: "Egypt", flag: "🇪🇬", city: "Cairo" },
    communities: ["freelancespace", "launchpad"],
    primaryCommunity: "freelancespace",
    skills: ["React", "Node.js", "TypeScript", "PostgreSQL", "AWS", "Docker"],
    links: { linkedin: "https://linkedin.com/in/ahmed", github: "https://github.com/ahmed" },
    stats: { posts: 124, connections: 567, events: 12, challenges: 9 },
    availability: true,
    level: 12,
    points: 7800,
    joinDate: "2023-11-20",
  },
  {
    id: "u3",
    name: "Layla Mansour",
    username: "layla_m",
    email: "layla@example.com",
    avatar: "https://i.pravatar.cc/150?img=5",
    bio: "Computer Science student at AUB. Organizing campus hackathons and leading the AI club.",
    location: { country: "Lebanon", flag: "🇱🇧", city: "Beirut" },
    communities: ["studentzone", "launchpad"],
    primaryCommunity: "studentzone",
    skills: ["Python", "Machine Learning", "Event Planning", "Public Speaking", "Leadership"],
    links: { linkedin: "https://linkedin.com/in/layla", github: "https://github.com/layla" },
    stats: { posts: 45, connections: 189, events: 31, challenges: 7 },
    availability: false,
    level: 6,
    points: 2900,
    joinDate: "2024-06-01",
    role: "Club President",
  },
  {
    id: "u4",
    name: "Omar Farouk",
    username: "omar_hr",
    email: "omar@example.com",
    avatar: "https://i.pravatar.cc/150?img=8",
    bio: "VP of People at a Series B startup. Passionate about building inclusive workplaces across the Arab world.",
    location: { country: "Saudi Arabia", flag: "🇸🇦", city: "Riyadh" },
    communities: ["hrconnect"],
    primaryCommunity: "hrconnect",
    skills: ["Talent Acquisition", "Employer Branding", "HRIS", "Performance Management", "D&I", "HR Analytics"],
    links: { linkedin: "https://linkedin.com/in/omar" },
    stats: { posts: 63, connections: 421, events: 18, challenges: 3 },
    availability: false,
    level: 10,
    points: 5600,
    joinDate: "2024-01-10",
    role: "VP of People",
    company: "TechFlow",
  },
  {
    id: "u5",
    name: "Nour Haddad",
    username: "nour_launch",
    email: "nour@example.com",
    avatar: "https://i.pravatar.cc/150?img=9",
    bio: "Fresh grad exploring the intersection of data science and social impact. Looking for my first role!",
    location: { country: "Jordan", flag: "🇯🇴", city: "Amman" },
    communities: ["launchpad", "studentzone"],
    primaryCommunity: "launchpad",
    skills: ["Data Science", "Python", "SQL", "Tableau", "Research", "Entrepreneurship"],
    links: { linkedin: "https://linkedin.com/in/nour", github: "https://github.com/nour" },
    stats: { posts: 21, connections: 98, events: 8, challenges: 4 },
    availability: true,
    level: 3,
    points: 1200,
    joinDate: "2025-01-05",
  },
  {
    id: "u6",
    name: "Yasmin El-Sayed",
    username: "yasmin_writes",
    email: "yasmin@example.com",
    avatar: "https://i.pravatar.cc/150?img=10",
    bio: "Content strategist & copywriter. Telling brand stories that resonate with Arabic-speaking audiences.",
    location: { country: "Morocco", flag: "🇲🇦", city: "Casablanca" },
    communities: ["freelancespace"],
    primaryCommunity: "freelancespace",
    skills: ["Copywriting", "SEO", "Content Strategy", "Social Media", "Arabic Localization", "Branding"],
    links: { linkedin: "https://linkedin.com/in/yasmin", website: "https://yasmin.co", twitter: "https://x.com/yasmin" },
    stats: { posts: 156, connections: 278, events: 9, challenges: 6 },
    availability: true,
    level: 9,
    points: 4800,
    joinDate: "2024-02-14",
  },
];

export const CURRENT_USER = MOCK_USERS[0];

export const SKILL_TAGS: Record<string, string[]> = {
  freelancespace: [
    "UI/UX", "Branding", "React", "Copywriting", "SEO", "Video Editing", "3D", "Illustration",
    "Figma", "Web Dev", "Mobile Dev", "Photography", "Motion Graphics", "Data Analysis",
    "Social Media", "Marketing", "Consulting", "Project Management",
  ],
  studentzone: [
    "Leadership", "Event Planning", "Public Speaking", "Research", "Social Media",
    "Volunteering", "Fundraising", "Community Building", "Content Creation",
    "Graphic Design", "Campus Marketing", "Workshop Facilitation",
  ],
  hrconnect: [
    "Talent Acquisition", "ATS", "Employer Branding", "HRIS", "Performance Management",
    "Learning & Development", "Compensation", "HR Analytics", "Employee Engagement",
    "Onboarding", "Diversity & Inclusion", "Labor Law",
  ],
  launchpad: [
    "Web Dev", "Data Science", "Entrepreneurship", "Soft Skills", "Design Thinking",
    "Machine Learning", "Product Management", "Agile", "Resume Building",
    "Interview Prep", "Networking", "Personal Branding",
  ],
};

export const MOCK_BADGES = [
  { id: "b1", name: "Early Adopter", icon: "🌟", description: "Joined in the first 1000 members", earned: true, date: "2024-03-15" },
  { id: "b2", name: "Community Builder", icon: "🏗️", description: "Made 100+ connections", earned: true, date: "2024-08-20" },
  { id: "b3", name: "Event Enthusiast", icon: "🎪", description: "Attended 20+ events", earned: true, date: "2025-01-10" },
  { id: "b4", name: "Challenge Champion", icon: "🏆", description: "Won 3+ challenges", earned: true, date: "2025-02-01" },
  { id: "b5", name: "Top Contributor", icon: "✍️", description: "Published 50+ posts", earned: true, date: "2025-01-15" },
  { id: "b6", name: "Mentor", icon: "🧭", description: "Mentored 5+ members", earned: false, date: null },
  { id: "b7", name: "Portfolio Pro", icon: "💼", description: "Added 10+ portfolio items", earned: false, date: null },
  { id: "b8", name: "Polyglot", icon: "🌍", description: "Active in 3+ communities", earned: false, date: null },
];

export const MOCK_PROJECTS = [
  {
    id: "p1",
    title: "MENA Design System",
    cover: "https://picsum.photos/seed/proj1/400/250",
    skills: ["UI/UX", "Design Systems", "Figma"],
    description: "A comprehensive design system built for Arabic-first digital products.",
    community: "freelancespace",
  },
  {
    id: "p2",
    title: "Freelancer Dashboard",
    cover: "https://picsum.photos/seed/proj2/400/250",
    skills: ["React", "TypeScript", "Tailwind"],
    description: "Analytics dashboard for freelancers to track income, clients, and projects.",
    community: "freelancespace",
  },
  {
    id: "p3",
    title: "Campus Connect App",
    cover: "https://picsum.photos/seed/proj3/400/250",
    skills: ["Mobile Dev", "React Native"],
    description: "Mobile app connecting students across Arab universities for events and activities.",
    community: "studentzone",
  },
];

export const MOCK_ACTIVITY = [
  { id: "a1", type: "post", text: "Published: 'Designing for RTL: A Complete Guide'", date: "2025-02-28", community: "freelancespace" },
  { id: "a2", type: "event", text: "Attended: MENA Design Summit 2025", date: "2025-02-20", community: "freelancespace" },
  { id: "a3", type: "badge", text: "Earned: Challenge Champion 🏆", date: "2025-02-01", community: "freelancespace" },
  { id: "a4", type: "connection", text: "Connected with Ahmed Khalil", date: "2025-01-28", community: "freelancespace" },
  { id: "a5", type: "challenge", text: "Won: 'Design a Community Logo' challenge", date: "2025-01-15", community: "freelancespace" },
  { id: "a6", type: "group", text: "Joined: Arab UX Designers group", date: "2025-01-10", community: "freelancespace" },
  { id: "a7", type: "post", text: "Published: 'Why Every Freelancer Needs a Portfolio'", date: "2025-01-05", community: "freelancespace" },
  { id: "a8", type: "event", text: "Attended: Career Fair 2025", date: "2024-12-15", community: "hrconnect" },
];

export const MOCK_REVIEWS = [
  {
    id: "r1",
    author: MOCK_USERS[1],
    rating: 5,
    text: "Sara redesigned our entire product and the results were incredible. Highly recommended!",
    date: "2025-01-20",
  },
  {
    id: "r2",
    author: MOCK_USERS[5],
    rating: 5,
    text: "Amazing attention to detail and deep understanding of Arabic typography. A pleasure to work with.",
    date: "2024-11-10",
  },
  {
    id: "r3",
    author: MOCK_USERS[3],
    rating: 4,
    text: "Delivered a great employer branding toolkit for our team. Very professional and timely.",
    date: "2024-09-05",
  },
];
