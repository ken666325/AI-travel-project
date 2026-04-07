import { useState, useEffect, useRef } from "react";

function Sidebar({ places, setSelectedPlace, setSelectedDay, setItinerary }) {
  const [menuIndex, setMenuIndex] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuIndex(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addToDay = (place, day) => {
    setItinerary((prev) => ({
      ...prev,
      [day]: [...prev[day], place],
    }));

    setSelectedPlace(place);
    setSelectedDay(day);
    setMenuIndex(null);
  };

  return (
    <div className="sidebar">
      <h2>推薦景點</h2>

      {places.map((place, index) => (
        <div
          key={index}
          className="place-item"
          ref={menuIndex === index ? menuRef : null}
        >
          <button
            className="place-button"
            onClick={() => {
              setSelectedPlace(place);
              setSelectedDay(null);
              setMenuIndex(menuIndex === index ? null : index);
            }}
          >
            {place.name}
          </button>

          {menuIndex === index && (
            <div className="place-menu">
              <button onClick={() => setSelectedPlace(place)}>📍 在地圖顯示</button>
              <button onClick={() => addToDay(place, "Day1")}>加入 Day1</button>
              <button onClick={() => addToDay(place, "Day2")}>加入 Day2</button>
              <button onClick={() => addToDay(place, "Day3")}>加入 Day3</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default Sidebar;