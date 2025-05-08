class Grass {
    static growthRate = 15;

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
    // Turn method to handle the growth of grass
    turn(){
        this.nextGrow++;
        if (this.nextGrow % this.instanceGrowthRate === 0 && this.nutrition <= 2){
            this.nutrition++;
            this.nextGrow = 0;
            this.map.incrementGrassGrown();
        }
    }
    // Consume method to decrease the nutrition of grass
    consume(){
        if (this.nutrition > 0){
            this.nutrition--;
        }
    }
}

export default Grass;