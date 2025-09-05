/**
 * CORS headers for Supabase edge functions.
 * Allows cross-origin requests.
 */
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};
