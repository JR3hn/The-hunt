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
  
  killed() {
    this.lifeSpan = 0;
    this.energy = 0;
    Prey.map.incrementPreyEaten();
  }
  
  isDead() {
    return this.lifeSpan <= 0;
  }
  
  move() {
    const newX = this.currentX + Math.floor(Math.random() * 3) - 1;
    const newY = this.currentY + Math.floor(Math.random() * 3) - 1;
    
    if (Prey.map.inBounds(newX, newY)) {
      Prey.map.moveEntity(this.currentX, this.currentY, newX, newY, this);
      this.currentX = newX;
      this.currentY = newY;
    }
  }
  
  escape() {
    this.predatorNearby = false;
    
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
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
      
      if (Math.random() < 0.3) { // 30% chance to choose random direction
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
  
  consumeEnergy() {
    if (this.energy > 0) {
      this.energy--;
    } else {
      this.lifeSpan--;
    }
  }
  
  age() {
    if (this.lifeSpan > 0) {
      this.lifeSpan--;
    } else {
      this.energy = 0;
    }
  }
  
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
  
  rest() {
    if (!this.predatorNearby) {
      this.energy += 2;
      this.hasActed = true;
    }
  }
}

export default Prey;