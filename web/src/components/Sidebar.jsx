import { useState } from "react";

function Sidebar({
  places,
  itinerary,
  setItinerary,
  setSelectedPlace,
  setSelectedDay,
  activePlaceName,
  setActivePlaceName,
}) {
  const [expandedPlaceName, setExpandedPlaceName] = useState("");

  // ===== 加入指定天 =====
  const addToDay = (place, dayNumber) => {
    setItinerary((prev) =>
      prev.map((dayObj) =>
        dayObj.day === dayNumber
          ? {
              ...dayObj,
              spots: [...dayObj.spots, place],
            }
          : dayObj
      )
    );

    setSelectedPlace(place);
    setSelectedDay(dayNumber);
    setActivePlaceName(place.name);
  };

  // ===== 展開卡片 =====
  const toggleExpand = (place) => {
    setSelectedPlace(place);
    setSelectedDay(null);
    setActivePlaceName(place.name);

    setExpandedPlaceName(
      expandedPlaceName === place.name ? "" : place.name
    );
  };

  return (
    <div className="sidebar">
      <h2>推薦景點</h2>

      {places.map((place, index) => {
        const isExpanded = expandedPlaceName === place.name;
        const isActive = activePlaceName === place.name;

        return (
          <div
            key={index}
            className={`place-row-wrapper ${
              isActive ? "active-place" : ""
            }`}
          >
            <div
              className="place-row-main"
              onClick={() => toggleExpand(place)}
            >
              <div className="place-row-text">
                <h4>{place.name}</h4>
                <p>{place.type || "景點"}</p>
                <span>{place.stayTime || "1~2 小時"}</span>
              </div>

              <div className="place-expand-indicator">
                {isExpanded ? "▲" : "▼"}
              </div>
            </div>

            {/* ===== 展開資訊 ===== */}
            {isExpanded && (
              <div className="place-detail-panel-bottom">
                <img
                  src={place.image}
                  alt={place.name}
                  className="place-detail-image"
                  onError={(e) => {
                    e.target.src =
                      "https://via.placeholder.com/300x180?text=Travel+Place";
                  }}
                />

                <div className="place-detail-body">
                  <h4>{place.name}</h4>

                  <p>
                    <strong>地址：</strong>
                    {place.address || "尚未提供"}
                  </p>

                  <p>
                    <strong>類型：</strong>
                    {place.type || "景點"}
                  </p>

                  <p>
                    <strong>建議停留：</strong>
                    {place.stayTime || "1~2 小時"}
                  </p>

                  <p className="place-detail-desc">
                    {place.description ||
                      "這是值得安排進行程的推薦景點。"}
                  </p>
                </div>

                {/* ===== 下拉加入天數 ===== */}
                <div className="place-action-row">
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      if (!e.target.value) return;

                      addToDay(place, Number(e.target.value));

                      e.target.value = "";
                    }}
                  >
                    <option value="">加入行程...</option>

                    {itinerary.map((dayObj) => (
                      <option
                        key={dayObj.day}
                        value={dayObj.day}
                      >
                        Day {dayObj.day}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default Sidebar;