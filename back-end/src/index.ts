import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { GamePhase, Player, PlayerDefinition, Vote, Word } from './types';
import { shuffleArray } from './utils/shuffleArray';
import { getRandomWord } from './utils/getWord';
import cors from 'cors';

const app = express();
app.get('/', (req, res) => {
	res.send('<h1>Hello world</h1>');
});

app.use(cors({
	origin: '*'
}));

const server = http.createServer(app);
const io = new Server(server, {
	cors: {
		origin: '*',
		methods: ['GET', 'POST']
	}
});

let players: Player[] = [];
const dictionary: Word[] = [
	{
		word: 'socket',
		definition: 'A socket is one endpoint of a two-way communication link between two programs running on the network. A socket is bound to a port number so that the TCP layer can identify the application that data is destined to.'
	},
	{
		word: 'server',
		definition: 'A server is a computer program or a device that provides functionality for other programs or devices, called clients. This architecture is called the client-server model.'
	},
	{
		word: 'client',
		definition: 'A client is a piece of computer hardware or software that accesses a service made available by a server as part of the client–server model of computer networks.'
	},
	{
		word: 'router',
		definition: 'A router is a networking device that forwards data packets between computer networks. Routers perform the traffic directing functions on the Internet.'
	},
	{
		word: 'firewall',
		definition: 'A firewall is a network security system that monitors and controls incoming and outgoing network traffic based on predetermined security rules.'
	},
	{
		word: 'protocol',
		definition: 'A protocol is a set of rules that allows data exchange between devices. It defines the rules for data transmission on a network.'
	},
	{
		word: 'bandwidth',
		definition: 'Bandwidth is the maximum rate of data transfer across a network path. It is a key factor in determining the speed of an internet connection.'
	},
	{
		word: 'latency',
		definition: 'Latency is the time it takes for data to travel from its source to its destination. It is a key factor in determining the responsiveness of a network.'
	},
	{
		word: 'encryption',
		definition: 'Encryption is the process of converting data into a code to prevent unauthorized access. It is used to secure data transmitted over a network.'
	},
	{
		word: 'decryption',
		definition: 'Decryption is the process of converting encrypted data back into its original form. It is used to read encrypted data that has been received.'
	},
];

let currentWord: Word
let playerDefinitions: PlayerDefinition[] = [];

let votes: Vote[] = [];

io.on('connection', (socket) => {
	io.emit('players', players);
	changeGamePhase('registration');

	socket.on('newPlayer', (name: string) => {
		if (players.some(player => player.name === name)) io.emit('gameError', 'El nombre ya se encuentra registrado');

		players.push({ name, score: 0 });
		io.emit('players', players);
	})

	socket.on('startGame', () => {
		if (players.length < 2) {
			io.emit('gameError', 'Not enough players to start the game');
			return
		}

		currentWord = getRandomWord(dictionary);
		io.emit('newWord', currentWord.word);
		changeGamePhase('definition');
	})

	socket.on('playerDefinition', (data: PlayerDefinition) => {
		if (playerDefinitions.some(playerDefinition => playerDefinition.playerName === data.playerName)) io.emit('gameError', 'Ya has enviado una definición');
		playerDefinitions.push(data);
		io.emit('definitionSubmitted', playerDefinitions);
	})

	socket.on('startVotingPhase', () => {
		changeGamePhase('voting');
		io.emit('options', shuffleArray<PlayerDefinition>([...playerDefinitions, { playerName: 'correct', definition: currentWord.definition }]));
	})

	socket.on('vote', (data: Vote) => {
		if (votes.some(vote => vote.playerName === data.playerName)) io.emit('gameError', 'Ya has votado');
		votes.push(data);
		io.emit('votes', votes);
	})

	socket.on('endVotingPhase', () => {
		votes.forEach(vote => {
			const player = players.find(player => player.name === vote.playerName);
			if (!player) return;

			if (vote.votedPlayer === 'correct') {
				player.score += 2;
				return;
			}
			else {
				const votedPlayer = players.find(player => player.name === vote.votedPlayer);
				if (votedPlayer) votedPlayer.score += 1;
			}
		})

		playerDefinitions = [];
		votes = [];

		io.emit('players', players);
		changeGamePhase('results');
	})

	socket.on('newRound', () => {
		playerDefinitions = [];
		votes = [];
		currentWord = getRandomWord(dictionary);
		io.emit('newWord', currentWord.word);
		changeGamePhase('definition');
	});

	socket.on('endGame', () => {
		const topPlayers = players.sort((a, b) => b.score - a.score).slice(0, 3);
		io.emit('gameOver', topPlayers);
	})

	socket.on('resetGame', () => {
		console.log('resetting game');
		players = [];
		playerDefinitions = [];
		votes = [];
		io.emit('players', players);
	})


	socket.on('disconnect', () => {
		console.log('user disconnected');
	});
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});

const changeGamePhase = (newPhase: GamePhase) => {io.emit('gamePhaseChanged', newPhase); console.log('changing phase', newPhase)};