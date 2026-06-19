// Canonical master breed list for Dogedex collection completeness.
//
// The Dogedex collection view shows a silhouette for every breed on this list
// that has not yet been spotted (the "gotta find this one" pull). It is a fixed
// V1 master list of widely-recognised breeds the AI model can plausibly return.
// Sightings whose identified breed is NOT on this list still count as found —
// they surface as "extras" — but the completeness denominator is this list.
//
// Open question (see product-overview.md): the authoritative source/count and
// exact alignment with the AI model's label space are still to be finalised.

export const CANONICAL_BREEDS: string[] = [
  "Labrador Retriever",
  "Golden Retriever",
  "German Shepherd",
  "French Bulldog",
  "Bulldog",
  "Poodle",
  "Beagle",
  "Rottweiler",
  "Dachshund",
  "German Shorthaired Pointer",
  "Pembroke Welsh Corgi",
  "Australian Shepherd",
  "Yorkshire Terrier",
  "Boxer",
  "Cavalier King Charles Spaniel",
  "Doberman Pinscher",
  "Great Dane",
  "Miniature Schnauzer",
  "Siberian Husky",
  "Bernese Mountain Dog",
  "Cane Corso",
  "Shih Tzu",
  "Boston Terrier",
  "Pomeranian",
  "Havanese",
  "English Springer Spaniel",
  "Shetland Sheepdog",
  "Brittany",
  "Pug",
  "Cocker Spaniel",
  "Border Collie",
  "Vizsla",
  "Mastiff",
  "Chihuahua",
  "Maltese",
  "Weimaraner",
  "Collie",
  "Newfoundland",
  "Rhodesian Ridgeback",
  "Shiba Inu",
  "West Highland White Terrier",
  "Bichon Frise",
  "Belgian Malinois",
  "Bloodhound",
  "Akita",
  "St. Bernard",
  "Bullmastiff",
  "Portuguese Water Dog",
  "Australian Cattle Dog",
  "English Setter",
  "Whippet",
  "Chow Chow",
  "Dalmatian",
  "Papillon",
  "Samoyed",
  "Basset Hound",
  "Alaskan Malamute",
  "Great Pyrenees",
  "Jack Russell Terrier",
  "Italian Greyhound",
  "Wheaten Terrier",
  "Lhasa Apso",
  "Old English Sheepdog",
  "Standard Schnauzer",
  "Airedale Terrier",
  "Staffordshire Bull Terrier",
  "American Pit Bull Terrier",
  "Basenji",
  "Border Terrier",
  "Cardigan Welsh Corgi",
];

export const CANONICAL_TOTAL = CANONICAL_BREEDS.length;

function normalizeKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const CANONICAL_BY_KEY = new Map<string, string>(
  CANONICAL_BREEDS.map((b) => [normalizeKey(b), b]),
);

/**
 * Map a raw AI-returned breed name to its canonical form when it matches a
 * known breed (case/punctuation-insensitive). Returns null when the breed is
 * not part of the canonical master list (an "extra").
 */
export function toCanonicalBreed(raw: string | null | undefined): string | null {
  if (!raw) return null;
  return CANONICAL_BY_KEY.get(normalizeKey(raw)) ?? null;
}

export function isCanonicalBreed(raw: string | null | undefined): boolean {
  return toCanonicalBreed(raw) !== null;
}
