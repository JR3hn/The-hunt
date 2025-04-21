class Predator {

    static map = null;
    static INITIAL_ENERGY = 0;
    static INITIAL_LIFE = 50;

    constructor(initialX, initialY){
        this.lifeSpan = Predator.INITIAL_LIFE;
        this.energy = Predator.INITIAL_ENERGY;
        this.currentX = initialX;
        this.currentY = initialY;
        this.hasActed = false;
    }

    static setMap(mainMap) {
        map = mainMap;
    }

    static getInitialLife(){
        return INITIAL_LIFE;
    }

    static getInitialEnergy(){
        return INITIAL_ENERGY;
    }

    getCurrentX(){
        return currentX;
    }

    getEnergy() {
        return this.energy;
    }

    setEnergy(toValue){
        this.energy = toValue;
    }

    getCurrentY(){
        return currentY;
    }

    resetTurn(){
        hasActed = false;
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

    static procreate(x, y) {
        Predator.map.incrementPredatorBorn();
        if (Predator.map.inBounds(x - 1, y - 1)){
            return new Predator(x - 1, y - 1);
        } else {
            return new Predator(x + 1, y + 1);
        }
    }

    kill(prey){
        if (prey){
        prey.killed();
        this.energy += 2;
        this.lifeSpan += 1;
        }
    }

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

    findFriends() {
      const friends = [];
      for (let i = -2; i <= 2; i++) {
        for (let j = -2; j <= 2; j++) {
          if (i === 0 && j === 0) continue;
    
          const targetX = this.currentX + i;
          const targetY = this.currentY + j;
    
          if (Predator.map.inBounds(targetX, targetY)) {
            for (const entity of Predator.map.getEntitiesAt(targetX, targetY)) {
              if (entity instanceof Predator) {
                friends.push(entity);
              }
            }
          }
        }
      }
      return friends;
    }

    signalOtherPredators(predators, prey) {
      if (predators) {
        for (const predator of predators) {
          predator.moveToPrey(prey);
          predator.hasActed = true;
        }
      }
    }

    search() {
      for (let i = -2; i <= 2; i++) {
        for (let j = -2; j <= 2; j++) {
          const targetX = this.currentX + i;
          const targetY = this.currentY + j;
    
          if (Predator.map.inBounds(targetX, targetY)) {
            for (const entity of Predator.map.getEntitiesAt(targetX, targetY)) {
              if (entity instanceof Prey && !entity.isDead()) {
                return entity;
              }
            }
          }
        }
      }
      return null;
    }


    rest() {
        this.energy += 1;
        this.lifeSpan--;
    }

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

    turn() {
        if (!this.hasActed) {
          this.hunt();
          this.age();
        }
    }
}
    
export default Predator;