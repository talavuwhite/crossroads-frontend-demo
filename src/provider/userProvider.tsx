import React, { useEffect } from "react";
import { setUserError, setLoading, setGHLUserData } from "@redux/userSlice";
import { useDispatch, useSelector } from "react-redux";
import { useUserContext } from "@/hooks/useUserContext";
import type { RootState } from "@/redux/store";

export const UserDataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { userData, error } = useUserContext();
  const dispatch = useDispatch();
  const { isAuthenticated, authMethod } = useSelector(
    (state: RootState) => state.user
  );

  useEffect(() => {
    // Check if user is already authenticated via standalone login
    if (isAuthenticated && authMethod === "standalone") {
      return; // Don't override standalone auth with GHL
    }

    // Handle GHL authentication
    if (userData) {
      dispatch(setGHLUserData(userData));
    } else if (error) {
      dispatch(setUserError(error));
    } else {
      // If no user data and no error, set loading to false
      dispatch(setLoading(false));
    }
  }, [userData, error, dispatch, isAuthenticated, authMethod]);

  return <>{children}</>;
};
