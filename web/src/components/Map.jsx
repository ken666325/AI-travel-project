import { useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* 修正 Leaflet Marker icon 問題 */
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

/* 自動飛到景點 + 開 Popup */
function FlyToPlace({ selectedPlace, markerRefs }) {
  const map = useMap();

  useEffect(() => {
    if (!selectedPlace) return;

    map.flyTo([selectedPlace.lat, selectedPlace.lng], 15, {
      duration: 1.2,
    });

    const marker = markerRefs.current[selectedPlace.name];
    if (marker) {
      setTimeout(() => {
        marker.openPopup();
      }, 500);
    }
  }, [selectedPlace, map, markerRefs]);

  return null;
}

function Map({
  places,
  itinerary,
  selectedPlace,
  selectedDay,
  activePlaceName,
  setActivePlaceName,
}) {
  const markerRefs = useRef({});
  const defaultCenter = [25.0339, 121.5645];

  /* 根據 itinerary 找到真正的 place 物件 */
  const getDayRoute = (dayList) => {
    return dayList
      .map((item) => {
        // 如果 itinerary 裡存的是完整物件
        if (item.lat && item.lng) return item;

        // 如果 itinerary 裡存的是字串名稱
        return places.find((p) => p.name === item);
      })
      .filter(Boolean)
      .map((place) => [place.lat, place.lng]);
  };

  const day1Route = getDayRoute(itinerary?.Day1 || []);
  const day2Route = getDayRoute(itinerary?.Day2 || []);
  const day3Route = getDayRoute(itinerary?.Day3 || []);

  return (
    <div className="map-wrapper">
      <MapContainer
        center={defaultCenter}
        zoom={13}
        scrollWheelZoom={true}
        className="leaflet-map"
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FlyToPlace selectedPlace={selectedPlace} markerRefs={markerRefs} />

        {/* ===== 路線畫線 ===== */}
        {day1Route.length >= 2 && (
          <Polyline
            positions={day1Route}
            pathOptions={{
              color: "#2563eb",
              weight: 5,
              opacity: 0.85,
            }}
          />
        )}

        {day2Route.length >= 2 && (
          <Polyline
            positions={day2Route}
            pathOptions={{
              color: "#dc2626",
              weight: 5,
              opacity: 0.85,
            }}
          />
        )}

        {day3Route.length >= 2 && (
          <Polyline
            positions={day3Route}
            pathOptions={{
              color: "#16a34a",
              weight: 5,
              opacity: 0.85,
            }}
          />
        )}

        {/* ===== 景點 Marker ===== */}
        {places.map((place, index) => (
          <Marker
            key={index}
            position={[place.lat, place.lng]}
            ref={(ref) => {
              if (ref) {
                markerRefs.current[place.name] = ref;
              }
            }}
            eventHandlers={{
              click: () => {
                setActivePlaceName(place.name);
              },
            }}
          >
            <Popup>
              <div className="map-popup-card">
                <img
                  src={place.image}
                  alt={place.name}
                  className="map-popup-image"
                  onError={(e) => {
                    e.target.src =
                      "https://via.placeholder.com/220x110?text=Travel+Place";
                  }}
                />
                <div className="map-popup-body">
                  <h4>{place.name}</h4>
                  <p><strong>類型：</strong>{place.type || "景點"}</p>
                  <p><strong>停留：</strong>{place.stayTime || "1~2 小時"}</p>
                  <p><strong>地址：</strong>{place.address || "尚未提供"}</p>
                  <p className="map-desc">
                    {place.description || "推薦旅遊景點"}
                  </p>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default Map;