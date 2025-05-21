const mongoose = require("mongoose");
const Place = require("./models/Place");

mongoose.connect("mongodb://localhost:27017/location-finder");

const data = [
  {
    name: "City Hospital",
    type: "Hospital",
    location: { type: "Point", coordinates: [85.3333, 23.3555] },
  },
  {
    name: "Dr. Shweta Clinic",
    type: "Doctor",
    location: { type: "Point", coordinates: [85.3345, 23.3565] },
  },
];

Place.insertMany(data).then(() => {
  console.log("Data inserted");
  mongoose.disconnect();
});
