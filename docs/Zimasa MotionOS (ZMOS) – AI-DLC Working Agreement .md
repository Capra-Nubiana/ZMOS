Zimasa MotionOS (ZMOS) – AI-DLC Working Agreement
Parties:
 Client / Product Owner &amp; Architect: Zimasa (represented by &lt;Your Name&gt;)
 Consultant Developer: &lt;Consultant Name&gt;
Scope:
Building Zimasa MotionOS (ZMOS) – the Movement &amp; Fitness OS for the Zimasa
Health Engagement Platform – using an AI-Driven Development Lifecycle (AI-DLC).

1. Purpose of This Agreement
This document defines how we work together, not just what we build.
 Ensure ZMOS is built quickly but correctly, using AI as a force multiplier.
 Protect the architecture and domain integrity (movement as health
engagement, not generic gym SaaS).
 Make responsibilities, processes, and quality expectations explicit.

2. Roles &amp; Responsibilities
Client (Product Owner &amp; Architect)
 Owns vision, scope and priorities for ZMOS.
 Defines and clarifies requirements, constraints and business rules.
 Guards architecture and domain boundaries, especially:
o ZMOS vs ZHEP responsibilities.
o Standalone vs ZHEP-integrated modes.
 Reviews:
o AI elaboration/design notes for key features.
o Demos and acceptance criteria.

Consultant Developer
 Owns implementation of ZMOS within agreed architecture.

 Uses AI (Cursor/ChatGPT, etc.) as a core part of the development process,
not an optional extra.
 Produces:
o Clean, maintainable code,
o Tests,
o Lightweight docs,
o AI design artifacts.

3. Guiding Principles
1. ZMOS is standalone-capable
o Must work for gyms that use ZMOS only (no ZHEP).
o ZHEP integrations are optional adapters, not hard dependencies.
2. Ports &amp; Adapters for Cross-Cutting Concerns
o Identity, eligibility/benefits, payments, messaging, analytics must go
through interfaces, not be hard-coded to ZHEP.
3. Movement as Health Engagement, not just Gym Ops
o Core domain: Movement Journeys, Movement Tiles, Movement Events,
Movement Adherence Score, Movement Prescription Profiles (MPPs), etc.
o Everything we build should support behaviour change and preventive
health, not just admin.

4. AI-DLC by Default
o Every feature follows an AI-assisted cycle:
Problem framing → AI elaboration → human design decision →
implementation with AI assist → tests &amp; demo.

5. Small, Documented Steps
o Prefer many small, documented increments to big, undocumented leaps.

4. AI-DLC Lifecycle for Each Feature
Every feature or EPIC goes through the following steps.

Step 1 – Problem Framing (Ticket)
Owner: Consultant (with input from Client)
 Create an issue/ticket that clearly states:
o Module: MoveOS, PulseLoop, CarePath Move, or Corporate Accounts.
o User story / use case.
o Inputs/outputs and constraints: multi-tenant, ZMOS-only vs ZHEP
mode, performance/security notes.

 Client reviews and may refine the framing if needed.
Deliverable: Ticket in the tracker with a clear, concise problem description.

Step 2 – AI Elaboration (Design Note)
Owner: Consultant (using AI tools)
 Use Cursor/ChatGPT to elaborate the design from the ticket. At minimum, this
should cover:
o Proposed data model changes (entities, relationships, key fields).
o Proposed APIs / service interfaces.
o Key flows and edge cases.
o Any ports/interfaces required (e.g. EligibilityService, IdentityService).
o Suggested test cases.
 Save this as a design note in the repo, e.g.:
design/&lt;FEATURE_NAME&gt;-ai-elaboration.md
Deliverable: AI elaboration/design note checked into the repo and linked from the
ticket.

Step 3 – Design Decision (Review &amp; Approval)
Owner: Client (with input from Consultant)
 Client reviews the design note and checks:
o Alignment with ZMOS core domain and terminology.

o Respect for ZMOS vs ZHEP boundaries.
o Respect for ports &amp; adapters (no hard ZHEP coupling).
o Sanity of data model proposals.
 Outcome:
o Approve an option (“Go with Option 2, but adjust X/Y”), or
o Request a focused revision.

Deliverable: Short written decision/comment on the ticket (“Approved: implement as
per design note, with changes A, B.”).

Step 4 – Implementation with AI Assist
Owner: Consultant
 Implement the agreed design in a feature branch:
o Database migrations,
o Domain entities/services,
o API endpoints,
o Ports/adapters where required,
o Unit/integration tests.
 Use AI for:
o Code generation,
o Boilerplate,
o Test suggestions,
o Refactoring proposals.
 Consultant remains responsible for:
o Code quality,
o Correctness,
o Readability,
o Performance.

Deliverables:
 Code + migrations + tests in a feature branch.
 Updated docs (if needed) in docs/&lt;FEATURE_NAME&gt;.md.
 Link back to the original design note.

Step 5 – Demo &amp; Acceptance
Owner: Consultant (demo), Client (acceptance)
 Consultant provides a short test script:
o Steps to exercise the feature end-to-end (API calls or UI flows).
 Client runs through the scenario and verifies:
o Behaviour matches expectations.
o Domain concepts are correctly reflected.
o No obvious regressions.
 Client accepts the feature or requests adjustments.
Deliverable: Ticket marked as Done, with acceptance comment.

5. Data Model Approach
We agree on a hybrid model strategy:
1. Core Conceptual Model Up Front
o Early in the project, we define a small core set of entities and relationships
(e.g. Tenant, Location, User, AccessPlan, SessionType, Booking,
MovementEvent, MovementJourney, CorporateAccount).
o This is a conceptual ERD + glossary, not a fully locked schema.
2. Incremental Schema Evolution per Feature
o When implementing a feature:
 Start from the core conceptual model.
 Extend only where necessary.

o All schema changes must go through the AI elaboration → review →
migration process.
3. No Duplicate Core Concepts
o We avoid multiple tables/entities for the same concept (e.g. no separate
“Member” and “User” with overlapping meaning).
o If in doubt, we unify and extend existing entities.

6. Architecture Boundaries (ZMOS vs ZHEP)
To keep responsibilities clear:
 ZMOS owns movement domain logic:
o Movement providers, Movement Journeys, Movement Tiles, Movement
Events, Adherence, Streaks, Challenges, Corporate Accounts (local), etc.

 ZHEP owns shared platform capabilities:
o Global Party/Identity,
o Benefits, wallets, eligibility (ZPS),
o Payments orchestration,
o Messaging infrastructure,
o Health Score Engine,
o Cross-vertical employer/payer programs,
o Global analytics.

Rule:
Any call to ZHEP capabilities happens through well-defined interfaces/ports in ZMOS,
not sprinkled directly inside domain logic.

7. Quality Expectations
1. Tests
o Each feature includes meaningful automated tests:
 Unit tests for core domain logic,
 Integration/API tests where relevant.

o No large untested blocks of critical logic.
2. Docs
o For each feature:
 AI design note (design/…),
 Brief human-readable doc/README section if conceptually
significant.

3. Code Style
o Clear naming aligned with domain language (MovementJourney,
MovementEvent, etc.).
o Consistent project structure.
o No copy-pasted AI code without understanding.
4. Security &amp; Multi-Tenancy
o Every data access and API respects tenant boundaries.
o Sensitive operations (auth, identity, eligibility) go through appropriate
services/ports.

8. Communication &amp; Ceremonies
Weekly Planning Call (30–60 minutes)
 Review:
o Current progress and blockers.
o Next set of features/tickets by module.
 Agree which tickets will go through AI elaboration in the coming week.
Weekly Design Review (30–60 minutes)
 Consultant walks through:
o 1–3 recent AI design notes for significant features.
 Client:
o Confirms/adjusts architecture decisions,
o Flags any domain issues early.

Async Daily/Regular Updates (text)
 Brief status posted in the agreed channel (email/Slack/WhatsApp):
o What was done yesterday,
o What will be done today,
o Any decisions or clarifications needed.

9. Tooling
Preferred tools (can be adjusted by mutual agreement):
 Code &amp; Collaboration: Git (GitHub/GitLab), with feature branches &amp; PRs.
 Issue Tracking: Jira / Linear / GitHub Issues (to be agreed).
 AI Development: Cursor / VS Code with AI plugin + ChatGPT.
 Documentation: Markdown files within the repo + light external docs if needed.
 Communication: Email + messaging (Slack/WhatsApp/Teams) + scheduled
calls.

10. Change Management
 This working agreement is a living document.
 Either party can propose adjustments as we learn:
o About ZMOS domain,
o About the AI-DLC workflow,
o About practical constraints.
 Changes become active once both parties confirm in writing (email or message).