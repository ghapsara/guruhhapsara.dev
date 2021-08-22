---
kind: blog
published: true
title: Grokking Ansible and Terraform
date: 2021-08-22T22:28:41.00Z
path: /grokking-ansible-and-terraform
tags:
  - ansible
  - terraform
  - automation
description: This time I'm going to talk about ansible and terraform. I might be getting into a trouble by talking about these two. This writing is not a comparison. This writing is about my hunter gatherer observation in how ansible and terraform operate in the ever changing expanding infrastructure terrain.
background: "#d6ff9e24"
---

Before we start, I'd like to give a shout out to [TGIK](https://www.youtube.com/playlist?list=PL7bmigfV0EqQzxcNpmcdTJ9eFRPBe-iZa), it's a youtube stream talking about kubernetes and the whole universe within it. I want to pull up the word grokking that constructs the title of this writing is inspired by a series in TGIK. It's a mind blowing series, It helps me to learn many cool things and refine my understanding about a lot of things.

Ok, Let's begin from the exospheric kind of layer which tells us the ansible and terraform embodiment.

Terraform focuses on declarative results and ansible places emphasis on imperative steps. If we look these two focal points, terraform and ansible have their own unique characteristics and they partially share the same aim though they express solutions in different ways.

These main two diverging dispositions are what seemingly lead terraform and ansible to concentrate on different areas of what problems they optimally solve.

In my opinion, solving fibbonaci sequence imperatively is less painful than doing it declaratively and rendering list of items in react with declarative maps is brutally easier than using imperative loops. Though they can be done in both ways, I personally can't see the benefit of modulating one color palette to fit in all design narratives.

So what constitute the narrative? how do we know which language should partake in the conversation? Which tool is suitable to particular problems? To answer these questions we should know how ansible and terraform operate at the technical level.

Ansible has been around in the automation world for a long time. Ansible utilizes ssh protocol to execute a series of tasks to target hosts locally or remotely. A series of tasks is a collection of scripts which performs mutations such as configurations, provisioning, and many things. The ability to pass and run scripts certainly unlocks a wide range of possibilities.

Meanwhile, terraform makes use of states to assemble infrastructure building blocks. Here is the benefit of employing states, once there's a media that stores chronological events, we can move backwards and simulate a future. The cool thing we can do in terraform is we can ostensibly time travel and look at the impact of proposed changes.

Let's jump into a concrete example, let's say we want to assemble a linux virtual machine associated with a networking policy in azure. First off, we have to setup the networking parts like virtual network, subnet, network security group, and application security group. Then we can start working on virtual machine parts. First we need to create a network interface (nic) of the virtual network and attach the application security group to the nic. Once the nic and asg are bound, we can create the vm using the nic.

Both ansible and terraform will require you to define all of these resources. The most noticeable difference is shown when we want remove resources. In terraform, we don't need to make a terraform module to remove resources, but in ansible we'll have to create a task to delete resources.

The most challenging part of working with ansible playbooks is we need to make sure that our playbooks are idempotent. They're required to behave the same way no matter how many times they're run. We need to make sure that scripts are in the right order. We have to put some efforts to programmatically craft variables and tasks to achieve consistent results.

Idempotent anisble playbooks are commonly compounded by amalgamating resources states. Playbooks should know the current shape of resources which can be achieved by reading outputs from infrastrucure provider clis data and parsing them to a meaningful information. This is tricky because we are expecting that outputs will look the same all the time.

When I'm working with data I tend to spend a shit load of time just to make sure that numbers are in a consistent format, each keys represents the right identity, rows and columns are in the right shape. The wrangling chore often takes 80% of the full work.

This is not an attempt to sunshine terraform despite the fact that the state parsing problem is solved by terraform elegantly. Terraform abstracts states away from our hands. We can safely access and take resources information.

Terraform wires up infrastructure resource definitions and intelligently figures out how to build them. We outsource the complexity of programatic provisioning to terraform. We're free from the obligation of telling what to do and we're alluding to telling what should our infrastructure look like instead. This is big.

To make it a fair, I want to point out a little bit of my noisy opposition to terraform provisioner. Terraform does provide a way to run scripts against machines as well. We can run shell / bash scripts in target hosts with terraform. However, writing long complicated automations in pure scripts such as database installs, configuring zookeper, etc is daunting.

Ansible playbooks abstracts scripts in yaml and provides plenty of utilities around templating which dilutes the stiffness of bash scripts. A side of that, there are many open source reusable ansible roles available that we can employ.

Remote tasks execution is cool. Imagine there's a need to install a database to 20 virtual machines, I don't need to forthrightly scp and ssh to these machines one by one to run my script, ansible will do it for me.

Nevertheless, this practice is actually deceiving at some points. Remote exec reaches a tipping point when it has to deal with a need to scale out machines. When we add another virtual machine, we have to run our provisioning script again. The investment of provisioning is diminshed here.

Virtual machines custom images come to rescue. This is one of prerequisites to make virtual machines to be scaleable. Instead of running automation against running machines, we can build a custom image packed with dependencies and make virtual machines loaded with dependencies since their first boots.

This is quite the same principle we see in containers which dependencies are built inside containers, later on we only have to tell containers how to boot up from the underlying host. Container dependencies are not mutated in live production, but changes are declaratively mapped in image builds.

That makes me realize how fascinating containers are. At first, my thought on containers was only about isolations, but the ecosystem around containers like image builds in this particular case consequently promotes the idea of immutable infrastructure which aims for achieving consistencies across living resources.

Another problem with remote provisioning which is worth to mention is that we are offloading scripts to target hosts and listening to the state of script execution through a network. This in turn yields to a network reliance. Ansible provides a way of executing tasks asynchronously. This sounds treacherous in some ways. The nature of asynchronous is letting process to run on separate thread. Asynchronous tasks should be for scripts that do not constitute the shade of pipeline states nor in control of subsequent tasks.

There's a trick to minimize network reliance which is to run playbooks from target hosts. Though this one is a bit painful because we need to setup playbook dependencies first before we could run our playbook on our target machines such as pulling ansible roles from private repositories and setting up required tools for obtaining playbook credentials like hashi vault and the ansible program itself. The cost of this trick outweighs the network reliance issue we're talking about.

This trick which runs automation scripts against itself is also problematic. What if the written automation incorporates restarts, what's gonna happen? It would break, you might solve it in some weird ways.

Terraform also has this problem as well which is applying a terraform destroy task on a machine that's planned to be destroyed. I like to call this circumstance as self mutation. Self editing might unfold circular snags that could produce a nightmare.

Even kubernetes uses another control loop to heal pods. The logic of reconciling pods doesn't happen in the pod, but replicaset controller is in charge in keeping pods available in a given number. That's part of the reason why we don't see replicas configuration in the pod object.

We can be very creative with a gazillion number of tools that are available today. There are abundance cool stuffs that can be assembled and unified at our disposal. This is also the time when we need to be aware of the cost of complex stuffs.

Sometimes I'm afraid that automations, code, documentations or stuffs I write is something that can be understood by myself. This indicates a foot step into silos. This is the right time to bring multiple heads to solicit ideas and wrestle with the problem.

Excruciating one particular tool and favoring one from the other won't get us anything. We might want to look at use cases and surrounding conditions instead.
