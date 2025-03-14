import { useState } from 'react'
import './App.css'

// API URL
const API_URL = 'http://localhost:8000/api/prompt';

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
      <h1>AI Prompt Interface</h1>
      
      <div className="input-container">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter your prompt here..."
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
          {loading ? 'Processing...' : 'Submit'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {submitted && (
        <div className="response-container">
          <h2>Response:</h2>
          <div className="response-content">
            {loading ? (
              <p>Waiting for response...</p>
            ) : (
              response.split('\n').map((line, index) => (
                <p key={index}>{line}</p>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default App
