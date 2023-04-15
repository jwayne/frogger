import React, {
  useEffect,
  useCallback,
  useState,
  CSSProperties,
  useRef,
} from "react"
import { Animate } from "react-move"
import { useSelector, useDispatch } from "react-redux"
import { Swipeable, EventData } from "react-swipeable"
import styled from "styled-components"
import "./App.css"
import {
  LaneType,
  ReducerState,
  ActionType,
  GameStatus,
  RoundStatus,
  GamePlayingState,
} from "./types"
import { getLaneObjectData } from "./store"
import { initFrog } from "./map"

const refreshInterval = 20 // 20ms refresh = 50 fps
const frogMoveDuration = 65
const delayBeforeOverlay = 90
const delayBeforeInput = 250 // average human response time to visual stimulus

const App: React.FC = () => {
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch({
      type: ActionType.SCREEN_RESIZE,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      isMobile:
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        navigator.msMaxTouchPoints > 0,
    })
  }, [dispatch])

  let { gameStatus, loadingFailed } = useSelector((state: ReducerState) => {
    return {
      gameStatus: state.gameStatus,
      loadingFailed:
        state.gameStatus === GameStatus.LOADING && state.loadingFailed,
    }
  })
  let fontSize = useSelector((state: ReducerState) => {
    if (state.gameStatus === GameStatus.LOADING) {
      return "100%"
    }
    return state.gameSize.frogSize
  })
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: window.innerHeight,
        overflow: "hidden",
        fontSize: fontSize,
      }}
    >
      {(() => {
        switch (gameStatus) {
          case GameStatus.LOADING:
            if (loadingFailed) {
              return <div>Oops! Your screen is too small for this game.</div>
            } else {
              return ""
            }
          case GameStatus.MAIN_MENU:
            return <MainMenu />
          case GameStatus.PLAYING:
            return <Game />
        }
      })()}
    </div>
  )
}

type GameStartButtonProps = {
  mapType: string
  isMobile: boolean
  style?: CSSProperties
}

const StartButton = styled.div`
  &:hover {
    background-color: #aaa;
    border: 4px solid green;
  }
`
const GameStartButton: React.FC<GameStartButtonProps> = ({
  mapType,
  isMobile,
  style,
}) => {
  const dispatch = useDispatch()

  return (
    <StartButton
      style={{
        width: isMobile ? "80%" : "40%",
        height: isMobile ? "10%" : "20%",
        border: "4px solid black",
        cursor: "pointer",
        margin: "0.1em",
        backgroundColor: "limegreen",
        color: "black",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        ...style,
      }}
      className="start-button"
      onClick={() =>
        dispatch({ type: ActionType.START_GAME, mapType: mapType })
      }
    >
      <div style={{ textAlign: "center" }}>{mapType}</div>
    </StartButton>
  )
}

const MainMenu: React.FC = () => {
  const { gameWidth, gameHeight, laneHeight, isMobile } = useSelector(
    (state: ReducerState) => {
      if (state.gameStatus !== GameStatus.MAIN_MENU) {
        throw new Error("Bad game status: " + state.gameStatus)
      }
      return state.gameSize
    }
  )

  return (
    <div
      style={{
        width: gameWidth,
        height: gameHeight,
        backgroundColor: "#ccc",
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "space-evenly",
        alignItems: "center",
        alignContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          height: isMobile ? "30%" : "40%",
          fontSize: "220%",
          color: "green",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div>Frogger</div>
      </div>
      <GameStartButton mapType="classic" isMobile={isMobile} key={0} />
      <GameStartButton
        mapType="los angeles"
        isMobile={isMobile}
        key={1}
        style={{
          backgroundImage: `url(${require("./assets/asphalt.png")})`,
          backgroundRepeat: "repeat-x repeat-y",
          backgroundSize: `${laneHeight}px ${laneHeight}px`,
        }}
      />
      <GameStartButton
        mapType="venice"
        isMobile={isMobile}
        key={2}
        style={{
          backgroundImage: `url(${require("./assets/water.png")})`,
          backgroundRepeat: "repeat-x repeat-y",
          backgroundSize: `${laneHeight}px ${laneHeight}px`,
        }}
      />
      <GameStartButton
        mapType="expert"
        isMobile={isMobile}
        key={3}
        style={{
          backgroundImage: `url(${require("./assets/sos.png")})`,
          backgroundPosition: "center",
          backgroundRepeat: "repeat-x repeat-y",
          backgroundSize: `${laneHeight * 2}px ${laneHeight * 2}px`,
        }}
      />
    </div>
  )
}

const Game: React.FC = () => {
  const {
    gameSize,
    frog,
    lanes,
    roundStatus,
    readyForOverlay,
    readyForInput,
    isMobile,
  } = useSelector((state: ReducerState) => {
    if (state.gameStatus !== GameStatus.PLAYING) {
      throw new Error("Bad game status: " + state.gameStatus)
    }
    return {
      gameSize: state.gameSize,
      frog: state.frog,
      lanes: state.lanes,
      roundStatus: state.roundStatus,
      readyForOverlay: state.readyForOverlay,
      readyForInput: state.readyForInput,
      isMobile: state.gameSize.isMobile,
    }
  })
  const { gameWidth, gameHeight, laneHeight, lanePadding, frogSize } = gameSize

  const dispatch = useDispatch()
  const container = useRef<HTMLDivElement>(null)

  const moveFrogOnKeyDown = useCallback(
    (ev: KeyboardEvent) => {
      switch (ev.key) {
        case "ArrowUp":
        case "ArrowDown":
        case "ArrowLeft":
        case "ArrowRight":
          dispatch({
            type: ActionType.FROG_MOVE,
            dir: ev.key.substring(5),
          })
      }
    },
    [dispatch]
  )
  useEffect(() => {
    document.addEventListener("keydown", moveFrogOnKeyDown)
    return () => {
      document.removeEventListener("keydown", moveFrogOnKeyDown)
    }
  }, [moveFrogOnKeyDown])

  useEffect(() => {
    const tick = setInterval(() => {
      dispatch({ type: ActionType.TICK, tickAmount: refreshInterval })
    }, refreshInterval)
    return () => {
      if (tick !== undefined) {
        clearInterval(tick)
      }
    }
  }, [dispatch])

  useEffect(() => {
    // NOTE: This can create issues if we advance to another state before
    // the timeout is reached, in which case the timeout's handler is called
    // for the new state rather than the current state. However, this isn't
    // an issue as the state machine is currently designed, since we never
    // advance to a different state until readyForInput is true.
    if (!readyForInput) {
      setTimeout(() => {
        dispatch({ type: ActionType.READY_FOR_INPUT })
      }, delayBeforeInput)
    }
  }, [readyForInput, dispatch])
  useEffect(() => {
    if (
      !readyForOverlay &&
      (roundStatus === RoundStatus.DEAD || roundStatus === RoundStatus.WON)
    ) {
      setTimeout(() => {
        dispatch({ type: ActionType.READY_FOR_OVERLAY })
      }, delayBeforeOverlay)
    }
  }, [readyForOverlay, roundStatus, dispatch])

  let initialFrog = initFrog(gameWidth, frogSize)
  let frogImg
  if (!readyForOverlay) {
    frogImg = (
      <img
        src={require("./assets/frog.png")}
        alt="frog"
        style={{
          transform: `rotate(${frog.direction}deg)`,
          width: frogSize,
          height: frogSize,
        }}
      />
    )
  } else if (roundStatus === RoundStatus.DEAD) {
    frogImg = (
      <img
        src={require("./assets/dead.png")}
        alt="dead"
        style={{
          width: frogSize,
          height: frogSize,
        }}
      />
    )
  } else if (roundStatus === RoundStatus.WON) {
    frogImg = (
      <img
        src={require("./assets/happy_frog.gif")}
        alt="dead"
        style={{
          width: frogSize,
          height: frogSize,
        }}
      />
    )
  } else {
    throw new Error("should not get here")
  }

  const frogY = frog.lane * laneHeight + lanePadding

  return (
    <div
      ref={container}
      style={{
        width: gameWidth,
        height: gameHeight,
        backgroundColor: "lightGrey",
        overflow: "hidden",
        position: "relative",
      }}
      onMouseDown={(e: React.MouseEvent<HTMLElement>) => {
        if ((e.target as HTMLInputElement).className !== "allow-click") {
          e.preventDefault()
          // On mobile, support tapping to move the frog. Direction is determined by
          // where the tap is relative to the frog. Tap within the 45 degrees around
          // each cardinal direction to move in that direction.
          if (isMobile && container.current) {
            const halfFrog = frogSize / 2
            const frogCenterX = frog.x + halfFrog
            const frogCenterY = frogY + halfFrog

            const rect = container.current.getBoundingClientRect()
            const mouseX = e.clientX - rect.left
            const mouseY = e.clientY - rect.top

            const diffX = mouseX - frogCenterX
            const diffY = mouseY - frogCenterY

            if (Math.abs(diffY) > Math.abs(diffX)) {
              if (diffY <= -halfFrog) {
                dispatch({
                  type: ActionType.FROG_MOVE,
                  dir: "Up",
                })
              } else if (diffY >= halfFrog) {
                dispatch({
                  type: ActionType.FROG_MOVE,
                  dir: "Down",
                })
              }
            } else {
              if (diffX <= -halfFrog) {
                dispatch({
                  type: ActionType.FROG_MOVE,
                  dir: "Left",
                })
              } else if (diffX >= halfFrog) {
                dispatch({
                  type: ActionType.FROG_MOVE,
                  dir: "Right",
                })
              }
            }
          }
        }
      }}
    >
      <Frog
        x={frog.x}
        y={frogY}
        startX={initialFrog.x}
        startY={initialFrog.lane * laneHeight + lanePadding}
        frogSize={frogSize}
      >
        {frogImg}
      </Frog>
      <Timer />
      {lanes.map((lane, i) => {
        switch (lane.laneType) {
          case LaneType.GRASS:
            return (
              <Lane
                key={i}
                laneType={lane.laneType}
                laneHeight={laneHeight}
                lanePadding={lanePadding}
              />
            )
          case LaneType.ROAD:
          case LaneType.WATER:
            return (
              <MovingLane
                key={i}
                laneType={lane.laneType}
                laneHeight={laneHeight}
                lanePadding={lanePadding}
                laneNumber={i}
              />
            )
          default:
            throw new Error("shouldn't get here")
        }
      })}
      {readyForOverlay && roundStatus === RoundStatus.DEAD && (
        <LostGameOverlay />
      )}
      {readyForOverlay && roundStatus === RoundStatus.WON && <WonGameOverlay />}
    </div>
  )
}

type FrogProps = {
  // coordinate of frog's left boundary
  x: number
  // coordinate of frog's top boundary
  y: number
  startX: number
  startY: number
  frogSize: number
}

const Frog: React.FC<FrogProps> = ({
  x,
  y,
  startX,
  startY,
  frogSize,
  children,
}) => (
  <Animate
    start={{
      moveX: 0,
      moveY: 0,
    }}
    update={{
      moveX: [x - startX],
      moveY: [y - startY],
      timing: {
        delay: 0,
        duration: frogMoveDuration,
      },
    }}
  >
    {(data) => (
      <div
        style={{
          transform: `translate(${data.moveX}px, ${data.moveY}px)`,
          position: "absolute",
          left: startX,
          top: startY,
          width: frogSize,
          height: frogSize,
          zIndex: 3,
        }}
      >
        {children}
      </div>
    )}
  </Animate>
)

function zfill(num: number) {
  let numStr = num.toString()
  if (numStr.length < 2) {
    numStr = "0" + numStr
  }
  return numStr
}

function formatMillis(millis: number) {
  const minutes = Math.floor((millis / (1000 * 60)) % 60)
  const seconds = Math.floor((millis / 1000) % 60)
  const splitSeconds = Math.floor((millis / 10) % 100)
  return zfill(minutes) + ":" + zfill(seconds) + "." + zfill(splitSeconds)
}

const Timer: React.FC = () => {
  let { gameStartTime, gameWinTime } = useSelector(
    (state: GamePlayingState) => {
      return {
        gameStartTime: state.gameStartTime,
        gameWinTime: state.gameWinTime,
      }
    }
  )

  const [timeElapsed, setTimeElapsed] = useState(0)

  // Update the timer unless it exceeds 1 hour.
  useEffect(() => {
    if (timeElapsed < 3599999) {
      const timeout = setTimeout(() => {
        if (gameWinTime) {
          setTimeElapsed(gameWinTime - gameStartTime)
        } else {
          setTimeElapsed(
            Math.min(new Date().getTime() - gameStartTime, 3599999)
          )
        }
      }, 25)
      return () => {
        clearTimeout(timeout)
      }
    }
    // This will stop updating once timeElapsed stops changing.
  }, [timeElapsed, gameStartTime, gameWinTime])

  return (
    <div
      style={{
        position: "absolute",
        right: "5px",
        top: 0,
        zIndex: 2,
        fontSize: "80%",
        color: "#003300",
      }}
    >
      {formatMillis(timeElapsed)}
    </div>
  )
}

type LaneProps = {
  laneType: LaneType
  laneHeight: number
  lanePadding: number
}

const Lane: React.FC<LaneProps> = ({
  laneType,
  laneHeight,
  lanePadding,
  children,
}) => {
  let style
  switch (laneType) {
    case LaneType.GRASS:
      style = { backgroundColor: "green" }
      break
    case LaneType.ROAD:
      style = {
        backgroundImage: `url(${require("./assets/asphalt.png")})`,
        backgroundRepeat: "repeat-x",
        backgroundSize: `${laneHeight}px ${laneHeight}px`,
      }
      break
    case LaneType.WATER:
      style = {
        backgroundImage: `url(${require("./assets/water.png")})`,
        backgroundRepeat: "repeat-x",
        backgroundSize: `${laneHeight}px ${laneHeight}px`,
      }
  }
  return (
    <div
      style={{
        ...style,
        height: laneHeight - lanePadding * 2,
        width: "100%",
        padding: `${lanePadding}px 0`,
        overflow: "hidden",
        position: "relative",
      }}
    >
      {children}
    </div>
  )
}

type MovingLaneProps = LaneProps & {
  laneNumber: number
}

const MovingLane: React.FC<MovingLaneProps> = ({ laneNumber, ...props }) => {
  const { laneHeight, lanePadding } = props
  let laneObjectData = useSelector((state: ReducerState) =>
    getLaneObjectData(state, laneNumber)
  )

  return (
    <Lane {...props}>
      {laneObjectData.map((laneObject) => (
        <div
          style={{
            position: "absolute",
            left: laneObject.left,
            width: laneObject.length,
            height: laneHeight - lanePadding * 2,
            backgroundColor: laneObject.color,
            zIndex: 1,
          }}
          key={laneObject.id}
        ></div>
      ))}
    </Lane>
  )
}

type GameOverlayDivProps = {
  onClick?: (event: React.MouseEvent) => void
}

const GameOverlayDiv: React.FC<GameOverlayDivProps> = ({
  onClick,
  children,
}) => {
  return (
    <div
      onClick={onClick}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: "100%",
        height: "100%",
        zIndex: 2,
        opacity: "80%",
        backgroundColor: "#aaa",
        display: "flex",
        flexWrap: "wrap",
        alignContent: "center",
      }}
      className="overlay"
    >
      {children}
    </div>
  )
}
const LostGameOverlay: React.FC = () => {
  const { isMobile, mapType } = useSelector((state: ReducerState) => {
    if (state.gameStatus !== GameStatus.PLAYING) {
      throw new Error("Bad game status: " + state.gameStatus)
    }
    return { isMobile: state.gameSize.isMobile, mapType: state.mapType }
  })
  const dispatch = useDispatch()

  const onKeyDown = useCallback(
    (ev: KeyboardEvent) => {
      if (ev.key === "Escape") {
        dispatch({ type: ActionType.RETURN_TO_MAIN_MENU })
      } else if (ev.key === " ") {
        dispatch({ type: ActionType.START_GAME, mapType: mapType })
      }
    },
    [mapType, dispatch]
  )
  useEffect(() => {
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [onKeyDown])

  if (isMobile) {
    return (
      <Swipeable
        onSwiped={(e: EventData) => {
          if (e.dir === "Up") {
            dispatch({ type: ActionType.START_GAME, mapType: mapType })
          } else if (e.dir === "Left") {
            dispatch({ type: ActionType.RETURN_TO_MAIN_MENU })
          }
        }}
      >
        <GameOverlayDiv>
          <div className="overlay-title">YOU DIED</div>
          {/* <HighScoresTable /> */}
          <div className="overlay-footer">
            [Swipe↑] to restart
            <br />
            [Swipe←] for main menu
          </div>
        </GameOverlayDiv>
      </Swipeable>
    )
  } else {
    return (
      <GameOverlayDiv>
        <div className="overlay-title">YOU DIED</div>
        {/* <HighScoresTable /> */}
        <div className="overlay-footer">
          [space] to restart
          <br />
          [esc] for main menu
        </div>
      </GameOverlayDiv>
    )
  }
}

const WonGameOverlay: React.FC = () => {
  const isMobile = useSelector((state: ReducerState) => {
    if (state.gameStatus !== GameStatus.PLAYING) {
      throw new Error("Bad game status: " + state.gameStatus)
    }
    return state.gameSize.isMobile
  })
  const dispatch = useDispatch()

  const onKeyDown = useCallback(
    (ev: KeyboardEvent) => {
      if (ev.key === "Escape") {
        dispatch({ type: ActionType.RETURN_TO_MAIN_MENU })
      }
    },
    [dispatch]
  )
  useEffect(() => {
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [onKeyDown])

  if (isMobile) {
    return (
      <Swipeable
        onSwiped={(e: EventData) => {
          dispatch({ type: ActionType.RETURN_TO_MAIN_MENU })
        }}
      >
        <GameOverlayDiv>
          <div className="overlay-title">YOU&nbsp;&nbsp;WIN</div>
          {/* <HighScoresTable /> */}
          <div className="overlay-footer">[Swipe] for main menu</div>
        </GameOverlayDiv>
      </Swipeable>
    )
  } else {
    return (
      <GameOverlayDiv>
        <div className="overlay-title">YOU&nbsp;&nbsp;WIN</div>
        {/* <HighScoresTable /> */}
        <div className="overlay-footer">[esc] for main menu</div>
      </GameOverlayDiv>
    )
  }
}

const HIGH_SCORES_URL = "http://localhost:8080/scores"

const MAX_SCORES_TO_SHOW = 5

type HighScoresRow = {
  name: string
  finishTimeMs: number
}

const HighScoresTable: React.FC = () => {
  let { mapType, finishTimeMs } = useSelector((state: GamePlayingState) => {
    return {
      mapType: state.mapType,
      // Should be NaN if we haven't won the game yet
      finishTimeMs: state.gameWinTime - state.gameStartTime,
    }
  })

  // Display a loading message if the high scores haven't loaded yet
  const [hasLoaded, setHasLoaded] = useState(false)

  // Get the latest high scores
  const [highScores, setHighScores] = useState<HighScoresRow[]>([])
  useEffect(() => {
    async function fetchData() {
      let response, data
      console.log("Fetching high scores for: " + mapType)
      try {
        response = await fetch(
          `${HIGH_SCORES_URL}?mapType=${mapType}&count=${MAX_SCORES_TO_SHOW}`
        )
        data = await response.json()
        if (!response.ok) {
          throw Error(`HTTP ${response.status} ${data.message}`)
        }
      } catch (error) {
        console.log("Could not load high scores: " + error)
        return
      }
      setHighScores(data)
      setHasLoaded(true)
    }
    fetchData()
  }, [mapType])

  // Set up the input field for submitting a new high score
  const [newName, setNewName] = useState("")
  const handleChange = useCallback(
    (ev: React.ChangeEvent<HTMLInputElement>) => {
      setNewName(ev.target.value)
    },
    [setNewName]
  )
  const handleSubmit = useCallback(
    (ev: React.FormEvent<HTMLFormElement>) => {
      ev.preventDefault()

      const requestOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mapType: mapType,
          finishTimeMs: finishTimeMs,
          name: newName,
        }),
      }
      fetch(HIGH_SCORES_URL, requestOptions)
        .then((response) => response.json())
        .then((data) => data.id)
    },
    [mapType, finishTimeMs, newName]
  )

  // for testing
  finishTimeMs = 0

  // Assemble our high scores table while checking if we got a new high score.
  const highScoreRows: JSX.Element[] = []
  let rank = 0
  let gotNewHighScore = false
  highScores.map((row) => {
    if (!gotNewHighScore && finishTimeMs < row.finishTimeMs) {
      rank++
      highScoreRows.push(
        <tr key={rank} className="new-score">
          <td>{rank}</td>
          <td className="high-scores-name" id="new-score-name">
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                value={newName}
                onChange={handleChange}
                className="allow-click"
                size={10}
                maxLength={12}
                placeholder="YOUR NAME"
              />
              <button type="submit" className="allow-click">
                &#8594;
              </button>
            </form>
          </td>
          <td>{formatMillis(finishTimeMs)}</td>
        </tr>
      )
      gotNewHighScore = true
    }

    rank++
    if (rank <= MAX_SCORES_TO_SHOW) {
      highScoreRows.push(
        <tr key={rank}>
          <td>{rank}</td>
          <td className="high-scores-name">{row.name}</td>
          <td>{formatMillis(row.finishTimeMs)}</td>
        </tr>
      )
    }
  })

  if (!hasLoaded) {
    return (
      <div className="high-scores-loading">
        LOADING
        <br />
        HIGH SCORES
      </div>
    )
  } else {
    return (
      <div className="high-scores">
        {gotNewHighScore ? (
          <p style={{ color: "lightGreen" }}>
            NEW HIGH SCORE
            <br />
            CONGRATS!
          </p>
        ) : highScoreRows.length ? (
          <p>HIGH SCORES</p>
        ) : (
          <>
            <p style={{ marginBottom: "8px" }}>
              NO HIGH
              <br />
              SCORES YET...
            </p>
            <p>
              You could be
              <br />
              the first!
            </p>
          </>
        )}
        <table>
          <tbody>{highScoreRows}</tbody>
        </table>
      </div>
    )
  }
}

export default App
