function Itinerary({
  itinerary,
  setItinerary,
  setSelectedPlace,
  setSelectedDay,
  activePlaceName,
  setActivePlaceName,
  routeInfo,        // ⭐新增
  expandedDay,      // ⭐新增
  setExpandedDay,   // ⭐新增
}) {
  const moveItem = (day, index, direction) => {
    const newList = [...itinerary[day]];
    const newIndex = index + direction;

    if (newIndex < 0 || newIndex >= newList.length) return;

    [newList[index], newList[newIndex]] = [newList[newIndex], newList[index]];

    setItinerary((prev) => ({
      ...prev,
      [day]: newList,
    }));
  };

  const deleteItem = (day, index) => {
    const newList = itinerary[day].filter((_, i) => i !== index);

    setItinerary((prev) => ({
      ...prev,
      [day]: newList,
    }));
  };

  return (
    <div className="itinerary">
      <h2>行程安排</h2>

      {Object.keys(itinerary).map((day) => (
        <div key={day} className="day-block">
          {/* ⭐ 點擊展開導航 */}
          <div className={`day-header ${day.toLowerCase()}`}>
            <h3 className={`day-title-text ${day.toLowerCase()}`}>{day}</h3>

            <button
              className="toggle-route-btn"
              onClick={() =>
                setExpandedDay(expandedDay === day ? null : day)
              }
            >
              {expandedDay === day ? "收合導航 ▲" : "展開導航 ▼"}
            </button>
          </div>

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
                    <div className="spot-meta">{place.type || "景點"}</div>
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

          {/* ⭐ 導航資訊顯示 */}
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