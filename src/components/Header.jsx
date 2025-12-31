import { Link, useNavigate } from "react-router-dom";

import "../App.css";
import { useContext } from "react";
import AuthContext from "../contexts/AuthContext.jsx";

const Header = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const toggleMenu = () => {
    const menu = document.querySelector(".menu-btn");
    const nav = document.querySelector(".nav");
    if (menu) menu.classList.toggle("change");
    if (nav) nav.classList.toggle("show");
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  }

  return (
    <header className="header">
      <a className="logo" href="/">
        qui<span className="mid">z</span>z
      </a>

      {!user && (
        <>
          <nav className="nav">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/signup" className="nav-link">Signup</Link>
          </nav>
          <div className="menu-btn small-screen" onClick={toggleMenu}>
            <div className="bar1"></div>
            <div className="bar2"></div>
            <div className="bar3"></div>
          </div>
        </>
      )}
      {user && (
      <div className="profile d-flex">
        <div className="profie-section d-flex flex-column">
          <img src="https://res.cloudinary.com/dd7ec5m1r/image/upload/v1766657859/profile_img_lwtbgm.jpg" alt="profile" className="profile-img"/>
          <span className="profile-name">{user.name}</span>
        </div>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </div>
      )}
    </header>
  );
};

export default Header;
