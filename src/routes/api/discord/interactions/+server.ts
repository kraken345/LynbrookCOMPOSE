import nacl from "tweetnacl";
import {fetchSettings} from "$lib/supabase";
import {
	InteractionResponseType,
	InteractionType,
	MessageComponentTypes,
} from "discord-interactions";


const discordToken = import.meta.env.VITE_BOT_TOKEN;

const PUBLIC_KEY = import.meta.env.VITE_BOT_PUBLIC_KEY;

let scheme = {};

// Function to fetch settings
async function loadSettings() {
    scheme = await fetchSettings(); // Fetch settings from the database
}
//Change
async function verifyRequest(req, body) {
	const signature = req.headers.get("X-Signature-Ed25519");
	const timestamp = req.headers.get("X-Signature-Timestamp");
	const isVerified = nacl.sign.detached.verify(
		Buffer.from(timestamp + body),
		Buffer.from(signature, "hex"),
		Buffer.from(PUBLIC_KEY, "hex")
	);
	console.log(isVerified);
	return isVerified;
}

class JsonResponse extends Response {
	constructor(body, init) {
		const jsonBody = JSON.stringify(body);
		init = init || {
			headers: {
				"content-type": "application/json;charset=UTF-8",
			},
		};
		super(jsonBody, init);
	}
}

export async function GET({ request }) {
    try {
        return new Response("👋", {
            headers: {
                'Content-Type': 'text/plain'
            }
        });
    } catch (error) {
        return new Response(error.message, { status: 500 });
    }
}

export async function POST({ request }) {
    try {
        await loadSettings();
        let text = await request.text();
        const isValidRequest = await verifyRequest(request, text);
        text = JSON.parse(text);

        if (!isValidRequest) {
            return new Response("Invalid request signature", { 
                status: 401, 
                statusText: "Unauthorized",
                headers: {
                    'Content-Type': 'text/plain'
                }
            });
        }

        // Handle different interaction types
        switch (text.type) {
            case InteractionType.APPLICATION_COMMAND:
                return handleCommand(text);
                
            case InteractionType.MESSAGE_COMPONENT:
                return handleComponent(text);
                
            case InteractionType.MODAL_SUBMIT:
                return handleModalSubmit(text);
            
            default:
                return new JsonResponse({
                    type: InteractionResponseType.PONG
                });
        }
    } catch (error) {
        console.error('Error processing request:', error);
        return new Response(error.message, { 
            status: 500,
            headers: {
                'Content-Type': 'text/plain'
            }
        });
    }
}

async function handleCommand(interaction) {
	const { data: { name, options } } = interaction;

	switch (name) {
		case "ping":
			return new JsonResponse({
				type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
				data: {
					content: "Pong!",
					components: [{
						type: MessageComponentTypes.ACTION_ROW,
						components: [{
							type: MessageComponentTypes.BUTTON,
							style: 1,
							custom_id: "ping_button",
							label: "Click me!"
						}]
					}]
				}
			});

		case "problem":
			return new JsonResponse({
				type: InteractionResponseType.MODAL,
				data: {
					custom_id: "problem_modal",
					title: "Create New Problem",
					components: [{
						type: MessageComponentTypes.ACTION_ROW,
						components: [{
							type: MessageComponentTypes.TEXT_INPUT,
							custom_id: "problem_title",
							label: "Problem Title",
							style: 1,
							min_length: 1,
							max_length: 100,
							required: true
						}]
					}]
				}
			});
	}
}

async function handleComponent(interaction) {
	const { data: { custom_id } } = interaction;

	if (custom_id === "ping_button") {
		return new JsonResponse({
			type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
			data: {
				content: "Button clicked!",
				flags: 64 // Ephemeral - only visible to the user who clicked
			}
		});
	}
}

async function handleModalSubmit(interaction) {
	const { data: { custom_id, components } } = interaction;

	if (custom_id === "problem_modal") {
		const problemTitle = components[0].components[0].value;
		return new JsonResponse({
			type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
			data: {
				content: `Created problem: ${problemTitle}`,
				flags: 64
			}
		});
	}
}
