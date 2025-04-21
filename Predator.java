import java.util.ArrayList;

public class Predator {

    private int lifeSpan;
    private int energy;
    private int currentX;
    private int currentY;
    private static Map map;


    private static final int INITIAL_LIFE = 50;
    private static final int INITIAL_ENERGY = 0;

    private boolean hasActed;

    public Predator (int initialX, int initialY){
        this.lifeSpan = INITIAL_LIFE;
        this.energy = INITIAL_ENERGY;
        this.currentX = initialX;
        this.currentY = initialY;
        this.hasActed = false;
    }

    public static void setMap(Map mainMap) {
        map = mainMap;
    }

    public static int getInitialLife(){
        return INITIAL_LIFE;
    }

    public static int getInitialEnergy(){
        return INITIAL_ENERGY;
    }

    public int getCurrentX(){
        return currentX;
    }

    public int getEnergy() {
        return this.energy;
    }

    public void setEnergy(int toValue){
        this.energy = toValue;
    }

    public int getCurrentY(){
        return currentY;
    }

    public void resetTurn(){
        hasActed = false;
    }

    public boolean isDead(){
        return this.lifeSpan <= 0;
    }

    public void age() {
        this.lifeSpan--;
    }

    public void consumeEnergy (int amount) {
        this.energy -= amount;
    }

    public static Predator procreate(int x, int y) {
        map.incrementPredatorBorn();
        if (map.inBounds(x - 1, y - 1)){
            return new Predator(x - 1, y - 1);
        } else {
            return new Predator(x + 1, y + 1);
        }
    }

    public void kill(Prey prey){
        if (prey != null){
        prey.killed();
        this.energy += 2;
        this.lifeSpan += 1;
        }
    }

    public void hunt(){
        Prey prey = search();
        if (prey != null){
            signalOtherPredators(findFriends(), prey);
            moveToPrey(prey);
            hasActed = true;
        } else {
        moveRandom();
        hasActed = true;
        }
    }

    public ArrayList<Predator> findFriends() {
        ArrayList<Predator> friends = new ArrayList<>();
        for (int i = -2; i <= 2; i++) {
            for (int j = -2; j <= 2; j++){

                if (i == 0 && j == 0) continue;

                int targetX = currentX + i;
                int targetY = currentY + j;

                if (map.inBounds(targetX, targetY)){
                    for (Object entity : map.getEntitiesAt(targetX, targetY)){
                        if (entity instanceof Predator){
                             friends.add((Predator) entity);
                        }
                    }
                } 
            }
        }
        return friends;
    }

    public void signalOtherPredators(ArrayList<Predator> predators, Prey prey) {
        if (predators != null){
            for (Predator predator : predators){
                predator.moveToPrey(prey);
                predator.hasActed = true;
            }
        }
    }

    public Prey search(){
        for (int i = -2; i <= 2; i++) {
            for (int j = -2; j <= 2; j++){
                int targetX = currentX + i;
                int targetY = currentY + j;

                if (map.inBounds(targetX, targetY)){
                    for (Object entity : map.getEntitiesAt(targetX, targetY)){
                        if (entity instanceof Prey && !((Prey)entity).isDead()){
                            return (Prey) entity;
                        }
                    }
                }
            }
        }
        return null;
    }


    public void rest() {
        energy += 1;
        lifeSpan--;
    }

    public void moveRandom() {
        //consumeEnergy(1);
        int newX = currentX + (int) (Math.random() * 3) - 1;
        int newY = currentY + (int) (Math.random() * 3) - 1;

        newX = Math.max(0, Math.min(newX, map.getWidth() - 1));
        newY = Math.max(0, Math.min(newY, map.getHeight() - 1));

        map.moveEntity(currentX, currentY, newX, newY, this);

        currentX = newX;
        currentY = newY;
    }

    public void moveToPrey(Prey prey) {
        //consumeEnergy(1);
        int oldX = currentX;
        int oldY = currentY;
        
        if (prey.getCurrentX() == currentX && prey.getCurrentY() == currentY) {
            kill(prey);
            return;
        }

        if (prey.getCurrentX() > currentX) currentX++;
        else if (prey.getCurrentX() < currentX) currentX--;

        if (prey.getCurrentY() > currentY) currentY++;
        else if (prey.getCurrentY() < currentY) currentY--;
    
        // Viktigt: Uppdatera positionen på kartan
        map.moveEntity(oldX, oldY, currentX, currentY, this);

    }

    public void turn(){
        if (!hasActed){
            hunt();
            age();
        }
    }


}