from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path

# Load configuration before importing routers that read provider keys.
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from ai_router import router as ai_router_instance
from pdf_router import router as pdf_router_instance
from ats_router import router as ats_router_instance

app = FastAPI(title="Veyfolio API")
api_router = APIRouter(prefix="/api")


@api_router.get("/")
async def root():
    return {"message": "Hello World"}


app.include_router(api_router)
app.include_router(ai_router_instance)
app.include_router(pdf_router_instance, prefix="/api/pdf")
app.include_router(ats_router_instance)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[
        origin.strip()
        for origin in os.environ.get(
            'CORS_ORIGINS', 'https://veyfolio.thekartiksharma.in'
        ).split(',')
        if origin.strip()
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
