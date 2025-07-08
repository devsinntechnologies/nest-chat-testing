import { BASE_URL } from "@/lib/constants";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";


export const auth = createApi({
  reducerPath: "auth",
  baseQuery: fetchBaseQuery({
    baseUrl: `${BASE_URL}/auth/`,
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
        url: "register",
        method: "POST",
        body: signupData,
      }),
    }),
    forgotPassword: builder.mutation({
      query: (forgotPasswordData) => ({
        url: "forgot-password",
        method: "POST",
        body: forgotPasswordData,
      }),
    }),
    checkOtp: builder.mutation({
      query: (otpData) => ({
        url: "/checkOtp",
        method: "POST",
        body: otpData,
      }),
    }),
    verifyEmail: builder.mutation({
      query: (otpData) => ({
        url: "/verify-email",
        method: "POST",
        body: otpData,
      }),
    }),
    resendVerificationEmail: builder.mutation({
      query: (email) => ({
        url: "/resend-verification-email",
        method: "POST",
        body: email,
      }),
    }),
    resetPassword: builder.mutation({
      query: (resetPasswordData) => ({
        url: "reset-password",
        method: "POST",
        body: resetPasswordData,
      }),
    }),
    getUserProfile: builder.query({
      query: () => `get-user-profile`,
    }),
    getAllUsers: builder.query({
      query: () => `getAllUsers`,
    }),
    updateProfile: builder.mutation({
      query: (updateData) => ({
        url: "update-profile",
        method: "POST",
        body: updateData,
      }),
    }),

    getUserAddress: builder.query({
      query: () => `getUserAddress`,
    }),

    addUserAddress: builder.mutation({
      query: (addressData) => ({
        url: "addUserAddress",
        method: "POST",
        body: addressData,
      }),
    }),
    updateUserAddress: builder.mutation({
      query: ({ id, address, phoneNo }) => ({
        url: `/updateAddressById/${id}`,
        method: "PATCH",
        body: { address, phoneNo },
      }),
    }),

    changePassword: builder.mutation({
      query: (passwordData) => ({
        url: `change-password`,
        method: "POST",
        body: passwordData,
      }),
    }),
    updateProfileImage: builder.mutation({
      query: (formData) => ({
        url: "/update-profile-image",
        method: "POST",
        body: formData,
      }),
    }),
    deleteAddressById: builder.mutation({
      query: (id) => ({
        url: `deleteAddressById/${id}`,
        method: "DELETE",
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useSignupMutation,
  useForgotPasswordMutation,
  useCheckOtpMutation,
  useVerifyEmailMutation,
  useResendVerificationEmailMutation,
  useResetPasswordMutation,
  useGetUserProfileQuery,
  useUpdateProfileMutation,
  useAddUserAddressMutation,
  useChangePasswordMutation,
  useDeleteAddressByIdMutation,
  useUpdateProfileImageMutation ,
  useUpdateUserAddressMutation,
  useGetUserAddressQuery,
  useGetAllUsersQuery
} = auth;
