import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import { useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// 修正 Leaflet 預設 marker 圖示
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const defaultCenter = [25.033964, 121.564468];

// 不同天數顏色
const dayColors = {
  Day1: "blue",
  Day2: "red",
  Day3: "green",
};

// 建立不同顏色 Marker Icon
function createColoredIcon(color) {
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
}

const dayIcons = {
  Day1: createColoredIcon("blue"),
  Day2: createColoredIcon("red"),
  Day3: createColoredIcon("green"),
};

function ChangeMapView({ selectedPlace }) {
  const map = useMap();

  useEffect(() => {
    if (selectedPlace?.lat && selectedPlace?.lng) {
      map.setView([selectedPlace.lat, selectedPlace.lng], 15, {
        animate: true,
      });
    }
  }, [selectedPlace, map]);

  return null;
}

function FitBounds({ places }) {
  const map = useMap();

  useEffect(() => {
    if (!places || places.length === 0) return;

    if (places.length === 1) {
      map.setView([places[0].lat, places[0].lng], 15);
      return;
    }

    const bounds = L.latLngBounds(
      places.map((place) => [place.lat, place.lng])
    );

    map.fitBounds(bounds, { padding: [50, 50] });
  }, [places, map]);

  return null;
}

// 找出某個 place 屬於哪一天
function findPlaceDay(place, itinerary) {
  for (const day in itinerary) {
    if (itinerary[day].some((p) => p.name === place.name)) {
      return day;
    }
  }
  return null;
}

function Map({ places = [], itinerary = {}, selectedPlace = null }) {
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

        <ChangeMapView selectedPlace={selectedPlace} />
        <FitBounds places={places} />

        {/* 推薦景點 Marker */}
        {places.map((place, index) => {
          const day = findPlaceDay(place, itinerary);
          const icon = day ? dayIcons[day] : undefined;

          return (
            <Marker
              key={index}
              position={[place.lat, place.lng]}
              icon={icon}
            >
              <Popup>
                <div className="map-popup">
                  <h4>{place.name}</h4>
                  <p><strong>地址：</strong>{place.address || "尚未提供"}</p>
                  <p><strong>類型：</strong>{place.type || "景點"}</p>
                  <p><strong>建議停留：</strong>{place.stayTime || "1~2 小時"}</p>
                  {day && <p><strong>安排天數：</strong>{day}</p>}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* 畫 Day1 / Day2 / Day3 路線 */}
        {Object.keys(itinerary).map((day) => {
          const route = itinerary[day]
            .filter((place) => place.lat && place.lng)
            .map((place) => [place.lat, place.lng]);

          if (route.length < 2) return null;

          return (
            <Polyline
              key={day}
              positions={route}
              pathOptions={{
                color: dayColors[day] || "gray",
                weight: 5,
              }}
            />
          );
        })}
      </MapContainer>
    </div>
  );
}

export default Map;