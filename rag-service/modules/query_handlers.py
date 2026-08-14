from logger import logger

def query_chain(chain, user_input: str):
    try:
        logger.debug(f"Running chain for input: {user_input}")
        result = chain.invoke({"input": user_input})
        
        # LCEL returns string directly, not dict
        response = {
            "response": result,  # ✅ Just the string answer
            "sources": []  # Add source handling later if needed
        }
        logger.debug(f"Chain response: {response}")
        return response
    except Exception as e:
        logger.exception("Error on query chain")
        raise
