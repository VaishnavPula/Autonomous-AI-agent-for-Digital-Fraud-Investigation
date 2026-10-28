# TRACE X

**AI-Powered Fraud Investigation & Digital Evidence Reconstruction Platform**

> "Follow the evidence. Reconstruct the truth."

## Overview

TRACE X is a forensic intelligence web application for investigating suspected fraud and reconstructing fragmented digital evidence into an auditable investigation story. Built for hackathon-grade demonstration with production-quality architecture.

## Features

- **Evidence Reconstruction**: Normalize, hash, and track chain-of-custody for all digital evidence
- **Entity Intelligence**: Resolve identities across transactions, devices, IPs, and accounts
- **Temporal Investigation**: Build precise timelines with sub-minute correlation
- **Money-Flow Tracing**: Follow multi-hop transfers and visualize fund movement
- **Explainable AI**: Multi-agent investigation with evidence citations and competing hypotheses
- **Investigation Replay**: Time-machine replay of evidence arrival and decision evolution

## Tech Stack

### Backend
- Python 3.12
- FastAPI
- SQLAlchemy 2.0 (async)
- PostgreSQL 16
- Redis 7
- Pydantic v2
- Alembic (migrations)

### Frontend
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- TanStack Query
- React Flow
- Recharts
- Framer Motion

### Infrastructure
- Docker & Docker Compose
- PostgreSQL
- Redis

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local frontend development)
- Python 3.12+ (for local backend development)

### Using Docker (Recommended)

```bash
# Clone and navigate
cd tracex

# Copy environment file
cp .env.example .env

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Access applications
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Local Development

#### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp ../.env.example .env
# Edit .env with your settings
uvicorn app.main:app --reload
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Project Structure

```
tracex/
├── backend/
│   ├── app/
│   │   ├── api/           # REST API endpoints
│   │   ├── auth/          # Authentication & RBAC
│   │   ├── cases/         # Case management
│   │   ├── evidence/      # Evidence pipeline
│   │   ├── entities/      # Entity system
│   │   ├── transactions/  # Transaction engine
│   │   ├── timeline/      # Timeline engine
│   │   ├── risk/          # Risk scoring
│   │   ├── fraud/         # Fraud signals
│   │   ├── ai/            # AI provider abstraction
│   │   ├── agents/        # Multi-agent framework
│   │   ├── graph/         # Graph engine
│   │   ├── reports/       # Report generation
│   │   ├── audit/         # Audit logging
│   │   ├── database/      # DB session & base
│   │   ├── models/        # SQLAlchemy models
│   │   ├── schemas/       # Pydantic schemas
│   │   ├── services/      # Business logic
│   │   ├── repositories/  # Data access
│   │   └── workers/       # Background jobs
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/           # Next.js App Router pages
│   │   ├── components/    # React components
│   │   ├── lib/           # Utilities & API client
│   │   ├── hooks/         # Custom React hooks
│   │   ├── styles/        # Global styles
│   │   └── types/         # TypeScript types
│   ├── package.json
│   ├── tailwind.config.js
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

## API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Environment Variables

See `.env.example` for all configuration options.

Key variables:
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `JWT_SECRET`: Secret for JWT tokens (min 32 chars)
- `AI_PROVIDER`: `mock` | `openai` | `anthropic`
- `AI_API_KEY`: API key for external AI provider

## Development Phases

This project follows a 31-phase development plan:

1. **Phase 0**: Repository Discovery ✓
2. **Phase 1**: Architecture Foundation ✓ (Current)
3. **Phase 2**: Database Models
4. **Phase 3**: Design System
5. **Phase 4**: Landing Page
6. **Phase 5**: Authentication & RBAC
7. **Phase 6**: Case Management
8. **Phase 7**: Evidence System
9. **Phase 8**: Entity System
10. **Phase 9**: Transaction Engine
11. **Phase 10**: Timeline Engine
12. **Phase 11**: Graph Engine
13. **Phase 12**: Fraud & Risk Engine
14. **Phase 13**: AI Foundation
15. **Phase 14**: Multi-Agent Investigation
16. **Phase 15**: AI Investigation UI
17. **Phase 16**: Trace Board
18. **Phase 17**: Trace Mode
19. **Phase 18**: Investigator Copilot
20. **Phase 19**: Human Decision System
21. **Phase 20**: Investigation Replay
22. **Phase 21**: Reporting
23. **Phase 22**: Real-Time
24. **Phase 23**: Security Audit
25. **Phase 24**: Testing
26. **Phase 25**: Performance
27. **Phase 26**: Responsive & Accessibility
28. **Phase 27**: Demo Mode
29. **Phase 28**: Judge Mode
30. **Phase 29**: Final UI Polish
31. **Phase 30**: Final Red-Team Audit
32. **Phase 31**: Final Production Audit

## Demo

The primary demo case is **TX-2048**: "Coordinated Account Takeover & Rapid Fund Movement"

This case demonstrates:
- New device + new IP + password reset + high-value transaction + rapid transfers
- Behavioral deviation detection
- Money-flow chain reconstruction
- AI hypothesis generation with competing explanations
- Evidence-grounded findings with full provenance
- Human-in-the-loop decision making
- Investigation replay

## Security

- Evidence integrity via SHA-256 hashing
- Chain of custody tracking
- RBAC with 5 roles (ADMIN, LEAD_INVESTIGATOR, INVESTIGATOR, ANALYST, VIEWER)
- Secure file upload validation
- SQL injection protection via ORM
- XSS protection via React
- Rate limiting
- Audit logging for all actions

## Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

## License

MIT License - Built for hackathon demonstration.