# TrustIQ — Decentralized AI Reputation Network

TrustIQ is a decentralized AI-powered reputation layer that gives individuals and organizations verifiable, portable, and AI-assessed reputation scores built on blockchain and real data sources.

## Problem Statement

In today's digital economy, freelancers, developers, researchers, and creators rely on centralized platforms (like Upwork, Fiverr, LinkedIn, and academic portals) for reputation and validation. These systems are:

- **Centralized**: Data controlled by companies, not individuals
- **Easily manipulated**: Fake reviews, spam accounts, rating inflation
- **Fragmented**: Reputation can't transfer between ecosystems
- **Unverifiable**: No transparent proof of actual contribution or skill

This creates a trust gap across the digital talent, research, and gig economy ecosystem.

## Solution

TrustIQ combines AI analytics, blockchain verification, and decentralized identifiers (DIDs) to create a Trust Score — a dynamic, tamper-proof reputation score that represents a person's or organization's credibility across all their digital activities.

### Key Components

- **Identity Layer (Web3 + DID)**: Each user has a decentralized identity (DID) linked to on-chain and off-chain records (GitHub commits, hackathons, certificates, Kaggle, LinkedIn, etc.).
- **Data Aggregation Layer (Backend + APIs)**: Node.js backend with GraphQL + Prisma + PostgreSQL fetches verified user activities via public APIs. Integrates GitHub, Stack Overflow, and LinkedIn APIs. Stores proofs and hashes on-chain using IPFS.
- **AI Scoring Engine (Python + Node Integration)**: AI model computes a TrustIQ Score based on consistency of contributions, endorsements (weighted via social graph), verified credentials and project quality, engagement authenticity. Uses embeddings and ML classifiers to filter anomalies.
- **Blockchain Layer (Solidity + Hardhat + ethers.js)**: Smart contracts for identity verification, reputation tokenization (e.g., Proof-of-Reputation NFT), on-chain storage of TrustIQ hashes, reward logic for contribution validation.
- **Frontend (React + TypeScript + Tailwind + Vite)**: User dashboard showing TrustIQ Score + analytics visualizations, verified badges from skills and contributions, AI feedback, on-chain verification panel for recruiters.
- **Cloud & DevOps (AWS + Docker + CI/CD)**: Distributed deployment using Docker Swarm / ECS, microservice architecture for data collection, AI scoring, and API gateway, CI/CD pipeline with GitHub Actions and PM2 process manager, Nginx reverse proxy and HTTPS setup.

## Tech Stack

| Layer | Technologies |
|-------|--------------|
| Frontend | React.js, TypeScript, Tailwind, Vite, Recharts, Framer Motion |
| Backend | Node.js, Express.js, GraphQL, Prisma, PostgreSQL, Redis, Bull |
| Blockchain | Sui (Move language), @mysten/sui.js, IPFS |
| AI Layer | Python (FastAPI/Flask), scikit-learn, Transformers, Sentiment & Consistency models |
| DevOps & Cloud | Docker, Docker Compose, Nginx, PostgreSQL, Redis |
| Security | JWT, OAuth2, Encryption, zkProofs |

## Architecture

TrustIQ's backend is designed to be modular, scalable, and hybrid, combining AI microservices, blockchain interaction layers, and API gateways under a secure, containerized environment.

### System Layers

1. **API Gateway (Express.js)**: Central entry point for all frontend and external API requests. Routes requests to appropriate microservice. Implements JWT-based authentication and API key authorization. Handles rate limiting, CORS, and input sanitization.

2. **Authentication & Identity Layer**: Supports zkLogin, Wallet sign-in, OAuth2 for third-party accounts. Issues short-lived JWTs. Enforces 2FA for high-trust operations.

3. **AI Reputation Engine (Python Microservice)**: Pipelines transform raw signals into embeddings and score via deterministic/ML models. Returns explainable sub-scores.

4. **Blockchain Layer (Sui Integration)**: Stores verified credentials and reputation data on-chain as Soulbound NFTs. Uses zkProofs for privacy-preserving verification.

5. **Database Layer (PostgreSQL + Prisma ORM)**: Canonical off-chain records, audit logs, API keys, org billing info.

6. **Queue & Cache Layer (Redis + BullMQ)**: Handles asynchronous operations and performance optimization.

### End-to-End Architecture

```
[User Browser / Mobile App] ←→ [API Gateway (Node.js/Express)]
        ├─ Auth Service (JWT + Web3/zkLogin)
        ├─ Orchestration / Jobs
        ├─ GraphQL REST Endpoints
        │
        ├─→ [AI Reputation Engine (Python FastAPI)] ←→ [ML Models, Embeddings Storage]
        │
        ├─→ [Queue (Redis + BullMQ)] → background workers (scoring, verification, minting)
        │
        ├─→ [Database (Postgres + Prisma)] (users, linked accounts, logs, API keys)
        │
        ├─→ [Blockchain Adapter] → Sui RPC / Indexer → Move Contracts (TrustProfile, TrustBadge, VerifierRegistry)
        │
        └─→ [Storage] IPFS (metadata & proofs) + AWS S3 (optional media mirrors)
```

## Features

### For Individuals
- Build a unified trust profile combining GitHub, LinkedIn, Upwork, Twitter, and on-chain data.
- Issue AI-verified reputation NFTs / badges based on skill, impact, and authenticity.
- Self-owned, censorship-resistant digital identity.

### For Recruiters, Clients & Organizations
- API and dashboard to verify credibility instantly using AI & blockchain data.
- Generates TrustIQ Scores — similar to credit scores but for digital trust.
- Enables transparent hiring and onboarding based on verifiable reputation.

### For Platforms, DAOs & Institutions
- Plug-and-play API / SDK for identity verification.
- Provides anti-Sybil & reputation scoring tools for governance.
- Allows institutions to issue verifiable credentials on-chain via TrustIQ.

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+
- Docker & Docker Compose
- Sui CLI (for blockchain development)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/trustiq/trustiq.git
   cd trustiq
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with:
   ```
   DB_PASSWORD=your_db_password
   JWT_SECRET=your_jwt_secret
   SUI_RPC_URL=https://fullnode.testnet.sui.io:443
   DEPLOYER_PRIVATE_KEY=your_sui_private_key
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret
   LINKEDIN_CLIENT_ID=your_linkedin_client_id
   LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
   ```

4. Start the services using Docker Compose:
   ```bash
   npm run deploy:contracts  # Deploy Sui contracts
   docker-compose -f deployment/docker-compose.yml up -d
   ```

5. Run database migrations:
   ```bash
   npm run db:migrate
   ```

6. Seed the database (optional):
   ```bash
   npm run db:seed
   ```

### Running Locally (Development)

1. Start the backend:
   ```bash
   npm run dev:backend
   ```

2. Start the frontend:
   ```bash
   npm run dev:frontend
   ```

3. Start the AI engine:
   ```bash
   cd ai-engine
   poetry install
   poetry run uvicorn app.main:app --reload
   ```

4. Deploy blockchain contracts:
   ```bash
   npm run deploy:contracts
   ```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- AI Engine: http://localhost:8000
- Database: localhost:5432
- Redis: localhost:6379

## API Documentation

TrustIQ provides a RESTful API for integration.

### Authentication
Use JWT tokens for API requests. Obtain tokens via `/api/v1/auth/login` or `/api/v1/auth/signup`.

### Key Endpoints

- `POST /api/v1/auth/signup` - Register new user
- `POST /api/v1/auth/login` - Authenticate user
- `GET /api/v1/users/:id` - Get user profile & TrustIQ Score
- `POST /api/v1/verify/github` - Connect GitHub & fetch data
- `POST /api/v1/trustscore/recalculate` - Trigger AI trust scoring
- `POST /api/v1/organizations/verify` - Organization verifies user
- `POST /api/v1/blockchain/mint` - Mint Soulbound NFT

For full API documentation, visit `/api/docs` when the backend is running.

## Security

TrustIQ implements a comprehensive security posture to protect against vulnerabilities and cyber attacks:

### Application Security
- Input validation & output encoding using Zod schemas
- Authentication via JWT + Web3 Wallet sign-in
- Authorization with role-based access control (RBAC)
- Rate limiting & abuse prevention
- Transport security with TLS 1.3

### Data Security
- Encryption in transit & at rest (AES-256)
- Secure key management with HSM/Vault
- Minimal data collection & privacy-preserving proofs
- GDPR-compliant data handling

### Blockchain Security
- Move language resource-oriented programming prevents common bugs
- Multisig for critical operations
- zkProofs for privacy-first validation
- Auditable on-chain events

### AI Security
- Model provenance & training data hashing
- Explainability & determinism in scoring
- Adversarial testing & anomaly detection
- Isolation in sandboxed containers

### DevOps Security
- Secure CI/CD with SAST, DAST, container scanning
- Immutable infrastructure & signed artifacts
- Regular penetration testing & bug bounty program
- Monitoring with Prometheus + Grafana + Sentry

### Operational Security
- Incident response playbooks
- Change control & audit trails
- Zero-downtime deployments with canary releases
- Regular security audits & compliance checks

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

- Website: https://trustiq.xyz
- Email: team@trustiq.xyz
- Twitter: @TrustIQNetwork
- Discord: https://discord.gg/trustiq

## Roadmap

- [ ] Cross-chain identity synchronization
- [ ] Federated reputation scoring
- [ ] DAO governance integration
- [ ] AI anomaly detection on reputation data
- [ ] zkKYC for anonymous verification

## Acknowledgments

- Mysten Labs for Sui blockchain
- Open-source community for AI/ML libraries
- Contributors and early adopters

---

Built with ❤️ for a more trustworthy digital world.
