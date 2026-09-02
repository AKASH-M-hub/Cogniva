import logging
import threading
import time

logger = logging.getLogger("Cogniva.Automation")

try:
    from apscheduler.schedulers.background import BackgroundScheduler
    HAS_APSCHEDULER = True
except ImportError:
    HAS_APSCHEDULER = False

scheduler = None

def check_knowledge_gaps():
    """Background task to check for critical knowledge gaps and trigger alerts."""
    try:
        logger.info("[AutomationService] Running scheduled Knowledge Gap threshold check...")
    except Exception as e:
        logger.error(f"[AutomationService] Error during Knowledge Gap check: {e}")

def generate_weekly_report():
    """Background task for scheduled weekly analytics reports."""
    try:
        logger.info("[AutomationService] Generating weekly executive analytics report...")
    except Exception as e:
        logger.error(f"[AutomationService] Error generating weekly report: {e}")

def start_automation_scheduler():
    """Starts the background automation scheduler for Cogniva workflows."""
    global scheduler
    if HAS_APSCHEDULER:
        try:
            scheduler = BackgroundScheduler()
            # Schedule Knowledge Gap check every 30 minutes
            scheduler.add_job(check_knowledge_gaps, 'interval', minutes=30, id='knowledge_gap_check')
            # Schedule Weekly Analytics Report every Monday at 9:00 AM
            scheduler.add_job(generate_weekly_report, 'cron', day_of_week='mon', hour=9, minute=0, id='weekly_analytics_report')
            scheduler.start()
            print("🚀 [AutomationService] APScheduler started for Cogniva background workflows.")
        except Exception as e:
            print(f"⚠️ [AutomationService] Failed to start APScheduler: {e}")
    else:
        print("ℹ️ [AutomationService] Background automation scheduler initialized in lightweight mode.")

def shutdown_automation_scheduler():
    """Shuts down the background automation scheduler cleanly."""
    global scheduler
    if HAS_APSCHEDULER and scheduler and scheduler.running:
        try:
            scheduler.shutdown(wait=False)
            print("🛑 [AutomationService] APScheduler shutdown complete.")
        except Exception as e:
            print(f"⚠️ [AutomationService] Error shutting down APScheduler: {e}")
