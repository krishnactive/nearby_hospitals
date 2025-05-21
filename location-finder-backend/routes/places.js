// routes/places.js
const express = require("express");
const router = express.Router();
const Place = require("../models/Place");

router.get("/nearby", async (req, res) => {
  const { lng, lat, distance = 1 } = req.query;

  try {
    const radius = distance / 6378.1;
    const places = await Place.find({
      location: {
        $geoWithin: {
          $centerSphere: [[parseFloat(lng), parseFloat(lat)], radius],
        },
      },
    });

    res.json(places);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
