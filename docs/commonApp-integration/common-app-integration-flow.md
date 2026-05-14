flowchart TD
A[Institution issues CLR 2.0 transcript / credentials]
--> B[Learner receives credentials in LearnCard Wallet]

    B --> C[Learner installs Common App Connector App]

    C --> D[User initializes Common App connection]

    D --> E[OAuth / Auth flow with Common App Partner APIs]

    E --> F[Connector App receives access + refresh tokens]

    F --> G[Connector reads learner-approved credentials from LearnCard Wallet]

    G --> H[Connector maps CLR 2.0 / VC fields to Common App applicant schema]

    H --> I[Applicant reviews proposed prefilled application fields]

    I --> J{Applicant approves prefill?}

    J -->|Yes| K[Connector submits / syncs applicant data to Common App APIs]

    J -->|No| L[Applicant edits or rejects mapped fields]

    K --> M[Application sync completed]
