import { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import axios from "axios";
import { supabase } from "../supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import { awardPoints, POINTS } from "../utils/pointsSystem";

const redIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -30],
});

function FlyToLocation({ position }) {
  const map = useMap();
  if (position) {
    map.flyTo([position.lat, position.lng], 16, { animate: true, duration: 1.8 });
  }
  return null;
}

export default function Report() {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [image, setImage] = useState(null);
  const [search, setSearch] = useState("");
  const [markerPos, setMarkerPos] = useState(null);
  const [mapCenter, setMapCenter] = useState({ lat: 17.385, lng: 78.4867 });
  const [status] = useState("Open");

  const searchLocation = async () => {
    if (!search.trim()) return;
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(search)}`;
    const res = await axios.get(url);
    if (res.data?.length > 0) {
      const { lat, lon } = res.data[0];
      const pos = { lat: parseFloat(lat), lng: parseFloat(lon) };
      setMapCenter(pos);
      setMarkerPos(pos);
    }
  };

  const handleMapClick = (e) => {
    setMarkerPos(e.latlng);
  };

  const submitIssue = async (e) => {
    e.preventDefault();

    if (!user) {
      alert("You must be logged in to submit an issue.");
      return;
    }

    if (!title || !desc || !markerPos) {
      alert("Please fill all fields and select a location on the map.");
      return;
    }

    let imageUrl = null;

    // Upload image if provided
    if (image) {
      try {
        const fileExt = image.name.split(".").pop();
        const fileName = `issue-${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        console.log("Uploading image to:", filePath);

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("issue-images")
          .upload(filePath, image, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error("Upload error details:", uploadError);
          
          // Provide more helpful error messages
          if (uploadError.message?.includes("Bucket not found") || uploadError.message?.includes("does not exist")) {
            alert("Storage bucket 'issue-images' not found. Please create it in Supabase Storage settings.");
          } else if (uploadError.message?.includes("new row violates row-level security")) {
            alert("Permission denied. Please check storage bucket policies in Supabase.");
          } else if (uploadError.message?.includes("duplicate")) {
            // Try with different filename
            const retryFileName = `issue-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const retryPath = `${user.id}/${retryFileName}`;
            const { error: retryError } = await supabase.storage
              .from("issue-images")
              .upload(retryPath, image);
            
            if (retryError) {
              alert(`Failed to upload image: ${retryError.message}`);
              return;
            }
            
            const { data: publicUrl } = supabase.storage
              .from("issue-images")
              .getPublicUrl(retryPath);
            imageUrl = publicUrl.publicUrl;
          } else {
            alert(`Failed to upload image: ${uploadError.message || "Unknown error"}`);
            console.error("Full error:", uploadError);
          }
          
          if (!imageUrl) return;
        } else {
          // Upload successful
          const { data: publicUrl } = supabase.storage
            .from("issue-images")
            .getPublicUrl(filePath);

          imageUrl = publicUrl.publicUrl;
          console.log("Image uploaded successfully:", imageUrl);
        }
      } catch (err) {
        console.error("Unexpected upload error:", err);
        alert(`Failed to upload image: ${err.message || "Unexpected error occurred"}`);
        return;
      }
    }

    // Insert into DB with user_id
    // Note: group_id can be added later when assigning to a group
    const { error } = await supabase.from("issues").insert([
      {
        title,
        description: desc,
        image_url: imageUrl,
        latitude: markerPos.lat,
        longitude: markerPos.lng,
        status,
        user_id: user.id,
        group_id: null, // Can be assigned to a group later
      },
    ]);

    if (error) {
      console.error(error);
      alert("Failed to submit issue.");
      return;
    }

    // Award points for reporting an issue
    await awardPoints(user.id, POINTS.REPORT_ISSUE, "Reported an issue");

    alert("Issue Submitted Successfully ✅");

    setTitle("");
    setDesc("");
    setImage(null);
    setMarkerPos(null);
    setSearch("");
  };

  return (
    <div className="max-w-5xl mx-auto pb-10 px-4 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-5xl font-extrabold mb-4 bg-gradient-to-r from-brand to-brand-accent bg-clip-text text-transparent">
          Report an Issue
        </h1>
        <p className="text-gray-600 text-lg">Help improve your neighbourhood by reporting issues that need attention</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Form Section */}
        <div className="bg-gradient-to-br from-white to-purple-50/30 rounded-2xl p-8 shadow-2xl border border-purple-100">
          <form onSubmit={submitIssue} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Issue Title <span className="text-red-500">*</span>
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Broken Streetlight on Main St"
                className="w-full border-2 border-gray-200 p-4 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Describe the issue in detail..."
                rows={5}
                className="w-full border-2 border-gray-200 p-4 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Add Photo (Optional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-purple-400 transition-colors">
                <input
                  type="file"
                  onChange={(e) => setImage(e.target.files[0])}
                  accept="image/*"
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  {image ? (
                    <div className="space-y-2">
                      <svg className="w-12 h-12 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm text-gray-600">{image.name}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <svg className="w-12 h-12 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {markerPos && (
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                <div className="flex items-center gap-2 text-green-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm font-semibold">Location Selected</span>
                </div>
                <p className="text-xs text-green-600 mt-1">
                  {markerPos.lat.toFixed(5)}, {markerPos.lng.toFixed(5)}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={!markerPos}
              className={`w-full bg-gradient-to-r from-brand to-brand-accent text-white px-6 py-4 rounded-xl font-bold text-lg shadow-lg hover:from-brand-dark hover:to-brand transition-all duration-200 ${
                !markerPos ? "opacity-50 cursor-not-allowed" : "hover:scale-[1.02] hover:shadow-xl"
              }`}
            >
              Submit Issue
            </button>
          </form>
        </div>

        {/* Map Section */}
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-2xl p-6 shadow-xl border border-blue-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Select Location</h2>
            <div className="flex gap-2 mb-4">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search location..."
                className="flex-1 border-2 border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={searchLocation}
                className="px-6 bg-gradient-to-r from-brand to-brand-accent text-white rounded-xl font-semibold hover:from-brand-dark hover:to-brand transition-all shadow-md hover:shadow-lg"
              >
                Search
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-4">Or click directly on the map to set location</p>
          </div>

          <div className="h-[500px] w-full rounded-2xl overflow-hidden border-2 border-purple-200 shadow-xl relative z-0">
            <MapContainer
              center={mapCenter}
              zoom={13}
              style={{ height: "100%", width: "100%", position: "relative", zIndex: 0 }}
              whenCreated={(map) => {
                map.on("click", (e) => handleMapClick(e));
              }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {markerPos && (
                <>
                  <FlyToLocation position={markerPos} />
                  <Marker position={markerPos} icon={redIcon}>
                    <Popup>Selected Location</Popup>
                  </Marker>
                </>
              )}
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
