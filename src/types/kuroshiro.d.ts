// src/types/kuroshiro.d.ts
declare module "kuroshiro" {
  export type ConvertOptions = {
    to?: "hiragana" | "katakana" | "romaji";
    mode?: "spaced" | "okurigana" | "furigana" | "normal";
    romajiSystem?: "hepburn" | "nippon" | "passport";
  };

  export default class Kuroshiro {
    constructor();
    init(analyzer: any): Promise<void>;
    convert(input: string, options?: ConvertOptions): Promise<string>;
  }
}
