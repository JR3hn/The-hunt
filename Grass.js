class Grass {
    constructor(map) {
        this.nextGrow = 0;
        this.nutrition = 2;
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
        if (this.nextGrow % 25 === 0){
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