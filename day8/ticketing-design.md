# TicketHub System Design

## 1. Requirements

**Functional Requirements:**
* Users can browse upcoming events and concerts.
* Users can view real-time seat availability for an event.
* Users can temporarily hold a seat (e.g., for 10 minutes) while they complete checkout.
* Users can pay for their held seats to finalize the purchase.
* Users can view their purchased tickets.

**Non-Functional Requirements:**
* **Correctness (No Double Booking):** The system must guarantee that a single seat is never sold to two different users. 
* **Speed:** The application must load quickly, even under massive load, to ensure a smooth user experience.
* **Fairness:** High-demand tickets must be allocated on a strict first-come, first-served basis.
* **High Availability:** The general browsing and event discovery features should remain online even if the ticketing engine is under peak load.

## 2. Load Estimates

**Normal Traffic:**
* **Page Views:** 50,000 visitors × 10 pages = 500,000 views/day. Over an 86,400-second day, this is roughly **~6 reads per second**.
* **Ticket Sales:** 5,000 tickets / 86,400 = **~0.06 writes per second**. 
* Normal traffic is minimal and can be handled by a very basic server setup.

**"Big Sale" Peak Traffic:**
* **Page Views / Attempts:** 200,000 people rushing in a 10-minute (600 seconds) window. 200,000 / 600 = **~333 visitors per second** hitting the system concurrently. 
* **Ticket Sales:** 20,000 seats sold in 600 seconds = **~33.3 successful writes per second**, but accompanied by thousands of concurrent write *attempts* (seat holds) per second.
* **Comparison:** Peak traffic write attempts are orders of magnitude higher than normal traffic. While 333 req/sec isn't inherently massive for a web server, the database contention (thousands of people trying to lock and update the exact same 20,000 rows simultaneously) is a massive bottleneck.

## 3. API Design

1. **Browse Events**
   * **Method:** GET
   * **Path:** `/api/events`
   * **Description:** Retrieves a paginated list of upcoming events.

2. **View Seats**
   * **Method:** GET
   * **Path:** `/api/events/:id/seats`
   * **Description:** Retrieves the seat map and current availability status (available, held, booked) for an event.

3. **Hold Seat**
   * **Method:** POST
   * **Path:** `/api/holds`
   * **Description:** Attempts to place a 10-minute temporary hold on a specific seat. 

4. **Process Payment**
   * **Method:** POST
   * **Path:** `/api/payments`
   * **Description:** Processes payment for a user's current holds and converts them into purchased tickets.

5. **View Tickets**
   * **Method:** GET
   * **Path:** `/api/users/:id/tickets`
   * **Description:** Retrieves a list of confirmed tickets purchased by the user.

## 4. Data Model

**Tables & Relationships:**
* **users:** `user_id` (PK), `name`, `email`
* **events:** `event_id` (PK), `name`, `date`, `venue`
* **seats:** `seat_id` (PK), `event_id` (FK), `seat_label`, `status` (available, held, booked), `held_by_user_id` (FK), `hold_expires_at`
* **orders:** `order_id` (PK), `user_id` (FK), `event_id` (FK), `total_price`, `created_at`

*Relationships:* 
* One `event` has many `seats`.
* One `user` has many `orders`.
* One `user` can temporarily hold many `seats` (represented by `held_by_user_id` on the seat).
* One `order` maps to many `seats` (in a real system, via an `order_items` join table, but simplified here).

**Preventing Double-Booking:**
To ensure correctness, double-booking is prevented using **SQL Transactions** and **Row-Level Locking** (Pessimistic Locking). 
When a user attempts to hold a seat, the system executes a transaction:
1. `BEGIN TRANSACTION;`
2. `SELECT * FROM seats WHERE seat_id = 123 AND status = 'available' FOR UPDATE;`
3. If the seat is returned, it is available. The `FOR UPDATE` lock prevents any other database connection from reading or modifying this row.
4. `UPDATE seats SET status = 'held', held_by_user_id = 456 WHERE seat_id = 123;`
5. `COMMIT;` (Releases the lock).
If two users click the same seat at the exact same millisecond, the database forces one to wait. The first gets the lock, updates the status, and commits. The second transaction then proceeds, sees the status is no longer 'available', and safely returns a "Seat taken" error.

## 5. Architecture Diagram

    [ Users ]
        |
     [ CDN ] (Caches static UI, venue images)
        |
    [ Virtual Waiting Room / Edge Gateway ]
        |
    [ Load Balancer ]
        |
    +---+---+---+---+
    |   |   |   |   |
    [ App Servers (Auto-Scaled) ]
        |
    +---+-------+-------+
    |                   |
    [ Distributed Cache ] (Redis: Seat Map Status & Session Data)
    |
    [ Primary Relational DB ] (SQL: Strict ACID Transactions)
    |
    [ Message Queue ] ---> [ Worker ] (Sends confirmation emails)

**How it survives the Big Sale:**
1. **Virtual Waiting Room:** During a massive surge, this component catches the 200,000 users and only lets a safe number (e.g., 2,000 at a time) through to the App Servers, preventing database melt-down.
2. **CDN & Cache:** The UI and the read-only event lists are served from the CDN. The live seat availability is cached heavily in Redis. The App Servers query Redis for the seat map rather than hammering the DB for every page refresh.
3. **App Servers:** Auto-scaling spins up additional application instances to handle the incoming HTTP connections.
4. **Primary DB:** Tuned specifically for handling rapid, locked transactions (writes). 

## 6. Trade-Offs

1. **Waiting Room Fairness vs. Immediate User Experience:** Implementing a virtual waiting room significantly degrades the immediate user experience (people have to stare at a progress bar). However, the trade-off is necessary to maintain system stability and ensure fairness; without it, the database would crash, and nobody would get tickets.
2. **Caching vs. Strict Real-Time Accuracy:** We cache the seat map in Redis to survive the read-heavy traffic of users refreshing the page. The trade-off is eventual consistency: a user might see a seat as "green" (available), click it, and receive an error because someone else locked it in the primary DB 50 milliseconds ago. We trade perfect UI accuracy for massive scalability.