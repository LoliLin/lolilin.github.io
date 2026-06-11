/**
 * 打砖块小游戏 (Breakout)
 * 使用方式：<script src="https://你的域名/breakout.js"></script>
 * 游戏会自动在页面上创建画布并开始。
 */

(function() {
  // 防止多次引入
  if (window.__breakout_loaded) return;
  window.__breakout_loaded = true;

  // 创建画布
  const canvas = document.createElement('canvas');
  canvas.style.display = 'block';
  canvas.style.margin = '0 auto';
  canvas.style.background = '#222';
  canvas.style.cursor = 'none';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  // 响应式尺寸
  function resize() {
    canvas.width = Math.min(800, window.innerWidth - 20);
    canvas.height = Math.min(600, window.innerHeight - 20);
  }
  window.addEventListener('resize', resize);
  resize();

  // 游戏常量
  const BALL_RADIUS = 6;
  const PADDLE_HEIGHT = 12;
  const PADDLE_WIDTH = 80;
  const BRICK_ROWS = 5;
  const BRICK_COLS = 8;
  const BRICK_HEIGHT = 20;
  const BRICK_PADDING = 4;
  const BRICK_TOP_OFFSET = 40;

  // 游戏状态
  let paddleX = (canvas.width - PADDLE_WIDTH) / 2;
  let ballX = canvas.width / 2;
  let ballY = canvas.height - 50;
  let ballDX = 4;
  let ballDY = -4;
  let rightPressed = false;
  let leftPressed = false;
  let score = 0;
  let lives = 3;
  let gameOver = false;
  let gameWin = false;

  // 砖块数组
  let bricks = [];
  const brickWidth = (canvas.width - (BRICK_COLS + 1) * BRICK_PADDING) / BRICK_COLS;

  function initBricks() {
    bricks = [];
    for (let r = 0; r < BRICK_ROWS; r++) {
      bricks[r] = [];
      for (let c = 0; c < BRICK_COLS; c++) {
        bricks[r][c] = { x: 0, y: 0, status: 1 };
      }
    }
  }
  initBricks();

  // 键盘事件
  function keyDownHandler(e) {
    if (e.key === 'Right' || e.key === 'ArrowRight') {
      rightPressed = true;
    } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
      leftPressed = true;
    }
  }
  function keyUpHandler(e) {
    if (e.key === 'Right' || e.key === 'ArrowRight') {
      rightPressed = false;
    } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
      leftPressed = false;
    }
  }
  document.addEventListener('keydown', keyDownHandler);
  document.addEventListener('keyup', keyUpHandler);

  // 触摸/鼠标移动支持（可选，让游戏更好玩）
  canvas.addEventListener('mousemove', function(e) {
    const rect = canvas.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    if (relativeX > 0 && relativeX < canvas.width) {
      paddleX = relativeX - PADDLE_WIDTH / 2;
      if (paddleX < 0) paddleX = 0;
      if (paddleX + PADDLE_WIDTH > canvas.width) paddleX = canvas.width - PADDLE_WIDTH;
    }
  });

  canvas.addEventListener('touchmove', function(e) {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touchX = e.touches[0].clientX - rect.left;
    if (touchX > 0 && touchX < canvas.width) {
      paddleX = touchX - PADDLE_WIDTH / 2;
      if (paddleX < 0) paddleX = 0;
      if (paddleX + PADDLE_WIDTH > canvas.width) paddleX = canvas.width - PADDLE_WIDTH;
    }
  }, { passive: false });

  // 碰撞检测
  function collisionDetection() {
    for (let r = 0; r < BRICK_ROWS; r++) {
      for (let c = 0; c < BRICK_COLS; c++) {
        const b = bricks[r][c];
        if (b.status === 1) {
          const brickX = c * (brickWidth + BRICK_PADDING) + BRICK_PADDING;
          const brickY = r * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_TOP_OFFSET;
          if (
            ballX + BALL_RADIUS > brickX &&
            ballX - BALL_RADIUS < brickX + brickWidth &&
            ballY + BALL_RADIUS > brickY &&
            ballY - BALL_RADIUS < brickY + BRICK_HEIGHT
          ) {
            ballDY = -ballDY;
            b.status = 0;
            score += 10;
            // 检查是否全部消除
            let allClear = true;
            for (let rr = 0; rr < BRICK_ROWS; rr++) {
              for (let cc = 0; cc < BRICK_COLS; cc++) {
                if (bricks[rr][cc].status === 1) {
                  allClear = false;
                  break;
                }
              }
            }
            if (allClear) {
              gameWin = true;
            }
            return; // 一次只处理一个碰撞
          }
        }
      }
    }
  }

  // 重置球
  function resetBall() {
    ballX = canvas.width / 2;
    ballY = canvas.height - 50;
    ballDX = 4;
    ballDY = -4;
    paddleX = (canvas.width - PADDLE_WIDTH) / 2;
  }

  // 更新画布尺寸时重新计算砖块宽度
  function updateBrickDimensions() {
    const newBrickWidth = (canvas.width - (BRICK_COLS + 1) * BRICK_PADDING) / BRICK_COLS;
    // 不重置砖块状态，只更新宽度引用
    // 但绘制时会用到新宽度，没问题
    return newBrickWidth;
  }

  // 游戏主循环
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameWin) {
      ctx.fillStyle = '#fff';
      ctx.font = '30px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('你赢了！得分：' + score, canvas.width / 2, canvas.height / 2);
      ctx.font = '18px Arial';
      ctx.fillText('刷新页面重新开始', canvas.width / 2, canvas.height / 2 + 40);
      return;
    }

    if (gameOver) {
      ctx.fillStyle = '#fff';
      ctx.font = '30px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('游戏结束 得分：' + score, canvas.width / 2, canvas.height / 2);
      ctx.font = '18px Arial';
      ctx.fillText('刷新页面重新开始', canvas.width / 2, canvas.height / 2 + 40);
      return;
    }

    // 绘制砖块
    const currentBrickWidth = (canvas.width - (BRICK_COLS + 1) * BRICK_PADDING) / BRICK_COLS;
    for (let r = 0; r < BRICK_ROWS; r++) {
      for (let c = 0; c < BRICK_COLS; c++) {
        if (bricks[r][c].status === 1) {
          const brickX = c * (currentBrickWidth + BRICK_PADDING) + BRICK_PADDING;
          const brickY = r * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_TOP_OFFSET;
          ctx.fillStyle = `hsl(${r * 30}, 70%, 60%)`;
          ctx.fillRect(brickX, brickY, currentBrickWidth, BRICK_HEIGHT);
        }
      }
    }

    // 绘制挡板
    ctx.fillStyle = '#0af';
    ctx.fillRect(paddleX, canvas.height - 30, PADDLE_WIDTH, PADDLE_HEIGHT);

    // 绘制球
    ctx.beginPath();
    ctx.arc(ballX, ballY, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = '#f0f';
    ctx.fill();
    ctx.closePath();

    // 显示分数和生命
    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('得分: ' + score, 8, 20);
    ctx.fillText('生命: ' + lives, canvas.width - 80, 20);

    // 移动挡板（键盘）
    if (rightPressed && paddleX < canvas.width - PADDLE_WIDTH) {
      paddleX += 6;
    }
    if (leftPressed && paddleX > 0) {
      paddleX -= 6;
    }

    // 球移动
    if (!gameOver && !gameWin) {
      ballX += ballDX;
      ballY += ballDY;

      // 墙壁碰撞
      if (ballX + BALL_RADIUS > canvas.width || ballX - BALL_RADIUS < 0) {
        ballDX = -ballDX;
      }
      if (ballY - BALL_RADIUS < 0) {
        ballDY = -ballDY;
      }

      // 底部出界
      if (ballY + BALL_RADIUS > canvas.height) {
        lives--;
        if (lives <= 0) {
          gameOver = true;
        } else {
          resetBall();
        }
      }

      // 挡板碰撞
      if (
        ballY + BALL_RADIUS > canvas.height - 30 &&
        ballY - BALL_RADIUS < canvas.height - 30 + PADDLE_HEIGHT &&
        ballX > paddleX &&
        ballX < paddleX + PADDLE_WIDTH
      ) {
        ballDY = -ballDY;
        // 根据碰撞位置改变水平方向角度
        let hitPos = (ballX - paddleX) / PADDLE_WIDTH;
        ballDX = 6 * (hitPos - 0.5); // -3 ~ 3 左右
        // 保证垂直方向速度
        if (Math.abs(ballDX) < 2) ballDX = ballDX > 0 ? 2 : -2;
        ballDY = -Math.abs(ballDY);
      }

      collisionDetection();
    }

    requestAnimationFrame(draw);
  }

  // 处理窗口大小改变时重新计算砖块布局，但不重置游戏
  window.addEventListener('resize', function() {
    // 更新画布尺寸
    resize();
    // 确保挡板不会超出边界
    if (paddleX + PADDLE_WIDTH > canvas.width) paddleX = canvas.width - PADDLE_WIDTH;
    if (paddleX < 0) paddleX = 0;
    // 球的位置如果超出边界则调整
    if (ballX > canvas.width) ballX = canvas.width - BALL_RADIUS;
    if (ballX < 0) ballX = BALL_RADIUS;
    if (ballY > canvas.height) ballY = canvas.height - BALL_RADIUS;
  });

  // 开始游戏循环
  draw();
})();
