import path from "node:path";
import { config } from "dotenv";

config({ path: path.join(process.cwd(), ".env.local") });
config();

import { connectToDatabase } from "../lib/db";
import { Event, type EventCategory } from "../models/event";

type SeedEvent = {
  seedId: string;
  title: string;
  category: EventCategory;
  city: string;
  dateTime: Date;
  price: number;
  description: string;
  imageUrl: string;
  isActive: boolean;
};

function eventDate(daysFromNow: number, hour: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(hour, 0, 0, 0);
  return date;
}

function eventImage(seedId: string): string {
  return `https://picsum.photos/seed/${seedId}/800/450`;
}

const sampleEvents: SeedEvent[] = [
  {
    seedId: "sample-01",
    title: "Sundowner Sufi Night",
    category: "Music",
    city: "Mumbai",
    dateTime: eventDate(3, 19),
    price: 499,
    description:
      "An evening of live Sufi music by the sea, with chai stalls and a relaxed open-air seating area. Bring a mat and settle in for soulful qawwalis as the sun goes down.",
    imageUrl: eventImage("sample-01"),
    isActive: true,
  },
  {
    seedId: "sample-02",
    title: "Street Food Walk: Chandni Chowk",
    category: "Food",
    city: "Delhi",
    dateTime: eventDate(5, 17),
    price: 299,
    description:
      "A guided evening walk through Old Delhi's famous lanes, tasting parathas, chaat, jalebis and more. The walk covers about 2 kilometres at an easy pace.",
    imageUrl: eventImage("sample-02"),
    isActive: true,
  },
  {
    seedId: "sample-03",
    title: "React + TypeScript Hands-On Workshop",
    category: "Workshop",
    city: "Bengaluru",
    dateTime: eventDate(2, 10),
    price: 0,
    description:
      "A free full-day workshop for beginners covering component patterns, typing props and state, and building a small project. Bring your own laptop; lunch is provided.",
    imageUrl: eventImage("sample-03"),
    isActive: true,
  },
  {
    seedId: "sample-04",
    title: "Sunday Morning Cricket Meetup",
    category: "Sports",
    city: "Hyderabad",
    dateTime: eventDate(6, 7),
    price: 150,
    description:
      "Friendly tape-ball cricket for working professionals. Teams are shuffled on the spot, and equipment is shared. Suitable for beginners and casual players.",
    imageUrl: eventImage("sample-04"),
    isActive: true,
  },
  {
    seedId: "sample-05",
    title: "Clay Modelling for Kids",
    category: "Kids",
    city: "Chennai",
    dateTime: eventDate(4, 11),
    price: 350,
    description:
      "A fun, hands-on clay modelling session for children aged 5 to 10. All materials are provided, and kids take their creations home. Parents are welcome to stay.",
    imageUrl: eventImage("sample-05"),
    isActive: true,
  },
  {
    seedId: "sample-06",
    title: "Indie Acoustic Open Mic",
    category: "Music",
    city: "Pune",
    dateTime: eventDate(9, 18),
    price: 200,
    description:
      "Local singer-songwriters share the stage for acoustic sets. Entry includes one beverage token. Performer slots can be reserved at the venue on the day of the event.",
    imageUrl: eventImage("sample-06"),
    isActive: false,
  },
  {
    seedId: "sample-07",
    title: "Home Composting Basics",
    category: "Workshop",
    city: "Kolkata",
    dateTime: eventDate(7, 16),
    price: 0,
    description:
      "Learn to compost kitchen waste at home in a balcony or terrace setup. The session covers bin selection, carbon-nitrogen balance, and troubleshooting bad smells.",
    imageUrl: eventImage("sample-07"),
    isActive: true,
  },
  {
    seedId: "sample-08",
    title: "Gujarati Thali Cooking Class",
    category: "Food",
    city: "Ahmedabad",
    dateTime: eventDate(8, 12),
    price: 750,
    description:
      "Cook a full Gujarati thali from scratch: dal, shaak, thepla, kadhi and a sweet. The class is hands-on, small-batch, and includes a printed recipe booklet.",
    imageUrl: eventImage("sample-08"),
    isActive: true,
  },
  {
    seedId: "sample-09",
    title: "Heritage Walk of the Pink City",
    category: "Workshop",
    city: "Jaipur",
    dateTime: eventDate(5, 8),
    price: 400,
    description:
      "A morning walk through the old city's havelis, bazaars and stepwells with a local historian. The route is roughly 3 kilometres and ends with filter coffee.",
    imageUrl: eventImage("sample-09"),
    isActive: true,
  },
  {
    seedId: "sample-10",
    title: "Kayaking Beginners Session",
    category: "Sports",
    city: "Kochi",
    dateTime: eventDate(11, 7),
    price: 1200,
    description:
      "A two-hour guided kayaking session through the backwaters, designed for first-timers. Safety briefing, life jackets and a certified instructor are included.",
    imageUrl: eventImage("sample-10"),
    isActive: false,
  },
  {
    seedId: "sample-11",
    title: "Kite Flying Family Day",
    category: "Kids",
    city: "Lucknow",
    dateTime: eventDate(13, 15),
    price: 100,
    description:
      "An afternoon of kite flying, snacks and music for families. Kites and thread are included in the entry fee. The venue has open lawns and shaded seating.",
    imageUrl: eventImage("sample-11"),
    isActive: true,
  },
  {
    seedId: "sample-12",
    title: "Bollywood Dance Workshop",
    category: "Music",
    city: "Indore",
    dateTime: eventDate(10, 18),
    price: 300,
    description:
      "Learn a short Bollywood routine with a professional choreographer. No experience needed. Wear comfortable clothes; water and parking are available on site.",
    imageUrl: eventImage("sample-12"),
    isActive: true,
  },
  {
    seedId: "sample-13",
    title: "Rock Climbing Intro",
    category: "Sports",
    city: "Chandigarh",
    dateTime: eventDate(-4, 9),
    price: 899,
    description:
      "An introductory session on indoor climbing walls covering belay basics, footwork and safety checks. Gear rental is included in the price.",
    imageUrl: eventImage("sample-13"),
    isActive: true,
  },
  {
    seedId: "sample-14",
    title: "Goan Fish Curry Workshop",
    category: "Food",
    city: "Panaji",
    dateTime: eventDate(-7, 11),
    price: 999,
    description:
      "A coastal cooking session covering Goan fish curry, rice and a simple sol kadhi. Ingredients are sourced from the local market that morning.",
    imageUrl: eventImage("sample-14"),
    isActive: true,
  },
  {
    seedId: "sample-15",
    title: "Storytelling Session for Little Ones",
    category: "Kids",
    city: "Surat",
    dateTime: eventDate(-2, 10),
    price: 250,
    description:
      "An interactive storytelling hour for children aged 3 to 7, with puppets and craft activities. Each child receives a storybook to take home.",
    imageUrl: eventImage("sample-15"),
    isActive: true,
  },
];

async function seedEvents() {
  let inserted = 0;
  let updated = 0;

  for (const { seedId, ...fields } of sampleEvents) {
    const result = await Event.updateOne(
      { seedId },
      { $set: { ...fields, seedId } },
      { upsert: true },
    );

    if (result.upsertedCount > 0) {
      inserted += 1;
    } else {
      updated += 1;
    }
  }

  return { inserted, updated };
}

async function main() {
  const connection = await connectToDatabase();
  const dbName = connection.connection.db?.databaseName ?? "unknown";

  console.log(`Connected to MongoDB database: ${dbName}`);

  try {
    await Event.createIndexes();

    const { inserted, updated } = await seedEvents();
    const sampleCount = await Event.countDocuments({
      seedId: { $exists: true },
    });
    const totalCount = await Event.countDocuments();

    console.log(
      `Seed complete: ${inserted} inserted, ${updated} updated (sample events in database: ${sampleCount}, total events: ${totalCount}).`,
    );
    console.log("Sample events span 15 Indian cities and all 5 categories.");
  } finally {
    await connection.disconnect();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Seed failed: ${message}`);
  process.exitCode = 1;
});
