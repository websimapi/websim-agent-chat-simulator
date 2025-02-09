const chatContainer = document.getElementById("chat-container");
const startChatButton = document.getElementById("start-chat");

// Keeps track of last fetch time for rate limiting
let lastFetchTime = 0;
const RATE_LIMIT_MS = 7000;

// Simulate conversation state
let conversationHistory = [];
let currentAgent = 1;

// Utility function for appending messages with a fade-in animation
function appendMessage(agent, message) {
  const msgDiv = document.createElement("div");
  msgDiv.className = `message agent${agent}`;
  const msgSpan = document.createElement("span");
  msgSpan.textContent = message;
  msgDiv.appendChild(msgSpan);
  chatContainer.appendChild(msgDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Rate limited wrapper around fetch for calling the simulated LLM API
async function rateLimitedFetch(url, options) {
  const now = Date.now();
  const elapsed = now - lastFetchTime;
  if (elapsed < RATE_LIMIT_MS) {
    // Wait for the remainder of the delay.
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_MS - elapsed));
  }
  
  lastFetchTime = Date.now();
  return fetch(url, options);
}

// Function to call the LLM API for conversation
async function getAIResponse(promptText) {
  try {
    const response = await rateLimitedFetch('/api/ai_completion', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
      },
      body: JSON.stringify({ 
        prompt: `Given the conversation so far, generate a short reply for an agent.
        
interface Response {
  reply: string;
}
{
  "reply": "I understand your point. Let me share more insights..."
}
`,
        data: {
          conversation: conversationHistory,
          currentAgent,
          promptText,
        }
      }),
    });
    const data = await response.json();
    return data.reply;
  } catch (error) {
    console.error('Error fetching AI response:', error);
    return "There was an error generating a response.";
  }
}

// Function to simulate agent conversation
async function processConversation() {
  startChatButton.disabled = true;
  
  // agent conversation: send a prompt message from the current agent.
  const agentMessage = currentAgent === 1 ? "Hello, how are you today?" : "I'm good, thanks for asking!";
  appendMessage(currentAgent, agentMessage);
  conversationHistory.push({agent: currentAgent, message: agentMessage});
  
  // Get the response from the other agent
  const respondingAgent = currentAgent === 1 ? 2 : 1;
  const aiReply = await getAIResponse(agentMessage);
  
  appendMessage(respondingAgent, aiReply);
  conversationHistory.push({agent: respondingAgent, message: aiReply});
  
  // Toggle currentAgent for next round (simulate back-and-forth)
  currentAgent = respondingAgent;
  startChatButton.disabled = false;
}

// Attach event listener to button to start continual conversation
startChatButton.addEventListener("click", async () => {
  await processConversation();
});