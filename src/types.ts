const mapTypes = ["CLASSIC", "LOS ANGELES", "VENICE", "EXPERT"] as const;
export type MapType = typeof mapTypes[number];

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

  mapType: MapType;
  frog: FrogState;
  lanes: LaneState[];
  /** Number of millis that have passed since game start. */
  time: number;
  roundStatus: RoundStatus;
  /** Whether the frog has moved yet. For displaying an info message. */
  hasMoved: boolean;
  /** Whether we're ready to show the death/win screen yet. The idea being,
   * the win/lose event fires once the frog starts moving, but we don't want
   * to display the screen until the frog is done moving.
   */
  readyForOverlay: boolean;
  /** Whether we're ready to handle keyboard input yet. The idea being,
   * when we transition states, we want to give the user a little time to
   * view the new state before their keyboard input is active, so that if
   * they're spamming a key, they don't trigger an action unintentionally.
   */
  readyForInput: boolean;
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
  READY_FOR_OVERLAY,
  READY_FOR_INPUT,
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
  mapType: MapType;
};

export type FrogMoveAction = {
  type: ActionType.FROG_MOVE;
  dir: "Up" | "Down" | "Left" | "Right";
};

export type TickEventAction = {
  type: ActionType.TICK;
  tickAmount: number;
};

export type ReadyForOverlayAction = {
  type: ActionType.READY_FOR_OVERLAY;
};

export type ReadyForInputAction = {
  type: ActionType.READY_FOR_INPUT;
};

export type ReturnToMainMenuAction = {
  type: ActionType.RETURN_TO_MAIN_MENU;
};

export type ReducerAction =
  | ScreenResizeAction
  | StartGameAction
  | FrogMoveAction
  | TickEventAction
  | ReadyForOverlayAction
  | ReadyForInputAction
  | ReturnToMainMenuAction;
