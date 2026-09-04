# Student Directly Shares Insights (Existing Contract)

This flow describes when a student wants to share their AI insights directly with a teacher, without the teacher first requesting them (i.e., the teacher has an existing AI Insights contract).

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

    alt Contract exists
        App->>Student: Redirect to ConsentFlow
        LearnCard->>Student: Display AI Insights contract
        Student->>LearnCard: Confirm consent

        LearnCard->>LearnCard: Create Terms record
        LearnCard->>App: Redirect with DID

        App->>Teacher: Notify teacher (student shared insights)
        App->>LearnCard: Fetch shared AI insights
        App->>Teacher: Display student insights
    end
```
