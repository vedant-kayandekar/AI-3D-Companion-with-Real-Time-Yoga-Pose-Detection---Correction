from fastapi import FastAPI
from fastapi.responses import JSONResponse
from logger import logger
from fastapi import Request

async def catch_exception_middleware(request:Request,call_next):
    try:
        return await call_next(request)
    except Exception as e:
        logger.exception("UNHANDLED EXCEPTION")
        return JSONResponse(status_code=500,content={"error":str(e)})
