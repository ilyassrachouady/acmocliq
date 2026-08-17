import StudioApp from "@/components/studio-app";
import AuthScreen from "@/components/auth-screen";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  if (process.env.NODE_ENV !== "production" && params?.demo === "1") return <StudioApp userEmail="demo@ocliq.ca" demoMode/>;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user ? <StudioApp userEmail={user.email ?? ""}/> : <AuthScreen/>;
}
