import { Word } from "../types";

const getRandomWord = (words: Word[]): Word => {
    return words[Math.floor(Math.random() * words.length)];
}

export { getRandomWord };
