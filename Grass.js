class Grass {
    static growthRate = 12;

    constructor(map) {
        this.nextGrow = 0;
        this.nutrition = 1;
        this.map = map;
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
        if (this.nextGrow % Grass.growthRate === 0){
            this.nutrition++;
            this.nextGrow = 0;
            this.map.incrementGrassGrown();
        }
    }
    consume(){
        if (this.nutrition > 0){
            this.nutrition--;
        }
    }
}

export default Grass;