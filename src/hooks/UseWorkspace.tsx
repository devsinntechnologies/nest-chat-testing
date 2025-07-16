import { BASE_URL_SOCKET } from "@/lib/constants";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const workspace = createApi({
  reducerPath: "workspace",
  baseQuery: fetchBaseQuery({
    baseUrl: `${BASE_URL_SOCKET}/workspace`,
    prepareHeaders: (headers) => {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("token");
        if (token) headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    getPublicWorkspaces: builder.query({
      query: ({ pageNo, pageSize }) => `/public?pageNo=${pageNo}&pageSize=${pageSize}`,
    }),
    getPrivateWorkspaces: builder.query({
      query: ({ pageNo, pageSize }) => `/private/userWorkspaces?pageNo=${pageNo}&pageSize=${pageSize}`,
    }),
    fetchWorkspaceChat: builder.query({
      query: ({ id, pageNo, pageSize }) => `/chats/${id}?pageNo=${pageNo}&pageSize=${pageSize}`,
    }),
    getAllMembers: builder.query({
      query: ({ id, pageNo, pageSize }) => `/members/${id}?pageNo=${pageNo}&pageSize=${pageSize}`,
    }),
    joinWorkspace: builder.mutation({
      query: (formData) => ({
        url: `/addUser`,
        method: "POST",
        body: formData,
      }),
    }),
    createPrivateWorkspace: builder.mutation({
      query: (data) => ({
        url: `/private/createWorkspace`,
        method: "POST",
        body: data,
      }),
    }),
    createPublicWorkspace: builder.mutation({
      query: (data) => ({
        url: `/public/createWorkspace`,
        method: "POST",
        body: data,
      }),
    }),
    updateWorkspace: builder.mutation({
      query: (data) => ({
        url: `/${data.id}`,
        method: "PATCH",
        body: data,
      }),
    }),
    updateWorkspacePicture: builder.mutation({
      query: ({id, formData}) => ({
        url: `/updateWorkspacePicture/${id}`,
        method: "POST",
        body: formData,
      }),
    }),
   updateMembertype: builder.mutation({
  query: ({ id, type }) => ({
    url: `/updateMembertype/${id}`,
    method: "PATCH",
    body: { type }, // send updated type in body
  }),
}),

    deleteMemberById: builder.mutation({
      query: (id) => ({
        url: `/member/${id}`,
        method: "DELETE",
      }),
    }),
  }),
});

export const {
  useGetPublicWorkspacesQuery,
  useGetPrivateWorkspacesQuery,
  useJoinWorkspaceMutation,
  useCreatePrivateWorkspaceMutation,
  useCreatePublicWorkspaceMutation,
  useFetchWorkspaceChatQuery,
  useGetAllMembersQuery,
  useUpdateWorkspaceMutation,
  useUpdateWorkspacePictureMutation,
  useDeleteMemberByIdMutation,
  useUpdateMembertypeMutation
} = workspace;
