---
layout: post
title: I Won't Change the Database
date: 2026-11-22
---

### The same query, again

A page counts what a system has done, grouped by a few columns over three
joined tables. PostgreSQL needs about ten seconds. Every time someone opens
the page it reads the same rows again.

The answer is almost the same as it was a minute ago. PostgreSQL has no
stored answer to reuse.

### The fixes change the database

The usual fix is a materialized view. It stores the groups, but a refresh
reads every row again whether one row changed or none did. Refresh often and
pay for the full read. Refresh less often and serve an old answer. On twenty
million taxi trips, a refresh took seven to eleven seconds. Hourly rows also
cannot give a median over a week, because medians do not add up.

A summary table kept by triggers puts work inside every write to a table that
changes all day. Every new view becomes a migration. pg_ivm does this inside
the transaction. Its README says writers to the same view take turns and
that it is "not effective when a base table is modified frequently". It also
has to be preloaded, which means restarting the server. TimescaleDB's
continuous aggregates are built for this, but the Azure service ships the
Apache edition, and the licence table does not list continuous aggregates
for it.

### I dropped SQL

I wanted to test the idea without changing the database first.

My first Straum design had the same problem. I tried to make plain SQL
faster by handing the aggregate query to a side process. That needed an
extension managed providers do not allow, a proxy in front of all traffic,
or my own parser for PostgreSQL's SQL. I dropped SQL.

### Straum follows the stream

Many managed PostgreSQL services expose a replication stream. With a
replication role and a publication, Straum follows every insert, update and
delete in commit order. It reads the tables once, keeps each group in memory
and applies each commit from the stream. The page calls Straum over HTTP.

You write the aggregates as a small view, in a subset of `CREATE VIEW`.
Every answer carries a timestamp for its position in the stream. On the taxi
data, a count or sum comes back in under a millisecond and the median in
about 25 milliseconds. **There is no refresh. The aggregates are not stored
in PostgreSQL.**

### What Straum needs

**It still needs a few database changes.** A role that can read, a publication
and `REPLICA IDENTITY FULL` on each table. The last setting makes updates
and deletes log the old row, which increases WAL volume. Inserts do not need
the old row. On PostgreSQL 17 and 18, `wal_level = logical` also needs a
restart if the server is not already set to it. On a self-managed server, a
second mode reads WAL directly and changes no setting.

You do not need those changes to try it. One command copies the columns the
view reads into a throwaway PostgreSQL in Docker, using a role that can only
`SELECT`. Compare Straum's answers with your own SQL on the copy, then
delete the containers.

### When Straum stops

If Straum stops, database writes continue. No trigger runs in the write
path, so writes never wait for it. Its replication slot is temporary, so a
crash or deleted container makes PostgreSQL drop the slot. If it falls
behind, it stops once the WAL kept for it passes a limit you set, 4 GiB by
default. A change it cannot apply makes it exit. A process supervisor can
start it again. It writes nothing to disk. Remove it by dropping the
publication and setting each table's replica identity back.

The dashboard calls Straum over HTTP.

### The limits

Straum keeps state in memory. Each start loads the tables again, so begin
with few keys. The spec, asks and flags may still change. Straum only answers
what the view declares. If you need to join the summary to other tables in
SQL, pg_ivm or a continuous aggregate fits better.

### Try it with taxi data

The command below loads a month of taxi trips and leaves you in a shell. It
needs Docker.

```bash
docker compose -f <(curl -fsSL https://raw.githubusercontent.com/janbjorge/straum/main/docs/compose/quick-start.yaml) \
  run --rm shell
```

Code and guide:
[github.com/janbjorge/straum](https://github.com/janbjorge/straum).
Which `GROUP BY` keeps showing up in your slow log?
