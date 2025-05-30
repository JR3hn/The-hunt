class Predator {

    static map = null;
    static INITIAL_ENERGY = 0;
    static reproductionThreshold = 1;
    static initialLife = 30;

    constructor(initialX, initialY){
        this.lifeSpan = Predator.initialLife;
        this.energy = Predator.INITIAL_ENERGY;
        this.currentX = initialX;
        this.currentY = initialY;
        this.hasActed = false;
    }

    static setMap(mainMap) {
        Predator.map = mainMap;
    }

    static getInitialLife(){
        return Predator.initialLife;
    }

    static getInitialEnergy(){
        return Predator.INITIAL_ENERGY;
    }

    getCurrentX(){
        return this.currentX;
    }

    getEnergy() {
        return this.energy;
    }

    setEnergy(toValue){
        this.energy = toValue;
    }

    getCurrentY(){
        return this.currentY;
    }

    resetTurn(){
        this.hasActed = false;
    }

    isDead() {
        return this.lifeSpan <= 0;
    }
    
    age() {
      this.lifeSpan--;
    }

    consumeEnergy(amount) {
        this.energy -= amount;
    }
    // Called when predators procreate
    // The new predator will be born in a random adjacent tile
    static procreate(x, y) {
      Predator.map.incrementPredatorBorn();
      // Generate random offsets between -4 and +4
      const offsetX = Math.floor(Math.random() * 9) - 4;
      const offsetY = Math.floor(Math.random() * 9) - 4;

      let newX = x + offsetX;
      let newY = y + offsetY;

      // Ensure coordinates are within map bounds
      if (!Predator.map.inBounds(newX, newY)) {
        newX = Math.max(0, Math.min(newX, Predator.map.getWidth() - 1));
        newY = Math.max(0, Math.min(newY, Predator.map.getHeight() - 1));
      }

      return new Predator(newX, newY);
    }
    // Called when a predator kills a prey
    kill(prey){
      if (prey && !prey.isDead()) {
      prey.killed();
      this.energy += 1;
      }
    }
    // Called when a predator hunts
    // The predator will search for prey in the adjacent tiles
    // If it finds one, it will move towards it
    // If it doesn't find any, it will move randomly
    hunt(){
      const prey = this.search();
      if (prey) {
        this.signalOtherPredators(this.findFriends(), prey);
        this.moveToPrey(prey);
        this.hasActed = true;
      } else {
        this.moveRandom();
        this.hasActed = true;
      }
    }
    // Predator will search for friends in the adjacent tiles
    // If it finds one, it will move towards it
    findFriends() {
      const friends = [];
      for (let i = -2; i <= 2; i++) {
        for (let j = -2; j <= 2; j++) {
          if (i === 0 && j === 0) continue;
    
          const targetX = this.currentX + i;
          const targetY = this.currentY + j;
    
          if (Predator.map.inBounds(targetX, targetY)) {
            for (const entity of Predator.map.getEntitiesAt(targetX, targetY)) {
              if (entity.constructor.name === 'Predator') {
                friends.push(entity);
              }
            }
          }
        }
      }
      return friends;
    }
    // Signal other predators to move towards the prey
    signalOtherPredators(predators, prey) {
      if (predators && predators.length > 0) {
        // Only signal one other predator (not all of them)
        const randomIndex = Math.floor(Math.random() * predators.length);
        const predator = predators[randomIndex];
        if (!predator.hasActed) {
            predator.moveToPrey(prey);
            predator.hasActed = true;
        }
      }
    }
    // Searches for other predators to mate with
    mateOtherPredators(predator) {
      if (!predator.hasActed){
          predator.moveToFriend(this);
          predator.hasActed = true;
      }
    }
    // Search for prey in the adjacent tiles
    search() {
      // Check current cell
      for (const entity of Predator.map.getEntitiesAt(this.currentX, this.currentY)) {
        if (entity.constructor.name === 'Prey' && !entity.isDead()) {
          return entity;
        }
      }
      // Create shuffled list of offsets for randomizing
      const offsets = [];
      for (let i = -3; i <= 3; i++) {
        for (let j = -3; j <= 3; j++) {
          if (i !== 0 || j !== 0) offsets.push([i, j]);
        }
      }
      // Shuffle offsets
      for (let k = offsets.length - 1; k > 0; k--) {
        const l = Math.floor(Math.random() * (k + 1));
        [offsets[k], offsets[l]] = [offsets[l], offsets[k]];
      }
      // Search in randomized order
      for (const [i, j] of offsets) {
        const targetX = this.currentX + i;
        const targetY = this.currentY + j;
        if (Predator.map.inBounds(targetX, targetY)) {
          for (const entity of Predator.map.getEntitiesAt(targetX, targetY)) {
            if (entity.constructor.name === 'Prey' && !entity.isDead()) {
              return entity;
            }
          }
        }
      }
      return null;
    }

    // Rest to regain energy
    rest() {
      this.energy += 1;
      this.lifeSpan--;
    }
    // Move method to randomly change the predator's position
    moveRandom() {
      //consumeEnergy(1);
      let newX = this.currentX + Math.floor(Math.random() * 3) - 1;
      let newY = this.currentY + Math.floor(Math.random() * 3) - 1;
  
      newX = Math.max(0, Math.min(newX, Predator.map.getWidth() - 1));
      newY = Math.max(0, Math.min(newY, Predator.map.getHeight() - 1));
  
      Predator.map.moveEntity(this.currentX, this.currentY, newX, newY, this);
  
      this.currentX = newX;
      this.currentY = newY;
    }
    // Move method to move towards the prey
    moveToPrey(prey) {
        //consumeEnergy(1);
        const oldX = this.currentX;
        const oldY = this.currentY;
        
        if (prey.getCurrentX() === this.currentX && prey.getCurrentY() === this.currentY) {
          this.kill(prey);
          return;
        }
    
        if (prey.getCurrentX() > this.currentX) this.currentX++;
        else if (prey.getCurrentX() < this.currentX) this.currentX--;
    
        if (prey.getCurrentY() > this.currentY) this.currentY++;
        else if (prey.getCurrentY() < this.currentY) this.currentY--;
      
        // Update position on the map
        Predator.map.moveEntity(oldX, oldY, this.currentX, this.currentY, this);
    }
    // Move method to move towards the friend
    moveToFriend(predator) {
      //consumeEnergy(1);
      const oldX = this.currentX;
      const oldY = this.currentY;

      if (predator.getCurrentX() > this.currentX) this.currentX++;
      else if (predator.getCurrentX() < this.currentX) this.currentX--;
  
      if (predator.getCurrentY() > this.currentY) this.currentY++;
      else if (predator.getCurrentY() < this.currentY) this.currentY--;
    
      // Update position on the map
      Predator.map.moveEntity(oldX, oldY, this.currentX, this.currentY, this);
  }
  // Turn method to decide the predator's action
    turn() {
      if (!this.hasActed) {
        const friends = this.findFriends();
        if (friends.length > 0 && this.energy >= Predator.reproductionThreshold){
          const randomIndex = Math.floor(Math.random() * friends.length);
          const chosenMate = friends[randomIndex];
          this.moveToFriend(chosenMate);
          this.mateOtherPredators(chosenMate);
          this.hasActed = true;
        } else {
          this.hunt()
        }
      } 
      this.age();
    }
}
    
export default Predator;