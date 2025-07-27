import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  peerId: null,
  sdp: null,
  name: null,
  image: null,
};

export const callSlice = createSlice({
  name: "call",
  initialState,
  reducers: {
    setCallData: (state, action) => {
      return { ...state, ...action.payload };
    },
    clearCallData: () => initialState,
  },
});

export const { setCallData, clearCallData } = callSlice.actions;
export default callSlice.reducer;
