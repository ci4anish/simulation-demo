class Camp {
    constructor(){
        this.pos = createVector(100, 100);
        this.radius = 20;
    }

    display(){
        strokeWeight(2);
        stroke(0);
        fill(255, 255, 255);
        ellipse(this.pos.x, this.pos.y, this.radius * 2, this.radius * 2);
    }

    getCenter(){
        return this.pos.copy();
    }
}

class Lake {
    constructor(){
        this.pos = createVector(900, 500);
        this.radius = 100;
    }

    display(){
        strokeWeight(2);
        stroke(0);
        fill(255, 255, 255);
        ellipse(this.pos.x, this.pos.y, this.radius * 2, this.radius * 2);
    }

    getCenter(){
        return this.pos.copy();
    }
}

class Field {
    constructor(){
        this.pos = createVector(240, 660);
        this.radius = 75;
    }

    display(){
        strokeWeight(2);
        stroke(0);
        fill(255, 255, 255);
        ellipse(this.pos.x, this.pos.y, this.radius * 2, this.radius * 2);
    }

    getCenter(){
        return this.pos.copy();
    }
}