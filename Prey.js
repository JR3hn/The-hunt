class Prey {
  static map = null;
  static INITIAL_ENERGY = 0;
  static reproductionThreshold = 1;
  static initialLife = 30;
  
  constructor(x, y) {
    this.currentX = x;
    this.currentY = y;
    this.hasActed = false;
    this.lifeSpan = Prey.initialLife;
    this.energy = Prey.INITIAL_ENERGY;
    this.predatorNearby = false;
    this.wasEaten = false;
  }
  
  resetTurn() {
    this.hasActed = false;
  }
  
  hasActed() {
    return this.hasActed;
  }
  
  static setMap(mainMap) {
    Prey.map = mainMap;
  }
  
  getCurrentX() {
    return this.currentX;
  }
  
  getCurrentY() {
    return this.currentY;
  }
  
  getEnergy() {
    return this.energy;
  }
  
  setEnergy(toValue) {
    this.energy = toValue;
  }
  // Called when the prey is killed
  killed() {
    this.lifeSpan = 0;
    this.energy = 0;
    this.wasEaten = true;
    Prey.map.incrementPreyEaten();
  }
  // Check if the prey is dead
  isDead() {
    return this.lifeSpan <= 0;
  }
  // Move method to randomly change the prey's position
  // The prey will move to a random adjacent tile
  move() {
    const newX = this.currentX + Math.floor(Math.random() * 3) - 1;
    const newY = this.currentY + Math.floor(Math.random() * 3) - 1;
    
    if (Prey.map.inBounds(newX, newY)) {
      Prey.map.moveEntity(this.currentX, this.currentY, newX, newY, this);
      this.currentX = newX;
      this.currentY = newY;
    }
  }
  // Check if the prey is near a predator
  // If so, it will try to escape
  escape() {
    this.predatorNearby = false;
    
    for (let i = -2; i <= 2; i++) {
      for (let j = -2; j <= 2; j++) {
        const targetX = this.currentX + i;
        const targetY = this.currentY + j;
        
        if (Prey.map.inBounds(targetX, targetY)) {
          const entities = Prey.map.getEntitiesAt(targetX, targetY);
          for (const entity of entities) {
            if (entity.constructor.name === 'Predator') {
              this.predatorNearby = true;
              break;
            }
          }
        }
        if (this.predatorNearby) break;
      }
      if (this.predatorNearby) break;
    }
    
    if (this.predatorNearby) {
      let escapeX = this.currentX;
      let escapeY = this.currentY;
      
      if (Math.random() < 0.4) { // 40% chance to choose random direction
        escapeX = this.currentX + (Math.random() < 0.5 ? -1 : 1);
        escapeY = this.currentY + (Math.random() < 0.5 ? -1 : 1);
      } else {
        const closestPredator = this.findClosestPredator();
        if (closestPredator.getCurrentX() > this.currentX) escapeX--;
        else if (closestPredator.getCurrentX() < this.currentX) escapeX++;
        if (closestPredator.getCurrentY() > this.currentY) escapeY--;
        else if (closestPredator.getCurrentY() < this.currentY) escapeY++;
      }
      
      if (Prey.map.inBounds(escapeX, escapeY)) {
        Prey.map.moveEntity(this.currentX, this.currentY, escapeX, escapeY, this);
        this.currentX = escapeX;
        this.currentY = escapeY;
        this.lifeSpan -= 1;
      }
    }
  }
  // Find the closest predator within a 2-tile radius
  findClosestPredator() {
    let closestPredator = null;
    let closestDistance = Number.MAX_VALUE;
    
    for (let i = -2; i <= 2; i++) {
      for (let j = -2; j <= 2; j++) {
        const targetX = this.currentX + i;
        const targetY = this.currentY + j;
        
        if (Prey.map.inBounds(targetX, targetY)) {
          const entities = Prey.map.getEntitiesAt(targetX, targetY);
          for (const entity of entities) {
            if (entity.constructor.name === 'Predator') {
              const predator = entity;
              const distance = Math.sqrt(
                Math.pow(predator.getCurrentX() - this.currentX, 2) +
                Math.pow(predator.getCurrentY() - this.currentY, 2)
              );
              
              if (distance < closestDistance) {
                closestDistance = distance;
                closestPredator = predator;
              }
            }
          }
        }
      }
    }
    return closestPredator;
  }
  // Turn method to handle the actions of the prey
  turn() {
    if (this.hasActed) {
      return;
    }
    this.move();
    this.eat();
    this.age();
    this.escape();
    this.hasActed = true;
  }
  // Consume energy method to decrease energy
  consumeEnergy() {
    if (this.energy > 0) {
      this.energy--;
    } else {
      this.lifeSpan--;
    }
  }
  // Age method to decrease life span
  age() {
    if (this.lifeSpan > 0) {
      this.lifeSpan--;
    } else {
      this.energy = 0;
    }
  }
  // Reproduce method to create a new prey
  static procreate(x, y) {
    Prey.map.incrementPreyBorn();
    // Generate random offsets between -4 and +4
    const offsetX = Math.floor(Math.random() * 9) - 4;
    const offsetY = Math.floor(Math.random() * 9) - 4;
    
    let newX = x + offsetX;
    let newY = y + offsetY;

    // Ensure coordinates are within map bounds
    if (!Prey.map.inBounds(newX, newY)) {
      newX = Math.max(0, Math.min(newX, Prey.map.getWidth() - 1));
      newY = Math.max(0, Math.min(newY, Prey.map.getHeight() - 1));
    }

    return new Prey(newX, newY);
  }
  // Eat method to consume grass
  // This method is called when the prey is on the same tile as grass
  // and the grass has not been eaten yet
  eat() {
    const entitiesAtCurrentPosition = Prey.map.getEntitiesAt(this.currentX, this.currentY);
    for (const entity of entitiesAtCurrentPosition) {
      if (entity.constructor.name === 'Grass' && entity.getNutrition() > 0) {
        this.energy += 1;
        entity.consume();
        entity.resetNextGrow();
        Prey.map.incrementGrassEaten();
        break;
      }
    }
  }
  // Rest method to increase energy
  // This method is called when the prey is not near a predator
  rest() {
    if (!this.predatorNearby) {
      this.energy += 2;
      this.hasActed = true;
    }
  }
}

export default Prey;