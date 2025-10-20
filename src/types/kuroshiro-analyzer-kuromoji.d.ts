// src/types/kuroshiro-analyzer-kuromoji.d.ts
declare module "kuroshiro-analyzer-kuromoji" {
  // オプションの型（必要なら拡張）
  export type KuromojiOptions = {
    dictPath?: string;
  };

  // デフォルトエクスポートのクラス宣言（最低限でOK）
  export default class KuromojiAnalyzer {
    constructor(options?: KuromojiOptions);
  }
}
