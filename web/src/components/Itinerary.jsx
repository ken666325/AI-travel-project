function Itinerary({
  itinerary,
  setItinerary,
  setSelectedPlace,
  setSelectedDay,
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
          <h3 className={`day-title ${day.toLowerCase()}`}>{day}</h3>

          {itinerary[day].length === 0 ? (
            <p>尚未加入景點</p>
          ) : (
            itinerary[day].map((place, index) => (
              <div
                key={index}
                className="spot-card clickable"
                onClick={() => {
                  setSelectedPlace(place);
                  setSelectedDay(day);
                }}
              >
                <div className="spot-name">{place.name}</div>

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
        </div>
      ))}
    </div>
  );
}

export default Itinerary;