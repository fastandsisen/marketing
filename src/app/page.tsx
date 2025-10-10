"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";

//設定で使用したAliasを使っています。../components/headerと同じです。
import Header from "@/app/component/header";
import Main from "@/app/component/main";
import Footer from "@/app/component/footer";

export default function PostPage() {
  const router = useRouter();
  return (
    <>
      <Header />
      <Main />
      <Footer />
    </>
  );
}
