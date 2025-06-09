TODO

# Test Cases
- Verify that a weekly summary report is generated, summarizing the week’s productivity (e.g., tasks completed, average focus) in one paragraph and providing actionable suggestions for the next week (e.g., time management tips).
- For the part two, test that weekly summaries and suggestions are stored in a vector store and that the agent can accurately search for past weeks with similar productivity patterns based on user queries (e.g., “Show me weeks when I completed a lot of coding tasks”).

# Bugs
The code mentions animations, but I can't find any animations actually happening. Add animations especially when logging and when generating summaries.

# Refactor
Refactor into multiple files because way too long 
- frontend/Visualizations.js 

Move db calls in backend/services/database.py into separate classes for each model eg task.py





# Future Features
Add the ability to enter the start and end time as an alternative to entering the duration. 