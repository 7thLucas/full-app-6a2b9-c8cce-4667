import mongoose, { type Document, type Model, Schema } from "mongoose";

export interface ISighting extends Document {
  photoUrl: string;
  photoPath: string;
  breedName: string;
  breedConfidence: number;
  breedAlternatives: Array<{ breed: string; confidence: number }>;
  location: {
    lat: number | null;
    lng: number | null;
    label: string | null;
  };
  notes: string;
  dogName: string;
  shared: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SightingSchema = new Schema<ISighting>(
  {
    photoUrl: { type: String, required: true },
    photoPath: { type: String, required: true },
    breedName: { type: String, default: "Unknown Breed" },
    breedConfidence: { type: Number, default: 0 },
    breedAlternatives: [
      {
        breed: { type: String },
        confidence: { type: Number },
      },
    ],
    location: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      label: { type: String, default: null },
    },
    notes: { type: String, default: "" },
    dogName: { type: String, default: "" },
    shared: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const SightingModel: Model<ISighting> =
  (mongoose.models.Sighting as Model<ISighting>) ||
  mongoose.model<ISighting>("Sighting", SightingSchema);
