<concept_spec>
concept ConcertStatsAI [User]

purpose 
    Automatically summarizes a user’s concert history and generates personalized recommendations for future artists to see, enhancing self-reflection and discovery

principle 
    Given a user’s concert log, the AI augmentation generates a structured text summary and artist recommendations based on user patterns, genres, and ratings

state
    a set of concertRecord with
        a userId String
        an artist String
        a venue String
        a date String
        an optional rating Number

    a set of concertSummary with
        a summary String
        a set of String recommendations

actions
    logConcert(userId, artist, venue, date, rating?)
        requires concert exists and user in concert.attendingUsers
        effect stores a new concert record for that user

    generateSummaryAI(userId, llm, promptVariant?)
        requires user has at least one logged concert
        effect sends the user’s concert data to an LLM. The model summarizes concert trends (as one paragraph) and suggests 2–3 similar artists. It returns both a summary and recommendations array

    getUserStats(userId)
        requires user exists and has at least one logged concert
        effect aggregates total concerts, unique artists, and average rating

</concept_spec>