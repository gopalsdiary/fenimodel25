upstash code > cache-user 

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Redis } from "https://deno.land/x/upstash_redis/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Redis কানেকশন
const redis = new Redis({
  url: Deno.env.get("https://merry-grubworm-11202.upstash.io")!,
  token: Deno.env.get("ASvCAAIncDI3YTVjODU4NjgzOGQ0OTcxYmJiNDcyYTFiZjE0MTQ4MXAyMTEyMDI")!,  
});

// Supabase কানেকশন
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  const { user_id } = await req.json();

  // আগে Redis cache চেক করি
  const cached = await redis.get(`profile:${user_id}`);
  if (cached) {
    return new Response(JSON.stringify({ source: "cache", data: cached }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // Supabase DB থেকে নাও
const { data, error } = await supabase
  .from("student_database")   // এখানে টেবিল নাম পরিবর্তন করো
  .select("*")
  .eq("id", user_id)          // ধরে নিচ্ছি টেবিলে "id" কলাম আছে
  .single();

  if (error) {
    return new Response(JSON.stringify(error), { status: 500 });
  }

  // Redis এ cache করে রাখো ১ মিনিটের জন্য
  await redis.set(`profile:${user_id}`, JSON.stringify(data), { ex: 3600 });

  return new Response(JSON.stringify({ source: "db", data }), {
    headers: { "Content-Type": "application/json" },
  });
});
