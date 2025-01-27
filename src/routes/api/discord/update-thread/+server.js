import {fetchSettings} from "$lib/supabase";
import dotenv from 'dotenv';
dotenv.config()

const discordToken = process.env.BOT_TOKEN;

let scheme = {};

// Function to fetch settings
async function loadSettings() {
    scheme = await fetchSettings(); // Fetch settings from the database
}

export async function PATCH({ request }) {
    await loadSettings();
	console.log(request);
	const body = await request.json();
	console.log("BODY", JSON.stringify(body));

    const unarchiveResponse = await fetch(
        `https://discord.com/api/v10/channels/${body.message_id}`,
        {
            method: "PATCH",
            headers: {
                Authorization: `Bot ${discordToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                archived: false, // Unarchive the thread
            }),
        }
    );

    if (!unarchiveResponse.ok) {
        const errorData = await unarchiveResponse.json();
        console.error("Failed to unarchive thread:", errorData);
        return new Response(JSON.stringify(errorData), { status: unarchiveResponse.status });
    }

	// Update thread and post first message
    // Create new thread and post first message
	const response = await fetch(
		`https://discord.com/api/v10/channels/${body.message_id}/messages/${body.message_id}`,
		{
			method: "PATCH",
			headers: {
				Authorization: `Bot ${discordToken}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify(body),
		}
	);
	const data = await response.json();
	console.log("THREAD DATA", data);
	return new Response(JSON.stringify(data), { status: 300 });
}