// store/slices/networkSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface NetworkState {
  online: boolean;
}

const initialState: NetworkState = {
  online: true, // Assume user is online by default
};

export const networkSlice = createSlice({
  name: 'network',
  initialState,
  reducers: {
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.online = action.payload;
    },
  },
});

export const { setOnlineStatus } = networkSlice.actions;
export default networkSlice.reducer;
