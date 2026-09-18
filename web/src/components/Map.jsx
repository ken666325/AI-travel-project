// src/components/Map.jsx

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

/* =========================================================
   修正 Marker icon
========================================================= */

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

/* =========================================================
   飛到景點
========================================================= */

function FlyToPlace({
  selectedPlace,
  markerRefs,
}) {
  const map = useMap();

  useEffect(() => {
    if (!selectedPlace) return;

    if (
      selectedPlace.lat == null ||
      selectedPlace.lng == null
    ) {
      return;
    }

    map.flyTo(
      [
        selectedPlace.lat,
        selectedPlace.lng,
      ],
      15,
      {
        duration: 1.2,
      }
    );

    const marker =
      markerRefs.current[
        selectedPlace.name
      ];

    if (marker) {
      setTimeout(() => {
        marker.openPopup();
      }, 500);
    }
  }, [
    selectedPlace,
    map,
    markerRefs,
  ]);

  return null;
}

/* =========================================================
   路線
========================================================= */

/*
  注意：

  這裡的 Routing 是「地圖道路路線」。

  它目前使用 OSRM：
    - 可以計算道路距離
    - 可以計算道路時間
    - 可以顯示導航步驟

  但它不是 AI 大眾運輸規劃：
    - 不負責捷運班次
    - 不負責公車班次
    - 不負責轉乘
    - 不負責實際發車時間

  未來 AI Backend 的交通資訊會另外放在 routeInfo。
*/

function Routing({
  items,
  places,
  color,
  setRouteInfo,
  day,
}) {
  const map = useMap();

  const routingRef =
    useRef(null);

  useEffect(() => {
    if (!map) return;

    /* =====================================================
       清除舊路線
    ===================================================== */

    if (routingRef.current) {
      map.removeControl(
        routingRef.current
      );

      routingRef.current = null;
    }

    /* =====================================================
       沒有 itinerary item
    ===================================================== */

    if (
      !items ||
      items.length < 2
    ) {
      return;
    }

    /* =====================================================
       只處理 place item

       未來如果 itinerary 裡有其他 itemType，
       例如 transport，就不應該拿去算 waypoint。
    ===================================================== */

    const placeItems =
      items.filter(
        (item) =>
          item.itemType ===
            "place" ||
          !item.itemType
      );

    if (
      placeItems.length < 2
    ) {
      return;
    }

    /* =====================================================
       建立 Waypoints
    ===================================================== */

    const waypoints =
      placeItems
        .map((item) => {
          /* -----------------------------
             優先使用 itinerary item 座標
          ----------------------------- */

          if (
            item.lat != null &&
            item.lng != null
          ) {
            return L.latLng(
              item.lat,
              item.lng
            );
          }

          /* -----------------------------
             如果 item 沒座標，
             從 Sidebar places 找
          ----------------------------- */

          const place =
            places.find(
              (x) =>
                x.name ===
                item.name
            );

          if (
            place &&
            place.lat != null &&
            place.lng != null
          ) {
            return L.latLng(
              place.lat,
              place.lng
            );
          }

          return null;
        })
        .filter(Boolean);

    if (
      waypoints.length < 2
    ) {
      return;
    }

    /* =====================================================
       建立 OSRM Routing
    ===================================================== */

    const routing =
      L.Routing.control({
        waypoints,

        router:
          L.Routing.osrmv1({
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

    /* =====================================================
       OSRM 路線資訊
    ===================================================== */

    routing.on(
      "routesfound",
      function (e) {
        if (
          !e.routes ||
          !e.routes.length
        ) {
          return;
        }

        const route =
          e.routes[0];

        const summary = {
          distance:
            route.summary
              .totalDistance,

          time:
            route.summary
              .totalTime,
        };

        const steps =
          (
            route.instructions ||
            []
          ).map((instruction) => ({
            text:
              instruction.text,

            distance:
              instruction.distance,
          }));

        /*
          注意：

          這裡仍然保留原本 routeInfo
          的結構，避免 Itinerary 現在的
          導航 UI 壞掉。

          未來 AI transport 可以另外
          使用不同資料結構。
        */

        setRouteInfo(
          (prev) => ({
            ...prev,

            [day]: {
              summary,
              steps,

              // 額外標記這是 OSRM 道路路線
              source: "osrm",

              // 記錄這次路線對應的 item
              // 順序，方便未來判斷是否過期
              itemIds:
                placeItems.map(
                  (item) =>
                    item.id
                ),
            },
          })
        );
      }
    );

    routingRef.current =
      routing;

    /* =====================================================
       Cleanup
    ===================================================== */

    return () => {
      if (
        routingRef.current
      ) {
        map.removeControl(
          routingRef.current
        );

        routingRef.current =
          null;
      }
    };
  }, [
    items,
    places,
    map,
    color,
    setRouteInfo,
    day,
  ]);

  return null;
}

/* =========================================================
   路線顏色
========================================================= */

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

/* =========================================================
   Map
========================================================= */

function Map({
  places,
  itinerary,
  selectedPlace,
  activePlaceName,
  setActivePlaceName,
  setRouteInfo,
}) {
  const markerRefs =
    useRef({});

  const defaultCenter = [
    25.0339,
    121.5645,
  ];

  return (
    <div className="map-wrapper">
      <MapContainer
        center={defaultCenter}
        zoom={13}
        scrollWheelZoom={true}
        className="leaflet-map"
      >
        {/* =================================================
            OpenStreetMap
        ================================================= */}

        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* =================================================
            Fly To Selected Place
        ================================================= */}

        <FlyToPlace
          selectedPlace={
            selectedPlace
          }
          markerRefs={
            markerRefs
          }
        />

        {/* =================================================
            每一天的道路路線
        ================================================= */}

        {itinerary.map(
          (
            dayData,
            index
          ) => (
            <Routing
              key={
                dayData.day
              }

              /*
                ⭐ 新資料結構

                舊：
                  spots={dayData.spots}

                新：
                  items={dayData.items}
              */
              items={
                dayData.items || []
              }

              places={
                places
              }

              color={
                routeColors[
                  index %
                    routeColors.length
                ]
              }

              day={`Day${dayData.day}`}

              setRouteInfo={
                setRouteInfo
              }
            />
          )
        )}

        {/* =================================================
            Sidebar Places Marker
        ================================================= */}

        {places.map(
          (
            place,
            index
          ) => {
            if (
              place.lat == null ||
              place.lng == null
            ) {
              return null;
            }

            return (
              <Marker
                key={
                  place.trip_place_id ||
                  `${place.name}-${index}`
                }

                position={[
                  place.lat,
                  place.lng,
                ]}

                ref={(ref) => {
                  if (ref) {
                    markerRefs.current[
                      place.name
                    ] = ref;
                  }
                }}

                eventHandlers={{
                  click: () => {
                    setActivePlaceName(
                      place.name
                    );
                  },
                }}
              >
                <Popup>
                  <div className="map-popup-card">

                    {/* =================================================
                        Image
                    ================================================= */}

                    <img
                      src={
                        place.image
                      }
                      alt={
                        place.name
                      }
                      className="map-popup-image"
                      onError={(e) => {
                        e.target.src =
                          "https://via.placeholder.com/220x110?text=Travel+Place";
                      }}
                    />

                    {/* =================================================
                        Body
                    ================================================= */}

                    <div className="map-popup-body">

                      <h4>
                        {place.name}
                      </h4>

                      <p>
                        <strong>
                          類型：
                        </strong>

                        {place.category ||
                          place.type ||
                          "景點"}
                      </p>

                      <p>
                        <strong>
                          停留：
                        </strong>

                        {place.stayTime ||
                          "1~2 小時"}
                      </p>

                      <p>
                        <strong>
                          地址：
                        </strong>

                        {place.address ||
                          "尚未提供"}
                      </p>

                      <p>
                        {
                          place.description ||
                          "推薦旅遊景點"
                        }
                      </p>

                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          }
        )}
      </MapContainer>
    </div>
  );
}

export default Map;