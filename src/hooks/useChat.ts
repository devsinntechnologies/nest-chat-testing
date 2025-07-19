"use client";

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { BASE_URL_SOCKET } from "@/lib/constants";

export const chat = createApi({
  reducerPath: "chat",
  baseQuery: fetchBaseQuery({
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
      query: () => `/chatRooms/`,
    }),

    fetchChatRoom: builder.query({
      query: ({ id, pageNo, pageSize }) => {
        const queryString = new URLSearchParams({
          pageNo,
          pageSize,
        }).toString();

        return `chatRooms/${id}?${queryString}`;
      },
    }),

    sendMessage: builder.mutation({
      query: (messageData) => ({
        url: "/send_message",
        method: "POST",
        body: messageData,
      }),
    }),

    uploadMessageFile: builder.mutation({
      query: (formData) => ({
        url: `/uploadMessageFile`,
        method: "POST",
        body: formData,
      }),
    }),
  }),
});

export const {
  useFetchChatsQuery,
  useFetchChatRoomQuery,
  useSendMessageMutation,
  useUploadMessageFileMutation
} = chat;
