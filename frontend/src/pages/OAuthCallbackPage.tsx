import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export const OAuthCallbackPage = ({ setIsLoggedIn } : any) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      // Save the token locally (optional)
      localStorage.setItem("token", token);

      // Set user as logged in
      setIsLoggedIn(true);

      // Navigate to home/dashboard
      navigate("/");
    } else {
      console.error("No token found in OAuth callback");
      // Handle error gracefully
    }
  }, [searchParams, setIsLoggedIn, navigate]);

  return <div>Signing you in...</div>;
};
