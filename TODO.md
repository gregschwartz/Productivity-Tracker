TODO

1. run tests and fix them

2. refactor long files in frontend/src/pages/ by extract Custom Hooks for API Calls

3. The design is bad right now because it is trying to load all summaries and tasks. There could be millions. Update the way the tasks are loaded to load each day on /tasks. Update the way all data is loaded to load just the time period on /analytics. 

4. visualizations.js: Use the same next, previous, today buttons to allow the user to see the previous week, month. 

5. rename visualizations.js to analytics.js and fix all references to it. 

6. make animations last longer.

7. better loading screens for each screen. somehting animated and cute.

8. get rag_service.py and summary_service.py to share a single version of generate_embedding 

8. Act as a senior front-end software engineer. Review EVERY SINGLE FILE IN /frontend as if you are reading code from a senior software engineering candidate who is completing a take-home project as part of the interview process. Point out anything that seems low quality, but do not make any changes.

9. Do the same for backend.

# Bugs
The code mentions animations, but I can't find any animations actually happening. Add animations especially when logging and when generating summaries.

# Test Cases
- Verify that a weekly summary report is generated, summarizing the week’s productivity (e.g., tasks completed, average focus) in one paragraph and providing actionable suggestions for the next week (e.g., time management tips).
- For the part two, test that weekly summaries and suggestions are stored in a vector store and that the agent can accurately search for past weeks with similar productivity patterns based on user queries (e.g., “Show me weeks when I completed a lot of coding tasks”).


