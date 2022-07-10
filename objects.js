class NavigationObject {
    constructor(pos){
        this.pos = pos;
        this.radius = 2;
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

class Camp {
    constructor(pos){
        this.pos = pos;
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
    constructor(pos){
        this.pos = pos;
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
    constructor(pos){
        this.pos = pos;
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