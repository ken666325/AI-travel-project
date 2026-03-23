// src/components/Sidebar.jsx
import React, { useState, useEffect, useRef } from "react";

export default function Sidebar({ aiRecommendations, addToDay }) {
  const [activeSpot, setActiveSpot] = useState(null);
  const containerRef = useRef(null);

  const handleClickSpot = (spot) => {
    setActiveSpot(spot);
  };

  const handleAddDay = (day) => {
    if (activeSpot) {
      addToDay(activeSpot, day);
      setActiveSpot(null); // 選完後關閉
    }
  };

  // 點擊其他地方自動關閉
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setActiveSpot(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ width: 220, background: "#f0f0f0", overflowY: "auto", padding: 10 }}
    >
      <h3 style={{ textAlign: "center" }}>AI 推薦 / 景點</h3>
      {aiRecommendations.map((spot, i) => (
        <div
          key={i}
          style={{
            padding: 8,
            marginBottom: 6,
            borderRadius: 6,
            background: "#fff",
            cursor: "pointer",
            boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
            position: "relative"
          }}
          onClick={() => handleClickSpot(spot)}
        >
          {spot}

          {/* 彈出選單 */}
          {activeSpot === spot && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                background: "#fff",
                boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
                borderRadius: 6,
                padding: 5,
                marginTop: 5,
                zIndex: 10
              }}
            >
              <button
                style={{ display: "block", width: "100%", marginBottom: 5 }}
                onClick={() => alert(`詳細資料: ${spot}`)}
              >
                顯示景點詳細資料
              </button>
              <button
                style={{ display: "block", width: "100%", marginBottom: 5 }}
                onClick={() => handleAddDay("Day1")}
              >
                加入 Day1
              </button>
              <button
                style={{ display: "block", width: "100%" }}
                onClick={() => handleAddDay("Day2")}
              >
                加入 Day2
              </button>

              <button
                style={{ display: "block", width: "100%", marginBottom: 5 }}
                onClick={() => handleAddDay("Day3")}
              >
                加入 Day3
              </button>
              <button
                style={{ display: "block", width: "100%" }}
                onClick={() => handleAddDay("Day4")}
              >
                加入 Day4
              </button>

              <button
                style={{ display: "block", width: "100%", marginBottom: 5 }}
                onClick={() => handleAddDay("Day5")}
              >
                加入 Day5
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}