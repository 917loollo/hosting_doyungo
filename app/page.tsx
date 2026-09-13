import Link from "next/link";

export default function Home() {
  return (
    <main className="center">
      <section className="glass">
        <div className="logo-small">DOYUNGO HOST</div>
        <h1>나만의 웹사이트</h1>
        <p>HTML 코드를 입력하고 원하는 주소로 바로 만들어보세요.</p>
        <Link href="/host" className="primary" style={{ display: "inline-block", marginTop: 15 }}>
          호스팅 관리
        </Link>
      </section>
    </main>
  );
}