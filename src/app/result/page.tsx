import Link from "next/link";

export default async function ResultPage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string }>;
}) {
  const params = await searchParams;
  const name = params.name;
  return (
    <div>
      {name}さんいらっしゃい
      <Link href="/">フォームに戻る</Link>
    </div>
  );
}
