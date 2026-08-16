from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from middlewares.exception_handlers import catch_exception_middleware
from routes.upload_pdfs import router as upload_router
from routes.ask_question import router as ask_router

app = FastAPI(title="Yoga Assistant RAG Service", description="RAG API for YogaKickFit AI")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True, # Changed from ["*"] to True
    allow_methods=["*"],
    allow_headers=["*"]
)

# middleware exception handlers
app.middleware("http")(catch_exception_middleware)

# health check
@app.get("/health")
def health_check():
    return {"status": "ok", "service": "RAG"}

@app.get("/")
def root():
    return {"message": "Yoga RAG Service is running. Use /ask/ for queries."}

# routers
app.include_router(upload_router)
app.include_router(ask_router)