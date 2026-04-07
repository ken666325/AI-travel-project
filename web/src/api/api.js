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
          },
          {
            name: "象山",
            lat: 25.027033,
            lng: 121.570497,
            address: "台北市信義區",
            type: "夜景 / 登山",
            stayTime: "1.5 小時",
          },
          {
            name: "西門町",
            lat: 25.042233,
            lng: 121.507391,
            address: "台北市萬華區",
            type: "商圈 / 美食",
            stayTime: "2~3 小時",
          },
          {
            name: "中正紀念堂",
            lat: 25.034535,
            lng: 121.521275,
            address: "台北市中正區中山南路21號",
            type: "歷史景點",
            stayTime: "1~2 小時",
          },
        ],
        itinerary: {
          Day1: [
            {
              name: "台北101",
              lat: 25.033964,
              lng: 121.564468,
              address: "台北市信義區信義路五段7號",
              type: "景點 / 商場",
              stayTime: "2 小時",
            },
            {
              name: "象山",
              lat: 25.027033,
              lng: 121.570497,
              address: "台北市信義區",
              type: "夜景 / 登山",
              stayTime: "1.5 小時",
            },
          ],
          Day2: [
            {
              name: "西門町",
              lat: 25.042233,
              lng: 121.507391,
              address: "台北市萬華區",
              type: "商圈 / 美食",
              stayTime: "2~3 小時",
            },
            {
              name: "中正紀念堂",
              lat: 25.034535,
              lng: 121.521275,
              address: "台北市中正區中山南路21號",
              type: "歷史景點",
              stayTime: "1~2 小時",
            },
          ],
          Day3: [],
        },
      });
    }, 1000);
  });
}