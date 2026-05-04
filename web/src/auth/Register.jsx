import { useState } from "react";
import API_BASE from "../api/fetchAPI.js";

function Register({ setMode }) {
  const [name, setName] = useState(""); // ⭐新增
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const handleRegister = async () => {
    setMsg("");

    try {
      const res = await fetch(`${API_BASE}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,       // ⭐新增
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMsg(data.error || "註冊失敗");
        return;
      }

      setMsg("註冊成功！");
      setTimeout(() => setMode("login"), 1000);

    } catch {
      setMsg("伺服器錯誤");
    }
  };

  return (
    <div className="auth-form">
      <input
        placeholder="Name"
        onChange={(e) => setName(e.target.value)}
      />

      <input
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
      />

      {msg && <p>{msg}</p>}

      <button onClick={handleRegister}>註冊</button>
    </div>
  );
}

export default Register;