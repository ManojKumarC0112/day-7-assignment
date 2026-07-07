from pathlib import Path
import logging

logger = logging.getLogger("NOVA_AI")

PROMPTS_DIR = Path(__file__).parent

def load_prompt(prompt_name: str) -> str:
    try:
        prompt_path = PROMPTS_DIR / f"{prompt_name}.txt"
        if not prompt_path.exists():
            default = f"You are Nova AI, a helpful assistant. (Prompt {prompt_name} not found)"
            logger.warning(f"Prompt {prompt_name}.txt not found. Using default.")
            return default
        with open(prompt_path, "r", encoding="utf-8") as f:
            return f.read().strip()
    except Exception as e:
        logger.error(f"Error loading prompt {prompt_name}: {e}")
        return "You are Nova AI, a helpful assistant."
