# SnapShare Scaling Plan

## 1. Assumptions & Calculations
Based on the starting facts, we assume the following traffic patterns (calculating over an 86,400-second day and factoring a 5x peak multiplier for surge traffic):
* **Registered Users:** 10,000,000
* **Daily Active Users (DAU):** 10% of 10M = 1,000,000 DAU
* **Uploads per day:** 1,000,000 DAU × 1 photo = 1,000,000 photos/day
* **Feed views per day:** 1,000,000 DAU × 50 pages = 50,000,000 views/day
* **Storage per photo (Total):** 2 MB (original) + 50 KB (thumbnail) = 2.05 MB

### Estimates
* **Uploads per second:** ~12 uploads/sec (Peak: ~60 uploads/sec)
* **Feed views per second:** ~579 views/sec (Peak: ~2,895 views/sec)
* **Storage per year:** 1,000,000 uploads/day × 2.05 MB = 2.05 TB/day. Over a year (365 days), this requires **~748.25 TB per year**.

## 2. Workload Profile
The system is heavily **read-heavy**. With roughly 579 read requests per second compared to just 12 write requests per second, the read-to-write ratio is nearly 50:1. This means the architecture must prioritize caching, database read replication, and edge delivery (CDN) to serve feed data and images as quickly as possible.

## 3. Data Storage Strategy
**Why photos shouldn't go in the database:** Relational databases are optimized for structured data and rapid querying. Storing large binary files (BLOBs) inside a database bloats its size, makes backups agonizingly slow, consumes expensive RAM to cache image bytes instead of index data, and severely bottlenecks scaling.
**Where they should go instead:** Photos should be saved in highly scalable, purpose-built **Object Storage** (like Amazon S3), while the database only stores the lightweight text URL pointing to where the image lives.

## 4. Architecture Diagram

```text
          [ Users / Clients ]
                  |
               [ CDN ] (Serves cached photos & thumbnails)
                  |
          [ Load Balancer ]
                  |
         +--------+--------+
         |                 |
   [ App Server 1 ]  [ App Server 2 ] ...
         |                 |
         +---- [ Cache ] (Redis/Memcached for feed data)
         |
         +---- [ Message Queue ] -----> [ Worker Node(s) ] (Thumbnail generator)
         |                                     |
         +---- [ Primary DB ] (Writes)         |
         |          |                          |
         |     [ Read Replica ] (Reads)        |
         |                                     |
         +----------------------------> [ Object Storage ] (S3: Photos)
```

## 5. Component Explanations
* **CDN (Content Delivery Network):** Reduces latency and bandwidth costs by caching and serving heavy image files from edge servers physically close to the user.
* **Load Balancer:** Prevents individual server overload by distributing incoming user traffic evenly across multiple application servers.
* **App Servers:** Executes core business logic, handles API requests, and orchestrates interactions between the database, storage, and queues.
* **Cache:** Drastically reduces database load and speeds up response times by storing frequently accessed data (like popular users' feeds) in memory.
* **Primary Database:** Acts as the single source of truth for all write operations, ensuring data integrity when users upload photos or update profiles.
* **Read Replica:** Solves the 50:1 read-heavy bottleneck by offloading feed-generation `SELECT` queries from the primary database.
* **Object Storage:** Solves the problem of storing massive amounts of unstructured file data (748 TB/year) cheaply and with infinite horizontal scaling.
* **Message Queue:** Decouples heavy tasks from user requests so the app servers don't get blocked waiting for jobs to finish.
* **Worker:** Solves CPU contention by asynchronously processing intensive background tasks (like resizing images) entirely separate from the main web traffic.

## 6. Upload Flow (Step-by-Step)
1. A user uploads a photo; the request passes through the **Load Balancer** and is routed to an available **App Server**.
2. The App Server streams the 2 MB original photo directly to **Object Storage** and receives a unique file URL in return.
3. The App Server writes the photo's metadata (user ID, timestamp, Object Storage URL) into the **Primary Database**.
4. The App Server drops a message containing the photo ID and URL into the **Message Queue** and immediately responds to the user with a "Success" message.
5. In the background, a **Worker** picks up the task from the Message Queue, downloads the original photo, and generates the 50 KB thumbnail.
6. The Worker saves the new thumbnail to **Object Storage** and updates the **Primary Database** record to include the new thumbnail URL.

## 7. Trade-offs
1. **Eventual Consistency vs. Strong Consistency:** By utilizing a Read Replica to handle feed views, we trade strict consistency for high availability and performance. When a user uploads a photo to the Primary DB, it takes a few milliseconds for it to sync to the Replica. Followers might not see the new photo the exact millisecond it uploads, which is a highly acceptable trade-off for a social feed.
2. **Asynchronous Processing vs. Instant Availability:** By pushing thumbnail generation to a Message Queue and Worker, the thumbnail isn't instantly available the second the photo uploads. The trade-off is a slight delay in thumbnail generation, but in exchange, the user doesn't have to stare at a loading spinner for 5 seconds while the web server struggles to resize the image synchronously.