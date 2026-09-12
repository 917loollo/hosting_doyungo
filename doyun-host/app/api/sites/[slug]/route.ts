import { del } from "@vercel/blob";

import { cookies } from "next/headers";


export async function DELETE(
    request: Request,
    context: {
        params: Promise<{
            slug: string
        }>
    }
) {

    const store =
        await cookies();


    const authenticated =
        store.get(
            "doyun_host_admin"
        )?.value ===
        "authenticated";


    if (!authenticated) {

        return Response.json(
            {
                error:
                    "로그인이 필요합니다."
            },
            {
                status: 401
            }
        );

    }


    const {
        slug
    } =
        await context.params;


    if (
        !/^[a-z0-9_-]{1,40}$/
            .test(slug)
    ) {

        return Response.json(
            {
                error:
                    "잘못된 주소입니다."
            },
            {
                status: 400
            }
        );

    }


    try {

        await del(
            `sites/${slug}.html`
        );


        return Response.json({
            success:
                true
        });

    }

    catch {

        return Response.json(
            {
                error:
                    "삭제에 실패했습니다."
            },
            {
                status: 500
            }
        );

    }

}