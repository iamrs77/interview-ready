# Review — System Design notes (2026-11-19)

## Status (updated 2026-11-19, after the bug-fix round)

- ✅ **All bugs fixed:**
  - all MUST FIX items;
  - every SHOULD FIX item that was an error (wrong facts, buggy code/SQL/math, contradictions, wrong diagrams);
  - the one-line errors from the NICE list;
  - the platform bugs: diagram "Open large", diagrams on phones, and "Mark as done" ticks for moved pages;
  - one extra bug found while fixing: the News Feed post and follow events now go through an outbox.
- ✅ **Checked after the fixes:** all 122 pages load, 300 of 300 diagrams draw with no errors, no broken links, production build passes, types and lint pass.
- ⏳ **Waiting on you:** upgrade Node to 24.11 or newer (now 24.0). Make a first git commit.
- ⬜ **Left for the improvement round** (still listed below):
  - SHOULD FIX items that are gaps or new topics (e.g. PACELC, CSRF/CORS, "type a URL" walk-through, capacity "servers needed");
  - thin pages (`redis.mdx`, `scaling-reads.mdx`);
  - duplication cleanup;
  - the NICE polish themes;
  - the "Suggestions" section at the end.
- ℹ️ **Reading progress on phones** was not a real bug: Fumadocs shows it as the small circle next to "On this page" at the top.

The list below is the original review, kept for reference.

This file lists what to fix, most important first.
All lesson paths are relative to `content/system-design/`.

| Area | Must fix | Should fix | Nice |
| --- | --- | --- | --- |
| Platform (site code) | 1 | 4 | 1 |
| Guide + 1. Foundations | 3 | 13 | ~30 |
| 2. HLD Basics + 4. Caching | 4 | 16 | ~20 |
| 3. Databases + 9. Production | 1 | 14 | ~35 |
| 5. Messaging + 6. Distributed Systems | 5 | 18 | ~20 |
| 7. Reliability & Security + 8. Advanced | 2 | 10 | ~30 |
| 10. Interview Questions | 15 | 50 | ~35 |

## How it was checked

- **Automated, all pages:** all 122 pages load, 300 of 300 diagrams draw, no broken links, production build passes, types and lint pass.
- **Read line by line:** 7 reviewers read every line of all 122 lessons. They checked code, SQL, math and real-world facts.
- **Double-checked:** the most serious findings were checked again directly in the files (marked ✔).

---

## Platform bugs

1. **MUST — "Open large" can't make a diagram bigger.** ✔ Mermaid puts `style="max-width: …px"` on each SVG. That inline style beats the `max-w-none` class in `src/components/mermaid.tsx`, so the expanded view never grows past the normal size. Fix: use `!max-w-none` or remove the inline style when expanding.
2. **SHOULD — Diagrams are hard to read on phones.** ✔ Wide diagrams, like the DNS lookup, shrink to tiny text. Fix: on small screens, show diagrams at natural size with sideways scrolling, plus the fixed "Open large" button.
3. **SHOULD — Reading progress doesn't show on phones.** It lives in the "On this page" column, which is hidden below desktop width.
4. **SHOULD — "Mark as done" is saved by page URL.** Moving or renaming a page loses its tick. This already happened for pages moved during the sidebar rebuild. Fix: save by a stable page ID, or move old URLs over.
5. **SHOULD — Node version too old.** Node is 24.0.0, but Fumadocs asks for 24.11 or newer, so npm shows warnings on every install. Fix: upgrade Node.
6. **NICE — No git safety net.** Nothing is committed to git yet. `README.md` is still the default Fumadocs README.

---

## MUST FIX — wrong or broken content

**Guide + Foundations**
- `foundations/tcp-vs-udp.mdx:75,83,110` — "Live streams" are listed as a UDP use case. Most live streaming (YouTube Live, Twitch) is HLS/DASH chunks over HTTP/TCP through a CDN. → Use "voice/video calls (WebRTC)", and add a line saying streaming video uses HTTP + CDN.
- `foundations/http-methods-status-codes-headers.mdx:98` — "Retry `5xx` and `429`" has no condition, which contradicts the double-charge example on the same page. → Retry only safe or idempotent requests (or ones with an idempotency key), with backoff and jitter.
- `foundations/polling-websockets-sse.mdx:111` — `socket.send()` runs before the socket is open and throws `InvalidStateError`. → Send inside `socket.onopen`.

**HLD Basics + Caching**
- `caching/cache-invalidation-ttl.mdx:100,106,149,157` — "A stale seat cache means double booking" is wrong. The cache only affects what users see; the atomic DB update stops double booking. It also contradicts `questions/ticket-booking.mdx`. → Cache 1–2 s for display; the hold always checks the DB.
- `hld-basics/health-checks-service-discovery.mdx:62-65,154-158` — The readiness check fails when the shared database fails. In Kubernetes this pulls every pod out, so the whole site goes down. The lesson warns against exactly this at lines 52-54. → Readiness checks only what the pod owns.
- `caching/redis.mdx:21,40,69` — "Commands are atomic, so locks are safe" is misleading. A TTL lock can expire or be lost in failover. It contradicts `distributed-systems/distributed-locking.mdx`. → Counters are safe; locks need a token check and a DB-side check for correctness.

**Databases + Production**
- `databases/indexes.mdx:131` — "Bigtable started the LSM family" is wrong. The LSM tree comes from a 1996 paper (O'Neil et al.); Bigtable (2006) made it popular.

**Messaging + Distributed Systems**
- `distributed-systems/consistency-models.mdx:85` ✔ — "Sticky reads" is listed as a fix for read-your-writes. A sticky replica can still be behind; it only gives monotonic reads.
- `distributed-systems/outbox-pattern.mdx:97` ✔ — The relay uses `key: row.id` (a random event ID), but the text says key by order ID. One order's events land on different partitions and can arrive out of order. → Add an `aggregate_id` column and use it as the key.
- `distributed-systems/distributed-locking.mdx:125` ✔ — `last_token < 34` rejects the current holder's second write, and NULL never matches. → `COALESCE(last_token, 0) <= 34`.
- `distributed-systems/saga-pattern.mdx:118-131` ✔ — An undo is queued only after its step returns. If `chargeCard` succeeds but times out, the refund is never queued, and one failing undo stops the rest. → Queue the undo before the call (undos must be idempotent), and retry each undo.
- `distributed-systems/cap-theorem.mdx:7-16` — It is the only lesson whose "The idea" has no everyday comparison. → Two bank branches whose phone line goes dead.

**Reliability + Advanced**
- `advanced-components/geospatial-indexing.mdx:13,60,74,85` — The 9 surrounding 6-character geohash cells (1.2 × 0.6 km) do not cover a 2 km radius, so drivers 1–2 km away are missed. → Choose the geohash length whose cell is at least the search radius (5 characters for 2 km), then filter by real distance.
- `advanced-components/background-jobs.mdx:81-88` — A bare `SELECT … FOR UPDATE SKIP LOCKED` in autocommit releases its locks right away, so two workers can run the same job. → `UPDATE … WHERE id IN (SELECT … FOR UPDATE SKIP LOCKED) RETURNING id`.

**Interview Questions**
- `questions/url-shortener.mdx:120-122` — "Codes never collide" stops being true once custom aliases exist; an alias can take a future counter value. → Check for conflicts, or keep aliases in a separate namespace.
- `questions/rate-limiter.mdx:209` — "All counters for user-42 sit on the same server" is false; Redis Cluster hashes the whole key, so a two-key Lua script fails with CROSSSLOT. → Use hash tags: `rate:{user-42}:…`.
- `questions/notification-service.mdx:56,117,181-186` — Status is kept per notification, but there is one message per channel. The email worker sees `sent` from push and skips the email. → Keep status per (notification, channel).
- `questions/whatsapp.mdx:116` vs `151,162,172` — The inbox row is written only when Bob is offline, but the fallback and deep dive 2 need it for every message. → Always write it, and delete it on the delivered receipt.
- `questions/job-scheduler.mdx:157` ✔ — `1763629200` is 2025-11-20, but the example is for 2026. → `1795165200`.
- `questions/job-scheduler.mdx:164` vs `222` — A job pushed straight to the timer queue is still `scheduled` in the DB, so the next sweep queues it again and it runs twice. → Insert it as `queued`.
- `questions/job-scheduler.mdx:190` vs `237,79` — A retry gets a new `executionId`, but the idempotency key is `executionId`, so a retried email is sent twice. → Keep one execution ID across attempts.
- `questions/e-commerce.mdx:170,194-196,213` — Stock is released after 15 minutes while a late payment can still succeed: a paid order with no stock. → Cancel or check the payment before releasing; refund or re-reserve on late success.
- `questions/payment-system.mdx:59,106` ✔ — The browser sends `amount`, so a buyer can change the price. → Send only `orderId`; the server reads the amount from the order.
- `questions/payment-system.mdx:86-89,100` ✔ — The webhook has no signature check (anyone can mark an order paid), and repeated webhooks aren't de-duplicated. → Verify the signature, and de-dupe by event ID.
- `questions/payment-system.mdx:207-213` — Ledger lines are inserted even when the `UPDATE … WHERE status='PENDING'` changed 0 rows, giving duplicate ledger entries. → Insert only if 1 row changed, plus a unique rule.
- `questions/uber.mdx:245` — Accepting a ride doesn't check the driver is still available or the lock still holds this ride, so one driver can get two rides. → Make the update conditional.
- `questions/ad-click-aggregator.mdx:32` ✔ — 1 billion clicks/day is about 11,600/s on *average*, but the page calls 10,000/s the *peak*. → About 12,000/s average, about 30,000/s peak.
- `questions/ad-click-aggregator.mdx:203` — A random suffix on hot keys sends duplicate impression IDs to different workers, so de-duplication fails for the costliest ads. → Use `hash(impressionId) % 10` as the suffix.
- `questions/google-docs.mdx:103,180` — "Browsers apply the server's op" is wrong when they have their own pending ops. Example: Bob ends with `AHT` instead of `HAT`. → The client also transforms incoming ops against its own pending ops.

---

## SHOULD FIX — unclear, inconsistent, outdated or gaps

**Guide + Foundations**
- `interview-framework.mdx:185` — The reason given for the cache is "every open reads the DB", but an indexed read is only 1–10 ms. The real reason is load (12k+ reads/s).
- `interview-framework.mdx:33,140` — Step numbers differ from the question pages, which renumber when Data Flow is skipped. Say so once.
- `foundations/client-server.mdx:102-105` — "In the interview" has no `>` quote.
- `foundations/how-the-internet-works.mdx:46` — "Back the same way" contradicts packets taking different roads.
- `foundations/how-the-internet-works.mdx:80` — Write "US East Coast ↔ Europe".
- `foundations/how-the-internet-works.mdx:42-46` — The walk-through skips the TCP handshake, the TLS handshake and the HTTP request (the classic "type a URL" question).
- `foundations/ip-addresses-and-ports.mdx:16` — `localhost` is a name that points to 127.0.0.1, not an IP itself.
- `foundations/tcp-vs-udp.mdx:19` — "Packet 3 never shows up before 2" contradicts the lesson's own diagram. Say TCP holds it until 2 comes.
- `foundations/http-and-https.mdx:52` — TLS sits *under* HTTP, not "on top".
- `foundations/rest-apis.mdx:148` — Stripe's real versions are dates (`Stripe-Version` header), not `/v1`. `payment_intents` also breaks the lesson's own hyphen rule.
- `foundations/polling-websockets-sse.mdx:144-150` — The diagram never shows server 2 pushing the message to Ben.
- `foundations/cookies-sessions-jwt.mdx:80` — With HS256, any service holding the secret can forge tokens. → RS256/ES256 + public key, and check `exp`.
- `foundations/cookies-sessions-jwt.mdx:81` vs `115` — A Bearer token in a browser is readable by scripts. → Use an HttpOnly cookie in browsers.
- `foundations/cookies-sessions-jwt.mdx:122` — Facebook later revised 50M to about 30M accounts with stolen tokens. The 90M reset is correct.

**HLD Basics + Caching**
- `hld-basics/health-checks-service-discovery.mdx:63` — `db.ping().catch(() => false)` can give `undefined`, which always returns 503.
- `caching/cache-problems.mdx:53-58` — Lock code: no try/finally, no token check on delete, unlimited retries.
- `caching/cache-problems.mdx:90` — The `'NOT_FOUND'` marker breaks `JSON.parse` in the read paths on other pages.
- `caching/cache-problems.mdx:106` — Hot-key copies "hash to different shards" is not guaranteed, and the writes must update every copy.
- `hld-basics/capacity-estimation.mdx:50,206` — "1M/day ≈ 12/s" vs the ÷100,000 rule (10/s).
- `hld-basics/capacity-estimation.mdx:209` — "Across an ocean 150 ms" vs the table's 80 ms.
- `caching/distributed-caching.mdx:40` — The Redis → DB arrow suggests read-through, but the default taught is cache-aside.
- `caching/distributed-caching.mdx:76,125` — Redis Cluster uses hash slots, not a ring. Mention both.
- `caching/cdn.mdx:136` — "Never personal data" is too strong. Private files go through a CDN with signed URLs.
- `caching/redis.mdx:58` — Out of date: Redis 8 (2025) added AGPLv3.
- `caching/redis.mdx:7-11` — No everyday comparison and no diagram. Missing persistence, data types and the single-thread risk; Pub/Sub is fire-and-forget.
- `hld-basics/scaling-reads.mdx:7-11,63` — No everyday comparison, and thin. Hot keys are named with no fix or link.
- `hld-basics/scaling-writes.mdx:11,160` — "Every write goes to the primary" is only true for single-primary databases. Cassandra is recommended on the same page.
- `hld-basics/stateless-vs-stateful.mdx:94` — Calls Redis state "safe", while the Redis page treats it as a reloadable cache.
- `hld-basics/api-gateway.mdx:75-76` — The gateway must strip any client-sent `X-User-Id`.
- `hld-basics/scalability.mdx:44` — "Twice as big costs more than twice as much" is not how cloud prices work.
- `hld-basics/capacity-estimation.mdx` — Gap: no "servers needed" step and no cache-memory sizing.

**Databases + Production**
- `databases/isolation-levels.mdx:60-65` — No lost-update and write-skew rows; the PostgreSQL vs MySQL repeatable-read difference is promised at line 107 but never shown.
- `databases/isolation-levels.mdx:64` — MySQL InnoDB also stops phantoms in practice.
- `databases/transactions-acid.mdx:51` — Isolation means "as if run one at a time", not just "no half-done work".
- `databases/transactions-acid.mdx:64` — A failed statement doesn't auto-roll back: PostgreSQL needs ROLLBACK, and MySQL undoes only the statement.
- `databases/sql-fundamentals.mdx:32` — `BETWEEN '…-01' AND '…-31'` on a timestamp misses Jan 31. → `>= Jan 1 AND < Feb 1`.
- `databases/sql-vs-nosql.mdx:12` — The coat-check comparison fits key-value stores only (document DBs can query fields).
- `databases/sql-vs-nosql.mdx:132` — Discord moved to Cassandra in late 2015 or early 2016; it wrote about it in 2017.
- `databases/partitioning-sharding.mdx:43-49` — The diagram shows range sharding while the answer says hashing; the ranges also overlap.
- `databases/partitioning-sharding.mdx:37` — Monthly partitions: dropping one deletes a month, not a year.
- `databases/replication.mdx:86` — In leaderless systems a coordinator or smart client writes the copies, not the app.
- `databases/how-a-query-runs.mdx:42-46,55` — The EXPLAIN output isn't real PostgreSQL format, and the guessed vs actual rows aren't shown.
- `production/finding-bottlenecks.mdx:102-158` — Duplicates `how-a-query-runs`, with different table and column names.
- `production/observability.mdx:117` — "Keep all slow or failed traces" needs tail-based sampling. Name head vs tail sampling.
- `production/load-testing.mdx:98-105` — 200 users with `sleep(1)` can't give 1,000 req/s.
- `production/deployment-strategies.mdx:128-131` — Rollback is only safe if step-3 code still writes both columns.

**Messaging + Distributed Systems**
- `messaging/idempotency.mdx:115-117` — No failure path, so a crash leaves the key `in_progress` forever.
- `messaging/idempotency.mdx:174` — "Saved in the same transaction as the payment" is impossible with an outside charge.
- `distributed-systems/cqrs.mdx:74` — A replayed `OrderPlaced` resets the status after `OrderShipped`. → `$setOnInsert`, or versions.
- `distributed-systems/consistency-models.mdx:39,103,141` — Quorum overlap is not full linearizability. Say so.
- `distributed-systems/consistency-models.mdx:65-66` — The consistent-prefix and causal examples are the same scenario.
- `distributed-systems/acid-vs-base.mdx:67,116` — ACID's C is not CAP's C.
- `messaging/kafka.mdx:124` — `acks=all` also needs `min.insync.replicas=2` with replication factor 3.
- `messaging/retries-backoff-timeouts.mdx:123` — "Retry at the layer closest to the user" is the opposite of the Google SRE book it cites.
- `distributed-systems/outbox-pattern.mdx:104` — Several relays with `SKIP LOCKED` break ordering, and the lock needs an open transaction.
- `messaging/kafka-vs-rabbitmq-vs-sqs.mdx:92` — RabbitMQ keeps order only with a single consumer.
- `distributed-systems/clocks.mdx:91-94` — The Lamport numbers in the diagram break the lesson's own rule.
- `distributed-systems/saga-pattern.mdx:110,155` — Netflix Conductor was archived in Dec 2023 and is now Conductor OSS (Orkes).
- `distributed-systems/event-sourcing.mdx:126` — EventStoreDB is now KurrentDB (Nov 2024).
- `messaging/event-driven-architecture.mdx:54-58` vs `76-81` — Two diagrams react to different events.
- `distributed-systems/saga-pattern.mdx:51-87` vs `147` — The diagrams charge first, but the text says reserve stock first. Also fix this in the event-driven lesson.
- `distributed-systems/distributed-locking.mdx:147` — The quote implies a Redis `SET NX` lock gives a fencing token. It doesn't.
- `messaging/sync-vs-async.mdx:89-91` — One "queue" feeds two services; that is a topic.
- `distributed-systems/cap-theorem.mdx` — Gap: PACELC, and "CA doesn't exist in a distributed system".
- Duplication: read-your-writes is explained 3 times (consistency-models, eventual-consistency-async, cqrs), and the S3-2020/DynamoDB facts are repeated.

**Reliability + Advanced**
- `reliability-security/circuit-breaker.mdx:141` — The retry should wrap the breaker, not go inside it.
- `advanced-components/multi-tenancy.mdx:71` — `SET app.tenant_id` stays on pooled connections. → `SET LOCAL`.
- `reliability-security/oauth-oidc.mdx:67` — Only `openid email profile` is granted, yet the app reads photos.
- `reliability-security/redundancy-failover.mdx:99` — Load balancers are called active-active here but active-passive earlier.
- `reliability-security/disaster-recovery.mdx:115` — "Can't be lost, so RPO is a few seconds" contradicts itself.
- `reliability-security/authn-vs-authz.mdx:70` vs `101,119` — "The gateway passes the user ID" vs "services read it from the token".
- `reliability-security/api-security.mdx:118` — API keys need a fast hash (SHA-256), not bcrypt.
- `advanced-components/probabilistic-data-structures.mdx:141` — Out of date: Bloom and Count-Min Sketch are built into Redis 8.
- `advanced-components/hot-keys-fan-out.mdx:32` — `cache-problems` says "how to find hot keys" is explained here, but it isn't.
- `reliability-security/api-security.mdx:81` — Gap: CSRF, CORS and SameSite.

**Interview Questions**
- `url-shortener.mdx:121` — Missing: what happens if the Redis counter is lost.
- `url-shortener.mdx:27,44,101` — Accounts are out of scope, yet the page has a User entity.
- `url-shortener.mdx:172` — t.co answers with 301, not 302 (unsure).
- `url-shortener.mdx:176` — Out of date: goo.gl links were turned off in 2025, except active ones.
- `rate-limiter.mdx:183-187` — `INCR` then `EXPIRE` isn't atomic.
- `notification-service.mdx:181-186` — Check-then-send race. → Claim the row first.
- `notification-service.mdx:116-117` — DB then queue is a dual write. → Outbox or sweeper.
- `notification-service.mdx:219-235` — The final diagram is missing the campaign job, provider limiters, caps and the webhook receiver.
- `whatsapp.mdx:151` — Gap between Pub/Sub and the inbox. → Subscribe first, then read; resend un-acked messages.
- `whatsapp.mdx:137-138,239` — Redis Pub/Sub at 230K messages/s needs sharded Pub/Sub.
- `whatsapp.mdx:259` — Discord moved to ScyllaDB in 2022 and wrote about it in 2023.
- `news-feed.mdx:151-153` — A position-based Redis list can't page by "older than p-850". → Use a sorted set.
- `news-feed.mdx:214-231` — Feed Service needs the Follows DB (celebrity list), and the backfill job is missing.
- `web-crawler.mdx:152,164,316` — One queue per site doesn't scale. → Mercator back queues and a heap.
- `web-crawler.mdx:196` vs `152,225` — Three frontier designs that don't fit together.
- `web-crawler.mdx:184` vs `212,239-244` — The page is saved before the duplicate check.
- `web-crawler.mdx:244-245` — The Bloom filter "pushes" into the queue.
- `search-autocomplete.mdx:54,185` — A browser cache of 3600 s can't remove a harmful suggestion fast.
- `search-autocomplete.mdx:40` vs `284` — Two different trie sizes.
- `search-autocomplete.mdx:201-214` — The block-list store is missing from the diagram.
- `job-scheduler.mdx:161` — Many pollers read the same due run. → Claim with `ZREM` or Lua.
- `job-scheduler.mdx:61-69` — `POST /jobs` has no idempotency key.
- `e-commerce.mdx:174` — The flash-sale `DECR` is never given back.
- `e-commerce.mdx:141-150` — "Best" takes the same row lock as "Okay", just for less time.
- `e-commerce.mdx:152-165` — Commits on 0 rows, and multi-item carts can deadlock.
- `ticket-booking.mdx:77-82` — `confirm` charges money but has no idempotency in the API.
- `ticket-booking.mdx:145-149` — A retried hold fails on Alice's own hold.
- `ticket-booking.mdx:171` — Multi-seat holds can deadlock. → Lock in sorted order.
- `payment-system.mdx:88,161` — Match webhooks by our `paymentId` (sent as metadata), because `psp_payment_id` is NULL after a timeout.
- `payment-system.mdx:146` — Two tabs can pay for one order. → Partial unique index on `order_id`.
- `payment-system.mdx:293` — Switching PSP while the first answer is unknown can charge twice.
- `payment-system.mdx:217` — The refund ledger ignores that the PSP keeps its fee.
- `uber.mdx:66-70` — `POST /rides` has no idempotency.
- `google-docs.mdx:228` — Failover can create two owners. → Conditional log append as a fence.
- `google-docs.mdx:94-95,263-265` — Join with `fromVersion`, or edits made in between are missed.
- `google-drive.mdx:67,108,272` vs `299` — Hash-only dedupe lets users claim chunks they never had (Dropship).
- `google-drive.mdx:110` — Nothing checks that the uploaded bytes match the hash.
- `google-drive.mdx:228,294` — Cleanup can delete a chunk that was just reused.
- `google-drive.mdx:121` — "Shared with me" must ask every shard.
- `google-drive.mdx:56-58,244` — The version check has no API.
- `google-drive.mdx:270` — Kafka is in the diagram but never mentioned.
- `youtube.mdx:113,133` — Someone must call `CompleteMultipartUpload`; who starts processing is unclear.
- `youtube.mdx:250` — `views = views + N` double-counts after a crash.
- `distributed-cache.mdx:132` vs `209,257` — Two failover models (ZooKeeper vs primaries voting).
- `distributed-cache.mdx:209` — The old primary on the minority side keeps taking writes.
- `distributed-cache.mdx:36,207` — A lost DELETE means stale data, not "a few lost writes".
- `distributed-message-queue.mdx:250` — The diagram shows 2 copies, the text says 3.
- `logging-metrics.mdx:11,151-173` — Partitioning is listed as a pattern but never explained.
- `top-k.mdx:212` — Count-Min Sketch + heap doesn't work with sliding windows as described.
- `top-k.mdx:11` — Hot keys are listed but never discussed.
- `top-k.mdx:237` — The nightly batch overwrites lists, and the merger overwrites them back.

---

## NICE — polish (themes)

- **Diagram colors:** about 25 decision or step flowcharts have no color classes, and a few use the wrong class: Redis Pub/Sub as a cache, the GraphQL server as an `lb`, the OTel collector as an `lb`, buckets as `db`. → Add a neutral "step" class and fix the wrong ones.
- **Code details:** wrong fence languages (Dockerfile, ini and logs as `bash`; redis-cli blocks with `#` comments), `ZREVRANGE` (deprecated), node-pg result shapes, small mismatches between SQL and the code next to it.
- **Course talk:** "Optional." in 4 descriptions, "the next lesson", "Each has its own page", "On this page…". → Remove.
- **Small inconsistencies:** 4.3 vs 4.4 min (30-day vs average month), "50% or more" vs "more than half", `OrderCreated` vs `OrderPlaced`, `processed_events` vs `processed_messages`, `customer_id` vs `user_id`, `items` vs `order_items`.
- **Small gaps:** UUIDv7, ephemeral ports and the 4-tuple, `X-Forwarded-For`, anycast, heartbeats and LB idle timeouts, HSTS preload, the OIDC `nonce`, readiness vs liveness probes, the RED method, 3PC, hybrid logical clocks, Kafka log compaction and consumer lag, 410 Gone, Little's Law.

---

## Suggestions to make the notes better

1. **Fix the seams between "Best" answers.** Most must-fix bugs sit where two good ideas meet: duplicates, retries, crashes between two writes. Add one "Races and duplicates" check to each deep dive:
   - Who else writes this row?
   - What if the message comes twice?
   - What if we crash between two writes?
2. **A standard security line on every question page.** The server sets prices and amounts. Webhooks are signed and de-duplicated. Every create or charge endpoint shows an `Idempotency-Key`.
3. **One home per concept.** Keep the full explanation in one lesson and link to it from the others:
   - rate-limiting algorithms;
   - the hash-mod-N table;
   - read-your-writes;
   - EXPLAIN and N+1;
   - hot-key fixes;
   - microservices stories;
   - the latency numbers table.
4. **One running example per area.** One shop schema (`users`, `products`, `orders` with `total_cents`, `order_items`) for the Databases and Production lessons. One checkout story with one step order (reserve stock → charge → ship) and one set of event names for Messaging and Distributed Systems.
5. **Vary and date the real-world stories.** These repeat across many lessons: Discord (6 lessons), Twitter timelines (5), Netflix Open Connect (5), Stripe idempotency (4), the Facebook memcache paper (6 mentions). Keep each in one place, use fresh examples elsewhere, and re-check facts that change: Redis licence, goo.gl, Conductor, EventStore, certificate lifetimes.
6. **Add the missing big ideas:**
   - "What happens when you type a URL" (DNS → TCP → TLS → HTTP → LB → app, with a latency budget);
   - PACELC;
   - a PostgreSQL vs MySQL table;
   - queueing and Little's Law;
   - CSRF and CORS.
7. **More practice built into the pages:**
   - 2–3 follow-up questions on each concept lesson (the question pages already have them);
   - a "What breaks?" table on each question page (component down → effect → fix);
   - average and peak given separately in every quick math section;
   - a Foundations block in the Cheat Sheet;
   - then the planned Flashcards, built from the "Remember this" boxes.
8. **Bring the older pages up to the template.** `redis.mdx` and `scaling-reads.mdx` need an everyday comparison and a diagram. "Start Here" is thin.
9. **Final diagrams = the whole design.** Every box the deep dives add should be in the final diagram, and every box in the diagram should be in the text.
