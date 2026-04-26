export const getToken = () => localStorage.getItem("token");
export const getUserId = () => localStorage.getItem("userId");
export const isAuthed = () => Boolean(getToken());

export const setSession = ({ token, userId, user }) => {
  if (token) localStorage.setItem("token", token);
  if (userId) localStorage.setItem("userId", userId);
  if (user) localStorage.setItem("user", JSON.stringify(user));
};

export const clearSession = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
  localStorage.removeItem("user");
};

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
