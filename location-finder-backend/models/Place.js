// models/Place.js
const mongoose = require("mongoose");

const placeSchema = new mongoose.Schema({
  name: String,
  type: { type: String, enum: ["Doctor", "Hospital"] },
  location: {
    type: { type: String, default: "Point" },
    coordinates: [Number], // [longitude, latitude]
  },
});

placeSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Place", placeSchema);
