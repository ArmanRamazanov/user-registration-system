import "../css/main-page.css";
import { useLoaderData, Link, redirect } from "react-router-dom";
import {
  getLocalStorage,
  removeLocalStorage,
  setLocalStorage,
} from "../utils/localStorage";

export default function MainPage() {
  const { user } = useLoaderData();

  return user ? (
    <div className="main-page">
      <h2>Login is successful</h2>
      <p>Hello {user.profile.firstName}</p>
    </div>
  ) : (
    <div className="main-page">
      <h2>You are no longer authorized</h2>
      <Link to="/login">Go back to login</Link>
    </div>
  );
}

export async function loader() {
  try {
    const token = getLocalStorage("token");
    const response = await fetch("http://localhost:4000/api/auth/main", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 403) {
      const response = await fetch("http://localhost:4000/api/auth/token", {
        credentials: "include",
      });

      const { accessToken } = await response.json();

      if (accessToken) {
        removeLocalStorage("token");
        setLocalStorage("token", accessToken);

        const retryResponse = await fetch(
          "http://localhost:4000/api/auth/main",
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        );

        const { data } = await retryResponse.json();
        return { user: data };
      } else {
        redirect("/login");
      }
    }

    const { data } = await response.json();

    return { user: data };
  } catch (error) {
    throw error;
  }
}
