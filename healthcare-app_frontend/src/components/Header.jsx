import React from "react";
import { Link } from "react-router-dom";
import { FaHospital,  FaUserMd } from "react-icons/fa";


const Header = ({ diseaseOptions, handleSearch, searchValue, fetchHospitals, handleLogOut }) => {
  return (
    <header className="bg-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <FaHospital className="text-3xl text-blue-600" />
          <span className="text-2xl font-bold text-blue-600">
            Health<span className="text-teal-600">Care</span>
          </span>
        </Link>

        {/* <div className="flex-1 max-w-xl w-full my-4 md:my-0">
          <Autocomplete
            options={diseaseOptions}
            value={searchValue}
            onChange={handleSearch}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Search hospitals by specialization..."
                variant="outlined"
                InputProps={{
                  ...params.InputProps,
                  className: "bg-white rounded-lg shadow-sm",
                  startAdornment: (
                    <FaStethoscope className="text-blue-600 ml-2 mr-1" />
                  ),
                }}
                onKeyPress={(e) => e.key === "Enter" && fetchHospitals(searchValue)}
              />
            )}
          />
        </div> */}

        <nav className="flex items-center gap-4">
          <Link to="/about" className="text-gray-600 hover:text-blue-600 transition-colors">
            About
          </Link>
          <Link to="/contact" className="text-gray-600 hover:text-blue-600 transition-colors">
            Contact
          </Link>
          <button
            onClick={handleLogOut}
            className="bg-blue-600 text-white px-4 py-2 rounded-full flex items-center gap-2 hover:bg-blue-700 transition-colors"
          >
            <FaUserMd className="text-lg" />
            <span>Logout</span>
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
