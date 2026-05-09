### What did you build and why? What did you deliberately cut?

Actaully after reading the problem statement i thought of a car recommendation system and went with this idea. 
I actually cut/skipped many things 
1. query parsing --- currently i am parsing query manually using regular expressions and all. it might break in complex queries. 
my next improvement first will be to send this query to AI to get all the necessary points and extract things. if it is too vague i'll just recommend highly rates cars. 
2. currently i am using seeded data created by AI but it should be a big dataset which should include all the available cars with reviews section also that will help user better understand what people think about car in my cuurent data if you see their is no car below 5 lakh so it cant give accurate results. it is still working ok giving near results. but a bigger dataset would be better. 
3. Authentication/Auth.
4. ability to add cars. 
5. payments if someone wants to buy a car.
6 admin dashboards
7. fancy animations


### What’s your tech stack and why did you pick it?

I picked react vite and flask and postgres because i use this techstack currently and if their is any issue in the logic or code i will be able to debug it easily. 

### What did you delegate to AI tools vs. do manually? Where did the tools help most?
Where did they get in the way?

I actually created whole project with Cursor. only when i am about to integrate with openAI for better search query extraction and cleaning actuall datasets that might require more human intervention.


### If you had another 4 hours, what would you add?

Definelty i will add Better search engine and Actual dataset first. 



### code improvement. 

I would make a seprate file to keep all same functioning API's so that  i wont need to use them in code directly.
I would also introduce filters in the app if user wants to filter on a particular aspect like rating>3 or milage > 20 ans so on 

### just run docker compose build to run this project locally. 
command: `sudo docker compose up --build`   --- sudo if you need to have admin permissions. else `docker compose up --build`

