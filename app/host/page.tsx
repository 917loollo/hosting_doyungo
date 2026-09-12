"use client";

import {
    useEffect,
    useState
} from "react";


type Site = {
    slug: string;
    url: string;
};


export default function HostPage() {

    const [
        loggedIn,
        setLoggedIn
    ] = useState(false);


    const [
        password,
        setPassword
    ] = useState("");


    const [
        slug,
        setSlug
    ] = useState("");


    const [
        title,
        setTitle
    ] = useState("");


    const [
        html,
        setHtml
    ] = useState(
`<!DOCTYPE html>

<html lang="ko">

<head>

<meta charset="UTF-8">

<meta
name="viewport"
content="width=device-width,initial-scale=1"
>

<title>내 사이트</title>

</head>

<body>

<h1>
안녕하세요 👋
</h1>

<p>
Doyun Host입니다.
</p>

</body>

</html>`
    );


    const [
        sites,
        setSites
    ] = useState<Site[]>([]);


    const [
        editing,
        setEditing
    ] = useState<string | null>(
        null
    );


    const [
        status,
        setStatus
    ] = useState("");


    const [
        preview,
        setPreview
    ] = useState(false);


    useEffect(() => {

        const saved =
            sessionStorage.getItem(
                "doyun_host_login"
            );

        if (saved === "yes") {

            setLoggedIn(true);

            loadSites();

        }

    }, []);


    async function login() {

        const response =
            await fetch(
                "/api/auth",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            password
                        })
                }
            );


        if (!response.ok) {

            setStatus(
                "비밀번호가 올바르지 않습니다."
            );

            return;

        }


        sessionStorage.setItem(
            "doyun_host_login",
            "yes"
        );


        setLoggedIn(true);

        setPassword("");

        setStatus("");

        loadSites();

    }


    async function logout() {

        await fetch(
            "/api/auth/logout",
            {
                method: "POST"
            }
        );


        sessionStorage.removeItem(
            "doyun_host_login"
        );


        setLoggedIn(false);

    }


    async function loadSites() {

        const response =
            await fetch(
                "/api/sites"
            );


        if (!response.ok) {

            return;

        }


        const data =
            await response.json();


        setSites(
            data.sites || []
        );

    }


    async function publish() {

        const cleanSlug =
            slug
                .trim()
                .toLowerCase();


        if (
            !/^[a-z0-9_-]{1,40}$/
                .test(cleanSlug)
        ) {

            setStatus(
                "사이트 주소를 확인해주세요."
            );

            return;

        }


        setStatus(
            "저장 중..."
        );


        const response =
            await fetch(
                "/api/sites",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            slug:
                                cleanSlug,

                            html
                        })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            setStatus(
                data.error ||
                "저장 실패"
            );

            return;

        }


        setStatus(
            editing
                ? "사이트가 수정되었습니다."
                : "사이트가 공개되었습니다."
        );


        setEditing(null);

        setPreview(false);

        loadSites();

    }


    async function deleteSite(
        target: string
    ) {

        const ok =
            confirm(
                `/${target} 사이트를 삭제할까요?`
            );


        if (!ok) return;


        const response =
            await fetch(
                `/api/sites/${target}`,
                {
                    method: "DELETE"
                }
            );


        if (response.ok) {

            setStatus(
                "사이트가 삭제되었습니다."
            );

            loadSites();

        }

    }


    function editSite(
        site: Site
    ) {

        setSlug(
            site.slug
        );

        setEditing(
            site.slug
        );

        setStatus(
            "HTML을 수정한 뒤 저장하세요."
        );

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }


    function copyUrl(
        target: string
    ) {

        const url =
            `${window.location.origin}/${target}`;


        navigator.clipboard.writeText(
            url
        );


        setStatus(
            "주소가 복사되었습니다."
        );

    }


    function loadSample() {

        setSlug(
            "hello"
        );

        setHtml(
`<!DOCTYPE html>

<html lang="ko">

<head>

<meta charset="UTF-8">

<meta
name="viewport"
content="width=device-width,initial-scale=1"
>

<title>Hello</title>

<style>

body {

    margin: 0;

    min-height: 100vh;

    display: flex;

    align-items: center;

    justify-content: center;

    font-family: system-ui;

    background:
        linear-gradient(
            135deg,
            #e5f3ff,
            #f0e7ff
        );

}

.card {

    padding: 50px;

    border-radius: 30px;

    background:
        rgba(255,255,255,.7);

    backdrop-filter:
        blur(25px);

    text-align: center;

}

h1 {

    font-size: 50px;

}

</style>

</head>

<body>

<div class="card">

<h1>
안녕하세요 👋
</h1>

<p>
Doyun Host 테스트 페이지입니다.
</p>

</div>

</body>

</html>`
        );

    }


    if (!loggedIn) {

        return (

            <main className="center">

                <section className="glass">

                    <div className="logo-small">
                        DOYUNGO
                    </div>

                    <h1>
                        Host
                    </h1>

                    <p>
                        관리자 로그인
                    </p>


                    <input
                        className="input"
                        type="password"
                        placeholder="관리자 비밀번호"
                        value={password}
                        onChange={
                            e =>
                                setPassword(
                                    e.target.value
                                )
                        }
                    />


                    <br />
                    <br />


                    <button
                        className="primary"
                        onClick={login}
                    >
                        로그인
                    </button>


                    {status && (

                        <div className="status">
                            {status}
                        </div>

                    )}

                </section>

            </main>

        );

    }


    return (

        <main className="host">

            <header className="topbar">

                <div className="topbar-left">

                    <div className="topbar-logo">
                        Doyun Host
                    </div>

                    <div className="badge">
                        iOS 27 Edition
                    </div>

                </div>


                <button
                    className="secondary"
                    onClick={logout}
                >
                    로그아웃
                </button>

            </header>


            <section className="hero">

                <h1>
                    {editing
                        ? "Edit."
                        : "Publish."}
                </h1>

                <p>
                    doyungo.com/원하는이름
                </p>

            </section>


            <section className="panel">

                <label>
                    사이트 주소
                </label>


                <div className="address">

                    <div className="domain">
                        doyungo.com/
                    </div>

                    <input
                        className="input"
                        value={slug}
                        onChange={
                            e =>
                                setSlug(
                                    e.target.value
                                )
                        }
                        placeholder="원하는이름"
                    />

                </div>


                <label>
                    HTML 코드
                </label>


                <textarea
                    className="code"
                    value={html}
                    onChange={
                        e =>
                            setHtml(
                                e.target.value
                            )
                    }
                    spellCheck={false}
                />


                <div className="actions">

                    <button
                        className="primary"
                        onClick={publish}
                    >
                        {editing
                            ? "수정 저장"
                            : "사이트 공개"}
                    </button>


                    <button
                        className="secondary"
                        onClick={
                            loadSample
                        }
                    >
                        샘플
                    </button>


                    <button
                        className="secondary"
                        onClick={
                            () =>
                                setPreview(
                                    !preview
                                )
                        }
                    >
                        {preview
                            ? "미리보기 닫기"
                            : "미리보기"}
                    </button>


                    {editing && (

                        <button
                            className="secondary"
                            onClick={() => {

                                setEditing(
                                    null
                                );

                                setSlug("");

                            }}
                        >
                            취소
                        </button>

                    )}

                </div>


                {status && (

                    <div className="status">
                        {status}
                    </div>

                )}

            </section>


            {preview && (

                <section className="panel">

                    <div className="list-header">

                        <h2>
                            미리보기
                        </h2>

                    </div>


                    <iframe
                        className="preview"
                        srcDoc={html}
                        title="사이트 미리보기"
                    />

                </section>

            )}


            <section className="panel">

                <div className="list-header">

                    <h2>
                        내 사이트
                    </h2>

                    <button
                        className="secondary"
                        onClick={
                            loadSites
                        }
                    >
                        새로고침
                    </button>

                </div>


                {sites.length === 0 ? (

                    <div className="empty">
                        아직 만든 사이트가 없습니다.
                    </div>

                ) : (

                    sites.map(
                        site => (

                            <div
                                className="site"
                                key={
                                    site.slug
                                }
                            >

                                <div
                                    className="site-info"
                                >

                                    <strong>
                                        /{site.slug}
                                    </strong>

                                    <a
                                        className="site-url"
                                        href={
                                            `/${site.slug}`
                                        }
                                        target="_blank"
                                    >
                                        doyungo.com/
                                        {site.slug}
                                    </a>

                                </div>


                                <div
                                    className="site-actions"
                                >

                                    <button
                                        className="secondary"
                                        onClick={() =>
                                            copyUrl(
                                                site.slug
                                            )
                                        }
                                    >
                                        주소 복사
                                    </button>


                                    <button
                                        className="secondary"
                                        onClick={() =>
                                            editSite(
                                                site
                                            )
                                        }
                                    >
                                        수정
                                    </button>


                                    <button
                                        className="delete"
                                        onClick={() =>
                                            deleteSite(
                                                site.slug
                                            )
                                        }
                                    >
                                        삭제
                                    </button>

                                </div>

                            </div>

                        )
                    )

                )}

            </section>

        </main>

    );

}