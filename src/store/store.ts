import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query/react';
import { auth } from '@/hooks/UseAuth';
import { authSlice } from '@/slice/authSlice';
import { chat } from '@/hooks/useChat';
import { networkSlice } from '@/slice/networkSlice';
import { workspace } from '@/hooks/UseWorkspace';

export const makeStore = () => {
  return configureStore({
    reducer: {
      authSlice: authSlice.reducer,
      networkSlice: networkSlice.reducer,
      [auth.reducerPath]: auth.reducer,
      [chat.reducerPath]: chat.reducer,
      [workspace.reducerPath]: workspace.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(
        auth.middleware,
        chat.middleware,
        workspace.middleware,
      ),
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];

setupListeners(makeStore().dispatch);

export default makeStore;
