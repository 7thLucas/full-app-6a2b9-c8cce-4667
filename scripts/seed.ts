// Seed the Dogedex with realistic sample sightings so the Feed, Map, Dogedex
// collection, and You stats all have content to show.
//
//   MONGODB_URI=... npm run seed          # wipe + reseed (default)
//   MONGODB_URI=... npm run seed -- --keep # append without wiping
//
// Photos come from the deck image-generation endpoint (no key required), so
// the seed is deterministic and needs no local image assets. Dates are spread
// across the last ~12 days with a 5-day consecutive run at the end to populate
// the spotting streak; rarity falls out of how often each breed repeats.

import "dotenv/config";
import mongoose from "mongoose";
import { SightingModel } from "../app/models/sighting.model.js";
import { createLogger } from "../lib/logger.js";

const logger = createLogger("Seed");

const DAY = 86_400_000;
const now = Date.now();
const daysAgo = (n: number, hour = 10) => {
  const d = new Date(now - n * DAY);
  d.setHours(hour, (n * 7) % 60, 0, 0);
  return d;
};

function photo(breed: string, scene: string): string {
  const prompt = `candid editorial photo of a ${breed} dog ${scene}, warm daylight, joyful, shallow depth of field`;
  return `https://api.qb-deck.quantumbyte.ai/common/image-generation?prompt=${encodeURIComponent(prompt)}`;
}

interface Place {
  label: string;
  lat: number;
  lng: number;
}
const PLACES: Record<string, Place> = {
  centralPark: { label: "Central Park, New York", lat: 40.7829, lng: -73.9654 },
  hydePark: { label: "Hyde Park, London", lat: 51.5073, lng: -0.1657 },
  yoyogi: { label: "Yoyogi Park, Tokyo", lat: 35.6716, lng: 139.6949 },
  dolores: { label: "Dolores Park, San Francisco", lat: 37.7596, lng: -122.4269 },
  champDeMars: { label: "Champ de Mars, Paris", lat: 48.8556, lng: 2.2986 },
  tiergarten: { label: "Tiergarten, Berlin", lat: 52.5145, lng: 13.3501 },
  bondi: { label: "Bondi Beach, Sydney", lat: -33.8908, lng: 151.2743 },
  vondelpark: { label: "Vondelpark, Amsterdam", lat: 52.3579, lng: 4.8686 },
  highPark: { label: "High Park, Toronto", lat: 43.6465, lng: -79.4637 },
  botanic: { label: "Botanic Gardens, Singapore", lat: 1.3138, lng: 103.8159 },
};

interface SeedEntry {
  breed: string;
  scene: string;
  place: Place;
  dogName?: string;
  notes?: string;
  confidence: number;
  daysAgo: number;
  shared: boolean;
  alts?: Array<{ breed: string; confidence: number }>;
}

// Breed repetition drives rarity: singles land legendary, pairs rare, etc.
const ENTRIES: SeedEntry[] = [
  { breed: "Golden Retriever", scene: "fetching a ball in a sunny park", place: PLACES.centralPark, dogName: "Sunny", notes: "Absolute golden goofball, would not drop the ball.", confidence: 0.96, daysAgo: 0, shared: true, alts: [{ breed: "Labrador Retriever", confidence: 0.31 }] },
  { breed: "Pembroke Welsh Corgi", scene: "trotting on short legs along a path", place: PLACES.hydePark, dogName: "Biscuit", notes: "Tiny legs, enormous personality.", confidence: 0.93, daysAgo: 0, shared: true },
  { breed: "Shiba Inu", scene: "sitting proudly with a curled tail", place: PLACES.yoyogi, dogName: "Kuma", notes: "Did the shiba scream when it was time to leave.", confidence: 0.9, daysAgo: 1, shared: true },
  { breed: "French Bulldog", scene: "lounging on a café chair", place: PLACES.dolores, dogName: "Gizmo", notes: "Bat ears on full alert for snacks.", confidence: 0.95, daysAgo: 1, shared: true },
  { breed: "Border Collie", scene: "mid-leap catching a frisbee", place: PLACES.bondi, dogName: "Pip", notes: "Smartest dog at the beach by a mile.", confidence: 0.88, daysAgo: 2, shared: true },
  { breed: "Labrador Retriever", scene: "splashing in a pond", place: PLACES.highPark, dogName: "Cooper", confidence: 0.94, daysAgo: 2, shared: true },
  { breed: "Siberian Husky", scene: "with striking blue eyes in the snow", place: PLACES.tiergarten, dogName: "Loki", notes: "Talked back the entire walk.", confidence: 0.91, daysAgo: 3, shared: true },
  { breed: "German Shepherd", scene: "alert and standing tall", place: PLACES.champDeMars, dogName: "Rex", confidence: 0.92, daysAgo: 3, shared: true },
  { breed: "Dachshund", scene: "stretched out long in the grass", place: PLACES.vondelpark, dogName: "Frankie", notes: "A whole hot dog.", confidence: 0.89, daysAgo: 4, shared: true },
  { breed: "Golden Retriever", scene: "smiling with tongue out", place: PLACES.botanic, dogName: "Mango", confidence: 0.95, daysAgo: 4, shared: true },
  { breed: "Pug", scene: "with a wrinkly curious face", place: PLACES.hydePark, dogName: "Otis", notes: "Snorted hello at everyone.", confidence: 0.87, daysAgo: 5, shared: true },
  { breed: "Samoyed", scene: "fluffy white coat and a big smile", place: PLACES.yoyogi, dogName: "Cloud", notes: "Walking marshmallow.", confidence: 0.93, daysAgo: 6, shared: true },
  { breed: "French Bulldog", scene: "wrapped in a tiny sweater", place: PLACES.centralPark, dogName: "Pixel", confidence: 0.9, daysAgo: 7, shared: true },
  { breed: "Beagle", scene: "nose to the ground following a scent", place: PLACES.dolores, dogName: "Daisy", notes: "Tracked something for ten whole minutes.", confidence: 0.85, daysAgo: 8, shared: true },
  { breed: "Great Dane", scene: "towering gently over a bench", place: PLACES.tiergarten, dogName: "Atlas", notes: "Thinks he is a lapdog.", confidence: 0.91, daysAgo: 9, shared: true },
  { breed: "German Shepherd", scene: "running across an open field", place: PLACES.bondi, confidence: 0.86, daysAgo: 10, shared: true },
  { breed: "Australian Shepherd", scene: "with merle coat herding instinct", place: PLACES.highPark, dogName: "Sage", confidence: 0.88, daysAgo: 11, shared: true },
  // A non-canonical "extra" to exercise the Dogedex extras section.
  { breed: "Goldendoodle", scene: "curly teddy-bear coat", place: PLACES.vondelpark, dogName: "Waffles", notes: "Half golden, half cloud.", confidence: 0.79, daysAgo: 6, shared: true, alts: [{ breed: "Poodle", confidence: 0.4 }, { breed: "Golden Retriever", confidence: 0.36 }] },
  // A couple kept private (not shared): show in Dogedex, absent from Feed/Map.
  { breed: "Golden Retriever", scene: "asleep in a sunbeam", place: PLACES.centralPark, dogName: "Honey", notes: "Private favourite.", confidence: 0.97, daysAgo: 2, shared: false },
  { breed: "Chihuahua", scene: "peeking out of a tote bag", place: PLACES.champDeMars, dogName: "Pepe", confidence: 0.82, daysAgo: 5, shared: false },
];

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    logger.error("MONGODB_URI not set — cannot seed. Set it in .env and retry.");
    process.exit(1);
  }

  await mongoose.connect(uri);
  logger.info("Connected to MongoDB");

  const keep = process.argv.includes("--keep");
  if (!keep) {
    const { deletedCount } = await SightingModel.deleteMany({});
    logger.info(`Cleared ${deletedCount} existing sightings`);
  }

  const docs = ENTRIES.map((e) => {
    const created = daysAgo(e.daysAgo);
    return {
      photoUrl: photo(e.breed, e.scene),
      photoPath: "seed",
      breedName: e.breed,
      breedConfidence: e.confidence,
      breedAlternatives: e.alts ?? [],
      location: { lat: e.place.lat, lng: e.place.lng, label: e.place.label },
      notes: e.notes ?? "",
      dogName: e.dogName ?? "",
      shared: e.shared,
      createdAt: created,
      updatedAt: created,
    };
  });

  // Disable auto timestamps so our spread-out createdAt dates survive (needed
  // for the streak calculation). `timestamps` is honoured at runtime but is
  // absent from this mongoose version's InsertManyOptions type, hence the cast.
  await SightingModel.insertMany(docs, { timestamps: false } as Record<string, unknown>);
  logger.info(`Seeded ${docs.length} sightings across ${new Set(ENTRIES.map((e) => e.place.label)).size} places`);

  const shared = docs.filter((d) => d.shared).length;
  const breeds = new Set(docs.map((d) => d.breedName)).size;
  logger.info(`  ${shared} shared (Feed + Map), ${docs.length - shared} private, ${breeds} unique breeds`);

  await mongoose.disconnect();
  logger.info("Done");
}

main().catch((err) => {
  logger.error("Seed failed", err);
  process.exit(1);
});
