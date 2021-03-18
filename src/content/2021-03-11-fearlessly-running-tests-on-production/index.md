---
kind: post
published: true
title: Fearlessly Running Tests on Production
date: 2021-03-11T21:33:58.00Z
path: /fearlessly-running-tests-on-production
tags:
  - kubernetes
  - autoscale
  - node-pools
  - gitlab-runner
description: >-
  I know this might sound like a barbarian insinuation to divine artisanal engineering best practices that have been laid out over the last 4 decades. But if there was a case you need to do that, I thought it would be interesting if I could share my experience in running tests on a kubernetes production cluster without disrupting any production workloads.
# background: "#9aa3c2"
# color: "white"
cover: "./don-jackson-wyatt-b9cU8k3VZNM-unsplash.jpg"
coverUrl: "https://unsplash.com/photos/b9cU8k3VZNM"
coverAuthor: "the_don_photography"
---

Kubernetes is like a fighter jet operating system but for microservices. I'm not a pilot and I've never in my life flown a jet. Think about it, there are many things needed to operate when it comes to fly a fuckin jet. You need to have a radio to coordinate with other pilots, you'll have a control panel that gives the ability to control your speed, movements and directions, launch missiles, monitor attitudes, air pressures, and jet health condition, and trigger a safe protocol to detach yourself from the cockpit, and many things more, i don't know what they are.

Running services on kubernetes is the same. There are hundreds of components needed to be managed that are inside kubernetes environment. Let's say you have 543 microservices with 2750 pods with 1 service container and 3 side car containers for each pods and 3 cronjobs along side with 5 configmaps, 4 secrets, all these numbers are random, but this is likely what you'll see when you're managing medium to big scale workloads. And we're even not talking about managing clusters, nodes, networks, load balancers, storages, and all other things.

Of course I'm greatly oversimplifying it, but I did that to make a point. The complexity of kubernetes manifests itself when you see there are so many technologies out there providing solutions in taking care of kubernetes complicated stuffs such as service meshes, secrets rotations, cluster backups, and all other things.

This time I'm going to talk about one of essential parts of kubernetes ecosystem which is node pools. My team is maintaining gitlab runner workloads on 3 different clusters. We had a case. We noticed that some of our node pools won't scale down to the minimum node counts we set. Although we knew achieving this condition was very likely impossible, there were pods that never go offline. If this type of pod are disseminated separately to all nodes, nodes would never scale down to their minimum node count.

But the thing got really weird when we found that the amount of node was always at the maximum node counts though the number of workloads were insignificant. These node pools won't scale down despite low cpu utilizations. This pattern was also pretty consistent during weekends across all clusters.

My colleague, a super genius fantastic guy rigorously scoured a tremendous amount of kubernetes logs. He found that there was a suspicious log showing that these nodes couldn't be scaled down due to pods have a local storage. It didn't take him a very long to come up with a hypothesis that revealed the bad actor behind this outrageous stalled kubenertes node autoscaling. He pointed out that all of our runners mounted a volume from node hosts. This was the deployment configuration.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gitlab-runner
  ...
spec:
  ...
    spec:
      ...
      containers:
      - args:
        ...
        volumeMounts:
        - mountPath: /etc/ssl/certs
          name: cacerts
          readOnly: true
				...
      volumes:
      - hostPath:
          path: /etc/ssl/certs
        name: cacerts
			...
	...
```

My colleague immediately proposed to remove the `hostPath` volume mount. But we didn't know why this configuration was there, we didn't know what's gonna happen if we removed the volume. My job was to make sure that removing this configuration won't produce any unexpected behaviors.

So now we know that our enemy is under the radar, we know how it moves, we are aware of which sides that look vulnerable. Though our confidence rises at a very high level, we still need to make sure that our weapon is the one that will strike the enemy down. The problem is how are you going to do it while you're in the middle of the war.

This was the kind of condition we had. We didn't have a test environment for our gitlab runner. Yes we had 3 kubernetes clusters, but all of them served all services pipeline packaging and shipping operations like automated tests, security checks, application builds, bundling assets, and deployments. If one of clusters ran into an issue, these services operations would be impeded.

So how did we test our change?

## Test it in production

Why do you test changes on a production cluster? Spawning a test environment for one type of workload in our case is gitlab runner is considered to be expensive. The value offered by this test environment in our case is a little less critical.

We didn't blatantly ran our test in production. The cool thing about kubernetes is that everything is sandboxed and scoped.

When you look at the kubernetes hierarchy, you'll see that kubernetes purposefully segregate objects capabilities to their own territories. You change the cpu requests of a particular deployment, kubernetes won't modify other deployments cpu requests. When you adjust verbs of a serviceaccount it will apply to all workloads that use that serviceaccount. You delete a namespace you delete all workloads within that namespace.

In my opinion, testing on production is a sign of a susceptible architecture. What are the criteria of good architecture? what do good designs look like? how do you define good architectures? I don't know. But I know a legitimate example of a military grade architecture.

It's kubernetes. kubernetes lets you to destroy objects and reestablished them again consistently without changing anything. The consistency of services, codes, or infrastructures manifest itself when you bare this notion in mind.

Ok, let's talk about the actually work.

The way we tested our change was picking up a safe contained spot within a particular cluster. We ran our test on a node that was dedicated only for our test workloads. We then deployed the unmounted node volume deployment change and ran numbers of pods to trigger node pool autoscaling.

This is the benefit of the sandboxed principle that I'm talking about. kubernetes gives us a capability to isolate our test on a dedicated node to avoid exposing undesired side effects to a place where they don't belong.

Kubernetes provides a safe way to mark nodes as "unavailable". I have to put it in double quotes because what i mean by unavailable is setting up certain nodes to not pick up production workloads.

Commonly, we could mark nodes as unschedulable with `kubectl drain` or `kubectl cordon`. In our case, we didn't want to our dedicated node to be unschedulable. We wanted our node to behave like a healthy node that is available to schedule workloads but only for our test workloads.

We can achieve this with `taints` and `tolerations`. If `node affinity` invites pods to certain nodes by node selector labels, `taints` acts the opposite. Taints won't let any pods to be scheduled to particular nodes unless pods define their `tolerations`. Setting up `taints` prevents our production pods get executed on our test node.

This is the way to set up `taints` for an existing node

```bash
kubectl taint nodes pool-2 dedicated=experimental:NoSchedule
```

In our case we used gke, we provisioned a node pool with node taints using a gcloud command.

```bash
gcloud container node-pools create pool-2 \
  --cluster cluster-name \
  --node-taints dedicated=experimental:NoSchedule
```

And then this is how to define `tolertations` for pods

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gitlab-runner
  ...
spec:
  tolerations:
    - key: "dedicated"
      operator: "Equal"
      value: "experimental"
      effect: "NoSchedule"
```

Right after taints node was ready, we deployed the unmounted node volume deployment which was the gitlab runner jobs manager pod and tested the node pool autoscaling. We made sure that the gitlab runner jobs manager pod was able to distribute ci jobs pods to the tainted node without leaving any error vestiges.

## Conclusion

Should we test on production? No.

Why? Just don't.

Sounds like we're at the end of our discussion? Yes.

Thanks for reading everybody.
