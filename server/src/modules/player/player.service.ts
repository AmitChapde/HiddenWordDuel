import {prisma} from "../../config/prisma.js";

/**
 * Creates a new player or returns existing one
 * based on unique username.
 */

export async function findOrCreatePlayer(username:string){
    if(!username) throw new Error("username is required");

    const name=username.trim();

    const existing=await prisma.player.findUnique({
        where:{username:name},
    })

    if(existing) return existing;

    const player=await prisma.player.create({
        data:{username:name}
    })

    return player;
}