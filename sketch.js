let debug = true;
let lake, field, leader, camp;
let followers = [];

function setup() {
    createCanvas(window.innerWidth, window.innerHeight);
    lake = new Lake();
    camp = new Camp();
    field = new Field();
    leader = new Leader(camp.getCenter().x, camp.getCenter().y, 1, 0.02);

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
    leader.applyBehavior(followers);
    leader.contain(window.innerWidth, window.innerHeight)
    leader.run();

    followers.forEach((f) => {
        f.applyBehavior(leader, followers);
        f.run();
    });
}

function keyPressed() {
    if (key == "d") {
        debug = !debug;
    }
}
