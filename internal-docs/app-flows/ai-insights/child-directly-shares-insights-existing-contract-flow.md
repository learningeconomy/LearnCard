# Child Directly Shares Insights (Existing Contract)

This flow describes when a child directly shares their AI insights with a teacher with parent approval, and the teacher already has an AI Insights contract.

```mermaid
sequenceDiagram
    participant Child
    participant App
    participant Parent
    participant Teacher
    participant LearnCard

    Child->>App: Open Share Insights
    App->>App: Confirm role = Child

    Child->>App: Initiate Share Insights
    App->>Parent: Request guardian approval

    Parent->>App: Open guardian request
    Parent->>App: Approve sharing

    App->>App: Check for teacher AI Insights contract

    App->>Child: Redirect to ConsentFlow
    LearnCard->>Child: Display AI Insights contract
    Child->>LearnCard: Confirm consent

    LearnCard->>LearnCard: Create Terms record
    LearnCard->>App: Redirect with DID

    App->>Teacher: Notify teacher (child shared insights)
    App->>LearnCard: Fetch shared AI insights
    App->>Teacher: Display child insights
```
