---
kind: blog
published: true
title: "Sanctifying Secrets (Part 3) - Isolating Policies"
date: 2022-03-07T03:02:03.00Z
path: /sanctifying-secrets-pt-3
tags:
  - AWS
  - EKS
  - identity-machine
  - EKS-pod-identity
description: This time I’m going to talk about one killer AWS Elastic Kubernetes Service latest feature, IRSA which stands for IAM role and service account. This is aiming for leveling up sensitive credentials usages on EKS clusters. We’re gonna dig into how to plug in the IAM rigs to EKS.
# background: "#FDDCD7"
background: "#fddcd727"
---

There’s one legit question worth to be in the conversation prior to the work. Why do we need this?

It's common seeing implementations of cloud provider resource automations that are typically built on gitlab, jenkins, and many other pipeline platforms configured with secrets / credentials / tokens embedded in CI/CD variables for their authentications. Oftentimes, these credentials persists adamant from rotations.

As we all know that cloud providers API endpoints are publicly available, we can make contact with these APIs from outside of cloud infrastructures, we can do it from our local computer. In the worst case scenario, credentials leaks would grant anyone to modify the respective cloud infrastructures. This is a deadly serious problem.

In a pursuit of circumventing this disastrous cycle, it is exceedingly conforming to propound identity machine authentication in the infrastructure foundation. Furthermore, this is also a pathway for us to abdicate from getting ourselves fallen into a secret management disarray. It’s incalculably virtuous.

Talking about kubernetes ecosystem, cloud providers increasingly gear their kubernetes platforms with identity machine as well. Google brings their solution with [GKE workload identity](https://cloud.google.com/kubernetes-engine/docs/how-to/workload-identity), Azure comes with [AKS pod identity](https://docs.microsoft.com/en-us/azure/aks/use-azure-ad-pod-identity), and many more. AWS invests their kubernetes service with EKS pod identity.

Not to forget that we are able to authenticate EC2 instances to interact with AWS API which I covered on my [assuming role on EC2](https://guruhhapsara.dev/ec2-s3-logging-with-fluentd) post. In EKS, we’re also given the ability to attach IAM profiles to EKS node groups namely node instance profile. This allows EKS nodes to eligibly make contact to AWS entities without static credentials.

This is dope. We're not maintaining AWS credentials. Our main concern is settled. So, why do we need pod identity? why node instance profile isn’t enough?

## Introspecting Environment

Kubenertes embraces diverse kinds of workloads to live in its runtime. Worker nodes are expected to respectively host a wide variety of workloads that serve different purposes.

Abiding our premise on the idea of node instance profile, it implies that workloads can inherit shared capabilities given to the nodes where they are hosted. Despite the fact that node policy inheritance can be prevented, there are legit cases in a practical operation when we need it.

One example I can point out is giving a node instance profile permission to pull ECR images. This hugely liberates us from maintaining container image pull secret. We wouldn’t need to create, deploy and rotate docker auth config.

Global policies always pays an extensive amount of benefits. However, If we’re not being careful, this can subsequently punish us with numbers of ramification.

At the time this article is written, kubernetes cluster autoscaler doesn’t come in the EKS installation by default. We will need to setup [AWS cluster autoscaler deployment](https://github.com/kubernetes/autoscaler/blob/master/cluster-autoscaler/cloudprovider/aws/README.md) in our EKS cluster.

The main AWS cluster autoscaler responsibility is to steer driving EC2 instances and autoscaling group to horizontally scale in and out node groups. Utilizing EKS node instance profile to have the required permissions set in place will make the AWS cluster autoscaler running in operation. In consequence, other pods that are serving from the same node will also be able to interact with AWS APIs using the policies meant for AWS cluster autoscaler.

In posturing a creative mind, having dedicated nodes with a designated instance profile for only AWS cluster autoscaler pod will avoid policies leaking to irrelevant pods. However, this workaround satirically contravenes this kubernetes best practice written by the AWS team here, [EKS cluster autoscaling](https://aws.github.io/aws-eks-best-practices/cluster-autoscaling/#reducing-the-number-of-node-groups).

Enter pod identity. The EKS pod identity allows us to selectively authenticate pods to interface with AWS entities. We are now able to scope AWS policies to work on individual workloads. At the same time, we still have the advantage of inherited policies granted from node groups instance profile.

Without further ado, let’s sail to stuffs we need to bootstrap to make the EKS pod identity functioning.

## OpenID Connect Provider

An open id connect provider is required for establishing trust between EKS cluster and AWS security token service. Imagine this like a handshake between two parties making an agreement that there’s a new member joining AWS IAM.

```hcl
resource "aws_eks_cluster" "this" {}

data "tls_certificate" "this" {
  url = aws_eks_cluster.this.identity.oidc.issuer
}

resource "aws_iam_openid_connect_provider" "oidc_provider" {
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.this.certificates.sha1_fingerprint]
  url             = aws_eks_cluster.this.identity.oidc.issuer
}
```

Eventually, we need credentials to interact with AWS entities in our account provided by the AWS security token service. This raises a question, how are going we to obtain these credentials.

## EKS Pod Identity Webhook

Like other smart AWS services, EKS comes with an elegant solution. EKS pod identity leverages kubernetes validating and mutating webhook admission controller. It’ll look for pods deployed with service accounts configured with a reserved annotation and supply them with tokens for AWS login authentications.

The pod identity webhook comes natively in the default EKS installation. We don’t need to worry about how to configure the webhook or how to deploy the pod identity controller.

Aside from that, as mentioned in the EKS pod identity documentation, EKS pod identity is not exclusive to EKS clusters. We can deploy the pod identity webhook to self managed kubernetes cluster solutions like KOPS in AWS.

## IAM Role and Service Account

Yes, it’s true. It’s always role. This particular abstraction personifies nearly all AWS identifiers. It vitally straps entity and authority bequeathing trusts to diverse authentication options from user password, cross identity management platform with SAML, until machine level principals like EC2 instance profile. It’s all over the place.

And again it’s about who and what it can do.

```hcl
resource "aws_iam_role" "irsa" {
  name               = "irsa"
  assume_role_policy = data.aws_iam_policy_document.trust.json

  inline_policy {
    name   = "irsa-policy"
    policy = file("policy.json")
  }
}
```

Since that the end user of the irsa is a pod, the trust policy needs to be set with the kubernetes cluster identity that we legitimately stamp with our OpenID connect.

```hcl
locals {
  oidc_url      = aws_eks_cluster.this.identity.oidc.issuer
  oidc_url_host = replace(local.oidc_url, "https://", "")
}

data "aws_iam_policy_document" "trust" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    effect  = "Allow"

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.oidc_provider.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "${local.oidc_url_host}:sub"

      values = [
        "system:serviceaccount:the-irsa-service-account-name:the-irsa-service-account-name"
      ]
    }
  }
}
```

Interestingly, if you’re paying attention to the condition configuration in the policy document above, we specify a kubernetes service account uri. This is actually the conduit of the fine grained policy distribution. We target our policy to work on discrete pods which employ a service account that we trust in our policy document.

There’s still one work left we need to have which is to make the pod identity be able to find the service account that we want to have the IAM role.

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: "the-irsa-service-account-name"
	namespace: "the-irsa-service-account-namespace"
  annotations:
    eks.amazonaws.com/role-arn: "arn:aws:iam::111122223333:role/irsa"
```

The service account’s name and namespace should be matched with our trust policy conditional configuration we have. The pod spec for attaching the service account looks classically like this.

```yaml
spec:
  serviceAccountName: "the-irsa-service-account-name"
```

Once this spec is deployed, The pod identity mutating webhook will modify the pod spec deploying AWS credentials to the pod.

```yaml
containers:
  - env:
      - name: AWS_DEFAULT_REGION
        value: ap-southeast-1
      - name: AWS_REGION
        value: ap-southeast-1
      - name: AWS_ROLE_ARN
        value: arn:aws:iam::111122223333:role/irsa
      - name: AWS_WEB_IDENTITY_TOKEN_FILE
        value: /var/run/secrets/eks.amazonaws.com/serviceaccount/token
    volumeMounts:
      - mountPath: /var/run/secrets/eks.amazonaws.com/serviceaccount
        name: aws-iam-token
        readOnly: true
volumes:
  - name: aws-iam-token
    projected:
      defaultMode: 420
      sources:
        - serviceAccountToken:
            audience: sts.amazonaws.com
            expirationSeconds: 86400
            path: token
```

kubectl exec into the pod and interact an AWS API with AWS CLI. We’re now in business with AWS resources.

```bash
bash-5.1# aws sts get-caller-identity
{
    "UserId": "AROA#########:botocore-session-1646501723",
    "Account": "111122223333",
    "Arn": "arn:aws:iam::111122223333:role/irsa/botocore-session-1646501723"
}
```

## Shout Outs

I wanna share these resources below which help me a lot during the EKS and pod identity setup.

- [Github terraform-aws-eks](https://github.com/terraform-aws-modules/terraform-aws-eks)
- [Terraform AWS IAM OIDC](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/iam_openid_connect_provider)
- [AWS OIDC](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_create_oidc.html)
- [AWS IRSA](https://docs.aws.amazon.com/eks/latest/userguide/iam-roles-for-service-accounts.html)
- [EKS Pod Identity Webhook](https://github.com/aws/amazon-eks-pod-identity-webhook)
