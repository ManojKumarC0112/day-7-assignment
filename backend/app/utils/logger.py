import logging
import sys
from pathlib import Path

# Create logs directory if it doesn't exist
log_dir = Path("logs")
log_dir.mkdir(exist_ok=True)

# Format for the logs
log_format = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

# Setup basic configuration
logging.basicConfig(
    level=logging.INFO,
    format=log_format,
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("logs/nova_ai.log", mode="a"),
    ],
)

logger = logging.getLogger("NOVA_AI")
