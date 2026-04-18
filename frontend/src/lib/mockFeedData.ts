import { MOCK_USERS, type MockUser } from "./mockData";

export interface Post {
  id: string;
  author: MockUser;
  community: string;
  type: "text" | "image" | "poll" | "question" | "project" | "job" | "challenge" | "initiative";
  content: string;
  images?: string[];
  hashtags: string[];
  likes: number;
  comments: Comment[];
  shares: number;
  bookmarked: boolean;
  liked: boolean;
  createdAt: string;
  poll?: { question: string; options: { text: string; votes: number }[]; totalVotes: number; endsAt: string };
  project?: { title: string; cover: string; skills: string[]; link: string };
  job?: { company: string; role: string; location: string; type: string; requirements: string[] };
}

export interface Comment {
  id: string;
  author: MockUser;
  content: string;
  likes: number;
  liked: boolean;
  createdAt: string;
  replies?: Comment[];
}

export interface Group {
  id: string;
  name: string;
  description: string;
  cover: string;
  community: string;
  members: number;
  posts: number;
  type: "public" | "private" | "invite";
  tags: string[];
  admins: MockUser[];
  rules?: string[];
}

export interface Notification {
  id: string;
  type: "like" | "comment" | "mention" | "connection" | "event" | "badge" | "opportunity" | "group" | "challenge";
  text: string;
  avatar: string;
  read: boolean;
  createdAt: string;
  actionable?: boolean;
}

export interface Conversation {
  id: string;
  user: MockUser;
  lastMessage: string;
  lastTime: string;
  unread: number;
  messages: { id: string; from: "me" | "them"; text: string; time: string; read: boolean }[];
}

const u = MOCK_USERS;

export const MOCK_POSTS: Post[] = [
  {
    id: "post1", author: u[0], community: "freelancespace", type: "text",
    content: "Just finished a complete rebrand for a SaaS startup in Dubai. The key insight? Arabic-first design isn't just translation — it's a completely different visual hierarchy. Thread on what I learned 🧵",
    hashtags: ["Design", "Branding", "RTL"], likes: 47, comments: [], shares: 12, bookmarked: false, liked: false, createdAt: "2h ago",
  },
  {
    id: "post2", author: u[1], community: "freelancespace", type: "project",
    content: "Excited to share my latest project — a real-time analytics dashboard built with React and D3. Check it out!",
    hashtags: ["React", "WebDev", "OpenSource"], likes: 89, comments: [], shares: 23, bookmarked: false, liked: true, createdAt: "4h ago",
    project: { title: "FreelanceFlow Dashboard", cover: "https://picsum.photos/seed/dash/600/300", skills: ["React", "TypeScript", "D3.js"], link: "#" },
  },
  {
    id: "post3", author: u[3], community: "hrconnect", type: "poll",
    content: "What's the biggest challenge in hiring for the MENA region right now?",
    hashtags: ["HRTech", "Recruitment", "MENA"], likes: 34, comments: [], shares: 8, bookmarked: false, liked: false, createdAt: "5h ago",
    poll: { question: "Biggest hiring challenge in MENA?", options: [{ text: "Talent shortage in tech", votes: 42 }, { text: "Salary expectations gap", votes: 31 }, { text: "Remote vs office debate", votes: 28 }, { text: "Cultural fit assessment", votes: 19 }], totalVotes: 120, endsAt: "3 days" },
  },
  {
    id: "post4", author: u[2], community: "studentzone", type: "text",
    content: "Our AI club just hit 200 members! 🎉 Planning a hackathon next month — who's in? We'll have mentors from Google, Microsoft, and local startups. DM me or comment below!",
    hashtags: ["AI", "Hackathon", "Students"], likes: 156, comments: [], shares: 45, bookmarked: true, liked: true, createdAt: "6h ago",
  },
  {
    id: "post5", author: u[5], community: "freelancespace", type: "text",
    content: "Hot take: Most freelancers undercharge because they price their time, not their value. A brand strategy that doubles a client's revenue is worth way more than the hours you put in.\n\nHow do you approach pricing? 💰",
    hashtags: ["Freelancing", "Pricing", "Business"], likes: 203, comments: [], shares: 67, bookmarked: false, liked: false, createdAt: "8h ago",
  },
  {
    id: "post6", author: u[3], community: "hrconnect", type: "job",
    content: "We're hiring! Looking for a Senior Talent Acquisition Specialist to join our growing team.",
    hashtags: ["Hiring", "Jobs", "HR"], likes: 28, comments: [], shares: 15, bookmarked: false, liked: false, createdAt: "10h ago",
    job: { company: "TechFlow", role: "Senior TA Specialist", location: "Riyadh, KSA", type: "Full-time", requirements: ["5+ years TA experience", "ATS proficiency", "MENA market knowledge", "Arabic & English fluent"] },
  },
  {
    id: "post7", author: u[4], community: "launchpad", type: "question",
    content: "Fresh grad question: Is it better to join a big company first for the brand name, or go straight to a startup for the learning experience? Would love to hear from people who've done both! 🤔",
    hashtags: ["CareerAdvice", "FreshGrad", "Startup"], likes: 78, comments: [], shares: 19, bookmarked: false, liked: false, createdAt: "12h ago",
  },
  {
    id: "post8", author: u[0], community: "freelancespace", type: "image",
    content: "Some shots from the MENA Design Summit last week. Met so many talented designers from across the region! The energy was incredible 🔥",
    images: ["https://picsum.photos/seed/event1/600/400", "https://picsum.photos/seed/event2/600/400", "https://picsum.photos/seed/event3/600/400", "https://picsum.photos/seed/event4/600/400"],
    hashtags: ["DesignSummit", "MENA", "Networking"], likes: 134, comments: [], shares: 28, bookmarked: false, liked: true, createdAt: "1d ago",
  },
  {
    id: "post9", author: u[2], community: "studentzone", type: "initiative",
    content: "📊 Mental Health Awareness Week update:\n\n✅ 3 workshops completed (450+ attendees)\n✅ Peer support network launched (120 sign-ups)\n✅ Resource hub published\n🔄 2 more sessions this week\n\nProud of what we've built together! 💚",
    hashtags: ["MentalHealth", "StudentLife", "Impact"], likes: 267, comments: [], shares: 89, bookmarked: true, liked: true, createdAt: "1d ago",
  },
  {
    id: "post10", author: u[1], community: "launchpad", type: "text",
    content: "3 things I wish I knew as a fresh grad:\n\n1. Your first job doesn't define your career — it's a stepping stone\n2. Networking isn't cringe, it's survival\n3. Side projects > certificates (in most fields)\n\nWhat would you add? 👇",
    hashtags: ["CareerTips", "FreshGrad", "Growth"], likes: 312, comments: [], shares: 94, bookmarked: false, liked: false, createdAt: "1d ago",
  },
  {
    id: "post11", author: u[5], community: "freelancespace", type: "text",
    content: "New blog post: \"The Complete Guide to Freelancing in the Arab World\" — covering legal setup, banking, taxes, and finding international clients from the region. Link in bio!",
    hashtags: ["Freelancing", "Guide", "ArabWorld"], likes: 89, comments: [], shares: 42, bookmarked: false, liked: false, createdAt: "2d ago",
  },
  {
    id: "post12", author: u[3], community: "hrconnect", type: "text",
    content: "Just published our annual Compensation Report for the GCC tech sector. Key finding: AI/ML roles saw a 34% salary increase YoY. Remote roles are now 28% of all tech positions.\n\nFull report available for HR Connect members.",
    hashtags: ["Compensation", "GCC", "TechSalaries"], likes: 156, comments: [], shares: 78, bookmarked: true, liked: false, createdAt: "2d ago",
  },
  {
    id: "post13", author: u[4], community: "launchpad", type: "poll",
    content: "What skill are you focusing on developing this quarter?",
    hashtags: ["Skills", "Growth", "Learning"], likes: 45, comments: [], shares: 11, bookmarked: false, liked: false, createdAt: "2d ago",
    poll: { question: "Focus skill this quarter?", options: [{ text: "Technical (coding, data)", votes: 67 }, { text: "Communication & leadership", votes: 45 }, { text: "Design & creativity", votes: 32 }, { text: "Business & entrepreneurship", votes: 28 }], totalVotes: 172, endsAt: "5 days" },
  },
  {
    id: "post14", author: u[0], community: "freelancespace", type: "challenge",
    content: "🏆 NEW CHALLENGE: Design a Mobile App for Local Artisans\n\nBrief: Create a marketplace concept that helps traditional Arab artisans sell globally.\n\nPrize: $500 + Featured on USAM Hub\nDeadline: March 20, 2025\n\nJoin now! 👇",
    hashtags: ["Challenge", "Design", "Artisans"], likes: 198, comments: [], shares: 67, bookmarked: false, liked: false, createdAt: "3d ago",
  },
  {
    id: "post15", author: u[2], community: "studentzone", type: "text",
    content: "Applications are OPEN for the Arab Innovation Challenge 2025! 🚀\n\nTeams of 3-5 students, any discipline. Prizes include:\n🥇 $10,000 + Incubator spot\n🥈 $5,000 + Mentorship\n🥉 $2,500\n\nRegister by March 25!",
    hashtags: ["Innovation", "Competition", "Students"], likes: 342, comments: [], shares: 156, bookmarked: true, liked: true, createdAt: "3d ago",
  },
];

// Add comments to some posts
MOCK_POSTS[0].comments = [
  { id: "c1", author: u[1], content: "This is so true! RTL design is a whole different mindset. Would love to see the case study.", likes: 8, liked: false, createdAt: "1h ago", replies: [
    { id: "c1r1", author: u[0], content: "Thanks Ahmed! Writing it up now — will share next week 🙏", likes: 3, liked: false, createdAt: "45m ago" },
  ]},
  { id: "c2", author: u[5], content: "The visual hierarchy point is huge. Most brands just mirror the layout and call it a day.", likes: 12, liked: true, createdAt: "1h ago" },
];
MOCK_POSTS[4].comments = [
  { id: "c3", author: u[1], content: "100% agree. I switched from hourly to project-based pricing and my income doubled.", likes: 23, liked: false, createdAt: "7h ago" },
  { id: "c4", author: u[4], content: "As a fresh grad, this is eye-opening. How do you calculate 'value' though?", likes: 5, liked: false, createdAt: "6h ago", replies: [
    { id: "c4r1", author: u[5], content: "Great question! Look at the ROI your work creates for the client. If your design increases their conversions by 20%, that's the value baseline.", likes: 15, liked: false, createdAt: "5h ago" },
  ]},
];
MOCK_POSTS[6].comments = [
  { id: "c5", author: u[1], content: "Startup all the way. You learn 10x faster when you wear multiple hats.", likes: 19, liked: false, createdAt: "11h ago" },
  { id: "c6", author: u[3], content: "As an HR professional — it depends on your field. Some industries value big company experience.", likes: 14, liked: false, createdAt: "10h ago" },
  { id: "c7", author: u[0], content: "I did both: started at a big agency for 2 years, then went freelance. The brand name opened doors, but the real learning happened on my own.", likes: 27, liked: true, createdAt: "9h ago" },
];

export const MOCK_GROUPS: Group[] = [
  // FreelanceSpace
  { id: "g1", name: "Design Club", description: "A space for designers to share work, get feedback, and discuss trends in UI/UX, branding, and illustration.", cover: "https://picsum.photos/seed/design/800/300", community: "freelancespace", members: 1240, posts: 456, type: "public", tags: ["UI/UX", "Branding", "Illustration"], admins: [u[0]], rules: ["Be constructive", "No self-promo spam", "Credit original work"] },
  { id: "g2", name: "Dev Den", description: "Developers sharing code, debugging together, and discussing the latest in web and mobile development.", cover: "https://picsum.photos/seed/devden/800/300", community: "freelancespace", members: 890, posts: 678, type: "public", tags: ["React", "Node.js", "Mobile"], admins: [u[1]] },
  { id: "g3", name: "Marketing Masters", description: "Digital marketing strategies, SEO tips, social media growth hacks, and content marketing discussions.", cover: "https://picsum.photos/seed/market/800/300", community: "freelancespace", members: 654, posts: 321, type: "public", tags: ["SEO", "Social Media", "Content"], admins: [u[5]] },
  { id: "g4", name: "AI & Automation", description: "Exploring AI tools, automation workflows, and the future of work for freelancers.", cover: "https://picsum.photos/seed/aigroup/800/300", community: "freelancespace", members: 567, posts: 234, type: "public", tags: ["AI", "Automation", "Tools"], admins: [u[1]] },
  { id: "g5", name: "Creative Hub", description: "Photography, video, motion graphics, and all things creative.", cover: "https://picsum.photos/seed/creative/800/300", community: "freelancespace", members: 432, posts: 189, type: "public", tags: ["Photography", "Video", "Motion"], admins: [u[0]] },
  { id: "g6", name: "Writing Workshop", description: "For writers, editors, and content creators to workshop ideas and improve their craft.", cover: "https://picsum.photos/seed/writing/800/300", community: "freelancespace", members: 345, posts: 156, type: "public", tags: ["Writing", "Editing", "Content"], admins: [u[5]] },
  { id: "g7", name: "Video & Motion", description: "Video production, motion graphics, animation, and visual storytelling.", cover: "https://picsum.photos/seed/video/800/300", community: "freelancespace", members: 278, posts: 123, type: "public", tags: ["Video", "Animation", "Storytelling"], admins: [u[0]] },
  { id: "g8", name: "Business Consulting", description: "Strategy, consulting methodologies, and building a consulting practice.", cover: "https://picsum.photos/seed/consult/800/300", community: "freelancespace", members: 189, posts: 87, type: "private", tags: ["Strategy", "Consulting", "Business"], admins: [u[5]] },
  // StudentZone
  { id: "g9", name: "Competitions Squad", description: "Find teammates, prepare for competitions, and celebrate wins together!", cover: "https://picsum.photos/seed/compete/800/300", community: "studentzone", members: 890, posts: 345, type: "public", tags: ["Competitions", "Hackathons", "Teams"], admins: [u[2]] },
  { id: "g10", name: "Event Organizers", description: "Tips, templates, and support for student event planners across the Arab world.", cover: "https://picsum.photos/seed/organize/800/300", community: "studentzone", members: 567, posts: 234, type: "public", tags: ["Events", "Planning", "Logistics"], admins: [u[2]] },
  { id: "g11", name: "Volunteer Network", description: "Connect with volunteer opportunities and community service initiatives.", cover: "https://picsum.photos/seed/volunteer/800/300", community: "studentzone", members: 678, posts: 189, type: "public", tags: ["Volunteering", "Community", "Impact"], admins: [u[2]] },
  { id: "g12", name: "Research Circle", description: "Academic research discussions, paper reviews, and collaboration opportunities.", cover: "https://picsum.photos/seed/research/800/300", community: "studentzone", members: 345, posts: 156, type: "private", tags: ["Research", "Academic", "Papers"], admins: [u[2]] },
  { id: "g13", name: "Campus Leaders", description: "Student body presidents, club leaders, and student government discussions.", cover: "https://picsum.photos/seed/leaders/800/300", community: "studentzone", members: 234, posts: 98, type: "invite", tags: ["Leadership", "Governance", "Clubs"], admins: [u[2]] },
  { id: "g14", name: "Social Impact", description: "Initiatives making a difference in communities across the Arab world.", cover: "https://picsum.photos/seed/impact/800/300", community: "studentzone", members: 456, posts: 167, type: "public", tags: ["Social Impact", "NGOs", "Change"], admins: [u[2]] },
  // HR Connect
  { id: "g15", name: "Talent Acquisition", description: "Best practices in sourcing, interviewing, and hiring top talent in MENA.", cover: "https://picsum.photos/seed/talent/800/300", community: "hrconnect", members: 567, posts: 234, type: "public", tags: ["Recruiting", "Sourcing", "Hiring"], admins: [u[3]] },
  { id: "g16", name: "L&D Professionals", description: "Learning & Development strategies, tools, and program design.", cover: "https://picsum.photos/seed/learning/800/300", community: "hrconnect", members: 345, posts: 145, type: "public", tags: ["L&D", "Training", "Development"], admins: [u[3]] },
  { id: "g17", name: "Employer Branding", description: "Building and promoting your employer brand to attract top talent.", cover: "https://picsum.photos/seed/brand/800/300", community: "hrconnect", members: 289, posts: 112, type: "public", tags: ["Branding", "Culture", "EVP"], admins: [u[3]] },
  { id: "g18", name: "D&I Champions", description: "Diversity & Inclusion best practices, metrics, and success stories.", cover: "https://picsum.photos/seed/diversity/800/300", community: "hrconnect", members: 234, posts: 89, type: "public", tags: ["Diversity", "Inclusion", "Equity"], admins: [u[3]] },
  { id: "g19", name: "HR Tech", description: "ATS, HRIS, and HR technology reviews, demos, and discussions.", cover: "https://picsum.photos/seed/hrtech/800/300", community: "hrconnect", members: 456, posts: 198, type: "public", tags: ["HRIS", "ATS", "Technology"], admins: [u[3]] },
  { id: "g20", name: "Leadership & Culture", description: "Building healthy workplace cultures and developing leaders.", cover: "https://picsum.photos/seed/culture/800/300", community: "hrconnect", members: 378, posts: 134, type: "public", tags: ["Leadership", "Culture", "Management"], admins: [u[3]] },
  // LaunchPad
  { id: "g21", name: "Tech Builders", description: "Building products, learning to code, and shipping projects as fresh grads.", cover: "https://picsum.photos/seed/techbuild/800/300", community: "launchpad", members: 789, posts: 345, type: "public", tags: ["Coding", "Products", "Tech"], admins: [u[1], u[4]] },
  { id: "g22", name: "Entrepreneurs", description: "Startup ideas, lean methodology, and founder stories from the Arab world.", cover: "https://picsum.photos/seed/startup/800/300", community: "launchpad", members: 567, posts: 234, type: "public", tags: ["Startups", "Ideas", "Founders"], admins: [u[4]] },
  { id: "g23", name: "Creative Careers", description: "Exploring careers in design, media, art, and creative industries.", cover: "https://picsum.photos/seed/careercreative/800/300", community: "launchpad", members: 345, posts: 156, type: "public", tags: ["Design", "Media", "Arts"], admins: [u[0], u[4]] },
  { id: "g24", name: "International Students", description: "Navigating life, work permits, and careers abroad as an Arab student.", cover: "https://picsum.photos/seed/intl/800/300", community: "launchpad", members: 456, posts: 189, type: "public", tags: ["Study Abroad", "Visas", "Global"], admins: [u[4]] },
];

export const TRENDING_HASHTAGS: Record<string, { tag: string; count: number }[]> = {
  freelancespace: [
    { tag: "Design", count: 342 }, { tag: "React", count: 289 }, { tag: "Freelancing", count: 267 },
    { tag: "AI", count: 198 }, { tag: "Branding", count: 156 },
  ],
  studentzone: [
    { tag: "Hackathon", count: 234 }, { tag: "Leadership", count: 189 }, { tag: "Innovation", count: 167 },
    { tag: "MentalHealth", count: 145 }, { tag: "Competitions", count: 134 },
  ],
  hrconnect: [
    { tag: "Recruitment", count: 278 }, { tag: "HRTech", count: 212 }, { tag: "MENA", count: 189 },
    { tag: "Compensation", count: 156 }, { tag: "EmployerBrand", count: 134 },
  ],
  launchpad: [
    { tag: "CareerAdvice", count: 312 }, { tag: "FreshGrad", count: 267 }, { tag: "Skills", count: 198 },
    { tag: "Startup", count: 167 }, { tag: "Networking", count: 145 },
  ],
};

export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: "n1", type: "like", text: "Ahmed Khalil liked your post about RTL design", avatar: u[1].avatar, read: false, createdAt: "2m ago" },
  { id: "n2", type: "comment", text: "Yasmin El-Sayed commented on your post", avatar: u[5].avatar, read: false, createdAt: "15m ago" },
  { id: "n3", type: "connection", text: "Nour Haddad wants to connect with you", avatar: u[4].avatar, read: false, createdAt: "1h ago", actionable: true },
  { id: "n4", type: "event", text: "Reminder: MENA Design Summit starts tomorrow", avatar: "https://picsum.photos/seed/event/40/40", read: false, createdAt: "2h ago" },
  { id: "n5", type: "badge", text: "You earned the 'Top Contributor' badge! 🏆", avatar: u[0].avatar, read: true, createdAt: "5h ago" },
  { id: "n6", type: "opportunity", text: "New opportunity matches your skills: Senior UI Designer", avatar: "https://picsum.photos/seed/opp/40/40", read: true, createdAt: "8h ago" },
  { id: "n7", type: "group", text: "You were invited to join 'AI & Automation' group", avatar: u[1].avatar, read: true, createdAt: "1d ago", actionable: true },
  { id: "n8", type: "mention", text: "Layla Mansour mentioned you in a post", avatar: u[2].avatar, read: true, createdAt: "1d ago" },
  { id: "n9", type: "challenge", text: "Challenge 'Design for Artisans' ends in 3 days!", avatar: "https://picsum.photos/seed/challenge/40/40", read: true, createdAt: "2d ago" },
  { id: "n10", type: "like", text: "Omar Farouk and 5 others liked your article", avatar: u[3].avatar, read: true, createdAt: "2d ago" },
  { id: "n11", type: "comment", text: "Ahmed Khalil replied to your comment", avatar: u[1].avatar, read: true, createdAt: "3d ago" },
  { id: "n12", type: "connection", text: "Layla Mansour accepted your connection request", avatar: u[2].avatar, read: true, createdAt: "3d ago" },
];

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: "conv1", user: u[1], lastMessage: "Sure, let's schedule a call for tomorrow!", lastTime: "10m ago", unread: 2,
    messages: [
      { id: "m1", from: "them", text: "Hey Sara! Love your latest design work. Would you be open to collaborating on a project?", time: "2h ago", read: true },
      { id: "m2", from: "me", text: "Thanks Ahmed! I'd love to hear more about what you have in mind.", time: "1h ago", read: true },
      { id: "m3", from: "them", text: "It's a dashboard for a fintech startup. They need someone who understands RTL design.", time: "45m ago", read: true },
      { id: "m4", from: "me", text: "That sounds right up my alley! When are you free to discuss?", time: "30m ago", read: true },
      { id: "m5", from: "them", text: "Sure, let's schedule a call for tomorrow!", time: "10m ago", read: false },
    ],
  },
  {
    id: "conv2", user: u[2], lastMessage: "The hackathon details are finalized!", lastTime: "1h ago", unread: 1,
    messages: [
      { id: "m6", from: "them", text: "Hi Sara! We'd love to have you as a mentor at our upcoming hackathon", time: "3h ago", read: true },
      { id: "m7", from: "me", text: "I'd be honored! What are the dates?", time: "2h ago", read: true },
      { id: "m8", from: "them", text: "The hackathon details are finalized!", time: "1h ago", read: false },
    ],
  },
  {
    id: "conv3", user: u[3], lastMessage: "The report is ready for review", lastTime: "3h ago", unread: 0,
    messages: [
      { id: "m9", from: "them", text: "Sara, could you review the employer branding toolkit we discussed?", time: "1d ago", read: true },
      { id: "m10", from: "me", text: "Of course! Send it over and I'll take a look this week.", time: "1d ago", read: true },
      { id: "m11", from: "them", text: "The report is ready for review", time: "3h ago", read: true },
    ],
  },
  {
    id: "conv4", user: u[4], lastMessage: "Thanks for the advice! Really helpful 🙏", lastTime: "1d ago", unread: 0,
    messages: [
      { id: "m12", from: "them", text: "Hi Sara, I'm a fresh grad looking to get into UX design. Any tips?", time: "2d ago", read: true },
      { id: "m13", from: "me", text: "Hey Nour! Start with fundamentals — Nielsen's heuristics, then build 3-4 case studies for your portfolio.", time: "2d ago", read: true },
      { id: "m14", from: "them", text: "Thanks for the advice! Really helpful 🙏", time: "1d ago", read: true },
    ],
  },
  {
    id: "conv5", user: u[5], lastMessage: "Let's co-author that article!", lastTime: "2d ago", unread: 0,
    messages: [
      { id: "m15", from: "me", text: "Yasmin! Your piece on Arabic content strategy was brilliant.", time: "3d ago", read: true },
      { id: "m16", from: "them", text: "Thank you so much! I've been thinking about doing a series on it.", time: "3d ago", read: true },
      { id: "m17", from: "me", text: "We should collaborate! Design + content = powerful combo.", time: "2d ago", read: true },
      { id: "m18", from: "them", text: "Let's co-author that article!", time: "2d ago", read: true },
    ],
  },
];
