import { NavLink, Outlet, useNavigate } from "react-router-dom";
import "./css/rootLayout.css";
import { getLocalStorage, removeLocalStorage } from "./utils/localStorage";

export default function RootLayout() {
  const navigate = useNavigate();
  async function handleLogout() {
    const token = getLocalStorage("token");

    if (!token) return;
    const response = await fetch("http://localhost:4000/api/auth/logout", {
      method: "POST",
    });

    if (response.ok) {
      navigate("/login");
      removeLocalStorage("token");
    }
  }

  return (
    <>
      <header>
        <p>User registration system</p>
        <div>
          <NavLink to="/login">Log in</NavLink>
          <button onClick={handleLogout}>Log out</button>
        </div>
      </header>
      <section>
        <Outlet></Outlet>
      </section>
    </>
  );
}
