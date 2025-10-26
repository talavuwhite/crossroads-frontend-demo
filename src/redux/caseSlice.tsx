import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { SliceState } from "@/types/user";
import type { CaseType } from "@/types/case";

const initialState: SliceState<CaseType> = {
  data: null,
  loading: true,
  error: null,
};

const caseSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setCurrentCaseData(state, action: PayloadAction<CaseType | null>) {
      state.data = action.payload;
      state.loading = false;
      state.error = null;
    },
    setCaseError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
      state.loading = false;
      state.data = null;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
  },
});

export const { setCurrentCaseData, setCaseError, setLoading } = caseSlice.actions;

export default caseSlice.reducer;
