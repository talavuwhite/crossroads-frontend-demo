import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  selectedBarcodeIds: [],
  layout: "1-column", // or "2-column"
  pageTitle: "",
  description: "",
  includeConfirm: true,
  visibleTo: "Agency Only",
};

const barcodePrintSlice = createSlice({
  name: "barcodePrint",
  initialState,
  reducers: {
    setSelectedBarcodeIds: (state, action) => {
      state.selectedBarcodeIds = action.payload;
    },
    setLayout: (state, action) => {
      state.layout = action.payload;
    },
    setPageTitle: (state, action) => {
      state.pageTitle = action.payload;
    },
    setDescription: (state, action) => {
      state.description = action.payload;
    },
    setIncludeConfirm: (state, action) => {
      state.includeConfirm = action.payload;
    },
    setVisibleTo: (state, action) => {
      state.visibleTo = action.payload;
    },
    reset: () => initialState,
  },
});

export const {
  setSelectedBarcodeIds,
  setLayout,
  setPageTitle,
  setDescription,
  setIncludeConfirm,
  setVisibleTo,
  reset,
} = barcodePrintSlice.actions;

export default barcodePrintSlice.reducer;
