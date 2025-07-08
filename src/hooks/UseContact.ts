import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { BASE_URL } from "@/lib/constants";
export const contactApi = createApi({
  reducerPath: "contactApi",
  baseQuery: fetchBaseQuery({baseUrl: `${BASE_URL}/contact`,}),
  endpoints: (builder) => ({
    sendContactMessage: builder.mutation({
      query: (data) => ({
        url: "/new-contact-message",
        method: "POST",
        body: data,
      }),
    }),
  }),
});

export const { useSendContactMessageMutation } = contactApi;