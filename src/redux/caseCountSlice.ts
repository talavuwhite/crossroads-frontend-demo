import type { RelatedCounts } from "@/types/case";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

const initialState: RelatedCounts = {
  assistance: 0,
  notes: 0,
  documents: 0,
  alerts: 0,
  bedAssignments: 0,
  assessments: 0,
  outcomes: 0,
  relationships: 0,
  appointments: 0,
  rentalSubsidy: 0,
  maintenanceRequests: 0,
};

export const caseCountsSlice = createSlice({
  name: "caseCounts",
  initialState,
  reducers: {
    setCaseCounts: (state, action: PayloadAction<RelatedCounts>) => {
      return { ...state, ...action.payload };
    },
    updateCaseCount: (
      state,
      action: PayloadAction<{ key: keyof RelatedCounts; value: number }>
    ) => {
      const { key, value } = action.payload;
      state[key] = value;
    },
    resetCaseCounts: () => initialState,
  },
});

export const { setCaseCounts, resetCaseCounts, updateCaseCount } =
  caseCountsSlice.actions;

export default caseCountsSlice.reducer;
