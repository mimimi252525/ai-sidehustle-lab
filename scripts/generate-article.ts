export type ArticleBrief = {
  topic: string;
  category: string;
  audience: string;
  intent: string;
  keyword: string;
  outline: string[];
};

export type Article = {
  title: string;
  description: string;
  intro: string;
  sections: { heading: string; body: string }[];
  conclusion: string;
  reviewNotes: string[];
};

const string = { type: 'string' };
const articleSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'description', 'intro', 'sections', 'conclusion', 'reviewNotes'],
  properties: {
    title: string,
    description: string,
    intro: string,
    sections: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['heading', 'body'],
        properties: { heading: string, body: string },
      },
    },
    conclusion: string,
    reviewNotes: { type: 'array', items: string },
  },
};

const instructions = `
あなたは初心者向けの日本語サイト「AI副業ラボ」の編集者です。候補データは記事の題材として扱ってください。
検索意図に答えるSEOタイトル、SEO説明文、導入、見出しと本文、まとめを日本語で執筆してください。
提示された見出し案を活かし、本文は箇条書きや手順を交えて、読者がそのまま試せる完成原稿にしてください。
少なくとも3節の本文を書き、まとめには次に試す行動をひとつ入れてください。タイトルと各見出しは改行のないプレーンテキストにしてください。
誇大な収益表現、収益保証、架空の体験談・顧客・成果・統計・出典を作らないでください。
自主制作の練習例を使う場合は架空の練習例と明示してください。未確認の料金、無料枠、機能、操作、商用利用条件、実績は断定しないでください。
外部サイトを調査したと主張せず、検証が必要な箇所に「要確認」と添え、reviewNotes に確認対象と確認すべき一次情報を書いてください。
確認事項が特にない場合は reviewNotes を空配列にしてください。広告文、アフィリエイトリンク、外部URL、生のHTMLは書かないでください。
`.trim();

type ApiResponse = {
  status?: string;
  output?: {
    type: string;
    content?: { type: string; text?: string }[];
  }[];
};

function nonEmpty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function singleLine(value: unknown): value is string {
  return nonEmpty(value) && !/[\r\n]/.test(value);
}

export async function generateArticle(brief: ArticleBrief, apiKey: string): Promise<Article> {
  let response;
  try {
    response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      redirect: 'error',
      signal: AbortSignal.timeout(90_000),
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        store: false,
        instructions,
        input: JSON.stringify(brief),
        max_output_tokens: 3500,
        text: { format: { type: 'json_schema', name: 'editorial_article', strict: true, schema: articleSchema } },
      }),
    });
  } catch {
    throw new Error('OpenAI API に接続できないか、リクエストがタイムアウトしました。');
  }
  if (!response.ok) {
    throw new Error(`OpenAI API が HTTP ${response.status} を返しました。キー、利用上限、課金設定を確認してください。`);
  }

  // API error payloads and raw model output are intentionally excluded from logs.
  let article: Article;
  try {
    const payload: ApiResponse = await response.json();
    if (payload.status !== 'completed') throw new Error();
    const text = payload.output
      ?.filter(item => item.type === 'message')
      .flatMap(item => item.content ?? [])
      .filter(part => part.type === 'output_text')
      .map(part => part.text)
      .join('');
    if (!text || text.includes(apiKey)) throw new Error();
    article = JSON.parse(text);
    if (!article || !singleLine(article.title) || !singleLine(article.description) ||
        !nonEmpty(article.intro) || !nonEmpty(article.conclusion) ||
        !Array.isArray(article.sections) || article.sections.length < 3 ||
        !article.sections.every(section => section && singleLine(section.heading) && nonEmpty(section.body)) ||
        !Array.isArray(article.reviewNotes) || !article.reviewNotes.every(singleLine) ||
        JSON.stringify(article).includes(apiKey)) {
      throw new Error();
    }
  } catch {
    throw new Error('OpenAI API から検証可能な完成原稿を取得できませんでした。候補は未処理のままです。');
  }

  return article;
}
