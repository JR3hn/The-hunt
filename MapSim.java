import javafx.animation.AnimationTimer;
import javafx.application.Application;
import javafx.scene.Scene;
import javafx.scene.layout.Pane;
import javafx.scene.paint.Color;
import javafx.scene.shape.Rectangle;
import javafx.stage.Screen;
import javafx.stage.Stage;
import java.util.Random;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import javafx.scene.layout.VBox;
import javafx.scene.text.Text;
import javafx.scene.control.Button;
import javafx.application.Platform;

public class MapSim extends Application{

    private static final int CELL_SIZE = 7;
    private static Map map;
    boolean[][] newPredators;
    List<Predator> deadPredators;
    boolean[][] newPreys;
    List<Prey> deadPreys;
    static int currentTurn = 0;

    @Override 
    public void start(Stage primStage) {

        double screenWidth = Screen.getPrimary().getVisualBounds().getWidth();
        double screenHeight = Screen.getPrimary().getVisualBounds().getHeight();

        int sceneWidth = (int) screenWidth;
        int sceneHeight = (int) screenHeight;

        int mapWidth = sceneWidth / CELL_SIZE;
        int mapHeight = sceneHeight / CELL_SIZE;

        Pane root = new Pane();

        Scene scene = new Scene(root, sceneWidth, sceneHeight);

        primStage.setTitle("Simulation");

        primStage.setScene(scene);  

        primStage.show();

        map = new Map(mapWidth, mapHeight);
        Predator.setMap(map);
        Prey.setMap(map);
        newPredators = new boolean[mapWidth][mapHeight];
        deadPredators = new ArrayList<>();
        newPreys = new boolean[mapWidth][mapHeight];
        deadPreys = new ArrayList<>();

        for (int x = 0; x < mapWidth; x++) {
            for (int y = 0; y < mapHeight; y++) {
                map.addGrassAt(x, y);
            }
        }

        Random random = new Random();
        
        for (int i = 0; i < 400; i++){
            int randomX = random.nextInt(mapWidth);
            int randomY = random.nextInt(mapHeight);
            map.addEntityAt(randomX, randomY, new Predator(randomX, randomY));
        }

        for (int i = 0; i < 600; i++){
            int randomX = random.nextInt(mapWidth);
            int randomY = random.nextInt(mapHeight);
            map.addEntityAt(randomX, randomY, new Prey(randomX, randomY));
        }

        startSimulationLoop(root);
    }

    private void startSimulationLoop(Pane root) {

        final long[] updateInterval = {500_000_000};

        VBox controlBox = new VBox(5);
        controlBox.setStyle("-fx-background-color: rgba(255,255,255,0.7); -fx-padding: 10;");
        controlBox.setTranslateX(10);
        controlBox.setTranslateY(120);
        
        Button pauseButton = new Button("Pausa");
        Button speedUpButton = new Button("Öka hastighet (+100ms)");
        Button slowDownButton = new Button("Minska hastighet (-100ms)");
        controlBox.getChildren().addAll(pauseButton, speedUpButton, slowDownButton);
        
        // Skapa en container för dynamiska element som behöver uppdateras
        Pane gamePane = new Pane(); // För spelelement (gräs, rovdjur, byten)
        Pane uiPane = new Pane();   // För UI-element (knappar, statistik)
        uiPane.getChildren().add(controlBox);
        
        // Lägg till båda i root
        root.getChildren().addAll(gamePane, uiPane);

        final AnimationTimer timer = new AnimationTimer() {
            private long lastUpdate = 0;

            @Override
            public void handle(long now) {
                if (now - lastUpdate >= updateInterval[0]) {
                    lastUpdate = now;

                    // Clear the pane to redraw
                    gamePane.getChildren().clear();

                    currentTurn++;

                    for (int x = 0; x < map.getWidth(); x++) {
                        for (int y = 0; y < map.getHeight(); y++) {
                            map.getGrassAt(x, y).turn();
                            Rectangle grassRectangle = new Rectangle(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                            if (map.getGrassAt(x, y).getNutrition() >= 1) {
                                grassRectangle.setFill(Color.GREEN);
                            } else {
                                grassRectangle.setFill(Color.rgb(61, 36, 19)); // Brunt för rutor utan gräs
                            }
                            gamePane.getChildren().add(grassRectangle);
                        }
                    }

                    for (int x = 0; x < newPredators.length; x++) {
                        for (int y = 0; y < newPredators[x].length; y++) {
                            if (newPredators[x][y]) {
                                Predator newPredator = Predator.procreate(x, y);
                                map.addEntityAt(x, y, newPredator);
                                newPredators[x][y] = false;
                            }
                        }
                    }

                    for (int x = 0; x < newPreys.length; x++) {
                        for (int y = 0; y < newPreys[x].length; y++) {
                            if (newPreys[x][y]) {
                                Prey newPrey = Prey.procreate(x, y);
                                map.addEntityAt(x, y, newPrey);
                                newPreys[x][y] = false;
                            }
                        }
                    }

                    for (Predator predator : deadPredators) {
                       // System.out.println("Trying to remove predator at: " + predator.getCurrentX() + "," + 
                       //                   predator.getCurrentY() + ", predator count before: " + map.getAllPredators().size());
                        map.incrementPredatorDead();
                        boolean removed = map.removeEntityAt(predator.getCurrentX(), predator.getCurrentY(), predator);
                        
                        //System.out.println("Removed predator: " + removed + 
                                         // ", predator count after: " + map.getAllPredators().size());
                    }
                    deadPredators.clear();

                    for (Prey prey : deadPreys) {
                        //System.out.println("Trying to remove prey at: " + prey.getCurrentX() + "," + 
                        //                  prey.getCurrentY() + ", predator count before: " + map.getAllPreys().size());
                            map.incrementPreyDead();           
                        boolean removed = map.removeEntityAt(prey.getCurrentX(), prey.getCurrentY(), prey);
                        
                        //System.out.println("Removed prey: " + removed + 
                        //                  ", prey count after: " + map.getAllPreys().size());
                    }
                    deadPreys.clear(); 


                    // Run the turn for each predator
                    
                    Iterator<Predator> predIterator = map.getAllPredators().iterator();
                    while (predIterator.hasNext()) {
                        Predator predator = predIterator.next();
                        predator.turn();
                        int currentX = predator.getCurrentX();
                        int currentY = predator.getCurrentY();
                        if (map.hasMultiplePredatorsAt(currentX, currentY) && predator.getEnergy() > 2) {
                            newPredators[currentX][currentY] = true;
                            predator.setEnergy(0);
                        }
                        if (predator.isDead()) {
                            deadPredators.add(predator);
                        } else {
                            Rectangle predatorRectangle = new Rectangle(currentX * CELL_SIZE, currentY * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                            predatorRectangle.setFill(Color.rgb(255, 0, 0, 0.7));
                            predatorRectangle.setStroke(Color.BLACK);
                            gamePane.getChildren().add(predatorRectangle);
                        }
                    }

                    Iterator<Prey> preyIterator = map.getAllPreys().iterator();
                    while (preyIterator.hasNext()) {
                        Prey prey = preyIterator.next();
                        prey.turn();
                        int currentX = prey.getCurrentX();
                        int currentY = prey.getCurrentY();
                        if (map.hasMultiplePreysAt(currentX, currentY) && prey.getEnergy() > 3) {
                            newPreys[currentX][currentY] = true;
                            prey.setEnergy(0);
                        }
                        if (prey.isDead()) {
                            deadPreys.add(prey);
                        } else {
                            Rectangle preyRectangle = new Rectangle(currentX * CELL_SIZE, currentY * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                            preyRectangle.setFill(Color.rgb(0, 0, 255, 0.7));
                            preyRectangle.setStroke(Color.BLACK);
                            gamePane.getChildren().add(preyRectangle);
                        }
                    }

                    // Reset the turn for each predator
                    for (Predator predator : map.getAllPredators()) {
                        predator.resetTurn();
                    }

                    for (Prey prey : map.getAllPreys()) {
                        prey.resetTurn();
                    }
                    VBox liveStatsBox = new VBox(5);
                    liveStatsBox.setStyle("-fx-background-color: rgba(255,255,255,0.7); -fx-padding: 10;");
                    liveStatsBox.setTranslateX(10);
                    liveStatsBox.setTranslateY(10);

                    Text turnText = new Text("Tur: " + currentTurn);
                    Text predatorsText = new Text("Rovdjur: " + map.getAllPredators().size() + " (Born: " + map.getPredatorBorn() + 
                            ", Dead: " + map.getPredatorDead() + ")");
                    Text preyText = new Text("Byten: " + map.getAllPreys().size() + " (Born: " + map.getPreyBorn() + 
                        ", Ätna: " + map.getPreyEaten() + ", Dead: " + map.getPreyDead() + ")");
                    Text grassText = new Text("Gräs: (Eaten: " + map.getGrassEaten() + ", Grown: " + map.getGrassGrown() + ")");

                    // Lägg till alla texter i rutan
                    liveStatsBox.getChildren().addAll(turnText, predatorsText, preyText, grassText);

                    // Lägg till statistikrutan på root (kommer att ritas ovanpå allt annat)
                    gamePane.getChildren().add(liveStatsBox);

                }

                if (map.getAllPredators().isEmpty() && map.getAllPreys().isEmpty()){
                    this.stop(); // Stoppa timern
                    showFinalStatistics(root); // Visa slutstatistik
                }
            }
        };
        pauseButton.setOnAction(e -> {
            if (pauseButton.getText().equals("Pausa")) {
                timer.stop();
                pauseButton.setText("Fortsätt");
            } else {
                timer.start();
                pauseButton.setText("Pausa");
            }
        });

        speedUpButton.setOnAction(e -> {
            updateInterval[0] = Math.max(100_000_000, updateInterval[0] - 200_000_000);
            System.out.println("Uppdateringsintervall: " + (updateInterval[0] / 1_000_000) + "ms");
        });

        slowDownButton.setOnAction(e -> {
            updateInterval[0] = updateInterval[0] + 200_000_000;
            System.out.println("Uppdateringsintervall: " + (updateInterval[0] / 1_000_000) + "ms");
        });
        
        timer.start(); // Start the animation timer
    }
    // Add this method to show final statistics
    private void showFinalStatistics(Pane root) {
    // Clear the pane
    root.getChildren().clear();
    
    // Create a VBox for statistics
    VBox statsBox = new VBox(10);
    statsBox.setStyle("-fx-background-color: white; -fx-padding: 20; -fx-alignment: center;");
    statsBox.setPrefSize(400, 300);
    statsBox.setLayoutX((root.getWidth() - 400) / 2);
    statsBox.setLayoutY((root.getHeight() - 300) / 2);
    
    // Add a title
    Text titleText = new Text("Simulation Ended");
    titleText.setStyle("-fx-font-size: 24; -fx-font-weight: bold;");
    
    // Add statistics texts
    Text turnsText = new Text("Total Turns: " + currentTurn);
    Text predatorBornText = new Text("Predators Born: " + map.getPredatorBorn());
    Text predatorStarvedText = new Text("Predators dead : " + map.getPredatorDead());
    Text preyBornText = new Text("Prey Born: " + map.getPreyBorn());
    Text preyEatenText = new Text("Prey Eaten: " + map.getPreyEaten());
    Text preyStarvedText = new Text("Prey Dead: " + map.getPreyDead());
    Text grassEatenText = new Text("Grass Eaten: " + map.getGrassEaten());
    Text grassGrownText = new Text("Grass Grown: " + map.getGrassGrown());
    
    // Add a button to close the application
    Button closeButton = new Button("Close Simulation");
    closeButton.setOnAction(e -> {
        Platform.exit();
    });
    
    // Add all elements to the VBox
    statsBox.getChildren().addAll(
        titleText, 
        turnsText, 
        predatorBornText, 
        predatorStarvedText, 
        preyBornText, 
        preyEatenText,
        preyStarvedText,
        grassEatenText,
        grassGrownText,
        closeButton
    );
    // Add the VBox to the root pane
    root.getChildren().add(statsBox);
}
    public static int getCurrentTurn(){
        return currentTurn;
    }

    public static void main (String[] args){
        launch(args);
    }

}
