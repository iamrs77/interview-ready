# Progress — System Design

✅ = written · ⬜ = not written yet

Same order as the sidebar. This file is generated: run `npm run progress` after writing a page.
A page that is not written yet has `planned: true` in its frontmatter (it shows dimmed in the sidebar).

**Written: 126 of 126**

## Guide
- ✅ Start Here
- ✅ The Interview Framework
- ✅ Cheat Sheet

## 1. Foundations
- ✅ Client-Server Architecture
- ✅ How the Internet Works
- ✅ IP Addresses and Ports
- ✅ DNS
- ✅ TCP vs UDP
- ✅ HTTP and HTTPS
- ✅ HTTP Methods, Status Codes and Headers
- ✅ REST APIs
- ✅ gRPC and GraphQL
- ✅ Polling, WebSockets and SSE
- ✅ Cookies, Sessions and JWT
- ✅ Reverse and Forward Proxies
- ✅ What Happens When You Type a URL

## 2. High-Level Design Basics
- ✅ Scalability
- ✅ Availability and Reliability
- ✅ Latency, Throughput and QPS
- ✅ Queueing Basics
- ✅ Stateless vs Stateful Servers
- ✅ Load Balancing
- ✅ Health Checks and Service Discovery
- ✅ API Gateway
- ✅ Monolith vs Microservices
- ✅ Capacity Estimation
- ✅ Scaling Reads
- ✅ Scaling Writes

## 3. Databases
- ✅ SQL vs NoSQL
- ✅ Schemas, Relationships and Keys
- ✅ Normalization vs Denormalization
- ✅ Indexes: B-Trees and LSM Trees
- ✅ Transactions and ACID
- ✅ Isolation Levels
- ✅ Locks and Deadlocks
- ✅ Replication
- ✅ Partitioning and Sharding
- ✅ Consistent Hashing
- ✅ Connection Pooling
- ✅ PostgreSQL vs MySQL
- ✅ How a Query Runs
- ✅ SQL Fundamentals

## 4. Caching and CDN
- ✅ What is Caching
- ✅ Caching Strategies
- ✅ Cache Invalidation and TTL
- ✅ Cache Eviction: LRU, LFU, FIFO
- ✅ Redis
- ✅ Distributed Caching
- ✅ Cache Problems
- ✅ CDN and Edge Caching

## 5. Messaging and Events
- ✅ Sync vs Async Communication
- ✅ Message Queues and Pub/Sub
- ✅ Event-Driven Architecture
- ✅ Kafka
- ✅ Kafka vs RabbitMQ vs SQS
- ✅ Delivery Guarantees
- ✅ Idempotency
- ✅ Retries, Backoff and Timeouts
- ✅ Dead-Letter Queues
- ✅ Eventual Consistency in Async Systems

## 6. Distributed Systems
- ✅ Why Distributed Systems Are Hard
- ✅ CAP Theorem
- ✅ Consistency Models
- ✅ ACID vs BASE
- ✅ Distributed Transactions and 2PC
- ✅ Saga Pattern
- ✅ Outbox Pattern
- ✅ Change Data Capture (CDC)
- ✅ Distributed Locking
- ✅ Leader Election and Consensus
- ✅ Clocks: Physical, Logical and Vector
- ✅ Distributed ID Generation
- ✅ CQRS
- ✅ Event Sourcing

## 7. Reliability and Security
- ✅ Redundancy and Failover
- ✅ Circuit Breaker
- ✅ Bulkhead Pattern
- ✅ Rate Limiting
- ✅ Backpressure
- ✅ Graceful Degradation
- ✅ Disaster Recovery: RPO and RTO
- ✅ Authentication vs Authorization
- ✅ OAuth 2.0 and OpenID Connect
- ✅ Role-Based Access Control (RBAC)
- ✅ Encryption at Rest and in Transit
- ✅ API Security Basics
- ✅ CSRF and CORS

## 8. Advanced Components
- ✅ Object, Block and File Storage
- ✅ Search and Inverted Indexes
- ✅ Geospatial Indexing
- ✅ Bloom Filter, HyperLogLog, Count-Min Sketch
- ✅ Batch vs Stream Processing
- ✅ Hot Keys, Hot Partitions and Fan-out
- ✅ API Pagination and Versioning
- ✅ File Upload and Download
- ✅ Background Jobs and Job Scheduling
- ✅ Multi-tenancy
- ✅ Microservices in Practice
- ✅ Strangler Pattern

## 9. Production Systems
- ✅ Observability: Logs, Metrics, Traces
- ✅ Latency Percentiles: p50, p95, p99
- ✅ SLI, SLO and SLA
- ✅ Finding Bottlenecks
- ✅ Load Testing
- ✅ Deployment Strategies
- ✅ CI/CD, Docker and Kubernetes

## 10. Interview Questions

**Easy**

- ✅ Design a URL Shortener
- ✅ Design a Rate Limiter
- ✅ Design a Notification Service

**Medium**

- ✅ Design WhatsApp
- ✅ Design a News Feed
- ✅ Design a Web Crawler
- ✅ Design Search Autocomplete
- ✅ Design a Job Scheduler
- ✅ Design an E-commerce Platform
- ✅ Design a Ticket Booking System
- ✅ Design Google Drive

**Hard**

- ✅ Design YouTube
- ✅ Design Uber
- ✅ Design a Payment System
- ✅ Design a Distributed Cache
- ✅ Design a Distributed Message Queue
- ✅ Design a Logging and Metrics System
- ✅ Design an Ad Click Aggregator
- ✅ Design Top K (Trending)
- ✅ Design Google Docs

## To do
- [x] **Cheat Sheet:** written last, from all the finished lessons.
- [x] **Flashcards:** 1519 cards in 11 decks, one per module. Check them with `npm run check:flashcards`.

## Later: separate tracks (not System Design)
- **OS and Concurrency (slim):** processes vs threads, concurrency vs parallelism, race conditions and mutexes,
  deadlocks, thread pools, event loop and async, blocking vs non-blocking I/O.
- **Low-Level Design:** OOP, SOLID, composition vs inheritance, interfaces and DI, UML basics, design patterns,
  and practice problems: parking lot, elevator, Splitwise, movie booking, LRU cache.
