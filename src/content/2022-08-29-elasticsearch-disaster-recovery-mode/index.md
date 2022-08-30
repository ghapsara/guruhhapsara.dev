---
kind: blog
published: true
title: "Elasticsearch Disaster Recovery Mode"
date: 2022-08-29T02:41:54.00Z
path: /elasticsearch-disaster-recovery-mode
tags:
  - elasticsearch
description: I bring you an experience of wiping out years of elasticsearch cluster data and how a restore was possible in play with elasticsearch builtin tools. You would admire how well designed and built this software is by what it brings to counteract failures.
---

This time I broke an elasticsearch cluster that was actively used for developments.

I carelessly stepped my feet into an automation that I didn’t fully understand. The operation I needed to perform was rather to enable the elasticsearch snapshot and restore feature.

I would’ve only run a series of commands which only was a couple curl requests, the snapshot restore would be then available in the settings persisted in the cluster right away, then my job would be done.

Impulsively I was drawn by a desire to wrestle with chore works. I attempted to update the automation script in the mean of helping future colleagues to easily toggle the snapshot restore feature and I also patched some parts of the module to fix other issues.

I began to write the implementation. I created and destroyed test clusters for dozen times. I performed any test scenarios I could think of to know where and how my changes would lead to.

The time during tests, I knew that there was one part in the script which dispatched a discovery process compounding nodes forming them into a cluster like what distributed applications commonly did. The automation was resilient, my test clusters were able to resolve in a green state regardless what I did.

My confidence raised above the sun. I did not need to read each command in the script making sense of how every instruction would configure the cluster. It would get me to finish quick and I could move to work on other stuffs.

## Blow it up

3 o’clock in the morning, I rolled out the update. I began to restart master nodes to update their instance templates. The cluster turned into a red state, they refused to join with their data nodes.

Intending to fix this issue, I ran the cluster bootstrap script. I believed that this was a legit solution to bring back master nodes discovering their data nodes. I thought it was like the kubeadm join that I would need to run to trigger a node discovery.

Cautiously tailing the boostrap cluster script logs, I saw no dubious message shown and master nodes were coming to a green state.

The cluster became healthy, so I continued to roll out updates to data nodes. They eventually came to join the master nodes. So I began to make a cup of tea preparing my self for a good sleep.

I went to hit the indices endpoint making sure that shards got distributed to data nodes, replications ran with no issues, the cluster would go on functioning normally.

Caught by surprise, I got an empty array. Indices were nullified. The cluster got reconstructed with zero indices and no data.

I went to my engineering support channel. I called it out loud, I broke the cluster, all data went missing, and looked for ways of recovery if possible.

The whole thing flipped. My ops turned into a disaster.

## Descent

The cluster state was reset. The cluster join script I expected to bind rebooted nodes cleared out the cluster state, and formed them into a new cluster.

The cluster was in operation, it was able to create new indices but old indices couldn’t be discovered.

Given a short recovery time objective, finding a way to time travel to the cluster previous state was seemingly inconceivable. A feasible way to bring back the cluster data was to repopulate from datasources.

The day wasn’t on me, I went to ask engineers about it, their repopulate script was broken as well.

Years of inventory data staggeringly snapped wiped out during a few minutes of my ops. Developers and test engineers had to recreate items to continue their development.

I get a sense of how tasteful stateful workloads are in a disastrous way.

## A bow and arrow

I delved in the instance mounted disks hunting where the cluster stored data. I ran a directory size command, I didn’t see as if they were demolished with a new cluster state. I got to one of the data directories, I found many folders created many years ago.

That immediately brought an optimism to my face. There must be a way to bring them back. I just needed to figure out how reconcile these old data with the new cluster state.

A few days back before I broke the cluster, I remembered I took disk snapshots of the data node volumes. This was when the cluster state wasn’t supposed to be corrupted and old indices data were present.

The next resort we had to save the cluster was our EC2 volume snapshots.

## Resurrection in action

We kicked start a test cluster with volumes created from the snapshots we took from our data nodes a few days back before. We began to bootstrap a cluster from one of data nodes.

The cool thing about elasticsearch is that a node can have multiple roles so we can have a node that act as data and master nodes all together. This allowed us to have an instant look to verify whether we could rescue our data.

We updated the `elasticsearch.yml` configuration to extend the node as a master.

```yaml
node.master: true
node.data: true
```

```bash
./bin/elasticsearch-node unsafe-bootstrap
```

We relaunched the elasticsearch service, a new cluster id was created forming a new cluster making the node as a single cluster although the cluster health resulted nonetheless in red, but this was a big move.

```bash
curl http://localhost:9200/_cluster/health?pretty
{
  "cluster_name" : "es-c-test-00",
  "status" : "red",
  "timed_out" : false,
  "number_of_nodes" : 1,
  "number_of_data_nodes" : 1,
  "active_primary_shards" : 509,
  "active_shards" : 509,
  "relocating_shards" : 0,
  "initializing_shards" : 0,
  "unassigned_shards" : 504,
  "delayed_unassigned_shards" : 0,
  "number_of_pending_tasks" : 0,
  "number_of_in_flight_fetch" : 0,
  "task_max_waiting_in_queue_millis" : 0,
  "active_shards_percent_as_number" : 50.24679170779862
}
```

Just by looking at the `active_shards` field, we knew that there was more likely we were arriving closer to restore our cluster.

```bash
curl http://localhost:9200/_cat/shards?v
index                       shard prirep state        docs   store ip         node
sorted_data_2021-06       2     p      STARTED     10249  27.8mb 10.0.20.79 ip-10-0-20-79
sorted_data_2021-06       1     p      UNASSIGNED
sorted_data_2021-06       0     p      STARTED     10432  28.4mb 10.0.20.79 ip-10-0-20-79
sorted_new_data_2019-08   2     p      STARTED       539   1.6mb 10.0.20.79 ip-10-0-20-79
sorted_new_data_2019-08   1     p      UNASSIGNED
sorted_new_data_2019-08   0     p      STARTED       473   1.6mb 10.0.20.79 ip-10-0-20-79
data_2018-04              1     p      STARTED      2007   1.4mb 10.0.20.79 ip-10-0-20-79
data_2018-04              1     r      UNASSIGNED
data_2018-04              3     p      STARTED      1397   1.2mb 10.0.20.79 ip-10-0-20-79
data_2018-04              3     r      UNASSIGNED
data_2018-04              4     p      STARTED      1740   1.3mb 10.0.20.79 ip-10-0-20-79
data_2018-04              4     r      UNASSIGNED
data_2018-04              2     p      STARTED      1921   1.3mb 10.0.20.79 ip-10-0-20-79
data_2018-04              2     r      UNASSIGNED
data_2018-04              0     p      STARTED      1462   1.2mb 10.0.20.79 ip-10-0-20-79
.....
```

We moved to bring back nodes including data and master, we joined these nodes to the newly boostraped cluster node.

```yaml
cluster.initial_master_nodes:
  - 10.0.20.79
```

Prior to cluster join, we needed to detach all these nodes from their previous master that were bound to the previous cluster state so that they could join to the new cluster.

```bash
./bin/elasticsearch-node detach-cluster
```

When the other data nodes started to join, we saw the number of unassigned shards decreasing.

```bash
curl http://localhost:9200/_cat/shards?v
index                       shard prirep state     docs   store ip          node
sorted_new_data_2018-11   2     p      STARTED    612   2.5mb 10.0.20.173 ip-10-0-20-173
sorted_new_data_2018-11   1     p      STARTED    559   2.4mb 10.0.20.79  ip-10-0-20-79
sorted_new_data_2018-11   0     p      STARTED    558   2.3mb 10.0.20.173 ip-10-0-20-173
sorted_new_data_2019-01   2     p      STARTED    496   1.8mb 10.0.20.173 ip-10-0-20-173
sorted_new_data_2019-01   1     p      STARTED    501     2mb 10.0.20.79  ip-10-0-20-79
sorted_new_data_2019-01   0     p      STARTED    477   1.9mb 10.0.20.173 ip-10-0-20-173
sorted_new_data_2020-07   2     p      STARTED   1584   4.2mb 10.0.20.173 ip-10-0-20-173
sorted_new_data_2020-07   1     p      STARTED   1572   4.4mb 10.0.20.79  ip-10-0-20-79
sorted_new_data_2020-07   0     p      STARTED   1651   4.4mb 10.0.20.173 ip-10-0-20-173
....
```

It didn’t take a long time for the cluster to establish the green state making it running in operation. Data became viable.

```bash
curl http://localhost:9200/_cluster/health?pretty
{
  "cluster_name" : "es-c-test-00",
  "status" : "green",
  "timed_out" : false,
  "number_of_nodes" : 4,
  "number_of_data_nodes" : 2,
  "active_primary_shards" : 751,
  "active_shards" : 1019,
  "relocating_shards" : 0,
  "initializing_shards" : 0,
  "unassigned_shards" : 0,
  "delayed_unassigned_shards" : 0,
  "number_of_pending_tasks" : 0,
  "number_of_in_flight_fetch" : 0,
  "task_max_waiting_in_queue_millis" : 0,
  "active_shards_percent_as_number" : 100.0
}
```

That’s our story. We may actually be able to perform the unsafe bootstrap straight from broken nodes which hold a replaced cluster state since the combination of elasticsearch-node unsafe-boostrap and detach-cluster actually removes their binding to their previous cluster. We may not need to bootstrap a cluster from a non corrupted state.
