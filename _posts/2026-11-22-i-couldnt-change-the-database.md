---
layout: default
title: I couldn't change the database
date: 2026-11-22
---

A page counts what a system has done, grouped by a few columns over three
joined tables. PostgreSQL needs about ten seconds. Every time someone opens
the page it reads the same rows again.

The answer is almost the same as it was a minute ago. PostgreSQL has no way
to know that.

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

I wanted to test the idea without changing the database first.

The first design of Straum hit the same wall. I tried to make plain SQL
faster by handing the aggregate query to a side process. That needed an
extension managed providers do not allow, a proxy in front of all traffic,
or my own parser for PostgreSQL's SQL. I dropped SQL.

Many managed PostgreSQL services give you a replication stream. With the
right role and a publication, Straum can follow every insert, update and
delete in commit order. It reads the tables once, keeps each group in memory
and applies each commit from the stream. The page asks Straum over HTTP.

You write the aggregates as a small view, in a subset of `CREATE VIEW`.
Every answer carries a timestamp that says how current it is. On the taxi
data, a count or sum comes back in under a millisecond and the median in
about 25. There is no refresh. The aggregates are not stored in PostgreSQL.

It still needs a few database changes. A role that can read, a publication
and `REPLICA IDENTITY FULL` on each table. The last setting makes updates
and deletes log the old row. Those two write more WAL. Inserts do not. On
PostgreSQL 17 and 18, `wal_level = logical` also needs a restart if the
server is not already set to it. On a server you run yourself, a second mode
reads the WAL as it is, with no setting changed.

You do not need those changes to try it. One command copies the columns the
view reads into a throwaway PostgreSQL in Docker, using a role that can only
`SELECT`. Compare Straum's answers with your own SQL on the copy, then
delete the containers.

If Straum breaks, database writes do not notice. No trigger runs in the write
path, so writes never wait for it. Its replication slot is temporary, so a
crash or deleted container makes PostgreSQL drop the slot. If it falls
behind, it stops once the WAL kept for it passes a limit you set, 4 GiB by
default. A change it cannot apply makes it exit, and whatever runs it starts
it again. It writes nothing to disk. Remove it by dropping the publication
and setting each table's replica identity back.

The dashboard query becomes an HTTP call.

Everything is in memory and every start loads the tables again, so begin
with few keys. The spec, asks and flags may still change. Straum only
answers what the view declares. If you need to join the summary to other
tables in SQL, pg_ivm or a continuous aggregate fits better.

One command loads a month of taxi trips and leaves you in a shell. It needs
Docker.

```bash
docker compose -f <(curl -fsSL https://raw.githubusercontent.com/janbjorge/straum/main/docs/compose/quick-start.yaml) \
  run --rm shell
```

Code and guide:
[github.com/janbjorge/straum](https://github.com/janbjorge/straum).
Which `GROUP BY` keeps showing up in your slow log?
