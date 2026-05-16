import { NextResponse } from "next/server";

function extractPostId(url: string): string | null {
  const match = url.match(
    /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:p|tv|reel)\/([^/?#&]+)/,
  );
  return match ? match[1] : null;
}

export async function POST(request: Request) {
  try {
    const { postUrl } = await request.json();
    const shortcode = extractPostId(postUrl);

    if (!shortcode) {
      return NextResponse.json({ error: "URL inválida." }, { status: 400 });
    }

    console.log("1️⃣ Buscando ID Numérico do post:", shortcode);

    const infoResponse = await fetch(
      `https://${process.env.RAPIDAPI_HOST}/instagram/media/get_info_by_shortcode`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-RapidAPI-Key": process.env.RAPIDAPI_KEY || "",
          "X-RapidAPI-Host": process.env.RAPIDAPI_HOST || "",
        },
        body: JSON.stringify({ shortcode: shortcode }),
      },
    );

    const infoData = await infoResponse.json();
    const item =
      infoData.response?.body?.items?.[0] || infoData.data?.items?.[0];
    const numericId = item?.pk || (item?.id ? item.id.split("_")[0] : null);

    if (!numericId) {
      const detalheDoErro = JSON.stringify(infoData).substring(0, 200);
      return NextResponse.json(
        { error: `A RapidAPI bloqueou: ${detalheDoErro}` },
        { status: 400 },
      );
    }

    console.log("✅ ID Numérico:", numericId);
    console.log("2️⃣ Forçando a paginação ignorando booleanos da API...");

    let allRawComments: any[] = [];
    let hasMore = true;
    let nextCursor: string | null = null;
    let loopCount = 0;

    // Limite de segurança de 15 páginas
    while (hasMore && loopCount < 15) {
      loopCount++;

      const requestBody: any = {
        id: numericId,
        can_support_threading: true,
      };

      if (nextCursor) {
        requestBody.min_id = nextCursor;
      }

      const commentsResponse = await fetch(
        `https://${process.env.RAPIDAPI_HOST}/instagram/media/get_comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-RapidAPI-Key": process.env.RAPIDAPI_KEY || "",
            "X-RapidAPI-Host": process.env.RAPIDAPI_HOST || "",
          },
          body: JSON.stringify(requestBody),
        },
      );

      const commentsData = await commentsResponse.json();
      const commentsBody =
        commentsData.response?.body || commentsData.data || commentsData;

      const rawComments = commentsBody?.comments || commentsBody?.items || [];
      allRawComments = [...allRawComments, ...rawComments];

      nextCursor = commentsBody?.next_min_id || null;

      if (nextCursor) {
        hasMore = true;
        console.log(
          `Página ${loopCount} carregada. Avançando com o token gerado!`,
        );
      } else {
        hasMore = false;
        console.log(
          `Página ${loopCount} carregada. Nenhum token encontrado. Fim da lista!`,
        );
      }
    }

    const formattedComments = allRawComments.map((c: any, index: number) => ({
      id: c.pk || c.id || `c-${index}`,
      username: c.user?.username || c.username || "participante",
      text: c.text || "Participando! 🏆",
      avatar: c.user?.profile_pic_url || c.profile_pic_url || "",
    }));

    console.log(
      `SUCESSO! ${formattedComments.length} comentários capturados no total.`,
    );
    return NextResponse.json({ comments: formattedComments });
  } catch (error: any) {
    console.error("Erro:", error.message);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
