import { rest } from "./discordBot.js";
import config from "./config.js";

const commands = [
    {
        name: "ping",
        description: "Checks if bot is online - should respond pong",
    },
    {
        name: "problem",
        description: "Create a new problem",
        options: [
            {
                name: "title",
                description: "The title of the problem",
                type: 3,
                required: true
            },
            {
                name: "difficulty",
                description: "Problem difficulty",
                type: 4,
                required: true,
                choices: [
                    { name: "Easy", value: 1 },
                    { name: "Medium", value: 2 },
                    { name: "Hard", value: 3 }
                ]
            }
        ]
    }
];

export async function registerCommands(isDevelopment = false) {
    try {
        const route = isDevelopment
            ? `/applications/${config.DISCORD_CLIENT_ID}/guilds/${config.GUILD_ID}/commands`
            : `/applications/${config.DISCORD_CLIENT_ID}/commands`;
            
        await rest.put(route, { body: commands });
        console.log("Successfully registered application commands.");
    } catch (error) {
        console.error("Error registering commands:", error);
    }
}