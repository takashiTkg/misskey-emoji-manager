export interface Meta {
  emojis: EmojiEntry[];
}

export interface EmojiEntry {
  downloaded: boolean;
  fileName: string;
  emoji: Emoji;
}

export interface Emoji {
  name: string;
  category: string;
  type?: string;
  aliases: string[];
  license?: string;
}
