let MapSim;

//Load with cache busting
async function loadModules() {
  const Map = (await import(`./Map.js?v=${window.__APP_VERSION}`)).default;
  const Predator = (await import(`./Predator.js?v=${window.__APP_VERSION}`)).default;
  const Prey = (await import(`./Prey.js?v=${window.__APP_VERSION}`)).default;
  const Grass = (await import(`./Grass.js?v=${window.__APP_VERSION}`)).default;

  MapSim = class MapSim {
    static cellSize = 7;
    static map = null;
    static currentTurn = 0;

    // Creates the canvas with everything that is needed
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      this.ctx = this.canvas.getContext('2d');
      this.isPaused = false;
      this.updateInterval = 50; // milliseconds
      this.lastUpdate = 0;

      this.lastPredatorCount = 400;
      this.lastPreyCount = 2000;
      this.lastCellSize = MapSim.cellSize;
      this.lastReproductionThreshold = Predator.reproductionThreshold;

      this.canvas.width = window.innerWidth - 20;
      this.canvas.height = window.innerHeight - 150;

      this.initializeMap();

      this.setupControls();
      this.animationId = null;

      this.showConfigDialog();

      // Load historical simulation data from localStorage if available
      this.simulationHistory = JSON.parse(localStorage.getItem('simulationHistory')) || [];
    }

    // Creates the map
    initializeMap() {
      const mapWidth = Math.floor(this.canvas.width / MapSim.cellSize);
      const mapHeight = Math.floor(this.canvas.height / MapSim.cellSize);

      MapSim.map = new Map(mapWidth, mapHeight, Grass);
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
    }

    // Show the config dialog before starting a simulation
    showConfigDialog() {
      const existingDialog = document.getElementById('config-dialog');
      if (existingDialog) {
        document.body.removeChild(existingDialog);
      }
      const configDiv = document.createElement('div');
      configDiv.id = 'config-dialog';
      configDiv.style.position = 'fixed';
      configDiv.style.top = '50%';
      configDiv.style.left = '50%';
      configDiv.style.transform = 'translate(-50%, -50%)';
      configDiv.style.backgroundColor = 'white';
      configDiv.style.padding = '20px';
      configDiv.style.borderRadius = '8px';
      configDiv.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
      configDiv.style.zIndex = '1000';
      configDiv.style.width = '300px';

      const header = document.createElement('h2');
      header.textContent = 'Configure the simulation';
      configDiv.appendChild(header);

      const cellSizeLabel = document.createElement('label');
      cellSizeLabel.textContent = 'Cellsize (pixels): ';
      cellSizeLabel.setAttribute('for', 'cell-size');
      configDiv.appendChild(cellSizeLabel);

      const cellSizeInput = document.createElement('input');
      cellSizeInput.type = 'number';
      cellSizeInput.id = 'cell-size';
      cellSizeInput.min = '3';
      cellSizeInput.max = '20';
      cellSizeInput.value = String(this.lastCellSize);
      cellSizeInput.style.width = '100%';
      cellSizeInput.style.marginBottom = '20px';
      configDiv.appendChild(cellSizeInput);

      // Predator input
      const predatorLabel = document.createElement('label');
      predatorLabel.textContent = 'Number of predators: ';
      predatorLabel.setAttribute('for', 'predator-count');
      configDiv.appendChild(predatorLabel);

      const predatorInput = document.createElement('input');
      predatorInput.type = 'number';
      predatorInput.id = 'predator-count';
      predatorInput.min = '0';
      predatorInput.max = '10000';
      predatorInput.value = String(this.lastPredatorCount);
      predatorInput.style.width = '100%';
      predatorInput.style.marginBottom = '15px';
      configDiv.appendChild(predatorInput);

      // Prey input
      const preyLabel = document.createElement('label');
      preyLabel.textContent = 'Number of prey: ';
      preyLabel.setAttribute('for', 'prey-count');
      configDiv.appendChild(preyLabel);

      const preyInput = document.createElement('input');
      preyInput.type = 'number';
      preyInput.id = 'prey-count';
      preyInput.min = '0';
      preyInput.max = '30000';
      preyInput.value = String(this.lastPreyCount);
      preyInput.style.width = '100%';
      preyInput.style.marginBottom = '20px';
      configDiv.appendChild(preyInput);

      // Predator lifespan
      const predatorLifeLabel = document.createElement('label');
      predatorLifeLabel.textContent = 'Predator lifespan: ';
      predatorLifeLabel.setAttribute('for', 'predator-life');
      configDiv.appendChild(predatorLifeLabel);

      const predatorLifeInput = document.createElement('input');
      predatorLifeInput.type = 'number';
      predatorLifeInput.id = 'predator-life';
      predatorLifeInput.min = '5';
      predatorLifeInput.max = '100';
      predatorLifeInput.value = String(Predator.initialLife);
      predatorLifeInput.style.width = '100%';
      predatorLifeInput.style.marginBottom = '15px';
      configDiv.appendChild(predatorLifeInput);

      // Prey lifespan
      const preyLifeLabel = document.createElement('label');
      preyLifeLabel.textContent = 'Prey lifespan: ';
      preyLifeLabel.setAttribute('for', 'prey-life');
      configDiv.appendChild(preyLifeLabel);

      const preyLifeInput = document.createElement('input');
      preyLifeInput.type = 'number';
      preyLifeInput.id = 'prey-life';
      preyLifeInput.min = '5';
      preyLifeInput.max = '100';
      preyLifeInput.value = String(Prey.initialLife);
      preyLifeInput.style.width = '100%';
      preyLifeInput.style.marginBottom = '15px';
      configDiv.appendChild(preyLifeInput);

      // Reproduction threshold
      const reproThresholdLabel = document.createElement('label');
      reproThresholdLabel.textContent = 'Reproduction energy threshold: ';
      reproThresholdLabel.setAttribute('for', 'repro-threshold');
      configDiv.appendChild(reproThresholdLabel);

      const reproThresholdInput = document.createElement('input');
      reproThresholdInput.type = 'number';
      reproThresholdInput.id = 'repro-threshold';
      reproThresholdInput.min = '1';
      reproThresholdInput.max = '100';
      reproThresholdInput.value = String(this.lastReproductionThreshold);
      reproThresholdInput.style.width = '100%';
      reproThresholdInput.style.marginBottom = '15px';
      configDiv.appendChild(reproThresholdInput);

      // Grass growth speed
      const grassSpeedLabel = document.createElement('label');
      grassSpeedLabel.textContent = 'Number of turns for grass growth: ';
      grassSpeedLabel.setAttribute('for', 'grass-speed');
      configDiv.appendChild(grassSpeedLabel);

      const grassSpeedInput = document.createElement('input');
      grassSpeedInput.type = 'number';
      grassSpeedInput.id = 'grass-speed';
      grassSpeedInput.min = '1';
      grassSpeedInput.max = '200';
      grassSpeedInput.value = String(Grass.growthRate);
      grassSpeedInput.style.width = '100%';
      grassSpeedInput.style.marginBottom = '20px';
      configDiv.appendChild(grassSpeedInput);


      // Start button
      const startButton = document.createElement('button');
      startButton.textContent = 'Start Simulation';
      startButton.style.width = '100%';
      startButton.style.padding = '10px';
      startButton.style.backgroundColor = '#4CAF50';
      startButton.style.color = 'white';
      startButton.style.border = 'none';
      startButton.style.borderRadius = '4px';
      startButton.style.cursor = 'pointer';
      startButton.addEventListener('click', () => {
        const predatorCount = parseInt(predatorInput.value, 10);
        const preyCount = parseInt(preyInput.value, 10);
        const cellSize = parseInt(cellSizeInput.value, 10);
        const predatorLife = parseInt(predatorLifeInput.value, 10);
        const preyLife = parseInt(preyLifeInput.value, 10);
        const reproThreshold = parseInt(reproThresholdInput.value, 10);
        const grassSpeed = parseInt(grassSpeedInput.value, 10);

        this.lastPredatorCount = predatorCount;
        this.lastPreyCount = preyCount;
        this.lastCellSize = cellSize;
        this.lastReproductionThreshold = reproThreshold;

        MapSim.cellSize = cellSize;
        Predator.initialLife = predatorLife;
        Prey.initialLife = preyLife;
        Predator.reproductionThreshold = reproThreshold;
        Prey.reproductionThreshold = reproThreshold;
        Grass.growthRate = grassSpeed;

        // Initialize map
        this.initializeMap();

        // Initialize entities with user-configured values
        const mapWidth = Math.floor(this.canvas.width / MapSim.cellSize);
        const mapHeight = Math.floor(this.canvas.height / MapSim.cellSize);
        this.initializeEntities(predatorCount, preyCount, mapWidth, mapHeight);

        // Remove the config dialog
        document.body.removeChild(configDiv);

        // Start the simulation
        this.start();
      });

      configDiv.appendChild(startButton);
      document.body.appendChild(configDiv);
    }

    // Adds all the starting entities
    initializeEntities(predatorCount, preyCount, mapWidth, mapHeight) {
      // Add predators
      for (let i = 0; i < predatorCount; i++) {
        const randomX = Math.floor(Math.random() * mapWidth);
        const randomY = Math.floor(Math.random() * mapHeight);
        MapSim.map.addEntityAt(randomX, randomY, new Predator(randomX, randomY));
      }

      // Add prey
      for (let i = 0; i < preyCount; i++) {
        const randomX = Math.floor(Math.random() * mapWidth);
        const randomY = Math.floor(Math.random() * mapHeight);
        MapSim.map.addEntityAt(randomX, randomY, new Prey(randomX, randomY));
      }
    }

    // Creates all the controls for the user
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
        this.updateInterval = Math.max(50, this.updateInterval - 50);
        console.log(`Update interval: ${this.updateInterval}ms`);
      });

      const slowDownButton = document.createElement('button');
      slowDownButton.textContent = 'Decrease Speed';
      slowDownButton.addEventListener('click', () => {
        this.updateInterval += 50;
        console.log(`Update interval: ${this.updateInterval}ms`);
      });

      const resetButton = document.createElement('button');
      resetButton.textContent = 'Reset Simulation';
      resetButton.style.marginLeft = '20px';
      resetButton.style.backgroundColor = '#2196F3'; // Blue color
      resetButton.style.color = 'white';
      resetButton.style.border = 'none';
      resetButton.style.borderRadius = '4px';
      resetButton.style.padding = '8px 16px';
      resetButton.style.cursor = 'pointer';
      resetButton.addEventListener('click', () => {
        this.resetSimulation();
      });

      controlsDiv.appendChild(pauseButton);
      controlsDiv.appendChild(speedUpButton);
      controlsDiv.appendChild(slowDownButton);
      controlsDiv.appendChild(resetButton);
    }

    // Starts the animation
    start() {
      this.animate(performance.now());
    }

    // Animates each frame after the other
    animate(timestamp) {
      this.animationId = requestAnimationFrame((timestamp) => this.animate(timestamp));

      if (!this.isPaused && timestamp - this.lastUpdate >= this.updateInterval) {
        this.lastUpdate = timestamp;
        this.update();
      }
    }

    // Updates each frame
    update() {
      MapSim.currentTurn++;

      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      // Process grass growth
      for (let x = 0; x < MapSim.map.getWidth(); x++) {
        for (let y = 0; y < MapSim.map.getHeight(); y++) {
          const grass = MapSim.map.getGrassAt(x, y);
          if (grass) {
            // Update the growthrate for all grass objects since they do not change
            if (grass.instanceGrowthRate !== Grass.growthRate) {
              grass.instanceGrowthRate = Grass.growthRate;
              grass.nextGrow = 0; // Reset the counter when changing rate
            }
            grass.turn();
            // Make sure to access getNutrition only if grass exists
            if (grass.getNutrition() >= 1) {
              this.ctx.fillStyle = 'green';
            } else {
              this.ctx.fillStyle = '#3D2413'; // Brown for no nutrition
            }
            this.ctx.fillRect(
              x * MapSim.cellSize, 
              y * MapSim.cellSize, 
              MapSim.cellSize, 
              MapSim.cellSize
            );
          }
        }
      }

      // Process new predators and prey
      for (let x = 0; x < this.newPredators.length; x++) {
        for (let y = 0; y < this.newPredators[x].length; y++) {
          if (this.newPredators[x][y]) {
            const newPredator = Predator.procreate(x, y);
            MapSim.map.addEntityAt(newPredator.getCurrentX(), newPredator.getCurrentY(), newPredator);
            this.newPredators[x][y] = false;
          }
          // Check for new prey in the same cell
          if (this.newPreys[x][y]) {
            const newPrey = Prey.procreate(x, y);
            MapSim.map.addEntityAt(newPrey.getCurrentX(), newPrey.getCurrentY(), newPrey);
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
      // Remove dead prey
      for (const prey of this.deadPreys) {
        if (!prey.wasEaten) {
          MapSim.map.incrementPreyDead();
        }
        MapSim.map.removeEntityAt(prey.getCurrentX(), prey.getCurrentY(), prey);
      }
      this.deadPreys = [];

      // Process predator turns
      for (const predator of MapSim.map.getAllPredators()) {
        predator.turn();
        const currentX = predator.getCurrentX();
        const currentY = predator.getCurrentY();

        if (MapSim.map.hasMultiplePredatorsAt(currentX, currentY) && predator.getEnergy() >= Predator.reproductionThreshold) {
          this.newPredators[currentX][currentY] = true;
          predator.setEnergy(0);
        }

        if (predator.isDead()) {
          this.deadPredators.push(predator);
        } else {
          this.ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
          this.ctx.strokeStyle = 'black';
          this.ctx.fillRect(
            currentX * MapSim.cellSize,
            currentY * MapSim.cellSize,
            MapSim.cellSize,
            MapSim.cellSize
          );
          this.ctx.strokeRect(
            currentX * MapSim.cellSize,
            currentY * MapSim.cellSize,
            MapSim.cellSize,
            MapSim.cellSize
          );
        }
      }

      // Process prey turns
      for (const prey of MapSim.map.getAllPreys()) {
        prey.turn();
        const currentX = prey.getCurrentX();
        const currentY = prey.getCurrentY();
        // Reproduction check
        if (MapSim.map.hasMultiplePreysAt(currentX, currentY) && prey.getEnergy() >= Prey.reproductionThreshold) {
          this.newPreys[currentX][currentY] = true;
          prey.setEnergy(0);
        }

        if (prey.isDead()) {
          this.deadPreys.push(prey);
        } else {
          this.ctx.fillStyle = 'rgba(0, 0, 255, 0.7)';
          this.ctx.strokeStyle = 'black';
          this.ctx.fillRect(
            currentX * MapSim.cellSize,
            currentY * MapSim.cellSize,
            MapSim.cellSize,
            MapSim.cellSize
          );
          this.ctx.strokeRect(
            currentX * MapSim.cellSize,
            currentY * MapSim.cellSize,
            MapSim.cellSize,
            MapSim.cellSize
          );
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
      if ((MapSim.map.getAllPredators().length === 0 || MapSim.map.getAllPreys().length === 0) && MapSim.currentTurn > 0) {
        cancelAnimationFrame(this.animationId);
        this.showFinalStatistics();
      }

      // Update stats display
      this.updateStats();
    }

    updateStats() {
      const statsDiv = document.getElementById('stats');
      statsDiv.innerHTML = `
        <div class="stats-box">
          <p>Turn: ${MapSim.currentTurn}</p>
          <p>Predators: ${MapSim.map.getAllPredators().length} (Born: ${MapSim.map.getPredatorBorn()}, Dead: ${MapSim.map.getPredatorDead()})</p>
          <p>Prey: ${MapSim.map.getAllPreys().length} (Born: ${MapSim.map.getPreyBorn()}, Eaten: ${MapSim.map.getPreyEaten()}, Starved: ${MapSim.map.getPreyDead()}, Dead: ${MapSim.map.getPreyDead() + MapSim.map.getPreyEaten()})</p>
          <p>Grass: (Eaten: ${MapSim.map.getGrassEaten()}, Grown: ${MapSim.map.getGrassGrown()})</p>
        </div>
      `;
    }

    showFinalStatistics() {
      // Create simulation summary object
      const simulationData = {
        id: Date.now(),
        timestamp: new Date().toLocaleString(),
        turns: MapSim.currentTurn,
        predator: {
          born: MapSim.map.getPredatorBorn(),
          dead: MapSim.map.getPredatorDead(),
          final: MapSim.map.getAllPredators().length
        },
        prey: {
          born: MapSim.map.getPreyBorn(),
          eaten: MapSim.map.getPreyEaten(),
          aged: MapSim.map.getPreyDead(),
          final: MapSim.map.getAllPreys().length
        },
        grass: {
          grown: MapSim.map.getGrassGrown(),
          eaten: MapSim.map.getGrassEaten()
        },
        config: {
          predatorCount: this.lastPredatorCount,
          preyCount: this.lastPreyCount,
          cellSize: MapSim.cellSize,
          reproThreshold: Predator.reproductionThreshold,
          grassSpeed: Grass.growthRate
        }
      };
      
      // Add to history
      this.simulationHistory.push(simulationData);
      
      // Limit history to last 20 simulations
      if (this.simulationHistory.length > 20) {
        this.simulationHistory.shift(); // Remove oldest
      }
      
      // Save to localStorage
      localStorage.setItem('simulationHistory', JSON.stringify(this.simulationHistory));
      
      // Create popup for final stats
      const finalStatsDiv = document.createElement('div');
      finalStatsDiv.id = 'final-stats-popup'; // Add ID for easier selection
      finalStatsDiv.style.position = 'fixed';
      finalStatsDiv.style.top = '50%';
      finalStatsDiv.style.left = '50%';
      finalStatsDiv.style.transform = 'translate(-50%, -50%)';
      finalStatsDiv.style.backgroundColor = 'white';
      finalStatsDiv.style.padding = '20px';
      finalStatsDiv.style.borderRadius = '8px';
      finalStatsDiv.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
      finalStatsDiv.style.zIndex = '1000';
      finalStatsDiv.style.maxWidth = '500px';
      finalStatsDiv.style.width = '80%';

      // Create header
      const header = document.createElement('h2');
      header.textContent = 'Final Statistics';
      finalStatsDiv.appendChild(header);

      // Create content
      const content = document.createElement('div');
      content.innerHTML = `
        <p><strong>Antal omgångar:</strong> ${MapSim.currentTurn}</p>

        <h3>Predators</h3>
        <p>Born: ${MapSim.map.getPredatorBorn()}</p>
        <p>Dead: ${MapSim.map.getPredatorDead()}</p>

        <h3>Prey</h3>
        <p>Born: ${MapSim.map.getPreyBorn()}</p>
        <p>Eaten: ${MapSim.map.getPreyEaten()}</p>
        <p>Starved: ${MapSim.map.getPreyDead()}</p>
        <p>Dead: ${MapSim.map.getPreyDead() + MapSim.map.getPreyEaten()}</p>

        <h3>Grass</h3>
        <p>Eaten: ${MapSim.map.getGrassEaten()}</p>
        <p>Grown: ${MapSim.map.getGrassGrown()}</p>
      `;
      finalStatsDiv.appendChild(content);

      // Create restart button
      const restartButton = document.createElement('button');
      restartButton.textContent = 'Start New Simulation';
      restartButton.style.marginTop = '15px';
      restartButton.style.padding = '10px 16px';
      restartButton.style.backgroundColor = '#4CAF50';
      restartButton.style.color = 'white';
      restartButton.style.border = 'none';
      restartButton.style.borderRadius = '4px';
      restartButton.style.cursor = 'pointer';
      restartButton.style.width = '100%';
      restartButton.addEventListener('click', () => this.resetSimulation());
      finalStatsDiv.appendChild(restartButton);
      
      
      // Create history button
      const historyButton = document.createElement('button');
      historyButton.textContent = 'Simulation History';
      historyButton.style.marginLeft = '20px';
      historyButton.style.backgroundColor = '#9C27B0'; // Purple color
      historyButton.style.color = 'white';
      historyButton.style.border = 'none';
      historyButton.style.borderRadius = '4px';
      historyButton.style.padding = '8px 16px';
      historyButton.style.cursor = 'pointer';
      historyButton.addEventListener('click', () => {
        this.showHistoricalComparison();
      });
      finalStatsDiv.appendChild(historyButton);
      


      // Add to document body
      document.body.appendChild(finalStatsDiv);
    }

    resetSimulation() {
      // Remove the final stats popup if it exists
      const finalStatsPopup = document.getElementById('final-stats-popup');
      if (finalStatsPopup) {
        document.body.removeChild(finalStatsPopup);
      }

      // Stop the animation
      cancelAnimationFrame(this.animationId);

      // Reset the simulation state
      MapSim.currentTurn = 0;

      // Reset the map by calling the initializeMap method
      this.initializeMap();

      // Reset all map statistics
      if (MapSim.map) {
        MapSim.map.predatorBorn = 0;
        MapSim.map.preyBorn = 0;
        MapSim.map.predatorDead = 0;
        MapSim.map.preyEaten = 0;
        MapSim.map.grassEaten = 0;
        MapSim.map.grassGrown = 0;
        MapSim.map.preyDead = 0;
      }

      // Show the configuration dialog again
      this.showConfigDialog();

      // Clear the stats display
      const statsDiv = document.getElementById('stats');
      statsDiv.innerHTML = '';
    }

    showHistoricalComparison() {
      // Check if we have any historical data
      if (this.simulationHistory.length === 0) {
        alert('Ingen simulationshistorik tillgänglig ännu.');
        return;
      }
      
      // Pause the simulation while viewing charts
      const wasPaused = this.isPaused;
      this.isPaused = true;
      
      // Create popup container
      const historyDiv = document.createElement('div');
      historyDiv.id = 'history-popup';
      historyDiv.style.position = 'fixed';
      historyDiv.style.top = '50%';
      historyDiv.style.left = '50%';
      historyDiv.style.transform = 'translate(-50%, -50%)';
      historyDiv.style.backgroundColor = 'white';
      historyDiv.style.padding = '20px';
      historyDiv.style.borderRadius = '8px';
      historyDiv.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
      historyDiv.style.zIndex = '1000';
      historyDiv.style.width = '800px';
      historyDiv.style.height = '600px';
      historyDiv.style.overflowY = 'auto';
      
      // Create header
      const header = document.createElement('h2');
      header.textContent = 'Simulation History';
      historyDiv.appendChild(header);
      
      // Create tabs for different metrics
      const tabsDiv = document.createElement('div');
      tabsDiv.style.display = 'flex';
      tabsDiv.style.marginBottom = '15px';
      
      const tabs = [
        { id: 'population', name: 'Population' },
        { id: 'births', name: 'Born' },
        { id: 'deaths', name: 'Dead' },
        { id: 'grass', name: 'Grass' },
        { id: 'config', name: 'Configuration' }
      ];
      
      tabs.forEach(tab => {
        const tabBtn = document.createElement('button');
        tabBtn.textContent = tab.name;
        tabBtn.id = `tab-${tab.id}`;
        tabBtn.style.flex = '1';
        tabBtn.style.padding = '10px';
        tabBtn.style.border = '1px solid #ccc';
        tabBtn.style.backgroundColor = '#f0f0f0';
        tabBtn.style.cursor = 'pointer';
        tabBtn.addEventListener('click', () => this.switchHistoryTab(tab.id));
        tabsDiv.appendChild(tabBtn);
      });
      
      historyDiv.appendChild(tabsDiv);
      
      // Create canvas containers for each chart
      tabs.forEach(tab => {
        const container = document.createElement('div');
        container.id = `chart-${tab.id}`;
        container.style.display = tab.id === 'population' ? 'block' : 'none';
        container.style.height = '400px';
        
        const canvas = document.createElement('canvas');
        canvas.id = `canvas-${tab.id}`;
        container.appendChild(canvas);
        historyDiv.appendChild(container);
      });
      
      // Add clear history button
      const clearButton = document.createElement('button');
      clearButton.textContent = 'Clear History';
      clearButton.style.marginTop = '20px';
      clearButton.style.marginRight = '10px';
      clearButton.style.padding = '10px 16px';
      clearButton.style.backgroundColor = '#FF5722';
      clearButton.style.color = 'white';
      clearButton.style.border = 'none';
      clearButton.style.borderRadius = '4px';
      clearButton.style.cursor = 'pointer';
      clearButton.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all simulation history?')) {
          this.simulationHistory = [];
          localStorage.removeItem('simulationHistory');
          document.body.removeChild(historyDiv);
          this.isPaused = wasPaused; // Restore pause state
        }
      });
      
      // Add close button
      const closeButton = document.createElement('button');
      closeButton.textContent = 'Close';
      closeButton.style.marginTop = '20px';
      closeButton.style.padding = '10px 16px';
      closeButton.style.backgroundColor = '#2196F3';
      closeButton.style.color = 'white';
      closeButton.style.border = 'none';
      closeButton.style.borderRadius = '4px';
      closeButton.style.cursor = 'pointer';
      
      closeButton.addEventListener('click', () => {
        document.body.removeChild(historyDiv);
        this.isPaused = wasPaused; // Restore pause state
      });
      
      const buttonContainer = document.createElement('div');
      buttonContainer.style.display = 'flex';
      buttonContainer.style.justifyContent = 'space-between';
      buttonContainer.appendChild(clearButton);
      buttonContainer.appendChild(closeButton);
      
      historyDiv.appendChild(buttonContainer);
      document.body.appendChild(historyDiv);
      
      // Create the charts
      this.createPopulationHistoryChart();
      this.createBirthsHistoryChart();
      this.createDeathsHistoryChart();
      this.createGrassHistoryChart();
      this.createConfigHistoryChart();
      
      // Activate the first tab
      document.getElementById('tab-population').click();
    }

    // Switch between chart tabs
    switchHistoryTab(tabId) {
      const tabs = ['population', 'births', 'deaths', 'grass', 'config'];
      tabs.forEach(tab => {
        const element = document.getElementById(`chart-${tab}`);
        if (element) {
          element.style.display = tab === tabId ? 'block' : 'none';
        }
        const tabButton = document.getElementById(`tab-${tab}`);
        if (tabButton) {
          tabButton.style.backgroundColor = tab === tabId ? '#ddd' : '#f0f0f0';
          tabButton.style.fontWeight = tab === tabId ? 'bold' : 'normal';
        }
      });
    }

    // Create chart for population comparison
    createPopulationHistoryChart() {
      const ctx = document.getElementById('canvas-population').getContext('2d');
      
      // Extract data
      const labels = this.simulationHistory.map((data, index) => 
        `Sim ${index + 1}`);
      
      const predatorFinal = this.simulationHistory.map(data => data.predator.final);
      const preyFinal = this.simulationHistory.map(data => data.prey.final);
      
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Final number of predators',
              data: predatorFinal,
              backgroundColor: 'rgba(255, 99, 132, 0.5)',
              borderColor: 'rgb(255, 99, 132)',
              borderWidth: 1
            },
            {
              label: 'Final number of prey',
              data: preyFinal,
              backgroundColor: 'rgba(54, 162, 235, 0.5)',
              borderColor: 'rgb(54, 162, 235)',
              borderWidth: 1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true
            }
          },
          plugins: {
            title: {
              display: true,
              text: 'Final population per simulation'
            }
          }
        }
      });
    }

    // Create chart for births comparison
    createBirthsHistoryChart() {
      const ctx = document.getElementById('canvas-births').getContext('2d');
      
      // Extract data
      const labels = this.simulationHistory.map((data, index) => 
        `Sim ${index + 1}`);
      
      const predatorBorn = this.simulationHistory.map(data => data.predator.born);
      const preyBorn = this.simulationHistory.map(data => data.prey.born);
      
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Born Predators',
              data: predatorBorn,
              backgroundColor: 'rgba(255, 99, 132, 0.5)',
              borderColor: 'rgb(255, 99, 132)',
              borderWidth: 1
            },
            {
              label: 'Born prey',
              data: preyBorn,
              backgroundColor: 'rgba(54, 162, 235, 0.5)',
              borderColor: 'rgb(54, 162, 235)',
              borderWidth: 1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true
            }
          },
          plugins: {
            title: {
              display: true,
              text: 'Number of born per simulation'
            }
          }
        }
      });
    }

    // Create chart for deaths comparison
    createDeathsHistoryChart() {
      const ctx = document.getElementById('canvas-deaths').getContext('2d');
      
      // Extract data
      const labels = this.simulationHistory.map((data, index) => 
        `Sim ${index + 1}`);
      
      const predatorDead = this.simulationHistory.map(data => data.predator.dead);
      const preyEaten = this.simulationHistory.map(data => data.prey.eaten);
      const preyStarved = this.simulationHistory.map(data => data.prey.aged);
      
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Dead predators',
              data: predatorDead,
              backgroundColor: 'rgba(255, 99, 132, 0.5)',
              borderColor: 'rgb(255, 99, 132)',
              borderWidth: 1
            },
            {
              label: 'Dead prey',
              data: preyEaten,
              backgroundColor: 'rgba(54, 162, 235, 0.5)',
              borderColor: 'rgb(54, 162, 235)',
              borderWidth: 1
            },
            {
              label: 'Aged prey',
              data: preyStarved,
              backgroundColor: 'rgba(75, 192, 192, 0.5)',
              borderColor: 'rgb(75, 192, 192)',
              borderWidth: 1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true
            }
          },
          plugins: {
            title: {
              display: true,
              text: 'Number of dead per simulation'
            }
          }
        }
      });
    }

    // Create chart for grass comparison
    createGrassHistoryChart() {
      const ctx = document.getElementById('canvas-grass').getContext('2d');
      
      // Extract data
      const labels = this.simulationHistory.map((data, index) => 
        `Sim ${index + 1}`);
      
      const grassGrown = this.simulationHistory.map(data => data.grass.grown);
      const grassEaten = this.simulationHistory.map(data => data.grass.eaten);
      
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Grown grass',
              data: grassGrown,
              backgroundColor: 'rgba(75, 192, 192, 0.5)',
              borderColor: 'rgb(75, 192, 192)',
              borderWidth: 1
            },
            {
              label: 'Grass eaten',
              data: grassEaten,
              backgroundColor: 'rgba(153, 102, 255, 0.5)',
              borderColor: 'rgb(153, 102, 255)',
              borderWidth: 1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true
            }
          },
          plugins: {
            title: {
              display: true,
              text: 'Grass growth per simulation'
            }
          }
        }
      });
    }

    // Create chart for configuration comparison
    createConfigHistoryChart() {
      const ctx = document.getElementById('canvas-config').getContext('2d');
      
      // Extract data
      const labels = this.simulationHistory.map((data, index) => 
        `Sim ${index + 1}`);
      
      const predatorInitial = this.simulationHistory.map(data => data.config.predatorCount);
      const preyInitial = this.simulationHistory.map(data => data.config.preyCount);
      const turns = this.simulationHistory.map(data => data.turns);
      
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Initial amount of predators',
              data: predatorInitial,
              backgroundColor: 'rgba(255, 99, 132, 0.5)',
              borderColor: 'rgb(255, 99, 132)',
              borderWidth: 1,
              yAxisID: 'y'
            },
            {
              label: 'Initial amount of prey',
              data: preyInitial,
              backgroundColor: 'rgba(54, 162, 235, 0.5)',
              borderColor: 'rgb(54, 162, 235)',
              borderWidth: 1,
              yAxisID: 'y'
            },
            {
              label: 'Number of turns',
              data: turns,
              backgroundColor: 'rgba(75, 192, 192, 0.5)',
              borderColor: 'rgb(75, 192, 192)',
              borderWidth: 1,
              yAxisID: 'y1'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              position: 'left',
              title: {
                display: true,
                text: 'Initial amount'
              }
            },
            y1: {
              beginAtZero: true,
              position: 'right',
              grid: {
                drawOnChartArea: false
              },
              title: {
                display: true,
                text: 'Turns'
              }
            }
          },
          plugins: {
            title: {
              display: true,
              text: 'Configuration och time per simulation'
            }
          }
        }
      });
    }
  }
  return MapSim
}
export default async function() {
  return await loadModules();
}