// src/components/Navbar.jsx
function Navbar({ user, onLogin, onLogout }) {
  return (
    <div
      style={{
        position: "fixed",
        top: 10,
        right: 10,
        zIndex: 9999,
        display: "flex",
        gap: "10px",
        alignItems: "center",
        background: "white",
        padding: "8px 12px",
        borderRadius: "10px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
      }}
    >
      <span>
        👤 {user ? user.name : "訪客模式"}
      </span>

      {!user ? (
        <button onClick={onLogin}>
          登入 / 註冊
        </button>
      ) : (
        <button
          onClick={() => {
            onLogout(); // 呼叫登出方法
            window.location.reload(); // 刷新頁面
          }}
          style={{
            background: "#ff4d4f",
            color: "white",
            border: "none",
            padding: "5px 10px",
            borderRadius: "6px",
            cursor: "pointer"
          }}
        >
          登出
        </button>
      )}
    </div>
  );
}

export default Navbar;