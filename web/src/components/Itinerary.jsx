import { useEffect, useRef } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
} from "@hello-pangea/dnd";
import API_BASE from "../api/fetchAPI";

const createItemId = () =>
  `item-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;

const createEmptyTransport = () => ({
  mode: "",
  duration: "",
  distance: "",
  note: "",
  steps: [],
});

const normalizeItem = (item, dayNumber, index) => {
  const existingId = item.id || item.itemId;
  const itemName = String(item.name || "place");
  const safeItemName = itemName
    .replace(/\s+/g, "-")
    .slice(0, 20);

  const fallbackId = `item-${dayNumber}-${index}-${safeItemName}`;

  return {
    id: existingId || fallbackId,
    itemType: item.itemType || "place",

    role: item.role || "spot",

    placeId:
      item.placeId ||
      item.spot_id ||
      item.spotId ||
      null,

    name: item.name || "未命名地點",

    lat: item.lat,
    lng: item.lng,

    address: item.address || "",

    category:
      item.category ||
      item.type ||
      "景點",

    type:
      item.type ||
      item.category ||
      "景點",

    startTime: item.startTime || "",
    endTime: item.endTime || "",

    stayTime:
      item.stayTime ||
      "1~2 小時",

    activeTime:
      item.activeTime ||
      "08:00~17:00",

    rating: item.rating,
    cost: item.cost,

    image: item.image || "",

    description:
      item.description ||
      "推薦旅遊景點",

    transportToNext:
      item.transportToNext
        ? {
            mode:
              item.transportToNext.mode ||
              "",

            duration:
              item.transportToNext.duration ||
              "",

            distance:
              item.transportToNext.distance ||
              "",

            note:
              item.transportToNext.note ||
              "",

            steps:
              Array.isArray(
                item.transportToNext.steps
              )
                ? item.transportToNext.steps
                : [],
          }
        : null,
  };
};

const normalizeItinerary = (days) => {
  if (!Array.isArray(days)) return [];

  return days.map((dayObj, dayIndex) => {
    const dayNumber =
      dayObj.day ||
      dayIndex + 1;

    const sourceItems =
      Array.isArray(dayObj.items)
        ? dayObj.items
        : Array.isArray(dayObj.spots)
        ? dayObj.spots
        : [];

    return {
      ...dayObj,

      day: dayNumber,

      items: sourceItems.map(
        (item, index) =>
          normalizeItem(
            item,
            dayNumber,
            index
          )
      ),
    };
  });
};

/* =========================================================
   交通資訊卡
   每兩個地點之間都是獨立的一段交通
   使用者可以個別選擇：
   1. 走路
   2. 大眾運輸
   3. 計程車
   ========================================================= */

function ManualTransportCard({
  dayNumber,
  fromItem,
  toItem,
  transport,
  updateTransport,
}) {
  const data =
    transport ||
    createEmptyTransport();

  const transportOptions = [
    {
      value: "walk",
      label: "走路",
      icon: "🚶",
    },
    {
      value: "transit",
      label: "大眾運輸",
      icon: "🚇",
    },
    {
      value: "taxi",
      label: "計程車",
      icon: "🚕",
    },
  ];

  const handleModeChange = (mode) => {
    /*
     * 交通方式改變後，
     * 原本的時間、距離、詳細步驟可能已經不符合新的交通方式。
     *
     * 因此：
     * - 更新 mode
     * - 清空 duration
     * - 清空 distance
     * - 清空 steps
     * - 保留 note
     */
    updateTransport(
      dayNumber,
      fromItem.id,
      "mode",
      mode
    );

    updateTransport(
      dayNumber,
      fromItem.id,
      "duration",
      ""
    );

    updateTransport(
      dayNumber,
      fromItem.id,
      "distance",
      ""
    );

    updateTransport(
      dayNumber,
      fromItem.id,
      "steps",
      []
    );
  };

  const getModeLabel = () => {
    const option =
      transportOptions.find(
        (item) =>
          item.value === data.mode
      );

    if (!option) return "尚未選擇";

    return `${option.icon} ${option.label}`;
  };

  return (
    <div className="manual-transport-card">
      {/* Header */}
      <div className="manual-transport-header">
        <span>🚦</span>

        <strong>交通資訊</strong>

        <span className="manual-transport-demo">
          每段獨立設定
        </span>
      </div>

      {/* Route */}
      <div className="manual-transport-route">
        <span>{fromItem.name}</span>

        <span className="transport-arrow">
          ↓
        </span>

        <span>{toItem.name}</span>
      </div>

      {/* Transport mode */}
      <div className="transport-mode-section">
        <div className="transport-section-title">
          交通方式
        </div>

        <div className="transport-mode-buttons">
          {transportOptions.map(
            (option) => {
              const isSelected =
                data.mode ===
                option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  className={`transport-mode-btn ${
                    isSelected
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    handleModeChange(
                      option.value
                    )
                  }
                >
                  <span className="transport-mode-icon">
                    {option.icon}
                  </span>

                  <span>
                    {option.label}
                  </span>
                </button>
              );
            }
          )}
        </div>

        <div className="transport-current-mode">
          目前選擇：
          <strong>
            {getModeLabel()}
          </strong>
        </div>
      </div>

      {/* Details */}
      <div className="manual-transport-fields">
        <label>
          <span>預估時間</span>

          <input
            type="text"
            placeholder="例如：20 分鐘"
            value={
              data.duration || ""
            }
            onChange={(e) =>
              updateTransport(
                dayNumber,
                fromItem.id,
                "duration",
                e.target.value
              )
            }
          />
        </label>

        <label>
          <span>距離</span>

          <input
            type="text"
            placeholder="例如：2.5 km"
            value={
              data.distance || ""
            }
            onChange={(e) =>
              updateTransport(
                dayNumber,
                fromItem.id,
                "distance",
                e.target.value
              )
            }
          />
        </label>

        <label>
          <span>備註</span>

          <input
            type="text"
            placeholder="例如：搭乘捷運紅線"
            value={
              data.note || ""
            }
            onChange={(e) =>
              updateTransport(
                dayNumber,
                fromItem.id,
                "note",
                e.target.value
              )
            }
          />
        </label>
      </div>
    </div>
  );
}

/* =========================================================
   Itinerary
   ========================================================= */

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
  transportDirty,
  markTransportDirty,
  clearTransportDirty,
  handleRefreshTransport,
  addItemToDay,
}) {
  const previousItinerarySignature =
    useRef(null);

  /* =========================================================
     監控行程結構是否改變
     ========================================================= */

  useEffect(() => {
    if (!Array.isArray(itinerary))
      return;

    const currentSignature =
      itinerary.map((dayObj) => ({
        day: dayObj.day,

        items: (dayObj.items || []).map(
          (item) => ({
            id: item.id,
            lat: item.lat,
            lng: item.lng,
            role: item.role,
            startTime:
              item.startTime,
            endTime:
              item.endTime,
          })
        ),
      }));

    if (
      previousItinerarySignature.current ===
      null
    ) {
      previousItinerarySignature.current =
        currentSignature;

      return;
    }

    const previousSignature =
      previousItinerarySignature.current;

    const changedDays = [];

    itinerary.forEach((dayObj) => {
      const previousDay =
        previousSignature.find(
          (day) =>
            day.day === dayObj.day
        );

      const currentItems =
        dayObj.items || [];

      const previousItems =
        previousDay?.items || [];

      const currentJSON =
        JSON.stringify(
          currentItems.map(
            (item) => ({
              id: item.id,
              lat: item.lat,
              lng: item.lng,
              role: item.role,
              startTime:
                item.startTime,
              endTime:
                item.endTime,
            })
          )
        );

      const previousJSON =
        JSON.stringify(
          previousItems
        );

      if (
        currentJSON !==
        previousJSON
      ) {
        changedDays.push(
          dayObj.day
        );
      }
    });

    if (
      changedDays.length > 0 &&
      markTransportDirty
    ) {
      markTransportDirty(
        changedDays
      );
    }

    previousItinerarySignature.current =
      currentSignature;
  }, [
    itinerary,
    markTransportDirty,
  ]);

  /* =========================================================
     Drag & Drop
     ========================================================= */

  const handleDragEnd = (result) => {
    const {
      source,
      destination,
    } = result;

    if (!destination) return;

    const sourceDay =
      Number(source.droppableId);

    const destinationDay =
      Number(
        destination.droppableId
      );

    const sourceDayObj =
      itinerary.find(
        (dayObj) =>
          dayObj.day === sourceDay
      );

    const destinationDayObj =
      itinerary.find(
        (dayObj) =>
          dayObj.day ===
          destinationDay
      );

    if (
      !sourceDayObj ||
      !destinationDayObj
    ) {
      return;
    }

    /* -------------------------
       同一天排序
       ------------------------- */

    if (
      sourceDay ===
      destinationDay
    ) {
      const newItems = [
        ...(sourceDayObj.items || []),
      ];

      const [movedItem] =
        newItems.splice(
          source.index,
          1
        );

      if (!movedItem) return;

      newItems.splice(
        destination.index,
        0,
        movedItem
      );

      setItinerary((prev) =>
        prev.map((dayObj) =>
          dayObj.day === sourceDay
            ? {
                ...dayObj,

                items:
                  newItems.map(
                    (item) => ({
                      ...item,

                      /*
                       * 排序改變後，
                       * 原本的 A → B 關係全部失效
                       */
                      transportToNext:
                        null,
                    })
                  ),
              }
            : dayObj
        )
      );

      markTransportDirty(
        sourceDay
      );

      return;
    }

    /* -------------------------
       跨天移動
       ------------------------- */

    const sourceItems = [
      ...(sourceDayObj.items || []),
    ];

    const destinationItems = [
      ...(destinationDayObj.items || []),
    ];

    const [movedItem] =
      sourceItems.splice(
        source.index,
        1
      );

    if (!movedItem) return;

    destinationItems.splice(
      destination.index,
      0,
      movedItem
    );

    setItinerary((prev) =>
      prev.map((dayObj) => {
        if (
          dayObj.day ===
          sourceDay
        ) {
          return {
            ...dayObj,

            items:
              sourceItems.map(
                (item) => ({
                  ...item,
                  transportToNext:
                    null,
                })
              ),
          };
        }

        if (
          dayObj.day ===
          destinationDay
        ) {
          return {
            ...dayObj,

            items:
              destinationItems.map(
                (item) => ({
                  ...item,
                  transportToNext:
                    null,
                })
              ),
          };
        }

        return dayObj;
      })
    );

    markTransportDirty([
      sourceDay,
      destinationDay,
    ]);
  };

  /* =========================================================
     刪除行程項目
     ========================================================= */

  const deleteItem = (
    dayNumber,
    index
  ) => {
    setItinerary((prev) =>
      prev.map((dayObj) =>
        dayObj.day === dayNumber
          ? {
              ...dayObj,

              items:
                (dayObj.items || [])
                  .filter(
                    (_, i) =>
                      i !== index
                  )
                  .map(
                    (item) => ({
                      ...item,
                      transportToNext:
                        null,
                    })
                  ),
            }
          : dayObj
      )
    );

    markTransportDirty(
      dayNumber
    );
  };

  /* =========================================================
     修改 Item Role
     ========================================================= */

  const updateItemRole = (
    dayNumber,
    itemId,
    role
  ) => {
    setItinerary((prev) =>
      prev.map((dayObj) => {
        if (
          dayObj.day !==
          dayNumber
        ) {
          return dayObj;
        }

        return {
          ...dayObj,

          items:
            (dayObj.items || []).map(
              (item) =>
                item.id === itemId
                  ? {
                      ...item,
                      role,

                      /*
                       * Role 改變後，
                       * 交通資訊重新建立
                       */
                      transportToNext:
                        null,
                    }
                  : item
            ),
        };
      })
    );

    markTransportDirty(
      dayNumber
    );
  };

  /* =========================================================
     修改時間
     ========================================================= */

  const updateItemTime = (
    dayNumber,
    itemId,
    field,
    value
  ) => {
    setItinerary((prev) =>
      prev.map((dayObj) => {
        if (
          dayObj.day !==
          dayNumber
        ) {
          return dayObj;
        }

        return {
          ...dayObj,

          items:
            (dayObj.items || []).map(
              (item) =>
                item.id === itemId
                  ? {
                      ...item,
                      [field]:
                        value,

                      /*
                       * 時間改變後，
                       * 交通資訊可能需要重新確認
                       */
                      transportToNext:
                        null,
                    }
                  : item
            ),
        };
      })
    );

    markTransportDirty(
      dayNumber
    );
  };

  /* =========================================================
     更新單一段交通資訊
     ========================================================= */

  const updateManualTransport = (
    dayNumber,
    itemId,
    field,
    value
  ) => {
    setItinerary((prev) =>
      prev.map((dayObj) => {
        if (
          dayObj.day !==
          dayNumber
        ) {
          return dayObj;
        }

        return {
          ...dayObj,

          items:
            (dayObj.items || []).map(
              (item) => {
                if (
                  item.id !==
                  itemId
                ) {
                  return item;
                }

                const currentTransport =
                  item.transportToNext ||
                  createEmptyTransport();

                return {
                  ...item,

                  transportToNext:
                    {
                      ...currentTransport,

                      [field]:
                        value,
                    },
                };
              }
            ),
        };
      })
    );

    markTransportDirty(
      dayNumber
    );
  };

  /* =========================================================
     建立每天的交通卡
     ========================================================= */

  const generateManualTransportCards = (
    dayObj
  ) => {
    const items =
      dayObj.items || [];

    if (items.length < 2) {
      alert(
        "至少需要兩個地點，才能建立交通資訊。"
      );

      return;
    }

    setItinerary((prev) =>
      prev.map(
        (currentDay) => {
          if (
            currentDay.day !==
            dayObj.day
          ) {
            return currentDay;
          }

          const currentItems =
            currentDay.items ||
            [];

          return {
            ...currentDay,

            items:
              currentItems.map(
                (
                  item,
                  index
                ) => {
                  /*
                   * 最後一個地點沒有下一站
                   */
                  if (
                    index >=
                    currentItems.length -
                      1
                  ) {
                    return {
                      ...item,

                      transportToNext:
                        null,
                    };
                  }

                  /*
                   * 已經有交通資訊就保留
                   */
                  if (
                    item.transportToNext
                  ) {
                    return item;
                  }

                  /*
                   * 沒有交通資訊
                   * 建立一張空白交通卡
                   */
                  return {
                    ...item,

                    transportToNext:
                      createEmptyTransport(),
                  };
                }
              ),
          };
        }
      )
    );

    if (
      clearTransportDirty
    ) {
      clearTransportDirty(
        dayObj.day
      );
    }
  };

  /* =========================================================
     增加新的一天
     ========================================================= */

  const addNewDay = () => {
    setItinerary((prev) => [
      ...prev,

      {
        day:
          prev.length + 1,

        items: [],
      },
    ]);
  };

  /* =========================================================
     建立新行程
     ========================================================= */

  const createNewTrip = () => {
    setItinerary([
      {
        day: 1,
        items: [],
      },

      {
        day: 2,
        items: [],
      },

      {
        day: 3,
        items: [],
      },
    ]);

    setCurrentTripId(null);

    setTripTitle(
      "我的新行程"
    );

    clearTransportDirty?.(1);
    clearTransportDirty?.(2);
    clearTransportDirty?.(3);

    previousItinerarySignature.current =
      null;
  };

  /* =========================================================
     載入行程列表
     ========================================================= */

  const loadTrips = async () => {
    const token =
      localStorage.getItem(
        "token"
      );

    if (!token) return;

    try {
      const res = await fetch(
        `${API_BASE}/api/get-trips`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      const data =
        await res.json();

      if (res.ok) {
        setTrips(data);
      }
    } catch (err) {
      console.error(
        "載入行程失敗：",
        err
      );
    }
  };

  /* =========================================================
     載入指定行程
     ========================================================= */

  const loadTripById = async (
    trip
  ) => {
    const normalized =
      normalizeItinerary(
        trip.days || []
      );

    setItinerary(
      normalized
    );

    setCurrentTripId(
      trip.trip_id
    );

    setTripTitle(
      trip.title ||
        "未命名行程"
    );

    previousItinerarySignature.current =
      normalized.map(
        (dayObj) => ({
          day: dayObj.day,

          items:
            (
              dayObj.items ||
              []
            ).map(
              (item) => ({
                id: item.id,
                lat: item.lat,
                lng: item.lng,
                role: item.role,
                startTime:
                  item.startTime,
                endTime:
                  item.endTime,
              })
            ),
        })
      );

    await fetchTripPlaces(
      trip.trip_id
    );
  };

  /* =========================================================
     儲存行程
     ========================================================= */

  const saveTrip = async () => {
    const token =
      localStorage.getItem(
        "token"
      );

    if (!token) {
      alert("請先登入");
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE}/api/save-trip`,
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
              tripTitle,

            days:
              itinerary,
          }),
        }
      );

      const data =
        await res.json();

      if (!res.ok) {
        alert(
          data.error ||
            "儲存失敗"
        );

        return;
      }

      if (!currentTripId) {
        setCurrentTripId(
          data.trip_id
        );
      }

      previousItinerarySignature.current =
        itinerary.map(
          (dayObj) => ({
            day: dayObj.day,

            items:
              (
                dayObj.items ||
                []
              ).map(
                (item) => ({
                  id: item.id,
                  lat: item.lat,
                  lng: item.lng,
                  role: item.role,
                  startTime:
                    item.startTime,
                  endTime:
                    item.endTime,
                })
              ),
          })
        );

      if (
        clearTransportDirty
      ) {
        itinerary.forEach(
          (dayObj) =>
            clearTransportDirty(
              dayObj.day
            )
        );
      }

      await loadTrips();

      alert("✅ 已儲存");
    } catch (err) {
      console.error(
        "儲存行程失敗：",
        err
      );

      alert(
        "儲存失敗"
      );
    }
  };

  /* =========================================================
     刪除行程
     ========================================================= */

  const deleteTrip = async (
    id
  ) => {
    const token =
      localStorage.getItem(
        "token"
      );

    try {
      await fetch(
        `${API_BASE}/api/trip/${id}`,
        {
          method: "DELETE",

          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      setTrips((prev) =>
        prev.filter(
          (trip) =>
            trip.trip_id !== id
        )
      );

      if (
        id === currentTripId
      ) {
        createNewTrip();
      }
    } catch (err) {
      console.error(
        "刪除行程失敗：",
        err
      );
    }
  };

  /* =========================================================
     修改行程名稱
     ========================================================= */

  const renameTrip = async (
    id
  ) => {
    const name =
      prompt("新名稱");

    if (!name) return;

    const token =
      localStorage.getItem(
        "token"
      );

    try {
      await fetch(
        `${API_BASE}/api/trip/${id}`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            title: name,
          }),
        }
      );

      setTrips((prev) =>
        prev.map((trip) =>
          trip.trip_id === id
            ? {
                ...trip,
                title: name,
              }
            : trip
        )
      );

      if (
        id === currentTripId
      ) {
        setTripTitle(name);
      }
    } catch (err) {
      console.error(
        "修改行程名稱失敗：",
        err
      );
    }
  };

  /* =========================================================
     載入目前 Trip 的 Sidebar Places
     ========================================================= */

  const fetchTripPlaces =
    async (tripId) => {
      try {
        const token =
          localStorage.getItem(
            "token"
          );

        const res = await fetch(
          `${API_BASE}/api/trip-places/${tripId}`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

        const data =
          await res.json();

        setPlaces(data);
      } catch (err) {
        console.error(err);
      }
    };

  /* =========================================================
     初始載入
     ========================================================= */

  useEffect(() => {
    loadTrips();
  }, []);

  /* =========================================================
     Day 顏色
     ========================================================= */

  const dayColors = [
    "#4f8cff",
    "#ff6b6b",
    "#51cf66",
    "#ffd43b",
    "#845ef7",
    "#ff922b",
  ];

  /* =========================================================
     Role 設定
     ========================================================= */

  const roleConfig = {
    spot: {
      label: "景點",
      icon: "📍",
    },

    restaurant: {
      label: "餐廳",
      icon: "🍴",
    },

    hotel: {
      label: "旅館",
      icon: "🏨",
    },
  };

  /* =========================================================
     Render
     ========================================================= */

  return (
    <div className="itinerary">

      {/* =========================
          Trip Sidebar
          ========================= */}

      <div className="trip-sidebar">
        <button
          onClick={
            createNewTrip
          }
        >
          ➕ 新行程
        </button>

        <h4>最近</h4>

        {trips.map(
          (trip) => (
            <div
              key={
                trip.trip_id
              }
              className={`trip-item ${
                currentTripId ===
                trip.trip_id
                  ? "active-trip"
                  : ""
              }`}
              onClick={() =>
                loadTripById(
                  trip
                )
              }
            >
              <span>
                {trip.title ||
                  "未命名行程"}
              </span>

              <div className="trip-menu">

                <button
                  onClick={(e) => {
                    e.stopPropagation();

                    renameTrip(
                      trip.trip_id
                    );
                  }}
                >
                  ✏️
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();

                    deleteTrip(
                      trip.trip_id
                    );
                  }}
                >
                  🗑️
                </button>

              </div>
            </div>
          )
        )}
      </div>

      <hr />

      {/* =========================
          Trip Top Bar
          ========================= */}

      <div className="trip-top-bar">
        <h2>
          {tripTitle}
        </h2>

        <div className="trip-actions">

          <button
            onClick={
              saveTrip
            }
          >
            💾 儲存
          </button>

          <button
            onClick={
              addNewDay
            }
          >
            ➕ 增加天數
          </button>

          <button
            onClick={() =>
              setShowMap(true)
            }
          >
            🗺 查看地圖
          </button>

        </div>
      </div>

      {/* =========================
          DnD
          ========================= */}

      <DragDropContext
        onDragEnd={
          handleDragEnd
        }
      >
        {itinerary.map(
          (dayObj) => {
            const dayColor =
              dayColors[
                (dayObj.day -
                  1) %
                  dayColors.length
              ];

            const items =
              dayObj.items ||
              [];

            const isTransportDirty =
              Boolean(
                transportDirty?.[
                  dayObj.day
                ]
              );

            const dayRoute =
              routeInfo?.[
                `Day${dayObj.day}`
              ];

            return (
              <div
                key={
                  dayObj.day
                }
                className="day-block"
              >

                {/* =========================
                    Day Header
                    ========================= */}

                <div
                  className="day-header"
                  style={{
                    borderLeft:
                      `6px solid ${dayColor}`,
                  }}
                >
                  <h2
                    className="day-title-text"
                    style={{
                      color:
                        dayColor,
                    }}
                  >
                    Day{" "}
                    {
                      dayObj.day
                    }
                  </h2>

                  <div className="day-header-actions">

                    {isTransportDirty && (
                      <span className="transport-dirty-warning">
                        ⚠ 交通資訊可能已變更
                      </span>
                    )}

                    <button
                      className="refresh-transport-btn"
                      disabled={
                        !isTransportDirty
                      }
                      onClick={() =>
                        generateManualTransportCards(
                          dayObj
                        )
                      }
                    >
                      🔄 更新交通資訊
                    </button>

                    <button
                      className="toggle-route-btn"
                      onClick={() =>
                        setExpandedDay(
                          expandedDay ===
                            dayObj.day
                            ? null
                            : dayObj.day
                        )
                      }
                    >
                      {expandedDay ===
                      dayObj.day
                        ? "收合導航 ▲"
                        : "展開導航 ▼"}
                    </button>

                  </div>
                </div>

                {/* =========================
                    Droppable
                    ========================= */}

                <Droppable
                  droppableId={String(
                    dayObj.day
                  )}
                >
                  {(provided) => (
                    <div
                      ref={
                        provided.innerRef
                      }
                      {...provided.droppableProps}
                    >

                      {items.length ===
                        0 && (
                        <p className="empty-day-message">
                          尚未加入行程
                        </p>
                      )}

                      {items.map(
                        (
                          item,
                          index
                        ) => {
                          const role =
                            roleConfig[
                              item.role
                            ] ||
                            roleConfig.spot;

                          const isActive =
                            activePlaceName ===
                            item.name;

                          const draggableId =
                            String(
                              item.id ||
                                createItemId()
                            );

                          return (
                            <div
                              key={
                                item.id ||
                                `${item.name}-${index}`
                              }
                            >

                              {/* =========================
                                  Place Card
                                  ========================= */}

                              <Draggable
                                draggableId={
                                  draggableId
                                }
                                index={
                                  index
                                }
                              >
                                {(provided) => (
                                  <div
                                    ref={
                                      provided.innerRef
                                    }
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`spot-card clickable ${
                                      isActive
                                        ? "active-itinerary-card"
                                        : ""
                                    }`}
                                    style={{
                                      ...provided
                                        .draggableProps
                                        .style,

                                      borderLeft:
                                        `5px solid ${dayColor}`,
                                    }}
                                    onClick={() => {
                                      setSelectedPlace(
                                        item
                                      );

                                      setSelectedDay(
                                        dayObj.day
                                      );

                                      setActivePlaceName(
                                        item.name
                                      );
                                    }}
                                  >

                                    <div className="spot-main">

                                      <div className="spot-text">

                                        <div className="spot-name">
                                          {
                                            role.icon
                                          }{" "}
                                          {
                                            item.name
                                          }
                                        </div>

                                        <div className="spot-meta">
                                          景點類別：
                                          {
                                            item.category
                                          }
                                        </div>

                                        {item.address && (
                                          <div className="spot-address">
                                            📍{" "}
                                            {
                                              item.address
                                            }
                                          </div>
                                        )}

                                        {/* =========================
                                            時間
                                            ========================= */}

                                        <div
                                          className="itinerary-time-row"
                                          onClick={(e) =>
                                            e.stopPropagation()
                                          }
                                        >
                                          <label>
                                            🕐 開始
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
                                                dayObj.day,
                                                item.id,
                                                "startTime",
                                                e.target.value
                                              )
                                            }
                                          />

                                          <span>
                                            →
                                          </span>

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
                                                dayObj.day,
                                                item.id,
                                                "endTime",
                                                e.target.value
                                              )
                                            }
                                          />
                                        </div>

                                        {/* =========================
                                            Role
                                            ========================= */}

                                        <div
                                          className="itinerary-role-row"
                                          onClick={(e) =>
                                            e.stopPropagation()
                                          }
                                        >
                                          <label>
                                            類型
                                          </label>

                                          <select
                                            value={
                                              item.role ||
                                              "spot"
                                            }
                                            onChange={(
                                              e
                                            ) =>
                                              updateItemRole(
                                                dayObj.day,
                                                item.id,
                                                e.target.value
                                              )
                                            }
                                          >
                                            <option value="spot">
                                              📍 景點
                                            </option>

                                            <option value="restaurant">
                                              🍴 餐廳
                                            </option>

                                            <option value="hotel">
                                              🏨 旅館
                                            </option>
                                          </select>
                                        </div>

                                        {item.stayTime && (
                                          <div className="spot-stay">
                                            ⏱️ 建議停留：
                                            {
                                              item.stayTime
                                            }
                                          </div>
                                        )}

                                        {item.activeTime && (
                                          <div>
                                            <strong>
                                              營業時間：
                                            </strong>{" "}
                                            {
                                              item.activeTime
                                            }
                                          </div>
                                        )}

                                      </div>

                                      {/* Delete */}

                                      <button
                                        className="delete-btn"
                                        onClick={(e) => {
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

                              {/* =========================
                                  Transport Card
                                  ========================= */}

                              {index <
                                items.length -
                                  1 &&
                                item.transportToNext && (
                                  <ManualTransportCard
                                    dayNumber={
                                      dayObj.day
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
                          );
                        }
                      )}

                      {
                        provided.placeholder
                      }

                    </div>
                  )}
                </Droppable>

                {/* =========================
                    Route Panel
                    ========================= */}

                {expandedDay ===
                  dayObj.day && (
                  <div
                    className="route-panel"
                    style={{
                      borderLeft:
                        `5px solid ${dayColor}`,
                    }}
                  >

                    {isTransportDirty && (
                      <div className="route-stale-message">
                        ⚠️ 目前交通資訊可能已經不符合最新行程順序。
                        <br />
                        請按上方「🔄 更新交通資訊」重新產生交通區段。
                      </div>
                    )}

                    {dayRoute ? (
                      <>
                        <div className="route-summary">
                          🚗 距離：
                          {(
                            dayRoute
                              .summary
                              .distance /
                            1000
                          ).toFixed(
                            2
                          )}{" "}
                          km

                          <br />

                          ⏱️ 時間：
                          {Math.round(
                            dayRoute
                              .summary
                              .time /
                              60
                          )}{" "}
                          分鐘
                        </div>

                        <div className="route-steps">
                          {dayRoute.steps?.map(
                            (
                              step,
                              i
                            ) => (
                              <div
                                key={
                                  i
                                }
                                className="route-step"
                              >
                                •{" "}
                                {
                                  step.text
                                }{" "}
                                (
                                {Math.round(
                                  step.distance
                                )}{" "}
                                m)
                              </div>
                            )
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="route-empty-message">
                        尚未產生交通資訊。
                      </div>
                    )}

                  </div>
                )}

              </div>
            );
          }
        )}
      </DragDropContext>
    </div>
  );
}

export default Itinerary;