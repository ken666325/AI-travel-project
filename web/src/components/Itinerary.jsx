import { useEffect } from "react";
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

  moveItem,
  deleteItem,

  // ⭐ 新增
  trips,
  setTrips,
  currentTripId,
  setCurrentTripId,
  tripTitle,
  setTripTitle,
}) {
  // ===== 新行程 =====
  const createNewTrip = () => {
    setItinerary({
      Day1: [],
      Day2: [],
      Day3: [],
    });
    setCurrentTripId(null);
    setTripTitle("我的新行程");
  };

  // ===== 載入所有行程 =====
  const loadTrips = async () => {
    const token = localStorage.getItem("token");

    if (!token) return;

    const res = await fetch(`${API_BASE}/api/get-trips`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    if (res.ok) {
      setTrips(data);
    }
  };

  // ===== 載入單一行程 =====
  const loadTripById = (trip) => {
    setItinerary(trip.days);
    setCurrentTripId(trip.trip_id);
    setTripTitle(trip.title || "未命名行程");
  };

  // ===== 儲存 =====
  const saveTrip = async () => {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API_BASE}/api/save-trip`, {
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
    });

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

  // ===== 刪除 =====
  const deleteTrip = async (id) => {
    const token = localStorage.getItem("token");

    await fetch(`${API_BASE}/api/trip/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    setTrips((prev) => prev.filter((t) => t.trip_id !== id));

    if (id === currentTripId) {
      createNewTrip();
    }
  };

  // ===== 改名 =====
  const renameTrip = async (id) => {
    const name = prompt("新名稱");
    if (!name) return;

    const token = localStorage.getItem("token");

    await fetch(`${API_BASE}/api/trip/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title: name }),
    });

    setTrips((prev) =>
      prev.map((t) =>
        t.trip_id === id ? { ...t, title: name } : t
      )
    );

    if (id === currentTripId) {
      setTripTitle(name);
    }
  };

  useEffect(() => {
    loadTrips();
  }, []);

  return (
    <div className="itinerary">
      {/* ⭐ 行程列表 */}
      <div className="trip-sidebar">
        <button onClick={createNewTrip}>➕ 新行程</button>

        <h4>最近</h4>

        {trips.map((trip) => (
          <div
            key={trip.trip_id}
            className={`trip-item ${
              currentTripId === trip.trip_id ? "active-trip" : ""
            }`}
            onClick={() => loadTripById(trip)}
          >
            <span className="trip-title">
              {trip.title || "未命名行程"}
            </span>

            <div className="trip-menu">
              <button
                onClick={(e) => {
                  e.stopPropagation(); // ⭐ 防止觸發切換
                  renameTrip(trip.trip_id);
                }}
              >
                ✏️
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation(); // ⭐ 防止觸發切換
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

      <h2>{tripTitle}</h2>

      <button onClick={saveTrip}>💾 儲存</button>

      {Object.keys(itinerary).map((day) => (
        <div key={day} className="day-block">
          {/* ===== Day Header ===== */}
          <div className={`day-header ${day.toLowerCase()}`}>
            <h3 className={`day-title-text ${day.toLowerCase()}`}>
              {day}
            </h3>

            <button
              className="toggle-route-btn"
              onClick={() =>
                setExpandedDay(expandedDay === day ? null : day)
              }
            >
              {expandedDay === day ? "收合導航 ▲" : "展開導航 ▼"}
            </button>
          </div>

          {/* ===== 景點列表 ===== */}
          {itinerary[day].length === 0 ? (
            <p>尚未加入景點</p>
          ) : (
            itinerary[day].map((place, index) => (
              <div
                key={index}
                className={`spot-card clickable ${
                  activePlaceName === place.name
                    ? "active-itinerary-card"
                    : ""
                }`}
                onClick={() => {
                  setSelectedPlace(place);
                  setSelectedDay(day);
                  setActivePlaceName(place.name);
                }}
              >
                <div className="spot-main no-image">
                  <div className="spot-text">
                    <div className="spot-name">{place.name}</div>
                    <div className="spot-meta">
                      {place.type || "景點"}
                    </div>
                    <div className="spot-stay">
                      {place.stayTime || "1~2 小時"}
                    </div>
                  </div>
                </div>

                <div className="spot-actions">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveItem(day, index, -1);
                    }}
                  >
                    ⬆️
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveItem(day, index, 1);
                    }}
                  >
                    ⬇️
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteItem(day, index);
                    }}
                  >
                    ❌
                  </button>
                </div>
              </div>
            ))
          )}

          {/* ===== 導航資訊 ===== */}
          {expandedDay === day && routeInfo?.[day] && (
            <div className="route-panel">
              <div className="route-summary">
                🚗 距離：
                {(routeInfo[day].summary.distance / 1000).toFixed(2)} km
                <br />
                ⏱️ 時間：
                {Math.round(routeInfo[day].summary.time / 60)} 分鐘
              </div>

              <div className="route-steps">
                {routeInfo[day].steps.slice(0, 6).map((step, i) => (
                  <div key={i} className="route-step">
                    • {step.text}（{Math.round(step.distance)}m）
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default Itinerary;