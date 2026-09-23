import { useEffect, useRef, useState } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
} from "@hello-pangea/dnd";

const API_BASE = "http://localhost:5000/api";

/* =========================================================
   ID / Factory
========================================================= */

const createItemId = () =>
  `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const createEmptyTransport = () => ({
  mode: "",
  duration: "",
  distance: "",
  note: "",
  steps: [],
});

/* =========================================================
   Transport helpers
========================================================= */

const getTransportModeLabel = (mode) => {
  switch (mode) {
    case "walk":
      return "走路";
    case "transit":
      return "大眾運輸";
    case "taxi":
      return "計程車";
    default:
      return "尚未設定";
  }
};

const getTransportModeIcon = (mode) => {
  switch (mode) {
    case "walk":
      return "🚶";
    case "transit":
      return "🚇";
    case "taxi":
      return "🚕";
    default:
      return "🚗";
  }
};

const getTransportStepIcon = (mode) => {
  switch (mode) {
    case "walk":
      return "🚶";

    case "metro":
      return "🚇";

    case "bus":
      return "🚌";

    case "taxi":
      return "🚕";

    case "drive":
      return "🚗";

    case "bike":
      return "🚲";

    case "transit":
      return "🚇";

    default:
      return "🚦";
  }
};

/* =========================================================
   Normalize Item
========================================================= */

const normalizeItem = (item) => {
  if (!item) return null;

  const normalizedTransport =
    item.transportToNext &&
    typeof item.transportToNext === "object"
      ? {
          mode: item.transportToNext.mode || "",
          duration: item.transportToNext.duration || "",
          distance: item.transportToNext.distance || "",
          note: item.transportToNext.note || "",
          steps: Array.isArray(item.transportToNext.steps)
            ? item.transportToNext.steps
            : [],
        }
      : null;

  return {
    ...item,

    id: item.id || createItemId(),

    itemType: item.itemType || "place",

    role: item.role || "spot",

    placeId:
      item.placeId !== undefined && item.placeId !== null
        ? item.placeId
        : null,

    name: item.name || "未命名地點",

    lat:
      item.lat !== undefined && item.lat !== null
        ? Number(item.lat)
        : null,

    lng:
      item.lng !== undefined && item.lng !== null
        ? Number(item.lng)
        : null,

    address: item.address || item.location || "",

    category: item.category || item.type || "",

    type: item.type || item.category || "",

    rating:
      item.rating !== undefined && item.rating !== null
        ? item.rating
        : "",

    cost:
      item.cost !== undefined && item.cost !== null
        ? item.cost
        : "",

    image: item.image || "",

    startTime: item.startTime || "",

    endTime: item.endTime || "",

    stayTime: item.stayTime || "",

    activeTime: item.activeTime || "",

    description: item.description || "",

    transportToNext: normalizedTransport,
  };
};

/* =========================================================
   Normalize Itinerary
========================================================= */

const normalizeItinerary = (data) => {
  if (!Array.isArray(data)) {
    return [];
  }

  return data.map((day, index) => ({
    ...day,

    day:
      Number(day.day) ||
      Number(day.day_number) ||
      index + 1,

    items: Array.isArray(day.items)
      ? day.items
          .map(normalizeItem)
          .filter(Boolean)
      : [],
  }));
};

/* =========================================================
   Transport Card 2.0
========================================================= */

function ManualTransportCard({
  dayNumber,
  fromItem,
  toItem,
  transport,
  updateTransport,
}) {
  const [showDetails, setShowDetails] = useState(false);

  const data = {
    ...createEmptyTransport(),
    ...(transport || {}),
    steps: Array.isArray(transport?.steps)
      ? transport.steps
      : [],
  };

  const hasSteps = data.steps.length > 0;

  /* -------------------------------------------------------
     Change transport mode
     
     When mode changes:
     - keep mode
     - clear duration
     - clear distance
     - clear old route steps
     - keep note
  ------------------------------------------------------- */

  const handleModeChange = (mode) => {
    updateTransport(dayNumber, fromItem.id, {
      mode,
      duration: "",
      distance: "",
      steps: [],
    });

    setShowDetails(false);
  };

  return (
    <div className="transport-card">
      {/* Header */}
      <div className="transport-card-header">
        <div className="transport-card-title">
          <span className="transport-card-icon">
            {getTransportModeIcon(data.mode)}
          </span>

          <span>交通資訊</span>
        </div>
      </div>

      {/* Route */}
      <div className="transport-route">
        <span>{fromItem.name}</span>

        <span className="transport-route-arrow">
          →
        </span>

        <span>{toItem.name}</span>
      </div>

      {/* Mode title */}
      <div className="transport-section-title">
        交通方式
      </div>

      {/* Mode buttons */}
      <div className="transport-mode-buttons">
        <button
          type="button"
          className={`transport-mode-btn ${
            data.mode === "walk" ? "active" : ""
          }`}
          onClick={() => handleModeChange("walk")}
        >
          🚶 走路
        </button>

        <button
          type="button"
          className={`transport-mode-btn ${
            data.mode === "transit" ? "active" : ""
          }`}
          onClick={() => handleModeChange("transit")}
        >
          🚇 大眾運輸
        </button>

        <button
          type="button"
          className={`transport-mode-btn ${
            data.mode === "taxi" ? "active" : ""
          }`}
          onClick={() => handleModeChange("taxi")}
        >
          🚕 計程車
        </button>
      </div>

      <div className="transport-divider" />

      {/* Summary */}
      <div className="transport-summary">
        <div className="transport-summary-main">
          {data.duration || "尚未設定時間"}

          {data.distance && (
            <>
              <span className="transport-summary-dot">
                ・
              </span>

              {data.distance}
            </>
          )}
        </div>

        {data.mode && (
          <div className="transport-summary-mode">
            {getTransportModeIcon(data.mode)}{" "}
            {getTransportModeLabel(data.mode)}
          </div>
        )}
      </div>

      {/* Manual duration */}
      <div className="transport-edit-row">
        <label>時間</label>

        <input
          type="text"
          value={data.duration}
          placeholder="例如：32 分鐘"
          onChange={(e) =>
            updateTransport(
              dayNumber,
              fromItem.id,
              {
                duration: e.target.value,
              }
            )
          }
        />
      </div>

      {/* Manual distance */}
      <div className="transport-edit-row">
        <label>距離</label>

        <input
          type="text"
          value={data.distance}
          placeholder="例如：8.5 km"
          onChange={(e) =>
            updateTransport(
              dayNumber,
              fromItem.id,
              {
                distance: e.target.value,
              }
            )
          }
        />
      </div>

      {/* Detail toggle */}
      {hasSteps && (
        <>
          <button
            type="button"
            className="transport-detail-toggle"
            onClick={() =>
              setShowDetails((prev) => !prev)
            }
          >
            {showDetails
              ? "▲ 收合詳細路線"
              : "▼ 查看詳細路線"}
          </button>

          {/* Details */}
          {showDetails && (
            <div className="transport-steps">
              {data.steps.map((step, index) => (
                <div
                  className="transport-step-wrapper"
                  key={`${fromItem.id}-step-${index}`}
                >
                  <div className="transport-step">
                    <div className="transport-step-icon">
                      {getTransportStepIcon(step.mode)}
                    </div>

                    <div className="transport-step-content">
                      <div className="transport-step-meta">
                        {step.duration && (
                          <strong>
                            {step.duration}
                          </strong>
                        )}

                        {step.distance && (
                          <span>
                            {step.duration
                              ? " ・ "
                              : ""}
                            {step.distance}
                          </span>
                        )}
                      </div>

                      <div className="transport-step-instruction">
                        {step.instruction ||
                          "前往下一站"}
                      </div>
                    </div>
                  </div>

                  {index <
                    data.steps.length - 1 && (
                    <div className="transport-step-arrow">
                      ↓
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Note */}
      <div className="transport-note-row">
        <span>📝</span>

        <input
          type="text"
          value={data.note}
          placeholder="備註，例如：尖峰時段可能較久"
          onChange={(e) =>
            updateTransport(
              dayNumber,
              fromItem.id,
              {
                note: e.target.value,
              }
            )
          }
        />
      </div>
    </div>
  );
}

/* =========================================================
   Main Itinerary Component
========================================================= */

export default function Itinerary({
  itinerary,
  setItinerary,

  setSelectedPlace,
  setSelectedDay,

  activePlaceName,
  setActivePlaceName,

  routeInfo,

  expandedDay,
  setExpandedDay,

  trips,
  setTrips,

  currentTripId,
  setCurrentTripId,

  tripTitle,
  setTripTitle,

  setShowMap,

  places,
  setPlaces,

  transportDirty,
  markTransportDirty,
  clearTransportDirty,

  handleRefreshTransport,

  addItemToDay,
}) {
  const [isLoadingTrips, setIsLoadingTrips] =
    useState(false);

  const [isSaving, setIsSaving] = useState(false);

  const [newTripTitle, setNewTripTitle] =
    useState("");

  const previousItinerarySignature =
    useRef("");

  /* =======================================================
     Initial normalize
  ======================================================= */

  useEffect(() => {
    if (!Array.isArray(itinerary)) return;

    const normalized =
      normalizeItinerary(itinerary);

    const currentJSON =
      JSON.stringify(itinerary);

    const normalizedJSON =
      JSON.stringify(normalized);

    if (currentJSON !== normalizedJSON) {
      setItinerary(normalized);
    }
  }, [itinerary, setItinerary]);

  /* =======================================================
     Detect itinerary structure changes
     
     Transport itself is intentionally NOT included.
     Transport edits explicitly call markTransportDirty().
  ======================================================= */

  useEffect(() => {
    if (!Array.isArray(itinerary)) return;

    const signature = itinerary
      .map((day) => {
        const itemSignature = day.items
          .map((item) =>
            [
              item.id,
              item.lat,
              item.lng,
              item.role,
              item.startTime,
              item.endTime,
            ].join("|")
          )
          .join("||");

        return `${day.day}:${itemSignature}`;
      })
      .join("###");

    if (
      previousItinerarySignature.current &&
      previousItinerarySignature.current !==
        signature
    ) {
      const previous =
        previousItinerarySignature.current;

      const changedDays = [];

      itinerary.forEach((day) => {
        const currentItems = day.items
          .map((item) =>
            [
              item.id,
              item.lat,
              item.lng,
              item.role,
              item.startTime,
              item.endTime,
            ].join("|")
          )
          .join("||");

        if (!previous.includes(
          `${day.day}:${currentItems}`
        )) {
          changedDays.push(day.day);
        }
      });

      if (changedDays.length > 0) {
        markTransportDirty(changedDays);
      }
    }

    previousItinerarySignature.current =
      signature;
  }, [
    itinerary,
    markTransportDirty,
  ]);

  /* =======================================================
     Drag End
  ======================================================= */

  const handleDragEnd = (result) => {
    const {
      source,
      destination,
    } = result;

    if (!destination) return;

    if (
      source.droppableId ===
        destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const sourceDayNumber = Number(
      source.droppableId.replace("day-", "")
    );

    const destinationDayNumber = Number(
      destination.droppableId.replace(
        "day-",
        ""
      )
    );

    setItinerary((prev) => {
      const next = [...prev];

      const sourceDayIndex = next.findIndex(
        (day) =>
          Number(day.day) ===
          sourceDayNumber
      );

      const destinationDayIndex =
        next.findIndex(
          (day) =>
            Number(day.day) ===
            destinationDayNumber
        );

      if (
        sourceDayIndex === -1 ||
        destinationDayIndex === -1
      ) {
        return prev;
      }

      const sourceItems = [
        ...next[sourceDayIndex].items,
      ];

      const [movedItem] =
        sourceItems.splice(source.index, 1);

      if (!movedItem) {
        return prev;
      }

      if (
        sourceDayIndex ===
        destinationDayIndex
      ) {
        sourceItems.splice(
          destination.index,
          0,
          movedItem
        );

        next[sourceDayIndex] = {
          ...next[sourceDayIndex],
          items: sourceItems,
        };

        return next;
      }

      const destinationItems = [
        ...next[destinationDayIndex].items,
      ];

      destinationItems.splice(
        destination.index,
        0,
        movedItem
      );

      next[sourceDayIndex] = {
        ...next[sourceDayIndex],
        items: sourceItems,
      };

      next[destinationDayIndex] = {
        ...next[destinationDayIndex],
        items: destinationItems,
      };

      return next;
    });

    /*
      Reordering changes the relationship between
      every adjacent pair, so transport information
      for the affected day(s) becomes stale.
    */

    if (
      sourceDayNumber ===
      destinationDayNumber
    ) {
      markTransportDirty([
        sourceDayNumber,
      ]);
    } else {
      markTransportDirty([
        sourceDayNumber,
        destinationDayNumber,
      ]);
    }
  };

  /* =======================================================
     Delete Item
  ======================================================= */

  const deleteItem = (
    dayNumber,
    itemId
  ) => {
    setItinerary((prev) =>
      prev.map((day) => {
        if (Number(day.day) !== Number(dayNumber)) {
          return day;
        }

        return {
          ...day,
          items: day.items.filter(
            (item) => item.id !== itemId
          ),
        };
      })
    );

    markTransportDirty([dayNumber]);

    if (activePlaceName) {
      const deletedItem = itinerary
        ?.find(
          (day) =>
            Number(day.day) ===
            Number(dayNumber)
        )
        ?.items.find(
          (item) => item.id === itemId
        );

      if (
        deletedItem &&
        deletedItem.name === activePlaceName
      ) {
        setActivePlaceName("");
        setSelectedPlace(null);
      }
    }
  };

  /* =======================================================
     Update Role
  ======================================================= */

  const updateItemRole = (
    dayNumber,
    itemId,
    role
  ) => {
    setItinerary((prev) =>
      prev.map((day) => {
        if (
          Number(day.day) !==
          Number(dayNumber)
        ) {
          return day;
        }

        return {
          ...day,

          items: day.items.map((item) => {
            if (item.id !== itemId) {
              return item;
            }

            return {
              ...item,
              role,
              transportToNext:
                item.transportToNext
                  ? createEmptyTransport()
                  : null,
            };
          }),
        };
      })
    );

    markTransportDirty([dayNumber]);
  };

  /* =======================================================
     Update Time
  ======================================================= */

  const updateItemTime = (
    dayNumber,
    itemId,
    field,
    value
  ) => {
    setItinerary((prev) =>
      prev.map((day) => {
        if (
          Number(day.day) !==
          Number(dayNumber)
        ) {
          return day;
        }

        return {
          ...day,

          items: day.items.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  [field]: value,
                }
              : item
          ),
        };
      })
    );

    markTransportDirty([dayNumber]);
  };

  /* =======================================================
     Update whole transport object
     
     This is important:
     one update = one setItinerary
     
     Avoids doing:
     update mode
     update duration
     update distance
     update steps
     separately.
  ======================================================= */

  const updateManualTransport = (
    dayNumber,
    itemId,
    updates
  ) => {
    setItinerary((prev) =>
      prev.map((day) => {
        if (
          Number(day.day) !==
          Number(dayNumber)
        ) {
          return day;
        }

        return {
          ...day,

          items: day.items.map((item) => {
            if (item.id !== itemId) {
              return item;
            }

            const currentTransport = {
              ...createEmptyTransport(),
              ...(item.transportToNext || {}),
              steps: Array.isArray(
                item.transportToNext?.steps
              )
                ? item.transportToNext.steps
                : [],
            };

            return {
              ...item,

              transportToNext: {
                ...currentTransport,
                ...updates,
              },
            };
          }),
        };
      })
    );

    markTransportDirty([dayNumber]);
  };

  /* =======================================================
     Generate Transport Cards
     
     This does NOT call a routing API.
     
     It simply creates the transport relationship
     between adjacent items.
  ======================================================= */

  const generateManualTransportCards = (
    dayNumber
  ) => {
    setItinerary((prev) =>
      prev.map((day) => {
        if (
          Number(day.day) !==
          Number(dayNumber)
        ) {
          return day;
        }

        const items = day.items.map(
          (item, index) => {
            if (
              index ===
              day.items.length - 1
            ) {
              return {
                ...item,
                transportToNext: null,
              };
            }

            return {
              ...item,

              transportToNext: {
                ...createEmptyTransport(),
                ...(item.transportToNext ||
                  {}),
                steps: Array.isArray(
                  item.transportToNext
                    ?.steps
                )
                  ? item.transportToNext.steps
                  : [],
              },
            };
          }
        );

        return {
          ...day,
          items,
        };
      })
    );

    clearTransportDirty(dayNumber);
  };

  /* =======================================================
     Add New Day
  ======================================================= */

  const addNewDay = () => {
    const nextDayNumber =
      itinerary.length > 0
        ? Math.max(
            ...itinerary.map((day) =>
              Number(day.day)
            )
          ) + 1
        : 1;

    setItinerary((prev) => [
      ...prev,

      {
        day: nextDayNumber,
        items: [],
      },
    ]);

    markTransportDirty([
      nextDayNumber,
    ]);

    setExpandedDay(nextDayNumber);
  };

  /* =======================================================
     Create New Trip
  ======================================================= */

  const createNewTrip = async () => {
    const title =
      newTripTitle.trim() ||
      `我的旅遊行程 ${trips.length + 1}`;

    const emptyItinerary = [
      {
        day: 1,
        items: [],
      },
    ];

    setTripTitle(title);
    setCurrentTripId(null);
    setItinerary(emptyItinerary);
    setPlaces([]);

    setExpandedDay(1);

    setNewTripTitle("");

    previousItinerarySignature.current =
      "";
  };

  /* =======================================================
     Load Trips
  ======================================================= */

  const loadTrips = async () => {
    if (!localStorage.getItem("token")) {
      return;
    }

    setIsLoadingTrips(true);

    try {
      const token =
        localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE}/get-trips`,
        {
          method: "GET",

          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          "取得旅遊行程失敗"
        );
      }

      const data = await response.json();

      const loadedTrips =
        Array.isArray(data)
          ? data
          : data.trips || [];

      setTrips(loadedTrips);
    } catch (error) {
      console.error(
        "loadTrips error:",
        error
      );
    } finally {
      setIsLoadingTrips(false);
    }
  };

  /* =======================================================
     Load Trip By ID
  ======================================================= */

  const loadTripById = async (
    tripId
  ) => {
    if (!tripId) return;

    try {
      const token =
        localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE}/get-trips`,
        {
          method: "GET",

          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          "取得行程失敗"
        );
      }

      const data = await response.json();

      const loadedTrips =
        Array.isArray(data)
          ? data
          : data.trips || [];

      const trip = loadedTrips.find(
        (item) =>
          Number(item.trip_id) ===
          Number(tripId)
      );

      if (!trip) {
        console.warn(
          "找不到指定 Trip:",
          tripId
        );

        return;
      }

      setCurrentTripId(trip.trip_id);

      setTripTitle(
        trip.title ||
          "我的旅遊行程"
      );

      const normalized =
        normalizeItinerary(
          trip.itinerary ||
            trip.days ||
            []
        );

      setItinerary(normalized);

      if (trip.places) {
        setPlaces(trip.places);
      }

      previousItinerarySignature.current =
        "";

      if (normalized.length > 0) {
        setExpandedDay(
          normalized[0].day
        );
      }
    } catch (error) {
      console.error(
        "loadTripById error:",
        error
      );
    }
  };

  /* =======================================================
     Save Trip
  ======================================================= */

  const saveTrip = async () => {
    const token =
      localStorage.getItem("token");

    if (!token) {
      alert("請先登入");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(
        `${API_BASE}/save-trip`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            trip_id:
              currentTripId,

            title:
              tripTitle ||
              "我的旅遊行程",

            itinerary:
              normalizeItinerary(
                itinerary
              ),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "儲存行程失敗"
        );
      }

      const data =
        await response.json();

      if (data.trip_id) {
        setCurrentTripId(
          data.trip_id
        );
      }

      /*
        Save successful:
        transport is no longer dirty.
      */

      clearTransportDirty();

      await loadTrips();

      alert("行程已儲存");
    } catch (error) {
      console.error(
        "saveTrip error:",
        error
      );

      alert(
        "儲存行程失敗，請稍後再試"
      );
    } finally {
      setIsSaving(false);
    }
  };

  /* =======================================================
     Delete Trip
  ======================================================= */

  const deleteTrip = async (
    tripId
  ) => {
    if (!tripId) return;

    const confirmed =
      window.confirm(
        "確定要刪除此旅遊行程嗎？"
      );

    if (!confirmed) return;

    try {
      const token =
        localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE}/trip/${tripId}`,
        {
          method: "DELETE",

          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          "刪除行程失敗"
        );
      }

      const remainingTrips =
        trips.filter(
          (trip) =>
            Number(trip.trip_id) !==
            Number(tripId)
        );

      setTrips(remainingTrips);

      if (
        Number(currentTripId) ===
        Number(tripId)
      ) {
        setCurrentTripId(null);

        setTripTitle(
          "我的旅遊行程"
        );

        setItinerary([
          {
            day: 1,
            items: [],
          },
        ]);

        setPlaces([]);

        setExpandedDay(1);
      }
    } catch (error) {
      console.error(
        "deleteTrip error:",
        error
      );

      alert(
        "刪除行程失敗"
      );
    }
  };

  /* =======================================================
     Rename Trip
  ======================================================= */

  const renameTrip = async () => {
    if (!currentTripId) {
      alert("目前沒有選擇旅遊行程");
      return;
    }

    const newTitle =
      window.prompt(
        "請輸入新的行程名稱",
        tripTitle
      );

    if (
      newTitle === null ||
      !newTitle.trim()
    ) {
      return;
    }

    try {
      const token =
        localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE}/trip/${currentTripId}`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            title:
              newTitle.trim(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "重新命名失敗"
        );
      }

      setTripTitle(
        newTitle.trim()
      );

      setTrips((prev) =>
        prev.map((trip) =>
          Number(trip.trip_id) ===
          Number(currentTripId)
            ? {
                ...trip,
                title:
                  newTitle.trim(),
              }
            : trip
        )
      );
    } catch (error) {
      console.error(
        "renameTrip error:",
        error
      );

      alert(
        "重新命名失敗"
      );
    }
  };

  /* =======================================================
     Fetch Trip Places
  ======================================================= */

  const fetchTripPlaces = async (
    tripId
  ) => {
    if (!tripId) {
      setPlaces([]);
      return;
    }

    try {
      const token =
        localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE}/trip-places/${tripId}`,
        {
          method: "GET",

          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          "取得收藏景點失敗"
        );
      }

      const data =
        await response.json();

      setPlaces(
        Array.isArray(data)
          ? data
          : data.places || []
      );
    } catch (error) {
      console.error(
        "fetchTripPlaces error:",
        error
      );
    }
  };

  /* =======================================================
     Current Trip Change
  ======================================================= */

  useEffect(() => {
    if (!currentTripId) return;

    fetchTripPlaces(
      currentTripId
    );
  }, [currentTripId]);

  /* =======================================================
     Initial Trip Load
  ======================================================= */

  useEffect(() => {
    loadTrips();
  }, []);

  /* =======================================================
     Render
  ======================================================= */

  return (
    <div className="itinerary-container">

      {/* =================================================
          Trip Sidebar
      ================================================= */}

      <aside className="itinerary-trip-sidebar">

        <div className="trip-sidebar-header">
          <h3>我的旅遊行程</h3>

          <button
            type="button"
            onClick={createNewTrip}
          >
            ＋
          </button>
        </div>

        {/* New Trip */}
        <div className="new-trip-box">
          <input
            type="text"
            value={newTripTitle}
            placeholder="新行程名稱"
            onChange={(e) =>
              setNewTripTitle(
                e.target.value
              )
            }
          />

          <button
            type="button"
            onClick={createNewTrip}
          >
            建立
          </button>
        </div>

        {/* Trip List */}
        <div className="trip-list">

          {isLoadingTrips && (
            <div className="trip-loading">
              載入中...
            </div>
          )}

          {!isLoadingTrips &&
            trips.length === 0 && (
              <div className="trip-empty">
                尚無旅遊行程
              </div>
            )}

          {trips.map((trip) => (
            <div
              key={trip.trip_id}
              className={`trip-list-item ${
                Number(
                  currentTripId
                ) ===
                Number(trip.trip_id)
                  ? "active"
                  : ""
              }`}
            >
              <button
                type="button"
                className="trip-select-button"
                onClick={() =>
                  loadTripById(
                    trip.trip_id
                  )
                }
              >
                {trip.title ||
                  "未命名行程"}
              </button>

              <button
                type="button"
                className="trip-delete-button"
                onClick={() =>
                  deleteTrip(
                    trip.trip_id
                  )
                }
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </aside>

      {/* =================================================
          Main Itinerary
      ================================================= */}

      <main className="itinerary-main">

        {/* Top Bar */}
        <div className="itinerary-topbar">

          <div className="itinerary-title-area">

            <input
              className="itinerary-title-input"
              value={tripTitle}
              onChange={(e) =>
                setTripTitle(
                  e.target.value
                )
              }
            />

            <button
              type="button"
              onClick={renameTrip}
            >
              ✏️
            </button>
          </div>

          <div className="itinerary-top-actions">

            <button
              type="button"
              onClick={saveTrip}
              disabled={isSaving}
            >
              {isSaving
                ? "儲存中..."
                : "💾 儲存行程"}
            </button>

            <button
              type="button"
              onClick={addNewDay}
            >
              ＋ 新增一天
            </button>

            <button
              type="button"
              onClick={() =>
                setShowMap(true)
              }
            >
              🗺️ 查看地圖
            </button>
          </div>
        </div>

        {/* =================================================
            Drag and Drop
        ================================================= */}

        <DragDropContext
          onDragEnd={handleDragEnd}
        >
          <div className="itinerary-days">

            {itinerary.map(
              (dayObj) => {

                const dayNumber =
                  Number(
                    dayObj.day
                  );

                const items =
                  Array.isArray(
                    dayObj.items
                  )
                    ? dayObj.items
                    : [];

                const isExpanded =
                  expandedDay ===
                  dayNumber;

                const isDirty =
                  Boolean(
                    transportDirty?.[
                      dayNumber
                    ]
                  );

                return (
                  <section
                    key={dayNumber}
                    className="itinerary-day"
                  >

                    {/* Day Header */}
                    <div className="itinerary-day-header">

                      <button
                        type="button"
                        className="day-expand-button"
                        onClick={() =>
                          setExpandedDay(
                            isExpanded
                              ? null
                              : dayNumber
                          )
                        }
                      >
                        <span>
                          Day {dayNumber}
                        </span>

                        <span>
                          {isExpanded
                            ? "▲"
                            : "▼"}
                        </span>
                      </button>

                      {isDirty && (
                        <span className="transport-dirty-warning">
                          ⚠️ 交通資訊需要更新
                        </span>
                      )}

                      <button
                        type="button"
                        className="refresh-transport-button"
                        onClick={() =>
                          generateManualTransportCards(
                            dayNumber
                          )
                        }
                      >
                        🔄 更新交通資訊
                      </button>
                    </div>

                    {isExpanded && (
                      <Droppable
                        droppableId={`day-${dayNumber}`}
                      >
                        {(provided) => (
                          <div
                            ref={
                              provided.innerRef
                            }
                            {...provided.droppableProps}
                            className="day-items"
                          >

                            {/* Empty */}
                            {items.length ===
                              0 && (
                              <div className="day-empty">
                                尚未安排任何行程
                              </div>
                            )}

                            {items.map(
                              (
                                item,
                                index
                              ) => {

                                const isLast =
                                  index ===
                                  items.length -
                                    1;

                                return (
                                  <Draggable
                                    key={
                                      item.id
                                    }
                                    draggableId={
                                      item.id
                                    }
                                    index={
                                      index
                                    }
                                  >
                                    {(
                                      dragProvided,
                                      snapshot
                                    ) => (
                                      <div
                                        ref={
                                          dragProvided.innerRef
                                        }
                                        {...dragProvided.draggableProps}
                                        {...dragProvided.dragHandleProps}
                                        className={`itinerary-item-wrapper ${
                                          snapshot.isDragging
                                            ? "dragging"
                                            : ""
                                        }`}
                                      >

                                        {/* =================================================
                                            Place Card
                                        ================================================= */}

                                        <div
                                          className={`itinerary-place-card ${
                                            activePlaceName ===
                                            item.name
                                              ? "active"
                                              : ""
                                          }`}
                                          onClick={() => {
                                            setSelectedPlace(
                                              item
                                            );

                                            setSelectedDay(
                                              dayNumber
                                            );

                                            setActivePlaceName(
                                              item.name
                                            );
                                          }}
                                        >

                                          {/* Card Header */}
                                          <div className="place-card-header">

                                            <div className="place-card-title">

                                              <span className="place-role-icon">
                                                {item.role ===
                                                "restaurant"
                                                  ? "🍴"
                                                  : item.role ===
                                                    "hotel"
                                                  ? "🏨"
                                                  : "📍"}
                                              </span>

                                              <strong>
                                                {
                                                  item.name
                                                }
                                              </strong>
                                            </div>

                                            <button
                                              type="button"
                                              className="delete-item-button"
                                              onClick={(
                                                e
                                              ) => {
                                                e.stopPropagation();

                                                deleteItem(
                                                  dayNumber,
                                                  item.id
                                                );
                                              }}
                                            >
                                              🗑️
                                            </button>
                                          </div>

                                          {/* Category */}
                                          {item.category && (
                                            <div className="place-category">
                                              {
                                                item.category
                                              }
                                            </div>
                                          )}

                                          {/* Address */}
                                          {item.address && (
                                            <div className="place-address">
                                              📍{" "}
                                              {
                                                item.address
                                              }
                                            </div>
                                          )}

                                          {/* Role */}
                                          <div className="place-edit-row">

                                            <label>
                                              類型
                                            </label>

                                            <select
                                              value={
                                                item.role
                                              }
                                              onChange={(
                                                e
                                              ) => {
                                                e.stopPropagation();

                                                updateItemRole(
                                                  dayNumber,
                                                  item.id,
                                                  e.target
                                                    .value
                                                );
                                              }}
                                              onClick={(
                                                e
                                              ) =>
                                                e.stopPropagation()
                                              }
                                            >
                                              <option value="spot">
                                                景點
                                              </option>

                                              <option value="restaurant">
                                                餐廳
                                              </option>

                                              <option value="hotel">
                                                旅館
                                              </option>
                                            </select>
                                          </div>

                                          {/* Time */}
                                          <div className="place-time-row">

                                            <div>
                                              <label>
                                                開始
                                              </label>

                                              <input
                                                type="time"
                                                value={
                                                  item.startTime ||
                                                  ""
                                                }
                                                onChange={(
                                                  e
                                                ) =>
                                                  updateItemTime(
                                                    dayNumber,
                                                    item.id,
                                                    "startTime",
                                                    e.target
                                                      .value
                                                  )
                                                }
                                                onClick={(
                                                  e
                                                ) =>
                                                  e.stopPropagation()
                                                }
                                              />
                                            </div>

                                            <div>
                                              <label>
                                                結束
                                              </label>

                                              <input
                                                type="time"
                                                value={
                                                  item.endTime ||
                                                  ""
                                                }
                                                onChange={(
                                                  e
                                                ) =>
                                                  updateItemTime(
                                                    dayNumber,
                                                    item.id,
                                                    "endTime",
                                                    e.target
                                                      .value
                                                  )
                                                }
                                                onClick={(
                                                  e
                                                ) =>
                                                  e.stopPropagation()
                                                }
                                              />
                                            </div>
                                          </div>

                                          {/* Stay Time */}
                                          {item.stayTime && (
                                            <div className="place-meta">
                                              ⏱️ 停留：
                                              {
                                                item.stayTime
                                              }
                                            </div>
                                          )}

                                          {/* Active Time */}
                                          {item.activeTime && (
                                            <div className="place-meta">
                                              🕐 開放：
                                              {
                                                item.activeTime
                                              }
                                            </div>
                                          )}

                                          {/* Rating */}
                                          {item.rating !==
                                            "" &&
                                            item.rating !==
                                              null &&
                                            item.rating !==
                                              undefined && (
                                              <div className="place-meta">
                                                ⭐{" "}
                                                {
                                                  item.rating
                                                }
                                              </div>
                                            )}

                                          {/* Cost */}
                                          {item.cost !==
                                            "" &&
                                            item.cost !==
                                              null &&
                                            item.cost !==
                                              undefined && (
                                              <div className="place-meta">
                                                💰{" "}
                                                {
                                                  item.cost
                                                }
                                              </div>
                                            )}
                                        </div>

                                        {/* =================================================
                                            Transport Card
                                            
                                            Current item -> next item
                                        ================================================= */}

                                        {!isLast &&
                                          item.transportToNext && (
                                            <ManualTransportCard
                                              dayNumber={
                                                dayNumber
                                              }
                                              fromItem={
                                                item
                                              }
                                              toItem={
                                                items[
                                                  index +
                                                    1
                                                ]
                                              }
                                              transport={
                                                item.transportToNext
                                              }
                                              updateTransport={
                                                updateManualTransport
                                              }
                                            />
                                          )}
                                      </div>
                                    )}
                                  </Draggable>
                                );
                              }
                            )}

                            {
                              provided.placeholder
                            }
                          </div>
                        )}
                      </Droppable>
                    )}

                    {/* =================================================
                        Route Info
                        
                        Existing OSRM / Map route result
                    ================================================= */}

                    {isExpanded &&
                      routeInfo &&
                      Array.isArray(
                        routeInfo.steps
                      ) &&
                      routeInfo.steps.length >
                        0 && (
                        <div className="route-info-panel">

                          <div className="route-info-header">
                            <strong>
                              🗺️ 地圖路線資訊
                            </strong>
                          </div>

                          {routeInfo.duration && (
                            <div>
                              ⏱️{" "}
                              {
                                routeInfo.duration
                              }
                            </div>
                          )}

                          {routeInfo.distance && (
                            <div>
                              📏{" "}
                              {
                                routeInfo.distance
                              }
                            </div>
                          )}

                          <div className="route-info-steps">
                            {routeInfo.steps.map(
                              (
                                step,
                                index
                              ) => (
                                <div
                                  key={
                                    index
                                  }
                                  className="route-info-step"
                                >
                                  {index +
                                    1}
                                  .{" "}
                                  {step.instruction ||
                                    step.text ||
                                    ""}
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                  </section>
                );
              }
            )}
          </div>
        </DragDropContext>
      </main>
    </div>
  );
}
