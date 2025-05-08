# Projinda-script
## Description
A lifecycle simulation with grass, prey and predators. Prey runs from predators, eats grass and procreate. Predators hunts/eats prey and procreate. Grass grows and gets eaten. Prey can die i two ways, from age or from predation. Predators can only die from age.


## Getting started

The simulation is ran using Git Pages. No setup needed, just click the link below and the simulation will launch.

https://gits-15.sys.kth.se/pages/johnreh/Projinda-script/

## Using the simulation

Before the actual simulation runs, parameters needs to be set. A prompt will automaticly appear when launching the page. This can be used to balance the simulation to make it run for as long as possible.

The parameters are as follows:

- Cellsize (pixels): Sets the size of each cell in pixels, a higher number meaning larger cells.
- Number of predators: Sets the initial amount of predators.
- Number of prey: Sets the initial amount of prey.
- Predator lifespan: How many turns predators live.
- Prey lifespan: How many turns prey live.
- Reproduction energy threshold: The amount of energy needed to reproduce for both classes.
- Number of turns for grass growth: Number of turns before grass grows and increases its nutrition.

When the actual sim is running the user can speed up/slow down the simulation, pause it or reset it. All this is done using buttons on the page, these are placed just under the simulation window. Just under these there are counters to keep track of whats happening in the simulation. 

When the simulation ends the user gets shown the final staistics, and also has the options to view the history of simulations run. These are shown as graphs for easier comparison and is saved between sessions.

## Workload

In order to maximize efficiency and minimize git conflicts the workload has been split as follows.

| Project task | Responsible developer | Completion status|
|--------------|-----------------------|------------------|
| Prey         |  Linus Reichherzer    |Complete    |
|Predator      | John Rehn             |Complete    |
|Simulation    | Shared                | Complete         |
|Web page      | John Rehn             | Complete         |
|Counters/stats      | Linus Reichherzer | Complete       |
|Balancing     | Shared                | Complete   |


#### Authors:
John Rehn - johnreh@kth.se  
Linus Reichherzer - linusrei@kth.se
