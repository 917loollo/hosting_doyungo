import Link from "next/link";

export default function Home() {

    return (

        <main className="center">

            <section className="glass">

                <div className="logo-small">
                    DOYUNGO
                </div>

                <h1>
                    Doyun Host
                </h1>

                <p>
                    나만의 웹사이트를 만들어보세요.
                </p>

                <br />

                <Link
                    href="/host"
                    className="primary"
                    style={{
                        display: "inline-block"
                    }}
                >
                    사이트 만들기
                </Link>

            </section>

        </main>

    );

}