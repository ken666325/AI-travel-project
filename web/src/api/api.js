/* export async function sendMessage(message) {
  // 這裡示範假資料，可改成你們的後端 API
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ reply: `AI 回覆: ${message}` });
    }, 600);
  });
} */

export async function sendMessage(message) {
  console.log("送到後端的訊息：", message);

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        reply: `我幫你推薦一組旅遊景點：${message}`,
        places: [
          {
            name: "台北101",
            lat: 25.033964,
            lng: 121.564468,
            address: "台北市信義區信義路五段7號",
            type: "景點 / 商場",
            stayTime: "2 小時",
            activeTime: "08:00~17:00",
            image:
              "https://stage.taipei101mall.com.tw/uploads/article/616965e786a25.png?q=80&w=1200&auto=format&fit=crop",
            description: "台北最具代表性的地標之一，可購物、觀景、用餐。",
          },
          {
            name: "象山",
            lat: 25.027033,
            lng: 121.570497,
            address: "台北市信義區",
            type: "夜景 / 登山",
            stayTime: "1.5 小時",
            activeTime: "08:00~17:00",
            image:
              "https://egoldenyears.com/wp-content/uploads/2018/10/20181011_a0115.jpg?q=80&w=1200&auto=format&fit=crop",
            description: "適合傍晚登山欣賞台北101夜景，熱門拍照景點。",
          },
          {
            name: "西門町",
            lat: 25.042233,
            lng: 121.507391,
            address: "台北市萬華區",
            type: "商圈 / 美食",
            stayTime: "2~3 小時",
            activeTime: "08:00~17:00",
            image:
              "https://www.taiwan.net.tw/att/1/big_scenic_spots/pic_2254_3.jpg?q=80&w=1200&auto=format&fit=crop",
            description: "台北熱門商圈，適合逛街、吃美食、體驗年輕文化。",
          },
          {
            name: "中正紀念堂",
            lat: 25.034535,
            lng: 121.521275,
            address: "台北市中正區中山南路21號",
            type: "歷史景點",
            stayTime: "1~2 小時",
            activeTime: "08:00~17:00",
            image:
              "https://upload.wikimedia.org/wikipedia/commons/0/0d/2022%E5%B9%B4%E7%9A%84%E4%B8%AD%E6%AD%A3%E7%B4%80%E5%BF%B5%E5%A0%82.jpg?q=80&w=1200&auto=format&fit=crop",
            description: "台北著名歷史地標，適合拍照與文化參觀。",
          },
        ],
        itinerary: [
          { day: 1, spots: [
            {
              name: "台北101",
              lat: 25.033964,
              lng: 121.564468,
              address: "台北市信義區信義路五段7號",
              type: "景點 / 商場",
              stayTime: "2 小時",
              activeTime: "08:00~17:00",
              image:
                "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop",
              description: "台北最具代表性的地標之一，可購物、觀景、用餐。",
            },
            {
              name: "象山",
              lat: 25.027033,
              lng: 121.570497,
              address: "台北市信義區",
              type: "夜景 / 登山",
              stayTime: "1.5 小時",
              activeTime: "08:00~17:00",
              image:
                "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=1200&auto=format&fit=crop",
              description: "適合傍晚登山欣賞台北101夜景，熱門拍照景點。",
            },
          ] },
          { day: 2, spots: [
            {
              name: "西門町",
              lat: 25.042233,
              lng: 121.507391,
              address: "台北市萬華區",
              type: "商圈 / 美食",
              stayTime: "2~3 小時",
              activeTime: "08:00~17:00",
              image:
                "https://images.unsplash.com/photo-1526481280695-3c4691b7b3a8?q=80&w=1200&auto=format&fit=crop",
              description: "台北熱門商圈，適合逛街、吃美食、體驗年輕文化。",
            },
            {
              name: "中正紀念堂",
              lat: 25.034535,
              lng: 121.521275,
              address: "台北市中正區中山南路21號",
              type: "歷史景點",
              stayTime: "1~2 小時",
              activeTime: "08:00~17:00",
              image:
                "https://images.unsplash.com/photo-1519046904884-53103b34b206?q=80&w=1200&auto=format&fit=crop",
              description: "台北著名歷史地標，適合拍照與文化參觀。",
            },
          ] },
          { day: 3, spots: [] },
        ]
      });
    }, 1000);
  });
}