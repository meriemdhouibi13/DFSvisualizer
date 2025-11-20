import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  @ViewChild('canvas', { static: true }) canvas!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;
  private grid: number[][] = [];
  private rows = 8;
  private cols = 8;
  private start = { x: 0, y: 0 };
  private goal = { x: 7, y: 7 };
  private visited: boolean[][] = [];
  private path: { x: number, y: number }[] = [];
  private visitedOrder: { x: number, y: number }[] = [];
  private isAnimating = false;

  ngOnInit() {
    const canvas = this.canvas.nativeElement;
    canvas.width = 800;
    canvas.height = 800;
    this.ctx = canvas.getContext('2d')!;
    this.initGrid();
    this.drawGrid();
  }

  initGrid() {
    for (let i = 0; i < this.rows; i++) {
      this.grid[i] = [];
      this.visited[i] = [];
      for (let j = 0; j < this.cols; j++) {
        this.grid[i][j] = 0;
        this.visited[i][j] = false;
      }
    }
    // Create a more interesting maze
    this.grid[1][2] = 1;
    this.grid[1][3] = 1;
    this.grid[2][1] = 1;
    this.grid[2][5] = 1;
    this.grid[3][3] = 1;
    this.grid[3][5] = 1;
    this.grid[4][1] = 1;
    this.grid[4][3] = 1;
    this.grid[5][5] = 1;
    this.grid[6][2] = 1;
    this.grid[6][3] = 1;
    this.grid[6][4] = 1;
  }

  drawGrid() {
    const cellSize = 100;
    this.ctx.clearRect(0, 0, 800, 800);
    
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        // Draw cell border
        this.ctx.strokeStyle = '#ddd';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(j * cellSize, i * cellSize, cellSize, cellSize);
        
        // Draw walls
        if (this.grid[i][j] === 1) {
          this.ctx.fillStyle = '#2c3e50';
          this.ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
        }
        
        // Draw start
        if (i === this.start.y && j === this.start.x) {
          this.ctx.fillStyle = '#27ae60';
          this.ctx.beginPath();
          this.ctx.arc(j * cellSize + cellSize / 2, i * cellSize + cellSize / 2, 30, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.fillStyle = 'white';
          this.ctx.font = '20px Arial';
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText('S', j * cellSize + cellSize / 2, i * cellSize + cellSize / 2);
        }
        
        // Draw goal
        if (i === this.goal.y && j === this.goal.x) {
          this.ctx.fillStyle = '#e74c3c';
          this.ctx.beginPath();
          this.ctx.arc(j * cellSize + cellSize / 2, i * cellSize + cellSize / 2, 30, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.fillStyle = 'white';
          this.ctx.font = '20px Arial';
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText('G', j * cellSize + cellSize / 2, i * cellSize + cellSize / 2);
        }
      }
    }
  }

  runDFS() {
    if (this.isAnimating) return;
    this.isAnimating = true;
    this.resetVisited();
    this.path = [];
    this.visitedOrder = [];
    this.dfs(this.start.x, this.start.y);
    this.animate();
  }

  runBFS() {
    if (this.isAnimating) return;
    this.isAnimating = true;
    this.resetVisited();
    this.path = [];
    this.visitedOrder = [];
    this.bfs();
    this.animate();
  }

  resetVisited() {
    this.drawGrid();
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        this.visited[i][j] = false;
      }
    }
  }

  dfs(x: number, y: number): boolean {
    if (x < 0 || x >= this.cols || y < 0 || y >= this.rows || 
        this.grid[y][x] === 1 || this.visited[y][x]) {
      return false;
    }
    
    this.visited[y][x] = true;
    this.visitedOrder.push({ x, y });
    this.path.push({ x, y });
    
    if (x === this.goal.x && y === this.goal.y) {
      return true;
    }
    
    // Try all four directions: up, right, down, left
    const directions = [
      { dx: 0, dy: -1 },
      { dx: 1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 }
    ];
    
    for (const dir of directions) {
      if (this.dfs(x + dir.dx, y + dir.dy)) {
        return true;
      }
    }
    
    this.path.pop();
    return false;
  }

  bfs() {
    const queue: { x: number, y: number, path: { x: number, y: number }[] }[] = [];
    const parent: Map<string, { x: number, y: number } | null> = new Map();
    
    queue.push({ x: this.start.x, y: this.start.y, path: [{ x: this.start.x, y: this.start.y }] });
    this.visited[this.start.y][this.start.x] = true;
    this.visitedOrder.push({ x: this.start.x, y: this.start.y });
    parent.set(`${this.start.x},${this.start.y}`, null);
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      
      if (current.x === this.goal.x && current.y === this.goal.y) {
        this.path = current.path;
        return;
      }
      
      const directions = [
        { dx: 0, dy: -1 },
        { dx: 1, dy: 0 },
        { dx: 0, dy: 1 },
        { dx: -1, dy: 0 }
      ];
      
      for (const dir of directions) {
        const nx = current.x + dir.dx;
        const ny = current.y + dir.dy;
        
        if (nx >= 0 && nx < this.cols && ny >= 0 && ny < this.rows && 
            this.grid[ny][nx] === 0 && !this.visited[ny][nx]) {
          this.visited[ny][nx] = true;
          this.visitedOrder.push({ x: nx, y: ny });
          const newPath = [...current.path, { x: nx, y: ny }];
          queue.push({ x: nx, y: ny, path: newPath });
          parent.set(`${nx},${ny}`, { x: current.x, y: current.y });
        }
      }
    }
  }

  animate() {
    let visitIndex = 0;
    const cellSize = 100;
    
    // First, animate all visited cells
    const visitInterval = setInterval(() => {
      if (visitIndex < this.visitedOrder.length) {
        const cell = this.visitedOrder[visitIndex];
        
        // Skip start and goal for visited visualization
        if ((cell.x !== this.start.x || cell.y !== this.start.y) &&
            (cell.x !== this.goal.x || cell.y !== this.goal.y)) {
          this.ctx.fillStyle = 'rgba(52, 152, 219, 0.4)';
          this.ctx.fillRect(cell.x * cellSize + 5, cell.y * cellSize + 5, cellSize - 10, cellSize - 10);
        }
        
        visitIndex++;
      } else {
        clearInterval(visitInterval);
        
        // Then animate the final path
        let pathIndex = 0;
        const pathInterval = setInterval(() => {
          if (pathIndex < this.path.length) {
            const cell = this.path[pathIndex];
            
            // Skip start and goal for path visualization
            if ((cell.x !== this.start.x || cell.y !== this.start.y) &&
                (cell.x !== this.goal.x || cell.y !== this.goal.y)) {
              this.ctx.fillStyle = '#f39c12';
              this.ctx.fillRect(cell.x * cellSize + 10, cell.y * cellSize + 10, cellSize - 20, cellSize - 20);
            }
            
            pathIndex++;
          } else {
            clearInterval(pathInterval);
            this.isAnimating = false;
          }
        }, 100);
      }
    }, 50);
  }
}