export async function sendMessage(message){

  try{

    const res = await fetch("http://localhost:8000/chat",{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify({message})
    });

    return await res.json();

  }catch(err){

    return {reply:"AI 伺服器尚未連接"};

  }

}