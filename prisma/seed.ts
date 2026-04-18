import { PrismaClient, Role, RegistrationStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";

const prisma = new PrismaClient();

const INTERESTS = [
  { slug: "climbing", label: "Climbing" },
  { slug: "ai", label: "AI" },
  { slug: "yoga", label: "Yoga" },
  { slug: "board-games", label: "Board Games" },
  { slug: "hiking", label: "Hiking" },
  { slug: "photography", label: "Photography" },
  { slug: "coffee", label: "Coffee" },
  { slug: "startups", label: "Startups" },
  { slug: "running", label: "Running" },
  { slug: "cooking", label: "Cooking" },
  { slug: "reading", label: "Reading" },
  { slug: "live-music", label: "Live Music" },
];

function pickN<T>(arr: T[], n: number): T[] {
  const a = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && a.length; i++) {
    const idx = Math.floor(Math.random() * a.length);
    out.push(a.splice(idx, 1)[0]);
  }
  return out;
}

function refCode(): string {
  return randomBytes(4).toString("hex").toUpperCase();
}

async function main() {
  // Skip if already seeded (prevents wiping prod on container redeploy).
  if (process.env.SEED_SKIP_IF_POPULATED !== "false") {
    const existing = await prisma.user.count();
    if (existing > 0) {
      console.log(`Seed skipped: ${existing} users already exist. Set SEED_SKIP_IF_POPULATED=false to force.`);
      return;
    }
  }

  await prisma.review.deleteMany();
  await prisma.registration.deleteMany();
  await prisma.eventInterest.deleteMany();
  await prisma.event.deleteMany();
  await prisma.userInterest.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.interest.deleteMany();

  // Interests
  await prisma.interest.createMany({ data: INTERESTS });
  const interests = await prisma.interest.findMany();

  const pwHash = await bcrypt.hash("password123", 10);

  // Admin (no UI, but seeded)
  await prisma.user.create({
    data: {
      email: "admin@socialzone.local",
      passwordHash: pwHash,
      displayName: "Admin",
      role: Role.ADMIN,
      referralCode: refCode(),
      emailVerifiedAt: new Date(),
    },
  });

  // Hosts (≥3)
  const hosts = await Promise.all(
    [
      { email: "alice@host.local", name: "Alice Wu", city: "San Francisco" },
      { email: "ben@host.local", name: "Ben Ortega", city: "New York" },
      { email: "carol@host.local", name: "Carol Singh", city: "Austin" },
    ].map((h) =>
      prisma.user.create({
        data: {
          email: h.email,
          passwordHash: pwHash,
          displayName: h.name,
          city: h.city,
          profession: "Community Host",
          bio: `Hosting events in ${h.city}.`,
          referralCode: refCode(),
          emailVerifiedAt: new Date(),
          interests: {
            create: pickN(interests, 5).map((i) => ({ interestId: i.id })),
          },
        },
      }),
    ),
  );

  // Attendees (≥20)
  const professions = ["Engineer", "Designer", "Writer", "Teacher", "Student", "PM", "Founder"];
  const cities = ["San Francisco", "New York", "Austin", "Seattle", "Chicago"];
  const attendees = await Promise.all(
    Array.from({ length: 22 }).map((_, i) =>
      prisma.user.create({
        data: {
          email: `user${i + 1}@example.local`,
          passwordHash: pwHash,
          displayName: `User ${i + 1}`,
          bio: `Curious human #${i + 1}.`,
          city: cities[i % cities.length],
          profession: professions[i % professions.length],
          referralCode: refCode(),
          referredByCode: i % 4 === 0 ? hosts[0].referralCode : undefined,
          emailVerifiedAt: new Date(),
          interests: {
            create: pickN(interests, 3 + (i % 4)).map((int) => ({ interestId: int.id })),
          },
        },
      }),
    ),
  );

  // Events: ≥10, spread past/future
  const now = Date.now();
  const H = 60 * 60 * 1000;
  const D = 24 * H;

  const eventSpecs = [
    { title: "Bouldering Meetup at Dogpatch", days: +3, tags: ["climbing", "coffee"], host: 0, price: 1500, cap: 20 },
    { title: "AI Builders Night", days: +7, tags: ["ai", "startups"], host: 1, price: 0, cap: 40 },
    { title: "Sunrise Yoga in Dolores Park", days: +2, tags: ["yoga", "running"], host: 0, price: 500, cap: 30 },
    { title: "Board Games Cafe Takeover", days: +5, tags: ["board-games", "coffee"], host: 2, price: 800, cap: 25 },
    { title: "Golden Gate Hike", days: +10, tags: ["hiking", "photography"], host: 0, price: 0, cap: 15 },
    { title: "Street Photography Walk", days: +4, tags: ["photography", "coffee"], host: 1, price: 1200, cap: 12 },
    { title: "Founder Storytelling Dinner", days: +14, tags: ["startups", "cooking"], host: 2, price: 4500, cap: 18 },
    { title: "Saturday Long Run Club", days: +1, tags: ["running"], host: 0, price: 0, cap: 50 },
    { title: "Jazz Listening Session", days: +9, tags: ["live-music", "reading"], host: 1, price: 2000, cap: 22 },
    { title: "Supper Club: Pasta from Scratch", days: +6, tags: ["cooking", "reading"], host: 2, price: 5500, cap: 10 },
    // Past events — enable review seeding
    { title: "AI Ethics Roundtable", days: -7, tags: ["ai", "reading"], host: 1, price: 0, cap: 30 },
    { title: "Book Swap Brunch", days: -14, tags: ["reading", "coffee"], host: 2, price: 1000, cap: 20 },
  ];

  const slugToId = new Map(interests.map((i) => [i.slug, i.id]));

  for (const spec of eventSpecs) {
    const startsAt = new Date(now + spec.days * D + 18 * H);
    const endsAt = new Date(startsAt.getTime() + 2 * H);
    const host = hosts[spec.host];
    const ev = await prisma.event.create({
      data: {
        hostId: host.id,
        title: spec.title,
        description: `${spec.title} — hosted by ${host.displayName}. Come meet the community.`,
        startsAt,
        endsAt,
        timezone: "America/Los_Angeles",
        addressText: `${host.city}, somewhere nice`,
        capacity: spec.cap,
        priceMinor: spec.price,
        interests: {
          create: spec.tags
            .map((t) => slugToId.get(t))
            .filter((x): x is string => Boolean(x))
            .map((interestId) => ({ interestId })),
        },
      },
    });

    // Seed registrations (PAID) — mix of attendees, keep under capacity
    const regCount = Math.min(spec.cap, 3 + Math.floor(Math.random() * 5));
    const regAttendees = pickN(attendees, regCount);
    for (const a of regAttendees) {
      await prisma.registration.create({
        data: {
          userId: a.id,
          eventId: ev.id,
          status: RegistrationStatus.PAID,
          amountMinor: spec.price,
          stripeCheckoutSessionId: `cs_seed_${ev.id}_${a.id}`.slice(0, 90),
          stripePaymentIntentId: `pi_seed_${ev.id}_${a.id}`.slice(0, 90),
          paidAt: new Date(now - 2 * D),
        },
      });

      // Reviews only for past events
      if (spec.days < 0 && Math.random() < 0.7) {
        await prisma.review.create({
          data: {
            userId: a.id,
            eventId: ev.id,
            stars: 3 + Math.floor(Math.random() * 3),
            text: "Had a great time. Would come again.",
          },
        });
      }
    }
  }

  console.log("Seed complete.");
  console.log("Login with any seeded user + password: password123");
  console.log("  host: alice@host.local");
  console.log("  attendee: user1@example.local");
  console.log("  admin: admin@socialzone.local");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
