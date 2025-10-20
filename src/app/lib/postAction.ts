"use server";
import { redirect } from "next/navigation";
export async function postAction(formData: FormData) {
  const name = (formData.get("name") ?? "").toString().trim();
  if (!name) {
    redirect("/?error=NAME_REQUIRED");
  }
  redirect(`/result?name=${encodeURIComponent(name)}`);
}
