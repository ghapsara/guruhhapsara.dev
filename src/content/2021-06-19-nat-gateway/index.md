---
kind: post
published: true
title: NAT Gateway, Fabricating a Networking Entanglement
date: 2021-06-19T22:24:00.00Z
path: /nat-gateway
tags:
  - kubernetes
  - network
description: This is not a physics article. The author just finds it fun to incorporate irrelevant subjects in the writing. The author also admits that he might be messing up with some words and metaphors in this post.
---

A year ago, we had an egregious infrastructure incident which shut down our entire business for almost 10 hours. There might be 567 microservices hosted on a kubernetes cluster were collapsed in the realm of a [naked singularity](https://en.wikipedia.org/wiki/Naked_singularity). Our production kubernetes cluster got destroyed during an upgrade.

It was like a high loaded alien ship illuminated with neon lights floating in a dark space went black out abruptly. Something hit the power source. It was the most appalling infrastructure incident I've ever seen in my whole entire career.

But the thing didn't stop there, the rippling effect of the sunk production cluster continued aggravating the pseudo soul of company core business. Our production cluster was recreated very quickly but nothing was there. A region space and time were born but no formation of stars were constellated. We needed to bring the microservices back to the cluster with our hands.

You might ask, why did you do that? You could just restore your previous etcd data. All workloads could be brought back to operations very quickly. GKE didn't provide etcd backups at that time so we needed to perform etcd backups by our selves but unfortunately this wasn't in our daily operational duty so we needed to create microservice deployment resources using our deployment pipeline.

The way we shipped our colossal microservices deployments heavily relied on gitlab pipelines. A notable number of deployment was expected to surge. Gitlab would sequence tons of jobs that'd be executed by our gitlab runner.

A few moments later, microservices maintainers started running their pipeline deployment. A crazy amount of jobs lined up like those people camped outside apple stores waiting for a new iphone release.

We had 6 runners hosted on 6 virtual machines with docker at that time. If we wanted to add more runner machines we had to execute manual gitlab runner installs with our ansible playbook.

The number of concurrent jobs immensely slapped our virtual machines so bad. Our runners hit their concurrent limits which made them took quite a while to process new jobs.

We decided to manually buffer the mircoservice deployments using slack channels 😂. We ranked order which microservices that should go first on a waiting list and coordinated maintainers accordingly to deploy their services.

This brought us an attention that our gitlab runner infrastructure didn't scale very well. This was one of underlying reasons we took a path to migrate our runners to kubernetes.

## Unraveling Circumstances

You might say, your runners are containers, they could be easily deployed to kubernetes. Not so soon, the maniac is not the workload, but it is the infrastructure foundation.

We purposefully locate our gitlab instance in a dedicated environment away from any other workloads such as microservices, databases, and even gitlab runner itself. We prevent any workloads from being able to establish connectivity through private and public networks.

We restrict our gitlab GCLB backends to deny any ip sources and only allow our runners public addresses which were virtual machines ip to connect to our gitlab instance.

Virtual machines can be treated this way, it's fairly easy. When it comes to kubernetes, convoluted spooky stuffs begin to denounce like a bad villain from a movie.

Pods don't have public ip addresses. When pods are attempting to access public internet, internet needs to discover their public ip address though they're not publicly exposed. This is similar to how your laptop gets connected to the public internet. If you're accessing [google.com](http://google.com), google.com needs to know your public address though your computer is private.

So how does internet recognize your public ip address if you're not exposing your computer? The internet will recognize your isp's router representing your private computer. You're joining a network when you're connected to the internet, and the last gate before your packets leave your network and get transmitted to the internet is your isp router.

Same with pods, your pods only have private ip addresses and they're only known within your private network. When your pods make a request to google.com, your pods packets will be going through your private network router. In GCP, this is handled by a cloud router located in your VPC.

When we're talking about VPC, we're talking an enormous wide space which holds a weird amount of infrastructure services. This means any egress public internet connection that doesn't have public ip addresses will be NAT-ed with advertised public ip addresses of your VPC cloud router.

In our case, this means that even if we have a dedicated kubernetes cluster running gitlab runner instances in a VPC, we're sharing public ip addresses with private virtual machines, databases, DNS severs, salacious ethereum miners (kidding), and other kubernetes clusters as well.

This infringes our networking policy. We don't want anything other than our gitlab runner establishes connections to our gitlab instance. The networking policy which brings valuable security restrictions imposes a networking hurdle to our gitlab runner too.

Why don't you have a dedicated cloud router? Networking is a complex beast that you should deal from the beginning. Delicate subnet allocations should be settled down very carefully if you want to have multiple routers. And having a dedicated cloud router for gitlab runner was never on our menu.

How about VPC peering? VPC peering, is like going live with your friends on tiktok. If both of your followers and your friends followers are watching the live stream, they'll be merged onto a watcher list. If your followers turn out to be your friend followers and they're watching your live video, you won't see duplicated names. That is what VPC peering does to a couple networks. You're not allowed to advertise overlap ip addresses, all ip should be unique. Again, this is the same problem with our previous case.

So what do you do?

## Moving Tactically

Here is a contrived example of urban planing that might help us to decipher a little bit of complexity of infrastructure network design. If we're running out areas to have streets which connect one place and another, this means we should start considering a more sophisticated solution without tearing down existing buildings.

Imagine your conventional streets are abstracted in a 2D space, if you keep advancing to connect all places within a 2D space, you'll be maxed out by the amount of path you can have because you can only go either to left or right. This the time when you need to go beyond the 2D space.

How would you do that? you can go to ground via subways or move to a higher space through highways. This won't ravage your 2D streets and you'll also have other transportation solutions. The city continues shinning elegantly.

This is what we want to achieve in our agenda which is how do we have a kubernetes cluster in the same VPC with other workloads which satisfies our networking policy without changing the present infrastructure network.

What's the highway?

## NAT Gateway

The goal is having a public address which specifically represents gitlab runner pods on kubernetes clusters. A way to achieve that is to have a kind of agent which proxy egress internet requests and mask them with a public ip address. We can delegate a virtual machine acted as the agent.

Before we create a vm, we need to reserve a public ip. We also need a private ip address because our route needs to know where the the vm is in the VPC network. Here's how to reserve a private and public ip address using gcp compute address terraform module.

```bash
resource "google_compute_address" "external" {
  name         = "nat-gateway-internal-address"
  address_type = "EXTERNAL"
	...
}

resource "google_compute_address" "internal_with_subnet_and_address" {
  name         = "nat-gateway-external-address"
  subnetwork   = "an-existing-subnet"
  address_type = "INTERNAL"
  address      = "a-private-ip-address"
	...
}
```

Obtain the created address using gcloud.

```bash
gcloud compute addresses list
```

Create a vm with the reserved addresses.

```bash
resource "google_compute_instance" "vm-nat-gateway" {
  name = "vm-nat-gateway"
	network_interface.0.network_ip = "nat-gateway-internal-address"
	network_interface.0.access_config.0.nat_ip = "nat-gateway-external-address"
	can_ip_forward = true
	...
}
```

Setting `can_ip_forward` to `true` is essential. This will let the vm to accept incoming packets from gitlab runner pods and forward them to the internet.

Configure a network tag for gitlab runner cluster nodes to mark which nodes we want to route to the vm NAT gateway.

```bash
resource "google_container_cluster" "gke-gitlab-runner" {
  ...
  node_config {
		...
    tags = ["gitlab-runner"]
  }
}
```

And route the nodes which host gitlab runner pods. This is necessary because the vm is not going to be able to magically capture pods egress traffics and forward them to the public internet by itself. You need to statically route those pods to get to this vm.

```bash
resource "google_compute_route" "routes-gke-gitlab-runner-to-nat-gateway" {
  name        = "routes-gke-gitlab-runner-to-nat-gateway"
  dest_range  = "the-gitlab-instance-public-ip-address-range"
  network     = "vpc-network"
  next_hop_ip = "the-vm-nat-gateway-private-ip-address"
  priority    = 900
  tags        = ["gitlab-runner"]
}
```

This is not working yet. We need to do the final touch on our vm nat gateway which is masquerading the incoming gitlab runner cluster pods ip address with the vm ip public address.

```bash
iptables -t nat -A POSTROUTING -o $(/sbin/ifconfig | head -1 | awk -F: {'print $1'}) -j MASQUERADE
```

Now all pods egress traffics that are going to our gitlab instance are masked with the virtual machine NAT gateway public ip address. This means that we can whitelist the vm public ip address in our gitlab load balancer backend service.

## Reflection

Now this architecture has been serving in production for a year. What’s next? This setup costs resource overheads. There's no good reason to perpetuate this workaround. Cloud routers should be in charge of NAT-ing pods ip addresses.

But should you go that way? Get a really good assessment of the thing you want to do because bringing a contentious change to foundational elements like networks suggests ramifications to numbers of components which often comes with a great cost. If you want achieve the same thing in a brand new environment, it's better to avoid this vm NAT gateway setup.

It took me a year to know everything I did on this project. Huge credits to folks who helped me where ever you are out there.
