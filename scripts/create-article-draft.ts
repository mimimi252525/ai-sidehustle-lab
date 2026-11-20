import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

type Idea = {
  id: string;
  topic: string;
  category: string;
  audience: string;
  intent: string;
  keyword: string;
  priority: number;
  status: 'pending' | 'drafted' | 'published' | 'retired';
  disclosure: '不要' | '要確認' | '必要';
  outline: string[];
};

const ideasFile = new URL('../data/article-ideas.json', import.meta.url);
const guidesFile = new URL('../src/data/guides.json', import.meta.url);
const draftDirectory = new URL('../editorial/drafts/', import.meta.url);
const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function renderDraft(idea: Idea) {
  const title = `${idea.topic}｜初心者向けの実践ガイド`;
  return `# 編集用下書き：${idea.topic}

ルールベースの構成案です。編集者が調査し、本文を執筆してください。

- 候補ID：${idea.id}
- カテゴリ：${idea.category}
- 想定読者：${idea.audience}
- 検索意図：${idea.intent}
- 狙うキーワード：${idea.keyword}
- 広告・PR表記：${idea.disclosure}（編集時に最終判定）

## タイトル案

${title}

## SEO説明文案

${idea.topic}を初心者向けに解説します。${idea.outline.join('、')}ための手順を紹介します。

## 導入文案

${idea.audience}に向けて、${idea.topic}を手順に沿って解説します。まず「${idea.outline[0]}」から始め、仕事で試せる具体例を見ていきましょう。

## 見出し構成と執筆指示

${idea.outline.map((heading, index) =>
  `### ${index + 1}. ${heading}\n\n${[
    '取りかかる前にそろえる情報と判断基準を説明する。初心者が迷う点を具体例で補う。',
    '実際に試した操作や手順を順に記す。使うツールの条件と出典を確認し、読者が再現できる例を入れる。',
    '成果物や判断の見直し方を説明する。読者が次に取れる行動を一つ提示する。',
  ][index]}`,
).join('\n\n')}

## 事実確認チェックリスト

- [ ] 料金・無料枠・商用利用条件・アフィリエイト条件は要確認。公式ページ、対象プラン・地域、確認日を記録する。
- [ ] ツールの機能や操作手順を公式情報と実際の操作で照合する。収益実績や数字は出典・根拠を確認する。
- [ ] 広告・提携の有無を確認し、該当箇所に「PR」または「広告」と表示する。
- [ ] 引用・画像・事例の利用許可と個人情報を確認する。
- [ ] [記事公開前チェックリスト](../publish-checklist.md)を完了する。
`;
}

function main() {
  const ideas: Idea[] = JSON.parse(readFileSync(ideasFile, 'utf8'));
  const guides: { id: string }[] = JSON.parse(readFileSync(guidesFile, 'utf8'));
  const ids = ideas.map(idea => idea.id);
  if (ids.some(id => typeof id !== 'string' || !idPattern.test(id)) || new Set(ids).size !== ids.length) {
    throw new Error('候補IDは重複のない小文字のスラッグにしてください。');
  }
  for (const idea of ideas) {
    if (!['pending', 'drafted', 'published', 'retired'].includes(idea.status) ||
        !['不要', '必要', '要確認'].includes(idea.disclosure) ||
        !Number.isInteger(idea.priority) ||
        !Array.isArray(idea.outline) || idea.outline.length !== 3 ||
        ![idea.topic, idea.category, idea.audience, idea.intent, idea.keyword, ...idea.outline]
          .every(value => typeof value === 'string' && value.trim())) {
      throw new Error(`候補 ${idea.id} の項目、状態、優先度、PR判定、または見出し3件を確認してください。`);
    }
  }

  const unavailable = new Set([
    ...guides.map(guide => guide.id),
    ...(process.env.RESERVED_ARTICLE_IDS ?? '').split(/\s+/).filter(Boolean),
  ]);
  const idea = ideas
    .filter(({ id, status }) =>
      status === 'pending' && !unavailable.has(id) && !existsSync(new URL(`${id}.md`, draftDirectory)))
    .sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id, 'en'))[0];
  if (!idea) {
    console.log('未処理の候補はありません。');
    return;
  }

  mkdirSync(draftDirectory, { recursive: true });
  const path = new URL(`${idea.id}.md`, draftDirectory);
  writeFileSync(path, renderDraft(idea), { flag: 'wx' });
  idea.status = 'drafted';
  writeFileSync(ideasFile, JSON.stringify(ideas, null, 2) + '\n');

  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `id=${idea.id}\n`);
  }
  console.log(`編集用下書きを作成しました: ${fileURLToPath(path)}`);
}

try {
  main();
} catch (error) {
  console.error('記事下書きの作成に失敗しました。', error);
  process.exitCode = 1;
}
