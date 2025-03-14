import { useState } from 'react'
import './App.css'

// API URL - Updated to point to Azure backend
const API_URL = 'https://yang2-api.azurewebsites.net/api/prompt';

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
        throw new Error(`Server responded with status: ${response.status}`)
      }
      
      const data = await response.json()
      setResponse(data.response)
    } catch (error) {
      console.error('Error fetching response:', error)
      setError('Could not connect to the server. Please make sure the backend is running.')
      setResponse('Error: Could not get a response. Please try again.')
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
          {error}
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
