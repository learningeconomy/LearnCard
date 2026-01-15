# Student Directly Shares Insights (No Contract)

This flow describes when a student wants to share their AI insights directly with a teacher, but the teacher has not yet created an AI Insights contract.

```mermaid
sequenceDiagram
    participant Student
    participant App
    participant Teacher
    participant LearnCard

    Student->>App: Open Share Insights
    App->>App: Confirm role = Student

    Student->>App: Share insights (search / QR / link)
    App->>App: Check for teacher AI Insights contract

    Note over App: No contract exists

    App->>Teacher: Send share request notification
    Teacher->>App: Open share request

    Teacher->>App: Approve share request
    App->>App: Check if teacher has AI Insights contract

    alt Contract does not exist
        App->>LearnCard: Create AI Insights contract (teacher-owned)
    end

    App->>Student: Send consent request notification
    Student->>App: Open consent request

    App->>Student: Redirect to ConsentFlow
    LearnCard->>Student: Display AI Insights contract
    Student->>LearnCard: Confirm consent

    LearnCard->>LearnCard: Create Terms record
    LearnCard->>App: Redirect with DID

    App->>LearnCard: Fetch shared AI insights
    App->>Teacher: Display student insights
```
