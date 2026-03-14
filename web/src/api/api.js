export async function sendMessage(message) {
  // 這裡示範假資料，可改成你們的後端 API
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ reply: `AI 回覆: ${message}` });
    }, 600);
  });
}