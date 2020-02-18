export type LaneObjectData = {
  left: number;
  length: number;
  color: string;
  id: number;
};

/* redux states */

export type GameSizeState = {
  gameWidth: number;
  gameHeight: number;
  laneHeight: number;
  lanePadding: number;
  frogSize: number;
  isMobile: boolean;
};

export type FrogState = {
  /** Horizontal position of frog as # pixels to the frog's left boundary */
  x: number;
  /** Vertical position of frog in as lane number, from top (0) to bottom */
  lane: number;
  /** Direction frog is facing, in css degrees */
  direction: number;
};

export enum LaneType {
  GRASS,
  ROAD,
  WATER
}

export type StaticLaneState = {
  laneType: LaneType.GRASS;
};

export type LaneObjectState = {
  /** Starting coordinate of object */
  startPos: number;
  /** Id of object, for referencing */
  id: number;
  /** Color of object */
  color: string;
};

export type MovingLaneState = {
  laneType: LaneType.ROAD | LaneType.WATER;

  /** speed of objects in lane, in num pixels to move per ms */
  speed: number;
  /** direction of objects in lane. -1 = left, 1 = right */
  direction: number;
  /** length of objects in lane, in pixels */
  length: number;
  /** min gap between objects in lane, in pixels */
  minGap: number;
  /** max gap between objects in lane, in pixels */
  maxGap: number;

  laneObjects: LaneObjectState[];
};

export type LaneState = StaticLaneState | MovingLaneState;

export enum GameStatus {
  LOADING,
  MAIN_MENU,
  PLAYING
}

export type GameLoadingState = {
  gameStatus: GameStatus.LOADING;
  /** whether the game can be loaded given the screen size. */
  loadingFailed: boolean;
};

export type GameMainMenuState = {
  gameStatus: GameStatus.MAIN_MENU;
  gameSize: GameSizeState;
};

export enum RoundStatus {
  ALIVE,
  DEAD,
  WON
}

export type GamePlayingState = {
  gameStatus: GameStatus.PLAYING;
  gameSize: GameSizeState;

  mapType: string;
  frog: FrogState;
  lanes: LaneState[];
  /** Number of millis that have passed since game start. */
  time: number;
  roundStatus: RoundStatus;
  /** Whether the frog has moved yet. For displaying an info message. */
  hasMoved: boolean;
  /** Whether we're ready to show the death/win screen yet. */
  readyToAlert: boolean;
};

export type ReducerState =
  | GameLoadingState
  | GameMainMenuState
  | GamePlayingState;

/* redux actions */

export enum ActionType {
  SCREEN_RESIZE,
  START_GAME,
  FROG_MOVE,
  TICK,
  READY_TO_ALERT,
  RETURN_TO_MAIN_MENU
}

export type ScreenResizeAction = {
  type: ActionType.SCREEN_RESIZE;
  windowWidth: number;
  windowHeight: number;
  isMobile: boolean;
};

export type StartGameAction = {
  type: ActionType.START_GAME;
  mapType: string;
};

export type FrogMoveAction = {
  type: ActionType.FROG_MOVE;
  dir: "Up" | "Down" | "Left" | "Right";
};

export type TickEventAction = {
  type: ActionType.TICK;
  tickAmount: number;
};

export type ReadyToAlertAction = {
  type: ActionType.READY_TO_ALERT;
};

export type ReturnToMainMenuAction = {
  type: ActionType.RETURN_TO_MAIN_MENU;
};

export type ReducerAction =
  | ScreenResizeAction
  | StartGameAction
  | FrogMoveAction
  | TickEventAction
  | ReadyToAlertAction
  | ReturnToMainMenuAction;
