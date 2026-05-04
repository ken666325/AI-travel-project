import { useState } from "react";
import API_BASE from "../api/fetchAPI";

function Login({ setToken }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      console.log("LOGIN RESPONSE:", data); // ⭐ debug用

      if (res.ok) {
        localStorage.setItem("token", data.token);
        setToken(data.token);

        // ⭐ 加這行（關掉 AuthPage）
        setTimeout(() => {
            window.location.reload(); // 最穩版本（避免 state 混亂）
        }, 100);
    }

      if (!res.ok) {
        setError(data.error || "登入失敗");
        return;
      }

      if (!data.token) {
        setError("沒有收到 token（後端問題）");
        return;
      }

      localStorage.setItem("token", data.token);
      setToken(data.token);

    } catch (err) {
      setError("伺服器錯誤");
      console.log(err);
    }
  };

  return (
    <div className="auth-form">
      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {error && <p className="error">{error}</p>}

      <button onClick={handleLogin}>登入</button>
    </div>
  );
}

export default Login;