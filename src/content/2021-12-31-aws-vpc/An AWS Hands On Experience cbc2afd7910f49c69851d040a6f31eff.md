---
kind: blog
published: true
title: "An AWS Hands-on Experience"
date: 2021-12-31T23:27:58.00Z
path: /aws-vpc
tags:
  - AWS
  - VPC
description: I want to share my learning about AWS VPC. In this writing, I’m covering a common use case of wiring up VPC vital components to build a working infrastructure foundation.
---

I’m making a case of how to have a VPC that can host instances that interact one another privately and also to make them able to access public internet without necessarily exposing them to the public internet.

Suffice to say, in a contrived scenario you would expose a database to an application through a private network and you would want to make the application to be able serve traffics from public internet.

In our case here, we will do the same kind of thing conceptually. We’re going to make a couple EC2 instances in one private instance that can be only be reached within a private network and one public instance which can be reached from public internet.

The private instance would also be able to reach public internet as we want to ostensibly simulate an application that needs interact with a public api through internet. The public instance would act as a bastion host which tunnels an ssh session to the private instance which attests internal network connectivity.

We’re going to use terraform because it’s the best way I can think of to demonstrate the building blocks we need to assemble in our VPC infrastructure.

## VPC

To start off, we’re going to make a VPC with one private subnet and one public subnet. For the brevity sake, let’s make the subnet addressing like below.

```json
locals {
  vpc_cidr = "10.20.0.0/16"

  private_subnet = "10.20.0.0/17"
  public_subnet = "10.20.128.0/17"
}
```

We exhaust our VPC cidr space in two subnet blocks here. Bringing up a VPC with terraform AWS module can be done easily straight up like this.

```json
resource "aws_vpc" "this" {
  cidr_block = local.vpc_cidr
}
```

In case you’re wondering why does it always start from 10 dot space, go check out the RFC-1918 here [https://datatracker.ietf.org/doc/html/rfc1918](https://datatracker.ietf.org/doc/html/rfc1918).

A VPC won’t mean anything without networks. A typical probably well functioning VPC will have subnets with regard to their responsibility. In a typical practice, we will have networks for private and public connections needs.

## Public Subnet

As the name implies, this network will be responsible for handling public internet traffic demands. Here’s how we bring up a public subnet. We specify our public subnet ip range defined in our locals in the cidr block configuration.

```json
resource "aws_subnet" "public" {
  vpc_id = aws_vpc.this.id
  cidr_block = local.public_subnet
  availability_zone = data.aws_availability_zone.az.name
  map_public_ip_on_launch = true
}
```

Let’s talk about these configurations from the least interesting one. The `availability_zone` is the location of the subnet will be provisioned which also determines where EC2 instances are going to be instantiated in which availability zone. The `map_public_ip_on_launch` is a way to tell AWS to automatically assign public ip addresses to instances provisioned with the subnet.

One thing that made me wonder in the beginning was what makes subnets public or private as they’re only numbers, we can swap the cidrs of public and private subnets interchangeably.

An internet gateway is the thing that makes subnets public. Everything created under a subnet with an internet gateway will have a public internet access and will be able to be discovered from the public internet.

```json
resource "aws_internet_gateway" "this" {
  vpc_id = aws_vpc.this.id
}
```

That becomes a segue into where we should be heading next. One question perpetuated in my mind before I got my hands on setting up a VPC was how do network requests get to their destinations?

One of essential parts in VPC that dictates how traffics flow in and out within the VPC construct is routes. This is the where the VPC decides which network device that VPC should use to deliver network packets.

As our public VM needs to be reachable from the public internet, we need to make a routing record that enables public internet trips using an internet gateway. Here’s how to route internet traffics to an internet gateway with a route table.

```json
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.this.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.this.id
  }
}

```

The zeros definition in the `cidr_blcok` means that it accepts all IP address range. The route table will route them to the provisioned internet gateway specified in the `gateway_id` configuration.

You might wonder are the 10 dot spaces traffics are going to be routed to public internet? We don’t want our public instance to establish connections to the private instance via public internet.

AWS VPC takes care of this. VPC comes with a default immutable route which routes inbound and outbound traffics within VPC cidr block locally inside VPC. If you look at the route table we create from the AWS web console, you would see a table looking like this.

| Destination  | Target              |
| ------------ | ------------------- |
| 10.20.0.0/16 | Local               |
| 0.0.0.0/0    | internet-gateway-id |

The route table evaluates records from top to bottom. VPC priorities routes defined in a route table in an ascending fashion. However, this is just a route table definition. VPC won’t magically route internet traffic to our EC2 instance.

The last piece of work to make our EC2 instance to get the public internet access is to tell the VPC that we want the subnet where our EC2 instance is resided to use in the associated internet gateway routing table.

```json
resource "aws_route_table_association" "public" {
  route_table_id = aws_route_table.public.id
  subnet_id = aws_subnet.public.id
}
```

We’re gonna get into the EC2 setup soon. For now, let’s stick to how we build our VPC construct.

## Private Subnet

We want an EC2 instance that can only be discovered privately within our VPC. This can be done pretty straight forward. We just need create a subnet with no other technologies attached to it.

```json
resource "aws_subnet" "private" {
  vpc_id = aws_vpc.this.id
  cidr_block = local.private_subnet
  availability_zone = data.aws_availability_zone.az.name
}
```

We don’t even need to define a route at this point. The VPC main local route we talked about earlier applies to this subnet as well. Our subnets are ready to go. However, there’s still another VPC component that we need to set up.

## Security Group

By default, AWS constructs come with a deny rule. We’re not able to deny occurrence, instead we are given the ability to create restrictions which allow certain things to happen.

Though our subnets, routes, internet network are set upright in our VPC, network interactions can’t be made as network traffics are also moderated by an AWS feature called security group. Security groups are set of rules which are the nearest firewall gatekeeping EC2 instances network packet streams.

Security groups consist of two main rules which are `ingress` and `egress`. These both rules are viewed from instances perspective. `ingress` regulates networks coming to instances while `egress` manages permitted traffics that can leave instances.

Back to proving our private connectivity setup, we want to reach our private instance from a public instance. That entails us to get into the instance in order to run a network connectivity test against the private instance.

Our security group will need an ingress rule which opens the port 22 so we can establish an ssh session to the instance. We also need to specify an egress rule to let the instance make requests to any address.

```json
 resource "aws_security_group" "public" {
  ingress {
    cidr_blocks = [
      "0.0.0.0/0"
    ]
    description = "allow ssh"
    from_port = 22
    protocol = "tcp"
    to_port = 22
  }
  egress {
    cidr_blocks = [ "0.0.0.0/0" ]
    description = "allow all traffic"
    from_port = 0
    ipv6_cidr_blocks = [ "::/0" ]
    protocol = "all"
    to_port = 0
  }

  vpc_id = aws_vpc.this.id
}
```

Despite the fact that the public instance is located in the same VPC with the private instance, we still need to have the egress rule above otherwise it won’t be able to reach out the private instance.

Same with the public instance, we also need to define a security group for the private instance. We’re going to make a slightly same rule with the public instance. Although for this private instance, we will allow an ssh session from the public machine.

This roughly portrays what VPN servers do in access internal networks. Our security group for the private instance will look like this.

```json
resource "aws_security_group" "private" {
  ingress {
    description = "allow ssh"
    from_port = 22
    protocol = "tcp"
    security_groups = [
      aws_security_group.public.id
    ]
    to_port = 22
  }
  egress {
    cidr_blocks = [ "0.0.0.0/0" ]
    description = "allow all traffic"
    from_port = 0
    ipv6_cidr_blocks = [ "::/0" ]
    protocol = "all"
    to_port = 0
  }

  vpc_id = aws_vpc.this.id
}
```

We’re all set to bootstrap the public and private instances.

```json
resource "aws_instance" "public" {
  subnet_id = aws_subnet.public.id
  vpc_security_group_ids = [
    aws_security_group.public.id,
  ]
	...
}

resource "aws_instance" "private" {
  subnet_id = aws_subnet.private.id
  vpc_security_group_ids = [
    aws_security_group.private.id
  ]
	...
}
```

Now the testing part. If we’re not missing out something, we should be to ssh to the private instance using the public instance as a jump host. Here’s how to do it.

```json
ssh -J ec2-user@${the_public_instance_public_ip} ec2-user@${the_private_instance_private_ip}
```

## NAT Gateway

Though our private instance now can talk to us from our public instance, this is not necessarily we’re able to access to public internet from the private instance. If you tried out to do apt update or curl [google.com](http://google.com), you’d be like holy crap! it’s not working.

Our next job is to make it possible to connect to public internet. We’re not going to have an internet gateway in our private subnets as we want to keep our instance stays private with no public network accessibility.

Steps required to make it happen are more or less the same. We will install a component called NAT gateway instead of an internet gateway in our private subnet.

A NAT gateway is what allows private instances to reach public internet without exposing them to public internet networks. Private instances will still only be accessible from the internal VPC network.

There are several components we need to get bring up a public internet setup, a NAT gateway, a public IP address, and a route for the private subnet.

```json
resource "aws_eip" "this" { # the public ip address
}

resource "aws_nat_gateway" "this" {
  allocation_id = aws_eip.this.id
  subnet_id = aws_subnet.public.id
  connectivity_type = "public"
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.this.id

  route {
    cidr_block = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.this.id
  }
}
```

A NAT gateway can also be used a way to connect to other VPCs or on-premise private exclusive networks, but we’re not going to talk about it this time. That’s part of the reason why you see a configuration `connectivity_type` specified with `public` value as we want our NAT gateway to facilitate public internet instead of VPC peering BGP sessions.

In case you’re wondering why the `subnet_id` configured with the public subnet id `aws_subnet.public.id` instead of the private subnet id. This is because the NAT gateway needs to understand public internet network. It needs to have a public internet connectivity. We need to provision it in our public subnet.

If you think about it, likewise our bastion server which allows us to connect to our private instance, conversely a NAT gateway is like a bastion server which bridges private instances to public internet network.

Then how are going to make it work in our private subnet? That’s the route table association comes into play again.

```json
resource "aws_route_table_association" "private" {
  route_table_id = aws_route_table.private.id
  subnet_id = aws_subnet.private.id
}
```

Now, if the private machine able to receive a response from a [google.com](http://google.com) curl request.

## Cool References

- [VPC routing](https://docs.aws.amazon.com/vpc/latest/userguide/VPC_Route_Tables.html)
- [Internet gateway](https://docs.aws.amazon.com/vpc/latest/userguide/VPC_Internet_Gateway.html)
- [NAT gateway](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-nat-gateway.html)
