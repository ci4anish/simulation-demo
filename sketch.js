let debug = true;
let lake, field, leader, camp, predatorCamp, predators = [];
let followers = [];

function setup() {
    const firstQuadrant = createVector(random(0, window.innerWidth / 2), random(0, window.innerHeight / 2));
    const secondQuadrant = createVector(random(0, window.innerWidth / 2), random(window.innerHeight / 2, window.innerHeight));
    const thirdQuadrant = createVector(random(window.innerWidth / 2, window.innerWidth), random(0, window.innerHeight / 2));
    const forthQuadrant = createVector(random(window.innerWidth / 2, window.innerWidth), random(window.innerHeight / 2, window.innerHeight));


    createCanvas(window.innerWidth, window.innerHeight);
    lake = new Lake(thirdQuadrant);
    camp = new Camp(firstQuadrant);
    predatorCamp = new PredatorCamp(secondQuadrant);
    field = new Field(forthQuadrant);
    leader = new Leader(camp.getCenter().x, camp.getCenter().y, 1.5, 0.03);

    leader.rememberObject(camp, ObjectTypes.CAMP);
    leader.rememberObject(field, ObjectTypes.FOOD);
    leader.rememberObject(lake, ObjectTypes.WATER);

    leader.setCurrentNavigationObject(camp);

    for (let i = 0; i < 20; i++) {
        followers.push(new Follower(camp.getCenter().x - random(30), camp.getCenter().y - random(30), 1, 0.02))
    }
}

function draw() {
    background(220);

    lake.display();
    field.display();
    camp.display();
    predatorCamp.display();
    leader.applyBehavior(followers.filter(f => f.alive), predators);
    leader.contain(window.innerWidth, window.innerHeight);
    leader.run();

    followers.forEach((f) => {
        if (f.alive) {
            f.applyBehavior(leader, followers.filter(f => f.alive), predators);
            f.contain(window.innerWidth, window.innerHeight);
            f.run();
        } else {
            f.render();
        }
    });

    predators.forEach(predator => {
        predator.applyBehavior([leader, ...followers]);
        predator.contain(window.innerWidth, window.innerHeight);
        predator.run();
    });
}

function keyPressed() {
    if (key == "d") {
        debug = !debug;
    }
}

function mousePressed() {
    const p = new Predator(mouseX, mouseY, 1.3, 0.2)
    predators.push(p);
    p.rememberObject(predatorCamp, ObjectTypes.CAMP);

}
