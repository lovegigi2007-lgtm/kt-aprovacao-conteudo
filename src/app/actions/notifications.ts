"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function marcarTodasComoLidas() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("notifications")
    .update({ lida: true })
    .eq("user_id", user.id)
    .eq("lida", false);

  revalidatePath("/notificacoes");
  revalidatePath("/");
}
