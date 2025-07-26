import React, { useEffect, useRef, useState } from 'react'

const ROWS = 20
const COLS = 10
const EMPTY = 0

// 基本 7 種方塊形狀（僅骨架，之後會補全 SRS 與 7袋）
const SHAPES = [
  // I
  [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  // O
  [
    [2, 2],
    [2, 2],
  ],
  // T
  [
    [0, 3, 0],
    [3, 3, 3],
    [0, 0, 0],
  ],
  // S
  [
    [0, 4, 4],
    [4, 4, 0],
    [0, 0, 0],
  ],
  // Z
  [
    [5, 5, 0],
    [0, 5, 5],
    [0, 0, 0],
  ],
  // J
  [
    [6, 0, 0],
    [6, 6, 6],
    [0, 0, 0],
  ],
  // L
  [
    [0, 0, 7],
    [7, 7, 7],
    [0, 0, 0],
  ],
]

const COLORS = [
  '#222', // EMPTY
  '#00f0f0', // I
  '#f0f000', // O
  '#a000f0', // T
  '#00f000', // S
  '#f00000', // Z
  '#0000f0', // J
  '#f0a000', // L
]

const LANGS = {
  zh: {
    title: '俄羅斯方塊',
    start: '開始遊戲',
    pause: '暫停',
    resume: '繼續',
    gameover: '遊戲結束',
    restart: '重新開始',
    score: '分數',
    lines: '消除行數',
    lang: 'English',
  },
  en: {
    title: 'Tetris',
    start: 'Start',
    pause: 'Pause',
    resume: 'Resume',
    gameover: 'Game Over',
    restart: 'Restart',
    score: 'Score',
    lines: 'Lines',
    lang: '中文',
  },
}

function randomShape() {
  const idx = Math.floor(Math.random() * SHAPES.length)
  return { shape: SHAPES[idx], type: idx + 1 }
}

function createEmptyBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(EMPTY))
}

// 旋轉方塊（順時針90度）
function rotate(shape) {
  // 轉置+反轉
  return shape[0].map((_, i) => shape.map(row => row[i]).reverse())
}

// 消除已填滿的行
const clearLines = (b) => {
  const newBoard = b.filter(row => row.some(cell => cell === 0))
  const linesCleared = ROWS - newBoard.length
  while (newBoard.length < ROWS) {
    newBoard.unshift(Array(COLS).fill(EMPTY))
  }
  return { newBoard, linesCleared }
}

function TetrisGame() {
  const [board, setBoard] = useState(createEmptyBoard())
  const [current, setCurrent] = useState(null)
  const [pos, setPos] = useState({ x: 3, y: 0 })
  const [running, setRunning] = useState(false)
  const [lang, setLang] = useState('zh')

  // 初始化新方塊
  const spawn = () => {
    const tetro = randomShape()
    setCurrent(tetro)
    setPos({ x: 3, y: 0 })
  }

  // 合併方塊到棋盤
  const merge = (b, tetro, p) => {
    const newBoard = b.map(row => [...row])
    tetro.shape.forEach((row, dy) => {
      row.forEach((cell, dx) => {
        if (cell) {
          const y = p.y + dy
          const x = p.x + dx
          if (y >= 0 && y < ROWS && x >= 0 && x < COLS) {
            newBoard[y][x] = tetro.type
          }
        }
      })
    })
    return newBoard
  }

  // 判斷碰撞
  const collide = (b, tetro, p) => {
    return tetro.shape.some((row, dy) =>
      row.some((cell, dx) => {
        if (!cell) return false
        const y = p.y + dy
        const x = p.x + dx
        return (
          y >= ROWS ||
          x < 0 ||
          x >= COLS ||
          (y >= 0 && b[y][x])
        )
      })
    )
  }

  // 取得 ghost 落點位置
  const getGhostY = (board, current, pos) => {
    let ghostY = pos.y
    while (!collide(board, current, { x: pos.x, y: ghostY + 1 })) {
      ghostY++
    }
    return ghostY
  }

  // 方塊下落邏輯
  useEffect(() => {
    if (!running || !current) return
    const timer = setInterval(() => {
      const nextPos = { x: pos.x, y: pos.y + 1 }
      if (!collide(board, current, nextPos)) {
        setPos(nextPos)
      } else {
        // 固定方塊
        const merged = merge(board, current, pos)
        const { newBoard } = clearLines(merged)
        setBoard(newBoard)
        spawn()
      }
    }, 500)
    return () => clearInterval(timer)
  }, [running, current, pos, board])

  // 開始遊戲
  const startGame = () => {
    setBoard(createEmptyBoard())
    spawn()
    setRunning(true)
  }

  // 鍵盤操作
  useEffect(() => {
    if (!running) return
    const handleKey = (e) => {
      if (!current) return
      if (e.key === 'ArrowLeft') {
        const next = { x: pos.x - 1, y: pos.y }
        if (!collide(board, current, next)) setPos(next)
      } else if (e.key === 'ArrowRight') {
        const next = { x: pos.x + 1, y: pos.y }
        if (!collide(board, current, next)) setPos(next)
      } else if (e.key === ' ') {
        // 空白鍵：硬降
        let dropY = pos.y
        while (!collide(board, current, { x: pos.x, y: dropY + 1 })) {
          dropY++
        }
        // 直接鎖定方塊並產生新方塊
        const merged = merge(board, current, { x: pos.x, y: dropY })
        const { newBoard } = clearLines(merged)
        setBoard(newBoard)
        spawn()
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        // 上鍵：旋轉
        const rotated = { ...current, shape: rotate(current.shape) }
        if (!collide(board, rotated, pos)) {
          setCurrent(rotated)
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        // 下鍵：加速下落
        const next = { x: pos.x, y: pos.y + 1 }
        if (!collide(board, current, next)) setPos(next)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [running, current, pos, board])

  // 畫面渲染
  const renderBoard = () => {
    // 合併當前方塊到棋盤暫存
    const display = board.map(row => [...row])
    // ghost piece
    if (current) {
      const ghostY = getGhostY(board, current, pos)
      current.shape.forEach((row, dy) => {
        row.forEach((cell, dx) => {
          if (cell) {
            const y = ghostY + dy
            const x = pos.x + dx
            if (y >= 0 && y < ROWS && x >= 0 && x < COLS && !display[y][x]) {
              // ghost 顏色用透明
              display[y][x] = -current.type // 用負數標記 ghost
            }
          }
        })
      })
      // 畫當前方塊
      current.shape.forEach((row, dy) => {
        row.forEach((cell, dx) => {
          if (cell) {
            const y = pos.y + dy
            const x = pos.x + dx
            if (y >= 0 && y < ROWS && x >= 0 && x < COLS) {
              display[y][x] = current.type
            }
          }
        })
      })
    }
    return (
      <div style={{ display: 'inline-block', background: '#222', padding: 8 }}>
        {display.map((row, y) => (
          <div key={y} style={{ display: 'flex' }}>
            {row.map((cell, x) => {
              let color = COLORS[Math.abs(cell)]
              let opacity = 1
              if (cell < 0) {
                opacity = 0.3 // ghost 透明
              }
              return (
                <div
                  key={x}
                  style={{
                    width: 24,
                    height: 24,
                    background: color,
                    border: '1px solid #333',
                    opacity,
                  }}
                />
              )
            })}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <h2>{LANGS[lang].title}</h2>
      <button onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')} style={{ marginBottom: 8 }}>
        {LANGS[lang].lang}
      </button>
      {!running ? (
        <button onClick={startGame}>{LANGS[lang].start}</button>
      ) : (
        <div>
          {renderBoard()}
        </div>
      )}
    </div>
  )
}

export default TetrisGame 