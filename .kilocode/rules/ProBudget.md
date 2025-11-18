# ProBudget.md



## Guidelines

- any changes related to colour or positioning or any aesthetic change make sure that you diagnose it and make all the changes in all the places related to theme. So that any change should reflect the whole team so if I change other colour of the theme, all the places inside that theme should have same changes respective to that colour theme.
- whenever you need to debug or find why the thing is not working always add Loggings statements so that I can see on the Terminal what's happening. 
-I am running this website locally:
pathania@162837S0 probudget-tracker % npm run dev:all


> probudget-tracker@0.0.0 dev:all
> concurrently -k -n server,web -c green,blue "npm:server" "npm:dev"

[server] 
[server] > probudget-tracker@0.0.0 server
[server] > node server/index.js
[server] 
[web] 
[web] > probudget-tracker@0.0.0 dev
[web] > vite
[web] 
[web] 
[web]   VITE v6.4.1  ready in 277 ms
[web] 
[web]   ➜  Local:   http://localhost:3000/
[web]   ➜  Network: http://192.168.178.22:3000/
[web]   ➜  Network: http://10.98.152.54:3000/
[server] CORS middleware configured to allow origins: [
[server]   'https://probudget-frontend.onrender.com',
[server]   'http://localhost:5173',

-the same when I commit and push to GIT, this is then deployed the website on https://probudget-frontend.onrender.com/
https://probudget-backend.onrender.com
 Both front end and back and is deployed there.
 on backend i have added following env variables : DATABASE_URL, GEMINI_API_KEY, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, SUPABASE_ANON_KEY, SUPABASE_URL

 On frontend deployment i have added VITE_API_BASE_URL, VITE_GEMINI_API_KEY

