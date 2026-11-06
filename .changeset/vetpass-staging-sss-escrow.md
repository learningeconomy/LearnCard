---
"learn-card-app": patch
---

VetPass staging (`staging.vetpass.app`) now signs in with SSS and enrolls in escrow recovery on the staging enclave, using LearnCard's authority tenant (`escrowAuthorityTenant: "learncard"`) and LearnCard staging's enclave pins. Existing VetPass staging accounts are upgraded from Web3Auth on their next sign-in. VetPass production stays on Web3Auth until the SSS switch. Recovery emails from the enclave still say "LearnCard", and the app explains this.
