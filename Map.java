import java.util.ArrayList;
import java.util.List;

public class Map {
    public List<Object>[][] grid;
    public List<Predator> predators;
    public List<Prey> prey;
    private int[][] predatorCount;
    private int[][] preyCount;

    private int predatorBorn = 0;
    private int preyBorn = 0;
    private int predatorDead = 0;
    private int preyEaten = 0;
    private int grassEaten = 0;
    private int grassGrown = 0;
    private int preyDead = 0;

    public void incrementPredatorBorn(){
        predatorBorn++;
    }
    public void incrementPreyBorn(){
        preyBorn++;
    }
    public void incrementPredatorDead(){
        predatorDead++;
    }
    public void incrementPreyEaten(){
        preyEaten++;
    }

    public void incrementGrassEaten(){
        grassEaten++;
    }
    public void incrementGrassGrown(){
        grassGrown++;
    }
    public void incrementPreyDead(){
        preyDead++;
    }
    public int getPredatorBorn(){
        return predatorBorn;
    }
    public int getPreyBorn(){
        return preyBorn;
    }
    public int getPredatorDead(){
        return predatorDead;
    }
    public int getPreyEaten(){
        return preyEaten;
    }
  
    public int getGrassEaten(){
        return grassEaten;
    }
    public int getGrassGrown(){
        return grassGrown;
    }
    public int getPreyDead(){
        return preyDead;
    }

    @SuppressWarnings("unchecked")
    public Map(int width, int height){
        grid = new ArrayList[width][height];
        predators = new ArrayList<>();
        prey = new ArrayList<>();
        predatorCount = new int[width][height];
        preyCount = new int[width][height];
        //prey = new ArrayList<>();
        for (int i = 0; i < width; i++){
            for (int j = 0; j < height; j++){
                grid[i][j] = new ArrayList<>();
                predatorCount[i][j] = 0;
                preyCount[i][j] = 0;
            }
        }
    }
    
    public int getWidth(){
        return grid.length;
    }

    public int getHeight(){
        return grid[0].length;
    }

    public boolean inBounds(int x, int y){
        return x >= 0 && y >= 0 && x < getWidth() && y < getHeight();
    }

    public List<Object> getEntitiesAt(int x, int y){
        if (inBounds(x, y)){
            return grid[x][y];
        }
        return null;
    }

    public boolean addEntityAt(int x, int y, Object entity){
        if (inBounds(x, y)){
            grid[x][y].add(entity);
            if (entity instanceof Predator) {
                predators.add((Predator) entity);
                predatorCount[x][y]++;
            }
            if (entity instanceof Prey) {
                prey.add((Prey) entity);
                preyCount[x][y]++;
            }
            return true;
        }
        return false;
    }

    public boolean removeEntityAt(int x, int y, Object entity){
        if (inBounds(x, y)){
            grid[x][y].remove(entity);
            if (entity instanceof Predator) {
                predators.remove((Predator) entity);
                predatorCount[x][y]--;
            }
            if (entity instanceof Prey) {
                prey.remove((Prey) entity);
                preyCount[x][y]--;
            }
            return true;
        }
        return false;
    }

    public boolean moveEntity(int fromX, int fromY, int toX, int toY, Object entity){
        if (inBounds(toX, toY)){
            grid[fromX][fromY].remove(entity);
            if (entity instanceof Predator) {
                predatorCount[fromX][fromY]--;
                predatorCount[toX][toY]++;
            } else if (entity instanceof Prey) {
                preyCount[fromX][fromY]--;
                preyCount[toX][toY]++;
            }
            grid[toX][toY].add(entity);
            return true;
        }
        return false;
    }

    public List<Predator> getAllPredators(){
        return predators;
    }

    public List<Prey> getAllPreys(){
        return prey;
    }


    public boolean hasMultiplePredatorsAt(int x, int y){
        if (inBounds(x, y)){
            return predatorCount[x][y] > 1;
        }
        return false;
    }

    public boolean hasMultiplePreysAt(int x, int y){
        if (inBounds(x, y)){
            return preyCount[x][y] > 1;
        }
        return false;
    }
    
    public boolean addGrassAt(int x, int y){
        if (!inBounds(x, y)){
            return false;
        }
        for (Object object : grid[x][y]){
            if(object instanceof Grass){
                return false;
            }
        }
        grid[x][y].add(new Grass());
        return true;
        
    }

    public boolean removeGrassAt(int x, int y){
        if (!inBounds(x, y)){
            return false;
        }

        for (Object object : grid[x][y]){
            if(object instanceof Grass){
                grid[x][y].remove(object);
                return true;
            }
        }
        return false;
    }

    public Grass getGrassAt(int x, int y) {
        for (Object object : grid[x][y]){
            if(object instanceof Grass){
                return (Grass) object;
            }
        }
        return null;
    }

    public boolean checkForGrassAt(int x, int y){
        for (Object object : grid[x][y]){
            if(object instanceof Grass){
                return true;
            }
        }
        return false;
    }

    public class Grass {
        
        private int nextGrow = 0;

        public int getNextGrow(){
            return nextGrow;
        }

        public void resetNextGrow(){
            nextGrow = 0;
        }

        private int nutrition = 0;

        public Grass(){
            nutrition = 2;
        }

        public int getNutrition(){
            return nutrition;
        }

        public void turn(){
            nextGrow++;
            if (nextGrow % 25 == 0){
            nutrition++;
            nextGrow = 0;
            Map.this.incrementGrassGrown();
            }
        }
        public void consume(){
            if (nutrition > 0){
                nutrition--;
            }
        }
    }

}
