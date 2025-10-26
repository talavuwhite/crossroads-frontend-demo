import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getRecentSearchTerms } from "@/services/CaseApi";
import type { RecentSearch } from "@/types/case";

interface RecentSearchesState {
  data: RecentSearch[];
  loading: boolean;
  error: string | null;
}

const initialState: RecentSearchesState = {
  data: [],
  loading: false,
  error: null,
};

export const fetchRecentSearches = createAsyncThunk(
  "recentSearches/fetchRecentSearches",
  async ({ userId, locationId }: { userId: string; locationId: string }) => {
    const response = await getRecentSearchTerms(userId, locationId);
    return response;
  }
);

const recentSearchesSlice = createSlice({
  name: "recentSearches",
  initialState,
  reducers: {
    addRecentSearch: (state, action) => {
      state.data = [action.payload, ...state.data];
    },
    clearRecentSearches: (state) => {
      state.data = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRecentSearches.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRecentSearches.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchRecentSearches.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch recent searches";
      });
  },
});

export const { addRecentSearch, clearRecentSearches } =
  recentSearchesSlice.actions;
export default recentSearchesSlice.reducer;
