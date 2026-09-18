// src/auth/AuthPage.jsx
import { useState } from "react";
import Login from "./Login";
import Register from "./Register";

function AuthPage({ setToken, setShowAuth }) {
  const [mode, setMode] = useState("login");

  const handleSkipLogin = () => {
    // 清除 token，設定為訪客模式
    setToken(null);
    setShowAuth(false); // 隱藏登入頁，回到主頁面
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>{mode === "login" ? "登入" : "註冊"}</h2>

        {mode === "login" ? (
          <Login setToken={setToken} />
        ) : (
          <Register setMode={setMode} />
        )}

        <div className="auth-switch">
          {mode === "login" ? (
            <p>
              沒有帳號？
              <span onClick={() => setMode("register")}>去註冊</span>
            </p>
          ) : (
            <p>
              已經有帳號？
              <span onClick={() => setMode("login")}>去登入</span>
            </p>
          )}
        </div>

        {/* 回到首頁按鈕 */}
        <button onClick={handleSkipLogin} style={{ marginTop: '10px' }}>
          回到首頁
        </button>
      </div>
    </div>
  );
}

export default AuthPage;