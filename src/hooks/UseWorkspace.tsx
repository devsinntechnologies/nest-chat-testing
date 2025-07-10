import { BASE_URL_SOCKET } from "@/lib/constants";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const workspace = createApi({
  reducerPath: "workspace",
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL_SOCKET,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("token");
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  endpoints: (builder) => ({
    getPublicWorkspaces: builder.query({
      query: ({ pageNo, pageSize }) => `/workspace/public?pageNo=${pageNo}&pageSize=${pageSize}`,
    }),
    getPrivateWorkspaces: builder.query({
      query: ({ pageNo, pageSize }) => `/workspace/private/userWorkspaces?pageNo=${pageNo}&pageSize=${pageSize}`,
    }),
    joinPublicWorkspace: builder.mutation({
      query: (formData) => ({
        url: `/workspace/public/addUser`,
        method: "POST",
        body: formData,
      }),
    }),
    joinPrivateWorkspace: builder.mutation({
      query: (formData) => ({
        url: `/workspace/private/addUser`,
        method: "POST",
        body: formData,
      }),
    }),
    createPrivateWorkspace: builder.mutation({
      query: (data) => ({
        url: `/workspace/private/createWorkspace`,
        method: "POST",
        body: data,
      }),
    }),

    createPublicWorkspace: builder.mutation({
      query: (data) => ({
        url: `/workspace/public/createWorkspace`,
        method: "POST",
        body: data,
      }),
    }),
  }),
});

export const {
  useGetPublicWorkspacesQuery,
  useGetPrivateWorkspacesQuery,
  useJoinPublicWorkspaceMutation,
  useJoinPrivateWorkspaceMutation,
  useCreatePrivateWorkspaceMutation,
  useCreatePublicWorkspaceMutation
} = workspace;
