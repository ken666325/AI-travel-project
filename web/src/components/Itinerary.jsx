import React from "react";

export default function Itinerary({ itinerary, removeSpot, moveSpot }) {
  return (
    <div style={{ width: 240, background: "#fafafa", overflowY: "auto", padding: 10 }}>
      <h3 style={{ textAlign: "center" }}>行程規劃</h3>

      {Object.keys(itinerary).map((day) => (
        <div key={day} style={{ marginBottom: 50 }}>
          <h2>{day}</h2>
          {itinerary[day].map((spot, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: 6,
                marginBottom: 4,
                
                borderRadius: 6,
                background: "#e0e0e0",
              }}
            >
              <span>{spot}</span>
              <div style={{ display: "flex", gap: "4px" }}>
                {/* 上移 */}
                <button
                  onClick={() => moveSpot(day, i, -1)}
                  disabled={i === 0}
                  style={{ cursor: i === 0 ? "not-allowed" : "pointer" }}
                >
                  ↑
                </button>

                {/* 下移 */}
                <button
                  onClick={() => moveSpot(day, i, 1)}
                  disabled={i === itinerary[day].length - 1}
                  style={{ cursor: i === itinerary[day].length - 1 ? "not-allowed" : "pointer" }}
                >
                  ↓
                </button>

                {/* 刪除 */}
                <span
                  style={{ cursor: "pointer", color: "red", fontWeight: "bold" }}
                  onClick={() => removeSpot(day, i)}
                >
                  ❌
                </span>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}