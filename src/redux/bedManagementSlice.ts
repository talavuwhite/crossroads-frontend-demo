import { createSlice } from '@reduxjs/toolkit'

const bedManagementSlice = createSlice({
  name: 'bedManagement',
  initialState: {
    shouldRefetch: false,
    shouldRefetchRequests: false, // Added for requests
  },
  reducers: {
    triggerBedsRefetch(state) {
      state.shouldRefetch = !state.shouldRefetch
    },
    triggerRequestsRefetch(state) {
      state.shouldRefetchRequests = !state.shouldRefetchRequests
    },
  },
})

export const { triggerBedsRefetch, triggerRequestsRefetch } =
  bedManagementSlice.actions
export default bedManagementSlice.reducer
