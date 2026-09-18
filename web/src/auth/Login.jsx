import { useState } from "react";
import API_BASE from "../api/fetchAPI";

function Login({ setToken }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");

  /*/ Email 驗證
  const validateEmail = (email) => {
    return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email);
  };*/

  // 密碼限制（英數+特殊符號）
  const validatePassword = (password) => {
    return /^[A-Za-z0-9!@#$%^&*()_+=.-]{6,30}$/.test(password);
  };

  const handleLogin = async () => {
    setError("");

    /*/ 前端驗證
    if (!validateEmail(email)) {
      setError("帳號不存在");
      return;
    }

    if (!validatePassword(password)) {
      setError("密碼格式錯誤");
      return;
    }*/

    try {
      const res = await fetch(`${API_BASE}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json();

      console.log("LOGIN RESPONSE:", data);

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

      setTimeout(() => {
        window.location.reload();
      }, 100);

    } catch (err) {
      setError("伺服器錯誤");
      console.log(err);
    }
  };

  // Enter 送出
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <div className="auth-form">

      <input
        placeholder="Email"
        value={email}
        maxLength={50}
        onKeyDown={handleKeyDown}
        onChange={(e) => {
          // 禁止中文與空白
          const value = e.target.value.replace(/[^\x00-\x7F]/g, "");
          setEmail(value);
        }}
      />

      <div className="password-box">
        <input
          type={showPassword ? "text" : "password"}
          placeholder="Password"
          value={password}
          maxLength={30}
          onKeyDown={handleKeyDown}
          onChange={(e) => {
            // 只允許特定字元
            const value = e.target.value.replace(
              /[^A-Za-z0-9!@#$%^&*()_+=.-]/g,
              ""
            );
            setPassword(value);
          }}
        />

        <span
          className="eye-btn"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? "🙈" : "👁️"}
        </span>
      </div>

      {error && <p className="error">{error}</p>}

      <button onClick={handleLogin}>
        登入
      </button>

    </div>
  );
}

export default Login;