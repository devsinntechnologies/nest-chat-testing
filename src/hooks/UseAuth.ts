import { BASE_URL } from "@/lib/constants";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";


export const auth = createApi({
  reducerPath: "auth",
  baseQuery: fetchBaseQuery({
    baseUrl: `${BASE_URL}/user/`,
    prepareHeaders: (headers, { endpoint }) => {
      // Only add the token if the endpoint is not 'login' or 'signup'
      if (endpoint !== "login" && endpoint !== "signup") {
        const token = localStorage.getItem("token"); // Fetch token from localStorage
        if (token) {
          headers.set("Authorization", `Bearer ${token}`);
        }
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (loginData) => ({
        url: "login",
        method: "POST",
        body: loginData,
      }),
    }),
    signup: builder.mutation({
      query: (signupData) => ({
        url: "signup",
        method: "POST",
        body: signupData,
      }),
    }),
    getUserProfile: builder.query({
      query: () => `/profile`,
    }),
    getAllUsers: builder.query({
      query: () => `/`,
    }),
    updateProfile: builder.mutation({
      query: (updateData) => ({
        url: "update-profile",
        method: "POST",
        body: updateData,
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useSignupMutation,
  useGetUserProfileQuery,
  useUpdateProfileMutation,
  useGetAllUsersQuery
} = auth;
