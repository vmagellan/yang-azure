import random
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Initialize FastAPI app
app = FastAPI(title="Random Response API")

# Configure CORS to allow requests from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "https://jolly-stone-0b1f54d03.6.azurestaticapps.net", "*"],  # Frontend URLs including Azure
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define request model
class PromptRequest(BaseModel):
    prompt: str

# Array of possible responses
responses = [
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
]

@app.get("/")
def read_root():
    return {"message": "Welcome to the Random Response API"}

@app.post("/api/prompt")
async def process_prompt(request: PromptRequest):
    try:
        # Validate the input
        if not request.prompt.strip():
            raise HTTPException(status_code=400, detail="Prompt cannot be empty")
        
        # Select a random response
        response = random.choice(responses)
        
        # Personalize the response with the prompt
        personalized_response = f"Response to: '{request.prompt}'\n\n{response}"
        
        return {
            "response": personalized_response,
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# For debugging purposes
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 