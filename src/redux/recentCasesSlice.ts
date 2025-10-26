import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { SliceState } from "@/types/user";

interface RecentCase {
  _id: string;
  name: string;
}

const initialState: SliceState<RecentCase[]> = {
  data: [],
  loading: false,
  error: null,
};

const recentCasesSlice = createSlice({
  name: "recentCases",
  initialState,
  reducers: {
    setRecentCases(state, action: PayloadAction<RecentCase[]>) {
      state.data = action.payload;
      state.loading = false;
      state.error = null;
    },
    setRecentCasesError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
      state.loading = false;
    },
    setRecentCasesLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
  },
});

export const { setRecentCases, setRecentCasesError, setRecentCasesLoading } =
  recentCasesSlice.actions;

export default recentCasesSlice.reducer;
