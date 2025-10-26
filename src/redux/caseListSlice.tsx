import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { CaseType } from "@/types/case";

interface CasesState {
  list: CaseType[];
  shouldRefresh: boolean;
}

const initialState: CasesState = {
  list: [],
  shouldRefresh: false,
};

const caseListSlice = createSlice({
  name: "cases",
  initialState,
  reducers: {
    setCaseList(state, action: PayloadAction<CaseType[]>) {
      state.list = action.payload;
      state.shouldRefresh = false; // reset refresh flag after setting list
    },
    markForRefresh(state) {
      state.shouldRefresh = true;
    },
  },
});

export const { setCaseList, markForRefresh } = caseListSlice.actions;

export default caseListSlice.reducer;
