import Header from "@/app/components/header";
import Footer from "@/app/components/footer";
import { postAction } from "@/app/components/postAction";

export default function PostPage() {
  return (
    <>
      <Header />
      <form action={postAction}>
        <input type="text" name="name" />
        <button type="submit">送信</button>
      </form>
      <Footer />
    </>
  );
}
