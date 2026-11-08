-- Where to see the exercise done (an external page). Empty for now: the app links to a YouTube search.
ALTER TABLE "exercises" RENAME COLUMN "video_url" TO "reference_url";
