import Grass from './Grass.js';

class Map {
    constructor(width, height) {
        this.grid = Array(width).fill().map(() => Array(height).fill().map(() => []));
        this.predators = [];
        this.prey = [];
        this.predatorCount = Array(width).fill().map(() => Array(height).fill(0));
        this.preyCount = Array(width).fill().map(() => Array(height).fill(0));
        
        this.predatorBorn = 0;
        this.preyBorn = 0;
        this.predatorDead = 0;
        this.preyEaten = 0;
        this.grassEaten = 0;
        this.grassGrown = 0;
        this.preyDead = 0;
        
        // Store reference to map for inner class
        const mapInstance = this;
        
        // Inner Grass class definition
        this.Grass = class {
          constructor() {
            this.nextGrow = 0;
            this.nutrition = 2;
          }
          
          getNextGrow() {
            return this.nextGrow;
          }
          
          resetNextGrow() {
            this.nextGrow = 0;
          }
          
          getNutrition() {
            return this.nutrition;
          }
          
          turn() {
            this.nextGrow++;
            if (this.nextGrow % 25 === 0) {
              this.nutrition++;
              this.nextGrow = 0;
              mapInstance.incrementGrassGrown();
            }
          }
          
          consume() {
            if (this.nutrition > 0) {
              this.nutrition--;
            }
          }
        };
    }
      

    incrementPredatorBorn() {
        this.predatorBorn++;
    }
    
    incrementPreyBorn() {
      this.preyBorn++;
    }
    
    incrementPredatorDead() {
      this.predatorDead++;
    }
    
    incrementPreyEaten() {
      this.preyEaten++;
    }
    
    incrementGrassEaten() {
      this.grassEaten++;
    }
    
    incrementGrassGrown() {
      this.grassGrown++;
    }
    
    incrementPreyDead() {
      this.preyDead++;
    }

    getPredatorBorn(){
        return this.predatorBorn;
    }
    getPreyBorn(){
        return this.preyBorn;
    }
    getPredatorDead(){
        return this.predatorDead;
    }
    getPreyEaten(){
        return this.preyEaten;
    }
    getGrassEaten(){
        return this.grassEaten;
    }
    getGrassGrown(){
        return this.grassGrown;
    }
    getPreyDead(){
        return this.preyDead;
    }
    
    getWidth() {
        return this.grid.length;
    }
    
    getHeight() {
      return this.grid[0].length;
    }
    
    inBounds(x, y) {
      return x >= 0 && y >= 0 && x < this.getWidth() && y < this.getHeight();
    }
    
    getEntitiesAt(x, y) {
      if (this.inBounds(x, y)) {
        return this.grid[x][y];
      }
      return null;
    }
    
    addEntityAt(x, y, entity) {
      if (this.inBounds(x, y)) {
        this.grid[x][y].push(entity);
        if (entity instanceof Predator) {
          this.predators.push(entity);
          this.predatorCount[x][y]++;
        }
        if (entity instanceof Prey) {
          this.prey.push(entity);
          this.preyCount[x][y]++;
        }
        return true;
      }
      return false;
    }

    removeEntityAt(x, y, entity) {
        if (this.inBounds(x, y)) {
          const index = this.grid[x][y].indexOf(entity);
          if (index !== -1) {
            this.grid[x][y].splice(index, 1);
            if (entity instanceof Predator) {
              const predatorIndex = this.predators.indexOf(entity);
              if (predatorIndex !== -1) {
                this.predators.splice(predatorIndex, 1);
              }
              this.predatorCount[x][y]--;
            }
            if (entity instanceof Prey) {
              const preyIndex = this.prey.indexOf(entity);
              if (preyIndex !== -1) {
                this.prey.splice(preyIndex, 1);
              }
              this.preyCount[x][y]--;
            }
            return true;
          }
        }
        return false;
      }

    moveEntity(fromX, fromY, toX, toY, entity) {
      if (this.inBounds(toX, toY)) {
        const index = this.grid[fromX][fromY].indexOf(entity);
        if (index !== -1) {
          this.grid[fromX][fromY].splice(index, 1);
          this.grid[toX][toY].push(entity);
          
          if (entity instanceof Predator) {
            this.predatorCount[fromX][fromY]--;
            this.predatorCount[toX][toY]++;
          } else if (entity instanceof Prey) {
            this.preyCount[fromX][fromY]--;
            this.preyCount[toX][toY]++;
          }
          return true;
        }
      }
      return false;
    }

    getAllPredators() {
        return this.predators;
    }
      
    getAllPreys() {
        return this.prey;
    }


    hasMultiplePredatorsAt(x, y) {
        if (this.inBounds(x, y)) {
          return this.predatorCount[x][y] > 1;
        }
        return false;
    }
    
    hasMultiplePreysAt(x, y) {
        if (this.inBounds(x, y)) {
          return this.preyCount[x][y] > 1;
        }
        return false;
    }
    
    addGrassAt(x, y) {
        if (!this.inBounds(x, y)) {
          return false;
        }
        
        for (const object of this.grid[x][y]) {
          if (object instanceof this.Grass) {
            return false;
          }
        }
        
        this.grid[x][y].push(new this.Grass());
        return true;
    }
    
    removeGrassAt(x, y) {
      if (!this.inBounds(x, y)) {
        return false;
      }
      
      for (let i = 0; i < this.grid[x][y].length; i++) {
        const object = this.grid[x][y][i];
        if (object instanceof this.Grass) {
          this.grid[x][y].splice(i, 1);
          return true;
        }
      }
      
      return false;
    }
    
    getGrassAt(x, y) {
      for (const object of this.grid[x][y]) {
        if (object instanceof this.Grass) {
          return object;
        }
      }
      return null;
    }
    
    checkForGrassAt(x, y) {
      for (const object of this.grid[x][y]) {
        if (object instanceof this.Grass) {
          return true;
        }
      }
      return false;
    }
}
    
export default Map;
