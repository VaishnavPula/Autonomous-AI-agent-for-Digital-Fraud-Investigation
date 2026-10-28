# TRACE X Architecture

## System Overview

TRACE X follows a modular, layered architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                      │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │ Pages   │ │Components│ │ Hooks   │ │ Lib/API │           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS/WebSocket
┌──────────────────────────▼──────────────────────────────────┐
│                      Backend (FastAPI)                       │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │ API     │ │ Auth    │ │ Services│ │ Workers │           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │ Models  │ │ Schemas │ │ Repos   │ │ AI/Agents           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
└──────────────────────────┬──────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│  PostgreSQL   │  │    Redis      │  │   File Store  │
│  (Primary DB) │  │ (Cache/Queue) │  │  (Evidence)   │
└───────────────┘  └───────────────┘  └───────────────┘
```

## Core Principles

1. **Evidence-First**: All findings must reference evidence IDs
2. **Deterministic Core**: System works without external AI
3. **Provenance Tracking**: Every derivation maintains evidence lineage
4. **Human-in-the-Loop**: High-impact actions require approval
5. **Reproducibility**: Same inputs → same deterministic outputs
6. **Audit Everything**: Append-only audit log for all actions

## Backend Modules

### API Layer (`app/api/`)
- RESTful endpoints with proper status codes
- Request/response validation via Pydantic
- Pagination, filtering, sorting standards
- OpenAPI documentation auto-generation

### Authentication (`app/auth/`)
- JWT-based authentication
- Role-based access control (RBAC)
- Session management
- Password hashing (bcrypt)

### Domain Modules
Each domain follows clean architecture:
- **Models**: SQLAlchemy ORM models
- **Schemas**: Pydantic request/response schemas
- **Repositories**: Data access layer
- **Services**: Business logic
- **API**: HTTP endpoints

### AI System (`app/ai/`, `app/agents/`)
- Provider abstraction (Mock, OpenAI, Anthropic)
- Structured output validation (Pydantic)
- Evidence grounding enforcement
- Multi-agent orchestration
- Investigation run tracking

## Database Design

### Core Entities
- **Users/Roles**: Authentication & authorization
- **Cases**: Investigation containers
- **Evidence**: Normalized evidence ledger
- **Entities**: Users, accounts, devices, IPs, etc.
- **Relationships**: Entity-to-entity connections
- **Transactions**: Financial movements
- **Timeline Events**: Chronological reconstruction
- **Fraud Signals**: Explainable anomaly detections
- **Risk Scores**: Calculated risk assessments
- **Hypotheses**: Competing explanations
- **Investigation Runs**: Reproducible execution records
- **Agent Runs**: Individual agent execution traces
- **Findings**: Evidence-grounded conclusions
- **Investigator Decisions**: Human approvals/actions
- **Audit Logs**: Immutable action history

## Frontend Architecture

### State Management
- **TanStack Query**: Server state (caching, synchronization)
- **Zustand**: Client state (UI, investigation context)
- **React Context**: Auth, theme, global settings

### Key Components
- **Trace Board**: Primary investigation workspace
- **Trace Mode**: Signature relationship tracing
- **Investigation Replay**: Time-machine visualization
- **Evidence Vault**: Evidence browsing & management
- **Entity Profiles**: Detailed entity views
- **Risk Screens**: Risk assessment dashboards

### Design System
- Dark, forensic aesthetic
- CSS variables for theming
- Tailwind CSS utilities
- Framer Motion for animations
- Accessibility-first (WCAG AA)

## Data Flow

### Evidence Ingestion
```
Upload → Validate → Hash (SHA-256) → Normalize → Store → Chain of Custody
                                    ↓
                              Entity Resolution
                                    ↓
                              Relationship Building
                                    ↓
                              Timeline Construction
                                    ↓
                              Signal Detection
                                    ↓
                              Risk Calculation
                                    ↓
                              AI Investigation
                                    ↓
                              Human Review
                                    ↓
                              Report Generation
```

### Investigation Run
```
1. Create Investigation Run (unique ID)
2. Execute Agents in Sequence:
   - Case Analyst
   - Evidence Analyst
   - Entity Resolution Agent
   - Timeline Analyst
   - Transaction Analyst
   - Network Analyst
   - Behavioral Analyst
   - Fraud Pattern Analyst
   - Hypothesis Analyst
   - Risk Analyst
   - Investigator Agent
   - Report Agent
3. Validate Outputs (evidence grounding)
4. Store Results with Provenance
5. Update Case State
6. Notify Investigators
```

## Security Architecture

### Defense in Depth
1. **Network**: Docker network isolation
2. **Transport**: TLS in production
3. **Application**: Input validation, RBAC, rate limiting
4. **Data**: Encryption at rest, field-level encryption for PII
5. **Evidence**: Immutable hashes, access logging

### Evidence Integrity
- SHA-256 hash on upload
- Hash verification on every access
- Append-only audit trail
- Tamper-evident storage

## Scalability Considerations

- Async FastAPI for high concurrency
- Database connection pooling
- Redis caching for frequent queries
- Background workers for heavy processing
- Graph virtualization for large networks
- Pagination for all list endpoints

## Deployment

### Development
```bash
docker-compose up -d
```

### Production
- Build optimized Docker images
- Use managed PostgreSQL (RDS, Cloud SQL)
- Use managed Redis (ElastiCache, Cloud Memorystore)
- Configure TLS certificates
- Set secure JWT secrets
- Enable structured logging
- Configure monitoring/alerting