import logging
import sys

from proj_logging.settings import LoggerSettings


def get_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)
    logger.setLevel(LoggerSettings().level)
    logger.propagate = False

    if not logger.handlers:
        stream_handler = logging.StreamHandler(sys.stdout)
        stream_handler.setFormatter(logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s"))
        logger.addHandler(stream_handler)

    return logger
