export class Player {
    name;
    stack = 0;
    running_count = 0;
    constructor(name) {
        this.name = name;
        this.stack = 1000;
    }
}
