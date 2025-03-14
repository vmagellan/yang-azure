# Gunicorn configuration file for Azure App Service
import multiprocessing

# Worker configuration
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "uvicorn.workers.UvicornWorker"
bind = "0.0.0.0:8000"
timeout = 120

# Log configuration
loglevel = "info"
accesslog = "-"
errorlog = "-"

# For development
reload = True 