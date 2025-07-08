"use client";

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
// import { getSocket } from "@/lib/socket";
import { BASE_URL_SOCKET } from "@/lib/constants";

export const chat = createApi({
  reducerPath: "chat",
  baseQuery: fetchBaseQuery({
    // baseUrl: `http://localhost:5000/chat/`,
    baseUrl: `${BASE_URL_SOCKET}/chat/`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    fetchChats: builder.query({
      query: () => `/chat_rooms/`,
    }),

    fetchChatRoom: builder.query({
      query: ({ id, pageNo, pageSize }) => {
        const queryString = new URLSearchParams({
          pageNo,
          pageSize,
        }).toString();
    
        return `chat_room/${id}?${queryString}`;
      },
    }),

    sendMessage: builder.mutation({
      query: (messageData) => ({
        url: "/send_message",
        method: "POST",
        body: messageData,
      }),
    }),
  }),
});

export const {
  useFetchChatsQuery,
  useFetchChatRoomQuery,
  useSendMessageMutation,
} = chat;
