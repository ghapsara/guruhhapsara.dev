---
kind: blog
published: true
title: "May The Pod Affinity Be With You"
date: 2022-05-04T19:03:15.00Z
path: /may-the-pod-affinity-be-with-you
tags:
  - kubernetes
  - storage
  - persistent-volume
  - EBS
  - AWS
description: If there’s any resistance to adopt kubernetes, that'd be a reluctance to use persistent volume. I’m myself concerned with this as well. When it comes to deal with storages in kubernetes, I find it saner to just delegate the problem to high abstractions like operators and charts. This absence of hands-on experience leaves me a call to unearth the fabric.
cover: "./david-werbrouck-RfXv1snaYEI-unsplash.jpg"
coverUrl: "https://unsplash.com/photos/RfXv1snaYEI"
coverAuthor: "bigkids"
---

This time I’m going to talk about a workaround of combating a palpable persistent volume issue. In this post, I’m examining persistent volume provisioning configured with the GP2 storage class in EKS with Elastic Block Storage as volume instances. Other storages are highly probable to have different behaviors, the written solution may not be applicable.

I’ll kick start our space exploration by confessing my false acquaintance of persistent volumes.

I believed that the GP2 storage class cared about node volume availability zones. I thought it would always provision EBS volumes spreading across availability zones. This is completely wrong.

The thing we need to underline about persistent volume right off the bat is that once persistent volumes are created through persistent volume claim template specs defined in deployments, statefulsets, or any other abstractions, they won’t be removed if delete these objects. We’ll need to deliberately delete the created persistent volume claims to remove those persistent volumes.

We need to pay attention to how storage class triggered at the first time. This will tell us where volumes are deployed in which availability zones.

The reason we need to care about this because it defines where pods will always be scheduled. The persistent volume claim attached to a pod coerces kube-scheduler to schedule the pod to a node that satisfies the persistent volume node affinity requirement.

When we create a persistent volume claim, the storage class will create a persistent volume with a node affinity. It’ll then provision an Elastic Block Storage instance, and then a pod that claims the persistent volume will be able to mount the EBS storage.

Here’s an example of a provisioned persistent volume node affinity.

```yaml
apiVersion: v1
kind: PersistentVolume
spec:
  nodeAffinity:
    required:
      nodeSelectorTerms:
        - matchExpressions:
            - key: topology.kubernetes.io/zone
              operator: In
              values:
                - ap-southeast-1c
            - key: topology.kubernetes.io/region
              operator: In
              values:
                - ap-southeast-1
  persistentVolumeReclaimPolicy: Delete
  storageClassName: gp2
  volumeMode: Filesystem
   accessModes:
    - ReadWriteOnce
  capacity:
    storage: 10Gi
  claimRef:
  ...
status:
  phase: Bound
...
```

In an extremely rare condition, if there are 7 pods claiming persistent volumes deployed with node affinity spec like above, kubernetes will schedule these pods to nodes in `ap-southeast-1c` no matter what.

Don’t forget that an EC2 instance can be attached with multiple storages. If there’s one condition where there’s only one node, the GP2 provisioner will provision multiple Elastic Block Storage instances and attach them to this one node. The pods will be scheduled to this node and mount their own volumes only.

In addition to persistent volume specification, the cluster autoscaler, this very thing has the ability to regulate how nodes will optimally be teared down and drawn upon in given zones. This capability may overlap persistent volume node affinity.

Let’s say there’s a pod with a persistent volume, and you have a kind good night policy to tear down nodes because you want to save money. When you reinstantiate back those nodes, there’s a chance seeing pods scheduling inhabits this classic volume node affinity conflict error like below.

```
Type     Reason             Age                From                Message
----     ------             ----               ----                -------
Warning  FailedScheduling   58s                default-scheduler   0/2 nodes are available: 2 node(s) had volume node affinity conflict.
```

Given this such complex circumstance, how do we emulate this seemingly cursing state of affair.

## Pulling through the constellation

If there’s any idea I can withdraw, it is to think about how to effectively instrument persistent volume node affinity. What we can do is to surreptitiously influence the persistent volume node affinity through pod affinity rule. We need to have this right in the beginning of workload deployments.

How can this superficial idiomatic solution make a freaking sense?

Pod persistent volume claim is defined along the way in pod specification. Persistent volume node affinity specs are generated according to where pods are scheduled at their first deployment. This is what makes kubernetes persistently schedule pods to the first time given nodes.

Habitually, this will never change. Unless, we delete the generated persistent volume claim objects and reschedule pods.

Following the condition of that pods will always be scheduled to nodes complying persistent volume node requirement, if we specify a pod affinity rule, we enforce kubernetes to schedule pods to determined nodes from the beginning. Pod schedulling will adhere the rule under any conditions which subsequently avoids node volume affinity issue

To raise this to even a higher bar, we would want to aim for avoiding a single point of failure. The idea is instead of having multiple pods in a single node, we can spread out pods in multiple nodes in different availability zones. With this aim, we will also need to leverage pod affinity to distribute pods.

However we can’t achieve this by just merely utilizing pod affinity. We will let the chance of unschedulable pods again open since cluster autoscaler consider pod affinity as a corner case that it will ignore. Here’s a quote from the cluster autoscaler documentation.

> CA doesn’t add nodes to the cluster if it wouldn’t make a pod schedulable. … it doesn’t scale up the cluster may be that … too specific requests (like node selector), and wouldn’t fit on any of the available node types. ~ cluster autoscaler faq

To deal with this prevailing climate, we can prepare instead, we setup nodes, we tell the autoscaling group to have EC2 machines in all zones. We prevent the autoscaler to further scale down by specifying the minimum node count in the amount of all available zones.

Once this is set in place, we can deploy our pods with this pod affinity rule.

```yaml
apiVersion: apps/v1
kind: StatefulSet
spec:
  template:
    spec:
      affinity:
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            - labelSelector:
                matchLabels:
                  app.kubernetes.io/instance: vault
                  app.kubernetes.io/name: vault
                  component: server
              topologyKey: failure-domain.beta.kubernetes.io/zone
  updateStrategy:
    type: OnDelete
  volumeClaimTemplates:
    - apiVersion: v1
      kind: PersistentVolumeClaim
      metadata:
        name: data
      spec:
        accessModes:
          - ReadWriteOnce
        resources:
          requests:
            storage: 10Gi
        volumeMode: Filesystem
```

Tearing down nodes and rescheduling pods won’t stop kubernetes to find them a place.

You know that this pod affinity rule will hit another issue. Kubernetes will prevent us to schedule pods with more than 3 replicas since we only have 3 different availability zones. Our next home work is to find out the right spec tuning by extending [kubernetes soft scheduling](https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/#an-example-of-a-pod-that-uses-pod-affinity) to make it elastically accept this condition.

That’ll become another night sky we need to wonder.
