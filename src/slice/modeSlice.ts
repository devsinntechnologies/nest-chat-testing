import { createSlice } from "@reduxjs/toolkit";
import Cookies from "js-cookie";

interface ModeState {
  mode: string;
}

// Function to get mode from cookies (defaults to "buyer" if not found)
const getModeFromCookies = (): ModeState => {
  const userMode = Cookies.get("userRole");
  
  if (userMode && ["seller", "buyer"].includes(userMode)) {
    return { mode: userMode };
  } else {
    Cookies.set("userRole", "buyer", { path: "/" }); // Default to buyer
    return { mode: "buyer" };
  }
};

const initialState: ModeState = getModeFromCookies();

export const modeSlice = createSlice({
  name: "modeSlice",
  initialState,
  reducers: {
    toggleUserMode: (state) => {
      const newMode = state.mode === "seller" ? "buyer" : "seller";
      state.mode = newMode;
      Cookies.set("userRole", newMode, { path: "/" });
    },
  },
});

// Export actions and reducer
export const { toggleUserMode } = modeSlice.actions;
export default modeSlice.reducer;
