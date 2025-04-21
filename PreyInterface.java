public interface PreyInterface {

    //Behöver ha fields för curretnX och currentY, lifeSpan, energy
    //Behöver även ta in en private static Map map

    /**
     * Kills the prey
     */
    void killed();


    /**
     * Checks if prey is dead
     * @return true or false depending on the answer
     */
    boolean isDead();

    /**
     * Moves the prey using x and y
     */
    void move();

    /**
     * Decreases the energy
     */
    void consumeEnergy();

    /**
     * Decrease the lifespan
     */
    void age();


    /**
     * increase energy, removes grass at position
     */
    void eat();

    /**
     * Rest to increase energy
     */
    void rest();

}
