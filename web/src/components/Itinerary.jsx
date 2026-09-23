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

/* =========================================================
   Item Normalize
   ========================================================= */

const normalizeItem = (item, dayNumber, index) => {
  const existingId = item.id || item.itemId;

  const itemName = String(
    item.name || "place"
  );

  const safeItemName = itemName
    .replace(/\s+/g, "-")
    .slice(0, 20);

  const fallbackId =
    `item-${dayNumber}-${index}-${safeItemName}`;

  return {
    id: existingId || fallbackId,

    itemType:
      item.itemType || "place",

    role:
      item.role || "spot",

    placeId:
      item.placeId ||
      item.spot_id ||
      item.spotId ||
      null,

    name:
      item.name ||
      "未命名地點",

    lat: item.lat,
    lng: item.lng,

    address:
      item.address || "",

    category:
      item.category ||
      item.type ||
      "景點",

    type:
      item.type ||
      item.category ||
      "景點",

    startTime:
      item.startTime || "",

    endTime:
      item.endTime || "",

    stayTime:
      item.stayTime ||
      "1~2 小時",

    activeTime:
      item.activeTime ||
      "08:00~17:00",

    rating:
      item.rating,

    cost:
      item.cost,

    image:
      item.image || "",

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

/* =========================================================
   Itinerary Normalize
   ========================================================= */

const normalizeItinerary = (days) => {
  if (!Array.isArray(days)) {
    return [];
  }

  return days.map(
    (dayObj, dayIndex) => {
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

        day:
          dayNumber,

        items:
          sourceItems.map(
            (item, index) =>
              normalizeItem(
                item,
                dayNumber,
                index
              )
          ),
      };
    }
  );
};

/* =========================================================
   交通資訊卡
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

  const handleModeChange=mode=>{
    updateTransport(dayNumber,fromItem.id,"mode",mode);
  };

  const getModeLabel = () => {
    const option =
      transportOptions.find(
        (item) =>
          item.value ===
          data.mode
      );

    if (!option) {
      return "尚未選擇";
    }

    return `${option.icon} ${option.label}`;
  };

  return (
    <div className="manual-transport-card">

      {/* Header */}

      <div className="manual-transport-header">
        <span>🚦</span>

        <strong>
          交通資訊
        </strong>

        <span className="manual-transport-demo">
          每段獨立設定
        </span>
      </div>

      {/* Route */}

      <div className="manual-transport-route">
        <span>
          {fromItem.name}
        </span>

        <span className="transport-arrow">
          ↓
        </span>

        <span>
          {toItem.name}
        </span>
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
                  key={
                    option.value
                  }
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
                    {
                      option.label
                    }
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
          <div className="transport-readonly-value">
            {data.duration||"尚未取得"}
          </div>
        </label>

        <label>
          <span>距離</span>
          <div className="transport-readonly-value">
            {data.distance||"尚未取得"}
          </div>
        </label>

        <label>
          <span>備註</span>
          <input
            type="text"
            placeholder="例如：搭乘捷運紅線"
            value={data.note||""}
            onChange={e=>updateTransport(
              dayNumber,
              fromItem.id,
              "note",
              e.target.value
            )}
          />
        </label>
      </div>

      {/* 詳細路線 */}

      {Array.isArray(
        data.steps
      ) &&
        data.steps.length > 0 && (
          <div className="transport-steps">

            <div className="transport-section-title">
              詳細路線
            </div>

            {data.steps.map(
              (step, index) => (
                <div
                  key={index}
                  className="transport-step"
                >
                  <div>
                    {step.mode ===
                    "walk"
                      ? "🚶"
                      : step.mode ===
                        "metro"
                      ? "🚇"
                      : step.mode ===
                        "bus"
                      ? "🚌"
                      : step.mode ===
                        "taxi"
                      ? "🚕"
                      : "🚦"}
                  </div>

                  <div>
                    <strong>
                      {
                        step.duration
                      }
                    </strong>

                    {step.distance && (
                      <span>
                        {" "}
                        ・{" "}
                        {
                          step.distance
                        }
                      </span>
                    )}

                    {step.instruction && (
                      <div>
                        {
                          step.instruction
                        }
                      </div>
                    )}
                  </div>
                </div>
              )
            )}

          </div>
        )}

      {data.note && (
        <div className="transport-note">
          📝 備註：
          {data.note}
        </div>
      )}

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
    if (!Array.isArray(itinerary)) {
      return;
    }

    const currentSignature =
      itinerary.map(
        (dayObj) => ({
          day:
            dayObj.day,

          items:
            (dayObj.items || []).map(
              (item) => ({
                id:
                  item.id,

                lat:
                  item.lat,

                lng:
                  item.lng,

                role:
                  item.role,

                startTime:
                  item.startTime,

                endTime:
                  item.endTime,
              })
            ),
        })
      );

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

    itinerary.forEach(
      (dayObj) => {
        const previousDay =
          previousSignature.find(
            (day) =>
              day.day ===
              dayObj.day
          );

        const currentItems =
          dayObj.items || [];

        const previousItems =
          previousDay?.items || [];

        const currentJSON =
          JSON.stringify(
            currentItems.map(
              (item) => ({
                id:
                  item.id,

                lat:
                  item.lat,

                lng:
                  item.lng,

                role:
                  item.role,

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
      }
    );

    if (
      changedDays.length >
        0 &&
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

  const handleDragEnd = (
    result
  ) => {
    const {
      source,
      destination,
    } = result;

    if (!destination) {
      return;
    }

    const sourceDay =
      Number(
        source.droppableId
      );

    const destinationDay =
      Number(
        destination.droppableId
      );

    const sourceDayObj =
      itinerary.find(
        (dayObj) =>
          Number(
            dayObj.day
          ) === sourceDay
      );

    const destinationDayObj =
      itinerary.find(
        (dayObj) =>
          Number(
            dayObj.day
          ) ===
          destinationDay
      );

    if (
      !sourceDayObj ||
      !destinationDayObj
    ) {
      return;
    }

    /* =====================================================
       同一天拖曳排序
       ===================================================== */

    if (
      sourceDay ===
      destinationDay
    ) {
      const newItems = [
        ...(sourceDayObj.items ||
          []),
      ];

      const [
        movedItem,
      ] = newItems.splice(
        source.index,
        1
      );

      if (!movedItem) {
        return;
      }

      newItems.splice(
        destination.index,
        0,
        movedItem
      );

      /*
       * 排序改變後，
       * A → B → C 的交通關係全部需要重新確認。
       */
      const updatedItems =
        newItems.map(
          (item, index) => ({
            ...item,

            transportToNext:
              index <
              newItems.length - 1
                ? null
                : null,
          })
        );

      setItinerary(
        (prev) =>
          prev.map(
            (dayObj) =>
              Number(
                dayObj.day
              ) === sourceDay
                ? {
                    ...dayObj,
                    items:
                      updatedItems,
                  }
                : dayObj
          )
      );

      markTransportDirty(
        sourceDay
      );

      return;
    }

    /* =====================================================
       跨天拖曳
       ===================================================== */

    const sourceItems = [
      ...(sourceDayObj.items ||
        []),
    ];

    const destinationItems =
      [
        ...(destinationDayObj.items ||
          []),
      ];

    const [
      movedItem,
    ] = sourceItems.splice(
      source.index,
      1
    );

    if (!movedItem) {
      return;
    }

    /*
     * 保留被拖曳的 Item 本身，
     * 但是來源與目的地兩邊的交通關係
     * 都必須重新建立。
     */

    destinationItems.splice(
      destination.index,
      0,
      {
        ...movedItem,
        transportToNext:
          null,
      }
    );

    const updatedSourceItems =
      sourceItems.map(
        (item) => ({
          ...item,
          transportToNext:
            null,
        })
      );

    const updatedDestinationItems =
      destinationItems.map(
        (item) => ({
          ...item,
          transportToNext:
            null,
        })
      );

    setItinerary(
      (prev) =>
        prev.map(
          (dayObj) => {
            const currentDay =
              Number(
                dayObj.day
              );

            if (
              currentDay ===
              sourceDay
            ) {
              return {
                ...dayObj,

                items:
                  updatedSourceItems,
              };
            }

            if (
              currentDay ===
              destinationDay
            ) {
              return {
                ...dayObj,

                items:
                  updatedDestinationItems,
              };
            }

            return dayObj;
          }
        )
    );

    /*
     * 來源日 + 目的日
     * 都需要重新確認交通。
     */
    markTransportDirty([
      sourceDay,
      destinationDay,
    ]);
  };

  /* =========================================================
     刪除 Item
     ========================================================= */

  const deleteItem = (
    dayNumber,
    index
  ) => {
    setItinerary(
      (prev) =>
        prev.map(
          (dayObj) =>
            Number(
              dayObj.day
            ) ===
            Number(dayNumber)
              ? {
                  ...dayObj,

                  items:
                    (
                      dayObj.items ||
                      []
                    )
                      .filter(
                        (_, i) =>
                          i !== index
                      )
                      .map(
                        (
                          item,
                          itemIndex
                        ) => ({
                          ...item,

                          transportToNext:
                            itemIndex <
                            (
                              dayObj
                                .items
                                ?.length ||
                              0
                            ) -
                              2
                              ? null
                              : null,
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
    setItinerary(
      (prev) =>
        prev.map(
          (dayObj) => {
            if (
              Number(
                dayObj.day
              ) !==
              Number(dayNumber)
            ) {
              return dayObj;
            }

            return {
              ...dayObj,

              items:
                (
                  dayObj.items ||
                  []
                ).map(
                  (item) =>
                    item.id ===
                    itemId
                      ? {
                          ...item,

                          role,

                          transportToNext:
                            null,
                        }
                      : item
                ),
            };
          }
        )
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
    setItinerary(
      (prev) =>
        prev.map(
          (dayObj) => {
            if (
              Number(
                dayObj.day
              ) !==
              Number(dayNumber)
            ) {
              return dayObj;
            }

            return {
              ...dayObj,

              items:
                (
                  dayObj.items ||
                  []
                ).map(
                  (item) =>
                    item.id ===
                    itemId
                      ? {
                          ...item,

                          [field]:
                            value,

                          transportToNext:
                            null,
                        }
                      : item
                ),
            };
          }
        )
    );

    markTransportDirty(
      dayNumber
    );
  };

  /* =========================================================
     更新單一段交通資訊
     ========================================================= */

  const updateManualTransport=(dayNumber,itemId,field,value)=>{
    setItinerary(prev=>prev.map(dayObj=>{
      if(Number(dayObj.day)!==Number(dayNumber))return dayObj;

      return {
        ...dayObj,
        items:(dayObj.items||[]).map(item=>{
          if(item.id!==itemId)return item;

          const currentTransport=item.transportToNext||createEmptyTransport();

          return {
            ...item,
            transportToNext:{
              ...createEmptyTransport(),
              ...currentTransport,

              // 更新使用者目前修改的欄位
              [field]:value,

              // 如果改的是交通方式，
              // 舊的 AI / Routing 結果就失效
              ...(field==="mode"
                ? {
                    duration:"",
                    distance:"",
                    steps:[]
                  }
                : {})
            }
          };
        })
      };
    }));

    // 只有「交通方式」需要重新取得交通資訊
    // 備註修改不需要重新計算
    if(field==="mode"){
      markTransportDirty(dayNumber);
    }
  };

  /* =========================================================
     建立交通卡
     ========================================================= */
  const TEST_TRANSPORT = {
    mode: "transit",
    duration: "32 分鐘",
    distance: "8.5 km",
    note: "尖峰時段可能較久",
    steps: [
      {
        mode: "walk",
        duration: "6 分鐘",
        distance: "500 m",
        instruction: "步行至捷運站",
      },
      {
        mode: "metro",
        duration: "18 分鐘",
        distance: "7.2 km",
        instruction: "搭乘捷運綠線",
      },
      {
        mode: "walk",
        duration: "8 分鐘",
        distance: "800 m",
        instruction: "步行至目的地",
      },
    ],
  };
  
  const generateManualTransportCards =
    (dayObj) => {
      const items =
        dayObj.items || [];

      if (
        items.length < 2
      ) {
        alert(
          "至少需要兩個地點，才能建立交通資訊。"
        );

        return;
      }

      setItinerary(
        (prev) =>
          prev.map(
            (currentDay) => {
              if (
                Number(
                  currentDay.day
                ) !==
                Number(dayObj.day)
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
                       * 已經有交通資訊
                       * 就保留
                       */
                      /*if (
                        item.transportToNext
                      ) {
                        return item;
                      }*/

                      /*
                       * 建立空白交通卡
                       */
                      return {
                        ...item,
                        transportToNext: {
                          ...TEST_TRANSPORT,
                        },
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
    setItinerary(
      (prev) => [
        ...prev,

        {
          day:
            prev.length + 1,

          items: [],
        },
      ]
    );
  };

  /* =========================================================
     建立新行程
     ========================================================= */

  const createNewTrip =
    () => {
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

      setCurrentTripId(
        null
      );

      setTripTitle(
        "我的新行程"
      );

      clearTransportDirty?.(
        1
      );

      clearTransportDirty?.(
        2
      );

      clearTransportDirty?.(
        3
      );

      previousItinerarySignature.current =
        null;
    };

  /* =========================================================
     載入行程列表
     ========================================================= */

  const loadTrips =
    async () => {
      const token =
        localStorage.getItem(
          "token"
        );

      if (!token) {
        return;
      }

      try {
        const res =
          await fetch(
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

  const loadTripById =
    async (trip) => {
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
            day:
              dayObj.day,

            items:
              (
                dayObj.items ||
                []
              ).map(
                (item) => ({
                  id:
                    item.id,

                  lat:
                    item.lat,

                  lng:
                    item.lng,

                  role:
                    item.role,

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

  const saveTrip =
    async () => {
      const token =
        localStorage.getItem(
          "token"
        );

      if (!token) {
        alert(
          "請先登入"
        );

        return;
      }

      try {
        const res =
          await fetch(
            `${API_BASE}/api/save-trip`,
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${token}`,
              },

              body:
                JSON.stringify({
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

        if (
          !currentTripId
        ) {
          setCurrentTripId(
            data.trip_id
          );
        }

        previousItinerarySignature.current =
          itinerary.map(
            (dayObj) => ({
              day:
                dayObj.day,

              items:
                (
                  dayObj.items ||
                  []
                ).map(
                  (item) => ({
                    id:
                      item.id,

                    lat:
                      item.lat,

                    lng:
                      item.lng,

                    role:
                      item.role,

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

        alert(
          "✅ 已儲存"
        );
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

  const deleteTrip =
    async (id) => {
      const token =
        localStorage.getItem(
          "token"
        );

      try {
        await fetch(
          `${API_BASE}/api/trip/${id}`,
          {
            method:
              "DELETE",

            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

        setTrips(
          (prev) =>
            prev.filter(
              (trip) =>
                trip.trip_id !==
                id
            )
        );

        if (
          id ===
          currentTripId
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

  const renameTrip =
    async (id) => {
      const name =
        prompt(
          "新名稱"
        );

      if (!name) {
        return;
      }

      const token =
        localStorage.getItem(
          "token"
        );

      try {
        await fetch(
          `${API_BASE}/api/trip/${id}`,
          {
            method:
              "PUT",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body:
              JSON.stringify({
                title:
                  name,
              }),
          }
        );

        setTrips(
          (prev) =>
            prev.map(
              (trip) =>
                trip.trip_id ===
                id
                  ? {
                      ...trip,
                      title:
                        name,
                    }
                  : trip
            )
        );

        if (
          id ===
          currentTripId
        ) {
          setTripTitle(
            name
          );
        }
      } catch (err) {
        console.error(
          "修改行程名稱失敗：",
          err
        );
      }
    };

  /* =========================================================
     Trip Places
     ========================================================= */

  const fetchTripPlaces =
    async (tripId) => {
      try {
        const token =
          localStorage.getItem(
            "token"
          );

        const res =
          await fetch(
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
        console.error(
          err
        );
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
    "#20c997",
    "#e64980",
    "#7950f2",
    "#15aabf",
  ];

  /* =========================================================
     Role
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
    <div className="itinerary-layout">

      {/* =====================================================
          LEFT：最近行程
          ===================================================== */}

      <aside className="trip-sidebar">

        <div className="trip-sidebar-header">
          <h3>
            最近行程
          </h3>
        </div>

        <button
          className="new-trip-btn"
          onClick={
            createNewTrip
          }
        >
          ➕ 新行程
        </button>

        <div className="trip-list">

          {trips.length === 0 ? (
            <div className="no-trip-message">
              尚無儲存的行程
            </div>
          ) : (
            trips.map(
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

                  <div className="trip-item-info">

                    <span className="trip-item-icon">
                      🗺️
                    </span>

                    <span className="trip-item-title">
                      {trip.title ||
                        "未命名行程"}
                    </span>

                  </div>

                  <div className="trip-menu">

                    <button
                      type="button"
                      title="重新命名"
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
                      type="button"
                      title="刪除"
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
            )
          )}

        </div>

      </aside>

      {/* =====================================================
          RIGHT：目前選定的行程
          ===================================================== */}

      <main className="selected-trip-panel">

        {/* ===================================================
            Top Bar
            =================================================== */}

        <div className="trip-top-bar">

          <div className="trip-title-area">

            <span className="trip-title-icon">
              🗺️
            </span>

            <div>

              <h2>
                {tripTitle ||
                  "我的旅遊行程"}
              </h2>

              <span className="trip-current-status">
                {currentTripId
                  ? "目前行程"
                  : "尚未儲存"}
              </span>

            </div>

          </div>

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

        {/* ===================================================
            行程內容
            =================================================== */}

        <div className="itinerary-scroll-area">

          <DragDropContext
            onDragEnd={
              handleDragEnd
            }
          >

            {itinerary.map(
              (dayObj) => {
                const dayColor =
                  dayColors[
                    (Number(
                      dayObj.day
                    ) -
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

                return (
                  <section
                    key={
                      dayObj.day
                    }
                    className="day-block"
                  >

                    {/* =====================================
                        Day Header
                        ===================================== */}

                    <div
                      className="day-header"
                      style={{
                        borderLeft:
                          `6px solid ${dayColor}`,
                      }}
                    >

                      <div className="day-header-left">

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

                        <span className="day-place-count">
                          {items.length} 個行程
                        </span>

                      </div>

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

                      </div>

                    </div>

                    {/* =====================================
                        Droppable
                        ===================================== */}

                    <Droppable
                      droppableId={String(
                        dayObj.day
                      )}
                    >
                      {(
                        provided,
                        snapshot
                      ) => (
                        <div
                          ref={
                            provided.innerRef
                          }
                          {...provided.droppableProps}
                          className={`day-droppable ${
                            snapshot.isDraggingOver
                              ? "dragging-over"
                              : ""
                          }`}
                        >

                          {items.length ===
                            0 && (
                            <div className="empty-day-message">
                              <span>
                                📭
                              </span>

                              <p>
                                尚未加入行程
                              </p>

                              <small>
                                可以從左側景點列表加入行程
                              </small>
                            </div>
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
                                    `item-${dayObj.day}-${index}`
                                );

                              return (
                                <div
                                  key={
                                    item.id ||
                                    `${item.name}-${index}`
                                  }
                                >

                                  {/* =================================
                                      Place Card
                                      ================================= */}

                                  <Draggable
                                    draggableId={
                                      draggableId
                                    }
                                    index={
                                      index
                                    }
                                  >
                                    {(
                                      provided,
                                      snapshot
                                    ) => (
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
                                        } ${
                                          snapshot.isDragging
                                            ? "is-dragging"
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

                                            {/* 名稱 */}

                                            <div className="spot-name">
                                              {
                                                role.icon
                                              }{" "}
                                              {
                                                item.name
                                              }
                                            </div>

                                            {/* 類別 */}

                                            <div className="spot-meta">
                                              {
                                                role.label
                                              }

                                              {item.category &&
                                                ` ・ ${item.category}`}
                                            </div>

                                            {/* 地址 */}

                                            {item.address && (
                                              <div className="spot-address">
                                                📍{" "}
                                                {
                                                  item.address
                                                }
                                              </div>
                                            )}

                                            {/* 時間 */}

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

                                            {/* Role */}

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

                                            {/* 停留時間 */}

                                            {item.stayTime && (
                                              <div className="spot-stay">
                                                ⏱️ 建議停留：
                                                {
                                                  item.stayTime
                                                }
                                              </div>
                                            )}

                                            {/* 營業時間 */}

                                            {item.activeTime && (
                                              <div className="spot-active-time">
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
                                            type="button"
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

                                  {/* =================================
                                      Transport Card
                                      ================================= */}

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

                  </section>
                );
              }
            )}

          </DragDropContext>

          {/* 沒有任何 Day 的保護 */}

          {itinerary.length ===
            0 && (
            <div className="empty-itinerary">
              <div>
                🗺️
              </div>

              <h3>
                尚未建立行程
              </h3>

              <p>
                點擊「增加天數」開始規劃旅程
              </p>
            </div>
          )}

        </div>

      </main>

    </div>
  );
}

export default Itinerary;