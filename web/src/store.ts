import { Reducer } from "redux"
import { computeGameDimensions } from "./dimensions"
import {
  LaneType,
  ReducerState,
  LaneObjectData,
  FrogMoveAction,
  TickEventAction,
  ReducerAction,
  ActionType,
  GameStatus,
  ScreenResizeAction,
  GameMainMenuState,
  StartGameAction,
  GamePlayingState,
  GameLoadingState,
  RoundStatus,
  ReadyForOverlayAction,
  ReturnToMainMenuAction,
  ReadyForInputAction,
} from "./types"
import { initLanes, initFrog } from "./map"

/* selectors */

export const getLaneObjectPositions = (
  state: ReducerState,
  laneNumber: number
): number[] => {
  if (state.gameStatus !== GameStatus.PLAYING) {
    throw new Error("Bad game status: " + state.gameStatus)
  }

  let laneState = state.lanes[laneNumber]
  if (laneState.laneType === LaneType.GRASS) {
    return []
  }
  let laneObjects = laneState.laneObjects
  let loopLength =
    laneObjects[laneObjects.length - 1].startPos + laneState.length
  let displacement = laneState.speed * state.time

  let gameWidth = state.gameSize.gameWidth
  if (laneState.direction < 0) {
    // moving left
    return laneObjects.map((laneObject) => {
      return 2 * gameWidth - ((laneObject.startPos + displacement) % loopLength)
    })
  } else {
    // moving right
    return laneObjects.map((laneObject) => {
      return -gameWidth + ((laneObject.startPos + displacement) % loopLength)
    })
  }
}

export const getLaneObjectData = (
  state: ReducerState,
  laneNumber: number
): LaneObjectData[] => {
  if (state.gameStatus !== GameStatus.PLAYING) {
    throw new Error("Bad game status: " + state.gameStatus)
  }

  let laneState = state.lanes[laneNumber]
  if (laneState.laneType === LaneType.GRASS) {
    return []
  }

  let length = laneState.length
  let objectPositions = getLaneObjectPositions(state, laneNumber)
  return laneState.laneObjects.map((laneObject, i) => ({
    left: objectPositions[i],
    length: length,
    color: laneObject.color,
    id: laneObject.id,
  }))
}

const getRoundStatus = (state: GamePlayingState): RoundStatus => {
  if (
    state.roundStatus === RoundStatus.DEAD ||
    state.roundStatus === RoundStatus.WON
  ) {
    return state.roundStatus
  }

  let laneNumber = state.frog.lane
  if (laneNumber === 0) {
    return RoundStatus.WON
  }

  let frogSize = state.gameSize.frogSize
  let laneState = state.lanes[state.frog.lane]
  if (laneState.laneType === LaneType.GRASS) {
    return RoundStatus.ALIVE
  } else {
    let objectPositions = getLaneObjectPositions(state, laneNumber)
    let frogPos = state.frog.x
    let objectLength = laneState.length

    // iterate through all lane objects in the frog's lane, checking for overlap
    switch (laneState.laneType) {
      case LaneType.ROAD:
        for (let pos of objectPositions) {
          if (frogPos + frogSize > pos && frogPos < pos + objectLength) {
            return RoundStatus.DEAD
          }
        }
        return RoundStatus.ALIVE
      case LaneType.WATER:
        for (let pos of objectPositions) {
          if (
            frogPos > pos - frogSize / 2 &&
            frogPos < pos + objectLength - frogSize / 2
          ) {
            return RoundStatus.ALIVE
          }
        }
        return RoundStatus.DEAD
      default:
        throw new Error("shouldn't get here")
    }
  }
}

/* reducers */

const reduceScreenResizeEvent = (
  state: ReducerState,
  action: ScreenResizeAction
): GameLoadingState | GameMainMenuState => {
  let dimensions = computeGameDimensions(
    action.windowWidth,
    action.windowHeight
  )
  if (dimensions == null) {
    // Unable to load game
    return { gameStatus: GameStatus.LOADING, loadingFailed: true }
  }
  return {
    gameStatus: GameStatus.MAIN_MENU,
    gameSize: { ...dimensions, isMobile: action.isMobile },
  }
}

const reduceStartGameEvent = (
  state: ReducerState,
  action: StartGameAction
): GamePlayingState => {
  if (state.gameStatus === GameStatus.LOADING) {
    throw new Error("Bad game status: " + state.gameStatus)
  }
  if (state.gameStatus === GameStatus.PLAYING && !state.readyForInput) {
    return state
  }

  return {
    gameStatus: GameStatus.PLAYING,
    gameSize: state.gameSize,
    gameStartTime: new Date().getTime(),
    gameWinTime: NaN,

    mapType: action.mapType,
    frog: initFrog(state.gameSize.gameWidth, state.gameSize.frogSize),
    lanes: initLanes(action.mapType, state.gameSize.gameWidth),
    time: 0,
    roundStatus: RoundStatus.ALIVE,
    hasMoved: false,
    readyForOverlay: false,
    readyForInput: false,
  }
}

const reduceFrogMoveEvent = (
  state: ReducerState,
  action: FrogMoveAction
): ReducerState => {
  if (state.gameStatus !== GameStatus.PLAYING) {
    return state
  }
  if (
    state.roundStatus === RoundStatus.DEAD ||
    state.roundStatus === RoundStatus.WON ||
    !state.readyForInput
  ) {
    return state
  }

  // move frog
  let frogState = { ...state.frog }
  let newState = { ...state, frog: frogState, hasMoved: true }
  let frogSize = state.gameSize.frogSize
  switch (action.dir) {
    case "Up":
      if (frogState.lane > 0) {
        frogState.lane--
      }
      frogState.direction = 0
      break
    case "Down":
      if (frogState.lane < state.lanes.length - 1) {
        frogState.lane++
      }
      frogState.direction = 180
      break
    case "Left":
      // Except on water lanes, if frog oversteps bounds, just coerce to equal boundary.
      if (
        state.lanes[frogState.lane].laneType !== LaneType.WATER &&
        frogState.x - frogSize < 0
      ) {
        frogState.x = 0
      } else {
        frogState.x -= frogSize
      }
      frogState.direction = 270
      break
    case "Right":
      let gameWidth = state.gameSize.gameWidth
      // Except on water lanes, if frog oversteps bounds, just coerce to equal boundary.
      if (
        state.lanes[frogState.lane].laneType !== LaneType.WATER &&
        frogState.x + frogSize > gameWidth - frogSize
      ) {
        frogState.x = gameWidth - frogSize
      } else {
        frogState.x += frogSize
      }
      frogState.direction = 90
      break
  }
  // check death
  newState.roundStatus = getRoundStatus(newState)
  if (newState.roundStatus === RoundStatus.WON)
    newState.gameWinTime = new Date().getTime()
  return newState
}

const reduceTickEvent = (
  state: ReducerState,
  action: TickEventAction
): ReducerState => {
  if (state.gameStatus !== GameStatus.PLAYING) {
    return state
  }

  // advance time
  let newState = { ...state }
  newState.time = state.time + action.tickAmount

  // update frog position (if necessary)
  let laneState = state.lanes[state.frog.lane]
  if (
    laneState.laneType === LaneType.WATER &&
    state.roundStatus === RoundStatus.ALIVE
  ) {
    newState.frog = {
      ...state.frog,
      x:
        state.frog.x +
        laneState.speed * action.tickAmount * laneState.direction,
    }
  }
  // check death
  newState.roundStatus = getRoundStatus(newState)

  return newState
}

const reduceReadyForOverlayEvent = (
  state: ReducerState,
  action: ReadyForOverlayAction
): ReducerState => {
  if (state.gameStatus !== GameStatus.PLAYING) {
    throw new Error("Bad game status: " + state.gameStatus)
  }
  return { ...state, readyForOverlay: true, readyForInput: false }
}

const reduceReadyForInputEvent = (
  state: ReducerState,
  action: ReadyForInputAction
): ReducerState => {
  if (state.gameStatus !== GameStatus.PLAYING) {
    return state;
  }
  return { ...state, readyForInput: true }
}

const reduceReturnToMainMenuEvent = (
  state: ReducerState,
  action: ReturnToMainMenuAction
): ReducerState => {
  if (state.gameStatus === GameStatus.LOADING) {
    throw new Error("Bad game status: " + state.gameStatus)
  }
  return { gameStatus: GameStatus.MAIN_MENU, gameSize: state.gameSize }
}

export const rootReducer: Reducer<ReducerState, ReducerAction> = (
  state: ReducerState | undefined,
  action: ReducerAction
): ReducerState => {
  if (!state) {
    return { gameStatus: GameStatus.LOADING, loadingFailed: false }
  }

  switch (action.type) {
    case ActionType.TICK:
      return reduceTickEvent(state, action)
    case ActionType.FROG_MOVE:
      return reduceFrogMoveEvent(state, action)
    case ActionType.SCREEN_RESIZE:
      return reduceScreenResizeEvent(state, action)
    case ActionType.START_GAME:
      return reduceStartGameEvent(state, action)
    case ActionType.READY_FOR_OVERLAY:
      return reduceReadyForOverlayEvent(state, action)
    case ActionType.READY_FOR_INPUT:
      return reduceReadyForInputEvent(state, action)
    case ActionType.RETURN_TO_MAIN_MENU:
      return reduceReturnToMainMenuEvent(state, action)
  }
}
