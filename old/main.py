from fastapi import FastAPI
from fastapi.responses import JSONResponse
import uvicorn

# Create FastAPI instance
app = FastAPI(
    title="Adaptive Backend API",
    description="A simple FastAPI backend with health check endpoint",
    version="1.0.0"
)

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Welcome to Adaptive Backend API"}

@app.get("/healthtest")
async def health_test():
    """Health check endpoint"""
    return JSONResponse(
        status_code=200,
        content={
            "status": "healthy",
            "message": "Backend is running successfully",
            "timestamp": "2024-01-01T00:00:00Z"  # You can add actual timestamp logic here
        }
    )

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
