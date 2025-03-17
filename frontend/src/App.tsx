import { useState } from 'react'
import './App.css'

// API URL from environment variables - automatically switches between local and production
const API_URL = import.meta.env.VITE_API_URL || 'https://yang2-api.azurewebsites.net/api/prompt';
console.log('Using API URL:', API_URL);

function App() {
  const [prompt, setPrompt] = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!prompt.trim()) return

    setLoading(true)
    setResponse('')
    setSubmitted(true)
    setError(null)

    try {
      // Make the actual API call to our backend
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      })
      
      if (!response.ok) {
        // Try to get the detailed error message from the response
        let errorMessage = `Server responded with status: ${response.status}`;
        try {
          const errorResponse = await response.json();
          if (errorResponse.detail) {
            errorMessage = `Error: ${errorResponse.detail}`;
          }
        } catch (e) {
          // If we can't parse the JSON, just use the status message
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json()
      setResponse(data.response)
    } catch (error) {
      console.error('Error fetching response:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      
      // Check if API is working by calling the debug endpoint
      try {
        const debugResponse = await fetch(API_URL.replace('/prompt', '/debug'));
        if (debugResponse.ok) {
          const debugData = await debugResponse.json();
          console.log('API debug information:', debugData);
        }
      } catch (debugError) {
        console.error('Could not connect to debug endpoint:', debugError);
      }
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Submit on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSubmit()
    }
  }

  return (
    <div className="app-container">
      <h1>Azure OpenAI Assistant</h1>
      
      <div className="input-container">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask the AI assistant anything..."
          rows={4}
          className="prompt-input"
          aria-label="Prompt input"
        />
        
        <button 
          onClick={handleSubmit} 
          disabled={loading || !prompt.trim()}
          className="submit-button"
          aria-label="Submit prompt"
        >
          {loading ? 'Thinking...' : 'Ask AI'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          <h3>Error:</h3>
          <p>{error}</p>
          <p className="error-help">
            This might be due to missing or incorrect Azure OpenAI credentials.
            Please check the backend logs for more details.
          </p>
        </div>
      )}

      {submitted && (
        <div className="response-container">
          <h2>AI Response:</h2>
          <div className="response-content">
            {loading ? (
              <p>Generating response, please wait...</p>
            ) : (
              <div className="ai-response">
                {response.split('\n').map((line, index) => (
                  line.trim() ? <p key={index}>{line}</p> : <br key={index} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default App
