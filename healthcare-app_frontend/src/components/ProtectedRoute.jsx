import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ProtectedRoute({ Component }) {
    const navigate = useNavigate();
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");  // ✅ Check token in localStorage
        if (!token) {
            navigate("/login");  // Redirect if not authenticated
        } else {
            setIsAuthenticated(true);
        }
    }, [navigate]);

    return isAuthenticated ? <Component /> : null; // ✅ Render component only if authenticated
}
