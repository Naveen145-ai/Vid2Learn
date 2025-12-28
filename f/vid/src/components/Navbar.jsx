import { useNavigate } from "react-router-dom";
import { UserCircleIcon, ArrowLeftOnRectangleIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

export default function Navbar({ user = null }) {
  const navigate = useNavigate();
  const [profileMenu, setProfileMenu] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <nav className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* Logo */}
        <h1
          onClick={() => navigate("/home")}
          className="text-2xl font-bold cursor-pointer hover:text-yellow-300 transition"
        >
          Vid2Learn
        </h1>

        {/* Menu Items */}
        <div className="flex space-x-6 items-center">
          <button
            onClick={() => navigate("/home")}
            className="hover:text-yellow-300 transition font-semibold"
          >
            Home
          </button>
          <button
            onClick={() => navigate("/upload")}
            className="hover:text-yellow-300 transition font-semibold"
          >
            Upload Video
          </button>

          {/* Auth Section */}
          {!user ? (
            <>
              <button
                onClick={() => navigate("/login")}
                className="px-4 py-2 border-2 border-white rounded-lg hover:bg-white hover:text-indigo-600 transition"
              >
                Login
              </button>
              <button
                onClick={() => navigate("/signup")}
                className="px-4 py-2 bg-yellow-300 text-indigo-600 font-bold rounded-lg hover:bg-white transition"
              >
                Sign Up
              </button>
            </>
          ) : (
            <div className="relative">
              <button
                onClick={() => setProfileMenu(!profileMenu)}
                className="flex items-center space-x-2 px-4 py-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition"
              >
                <UserCircleIcon className="h-6 w-6" />
                <span className="font-semibold">{user.name}</span>
              </button>

              {/* Profile Dropdown */}
              {profileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded-lg shadow-xl z-50">
                  <div className="px-4 py-3 border-b">
                    <p className="font-semibold">{user.name}</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      navigate("/profile");
                      setProfileMenu(false);
                    }}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                  >
                    My Profile
                  </button>
                  <button
                    onClick={() => {
                      navigate("/history");
                      setProfileMenu(false);
                    }}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                  >
                    Upload History
                  </button>
                  <button
                    onClick={() => {
                      handleLogout();
                      setProfileMenu(false);
                    }}
                    className="block w-full text-left px-4 py-2 hover:bg-red-100 text-red-600 flex items-center space-x-2"
                  >
                    <ArrowLeftOnRectangleIcon className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
