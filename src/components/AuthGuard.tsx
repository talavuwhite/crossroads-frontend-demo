import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import type { RootState } from "@/redux/store";
import Loader from "@/components/ui/Loader";

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const {
    isAuthenticated,
    loading,
    data: userData,
  } = useSelector((state: RootState) => state.user);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Don't redirect if already on auth pages
    if (location.pathname.startsWith("/auth/")) {
      return;
    }

    // If still loading, wait
    if (loading) {
      return;
    }

    // If not authenticated, redirect to login
    if (!isAuthenticated || !userData) {
      navigate("/auth/login", {
        state: { from: location.pathname },
        replace: true,
      });
    }
  }, [isAuthenticated, loading, userData, navigate, location.pathname]);

  // If on auth pages, render children without checking authentication
  if (location.pathname.startsWith("/auth/")) {
    return <>{children}</>;
  }

  // Show loader only if we're actually loading and don't have user data
  if (loading && !userData && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  // If not authenticated, don't render children (will redirect)
  if (!isAuthenticated || !userData) {
    return null;
  }

  // If authenticated, render children
  return <>{children}</>;
};

export default AuthGuard;
