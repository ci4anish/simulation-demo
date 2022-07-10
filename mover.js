const ObjectTypes = {
    "FOOD": 'FOOD',
    "WATER": 'WATER',
    "CAMP": 'CAMP',
}

class Mover {
    constructor(x, y, ms, mf) {
        this.alive = true;
        this.pos = createVector(x, y);
        this.r = 12;
        this.maxspeed = ms;
        this.maxforce = mf;
        this.acceleration = createVector(0, 0);
        this.velocity = createVector(1, 0);

        this.wanderTheta = PI / 2;
        this.wanderDistance = 100;
        this.wanderRadius = 50;

        this.wanderPoint = this.velocity.copy().setMag(this.wanderDistance);
        this.wanderPoint.add(this.pos);

        this.target = this.wanderPoint.copy();
        this.target.add(this.wanderRadius, 0);

        this.visibilityRadius = 150;

        this.initMemory();
    }

    initMemory() {
        this.memorizedObjects = {};
        for (let key in ObjectTypes) {
            this.memorizedObjects[key] = [];
        }
    }

    searchObject(type) {
        //todo do not calculate distances and create path on each iteration. Rather do it when making the decision
        if (this.memorizedObjects[type].length === 0) {
            let w = this.wander();
            this.applyForce(w);
            return;
        }

        const fromPos = this.currentNavigationObject.getCenter();
        const closest = this.getClosestObject(fromPos, this.memorizedObjects[type]);

        const path = new Path(100);
        path.addPoint(fromPos.x, fromPos.y);
        path.addPoint(closest.getCenter().x, closest.getCenter().y);

        if (debug) {
            path.display();
        }

        // Follow path force
        let f = this.follow(path);
        let w = this.wander();
        let s = this.seek(closest.pos);
        // Arbitrary weighting
        s.div(100);
        // f.mult(2);
        // Accumulate in acceleration

        return w.add(f).add(s);
    }


    rememberObject(object, type) {
        this.memorizedObjects[type].push(object);
    }

    setCurrentNavigationObject(object) {
        this.currentNavigationObject = object;
    }


    kill() {
        this.alive = false;
    }

    getCenter() {
        return createVector(this.pos.x - this.r, this.pos.y - this.r);
    }

    applyForce(force) {
        // We could add mass here if we want A = F / M
        this.acceleration.add(force);
    }

    run() {
        this.update();
        this.render();
    }

    update() {
        // Update velocity
        this.velocity.add(this.acceleration);
        // Limit speed
        this.velocity.limit(this.maxspeed);
        this.pos.add(this.velocity);
        // Reset accelertion to 0 each cycle
        this.acceleration.mult(0);
    }

    wander() {
        // Move wander point
        this.wanderPoint = this.velocity.copy().setMag(this.wanderDistance);
        this.wanderPoint.add(this.pos);

        // Move target
        let offset = 32;
        let vOffset = p5.Vector.random2D().setMag(offset * 0.2);
        this.target.add(vOffset);

        let v = p5.Vector.sub(this.target, this.wanderPoint);
        v.setMag(this.wanderRadius);
        this.target = p5.Vector.add(this.wanderPoint, v);

        if (debug) {
            let center = this.wanderPoint.copy();
            stroke(255);
            noFill();
            circle(center.x, center.y, this.wanderRadius * 2);
            stroke(255);
            line(this.pos.x, this.pos.y, center.x, center.y);

            stroke(0, 255, 0);
            fill(0, 255, 0, 100);
            circle(this.target.x, this.target.y, offset);
            fill(0, 255, 0);
            circle(this.target.x, this.target.y, 8);

            stroke(255);
            line(this.pos.x, this.pos.y, this.target.x, this.target.y);

            noStroke();
            fill(255, 0, 0);
            circle(center.x, center.y, 8);
        }

        let force = p5.Vector.sub(this.target, this.pos);
        force.setMag(this.maxforce / 15);
        return force;
    }

    follow(path) {
        // Predict pos 25 (arbitrary choice) frames ahead
        let predict = this.velocity.copy();
        predict.normalize();
        predict.mult(25);
        let predictpos = p5.Vector.add(this.pos, predict);

        // Now we must find the normal to the path from the predicted pos
        // We look at the normal for each line segment and pick out the closest one
        let normal = null;
        let target = null;
        let worldRecord = 1000000; // Start with a very high worldRecord distance that can easily be beaten

        // Loop through all points of the path
        for (let i = 0; i < path.points.length; i++) {
            // Look at a line segment
            let a = path.points[i];
            // let b = path.points[(i + 1) % path.points.length]; // Note Path has to wraparound
            let b = path.points[i + 1];

            if (!b) {
                break;
            }

            // Get the normal point to that line
            let normalPoint = getNormalPoint(predictpos, a, b);

            // Check if normal is on line segment
            let dir = p5.Vector.sub(b, a);
            // If it's not within the line segment, consider the normal to just be the end of the line segment (point b)
            //if (da + db > line.mag()+1) {
            if (
                normalPoint.x < min(a.x, b.x) ||
                normalPoint.x > max(a.x, b.x) ||
                normalPoint.y < min(a.y, b.y) ||
                normalPoint.y > max(a.y, b.y)
            ) {
                normalPoint = b.copy();
                // If we're at the end we really want the next line segment for looking ahead
                a = path.points[(i + 1) % path.points.length];
                b = path.points[(i + 2) % path.points.length]; // Path wraps around
                dir = p5.Vector.sub(b, a);
            }

            // How far away are we from the path?
            let d = p5.Vector.dist(predictpos, normalPoint);
            // Did we beat the worldRecord and find the closest line segment?
            if (d < worldRecord) {
                worldRecord = d;
                normal = normalPoint;

                // Look at the direction of the line segment so we can seek a little bit ahead of the normal
                dir.normalize();

                // This is an oversimplification
                // Should be based on distance to path & velocity
                dir.mult(25);
                target = normal.copy();
                target.add(dir);
            }
        }

        // Draw the debugging stuff
        if (debug) {
            // Draw predicted future pos
            stroke(0);
            fill(0);
            line(this.pos.x, this.pos.y, predictpos.x, predictpos.y);
            ellipse(predictpos.x, predictpos.y, 4, 4);

            // Draw normal pos
            stroke(0);
            fill(0);
            ellipse(normal.x, normal.y, 4, 4);
            // Draw actual target (red if steering towards it)
            line(predictpos.x, predictpos.y, target.x, target.y);
            if (worldRecord > path.radius) fill(255, 0, 0);
            noStroke();
            ellipse(target.x, target.y, 8, 8);
        }

        // Only if the distance is greater than the path's radius do we bother to steer
        if (worldRecord > path.radius) {
            return this.seek(target);
        } else {
            return createVector(0, 0);
        }
    }

    arrive(target) {
        var desired = p5.Vector.sub(target, this.pos); // A vector pointing from the location to the target
        var d = desired.mag();
        // Scale with arbitrary damping within 100 pixels
        if (d < 100) {
            var m = map(d, 0, 200, 0, this.maxspeed);
            desired.setMag(m);
        } else {
            desired.setMag(this.maxspeed);
        }

        // Steering = Desired minus Velocity
        var steer = p5.Vector.sub(desired, this.velocity);
        steer.limit(this.maxforce); // Limit to maximum steering force

        return steer;
    }

    seek(target) {
        let force = p5.Vector.sub(target, this.pos);
        force.setMag(this.maxspeed);
        force.sub(this.velocity);
        force.limit(this.maxforce);
        return force;
    }

    contain(boundsWidth, boundsHeight) {
        if (this.pos.x > boundsWidth || this.pos.x < 0 || this.pos.y > boundsHeight || this.pos.y < 0) {
            this.velocity = this.velocity.copy().mult(-1);
        }
    }

    separation(boids) {
        let perceptionRadius = this.r * 1.5;
        let steering = createVector();
        let total = 0;
        for (let other of boids) {
            let d = dist(this.pos.x, this.pos.y, other.pos.x, other.pos.y);
            if (other != this && d < perceptionRadius) {
                let diff = p5.Vector.sub(this.pos, other.pos);
                diff.div(d * d);
                steering.add(diff);
                total++;
            }
        }
        if (total > 0) {
            steering.div(total);
            steering.setMag(this.maxspeed);
            steering.sub(this.velocity);
            steering.limit(this.maxforce);
        }
        return steering;
    }

    cohesion(boids) {
        let perceptionRadius = 50;
        let steering = createVector();
        let total = 0;
        for (let other of boids) {
            let d = dist(this.pos.x, this.pos.y, other.pos.x, other.pos.y);
            if (other != this && d < perceptionRadius) {
                steering.add(other.pos);
                total++;
            }
        }
        if (total > 0) {
            steering.div(total);
            steering.sub(this.pos);
            steering.setMag(this.maxspeed);
            steering.sub(this.velocity);
            steering.limit(this.maxforce);
        }
        return steering;
    }

    align(boids) {
        let perceptionRadius = 25;
        let steering = createVector();
        let total = 0;
        for (let other of boids) {
            let d = dist(this.pos.x, this.pos.y, other.pos.x, other.pos.y);
            if (other != this && d < perceptionRadius) {
                steering.add(other.velocity);
                total++;
            }
        }
        if (total > 0) {
            steering.div(total);
            steering.setMag(this.maxspeed);
            steering.sub(this.velocity);
            steering.limit(this.maxforce);
        }
        return steering;
    }

    pursue(vehicle) {
        let target = vehicle.pos.copy();
        let prediction = vehicle.velocity.copy();
        prediction.mult(10);
        target.add(prediction);
        return this.seek(target);
    }

    evade(vehicle) {
        return this.pursue(vehicle).mult(-1);
    }

    flee(target) {
        return this.seek(target).mult(-1);
    }

    getClosestObject(fromPos, objects) {
        // search for the closest object containing food
        let closest = objects[0];
        let distanceToClosest = p5.Vector.dist(fromPos, closest.getCenter());

        objects.slice(1).forEach(o => {
            const distanceToObj = p5.Vector.dist(fromPos, o.getCenter());
            if (distanceToObj < distanceToClosest) {
                closest = o;
                distanceToClosest = distanceToObj;
            }
        });

        return closest;
    }

}

class Follower extends Mover {

    render() {
        fill(255);
        strokeWeight(1);
        stroke(0);
        push();
        translate(this.pos.x, this.pos.y);
        if (this.alive && debug) {
            fill(0, 0, 0, 0);
            ellipse(0, 0, this.visibilityRadius * 2, this.visibilityRadius * 2);
            fill(255);
        }
        strokeWeight(2);
        rotate(this.velocity.heading());
        triangle(-this.r, -this.r / 2, -this.r, this.r / 2, this.r, 0);
        pop();
    }


    followLeader(leader, entities, distance = 25) {
        let tv = leader.velocity.copy();
        tv.normalize()
        tv.mult(distance);
        var ahead = leader.pos.copy().add(tv);
        tv.mult(-1)
        const behind = leader.pos.copy().add(tv);
        const steering = createVector(0, 0);

        if (this.isOnLeaderSight(leader, ahead, 40)) {
            steering.add(this.evade(leader));
        }
        steering.add(this.arrive(behind));

        return steering;
    }

    flock(boids) {
        let alignment = this.align(boids);
        let cohesion = this.cohesion(boids);
        let separation = this.separation(boids);
        separation.mult(2);

        return alignment.add(cohesion).add(separation);
    }

    isOnLeaderSight(leader, ahead, leaderSightRadius) {
        return (ahead.dist(this.pos) <= leaderSightRadius || leader.pos.dist(this.pos) <= leaderSightRadius)
    }

    applyBehavior(leader, entities, predators) {

        if (predators.length > 0) {
            const closest = this.getClosestObject(this.pos, predators);
            if (p5.Vector.dist(this.pos, closest.getCenter()) <= this.visibilityRadius) {
                const f = this.flee(closest.pos);
                this.applyForce(f);
                return;
            }
        }

        const fl = this.followLeader(leader, entities);
        const f = this.flock(entities);

        this.applyForce(fl);
        this.applyForce(f);
    }

}

class Leader extends Mover {
    constructor(x, y, ms, mf) {
        super(x, y, ms, mf);

        this.initDesires();
    }

    render() {
        strokeWeight(2);
        stroke(0);
        push();
        translate(this.pos.x, this.pos.y);
        if (debug) {
            fill(0, 0, 0, 0);
            ellipse(0, 0, this.visibilityRadius * 2, this.visibilityRadius * 2);
        }
        fill(125);
        rotate(this.velocity.heading());
        triangle(-this.r, -this.r / 2, -this.r, this.r / 2, this.r, 0);
        pop();
    }

    applyBehavior(followers, predators) {

        if (predators.length > 0) {
            const closest = this.getClosestObject(this.pos, predators);
            if (p5.Vector.dist(this.pos, closest.getCenter()) <= this.visibilityRadius) {
                const f = this.flee(closest.pos);
                this.applyForce(f);
                return;
            }
        }

        if (this.thirst > 0) {
            const closest = this.getClosestObject(this.pos, this.memorizedObjects[ObjectTypes.WATER]);
            if (this.isVisible(closest)) {
                if (this.currentNavigationObject !== closest) {
                    this.setCurrentNavigationObject(closest);
                }
                const steer = this.arrive(closest.pos);
                this.applyForce(steer);
                if (this.isInside(closest)) {
                    this.drink();
                }
            } else {
                let s = this.searchObject(ObjectTypes.WATER);
                let l = this.lead(followers);
                this.applyForce(s);
                this.applyForce(l);
            }
        } else if (this.hungre > 0) {
            const closest = this.getClosestObject(this.pos, this.memorizedObjects[ObjectTypes.FOOD]);
            if (this.isVisible(closest)) {
                if (this.currentNavigationObject !== closest) {
                    this.setCurrentNavigationObject(closest);
                }
                const steer = this.arrive(closest.pos);
                this.applyForce(steer);
                if (this.isInside(closest)) {
                    this.feed();
                }
            } else {
                let s = this.searchObject(ObjectTypes.FOOD);
                let l = this.lead(followers);
                this.applyForce(s);
                this.applyForce(l);
            }
        } else {
            const closest = this.getClosestObject(this.pos, this.memorizedObjects[ObjectTypes.CAMP]);
            if (this.isVisible(closest)) {
                if (this.currentNavigationObject !== closest) {
                    this.setCurrentNavigationObject(closest);
                }
                const steer = this.arrive(closest.pos);
                this.applyForce(steer);
                if (this.isInside(closest)) {
                    this.rest();
                }
            } else {
                let s = this.searchObject(ObjectTypes.CAMP);
                let l = this.lead(followers);
                this.applyForce(s);
                this.applyForce(l);
            }
        }
    }

    isVisible(other) {
        let d = p5.Vector.dist(this.pos, other.pos);
        return (d < this.visibilityRadius + other.radius);
    }

    lead(entities) {
        for (let i = 0; i < entities.length; i++) {
            let d = p5.Vector.dist(this.pos, entities[i].pos);
            if (d > this.visibilityRadius) {
                return this.acceleration.copy().setMag(-this.maxforce / 2);
            }
        }

        return createVector(0, 0);
    }

    isInside(other) {
        let d = p5.Vector.dist(this.pos, other.pos);
        return (d < this.r + other.radius);
    }

    feed() {
        if (this.hungre > 0) {
            this.hungre -= 0.05;
        }
    }

    rest() {

    }

    drink() {
        if (this.thirst > 0) {
            this.thirst -= 0.05;
        }
    }

    initDesires() {
        this.hungre = 70;
        this.thirst = 50;
    }
}

class Predator extends Mover {
    constructor(x, y, ms, mf) {
        super(x, y, ms, mf);
        this.visibilityRadius = 200;
        this.velocity = p5.Vector.random2D();
        this.hungre = 80;
    }

    render() {
        strokeWeight(2);
        stroke(0);
        push();
        translate(this.pos.x, this.pos.y);
        if (debug) {
            fill(0, 0, 0, 0);
            ellipse(0, 0, this.visibilityRadius * 2, this.visibilityRadius * 2);
        }
        rotate(this.velocity.heading());
        fill(200, 30, 30);
        triangle(-this.r, -this.r / 2, -this.r, this.r / 2, this.r, 0);
        pop();
    }

    feed() {
        if (this.hungre > 0) {
            this.hungre -= 0.1;
        }
    }

    applyBehavior(entities) {
        if (this.hungre < 20) {
            if (!this.currentNavigationObject) {
                this.setCurrentNavigationObject(new NavigationObject(this.pos));
            }
            let s = this.searchObject(ObjectTypes.CAMP);
            this.applyForce(s);
            return;
        }

        const deadEntities = entities.filter(e => !e.alive);
        const aliveEntities = entities.filter(e => e.alive);

        let closestDead, closestAlive;

        if (deadEntities.length > 0) {
            closestDead = this.getClosestObject(this.pos, deadEntities);
        }

        if (aliveEntities.length > 0) {
            closestAlive = this.getClosestObject(this.pos, aliveEntities);
        }

        if (closestDead) {
            this.feed();
            let a = this.arrive(closestDead.pos);
            this.applyForce(a);
        } else if (p5.Vector.dist(this.pos, closestAlive.getCenter()) <= this.r) {
            closestAlive.kill();
        } else if (p5.Vector.dist(this.pos, closestAlive.getCenter()) <= this.visibilityRadius) {
            const p = this.pursue(closestAlive);
            this.applyForce(p);
        } else {
            let w = this.wander();
            w.mult(3);
            this.applyForce(w);
        }
    }

}

// A function to get the normal point from a point (p) to a line segment (a-b)
// This function could be optimized to make fewer new Vector objects
function getNormalPoint(p, a, b) {
    // Vector from a to p
    let ap = p5.Vector.sub(p, a);
    // Vector from a to b
    let ab = p5.Vector.sub(b, a);
    ab.normalize(); // Normalize the line
    // Project vector "diff" onto line by using the dot product
    ab.mult(ap.dot(ab));
    let normalPoint = p5.Vector.add(a, ab);
    return normalPoint;
}
