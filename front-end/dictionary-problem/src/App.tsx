import { useEffect, useState } from 'react'
import './App.css'
import { io } from 'socket.io-client'
import { GamePhase, Player, PlayerDefinition, Vote } from './types'
import ErrorBoundary from './ErrorBoundary'

const socket = io('http://localhost:3000')

function App() {
  const [error, setError] = useState<string>('')
  const [currentPlayerName, setCurrentPlayerName] = useState<string>('')
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [currentWord, setCurrentWord] = useState<string>('')

  const [playerDefinitions, setPlayerDefinitions] = useState<PlayerDefinition[]>([])
  const [playerDefinition, setPlayerDefinition] = useState<string>('')

  const [playerVotes, setPlayerVotes] = useState<Vote[]>([])

  const [gamePhase, setGamePhase] = useState<GamePhase>('registration')

  const [options, setOptions] = useState<PlayerDefinition[]>([])

  const [topPlayers, setTopPlayers] = useState<Player[]>([])

  useEffect(() => {
    socket.on('players', (data: Player[]) => setPlayers(data));
    socket.on('gamePhaseChanged', (data: GamePhase) => setGamePhase(data));
    socket.on('newWord', (data: string) => {
      setCurrentWord(data);
      setPlayerDefinition('');
      setPlayerDefinitions([]);
      setOptions([]);
      setPlayerVotes([]);
    });
    socket.on('gameError', (data: string) => setError(data));
    socket.on('definitionSubmitted', (data: PlayerDefinition[]) => setPlayerDefinitions(data));
    socket.on('options', (data: PlayerDefinition[]) => setOptions(data));
    socket.on('votes', (data: Vote[]) => setPlayerVotes(data));
    socket.on('gameOver', (data: Player[]) => setTopPlayers(data));

    return () => {
      socket.off('message');
    };
  }, []);

  useEffect(() => {
    if (currentPlayerName !== '' && players.length !== 0) {
      const player = players.find(player => player.name === currentPlayerName)
      setCurrentPlayer(player || null)
    }
  }, [currentPlayerName, players]);

  return (
    <ErrorBoundary>
      <h1>Problema del diccionario</h1>
      <p>current player name: {currentPlayerName}</p>
      {
        currentPlayer ? (
          <div>
            <h2 style={{ color: 'green' }}>Fase actual {gamePhase}</h2>
            <p>Estás jugando como {currentPlayer.name}</p>
            <p>Puntaje: {currentPlayer.score}</p>
          </div>
        ) : null
      }
      <p style={{ color: 'red' }}>{error}</p>
      <button onClick={() => {
            socket.emit('resetGame')
            setCurrentPlayerName('')
            setCurrentPlayer(null)
          }}>Reiniciar</button>
      <p>Jugadores</p>
      <ul>
        {players.map((player) => (
          <li key={player.name}>Nombre: {player.name} / Puntaje: {player.score}</li>
        ))}
      </ul>

      <div className="container">
        <div className='section'>
          <h3>Fase de registro</h3>
          <input type="text" id="name" placeholder="Nombre" disabled={!!currentPlayerName} />
          <button onClick={() => {
            const name = (document.getElementById('name') as HTMLInputElement).value
            socket.emit('newPlayer', name)
            setCurrentPlayerName(name)
          }}>Unirse</button>

          <button onClick={() => {
            socket.emit('startGame')
          }}>Iniciar Juego</button>
        </div>

        <div className='section'>
          Palabra actual: {currentWord}
          <br/>

          <input type="text" id="definition" placeholder="Definición" disabled={!!playerDefinition} />
          <button onClick={() => {
            const definition = (document.getElementById('definition') as HTMLInputElement).value
            socket.emit('playerDefinition', { playerName: currentPlayerName, definition })
            setPlayerDefinition(definition)
          }}>Enviar definición</button>

          <h3>Definiciones {
            `${playerDefinitions.length}/${players.length}`
            }</h3>

          <button onClick={() => {
            socket.emit('startVotingPhase')
          }}>Comenzar Votación</button>
        </div>
        <div className='section'>
          <h3>Fase de votación</h3>
          <ul>
            {options.filter(option => option.playerName !== currentPlayerName).map((option) => (
              <div>
                <li key={option.playerName}>{option.definition}</li>
                <button onClick={() => {
                  socket.emit('vote', { playerName: currentPlayerName, votedPlayer: option.playerName })
                }}>Votar</button>
              </div>
            ))}
          </ul>

          <h3>Votos {
            `${playerVotes.length}/${players.length}`
            }</h3>

          <button onClick={() => {
                  socket.emit('endVotingPhase')
                }}>Terminar votación</button>
        </div>
        <div className="section">
          <button onClick={() => {
            socket.emit('newRound');
          }}>
            Nueva Ronda
          </button>
        </div>
        <div className="section">
          <button onClick={() => {
            socket.emit('endGame');
          }}>
            Terminar Juego
          </button>

          Top Players
          <ul>
            {topPlayers.map((player) => (
              <li key={player.name}>Nombre: {player.name} / Puntaje: {player.score}</li>
            ))}
          </ul>
        </div>
      </div>
    </ErrorBoundary>
  )
}

export default App
