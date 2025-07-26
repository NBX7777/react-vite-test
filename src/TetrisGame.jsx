import React, { useEffect, useRef, useState } from 'react'

// 添加 CSS 动画样式
const pulseAnimation = `
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
  }
`

// 注入样式到页面
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = pulseAnimation
  document.head.appendChild(style)
}

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
  '#00d4ff', // I - 亮藍色
  '#ffd700', // O - 金色
  '#9b59b6', // T - 紫色
  '#2ecc71', // S - 綠色
  '#e74c3c', // Z - 紅色
  '#3498db', // J - 藍色
  '#f39c12', // L - 橙色
]

const LANGS = {
  zh: {
    title: '俄羅斯方塊',
    start: '開始遊戲',
    pause: '暫停',
    resume: '繼續',
    gameover: '你輸了',
    restart: '重新開始',
    score: '分數',
    lines: '消除行數',
    lang: 'English',
    next: '下一個',
    combo: '連擊',
  },
  en: {
    title: 'Tetris',
    start: 'Start',
    pause: 'Pause',
    resume: 'Resume',
    gameover: 'You Lost',
    restart: 'Restart',
    score: 'Score',
    lines: 'Lines',
    lang: '中文',
    next: 'NEXT',
    combo: 'COMBO',
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
  const [nextPiece, setNextPiece] = useState(null)
  const [pos, setPos] = useState({ x: 3, y: 0 })
  const [running, setRunning] = useState(false)
  const [paused, setPaused] = useState(false)
  const [lang, setLang] = useState('zh')
  const [hold, setHold] = useState(null)
  const [canHold, setCanHold] = useState(true)
  const [comboCount, setComboCount] = useState(0)
  const [gameOver, setGameOver] = useState(false)

  // 防止頁面滾動
  useEffect(() => {
    const preventScroll = (e) => {
      e.preventDefault()
    }
    
    // 防止滾輪滾動
    document.addEventListener('wheel', preventScroll, { passive: false })
    // 防止觸控滾動
    document.addEventListener('touchmove', preventScroll, { passive: false })
    
    return () => {
      document.removeEventListener('wheel', preventScroll)
      document.removeEventListener('touchmove', preventScroll)
    }
  }, [])

  // 初始化新方塊
  const spawn = () => {
    let newPiece
    // 如果沒有預覽塊，生成一個
    if (!nextPiece) {
      newPiece = randomShape()
      setNextPiece(newPiece)
      setCurrent(newPiece)
    } else {
      // 使用預覽塊作為當前方塊
      newPiece = nextPiece
      setCurrent(nextPiece)
      // 生成新的預覽塊
      setNextPiece(randomShape())
    }
    
    setPos({ x: 3, y: 0 })
    setCanHold(true)
    
    // 檢查遊戲是否結束（新方塊是否與已有方塊重疊）
    if (collide(board, newPiece, { x: 3, y: 0 })) {
      setGameOver(true)
      setRunning(false)
    }
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
    if (!running || !current || paused) return
    const timer = setInterval(() => {
      const nextPos = { x: pos.x, y: pos.y + 1 }
      if (!collide(board, current, nextPos)) {
        setPos(nextPos)
      } else {
        // 固定方塊
        const merged = merge(board, current, pos)
        const { newBoard, linesCleared } = clearLines(merged)
        setBoard(newBoard)
        
        // 更新combo計數
        if (linesCleared > 0) {
          setComboCount(prev => prev + 1)
        } else {
          setComboCount(0)
        }
        
        spawn()
      }
    }, 500)
    return () => clearInterval(timer)
  }, [running, current, pos, board, paused])

  // 開始遊戲
  const startGame = () => {
    setBoard(createEmptyBoard())
    setNextPiece(randomShape())
    setGameOver(false)
    spawn()
    setRunning(true)
    setPaused(false)
    setHold(null)
    setCanHold(true)
    setComboCount(0)
  }

  // 暫停/繼續遊戲
  const togglePause = () => {
    if (running) {
      setPaused(!paused)
    }
  }

  // 重新開始遊戲
  const restartGame = () => {
    setBoard(createEmptyBoard())
    setCurrent(null)
    setNextPiece(null)
    setPos({ x: 3, y: 0 })
    setRunning(false)
    setPaused(false)
    setHold(null)
    setCanHold(true)
    setComboCount(0)
    setGameOver(false)
  }

  // 暫存方塊
  const holdPiece = () => {
    if (!canHold || !current) return
    
    // 創建原始方向的方塊（不包含旋轉）
    const originalPiece = { shape: SHAPES[current.type - 1], type: current.type }
    
    if (hold) {
      // 如果暫存格有方塊，交換
      const temp = hold
      setHold(originalPiece)
      setCurrent(temp)
    } else {
      // 如果暫存格為空，儲存當前方塊並產生新方塊
      setHold(originalPiece)
      spawn()
    }
    setCanHold(false)
  }

  // 鍵盤操作
  useEffect(() => {
    const handleKey = (e) => {
      // 防止所有方向鍵和空白鍵的默認行為
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'Escape'].includes(e.key)) {
        e.preventDefault()
      }
      
      if (!running || gameOver) return
      
      if (e.key === 'ArrowLeft') {
        if (!current) return
        const next = { x: pos.x - 1, y: pos.y }
        if (!collide(board, current, next)) {
          setPos(next)
        }
      } else if (e.key === 'ArrowRight') {
        if (!current) return
        const next = { x: pos.x + 1, y: pos.y }
        if (!collide(board, current, next)) {
          setPos(next)
        }
      } else if (e.key === ' ') {
        if (!current) return
        // 空白鍵：硬降
        let dropY = pos.y
        while (!collide(board, current, { x: pos.x, y: dropY + 1 })) {
          dropY++
        }
        // 直接鎖定方塊並產生新方塊
        const merged = merge(board, current, { x: pos.x, y: dropY })
        const { newBoard, linesCleared } = clearLines(merged)
        setBoard(newBoard)
        
        // 更新combo計數
        if (linesCleared > 0) {
          setComboCount(prev => prev + 1)
        } else {
          setComboCount(0)
        }
        
        spawn()
      } else if (e.key === 'ArrowUp') {
        if (!current) return
        // 上鍵：旋轉
        const rotated = { ...current, shape: rotate(current.shape) }
        if (!collide(board, rotated, pos)) {
          setCurrent(rotated)
        }
      } else if (e.key === 'ArrowDown') {
        if (!current) return
        // 下鍵：加速下落
        const next = { x: pos.x, y: pos.y + 1 }
        if (!collide(board, current, next)) {
          setPos(next)
        }
      } else if (e.key === 'Escape') {
        // ESC 鍵：暫停/繼續
        if (running) {
          togglePause()
        }
      } else if (e.key === 'c' || e.key === 'C') {
        // C 鍵：暫存方塊
        if (running && !paused) {
          holdPiece()
        }
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [running, current, pos, board, paused])

  // 渲染暫存塊
  const renderHold = () => {
    return (
      <div style={{
        width: 120,
        height: 120,
        background: 'linear-gradient(145deg, #1a1a1a, #2a2a2a)',
        padding: 8,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        borderRadius: '6px',
        boxShadow: 'inset 0 0 15px rgba(0,0,0,0.3)'
      }}>
        <div style={{ 
          color: '#fff', 
          fontSize: '12px', 
          marginBottom: 8, 
          textAlign: 'center',
          fontWeight: 'bold',
          textShadow: '0 1px 2px rgba(0,0,0,0.8)'
        }}>
          {lang === 'zh' ? '暫存' : 'HOLD'}
        </div>
        <div style={{
          width: 80,
          height: 80,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {hold ? (
            <div style={{ display: 'inline-block' }}>
              {hold.shape.map((row, y) => (
                <div key={y} style={{ display: 'flex' }}>
                  {row.map((cell, x) => (
                    <div
                      key={x}
                      style={{
                        width: 25,
                        height: 25,
                        background: cell !== 0 ? 
                          `linear-gradient(135deg, ${COLORS[hold.type]}, ${COLORS[hold.type]}dd)` : 
                          '#1a1a1a',
                        border: cell !== 0 ? 
                          `1px solid ${COLORS[hold.type]}80` : 
                          '1px solid #333',
                        borderRadius: '3px',
                        opacity: canHold ? 1 : 0.5,
                        boxShadow: cell !== 0 ? 
                          `inset 0 0 6px rgba(255,255,255,0.1), inset 0 0 2px rgba(0,0,0,0.3)` : 
                          'none',
                        position: 'relative'
                      }}
                    >
                      {cell !== 0 && (
                        <div style={{
                          position: 'absolute',
                          top: '2px',
                          left: '2px',
                          width: '4px',
                          height: '4px',
                          background: 'rgba(255,255,255,0.3)',
                          borderRadius: '50%',
                          boxShadow: '0 0 3px rgba(255,255,255,0.2)'
                        }} />
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              width: 80,
              height: 80,
              background: 'linear-gradient(145deg, #2a2a2a, #333)',
              border: '1px solid #555',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#666',
              fontSize: '12px',
              boxShadow: 'inset 0 0 10px rgba(0,0,0,0.3)'
            }}>
              {lang === 'zh' ? '空' : 'EMPTY'}
            </div>
          )}
        </div>
      </div>
    )
  }

  // 渲染預覽塊
  const renderNext = () => {
    return (
      <div style={{
        width: 120,
        height: 120,
        background: 'linear-gradient(145deg, #1a1a1a, #2a2a2a)',
        padding: 8,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        borderRadius: '6px',
        boxShadow: 'inset 0 0 15px rgba(0,0,0,0.3)'
      }}>
        <div style={{ 
          color: '#fff', 
          fontSize: '12px', 
          marginBottom: 8, 
          textAlign: 'center',
          fontWeight: 'bold',
          textShadow: '0 1px 2px rgba(0,0,0,0.8)'
        }}>
          {LANGS[lang].next}
        </div>
        <div style={{
          width: 80,
          height: 80,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {nextPiece ? (
            <div style={{ display: 'inline-block' }}>
              {nextPiece.shape.map((row, y) => (
                <div key={y} style={{ display: 'flex' }}>
                  {row.map((cell, x) => (
                    <div
                      key={x}
                      style={{
                        width: 25,
                        height: 25,
                        background: cell !== 0 ? 
                          `linear-gradient(135deg, ${COLORS[nextPiece.type]}, ${COLORS[nextPiece.type]}dd)` : 
                          '#1a1a1a',
                        border: cell !== 0 ? 
                          `1px solid ${COLORS[nextPiece.type]}80` : 
                          '1px solid #333',
                        borderRadius: '3px',
                        boxShadow: cell !== 0 ? 
                          `inset 0 0 6px rgba(255,255,255,0.1), inset 0 0 2px rgba(0,0,0,0.3)` : 
                          'none',
                        position: 'relative'
                      }}
                    >
                      {cell !== 0 && (
                        <div style={{
                          position: 'absolute',
                          top: '2px',
                          left: '2px',
                          width: '4px',
                          height: '4px',
                          background: 'rgba(255,255,255,0.3)',
                          borderRadius: '50%',
                          boxShadow: '0 0 3px rgba(255,255,255,0.2)'
                        }} />
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              width: 80,
              height: 80,
              background: 'linear-gradient(145deg, #2a2a2a, #333)',
              border: '1px solid #555',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#666',
              fontSize: '12px',
              boxShadow: 'inset 0 0 10px rgba(0,0,0,0.3)'
            }}>
              {lang === 'zh' ? '空' : 'EMPTY'}
            </div>
          )}
        </div>
      </div>
    )
  }

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
      <div style={{ 
        display: 'inline-block', 
        background: 'linear-gradient(145deg, #1a1a1a, #2a2a2a)', 
        padding: 12,
        borderRadius: '8px',
        boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)',
        opacity: gameOver ? 0.3 : 1,
        transition: 'opacity 0.3s ease'
      }}>
        {display.map((row, y) => (
          <div key={y} style={{ display: 'flex' }}>
            {row.map((cell, x) => {
              let color = COLORS[Math.abs(cell)]
              let opacity = 1
              let isGhost = false
              if (cell < 0) {
                opacity = 0.2 // ghost 更透明
                isGhost = true
              }
              return (
                <div
                  key={x}
                  style={{
                    width: 26,
                    height: 26,
                    background: cell === 0 ? '#1a1a1a' : 
                      isGhost ? color :
                      `linear-gradient(135deg, ${color}, ${color}dd)`,
                    border: cell === 0 ? '1px solid #333' : 
                      isGhost ? `1px solid ${color}40` :
                      `1px solid ${color}80`,
                    borderRadius: '3px',
                    opacity,
                    boxShadow: cell === 0 ? 'none' :
                      isGhost ? 'none' :
                      `inset 0 0 8px rgba(255,255,255,0.1), inset 0 0 2px rgba(0,0,0,0.3)`,
                    position: 'relative'
                  }}
                >
                  {cell > 0 && !isGhost && (
                    <div style={{
                      position: 'absolute',
                      top: '2px',
                      left: '2px',
                      width: '6px',
                      height: '6px',
                      background: 'rgba(255,255,255,0.3)',
                      borderRadius: '50%',
                      boxShadow: '0 0 4px rgba(255,255,255,0.2)'
                    }} />
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: '#111',
      overflow: 'hidden'
    }}>
      {/* 語系切換按鈕 - 右上角 */}
      <button 
        onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')} 
        style={{ 
          position: 'absolute',
          top: 20,
          right: 20,
          padding: '8px 16px',
          background: '#333',
          color: '#fff',
          border: '1px solid #555',
          borderRadius: '4px',
          cursor: 'pointer',
          zIndex: 1000
        }}
      >
        {LANGS[lang].lang}
      </button>



      {/* 主要遊戲內容 - 置中 */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ color: '#fff', marginBottom: 16 }}>{LANGS[lang].title}</h2>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            {/* 暫存塊區域 */}
            <div style={{
              position: 'absolute',
              top: 20,
              left: -140,
              zIndex: 10
            }}>
              {renderHold()}
            </div>
            
            {/* 預覽塊區域 */}
            <div style={{
              position: 'absolute',
              top: 20,
              right: -140,
              zIndex: 10
            }}>
              {renderNext()}
            </div>
            {renderBoard()}
            
            {/* 遊戲控制按鈕 - 覆蓋在遊戲畫面上 */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              zIndex: 100
            }}>
              {!running ? (
                gameOver ? (
                  <>
                    <div style={{
                      color: '#ff0000',
                      fontSize: '32px',
                      fontWeight: 'bold',
                      marginBottom: '16px',
                      textShadow: '3px 3px 6px rgba(0,0,0,0.9), 0 0 20px rgba(255,0,0,0.5)',
                      animation: 'pulse 1s ease-in-out infinite'
                    }}>
                      {LANGS[lang].gameover}
                    </div>
                    <button 
                      onClick={restartGame}
                      style={{
                        padding: '16px 32px',
                        background: 'rgba(244, 67, 54, 0.9)',
                        color: '#fff',
                        border: '2px solid #f44336',
                        borderRadius: '8px',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        backdropFilter: 'blur(5px)',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
                      }}
                    >
                      {LANGS[lang].restart}
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={startGame}
                    style={{
                      padding: '16px 32px',
                      background: 'rgba(76, 175, 80, 0.9)',
                      color: '#fff',
                      border: '2px solid #4CAF50',
                      borderRadius: '8px',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      backdropFilter: 'blur(5px)',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
                    }}
                  >
                    {LANGS[lang].start}
                  </button>
                )
              ) : paused ? (
                <>
                  <button 
                    onClick={togglePause} 
                    style={{ 
                      padding: '12px 24px',
                      background: 'rgba(76, 175, 80, 0.9)',
                      color: '#fff',
                      border: '2px solid #4CAF50',
                      borderRadius: '6px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      backdropFilter: 'blur(5px)',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
                    }}
                  >
                    {LANGS[lang].resume}
                  </button>
                  <button 
                    onClick={restartGame}
                    style={{
                      padding: '12px 24px',
                      background: 'rgba(244, 67, 54, 0.9)',
                      color: '#fff',
                      border: '2px solid #f44336',
                      borderRadius: '6px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      backdropFilter: 'blur(5px)',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
                    }}
                  >
                    {LANGS[lang].restart}
                  </button>
                </>
              ) : null}
            </div>
            

            
            {/* 暫停提示 - 覆蓋在遊戲畫面上 */}
            {paused && (
              <div style={{
                position: 'absolute',
                top: '20%',
                left: '50%',
                transform: 'translateX(-50%)',
                color: '#f0f000',
                fontSize: '24px',
                fontWeight: 'bold',
                textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                zIndex: 100
              }}>
                {LANGS[lang].pause}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TetrisGame 