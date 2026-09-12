import { useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";

/* 修正 Marker icon */
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

/* =========================
   飛到景點
========================= */

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

/* =========================
   路線
========================= */

function Routing({
  spots,
  places,
  color,
  setRouteInfo,
  day,
}) {
  const map = useMap();
  const routingRef = useRef(null);

  useEffect(() => {
    if (!map) return;

    /* 清除舊路線 */
    if (routingRef.current) {
      map.removeControl(routingRef.current);
    }

    if (!spots || spots.length < 2) return;

    const waypoints = spots
      .map((spot) => {
        if (spot.lat && spot.lng) {
          return L.latLng(spot.lat, spot.lng);
        }

        const p = places.find((x) => x.name === spot.name);

        return p
          ? L.latLng(p.lat, p.lng)
          : null;
      })
      .filter(Boolean);

    if (waypoints.length < 2) return;

    const routing = L.Routing.control({
      waypoints,

      router: L.Routing.osrmv1({
        serviceUrl:
          "https://router.project-osrm.org/route/v1",
      }),

      lineOptions: {
        styles: [
          {
            color,
            weight: 5,
          },
        ],
      },

      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: false,
      show: false,
      createMarker: () => null,
    }).addTo(map);

    /* ⭐ 導航資訊 */
    routing.on("routesfound", function (e) {
      const route = e.routes[0];

      const summary = {
        distance: route.summary.totalDistance,
        time: route.summary.totalTime,
      };

      const steps = route.instructions.map((i) => ({
        text: i.text,
        distance: i.distance,
      }));

      setRouteInfo((prev) => ({
        ...prev,
        [day]: {
          summary,
          steps,
        },
      }));
    });

    routingRef.current = routing;

    return () => {
      if (routingRef.current) {
        map.removeControl(routingRef.current);
      }
    };
  }, [spots, map]);

  return null;
}

/* =========================
   顏色
========================= */

const routeColors = [
  "#2563eb",
  "#dc2626",
  "#16a34a",
  "#ca8a04",
  "#9333ea",
  "#db2777",
  "#0891b2",
  "#ea580c",
  "#4f46e5",
  "#65a30d",
];

/* =========================
   Map
========================= */

function Map({
  places,
  itinerary,
  selectedPlace,
  activePlaceName,
  setActivePlaceName,
  setRouteInfo,
}) {
  const markerRefs = useRef({});

  const defaultCenter = [25.0339, 121.5645];

  return (
    <div className="map-wrapper">
      <MapContainer
        center={defaultCenter}
        zoom={13}
        scrollWheelZoom={true}
        className="leaflet-map"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FlyToPlace
          selectedPlace={selectedPlace}
          markerRefs={markerRefs}
        />

        {/* ⭐ 動態路線 */}
        {itinerary.map((dayData, index) => (
          <Routing
            key={dayData.day}
            spots={dayData.spots}
            places={places}
            color={routeColors[index % routeColors.length]}
            day={`Day${dayData.day}`}
            setRouteInfo={setRouteInfo}
          />
        ))}

        {/* Marker */}
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

                  <p>
                    <strong>類型：</strong>
                    {place.type || "景點"}
                  </p>

                  <p>
                    <strong>停留：</strong>
                    {place.stayTime || "1~2 小時"}
                  </p>

                  <p>
                    <strong>地址：</strong>
                    {place.address || "尚未提供"}
                  </p>

                  <p>
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