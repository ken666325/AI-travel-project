import { useEffect } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
} from "@hello-pangea/dnd";
import API_BASE from "../api/fetchAPI";

function Itinerary({
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
}) {
  /* ==================================================
      ⭐ 拖曳排序（支援跨天）
  ================================================== */
  const handleDragEnd = (result) => {
    const { source, destination } = result;

    if (!destination) return;

    const sourceDay = Number(source.droppableId);
    const destDay = Number(destination.droppableId);

    const sourceDayObj = itinerary.find(
      (d) => d.day === sourceDay
    );

    const destDayObj = itinerary.find(
      (d) => d.day === destDay
    );

    const sourceSpots = [...sourceDayObj.spots];
    const destSpots =
      sourceDay === destDay
        ? sourceSpots
        : [...destDayObj.spots];

    // 拿出拖曳項目
    const [movedSpot] = sourceSpots.splice(source.index, 1);

    // 插入
    destSpots.splice(destination.index, 0, movedSpot);

    // 更新 itinerary
    const updated = itinerary.map((dayObj) => {
      if (dayObj.day === sourceDay && sourceDay === destDay) {
        return {
          ...dayObj,
          spots: destSpots,
        };
      }

      if (dayObj.day === sourceDay) {
        return {
          ...dayObj,
          spots: sourceSpots,
        };
      }

      if (dayObj.day === destDay) {
        return {
          ...dayObj,
          spots: destSpots,
        };
      }

      return dayObj;
    });

    setItinerary(updated);
  };

  /* ==================================================
      ⭐ 刪除景點
  ================================================== */
  const deleteItem = (dayNumber, index) => {
    setItinerary((prev) =>
      prev.map((dayObj) =>
        dayObj.day === dayNumber
          ? {
              ...dayObj,
              spots: dayObj.spots.filter(
                (_, i) => i !== index
              ),
            }
          : dayObj
      )
    );
  };

  /* ==================================================
      ⭐ 新增天數
  ================================================== */
  const addNewDay = () => {
    setItinerary((prev) => [
      ...prev,
      {
        day: prev.length + 1,
        spots: [],
      },
    ]);
  };

  /* ==================================================
      ⭐ 新行程
  ================================================== */
  const createNewTrip = () => {
    setItinerary([
      {
        day: 1,
        spots: [],
      },
      {
        day: 2,
        spots: [],
      },
      {
        day: 3,
        spots: [],
      },
    ]);

    setCurrentTripId(null);
    setTripTitle("我的新行程");
  };

  /* ==================================================
      ⭐ 載入所有行程
  ================================================== */
  const loadTrips = async () => {
    const token = localStorage.getItem("token");

    if (!token) return;

    const res = await fetch(
      `${API_BASE}/api/get-trips`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await res.json();

    if (res.ok) {
      setTrips(data);
    }
  };

  /* ==================================================
      ⭐ 載入單一行程
  ================================================== */
  const loadTripById = async (trip) => {
    setItinerary(trip.days || []);

    setCurrentTripId(trip.trip_id);

    setTripTitle(
      trip.title || "未命名行程"
    );

    await fetchTripPlaces(trip.trip_id);
  };

  /* ==================================================
      ⭐ 儲存
  ================================================== */
  const saveTrip = async () => {
    const token = localStorage.getItem("token");

    const res = await fetch(
      `${API_BASE}/api/save-trip`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          trip_id: currentTripId,
          title: tripTitle,
          days: itinerary,
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      alert("儲存失敗");
      return;
    }

    if (!currentTripId) {
      setCurrentTripId(data.trip_id);
    }

    loadTrips();

    alert("✅ 已儲存");
  };

  /* ==================================================
      ⭐ 刪除行程
  ================================================== */
  const deleteTrip = async (id) => {
    const token = localStorage.getItem("token");

    await fetch(
      `${API_BASE}/api/trip/${id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setTrips((prev) =>
      prev.filter((t) => t.trip_id !== id)
    );

    if (id === currentTripId) {
      createNewTrip();
    }
  };

  /* ==================================================
      ⭐ 改名
  ================================================== */
  const renameTrip = async (id) => {
    const name = prompt("新名稱");

    if (!name) return;

    const token = localStorage.getItem("token");

    await fetch(
      `${API_BASE}/api/trip/${id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: name,
        }),
      }
    );

    setTrips((prev) =>
      prev.map((t) =>
        t.trip_id === id
          ? {
              ...t,
              title: name,
            }
          : t
      )
    );

    if (id === currentTripId) {
      setTripTitle(name);
    }
  };

  useEffect(() => {
    loadTrips();
  }, []);

  //載入Sidebar景點
  const fetchTripPlaces = async (tripId) => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `${API_BASE}/api/trip-places/${tripId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      setPlaces(data);

    } catch (err) {
      console.error(err);
    }
  };

  /* ==================================================
      ⭐ 顏色
  ================================================== */
  const dayColors = [
    "#4f8cff",
    "#ff6b6b",
    "#51cf66",
    "#ffd43b",
    "#845ef7",
    "#ff922b",
  ];

  /* ==================================================
      UI
  ================================================== */
  return (
    <div className="itinerary">
      {/* ==================================================
          ⭐ 行程列表
      ================================================== */}
      <div className="trip-sidebar">
        <button onClick={createNewTrip}>
          ➕ 新行程
        </button>

        <h4>最近</h4>

        {trips.map((trip) => (
          <div
            key={trip.trip_id}
            className={`trip-item ${
              currentTripId === trip.trip_id
                ? "active-trip"
                : ""
            }`}
            onClick={() => loadTripById(trip)}
          >
            <span>
              {trip.title || "未命名行程"}
            </span>

            <div className="trip-menu">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  renameTrip(trip.trip_id);
                }}
              >
                ✏️
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteTrip(trip.trip_id);
                }}
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      <hr />

      {/* ==================================================
          ⭐ 行程標題
      ================================================== */}
      <div className="trip-top-bar">
        <h2>{tripTitle}</h2>

        <div className="trip-actions">
          <button onClick={saveTrip}>
            💾 儲存
          </button>

          <button onClick={addNewDay}>
            ➕ 增加天數
          </button>

          <button onClick={() => setShowMap(true)}>
  🗺 查看地圖
</button>
        </div>
      </div>

      {/* ==================================================
          ⭐ 拖曳
      ================================================== */}
      <DragDropContext
        onDragEnd={handleDragEnd}
      >
        {itinerary.map((dayObj) => {
          const dayColor =
            dayColors[
              (dayObj.day - 1) %
                dayColors.length
            ];

          return (
            <div
              key={dayObj.day}
              className="day-block"
            >
              {/* ==================================================
                  Day Header
              ================================================== */}
              <div
                className="day-header"
                style={{
                  borderLeft: `6px solid ${dayColor}`,
                }}
              >
                <h2
                  className="day-title-text"
                  style={{
                    color: dayColor,
                  }}
                >
                  Day {dayObj.day}
                </h2>

                <button
                  className="toggle-route-btn"
                  onClick={() =>
                    setExpandedDay(
                      expandedDay === dayObj.day
                        ? null
                        : dayObj.day
                    )
                  }
                >
                  {expandedDay === dayObj.day
                    ? "收合導航 ▲"
                    : "展開導航 ▼"}
                </button>
              </div>

              {/* ==================================================
                  ⭐ Droppable
              ================================================== */}
              <Droppable
                droppableId={String(
                  dayObj.day
                )}
              >
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    {dayObj.spots.length ===
                      0 && (
                      <p>尚未加入景點</p>
                    )}

                    {dayObj.spots.map(
                      (place, index) => (
                        <Draggable
                          key={`${place.name}-${index}`}
                          draggableId={`${place.name}-${dayObj.day}-${index}`}
                          index={index}
                        >
                          {(provided) => (
                            <div
                              ref={
                                provided.innerRef
                              }
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`spot-card clickable ${
                                activePlaceName ===
                                place.name
                                  ? "active-itinerary-card"
                                  : ""
                              }`}
                              style={{
                                ...provided
                                  .draggableProps
                                  .style,
                                borderLeft: `5px solid ${dayColor}`,
                              }}
                              onClick={() => {
                                setSelectedPlace(
                                  place
                                );

                                setSelectedDay(
                                  dayObj.day
                                );

                                setActivePlaceName(
                                  place.name
                                );
                              }}
                            >
                              <div className="spot-main">
                                <div className="spot-text">
                                  <div className="spot-name">
                                    {
                                      place.name
                                    }
                                  </div>

                                  <div className="spot-meta">
                                    {place.type ||
                                      "景點"}
                                  </div>

                                  <div className="spot-stay">
                                    {place.stayTime ||
                                      "1~2 小時"}
                                  </div>

                                  <div>
                                    <strong>營業時間：</strong>
                                    {place.acitiveTime  || "08:00~17:00"}
                                  </div>
                                </div>

                                {/* ⭐ 刪除 */}
                                <button
                                  className="delete-btn"
                                  onClick={(
                                    e
                                  ) => {
                                    e.stopPropagation();

                                    deleteItem(
                                      dayObj.day,
                                      index
                                    );
                                  }}
                                >
                                  ❌
                                </button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      )
                    )}

                    {provided.placeholder}
                  </div>
                )}
              </Droppable>

              {/* ==================================================
                  ⭐ 導航資訊
              ================================================== */}
              {expandedDay ===
                dayObj.day &&
                routeInfo?.[
                  `Day${dayObj.day}`
                ] && (
                  <div
                    className="route-panel"
                    style={{
                      borderLeft: `5px solid ${dayColor}`,
                    }}
                  >
                    <div className="route-summary">
                      🚗 距離：
                      {(
                        routeInfo[
                          `Day${dayObj.day}`
                        ].summary.distance /
                        1000
                      ).toFixed(2)}{" "}
                      km

                      <br />

                      ⏱️ 時間：
                      {Math.round(
                        routeInfo[
                          `Day${dayObj.day}`
                        ].summary.time / 60
                      )}{" "}
                      分鐘
                    </div>

                    <div className="route-steps">
                      {routeInfo[
                        `Day${dayObj.day}`
                      ].steps
                        //.slice(0, 6)
                        .map((step, i) => (
                          <div
                            key={i}
                            className="route-step"
                          >
                            • {step.text}（
                            {Math.round(
                              step.distance
                            )}
                            m）
                          </div>
                        ))}
                    </div>
                  </div>
                )}
            </div>
          );
        })}
      </DragDropContext>
    </div>
  );
}

export default Itinerary;