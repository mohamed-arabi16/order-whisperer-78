import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

/**
 * A Supabase edge function for creating a new tenant.
 * This function handles the creation of a new user, their profile, and the tenant itself.
 * It is triggered by a POST request with the tenant's information in the request body.
 */
serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === "OPTIONS") {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const {
      restaurantName,
      ownerName,
      ownerEmail,
      password,
      subscriptionPlan,
      phoneNumber,
      address
    } = await req.json()

    // Create user account for restaurant owner
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: ownerEmail,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: ownerName,
        role: 'restaurant_owner'
      }
    })

    if (authError) throw authError;

    // The handle_new_user trigger will create the profile automatically.
    // We need to wait a bit for the trigger to fire and then retrieve the profile.
    // A better solution would be to use a database function that returns the profile id,
    // but for now, a small delay should work for this demo.
    await new Promise(resolve => setTimeout(resolve, 500));

    // Get the created profile
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('user_id', authData.user.id)
      .single();

    if (profileError) {
      console.error('Profile retrieval error:', profileError);
      throw new Error(`Could not find profile for user ${authData.user.id}.`);
    }
    if (!profileData) {
      throw new Error(`Profile not found for user ${authData.user.id}. The trigger might not have run.`);
    }

    // Generate slug from restaurant name - handle Arabic text properly
    let slug = restaurantName
      .toLowerCase()
      .replace(/\s+/g, '-'); // Replace spaces with hyphens
    
    // If the name is Arabic, generate a UUID-based slug instead
    if (!/^[a-z0-9\-]+$/.test(slug)) {
      const uniqueId = Date.now().toString(36);
      slug = `restaurant-${uniqueId}`;
    }

    // Create tenant
    const { data: tenantData, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .insert({
        name: restaurantName,
        slug: slug,
        owner_id: profileData.id,
        subscription_plan: subscriptionPlan,
        phone_number: phoneNumber,
        address: address
      })
      .select()
      .single();

    if (tenantError) throw tenantError;

    return new Response(JSON.stringify({ tenant: tenantData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
