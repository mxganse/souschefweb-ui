import DashboardClient from "./dashboard-client";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = {
  title: "SousChefWeb · Dashboard",
  description: "Search and open archived culinary recipes.",
};

export default async function Home() {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("recipes")
    .select("id,title,category,created_at")
    .order("created_at", { ascending: false })
    .limit(30);

  return <DashboardClient initialRecipes={error ? [] : data ?? []} />;
}
