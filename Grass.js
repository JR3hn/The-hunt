class Grass {
    static growthRate = 20;

    constructor(map) {
        this.nextGrow = 0;
        this.nutrition = 1;
        this.map = map;
        this.instanceGrowthRate = Grass.growthRate;
    }

    getNextGrow(){
        return this.nextGrow;
    }

    resetNextGrow(){
        this.nextGrow = 0;
    }

    getNutrition(){
        return this.nutrition;
    }

    turn(){
        this.nextGrow++;
        if (this.nextGrow % this.instanceGrowthRate === 0 && this.nutrition <= 2){
            this.nutrition++;
            this.nextGrow = 0;
            this.map.incrementGrassGrown();
        }
    }

    // Add this method
    updateGrowthRate() {
        this.instanceGrowthRate = Grass.growthRate;
        this.nextGrow = 0;
    }

    consume(){
        if (this.nutrition > 0){
            this.nutrition--;
        }
    }
}

export default Grass;