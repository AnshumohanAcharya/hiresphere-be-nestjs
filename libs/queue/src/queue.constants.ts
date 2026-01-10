export const JOB_CRAWLER_QUEUE = 'job-crawler-queue';

// Define the job types (tasks) that can be sent to this queue
export const JOB_TASK_TYPES = {
  SYNC_JOBS: 'sync_jobs', // Triggered by Scheduler
  SCRAPE_DETAIL: 'scrape_detail', // Triggered by Worker (internal)
};
