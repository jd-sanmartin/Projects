export type Player = {
    name: string;
    score: number;
}

export type Word = {
    word: string;
    definition: string;
}

export type PlayerDefinition = {
    playerName: string;
    definition: string;
}

export type Vote = {
    playerName: string;
    votedPlayer: string;
}

export type GamePhase = 'registration' | 'definition' | 'voting' | 'results' | 'end'
