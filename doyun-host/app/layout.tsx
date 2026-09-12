import "./globals.css";

export const metadata = {
    title: "Doyun Host",
    description:
        "Doyungo personal web hosting"
};

export default function RootLayout({
    children
}: {
    children: React.ReactNode;
}) {

    return (

        <html lang="ko">

            <body>

                {children}

            </body>

        </html>

    );

}