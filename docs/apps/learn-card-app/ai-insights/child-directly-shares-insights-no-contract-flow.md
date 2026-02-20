# Child Directly Shares Insights (No Contract)

This flow describes when a child directly shares their AI insights with a teacher with parent approval, but the teacher has not yet created an AI Insights contract.

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
    Note over App: No contract exists

    App->>Teacher: Notify teacher (child wants to share insights)
    Teacher->>App: Open share request
    Teacher->>App: Approve & request access

    App->>LearnCard: Create AI Insights contract (teacher-owned)

    App->>Child: Redirect to ConsentFlow
    LearnCard->>Child: Display newly created contract
    Child->>LearnCard: Confirm consent

    LearnCard->>LearnCard: Create Terms record
    LearnCard->>App: Redirect with DID

    App->>LearnCard: Fetch shared AI insights
    App->>Teacher: Display child insights
```
