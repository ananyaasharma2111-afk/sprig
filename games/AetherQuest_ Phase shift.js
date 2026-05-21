// Set up the graphics (Fixed palette colors)
setLegend(
  [ "p", bitmap`
    ....000000....
    ..0011111100..
    ..0111111110..
    00110011001100
    01110011001110
    01111111111110
    01111111111110
    .011100001110.
    ..0111111110..
    ....00..00....
  `],
  [ "w", bitmap`
    CCCCCC999999CCCC
    CC999999999999CC
    C99966666666999C
    C99665555556699C
    C96655555555669C
    C96555555555569C
    C96555555555569C
    C96555555555569C
    C96555555555569C
    C96555555555569C
    C96555555555569C
    C96655555555669C
    C99665555556699C
    C99966666666999C
    CC999999999999CC
    CCCCCC999999CCCC
  `],
  // "b" is a Solid Power Battery (Fixed "A" to "L" for valid Sprig gray)
  [ "b", bitmap`
    ................
    ....00000000....
    ..002222222200..
    ..022233332220..
    ..022335533220..
    ..023355553320..
    ..02355LL55320..
    ..02355LL55320..
    ..023355553320..
    ..022335533220..
    ..022233332220..
    ..002222222200..
    ....00000000....
    ................
    ................
    ................
  `],
  // "h" is a Ghost Battery (Phase Shifted)
  [ "h", bitmap`
    ................
    ....77....77....
    ..77........77..
    ..7..........7..
    ..7..77..77..7..
    ....7..77..7....
    ....7..77..7....
    ..7..77..77..7..
    ..7..........7..
    ..77........77..
    ....77....77....
    ................
    ................
    ................
    ................
    ................
  `],
  // "g" is the Power Generator (Goal)
  [ "g", bitmap`
    .....CCCCCC.....
    ...CCC4444CCCC..
    .CCC444444444C..
    C444444444444CC.
    C4444444444444CC
    CDDD4DDD4DDD4D4C
    CD444D4D4D4D4D4C
    CD4D4D4D4DDD4D4C
    CDDD4DDD4D4D4DDC
    C44444444444444C
    C4444444444444CC
    CC444444444444C.
    .CC4444444444CC.
    ..CCC4444444CC..
    ....CCCCCCCCC...
    ................
  `]
);
//  Map Layouts 
var maps = [
  map`
wwwwwwwwwwww
w.p........w
wh.b..h..b.w
w..........w
wh...g.....w
wwwwwwwwwwww`,];

var currentLevel = 0;
setMap(maps[currentLevel]);
setSolids(["p", "w", "b", "h"]);

// Map Layouts
var maps = [
  // Level 1: Intro to Ghosting. Phase shift the battery to walk through it, then turn it solid on the switch.
  map`
wwwwwwwwwww
p...b....gw
wwwwwwwwwww`,
  // Level 2: The Chamber. You must push one battery, and phase-shift another through a wall layout to reach the separate goals.
  map`
wwwwwwwwwwww
wp.........w
wwwwb..ww..w
w.g....w...w
w......w...w
w.b..g.w...w
wwwwwwwwwwww`,
  // Level 3: Tight Fit. You must phase a battery, stand exactly where it needs to go solid, and step away to map out the solution.
  map`
wwwwwwwww
wp......w
w..b.b..w
w.......w
w..w.w..w
w..g.g..w
wwwwwwwww`
];

var currentLevel = 0;
setMap(maps[currentLevel]);

// Notice "h" (Ghost block) is NOT solid. Only "b" (Solid block) is solid!
setSolids(["p", "w", "b"]);

// Core Movement Logic
function tryMove(playerSprite, dx, dy) {
  var nextX = playerSprite.x + dx;
  var nextY = playerSprite.y + dy;
  
  var targets = getTile(nextX, nextY);
  
  // Can't walk through regular walls
  if (targets.some(s => s.type === "w")) {
    return;
  }
  
  // Interaction with Solid Batteries ("b")
  var battery = targets.find(s => s.type === "b");
  if (battery) {
    var blockNextX = battery.x + dx;
    var blockNextY = battery.y + dy;
    var blockTargets = getTile(blockNextX, blockNextY);
    
    // Solid batteries can't pass walls, other blocks, or ghost blocks
    if (blockTargets.some(s => s.type === "w" || s.type === "b" || s.type === "h")) {
      return;
    }
    
    battery.x = blockNextX;
    battery.y = blockNextY;
  }
  
  // Move Player (Note: Player can naturally walk over "h" because it isn't solid!)
  playerSprite.x = nextX;
  playerSprite.y = nextY;
}

// BIND KEYBOARD INPUTS
onInput("w", () => { var p = getFirst("p"); if(p) tryMove(p, 0, -1); });
onInput("s", () => { var p = getFirst("p"); if(p) tryMove(p, 0, 1); });
onInput("a", () => { var p = getFirst("p"); if(p) tryMove(p, -1, 0); });
onInput("d", () => { var p = getFirst("p"); if(p) tryMove(p, 1, 0); });

// UNIQUE MECHANIC: Press Spacebar ("k" in Sprig) to Phase Shift ALL blocks on the map!
onInput("k", () => {
  var allSolids = getAll("b");
  var allGhosts = getAll("h");
  
  // 1. Turn Ghosts into Solids (If nobody is standing inside them)
  allGhosts.forEach(ghost => {
    var objectsHere = getTile(ghost.x, ghost.y);
    // Check if player or another block is occupying the space
    var isBlocked = objectsHere.some(s => s.type === "p" || s.type === "b");
    
    if (!isBlocked) {
      var x = ghost.x;
      var y = ghost.y;
      ghost.remove();
      var newSolid = addSprite(x, y, "b");
    }
  });
  
  // 2. Turn Solids into Ghosts
  allSolids.forEach(solid => {
    var x = solid.x;
    var y = solid.y;
    solid.remove();
    var newGhost = addSprite(x, y, "h");
  });
});

// Restart level if stuck
onInput("i", () => {
  setMap(maps[currentLevel]);
});

// Win Condition Check
afterInput(() => {
  var allGoals = getAll("g");
  var goalsSatisfied = 0;
  
  allGoals.forEach(g => {
    var objectsOnGoal = getTile(g.x, g.y);
    // CRITICAL: Goals can ONLY be powered by SOLID batteries ("b"), not ghost batteries ("h")!
    if (objectsOnGoal.some(s => s.type === "b")) {
      goalsSatisfied++;
    }
  });
  
  if (goalsSatisfied === allGoals.length && allGoals.length > 0) {
    if (currentLevel < maps.length - 1) {
      currentLevel++;
      setMap(maps[currentLevel]);
    } else {
      addText("REALITY STABILIZED", { y: 4, color: "purple" });
    }
  }
});
