// Array of possible responses
const responses = [
  "That's an interesting question! Let me think about it...",
  "I've considered your prompt carefully. Here's my answer.",
  "Based on my knowledge, I would say...",
  "That's a great prompt! Here's what I think.",
  "I've analyzed your question and have the following thoughts.",
  "Interesting perspective! Here's my response.",
  "Let me offer a different viewpoint on that.",
  "I've processed your prompt and here's what I can tell you.",
  "After careful consideration, my response is...",
  "Thank you for your prompt. Here's my answer."
];

module.exports = async function (context, req) {
  try {
    const requestBody = req.body || {};
    const prompt = requestBody.prompt || '';

    // Validate the input
    if (!prompt.trim()) {
      context.res = {
        status: 400,
        body: { error: "Prompt cannot be empty" }
      };
      return;
    }

    // Select a random response
    const response = responses[Math.floor(Math.random() * responses.length)];

    // Personalize the response with the prompt
    const personalizedResponse = `Response to: '${prompt}'\n\n${response}`;

    context.res = {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      },
      body: {
        response: personalizedResponse,
        status: "success"
      }
    };
  } catch (error) {
    context.res = {
      status: 500,
      body: { error: "An error occurred while processing your request." }
    };
  }
}; 