# Requirements Document

## Introduction

This feature implements a user ranking system for the CareerIQ AI platform. The system computes and displays student rankings based on their career readiness, primarily using ATS (Applicant Tracking System) scores with additional criteria. Rankings enable students to benchmark their progress, allow administrators to identify high-potential candidates, and provide employers with filtered student lists.

## Glossary

- **Student**: A user of the career counseling platform who has uploaded one or more resumes for analysis
- **ATS Score**: An AI-computed score (0-100) that evaluates how well a resume would perform with automated tracking systems, based on formatting, content completeness, and keyword optimization
- **Overall Career Score**: A composite score that combines ATS scores with other career readiness factors to produce a holistic assessment
- **Ranking**: The position of a student relative to other students based on their Overall Career Score
- **Rank Tier**: A qualitative classification (Bronze, Silver, Gold, Platinum) based on percentile ranges
- **Admin**: A user with elevated privileges to view all student data and manage platform settings
- **Employer**: A company or organization that can browse student profiles and rankings

## Requirements

### Requirement 1: ATS Score Calculation

**User Story:** As a developer, I want to understand how ATS scores are calculated, so that I can determine how they should contribute to overall rankings.

#### Acceptance Criteria

1. THE ATS Score SHALL be computed by the existing AI Resume Analyzer using the Master Prompt scoring formula
2. THE ATS Score SHALL be a value between 0 and 100
3. THE ATS Score SHALL be stored in the `resumes.ats_score` column of the PostgreSQL database
4. WHEN multiple resumes exist for a student, THE System SHALL use the highest ATS score from their active or most recent primary resume
5. IF no resume exists for a student, THE ATS Score SHALL be 0

### Requirement 2: Overall Career Score Calculation

**User Story:** As an admin, I want to compute an Overall Career Score that considers multiple factors beyond just ATS score, so that rankings reflect holistic career readiness.

#### Acceptance Criteria

1. WHEN computing Overall Career Score, THE System SHALL use at least ATS Score, Education Score (from GPA/coursework), Projects Score, and Skills Score
2. THE Overall Career Score SHALL be calculated using a weighted formula where ATS Score accounts for 40% of the total
3. THE Remaining 60% SHALL be distributed as follows: Education (20%), Projects (20%), Skills (20%)
4. EACH component score SHALL be normalized to a 0-100 scale before weighting
5. THE Final Overall Career Score SHALL be rounded to the nearest integer

### Requirement 3: Ranking Computation

**User Story:** As a developer, I want to compute student rankings, so that students can see their position relative to peers.

#### Acceptance Criteria

1. WHEN ranking computation is triggered, THE System SHALL sort all students by Overall Career Score in descending order
2. THE Student with the highest Overall Career Score SHALL receive rank position 1
3. WHEN two or more students have identical Overall Career Scores, THE System SHALL assign the same rank to all tied students
4. AFTER tied ranks, THE Next rank position SHALL skip appropriately (e.g., if two students tie for rank 1, the next student is rank 3)
5. EACH Ranking record SHALL be stored in the `rankings` table with the `rank_position` field populated

### Requirement 4: Rank Tier Classification

**User Story:** As an admin, I want to classify students into rank tiers, so that I can quickly identify performance levels.

#### Acceptance Criteria

1. THE System SHALL assign a Rank Tier based on percentile ranges as follows:
   - **Platinum**: 90th percentile and above (top 10%)
   - **Gold**: 75th percentile to 89th percentile (top 25%)
   - **Silver**: 50th percentile to 74th percentile (top 50%)
   - **Bronze**: Below 50th percentile
2. WHEN a student has no ranking data, THE System SHALL default to "No Rank" instead of a tier
3. THE Rank Tier SHALL be stored in the `rank_tier` column of the rankings table

### Requirement 5: Data Sources for Scoring Components

**User Story:** As a developer, I want to know what data sources feed into the scoring components, so that I can ensure all necessary data is available.

#### Acceptance Criteria

1. THE ATS Score SHALL be sourced from the `resumes.ats_score` column (existing AI analysis)
2. THE Education Score SHALL be computed from student academic data: `students.gpa`, `students.course`, `students.branch`, `students.year_of_study`
3. THE Projects Score SHALL be derived from the `resumes.overall_analysis` JSONB column's projects analysis section
4. THE Skills Score SHALL be derived from the `resumes.overall_analysis` JSONB column's skills analysis section
5. IF any required data is missing for a student, THE System SHALL use a neutral default score of 50 for that component

### Requirement 6: Ranking Access Control

**User Story:** As an admin, I want to control who can view rankings, so that privacy and business needs are respected.

#### Acceptance Criteria

1. WHEN an admin accesses the rankings endpoint, THE System SHALL return the complete ranking list for all students
2. WHEN a student accesses the rankings endpoint, THE System SHALL return only the complete ranking list if the requesting student has requested it
3. WHEN a student accesses the rankings endpoint, THE System SHALL return only the requesting student's rank information if not explicitly requested
4. WHEN an employer accesses the rankings endpoint, THE System SHALL return only aggregated statistics (percentiles, averages, top 10 list)
5. ALL Ranking endpoints SHALL require authentication via Firebase Auth

### Requirement 7: Ranking Refresh Schedule

**User Story:** As an admin, I want rankings to be refreshed regularly, so that they reflect the most current student data.

#### Acceptance Criteria

1. WHEN a student uploads a new resume, THE System SHALL trigger a ranking recalculation for that student
2. WHEN a student updates their profile information (GPA, courses), THE System SHALL trigger a ranking recalculation for that student
3. WHEN the system executes a scheduled job, THE System SHALL refresh rankings for ALL students every 24 hours
4. THE Ranking computation SHALL be asynchronous and not block resume upload or profile update responses
5. WHEN a ranking computation is in progress, THE System SHALL return the most recently computed ranking with a "stale" indicator

### Requirement 8: API Endpoints

**User Story:** As a frontend developer, I want clear API endpoints for rankings, so that I can implement the UI correctly.

#### Acceptance Criteria

1. THE System SHALL provide a `GET /api/rankings` endpoint that returns the full ranking list for admins
2. THE System SHALL provide a `GET /api/rankings/student/me` endpoint that returns the authenticated student's rank information
3. THE System SHALL provide a `GET /api/rankings/employer/stats` endpoint that returns aggregated statistics for employers
4. ALL Endpoints SHALL support pagination with `page` and `limit` query parameters
5. WHEN a student requests the full ranking list, THE System SHALL return a 403 Forbidden response

### Requirement 9: Performance Optimization

**User Story:** As an admin, I want the ranking system to handle large student bodies efficiently, so that the platform remains responsive.

#### Acceptance Criteria

1. WHEN computing rankings for 10,000 students, THE System SHALL complete the computation within 30 seconds
2. THE System SHALL cache ranking results in Redis for at least 1 hour
3. WHEN a cached ranking exists, THE System SHALL return cached results instead of recomputing
4. THE System SHALL use database indexes on `rankings.overall_score` and `resumes.ats_score` for fast sorting
5. THE System SHALL batch compute rankings when processing multiple students to avoid N+1 queries

### Requirement 10: Ranking Display Format

**User Story:** As a student, I want to see my ranking in a clear format, so that I understand my position and how to improve.

#### Acceptance Criteria

1. EACH ranking record returned to the frontend SHALL include: student ID, full name, email, rank position, Overall Career Score, rank tier, and percentile rank
2. THE System SHALL include a "last_updated" timestamp showing when the ranking was last computed
3. WHEN a student has no ranking data, THE System SHALL return a null rank_position and "No Rank" as the tier
4. ALL Score values SHALL be returned as integers between 0 and 100
5. THE Percentile Rank SHALL be a decimal number rounded to 2 decimal places

### Requirement 11: Error Handling

**User Story:** As a developer, I want proper error handling for ranking computation failures, so that users are informed appropriately.

#### Acceptance Criteria

1. IF the ranking computation fails due to a database error, THE System SHALL return a 500 Internal Server Error with a descriptive message
2. IF the ranking computation times out, THE System SHALL return a 503 Service Unavailable with a "Retry-After" header
3. WHEN a student's resume analysis is incomplete (status not 'done'), THE System SHALL use the best available score with a warning flag
4. IF a student has no resumes at all, THE System SHALL assign an Overall Career Score of 0 and notify the student to upload a resume
5. ALL Error responses SHALL be logged to Sentry for monitoring

### Requirement 12: Data Consistency

**User Story:** As an admin, I want ranking data to remain consistent with the underlying resume and student data, so that reports are accurate.

#### Acceptance Criteria

1. WHEN a student's resume is deleted, THE System SHALL update the student's ranking to reflect the new best available score or set to 0 if no resumes remain
2. WHEN a student's profile information is updated, THE System SHALL recalculate their ranking using the new data within 60 seconds
3. WHEN a ranking record exists but the referenced student is deleted, THE System SHALL cascade delete the ranking record
4. ALL Ranking computations SHALL use database transactions to ensure atomic updates
5. THE System SHALL maintain a `computed_at` timestamp on each ranking record for audit purposes

### Requirement 13: Admin Ranking Management

**User Story:** As an admin, I want to manually trigger ranking refreshes, so that I can force immediate updates after data corrections.

#### Acceptance Criteria

1. THE System SHALL provide a `POST /api/admin/rankings/refresh` endpoint that triggers immediate recalculation for all students
2. THE Admin refresh endpoint SHALL return a 202 Accepted response with a task ID for tracking
3. WHEN the admin refresh completes, THE System SHALL send a notification to the admin via Firebase Cloud Messaging
4. THE System SHALL log all admin-triggered ranking refreshes with timestamps and user IDs
5. MULTIPLE admin refresh requests SHALL be queued and processed sequentially

### Requirement 14: External API Integration

**User Story:** As a developer, I want the ranking system to integrate with external tools, so that we can feed rankings to employer partners.

#### Acceptance Criteria

1. THE System SHALL provide a webhook endpoint `POST /api/rankings/webhook` that employers can subscribe to for real-time ranking updates
2. WHEN a student's rank changes by 10 or more positions, THE System SHALL trigger a webhook notification to subscribed employers
3. ALL Webhook payloads SHALL be signed with HMAC-SHA256 using a shared secret
4. WHEN a webhook delivery fails 3 times, THE System SHALL mark it as failed and retry after 24 hours
5. THE System SHALL maintain a log of all webhook deliveries for audit purposes