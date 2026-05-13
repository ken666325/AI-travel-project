import { useState } from "react";
import API_BASE from "../api/fetchAPI";

function Register({ setMode }) {

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [msg, setMsg] = useState("");

  // 名稱驗證
  const validateName = (name) => {
    return /^[A-Za-z0-9_]{2,20}$/.test(name);
  };

  // Email 驗證
  const validateEmail = (email) => {
    return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email);
  };

  // 密碼驗證
  const validatePassword = (password) => {
    return /^[A-Za-z0-9!@#$%^&*()_+=.-]{6,30}$/.test(password);
  };

  const handleRegister = async () => {

    setMsg("");

    // 前端驗證
    if (!validateName(name)) {
      setMsg("名稱只能英文、數字、底線");
      return;
    }

    if (!validateEmail(email)) {
      setMsg("Email 格式錯誤");
      return;
    }

    if (!validatePassword(password)) {
      setMsg("密碼格式錯誤");
      return;
    }

    if (password !== confirmPassword) {
      setMsg("確認密碼不一致");
      return;
    }

    try {

      const res = await fetch(`${API_BASE}/api/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMsg(data.error || "註冊失敗");
        return;
      }

      setMsg("註冊成功！");

      setTimeout(() => {
        setMode("login");
      }, 1000);

    } catch {
      setMsg("伺服器錯誤");
    }
  };

  // Enter 送出
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleRegister();
    }
  };

  return (
    <div className="auth-form">

      <input
        placeholder="Name"
        maxLength={20}
        onKeyDown={handleKeyDown}
        onChange={(e) => {
          const value = e.target.value.replace(
            /[^A-Za-z0-9_]/g,
            ""
          );
          setName(value);
        }}
      />

      <input
        placeholder="Email"
        maxLength={50}
        onKeyDown={handleKeyDown}
        onChange={(e) => {
          const value = e.target.value.replace(
            /[^\x00-\x7F]/g,
            ""
          );
          setEmail(value);
        }}
      />

      <div className="password-box">

        <input
          type={showPassword ? "text" : "password"}
          placeholder="Password"
          maxLength={30}
          onKeyDown={handleKeyDown}
          onChange={(e) => {
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

      <input
        type={showPassword ? "text" : "password"}
        placeholder="Confirm Password"
        maxLength={30}
        onKeyDown={handleKeyDown}
        onChange={(e) => {
          const value = e.target.value.replace(
            /[^A-Za-z0-9!@#$%^&*()_+=.-]/g,
            ""
          );
          setConfirmPassword(value);
        }}
      />

      {msg && <p>{msg}</p>}

      <button onClick={handleRegister}>
        註冊
      </button>

    </div>
  );
}

export default Register;