export async function apiFetch(url, options = {}) {
  const token = localStorage.getItem("access_token");

  const headers = {
        "Content-Type": "application/json",   // ⭐ 추가

    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  const res = await fetch(url, { ...options, headers });

  // 🔥 여기 중요
  if (res.status === 401) {
    alert("로그인이 필요합니다.");
    localStorage.removeItem("access_token");
    window.location.href = "/login";
    throw new Error("401 Unauthorized");
  }

  if (res.status === 403) {
    alert("접근 권한이 없습니다.");
    throw new Error("403 Forbidden");
  }

  return res;
}
