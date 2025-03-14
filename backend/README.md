# Random Response API

A simple FastAPI backend that returns random responses from a predefined array.

## Features

- REST API endpoint to process prompt requests
- Returns random responses from a predefined array
- CORS configuration to allow requests from the frontend

## Getting Started

### Prerequisites

- Python 3.7+
- pip (Python package installer)

### Installation

1. Navigate to the backend directory:

```bash
cd backend
```

2. Install the required dependencies:

```bash
pip install -r requirements.txt
```

### Running the Server

To start the development server:

```bash
uvicorn main:app --reload
```

The API will be available at: http://localhost:8000

For automatic reloading during development:

```bash
python main.py
```

### API Documentation

FastAPI automatically generates API documentation:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Endpoints

### GET /

Returns a welcome message.

### POST /api/prompt

Processes a prompt and returns a random response.

#### Request Body

```json
{
  "prompt": "Your question or prompt here"
}
```

#### Response

```json
{
  "response": "Response to: 'Your question or prompt here'\n\nRandom response from the array",
  "status": "success"
}
```

## Integration with Frontend

The frontend is configured to connect to this API. The backend includes CORS settings that allow requests from:

- http://localhost:5173
- http://localhost:5174

If your frontend runs on a different URL, update the `allow_origins` in `main.py`. 