import os
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import AzureOpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="Azure OpenAI API")

# Configure CORS to allow requests from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "https://jolly-stone-0b1f54d03.6.azurestaticapps.net", "*"],  # Frontend URLs including Azure
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Azure OpenAI client
def get_openai_client():
    client = AzureOpenAI(
        api_key=os.getenv("AZURE_OPENAI_API_KEY"),  
        api_version=os.getenv("AZURE_OPENAI_API_VERSION"),
        azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT")
    )
    return client

# Define request model
class PromptRequest(BaseModel):
    prompt: str

@app.get("/")
def read_root():
    return {"message": "Welcome to the Azure OpenAI API"}

@app.post("/api/prompt")
async def process_prompt(request: PromptRequest, client: AzureOpenAI = Depends(get_openai_client)):
    try:
        # Validate the input
        if not request.prompt.strip():
            raise HTTPException(status_code=400, detail="Prompt cannot be empty")
        
        # Create a completion with Azure OpenAI
        deployment_name = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME")
        
        # Call Azure OpenAI service
        response = client.chat.completions.create(
            model=deployment_name,
            messages=[
                {"role": "system", "content": "You are a helpful and knowledgeable AI assistant. Provide clear, concise, and accurate responses to user questions."},
                {"role": "user", "content": request.prompt}
            ],
            temperature=0.7,
            max_tokens=800
        )
        
        # Extract response content
        response_content = response.choices[0].message.content
        
        return {
            "response": response_content,
            "status": "success"
        }
    except Exception as e:
        # Log the exception for debugging
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# For debugging purposes
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 