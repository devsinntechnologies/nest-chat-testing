// app/Provider.tsx (or app/AppProvider.tsx)
"use client";

import { ReactNode, useRef } from "react";
import { Provider } from "react-redux";
import { Store } from "redux";
import { makeStore } from "../store/store";

interface StoreProviderProps {
  children: ReactNode;
}

export default function StoreProvider({ children }: StoreProviderProps) {const storeRef = useRef<Store | undefined>(undefined);

  if (!storeRef.current) {
    storeRef.current = makeStore();
  }

  return (
    <Provider store={storeRef.current}>
      {children}
    </Provider>
  );
}
