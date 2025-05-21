import { useState, useEffect } from "react";
import axios from "axios";

const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const reverseGeocode = async (lat, lon) => {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
  const res = await axios.get(url);
  return res.data.display_name;
};

const NearbyPlaces = () => {
  const [placeName, setPlaceName] = useState("");
  const [places, setPlaces] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [myLocation, setMyLocation] = useState(null);
  const [myAddress, setMyAddress] = useState("");
  const [loading, setLoading] = useState(false);

  // 1. Get user's coordinates and convert to address
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        };
        setMyLocation(coords);

        try {
          const addr = await reverseGeocode(coords.lat, coords.lon);
          setMyAddress(addr);
        } catch (e) {
          console.error("Failed to get your address");
        }
      },
      (err) => console.error("Geolocation error:", err)
    );
  }, []);

  const fetchPlaces = async () => {
    if (!placeName) return alert("Enter a place name");
    setLoading(true);

    try {
      const geoRes = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          placeName
        )}&limit=1`
      );

      if (geoRes.data.length === 0) {
        alert("No location found");
        setLoading(false);
        return;
      }

      const { boundingbox } = geoRes.data[0];
      const [s, n, w, e] = boundingbox.map(parseFloat); // south, north, west, east

      const query = `
        [out:json];
        (
          node["amenity"="hospital"](${s},${w},${n},${e});
          node["amenity"="doctors"](${s},${w},${n},${e});
        );
        out body;
      `;
      const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(
        query
      )}`;
      const res = await axios.get(overpassUrl);

      const elements = res.data.elements;

      // For each place, reverse geocode to get address
      const results = await Promise.all(
        elements.map(async (el) => {
          let address = "N/A";
          try {
            const data = await reverseGeocode(el.lat, el.lon);
            address = data;
          } catch {
            address = "Unknown";
          }

          const distance = myLocation
            ? haversineDistance(myLocation.lat, myLocation.lon, el.lat, el.lon)
            : null;

          return {
            id: el.id,
            name: el.tags?.name || "Unnamed",
            type: el.tags.amenity,
            address,
            distance: distance ? distance.toFixed(2) : "N/A",
          };
        })
      );

      setPlaces(results);
    } catch (err) {
      console.error("Error:", err);
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const filteredPlaces = places.filter((place) => {
    const matchesType =
      filterType === "All" || place.type === filterType.toLowerCase();
    const matchesSearch = place.name
      .toLowerCase()
      .includes(searchText.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div style={{ padding: "1rem" }}>
      <h2>🏥 Nearby Doctors & Hospitals</h2>

      {/* Show my location */}
      <div style={{ marginBottom: "1rem", fontStyle: "italic", color: "#555" }}>
        📍 <strong>Your Location:</strong>{" "}
        {myAddress || "Fetching your address..."}
      </div>

      {/* Search form */}
      <div style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          placeholder="Enter city/place name"
          value={placeName}
          onChange={(e) => setPlaceName(e.target.value)}
          style={{ marginRight: "8px" }}
        />
        <button onClick={fetchPlaces}>Search</button>
      </div>

      {/* Filters */}
      {places.length > 0 && (
        <div style={{ marginBottom: "1rem" }}>
          <input
            type="text"
            placeholder="Search name..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ marginRight: "8px" }}
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="All">All</option>
            <option value="hospital">Hospital</option>
            <option value="doctors">Doctor</option>
          </select>
        </div>
      )}

      {/* Results Table */}
      {loading ? (
        <p>Loading...</p>
      ) : filteredPlaces.length > 0 ? (
        <table
          border="1"
          cellPadding="8"
          style={{ borderCollapse: "collapse", width: "100%" }}
        >
          <thead>
            <tr style={{ backgroundColor: "#eee" }}>
              <th>Name</th>
              <th>Type</th>
              <th>Address</th>
              <th>Distance (km)</th>
            </tr>
          </thead>
          <tbody>
            {filteredPlaces.map((place) => (
              <tr key={place.id}>
                <td>{place.name}</td>
                <td>{place.type}</td>
                <td>{place.address}</td>
                <td>{place.distance}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        !loading && <p>No results found.</p>
      )}
    </div>
  );
};

export default NearbyPlaces;
