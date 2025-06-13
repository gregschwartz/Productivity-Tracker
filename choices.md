# Decision Making Process

I originally started out planning on using Chroma since that was the suggestion for the vector database. 

Then I realized I also needed a spot to store the tasks, and felt it would be easier to just use Postgres with the vector plugin.

Besides that, I tried to stick pretty close to the requirements of React and hooks (e.g., useState, useEffect).

I also wanted to have back-end tests so that if the AI made a ton of changes and broke things, I could detect it quickly. 



# Selection of Libraries, Models, and Other Components

## Libraries

For LLM debugging, I used the [Weave tool from Weights and Biases](https://wandb.ai). I originally started using it after listening to a podcast run by one of their employees, and it was also the eval tool I heard about most from other people. Also experimented with [Braintrust](https://www.braintrust.dev/) after seeing talks of theirs at the AI Engineer World's Fair, but didn't ultimately keep it in. 

Overall, I knew I didn't want to have to recreate the wheel for things if I could avoid it, like animation, routing, calendars, security. So in some cases, I specifically asked in a session for recommended libraries and got:

- framer-motion
- react-calendar
- react-router-dom

In other cases, I simply gave it instructions, e.g., within [instructions/2-architecture.md](instructions/2-architecture.md) where I asked for a visualization library and got:

- recharts

Later on, I asked for a sanitization library and error checking, got:

- dompurify
- ErrorBoundary

## Models

### Text Generation
I've used OpenAI quite a bit, as well as Anthropic models. It changes a little bit depending on the model, but in general, I prefer text written by OpenAI. I used an API key of my own. I imagine you have a few available, but if not, I can send you mine. 

### Code Generation and Assistant

I've Been using Cursor for months, so I used it for some of the code. 

However, I wanted to explore running multiple agents at once after seeing a talk at the AI Engineer World's Fair on https://github.com/dagger/container-use/ from the creator of Docker and Dagger. So I got a subscription to Claude Pro and have been experimenting with Claude Code in this project as well.

## Other Components

