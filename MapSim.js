import Map from './Map.js';
import Predator from './Predator.js';
import Prey from './Prey.js';
import Grass from './Grass.js';

class MapSim {
  static CELL_SIZE = 7;
  static map = null;
  static currentTurn = 0;
  
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.isPaused = false;
    this.updateInterval = 500; // milliseconds
    this.lastUpdate = 0;
    
    this.canvas.width = window.innerWidth - 20;
    this.canvas.height = window.innerHeight - 150;
    
    const mapWidth = Math.floor(this.canvas.width / MapSim.CELL_SIZE);
    const mapHeight = Math.floor(this.canvas.height / MapSim.CELL_SIZE);
    
    MapSim.map = new Map(mapWidth, mapHeight);
    Predator.setMap(MapSim.map);
    Prey.setMap(MapSim.map);
    
    this.newPredators = Array(mapWidth).fill().map(() => Array(mapHeight).fill(false));
    this.deadPredators = [];
    this.newPreys = Array(mapWidth).fill().map(() => Array(mapHeight).fill(false));
    this.deadPreys = [];
    
    // Initialize grass
    for (let x = 0; x < mapWidth; x++) {
      for (let y = 0; y < mapHeight; y++) {
        MapSim.map.addGrassAt(x, y);
      }
    }
    
    // Add initial predators and prey
    for (let i = 0; i < 400; i++) {
      const randomX = Math.floor(Math.random() * mapWidth);
      const randomY = Math.floor(Math.random() * mapHeight);
      MapSim.map.addEntityAt(randomX, randomY, new Predator(randomX, randomY));
    }
    
    for (let i = 0; i < 600; i++) {
      const randomX = Math.floor(Math.random() * mapWidth);
      const randomY = Math.floor(Math.random() * mapHeight);
      MapSim.map.addEntityAt(randomX, randomY, new Prey(randomX, randomY));
    }
    
    this.setupControls();
    this.animationId = null;
  }
  
  setupControls() {
    const controlsDiv = document.getElementById('controls');
    
    const pauseButton = document.createElement('button');
    pauseButton.textContent = 'Pause';
    pauseButton.addEventListener('click', () => {
      this.isPaused = !this.isPaused;
      pauseButton.textContent = this.isPaused ? 'Continue' : 'Pause';
    });
    
    const speedUpButton = document.createElement('button');
    speedUpButton.textContent = 'Increase Speed';
    speedUpButton.addEventListener('click', () => {
      this.updateInterval = Math.max(100, this.updateInterval - 100);
      console.log(`Update interval: ${this.updateInterval}ms`);
    });
    
    const slowDownButton = document.createElement('button');
    slowDownButton.textContent = 'Decrease Speed';
    slowDownButton.addEventListener('click', () => {
      this.updateInterval += 100;
      console.log(`Update interval: ${this.updateInterval}ms`);
    });
    
    controlsDiv.appendChild(pauseButton);
    controlsDiv.appendChild(speedUpButton);
    controlsDiv.appendChild(slowDownButton);
  }
  
  start() {
    this.animate(performance.now());
  }
  
  animate(timestamp) {
    this.animationId = requestAnimationFrame((timestamp) => this.animate(timestamp));
    
    if (!this.isPaused && timestamp - this.lastUpdate >= this.updateInterval) {
      this.lastUpdate = timestamp;
      this.update();
    }
    
    this.render();
  }
  
  update() {
    MapSim.currentTurn++;
    
    // Process grass growth
    for (let x = 0; x < MapSim.map.getWidth(); x++) {
      for (let y = 0; y < MapSim.map.getHeight(); y++) {
        const grass = MapSim.map.getGrassAt(x, y);
        if (grass) grass.turn();
      }
    }
    
    // Process new predators and prey
    for (let x = 0; x < this.newPredators.length; x++) {
      for (let y = 0; y < this.newPredators[x].length; y++) {
        if (this.newPredators[x][y]) {
          const newPredator = Predator.procreate(x, y);
          MapSim.map.addEntityAt(x, y, newPredator);
          this.newPredators[x][y] = false;
        }
        
        if (this.newPreys[x][y]) {
          const newPrey = Prey.procreate(x, y);
          MapSim.map.addEntityAt(x, y, newPrey);
          this.newPreys[x][y] = false;
        }
      }
    }
    
    // Remove dead entities
    for (const predator of this.deadPredators) {
      MapSim.map.incrementPredatorDead();
      MapSim.map.removeEntityAt(predator.getCurrentX(), predator.getCurrentY(), predator);
    }
    this.deadPredators = [];
    
    for (const prey of this.deadPreys) {
      MapSim.map.incrementPreyDead();
      MapSim.map.removeEntityAt(prey.getCurrentX(), prey.getCurrentY(), prey);
    }
    this.deadPreys = [];
    
    // Process predator turns
    for (const predator of MapSim.map.getAllPredators()) {
      predator.turn();
      const currentX = predator.getCurrentX();
      const currentY = predator.getCurrentY();
      
      if (MapSim.map.hasMultiplePredatorsAt(currentX, currentY) && predator.getEnergy() > 2) {
        this.newPredators[currentX][currentY] = true;
        predator.setEnergy(0);
      }
      
      if (predator.isDead()) {
        this.deadPredators.push(predator);
      }
    }
    
    // Process prey turns
    for (const prey of MapSim.map.getAllPreys()) {
      prey.turn();
      const currentX = prey.getCurrentX();
      const currentY = prey.getCurrentY();
      
      if (MapSim.map.hasMultiplePreysAt(currentX, currentY) && prey.getEnergy() > 3) {
        this.newPreys[currentX][currentY] = true;
        prey.setEnergy(0);
      }
      
      if (prey.isDead()) {
        this.deadPreys.push(prey);
      }
    }
    
    // Reset turns
    for (const predator of MapSim.map.getAllPredators()) {
      predator.resetTurn();
    }
    
    for (const prey of MapSim.map.getAllPreys()) {
      prey.resetTurn();
    }
    
    // Check if simulation should end
    if (MapSim.map.getAllPredators().length === 0 && MapSim.map.getAllPreys().length === 0) {
      cancelAnimationFrame(this.animationId);
      this.showFinalStatistics();
    }
    
    // Update stats display
    this.updateStats();
  }
  
  render() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw grass
    for (let x = 0; x < MapSim.map.getWidth(); x++) {
      for (let y = 0; y < MapSim.map.getHeight(); y++) {
        const grass = MapSim.map.getGrassAt(x, y);
        if (grass) {
          if (grass.getNutrition() >= 1) {
            this.ctx.fillStyle = 'green';
          } else {
            this.ctx.fillStyle = '#3D2413'; // Brown for no nutrition
          }
          this.ctx.fillRect(
            x * MapSim.CELL_SIZE, 
            y * MapSim.CELL_SIZE, 
            MapSim.CELL_SIZE, 
            MapSim.CELL_SIZE
          );
        }
      }
    }
    
    // Draw prey
    for (const prey of MapSim.map.getAllPreys()) {
      this.ctx.fillStyle = 'rgba(0, 0, 255, 0.7)';
      this.ctx.strokeStyle = 'black';
      this.ctx.fillRect(
        prey.getCurrentX() * MapSim.CELL_SIZE,
        prey.getCurrentY() * MapSim.CELL_SIZE,
        MapSim.CELL_SIZE,
        MapSim.CELL_SIZE
      );
      this.ctx.strokeRect(
        prey.getCurrentX() * MapSim.CELL_SIZE,
        prey.getCurrentY() * MapSim.CELL_SIZE,
        MapSim.CELL_SIZE,
        MapSim.CELL_SIZE
      );
    }
    
    // Draw predators
    for (const predator of MapSim.map.getAllPredators()) {
      this.ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
      this.ctx.strokeStyle = 'black';
      this.ctx.fillRect(
        predator.getCurrentX() * MapSim.CELL_SIZE,
        predator.getCurrentY() * MapSim.CELL_SIZE,
        MapSim.CELL_SIZE,
        MapSim.CELL_SIZE
      );
      this.ctx.strokeRect(
        predator.getCurrentX() * MapSim.CELL_SIZE,
        predator.getCurrentY() * MapSim.CELL_SIZE,
        MapSim.CELL_SIZE,
        MapSim.CELL_SIZE
      );
    }
  }
  
  updateStats() {
    const statsDiv = document.getElementById('stats');
    statsDiv.innerHTML = `
      <div class="stats-box">
        <p>Turn: ${MapSim.currentTurn}</p>
        <p>Predators: ${MapSim.map.getAllPredators().length} (Born: ${MapSim.map.getPredatorBorn()}, Dead: ${MapSim.map.getPredatorDead()})</p>
        <p>Prey: ${MapSim.map.getAllPreys().length} (Born: ${MapSim.map.getPreyBorn()}, Eaten: ${MapSim.map.getPreyEaten()}, Dead: ${MapSim.map.getPreyDead()})</p>
        <p>Grass: (Eaten: ${MapSim.map.getGrassEaten()}, Grown: ${MapSim.map.getGrassGrown()})</p>
      </div>
    `;
  }

  showFinalStatistics() {
    const statsDiv = document.getElementById('stats');
    statsDiv.innerHTML += `
      <div class="final-stats">
        <h2>Simulation Complete</h2>
        <p>Total Turns: ${MapSim.currentTurn}</p>
        <p>Predators Born: ${MapSim.map.getPredatorBorn()}</p>
        <p>Predators Dead: ${MapSim.map.getPredatorDead()}</p>
        <p>Prey Born: ${MapSim.map.getPreyBorn()}</p>
        <p>Prey Eaten: ${MapSim.map.getPreyEaten()}</p>
        <p>Prey Dead: ${MapSim.map.getPreyDead()}</p>
        <p>Grass Eaten: ${MapSim.map.getGrassEaten()}</p>
        <p>Grass Grown: ${MapSim.map.getGrassGrown()}</p>
      </div>
    `;
  }
}

export default MapSim;