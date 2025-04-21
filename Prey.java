import java.util.List;

public class Prey implements PreyInterface {
    private int currentX;
    private int currentY;
    private static Map map;
    private boolean hasActed;
    private int lifeSpan;
    private int energy;
    private boolean predatorNearby;
    private static final int INITIAL_LIFE = 20;
    private static final int INITIAL_ENERGY = 0;

        

    public Prey(int x, int y) {
        this.currentX = x;
        this.currentY = y;
        this.hasActed = false;
        this.lifeSpan = INITIAL_LIFE;
        this.energy = INITIAL_ENERGY;
    }
        

    public void resetTurn() {
        hasActed = false;
    }
    public boolean hasActed() {
        return hasActed;
    }

    public static void setMap(Map mainMap) {
        map = mainMap;
    }

    public int getCurrentX() {
        return currentX;
    }

    public int getCurrentY(){
        return currentY;
    }

    public int getEnergy(){
        return energy;
    }

    public void setEnergy(int toValue){
        this.energy = toValue;
    }
  
    @Override
    public void killed() {
        lifeSpan = 0;
        energy = 0;
        map.incrementPreyEaten();
    }

    @Override
    public boolean isDead() {
        return lifeSpan <= 0;
    }

    @Override
    public void move() {
        int newX = currentX + (int) (Math.random() * 3) - 1;
        int newY = currentY + (int) (Math.random() * 3) - 1;

        if (map.inBounds(newX, newY)) {
            map.moveEntity(currentX, currentY, newX, newY, this);
            currentX = newX;
            currentY = newY;
        }
    }


    public void escape() {
        boolean predatorNearby = false;
        
        for(int i = -2; i <= 2; i++){
            for(int j = -2; j <= 2; j++){
                int targetX = currentX + i;
                int targetY = currentY + j;

                if (map.inBounds(targetX, targetY)){
                    for (Object entity : map.getEntitiesAt(targetX, targetY)){
                        if (entity instanceof Predator){
                            predatorNearby = true;
                            break;
                        }
                    }
                }
            }
            if (predatorNearby) {
                break;
            }
        }
        

        if (predatorNearby) {
            int escapeX = currentX;
            int escapeY = currentY;

            Predator closestPredator = findClosestPredator();
            if(closestPredator.getCurrentX() > currentX) escapeX--;
            else if(closestPredator.getCurrentX() < currentX) escapeX++;
            if(closestPredator.getCurrentY() > currentY) escapeY--;
            else if(closestPredator.getCurrentY() < currentY) escapeY++;
            if (map.inBounds(escapeX, escapeY)) {
                map.moveEntity(currentX, currentY, escapeX, escapeY, this);
                currentX = escapeX;
                currentY = escapeY;
                lifeSpan -= 1;
            }
        }
    }
    
    private Predator findClosestPredator() {
        Predator closestPredator = null;
        double closestDistance = Double.MAX_VALUE;

        for (int i = -2; i <= 2; i++) {
            for (int j = -2; j <= 2; j++) {
                int targetX = currentX + i;
                int targetY = currentY + j;

                if (map.inBounds(targetX, targetY)) {
                    for (Object entity : map.getEntitiesAt(targetX, targetY)) {
                        if (entity instanceof Predator) {
                            Predator predator = (Predator) entity;
                            double distance = Math.sqrt(Math.pow(predator.getCurrentX() - currentX, 2) +
                                                         Math.pow(predator.getCurrentY() - currentY, 2));
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
    
    public void turn() {
        if (hasActed) {
            return;
        }
        move();
        eat();
        age();
        //escape();
        hasActed = true;
    }

    @Override
    public void consumeEnergy() {
        if (energy > 0) {
            energy--;
        } else {
            lifeSpan--;
        }
    }

    @Override
    public void age() {
        if (lifeSpan > 0) {
            lifeSpan--;
        } else {
            energy = 0;
        }
    }

    public static Prey procreate(int x, int y) {
        map.incrementPreyBorn();
        if (map.inBounds(x - 4, y - 4)){
            return new Prey(x - 4, y - 4);
        } else {
            return new Prey(x + 4, y + 4);
        }
        
    }

    @Override
    public void eat() {
        List<Object> entitiesAtCurrentPosition = map.getEntitiesAt(currentX, currentY);
        for (Object entity : entitiesAtCurrentPosition) {
            if (entity instanceof Map.Grass) {
                energy += 1;
                ((Map.Grass) entity).consume();
                ((Map.Grass) entity).resetNextGrow();
                map.incrementGrassEaten();
                break;
            }
        }
    }

    @Override
    public void rest() {
       if(!predatorNearby) {
            energy += 2;
            hasActed = true;
        }
    }
}