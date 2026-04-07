import { useState } from "react";

function Sidebar({
  places,
  setSelectedPlace,
  setSelectedDay,
  setItinerary,
  activePlaceName,
  setActivePlaceName,
}) {
  const [expandedPlaceName, setExpandedPlaceName] = useState("");

  const addToDay = (place, day) => {
    setItinerary((prev) => ({
      ...prev,
      [day]: [...prev[day], place],
    }));

    setSelectedPlace(place);
    setSelectedDay(day);
    setActivePlaceName(place.name);
  };

  const toggleExpand = (place) => {
    setSelectedPlace(place);
    setSelectedDay(null);
    setActivePlaceName(place.name);
    setExpandedPlaceName(expandedPlaceName === place.name ? "" : place.name);
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
            className={`place-row-wrapper ${isActive ? "active-place" : ""}`}
          >
            <div className="place-row-main" onClick={() => toggleExpand(place)}>
              <div className="place-row-text">
                <h4>{place.name}</h4>
                <p>{place.type || "景點"}</p>
                <span>{place.stayTime || "1~2 小時"}</span>
              </div>

              <div className="place-expand-indicator">
                {isExpanded ? "▲" : "▼"}
              </div>
            </div>

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
                  <p><strong>地址：</strong>{place.address || "尚未提供"}</p>
                  <p><strong>類型：</strong>{place.type || "景點"}</p>
                  <p><strong>建議停留：</strong>{place.stayTime || "1~2 小時"}</p>
                  <p className="place-detail-desc">
                    {place.description || "這是值得安排進行程的推薦景點。"}
                  </p>
                </div>

                <div className="place-action-row">
                  <button onClick={() => addToDay(place, "Day1")}>加入 Day1</button>
                  <button onClick={() => addToDay(place, "Day2")}>加入 Day2</button>
                  <button onClick={() => addToDay(place, "Day3")}>加入 Day3</button>
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