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

/* 飛到景點 */
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

/* ⭐ Routing 元件（核心） */
function Routing({ spots, places, color, setRouteInfo, day }) {
  const map = useMap();
  const routingRef = useRef(null);

  useEffect(() => {
    if (!map || !spots || spots.length < 2) return;

    if (routingRef.current) {
      map.removeControl(routingRef.current);
    }

    const waypoints = spots
      .map((item) => {
        if (item.lat && item.lng) return L.latLng(item.lat, item.lng);
        const p = places.find((p) => p.name === item);
        return p ? L.latLng(p.lat, p.lng) : null;
      })
      .filter(Boolean);

    if (waypoints.length < 2) return;

    const routing = L.Routing.control({
      waypoints,
      router: L.Routing.osrmv1({
        serviceUrl: "https://router.project-osrm.org/route/v1",
      }),
      lineOptions: {
        styles: [{ color, weight: 5 }],
      },
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: false,
      show: false,
      createMarker: () => null,
    }).addTo(map);

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
        [day]: { summary, steps },
      }));
    });

    routingRef.current = routing;

    return () => {
      if (routingRef.current) {
        map.removeControl(routingRef.current);
      }
    };
  }, [map, spots, places, color, setRouteInfo, day]);

  return null;
}

function Map({
  places,
  itinerary,
  selectedPlace,
  selectedDay,
  activePlaceName,
  setActivePlaceName,
  setRouteInfo, // ⭐新增
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

        <FlyToPlace selectedPlace={selectedPlace} markerRefs={markerRefs} />

        {/* ⭐ 真實導航 */}
        <Routing
          spots={itinerary?.Day1 || []}
          places={places}
          color="#2563eb"
          day="Day1"
          setRouteInfo={setRouteInfo}
        />
        <Routing
          spots={itinerary?.Day2 || []}
          places={places}
          color="#dc2626"
          day="Day2"
          setRouteInfo={setRouteInfo}
        />
        <Routing
          spots={itinerary?.Day3 || []}
          places={places}
          color="#16a34a"
          day="Day3"
          setRouteInfo={setRouteInfo}
        />

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
                  <p><strong>類型：</strong>{place.type || "景點"}</p>
                  <p><strong>停留：</strong>{place.stayTime || "1~2 小時"}</p>
                  <p><strong>地址：</strong>{place.address || "尚未提供"}</p>
                  <p>{place.description || "推薦旅遊景點"}</p>
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