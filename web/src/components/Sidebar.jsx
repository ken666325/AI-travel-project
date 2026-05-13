import {
  useEffect,
  useState,
  useRef,
} from "react";
import API_BASE from "../api/fetchAPI";

function Sidebar({
  places,
  setPlaces,
  currentTripId,
  itinerary,
  setItinerary,
  setSelectedPlace,
  setSelectedDay,
  activePlaceName,
  setActivePlaceName,
}) {
  const [expandedPlaceName, setExpandedPlaceName] = useState("");

  // ===== 搜尋相關 =====
  const [searchKeyword, setSearchKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const searchRef = useRef(null);

  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // ===== Loading =====
  const [loading, setLoading] = useState(false);

  // ===== Keyboard Navigation =====
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // ===== debounce =====
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(searchKeyword);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchKeyword]);

  // ===== 搜尋 =====
  useEffect(() => {
    if (!debouncedKeyword.trim()) {
      setSearchResults([]);
      setLoading(false);
      return;
    }

    fetchSearchResults(debouncedKeyword);
  }, [debouncedKeyword]);

  useEffect(() => {
    const handleClickOutside = (e) => {

      if (
        searchRef.current &&
        !searchRef.current.contains(e.target)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };

  }, []);

  // ===== API 搜尋 =====
  const fetchSearchResults = async (keyword) => {
    try {
      setLoading(true);

      const res = await fetch(
        `${API_BASE}/api/search-spots?q=${keyword}`
      );

      const data = await res.json();

      setSearchResults(data);
      setShowDropdown(true);

      setSelectedIndex(-1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ===== 搜尋輸入 =====
  const handleSearch = (keyword) => {
    setSearchKeyword(keyword);

    if (!keyword.trim()) {
      setShowDropdown(false);
    } else {
      setShowDropdown(true);
    }
  };

  const clearSearch = () => {
    setSearchKeyword("");
    setSearchResults([]);
    setShowDropdown(false);
    setSelectedIndex(-1);
  };

  // ===== 點擊搜尋結果 =====
  const addSearchPlace = async (spot) => {
    try {
      // ===== 尚未建立 trip =====
      if (!currentTripId) {
        alert("請先建立並儲存行程");
        return;
      }

      const token = localStorage.getItem("token");

      const res = await fetch(
        `${API_BASE}/api/trip-place`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            trip_id: currentTripId,
            spot_name: spot.name,
          }),
        }
      );

      const data = await res.json();

      if (data.error) {
        console.log(data.error);
        return;
      }

      // ===== 重新加入 Sidebar =====
      const formattedPlace = {
        name: spot.name,
        address: spot.location,
        lat: spot.lat,
        lng: spot.lng,
        type: spot.category,
        image: spot.image,
        stayTime: "1~2 小時",
        activeTime:
          spot.open_time && spot.close_time
            ? `${spot.open_time} ~ ${spot.close_time}`
            : "08:00~17:00",
        description: "推薦旅遊景點",
      };

      setPlaces((prev) => {
        const exists = prev.some(
          (p) => p.name === formattedPlace.name
        );

        if (exists) return prev;

        return [...prev, formattedPlace];
      });

      setSearchKeyword("");
      setSearchResults([]);
      setShowDropdown(false);
      setSelectedIndex(-1);

    } catch (err) {
      console.error(err);
    }
  };

  //刪除推薦景點
  const removeSidebarPlace = async (place) => {
    try {

      const token = localStorage.getItem("token");

      await fetch(
        `${API_BASE}/api/trip-place/${place.trip_place_id}`,
        {
          method: "DELETE",

          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // ===== 更新前端 =====
      setPlaces((prev) =>
      prev.filter(
        (p) =>
          p.trip_place_id !== place.trip_place_id
      )
    );

  } catch (err) {
    console.error(err);
  }
};

  // ===== 鍵盤控制 =====
  const handleKeyDown = (e) => {
    if (!showDropdown) return;

    // ↓
    if (e.key === "ArrowDown") {
      e.preventDefault();

      setSelectedIndex((prev) =>
        prev < searchResults.length - 1
          ? prev + 1
          : 0
      );
    }

    // ↑
    if (e.key === "ArrowUp") {
      e.preventDefault();

      setSelectedIndex((prev) =>
        prev > 0
          ? prev - 1
          : searchResults.length - 1
      );
    }

    // Enter
    if (e.key === "Enter") {
      e.preventDefault();

      if (selectedIndex >= 0) {
        addSearchPlace(searchResults[selectedIndex]);
      }
    }
  };

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
      expandedPlaceName === place.name
        ? ""
        : place.name
    );
  };

  return (
    <div className="sidebar">
      <h2>推薦景點</h2>

      {/* ===== 搜尋框 ===== */}
      <div
        className="sidebar-search-wrapper"
        ref={searchRef}
      >
        <div className="search-input-wrapper">

          <input
            type="text"
            placeholder="搜尋景點..."
            value={searchKeyword}
            onChange={(e) =>
              handleSearch(e.target.value)
            }

            onFocus={() => {

              if (
                searchResults.length > 0 ||
                searchKeyword.trim()
              ) {
                setShowDropdown(true);
              }
            }}

            onKeyDown={handleKeyDown}

            className="sidebar-search-input"
          />

          {/* ===== 清除按鈕 ===== */}
          {searchKeyword && (
            <button
              className="clear-search-btn"
              onClick={clearSearch}
            >
              ✕
            </button>
          )}

        </div>

        {/* ===== Dropdown ===== */}
        {showDropdown && (
          <div className="search-dropdown">
            {/* ===== Loading ===== */}
            {loading && (
              <div className="search-loading">
                <div className="search-spinner"></div>
                <span>搜尋中...</span>
              </div>
            )}

            {/* ===== 無結果 ===== */}
            {!loading &&
              searchKeyword.trim() &&
              searchResults.length === 0 && (
                <div className="no-search-result">
                  <p>找不到相關景點</p>
                </div>
              )}

            {/* ===== 搜尋結果 ===== */}
            {!loading &&
              searchResults.map((spot, index) => (
                <div
                  key={index}
                  className={`search-dropdown-item ${
                    selectedIndex === index
                      ? "active-search-item"
                      : ""
                  }`}
                  onClick={() =>
                    addSearchPlace(spot)
                  }
                >
                  <img
                    src={
                      spot.image ||
                      "https://via.placeholder.com/60x60"
                    }
                    alt={spot.name}
                    onError={(e) => {
                      e.target.src =
                        "https://via.placeholder.com/60x60";
                    }}
                  />

                  <div>
                    <h4>{spot.name}</h4>
                    <p>{spot.location}</p>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* ===== 景點卡片 ===== */}
      {places.map((place, index) => {
        const isExpanded =
          expandedPlaceName === place.name;

        const isActive =
          activePlaceName === place.name;

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
                <button
                  className="delete-sidebar-place-btn"
                  onClick={(e) => {
                    e.stopPropagation();

                    removeSidebarPlace(place);
                  }}
                >
                  ✕
                </button>

              
                <div className="place-row-text">
                  <h4>{place.name}</h4>

                  <p>{place.type || "景點"}</p>

                  <span>
                    {place.stayTime || "1~2 小時"}
                  </span>
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

                  <p>
                    <strong>營業時間：</strong>
                    {place.acitiveTime ||
                      "08:00~17:00"}
                  </p>

                  <p className="place-detail-desc">
                    <strong>簡介：</strong>
                    {place.description ||
                      "這是值得安排進行程的推薦景點。"}
                  </p>
                </div>

                {/* ===== 加入天數 ===== */}
                <div className="place-action-row">
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      if (!e.target.value) return;

                      addToDay(
                        place,
                        Number(e.target.value)
                      );

                      e.target.value = "";
                    }}
                  >
                    <option value="">
                      加入行程...
                    </option>

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