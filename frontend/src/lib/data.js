import {
    Shield, Database, HardDrive, Cable, FunctionSquare, Radio,
    Sparkles, LineChart, Package, Users, Rocket
} from "lucide-react";

export const NAV_LINKS = [
    { label: "Product", href: "#features" },
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "Docs", href: "/docs" },
    { label: "Blog", href: "#blog" },
    { label: "About", href: "/about" },
];

export const FEATURES = [
    {
        key: "ai",
        icon: Sparkles,
        title: "AI Backend Generation",
        blurb: "Describe your app in plain English. Backendly generates the schema, APIs, auth rules, and serverless functions — ready to deploy.",
        bullets: ["Schema inference", "Auto-generated APIs", "Serverless functions", "Type-safe SDKs"],
        span: "md:col-span-2 md:row-span-2",
        featured: true,
    },
    { key: "auth", icon: Shield, title: "Authentication",
      blurb: "Social login, magic links, MFA, and battle-tested session management." },
    { key: "db", icon: Database, title: "Database",
      blurb: "Managed Postgres with instant REST + GraphQL APIs and branching." },
    { key: "realtime", icon: Radio, title: "Realtime",
      blurb: "Websockets, presence, and live queries with sub-100ms latency.",
      span: "md:row-span-2" },
    { key: "storage", icon: HardDrive, title: "File Storage",
      blurb: "S3-compatible object storage with CDN and on-the-fly image transforms." },
    { key: "functions", icon: FunctionSquare, title: "Serverless Functions",
      blurb: "Deploy in seconds. Any runtime. Zero cold starts on hot paths." },
    { key: "api", icon: Cable, title: "REST & GraphQL",
      blurb: "Type-safe APIs generated from your schema. Versioning built in." },
    { key: "analytics", icon: LineChart, title: "Analytics",
      blurb: "Request logs, performance metrics, and anomaly alerts out of the box." },
    { key: "sdks", icon: Package, title: "SDKs",
      blurb: "First-class SDKs for JS/TS, Python, Go, Swift, and Kotlin." },
    { key: "team", icon: Users, title: "Team Collaboration",
      blurb: "Roles, permissions, and shared environments with audit trails." },
    { key: "deploy", icon: Rocket, title: "Deployment Tools",
      blurb: "One-click deploy, preview environments, and instant rollbacks." },
];

export const CODE_SAMPLES = {
    JavaScript: `import { createClient } from "@backendly/sdk";

const backendly = createClient({
  projectId: "prj_9f2a1c",
  apiKey: process.env.BACKENDLY_KEY,
});

// Sign a user in with a magic link
await backendly.auth.signInWithLink({
  email: "ada@lovelace.dev",
});

// Realtime — subscribe to changes on any table
backendly
  .from("orders")
  .on("insert", (row) => console.log("new order", row))
  .subscribe();`,
    Python: `from backendly import Backendly

backendly = Backendly(
    project_id="prj_9f2a1c",
    api_key=os.environ["BACKENDLY_KEY"],
)

# Query the auto-generated REST layer
orders = backendly.from_("orders") \\
    .select("id, total, user(email)") \\
    .eq("status", "paid") \\
    .limit(50) \\
    .execute()

print(orders.data)`,
    Go: `package main

import "github.com/backendly/go-sdk/backendly"

func main() {
    client := backendly.New(backendly.Config{
        ProjectID: "prj_9f2a1c",
        APIKey:    os.Getenv("BACKENDLY_KEY"),
    })

    var orders []Order
    err := client.From("orders").
        Select("id, total").
        Eq("status", "paid").
        Fetch(&orders)
}`,
    cURL: `curl https://api.backendly.dev/v1/orders \\
  -H "Authorization: Bearer $BACKENDLY_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "user_id": "usr_01H8...",
    "items": [{ "sku": "shirt-001", "qty": 2 }],
    "total": 4998
  }'`,
};

export const INTEGRATIONS = [
    { name: "Next.js", key: "SiNextdotjs" },
    { name: "React", key: "SiReact" },
    { name: "Vue", key: "SiVuedotjs" },
    { name: "Svelte", key: "SiSvelte" },
    { name: "Flutter", key: "SiFlutter" },
    { name: "React Native", key: "SiExpo" },
    { name: "Stripe", key: "SiStripe" },
    { name: "Vercel", key: "SiVercel" },
    { name: "GitHub", key: "SiGithub" },
    { name: "Slack", key: "SiSlack" },
    { name: "Zapier", key: "SiZapier" },
    { name: "Discord", key: "SiDiscord" },
];

export const LOGOS = [
    "SiVercel", "SiSupabase", "SiRailway", "SiCloudflare",
    "SiLinear", "SiNotion", "SiFramer", "SiFigma",
    "SiPrisma", "SiTailwindcss",
];

export const PRICING_FEATURES = [
    "Authentication (social, magic link, MFA)",
    "Managed Postgres database with branching",
    "S3-compatible file storage + CDN",
    "REST & GraphQL APIs, auto-generated",
    "Serverless functions in any runtime",
    "Realtime websockets & live queries",
    "AI-powered backend generation",
    "Analytics, monitoring & alerts",
    "SDKs for JS, Python, Go, Swift, Kotlin",
    "Team roles, permissions, environments",
    "One-click deploy & instant rollbacks",
];

export const TESTIMONIALS = [
    { name: "Ada Chen", role: "Founder, Ledgerly", handle: "@adachen",
      quote: "We replaced Firebase, Auth0, and a half-broken cron server in an afternoon. Ship velocity doubled." },
    { name: "Marcus Reid", role: "Staff Eng, Northwind", handle: "@marcusreid",
      quote: "The AI schema generator gave us a better data model than the one our team argued about for two weeks." },
    { name: "Priya Shah", role: "Indie hacker", handle: "@priya_ships",
      quote: "I launched three side projects last month. Backendly is the only reason that math works." },
    { name: "Kenji Watanabe", role: "CTO, Kaigan Labs", handle: "@kenji_w",
      quote: "Realtime, auth, storage, and Postgres in one platform — and the migrations actually run in production." },
    { name: "Sofia Rossi", role: "Full-stack dev", handle: "@sofia.dev",
      quote: "The docs feel like they were written by someone who has actually written a bug." },
    { name: "Diego Alvarez", role: "Lead Eng, Cerulean", handle: "@diego_a",
      quote: "Migration from Supabase took two hours. Perf is noticeably faster. My infra bill dropped to $0." },
];

export const BLOG_POSTS = [
    {
        category: "Engineering",
        title: "How we built branchable Postgres without breaking your migrations",
        excerpt: "A deep dive into copy-on-write storage, logical replication, and the seven bugs we hit shipping database branches.",
        date: "Dec 12, 2025",
        readTime: "8 min read",
    },
    {
        category: "Product",
        title: "Introducing AI Backend Generation",
        excerpt: "Describe your app. Get a schema, APIs, auth rules, and a functions scaffold you can actually ship.",
        date: "Dec 4, 2025",
        readTime: "5 min read",
    },
    {
        category: "Guides",
        title: "Migrating from Firebase to Backendly in an afternoon",
        excerpt: "A pragmatic, non-preachy guide with the exact scripts we used to move a production app off Firestore.",
        date: "Nov 27, 2025",
        readTime: "12 min read",
    },
];

export const FAQS = [
    { q: "Wait — Backendly is really free?",
      a: "Yes. Every feature is included on the free tier. We monetise through optional dedicated infrastructure for teams that need it, but the platform itself stays free for individual developers and small teams." },
    { q: "Who owns my data?",
      a: "You do. Full stop. Your database is standard Postgres, your files sit in S3-compatible storage, and you can export everything with one command — no proprietary lock-in." },
    { q: "Can I self-host Backendly?",
      a: "The open-source runtime is available for self-hosting. Managed Backendly gives you zero-ops, global edge, and automated backups on top of the same core." },
    { q: "How does migration from Firebase or Supabase work?",
      a: "We provide first-class migration CLIs for both. Most projects move in under an hour, and our team is on Discord if you get stuck." },
    { q: "What about security and compliance?",
      a: "SOC 2 Type II, GDPR, and HIPAA-ready configurations. All data is encrypted at rest (AES-256) and in transit (TLS 1.3). Row-level security is on by default." },
    { q: "What's the uptime SLA?",
      a: "99.99% on the managed platform, with a public status page and postmortems on every incident." },
    { q: "Are there limits on the AI features?",
      a: "Generous free-tier generation credits reset monthly. Heavy users can request an increase — we don't want price to be the reason you don't ship." },
    { q: "How do I get support?",
      a: "Community support in Discord, GitHub issues for bugs, and a direct line to engineering for teams on dedicated infrastructure." },
];

export const TEAM = [
    { name: "Rohan Mehta", role: "Co-founder & CEO", initials: "RM" },
    { name: "Yuki Tanaka", role: "Co-founder & CTO", initials: "YT" },
    { name: "Zara Okafor", role: "Head of Engineering", initials: "ZO" },
    { name: "Leo García", role: "Design", initials: "LG" },
    { name: "Ines Dubois", role: "Developer Relations", initials: "ID" },
    { name: "Sam Park", role: "Platform Engineer", initials: "SP" },
];

export const VALUES = [
    { title: "Developer-first",
      body: "Every decision is measured against one question: does it help someone ship faster today?" },
    { title: "Reliability",
      body: "Backends are load-bearing. We treat uptime, correctness, and durability as non-negotiable." },
    { title: "Transparency",
      body: "Open pricing, open status page, open changelog, open source where it matters." },
    { title: "Speed",
      body: "Fast APIs, fast dashboards, fast support. Latency is a feature." },
];

export const STATS = [
    { value: 10, suffix: "M+", label: "API requests per day" },
    { value: 150, suffix: "+", label: "Countries served" },
    { value: 99.99, suffix: "%", label: "Platform uptime" },
    { value: 42000, suffix: "+", label: "Developers building" },
];
