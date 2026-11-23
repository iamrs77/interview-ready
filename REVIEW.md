# Review notes

# JavaScript and Low-Level Design, round 1 (2026-11-23)

## Status: all MUST and SHOULD items fixed

- **Checked:** all 54 JavaScript pages and all 60 Low-Level Design pages, read line by line by 9 reviewers.
  - Every code block with a claimed output was run in Node 24. The Guess-the-Output puzzles were run 3 ways (the site's Run button, a browser script, a Node file), and every answer matched.
  - Every LLD practice problem was put together and run end to end. The `Mutex` and `BoundedQueue` were stress-tested, and chess move generation was checked with perft (20 / 400 / 8902 / 197281).
  - TypeScript blocks were type-checked. The diagrams on every changed page parse. MDX check, types, lint and the production build pass.
- **Found:** 15 MUST, 51 SHOULD, about 60 NICE. Wrong `// output` comments or puzzle answers: none.
- **Biggest fixes:**
  - LRU with only a JS `Map` is **not** O(1) in V8: deleted keys leave empty slots that `keys().next()` steps over. Checked by timing, then fixed in `problems/lru-cache`, SD `caching/cache-eviction` and JS `map-set-weakmap`.
  - Bugs in example code: Command `slice(0, -0)` wiped the document; pub-sub `seek()` during delivery was ignored; task scheduler `setTimeout` overflowed after 24.8 days; Splitwise accepted an expense with no sharers; `holdSeats("A1", "A1")` deadlocked on its own lock.
  - Wrong facts: Chain of Responsibility "biggest note first always works"; "TypeScript abstract classes only exist while compiling"; "Node can't run `.ts`"; pawn promotion is "always a queen"; the safe vs transparent Composite; the library "returned on the due date = no fine" case; out-of-date Node module detection; the Java `ConcurrentHashMap` advice in the KV store and rate limiter.
  - Gaps that interviewers often ask about: pass by value vs reference, `this` in DOM listeners, Object.groupBy, iterator helpers, IoC vs DI vs DIP, LSP contracts, GoF Director, `SharedArrayBuffer` + `Atomics`, detached DOM leaks, 4 problems missing from the LLD cheat sheet.
- **Not done, on purpose:**
  - Pages built from your notes got error fixes only: no throttle trailing call, no TypeScript declaration merging.
  - NICE items that are rarely asked (each reviewer's list is in the session scratchpad).
- **Needs you:** a "Step 2" code block's Run button fails on its own (ReferenceError), because it doesn't include Step 1. Fix: have Run add the earlier blocks of the same example, or mark those blocks `noRun`.

---

# System Design

Two full reviews so far:
- **Round 2 (2026-11-20)** is below.
- **Still open from round 1 (2026-11-19)** is at the bottom. The full round-1 list is in git (commit `87235bf`).

All lesson paths are relative to `content/system-design/`. Card IDs are flashcards in `src/data/flashcards/system-design/`.

---

# Round 2 (2026-11-20)

## Status: all fixed (2026-11-20)

- ✅ **Fixed:**
  - all 11 MUST FIX, all 66 SHOULD FIX and the NICE items below, in the lessons, the flashcards and the site code;
  - one checkout story everywhere: `PENDING` → `PAID` → `SHIPPED` / `CANCELLED`, and shipping listens to `PaymentSucceeded`;
  - uptime uses a 30-day month everywhere.
- ✅ **Flashcards:** 1,519 cards (58 new). Wrong and weak answers were fixed, and near-duplicates merged.
- ✅ **Flashcards trimmed to a core set (2026-11-20): 1,519 → 774.**
  - At most 6 per concept lesson and 8 per question page.
  - Removed: trivia, config details, near-duplicates and cards that were too basic.
  - Kept cards keep their IDs, so saved progress stays.
  - The removed cards are saved in the session scratchpad (`trim/*/removed-*.json`) and can be restored.
- ✅ **Checked after the fixes:**
  - all 126 pages load;
  - 312 of 312 diagrams draw, with no broken links;
  - all flashcards pass;
  - types, lint and the production build pass;
  - the browser tests pass (flashcard keys, practice mode, diagram view, search, Yes/No dialog, sidebar).
- ✅ **Also done:** module folders in the sidebar are darker than the lessons under them.
- ⬜ **Not done, on purpose:**
  - **Static search index:** it would be 2 MB gzipped to download, too big, so search stays on the server.
  - **Google Drive:** one rare edge case is left, two cleanup runs overlapping. Closing it needs a generation number per stored copy.
  - **The "Ideas" list below:** new features, for you to decide.
  - **The round-1 open items at the bottom.**

## How it was checked

- **Automated, all pages:**
  - all 126 pages load;
  - 312 of 312 diagrams draw, with no broken links;
  - all 1,461 flashcards pass `npm run check:flashcards`;
  - types, lint and the production build pass.
- **Read line by line:** 8 reviewers covered:
  - all 126 lessons, the Cheat Sheet and all 1,461 flashcards;
  - the site code, tested in a real browser.
- **Fixes from round 1:** each one was checked again (about 150 items).
- **Double-checked:** every MUST FIX below was checked again directly in the files.

| Area | Must fix | Should fix | Nice |
| --- | --- | --- | --- |
| Guide + 1. Foundations (+ Cheat Sheet) | 0 | 8 | ~20 |
| 2. HLD Basics + 4. Caching | 0 | 9 | 6 |
| 3. Databases + 9. Production | 1 | 4 | ~16 |
| 5. Messaging + 6. Distributed Systems | 1 | 9 | ~6 |
| 7. Reliability & Security + 8. Advanced | 0 | 6 | ~13 |
| 10. Questions: URL Shortener → Ticket Booking | 5 | 11 | ~19 |
| 10. Questions: Google Drive → Google Docs | 2 | 16 | ~23 |
| Site code | 2 | 3 | 14 |
| **Total** | **11** | **66** | **~117** |

## Round-1 fixes

About 150 fixes landed correctly. Six were only **half done**; they are listed below as findings:
- the saga undo: the last step still has none;
- Google Docs client transform: it breaks with several waiting ops;
- Google Drive cleanup race: the `deleting` state;
- Top-K batch vs merger: there's a gap after midnight;
- the Job Scheduler retry text: it contradicts its own table;
- the Notification Service "on the queue" mark: there's no column for it.

---

## MUST FIX — wrong or broken

**Lessons**
- `distributed-systems/saga-pattern.mdx:34,131` — The last step, `rentCar`, has no undo ("None needed: it's the last step").
  - Problem: if the rental works but its reply times out, the trip is cancelled and the card refunded, but the car stays rented.
  - This is the same bug round 1 fixed for `chargeCard`.
  - Fix: push `cancelCar` before `rentCar`, or retry `rentCar` with an idempotency key until it gets a clear yes or no.
- `databases/replication.mdx:129` — "Replicas did not help, because they copy deletes too" is wrong for GitLab 2017.
  - An `rm -rf` of a data folder is not copied. The only replica had already been wiped to rebuild replication.
  - Fix: say that.

**Interview questions**
- `questions/job-scheduler.mdx:116,149-151,172` — Cron jobs that run more often than every 5 minutes run late.
  - Problem: the next run is saved as `scheduled` after the 5-minute load has already happened, so it waits for the next load.
  - Fix: use the "one catch" rule for every run created inside the loaded window (new job, next cron run, retry): save it `queued` and put it straight in the timer queue.
- `questions/google-docs.mdx:74,102,192` — The browser can have several ops waiting, and each is "based on" the same server version.
  - Example: Alice types `H` then `E`. The server shifts her `E` past her own `H`, giving `CHAET` while Alice sees `CHEAT`.
  - Fix: one op in flight at a time, with the rest buffered until it's confirmed (as Google Wave and ot.js do).
- `questions/google-drive.mdx:291` — `SET current_version = 7 WHERE current_version = 5` skips version 6 when the save wins.
  - Fix: `current_version + 1`, and insert the `file_versions` row in the same transaction.
- `questions/whatsapp.mdx:79,168` vs `224-232` — "The server sees the same `clientMsgId` and saves once", but nothing stores `clientMsgId`.
  - Problem: the server makes `message_id`, so a retry creates a second message.
  - Fix: a dedupe record (sender, clientMsgId) → messageId, with `SET NX` + TTL, or `IF NOT EXISTS`. The ack returns that ID.
- `questions/web-crawler.mdx:194,258-260` — "Seen" is marked **before** the save it protects:
  - the content hash is added before the S3 save;
  - the Bloom filter is updated before the URL DB insert.
  - Problem: a crash in between loses that page or URL forever, which breaks requirement 4 ("no work lost").
  - Fix: mark "seen" after the save. Store pages by content hash, so saving twice is harmless.
- `questions/e-commerce.mdx:206-212,230,278` — The payment webhook marks orders paid with no signature check and no de-dupe by event ID.
  - Problem: anyone can POST a fake "paid".
  - Fix: one line plus a link to `payment-system.mdx:97-101`. (Raised to MUST to match round 1's payment-system item.)
- `questions/ticket-booking.mdx:264,302` — The same webhook gap: an unverified "payment succeeded" books the seats. Same fix.

**Site code**
- `src/components/flashcards/study-session.tsx:89-100` — Flashcard keys fire everywhere on the page.
  - Problem: typing "2pc" in search (Ctrl+K) during a session saves "I knew it" for a card you never answered. Space reveals the card, and Enter on "End session" reveals instead of ending.
  - Fix: ignore keys when they're pressed in an input, button, link or dialog (like Fumadocs' `useHotKey`).
- `src/lib/flashcard-progress.ts:63` — "I knew it" moves a card up a box even when it wasn't due.
  - Problem: three "Practice all" rounds in a few minutes push cards from box 1 to box 4 (14 days).
  - Fix: if the card isn't due yet, keep its box and due date and only count the review. "Again" still resets.

---

## SHOULD FIX — unclear, inconsistent, outdated or gaps

**Guide + Foundations + Cheat Sheet**
- `foundations/what-happens-when-you-type-a-url.mdx:119,125` — A personal page is sent with `Cache-Control: no-cache`, and the text says a CDN may keep it. → `private, no-cache`, and add an `ETag` so the `304` check has something to compare.
- `foundations/cookies-sessions-jwt.mdx:39,117` + card `cookies-sessions-jwt-2` — "SameSite: not sent when another site triggers the request" is true only for `Strict`, and it contradicts `csrf-cors.mdx:74-78`. Line 117 also says "SameSite **or** CSRF tokens", but `csrf-cors` says use both. → Explain Lax, and change "or" to "plus".
- `cheat-sheet.mdx:126,131` — "never send twice" and "run each job once" contradict the pages, which say exactly-once is impossible. → "at-least-once + dedupe / idempotent tasks".
- `foundations/http-and-https.mdx:40`, `what-happens-when-you-type-a-url.mdx:20` — Course talk ("the next lesson", "Each step below links to…"). → Remove.
- `foundations/grpc-and-graphql.mdx:56` + card `grpc-and-graphql-4` — gRPC-Web is the protocol, not "a helper proxy". → "gRPC-Web, usually with a proxy like Envoy".
- Card `http-methods-status-codes-headers-4` — "Only `GET` is safe" leaves out `HEAD` and `OPTIONS`.

**HLD Basics + Caching**
- `hld-basics/latency-throughput-qps.mdx:110` — "Slower requests mean fewer per second" is true only when in-flight requests are capped. With fixed traffic, more requests are in flight instead (`queueing-basics.mdx:98`). → Add the condition.
- `hld-basics/latency-throughput-qps.mdx:120` + card `latency-throughput-qps-9`, and `queueing-basics.mdx:11` — "Under 50%: requests rarely wait" and "you almost never wait" contradict `queueing-basics.mdx:58` (at 50% you wait about as long as the work). → "little waiting".
- `hld-basics/queueing-basics.mdx:86` — The Little's Law coffee shop has 1 arrival per minute with one 1-minute cashier. That is 100% busy, which the lesson says grows forever. → 1 every 2 minutes.
- `caching/redis.mdx:40` — "A random token, so a server only deletes its own lock" needs an atomic check-and-delete. → Say so and link Cache Problems.
- `caching/what-is-caching.mdx:76` + card `what-is-caching-7` — "A DB query takes 5–50 ms" vs "indexed query 1–10 ms" (capacity-estimation). → Use one set of numbers.
- `hld-basics/scaling-writes.mdx:151` + card `scaling-writes-13` — Firestore's "once per second per document" is gone from its current docs. → "Firestore warns one document can't take unlimited writes".
- `hld-basics/capacity-estimation.mdx:85,91` + card `capacity-estimation-11` — "A SQL DB does a few thousand to 10K queries/s" looks low; "10 Gbps" is dated (unsure). → "about 10K–50K simple reads/s".
- `hld-basics/scaling-writes.mdx:130` — The Redis → DB arrow suggests Redis writes to the DB by itself. → Add a "Sync job" box.
- `caching/caching-strategies.mdx:35-36` — A missing product is cached as `null` for 600 s, while `cache-problems.mdx:117` says 60 s. → `product ? 600 : 60`.

**Databases + Production**
- `databases/locking.mdx:141` + card `locking-8` — Solid Queue isn't PostgreSQL-only (37signals runs it on MySQL). → GoodJob, River or Graphile Worker.
- `production/cicd-docker-kubernetes.mdx:89` — `--cpu-percent=70` is outdated. → `--cpu=70%`.
- `databases/how-a-query-runs.mdx:42-62`, `production/finding-bottlenecks.mdx:110-129` — The EXPLAIN output is in the pre-PostgreSQL-18 format. → One line: "newer versions also print Buffers lines".
- `databases/postgresql-vs-mysql.mdx:17-29` — The first table uses words that are only explained later (heap, VACUUM, undo log, GIN, binlog). → Move it to the end as a recap.

**Messaging + Distributed Systems**
- `messaging/message-queues-pub-sub.mdx:100` — "Scaling Slack's Job Queue" is from 2017, not 2020.
- `distributed-systems/outbox-pattern.mdx:53-55,66,95,134` + card `outbox-pattern-8` — Ordering by `created_at` breaks, because `now()` is the transaction **start** time. Two events in one transaction also get the same time. → Add a `seq BIGSERIAL` column and order by it.
- `messaging/kafka.mdx:100`, `kafka-vs-rabbitmq-vs-sqs.mdx:24` + card `kafka-8` — Out of date: Kafka 4.2 (2026) share groups ("Queues for Kafka") allow more consumers than partitions, with per-message acks.
- `messaging/dead-letter-queues.mdx:86` + card `dead-letter-queues-6` — RabbitMQ 4.0 quorum queues have a `delivery-limit` (default 20) that sends a message to the dead-letter queue.
- `messaging/dead-letter-queues.mdx:102-111` — Retry topics and the DLQ break per-key order (a later `OrderCancelled` can overtake a parked `OrderPlaced`). → Say so, and give the fix.
- `distributed-systems/acid-vs-base.mdx:68-69,118` — Mixes ACID's C and CAP's C, which line 29 warns against. → "single-primary SQL, reads from the primary".
- **`OrderPlaced` has two meanings.**
  - In `sync-vs-async` and `eventual-consistency-async` it is a **paid** order.
  - In `event-driven-architecture` and `saga-pattern` it is a **pending** order.
  - Shipping listens to it in `message-queues-pub-sub`, `outbox-pattern` and `sync-vs-async`, so under the second meaning it would ship before payment.
  - → Pick one meaning: shipping listens to `PaymentSucceeded`.
- `messaging/event-driven-architecture.mdx:106` vs `saga-pattern.mdx:63-68` — The same payment failure ends differently ("failed" after `PaymentFailed` vs `CANCELLED` after `StockReleased`). → Use the same event and status.
- `distributed-systems/distributed-locking.mdx:15,24,42` vs `33-34,150` — The Redis lock example is the invoice job, but billing twice is harmful (and fencing can't stop a second email). → Use "rebuild a report" for Redis; for billing, use a unique (customer, month) invoice row.

**Reliability & Security + Advanced**
- `advanced-components/background-jobs.mdx:33-34,114-115` — Save to the DB, then add the job to the queue. A crash in between loses the job, or leaves it `pending` forever. → Outbox or a sweeper, and link the Outbox lesson.
- `advanced-components/search.mdx:155,157` — Out of date:
  - Elasticsearch added AGPLv3 in 2024 (open source again);
  - OpenSearch moved to the Linux Foundation (2024);
  - Wikipedia moved to OpenSearch (2025).
- `advanced-components/file-upload-download.mdx:151` — S3's maximum object size is 50 TB since Dec 2025 (it was 5 TB).
- `reliability-security/oauth-oidc.mdx:132` + card `oauth-oidc-10` — "Keep the refresh token on the server" contradicts the PKCE apps on lines 108-114 that have no server. → "or the device's secure storage".
- (The SameSite item above, from the cookies lesson, was also found here.)

**Questions: URL Shortener → Ticket Booking**
- `interview-framework.mdx:53,101,174` vs `url-shortener.mdx:45` — The framework still lists a User entity and `userId`, although accounts are out of scope. → Drop them.
- `questions/job-scheduler.mdx:200` — "Waits are shorter than 5 minutes", but the table waits 8. → "at most 8 minutes, within SQS's 15".
- `questions/job-scheduler.mdx:295` — "None are lost" after failover is true only with a synchronous standby. → Say so.
- `questions/notification-service.mdx:57,117-121` — Rows are `queued` before they are on the queue, and no column holds "on the queue". → Add `enqueued_at`.
- `questions/notification-service.mdx:57,262-264,287` — The webhook receiver has three problems:
  - `delivered`/`bounced` statuses don't exist;
  - there's no signature check or de-dupe;
  - a late `sent` overwrites `delivered`.
  - → Add the statuses, check and de-dupe, and only move status forward.
- `questions/whatsapp.mdx:159` — Resending un-acked inbox messages every 30 s means 10M inbox reads/s. → Track pushed messages per connection, and have the phone ask "anything after my last ID?" when it reconnects.
- `questions/whatsapp.mdx:117,141-153` — With Pub/Sub, nothing says who sends the push notification when Bob is offline. → Check the presence key.
- `questions/news-feed.mdx:171` — The feed memory is about 10 TB, not "a few times 800 GB": 500-entry sorted sets are past the compact listpack size. (Rough estimate.)
- `questions/news-feed.mdx:219` — `MGET` across many keys fails with `CROSSSLOT` in Redis Cluster. → A pipeline grouped by node.
- `questions/ticket-booking.mdx:239-242` — `ZRANK` for 10M waiting users is about 2M calls/s on one key. → Keep the rank in a signed cookie, and publish one "admitted so far" number via the CDN.
- `questions/ticket-booking.mdx:249-268` — The Admitter is missing from the final diagram.

**Questions: Google Drive → Google Docs**
- `questions/google-drive.mdx:70-77,287-296` — A `complete` retry after a lost reply conflicts with its own save. → Send an upload ID; if that version is already current, answer 200.
- `questions/google-drive.mdx:186,204` — The long poll must carry the cursor, or a nudge between calls is lost.
- `questions/google-drive.mdx:257,263` — A re-upload while the chunk is `deleting` reuses the same key, so cleanup can delete the new bytes. → Wait, or use a new key per copy.
- `questions/youtube.mdx:146` — Marked `processing`, then a crash before the orchestrator hears of it means the video is stuck forever. → Outbox or a sweeper.
- `questions/uber.mdx:122,269,285` — Ride saved, then sent to Kafka: a dual write. → Outbox or a sweeper.
- `questions/uber.mdx:164-165` — Parked drivers send every 30 s, and silent drivers are dropped at 30 s, so they flicker out. → 15 s or 60 s.
- `questions/uber.mdx:179` — "Box + 8 neighbours" must say the box is at least the radius, then filter by real distance (as geospatial-indexing does).
- `questions/payment-system.mdx:184,274,289-291` — A crash after `PENDING` but before calling the PSP leaves the order stuck. → Retry the PSP with the same key, or `FAILED` after a time limit, plus a reconciliation row.
- `questions/payment-system.mdx:100` — Say the `processed_webhooks` insert is in the **same transaction** as the status update.
- `questions/distributed-cache.mdx:155,266` — Redis's default `maxmemory-policy` is `noeviction`. → "set `allkeys-lru` for a cache".
- `questions/distributed-cache.mdx:229` + card `distributed-cache-12` — Hot-key copies are only "usually" on different nodes, and writes must update every copy.
- `questions/logging-metrics.mdx:139,177` + card `logging-metrics-5` — Agents send to the Ingest Service, not Kafka. Fix both lines.
- `questions/top-k.mdx:68,80,243` — Browsers can't write to Kafka. → Add a View Ingest Service.
- `questions/top-k.mdx:261` — Bloom and Count-Min Sketch are built into Redis 8 (not "RedisBloom module").
- `questions/top-k.mdx:233` + card `top-k-12` — Between midnight and the end of the nightly batch there is no base. → Each base records the time it covers.
- `questions/top-k.mdx:259` — YouTube removed its Trending page in July 2025.

**Site code**
- `src/components/mermaid.tsx:152-173` — The large diagram view doesn't move focus in, keep it there, or give it back. → A native `<dialog>`, like the confirm dialog.
- `src/components/mermaid.tsx:168-170` — On phones the "large" view is **smaller** than the inline one (3.5 px text). → Let it scroll at natural size.
- `src/components/mark-as-done.tsx:30` — The green "Done" text has about 2:1 contrast. → `text-emerald-700`, the sidebar tick's green.

---

## NICE — polish

**Lessons**
- **Code:**
  - `finding-bottlenecks.mdx:149` loops over a `pg` result object (it would throw).
  - `multi-tenancy.mdx:72`: use `set_config('app.tenant_id', $1, true)` to avoid pasting IDs into SQL.
  - `backpressure.mdx:105`: `pipeline()` instead of `.pipe()`.
  - `api-security.mdx:43,46`: Zod 4 `z.uuid()` and `z.strictObject`.
  - `idempotency.mdx:113`: the takeover isn't wired in, and the status code isn't saved.
  - `cache-problems.mdx:78,88`: waiters throw after 1 s while the lock lives 10 s.
  - `scaling-writes.mdx:136`: the slot rows must exist first.
  - Code fence languages in `cicd-docker-kubernetes`, `finding-bottlenecks` and `observability`.
- **Facts to refresh:**
  - `cookies-sessions-jwt.mdx:69,75`: `exp` 1764000000 is 2025.
  - QUIC's year is 2021 (HTTP/3 is 2022).
  - `node:24-alpine`.
  - Gatling has a JS SDK.
  - ChatGPT on SSE: lead with the API fact.
  - Google Photos API (March 2025) breaks the PhotoPrint example.
  - Kafka 4.0 removed ZooKeeper.
  - Encrypting internal traffic is common now, not only at banks.
  - "Recreate" deploys are used beyond small tools.
- **Diagrams:**
  - Uncoloured nodes in `postgresql-vs-mysql`.
  - `queueing-basics.mdx:129`: `:::external` on a reject box.
  - `observability.mdx:144`: the OTel Collector as `:::lb`.
  - `grpc-and-graphql.mdx:118`: GraphQL as `:::lb`.
  - Arrow direction in `how-the-internet-works.mdx:96` and `change-data-capture.mdx:67`.
  - `ad-click-aggregator.mdx:93,231`: the redirect goes to the browser.
  - Final diagrams missing boxes:
    - Google Drive: File Service → storage;
    - YouTube: Redis and "task done";
    - Uber: Notification/push;
    - News Feed: session cache;
    - Logging: cold query path.
- **Small inconsistencies:**
  - 44 vs 43 min of downtime per month (cheat sheet vs SLO page);
  - order status names (pending/PLACED/PENDING);
  - batch delay "minutes to hours" vs "hours to a day";
  - `my-blog` breaks the 8-character alias rule;
  - the retry count in `notification-service` is 6, not 5;
  - `e-commerce.mdx:246` step order;
  - `ticket-booking.mdx:241` vs `255` (who checks the token);
  - `distributed-message-queue.mdx:69` vs `105` offsets;
  - a float `price` in `uber.mdx:62`.
- **English and course talk:**
  - "this module", "The full lesson is", "The HTTP lesson", "This page is about", "This lesson shows why";
  - jargon used before it's explained: WebRTC, LFU, CDC, "noisy neighbour".
- **Small gaps:**
  - PostgreSQL doesn't index foreign keys;
  - the HPA needs CPU requests;
  - `LIKE 'run%'` needs `text_pattern_ops`;
  - `SameSite` doesn't stop sibling subdomains;
  - the `Origin` header rules;
  - LB idle timeouts and heartbeats;
  - anycast;
  - the cache-aside race that remains;
  - OT ties at the same position;
  - op IDs per tab;
  - manifests need short cache times;
  - partial refunds.
- **Flashcards:**
  - Near-duplicates: `grpc-and-graphql-4/5`, `tcp-vs-udp-7/11`, `cap-theorem-17` and `consistency-models-14`.
  - Weak answers: `partitioning-sharding-11`, `schemas-and-keys-10`, `rbac-3`.
  - Missing cards for:
    - reused connections;
    - HTTP → TLS → TCP layering;
    - the interview step timings;
    - stripping `X-User-Id`;
    - chained uptime;
    - "CORS protects users, not servers";
    - the e-commerce checkout rules;
    - the `ZREM` claim;
    - the refund fee;
    - Kafka exactly-once;
    - Redis Cluster slots;
    - silent Uber drivers.

**Site code**
- **Performance:**
  - Search builds its index on the first request after each Vercel cold start, from a 5.4 MB chunk. → Build it at build time and search in the browser.
  - The `/all` deck page ships 744 KB, and the decks page prefetches it. → Turn off prefetch, and send one lesson table.
  - Diagrams re-render on every visit. → Cache the SVGs.
- **Bugs:**
  - `useNow` rounds down to the minute, so a card missed seconds ago shows "Due now 0".
  - The reset count includes removed pages ("3 of 126" vs "All 4 done lessons").
  - "N needed another try" counts misses, not cards.
  - The progress bar goes backwards when a missed card returns.
- **Accessibility:**
  - The card's `aria-label` hides the question from screen readers.
  - Focus is lost after reveal.
  - The expand icon has low contrast.
  - The progress bars have no labels.
- **Scripts:**
  - `check-flashcards.mjs` crashes on a card with no `lesson`, a `null` card, or `--only` with no value.
  - `update-progress.mjs` crashes on non-page entries in a folder's meta.json (the output is correct today).
- **Upkeep:**
  - The grid template, the sidebar-width selector and the done-tick selector copy Fumadocs internals. Re-check them after each Fumadocs upgrade.
  - The comment in `provider.tsx` is wrong (the dialog chunk loads on every page).
  - Dead `body[data-scroll-locked]` CSS.
  - Unused `useMDXComponents`.
  - `getDeck('all')` returns `key: 'guide'`.
  - The deck list is defined in 3 places.
  - The progress-bar markup is copied 4 times.

---

## Ideas from round 2

1. **"Crash here → what saves you" on every two-step design.** Most new bugs share one shape: a status is written, then the next step is lost (background jobs, Uber, YouTube, payments), or "seen" is marked before the save (web crawler). Add a short outbox-or-sweeper line to each, linking the Outbox lesson. Also make every retry of a two-step endpoint return the first result.
2. **One shared webhook paragraph:** check the signature, de-dupe by event ID, and only move status forward. Link it from e-commerce, ticket-booking, notification-service and payment-system.
3. **One "where order is kept and where it is lost" table:**
   - Kafka partitions vs share groups;
   - RabbitMQ with one consumer;
   - SQS FIFO;
   - retry topics and DLQs;
   - the outbox relay;
   - saga undos.
4. **A "Redis at scale" check** wherever Redis holds big or hot data: memory per entry, `CROSSSLOT` for multi-key commands, one key = one shard.
5. **Date the facts that change** ("checked 2026-11"): licences (Redis, Elasticsearch), S3 limits, Kafka features, API flags, Redis 8 built-ins. Then the next review can re-check them quickly.
6. **One browser-auth story everywhere:**
   - in browsers: an HttpOnly + `SameSite=Lax` cookie, plus a CSRF token;
   - on mobile and between services: Bearer tokens.
   - Apply it in cookies-sessions-jwt, csrf-cors, http-and-https and oauth-oidc.
7. **Flashcards:** add an undo for the last answer, a cap on new cards per session (e.g. 20 new + all due), and export/import of progress (it lives only in this browser).
8. **Sidebar and home:** a done count on each module folder ("4/13"), and "Continue: <last lesson>" on the home card.

---

# Still open from round 1 (2026-11-19)

All round-1 MUST FIX and SHOULD FIX errors are fixed (round 2 checked them). Still open on purpose:
- **Gaps and new topics:**
  - capacity "servers needed" and cache-memory sizing;
  - Kafka log compaction and consumer lag;
  - hybrid logical clocks;
  - UUIDv7;
  - ephemeral ports;
  - `X-Forwarded-For`;
  - HSTS preload;
  - the OIDC `nonce`;
  - the RED method;
  - 3PC;
  - 410 Gone.
- **Thin pages:** `caching/redis.mdx` and `hld-basics/scaling-reads.mdx` have no everyday comparison or diagram. "Start Here" is thin.
- **Duplication:**
  - read-your-writes is explained 3 times;
  - EXPLAIN is in both `how-a-query-runs` and `finding-bottlenecks`;
  - real-world stories repeat: Discord, Twitter timelines, Netflix Open Connect, Stripe idempotency, the Facebook memcache paper, S3 2020/2023, Netflix degradation.
- **Polish themes:**
  - about 25 step flowcharts have no colour classes;
  - fence languages;
  - small naming mismatches (`OrderCreated`/`OrderPlaced`, `processed_events`/`processed_messages`, `customer_id`/`user_id`).
- **Suggestions:**
  - one home per concept;
  - one running example per area (one shop schema, one checkout story);
  - 2–3 follow-up questions on each concept lesson;
  - a "What breaks?" table on each question page;
  - a Foundations block in the Cheat Sheet;
  - final diagrams = the whole design.
- **Waiting on you:** upgrade Node to 24.11 or newer (now 24.0).
