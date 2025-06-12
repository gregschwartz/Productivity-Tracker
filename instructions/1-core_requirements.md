### Productivity Tracker Application Template with Weekly Summary and Historical Search
#### Describe the Feature
Create a simple application using React that allows me to track my daily productivity tasks (e.g., tasks completed, time spent, focus level) with an intuitive interface and appealing visual design. It should include a visual element (e.g., a bar chart or heatmap) to show productivity trends over time, helping me understand my work patterns.

**Gen-AI Task Part One**:At the end of each week, the application should generate a one-paragraph summary report of the tasks and productivity metrics collected over the week, along with suggestions to improve efficiency or focus for the next week. This summary and suggestions should be generated using a free GenAI API (e.g., a ChatGPT-like API). If an API key is required, users can contact us for a temporary free API key.

**Gen-AI Task Part Two**: Store weekly productivity summaries and suggestions in a vector store and create an agent that allows users to search for past weeks with similar productivity patterns. Developers can use LangChain or Pydantic-AI for implementing the agent and vector store of your choose.

#### Testing Guide
**Setup / Context**

* Use React.js to set up the project.
* Use functional components and React hooks (e.g., useState, useEffect).
* Include comments in your code to explain your logic.
* For the weekly summary, integrate a free GenAI API to generate the report and suggestions. If need api key contact us.
* For the part two, use LangChain or Pydantic-AI to implement a vector store (e.g., Chroma, FAISS) and an agent to search past productivity summaries.

**Tests to Perform**

* Ensure I can add or edit tasks easily (e.g., input task name, time spent, and focus level).
* Ensure the tasks are displayed with appropriate visual styling (e.g., color-coded by category or focus level).
* Ensure that the application looks good and is user-friendly across common use cases (e.g., desktop and mobile views).
* Ensure that it stores my task information even when refreshed (e.g., using localStorage or a backend).
* Verify that a weekly summary report is generated, summarizing the week’s productivity (e.g., tasks completed, average focus) in one paragraph and providing actionable suggestions for the next week (e.g., time management tips).
* For the part two, test that weekly summaries and suggestions are stored in a vector store and that the agent can accurately search for past weeks with similar productivity patterns based on user queries (e.g., “Show me weeks when I completed a lot of coding tasks”).

#### Submission
* Create a private GitHub repository and share the link with [@am2222](https://github.com/am2222) and [@mandaleeyp](https://github.com/mandaleeyp).
* Ensure the repository includes a README file with instructions on how to:
  
  * Run the React project.
  * Configure the vector store and agent for the advanced feature (e.g., dependencies for LangChain or Pydantic-AI, vector store setup).
  * **Advanced-Level Feature**: Include a Dockerfile or DockerCompose file to setup requirement apis or if needed build the app
* Include sample data or scripts to populate the vector store for testing the historical productivity search.
* Candidates are required to provide another md file outlining their decision-making process and justifying the technical selections of libraries, models, and other components. You can link it to the main Readme.md.

### Example Details
* **Daily Input**: Users log tasks (e.g., “Wrote code,” “Team meeting”), time spent (e.g., 2 hours), and focus level (e.g., low, medium, high).
* **Visualization**: A heatmap showing task completion by day or a bar chart comparing focus levels across weeks.
* **Weekly Summary**: A GenAI-generated report like, “This week, you completed 15 tasks, mostly coding, but focus was low on Wednesday. Try scheduling deep work sessions earlier next week.”
* **Historical Search**: Query like “Find weeks where I completed similar coding tasks” retrieves past summaries using vector similarity in the store.

