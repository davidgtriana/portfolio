export class Player{
    name!: string;
    stack: number = 0;

    constructor(name:string){
        this.name = name;
        this.stack = 1000;
    }
}