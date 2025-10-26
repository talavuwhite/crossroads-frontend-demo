import { configureStore } from '@reduxjs/toolkit'
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import userReducer from '@/redux/userSlice'
import caseReducer from '@/redux/caseSlice'
import caseListReducer from "@/redux/caseListSlice";
import recentCasesReducer from '@/redux/recentCasesSlice'
import recentSearchesReducer from '@/redux/recentSearchesSlice'
import bedManagementReducer from '@/redux/bedManagementSlice'
import { combineReducers } from 'redux'
import caseCountReducer from "@/redux/caseCountSlice";
import barcodePrintReducer from "@/redux/barcodePrintSlice";

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ["user", "caseCounts"],
};

const rootReducer = combineReducers({
  user: userReducer,
  case: caseReducer,
  caseList: caseListReducer,
  recentCases: recentCasesReducer,
  recentSearches: recentSearchesReducer,
  bedManagement: bedManagementReducer,
  barcodePrint: barcodePrintReducer,
  caseCounts: caseCountReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
})

export const persistor = persistStore(store)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
