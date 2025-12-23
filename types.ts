
export enum GameStatus {
  LOBBY = 'LOBBY',
  GENERATING = 'GENERATING',
  PLAYING = 'PLAYING',
  FINISHED = 'FINISHED'
}

export interface Vector2D {
  x: number;
  y: number;
}

export interface Player {
  id: number;
  name: string;
  color: string;
  pos: Vector2D;
  vel: Vector2D;
  width: number;
  height: number;
  isJumping: boolean;
  canDoubleJump: boolean;
  jumpKeyWasDown: boolean;
  score: number;
  checkpointsReached: number;
  lastCheckpointPos: Vector2D;
  finished: boolean;
  finishTime?: number;
}

export enum PlatformType {
  NORMAL = 'NORMAL',
  BOUNCE = 'BOUNCE',
  LAVA = 'LAVA',
  ICE = 'ICE'
}

export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  type: PlatformType;
}

export interface LevelData {
  id: string;
  title: string;
  platforms: Platform[];
  finishLineX: number;
  backgroundTheme: string;
}

export interface GameControls {
  p1: {
    up: boolean;
    left: boolean;
    right: boolean;
  };
  p2: {
    up: boolean;
    left: boolean;
    right: boolean;
  };
}
