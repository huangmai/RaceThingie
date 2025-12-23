
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameStatus, Player, Platform, GameControls } from './types';
import { 
  CANVAS_WIDTH, COLORS, PLAYER_WIDTH, PLAYER_HEIGHT, LEVEL_THEMES 
} from './constants';
import { generateLevel, updatePlayer } from './utils/gameLogic';
import { generateLevelNarration, getLevelLayoutSeed } from './services/geminiService';
import GameView from './components/GameView';
import { Trophy, Rocket, Play, RefreshCw, Layers } from 'lucide-react';

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>(GameStatus.LOBBY);
  const [levelTheme, setLevelTheme] = useState(LEVEL_THEMES[0]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [finishLineX, setFinishLineX] = useState(5000);
  const [p1, setP1] = useState<Player>({
    id: 1, name: 'Player 1', color: COLORS.PLAYER_1, 
    pos: { x: 100, y: 400 }, vel: { x: 0, y: 0 },
    width: PLAYER_WIDTH, height: PLAYER_HEIGHT,
    isJumping: false, canDoubleJump: true, jumpKeyWasDown: false,
    score: 0, checkpointsReached: 0, 
    lastCheckpointPos: { x: 100, y: 400 }, finished: false
  });
  const [p2, setP2] = useState<Player>({
    id: 2, name: 'Player 2', color: COLORS.PLAYER_2, 
    pos: { x: 150, y: 400 }, vel: { x: 0, y: 0 },
    width: PLAYER_WIDTH, height: PLAYER_HEIGHT,
    isJumping: false, canDoubleJump: true, jumpKeyWasDown: false,
    score: 0, checkpointsReached: 0, 
    lastCheckpointPos: { x: 150, y: 400 }, finished: false
  });
  const [controls, setControls] = useState<GameControls>({
    p1: { up: false, left: false, right: false },
    p2: { up: false, left: false, right: false }
  });
  const [victoryMessage, setVictoryMessage] = useState<string>("");
  const [winner, setWinner] = useState<string | null>(null);

  const requestRef = useRef<number | null>(null);

  const startGame = async () => {
    setStatus(GameStatus.GENERATING);
    const theme = LEVEL_THEMES[Math.floor(Math.random() * LEVEL_THEMES.length)];
    setLevelTheme(theme);
    
    const seed = await getLevelLayoutSeed(theme);
    const generated = generateLevel(theme, seed);
    
    setPlatforms(generated);
    setFinishLineX(seed.levelLength);
    
    // Reset players
    setP1(prev => ({ ...prev, pos: { x: 100, y: 400 }, vel: { x: 0, y: 0 }, lastCheckpointPos: { x: 100, y: 400 }, finished: false, finishTime: undefined, canDoubleJump: true, jumpKeyWasDown: false }));
    setP2(prev => ({ ...prev, pos: { x: 150, y: 400 }, vel: { x: 0, y: 0 }, lastCheckpointPos: { x: 150, y: 400 }, finished: false, finishTime: undefined, canDoubleJump: true, jumpKeyWasDown: false }));
    setWinner(null);
    setVictoryMessage("");
    setStatus(GameStatus.PLAYING);
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    setControls(prev => {
      const next = { ...prev };
      if (e.code === 'KeyW') next.p1.up = true;
      if (e.code === 'KeyA') next.p1.left = true;
      if (e.code === 'KeyD') next.p1.right = true;
      if (e.code === 'ArrowUp') next.p2.up = true;
      if (e.code === 'ArrowLeft') next.p2.left = true;
      if (e.code === 'ArrowRight') next.p2.right = true;
      return next;
    });
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    setControls(prev => {
      const next = { ...prev };
      if (e.code === 'KeyW') next.p1.up = false;
      if (e.code === 'KeyA') next.p1.left = false;
      if (e.code === 'KeyD') next.p1.right = false;
      if (e.code === 'ArrowUp') next.p2.up = false;
      if (e.code === 'ArrowLeft') next.p2.left = false;
      if (e.code === 'ArrowRight') next.p2.right = false;
      return next;
    });
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  const update = useCallback(() => {
    if (status !== GameStatus.PLAYING) return;

    setP1(prev => updatePlayer(prev, platforms, controls.p1, finishLineX));
    setP2(prev => updatePlayer(prev, platforms, controls.p2, finishLineX));

    requestRef.current = requestAnimationFrame(update);
  }, [status, platforms, controls, finishLineX]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => {
      if (requestRef.current !== null) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [update]);

  useEffect(() => {
    if (status === GameStatus.PLAYING) {
      if (p1.finished && p2.finished) {
        setStatus(GameStatus.FINISHED);
        const win = p1.finishTime! < p2.finishTime! ? 'Player 1' : 'Player 2';
        setWinner(win);
        generateLevelNarration(win, levelTheme).then(setVictoryMessage);
      } else if (p1.finished || p2.finished) {
          if (!winner) {
            const currentWinner = p1.finished ? 'Player 1' : 'Player 2';
            setWinner(currentWinner);
          }
      }
    }
  }, [p1.finished, p2.finished, status, winner, levelTheme]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-950 text-slate-100 overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-slate-950 to-slate-950 pointer-events-none"></div>

      <header className="mb-4 text-center relative z-10">
        <h1 className="text-4xl md:text-5xl font-orbitron font-bold tracking-tighter italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-pink-500 to-amber-400 drop-shadow-lg">
          NEON DUEL
        </h1>
        <p className="text-slate-400 font-orbitron text-[10px] tracking-[0.3em] mt-1 uppercase opacity-70">Split-Screen Synchronization Enabled</p>
      </header>

      <main className="w-full max-w-6xl relative z-10">
        {status === GameStatus.LOBBY && (
          <div className="flex flex-col items-center gap-8 py-12 bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800 p-8 shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full">
              <div className="space-y-4 text-center">
                <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto border-2 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]">
                  <span className="text-blue-400 font-bold text-2xl">P1</span>
                </div>
                <h2 className="text-2xl font-orbitron text-blue-400">Blue Runner</h2>
                <div className="bg-slate-800/80 p-4 rounded-xl space-y-2 border border-blue-500/30">
                  <p className="text-xs text-slate-400 uppercase font-bold">Controls (Left View)</p>
                  <p className="font-orbitron">W - JUMP (X2)</p>
                  <p className="font-orbitron">A/D - MOVE</p>
                </div>
              </div>

              <div className="space-y-4 text-center">
                <div className="w-20 h-20 bg-pink-500/20 rounded-full flex items-center justify-center mx-auto border-2 border-pink-500 shadow-[0_0_20px_rgba(236,72,153,0.5)]">
                  <span className="text-pink-400 font-bold text-2xl">P2</span>
                </div>
                <h2 className="text-2xl font-orbitron text-pink-400">Pink Runner</h2>
                <div className="bg-slate-800/80 p-4 rounded-xl space-y-2 border border-pink-500/30">
                  <p className="text-xs text-slate-400 uppercase font-bold">Controls (Right View)</p>
                  <p className="font-orbitron">↑ - JUMP (X2)</p>
                  <p className="font-orbitron">←/→ - MOVE</p>
                </div>
              </div>
            </div>

            <button 
              onClick={startGame}
              className="mt-8 px-12 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-orbitron text-xl flex items-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(37,99,235,0.4)]"
            >
              <Play className="fill-current" /> INITIALIZE DUEL
            </button>
          </div>
        )}

        {status === GameStatus.GENERATING && (
          <div className="flex flex-col items-center justify-center py-32 space-y-6">
            <RefreshCw className="w-16 h-16 text-blue-400 animate-spin" />
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-orbitron text-blue-400 animate-pulse">CREATING TWIN REALITIES...</h2>
              <p className="text-slate-500 italic font-orbitron text-sm">Sector: {levelTheme}</p>
            </div>
          </div>
        )}

        {status === GameStatus.PLAYING && (
          <div className="space-y-4">
             <div className="flex justify-between items-center bg-slate-900/80 px-6 py-2 rounded-t-xl border-x border-t border-slate-700">
                <div className="flex items-center gap-3">
                  <Layers className="text-amber-400 w-4 h-4" />
                  <span className="font-orbitron text-[10px] text-slate-300">SECTOR: <span className="text-amber-400 uppercase">{levelTheme}</span></span>
                </div>
                {winner && !p1.finished && !p2.finished && (
                   <div className="flex items-center gap-2 text-amber-400 animate-pulse">
                     <Trophy className="w-4 h-4" />
                     <span className="font-orbitron text-[10px] font-bold">{winner.toUpperCase()} IS LEADING</span>
                   </div>
                )}
             </div>
             <GameView 
                player1={p1} 
                player2={p2} 
                platforms={platforms} 
                finishLineX={finishLineX}
                theme={levelTheme}
             />
          </div>
        )}

        {status === GameStatus.FINISHED && (
          <div className="bg-slate-900/90 backdrop-blur-xl p-12 rounded-3xl border-2 border-amber-500/50 shadow-[0_0_100px_rgba(251,191,36,0.2)] text-center space-y-8 max-w-2xl mx-auto">
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="bg-amber-500/20 p-6 rounded-full border-4 border-amber-500 shadow-[0_0_40px_rgba(251,191,36,0.4)]">
                  <Trophy className="w-20 h-20 text-amber-500" />
                </div>
              </div>
              <h2 className="text-6xl font-orbitron font-bold text-white uppercase tracking-tighter">
                {winner} WINS
              </h2>
            </div>

            <div className="bg-black/50 p-6 rounded-2xl border border-slate-800">
              <p className="text-xl font-orbitron italic text-amber-400">
                "{victoryMessage || 'Decoding outcome...'}"
              </p>
            </div>

            <button 
              onClick={startGame}
              className="w-full py-5 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 text-white rounded-2xl font-orbitron text-2xl flex items-center justify-center gap-4 transition-all hover:scale-[1.02] shadow-xl"
            >
              <Rocket className="w-8 h-8" /> RE-ENTER SIMULATION
            </button>
          </div>
        )}
      </main>

      <footer className="mt-8 text-slate-500 text-[8px] font-orbitron tracking-widest opacity-50 uppercase">
        Dual Camera Sync v2.2 | Double Jump Integration
      </footer>
    </div>
  );
};

export default App;
