import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { GHLUserData, SliceState } from "@/types/user";

const initialState: SliceState<GHLUserData> & {
  isAuthenticated: boolean;
  authMethod: "ghl" | "standalone" | null;
} = {
  data: null,
  loading: false,
  error: null,
  isAuthenticated: false,
  authMethod: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUserData(state, action: PayloadAction<GHLUserData | null>) {
      state.data = action.payload;
      state.loading = false;
      state.error = null;
      state.isAuthenticated = !!action.payload;
      state.authMethod = action.payload ? "standalone" : null;
    },
    setUserError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
      state.loading = false;
      state.data = null;
      state.isAuthenticated = false;
      state.authMethod = null;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setGHLUserData(state, action: PayloadAction<GHLUserData | null>) {
      state.data = action.payload;
      state.loading = false;
      state.error = null;
      state.isAuthenticated = !!action.payload;
      state.authMethod = action.payload ? "ghl" : null;
    },
    logout(state) {
      state.data = null;
      state.loading = false;
      state.error = null;
      state.isAuthenticated = false;
      state.authMethod = null;
    },
  },
});

export const { setUserData, setUserError, setLoading, setGHLUserData, logout } =
  userSlice.actions;

export default userSlice.reducer;
