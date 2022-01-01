---
kind: blog
published: true
title: "Sanctifying Secrets (Part 1) - Preserving Legitimacy"
date: 2021-10-01T01:13:47.00Z
path: /sanctifying-secrets-pt-1
tags:
  - vault
  - kubernetes
  - terraform
  - secrets
  - kubernetes-external-secret
description: In this post, I'm talking about bringing secrets to kubernetes workloads.
background: "#98bb9924"
---

A few weeks ago I worked on a PoC which aims to improve secret deployments. My job was to find a seamless interface to lace kubernetes and vault.

I was completely fascinated with the available options we have the open source world. Options like kubernetes-external-secret, banzai vault operator, ibm argocd-vault, etc, they come with their unique characteristics which might be partly because of their specific problem they want to address. Hashicorp also comes with their official tools such as vault agent injector and vault-csi-provider.

The luxury of having options is something we should value. Numbers of tools I mentioned previously give us flexibility to choose the one that complements our surrounding conditions. This is when we need to conduct PoCs.

PoCs are always fun because there're like matching shocks, we're not really sure with what we really want, but we would swap up all of our left over shocks to find one that assents our inarticulate impulse.

We had self managed vault instances in our environments. We wanted this vault to be the source of truth of our secrets. We didn't want to see secrets sprawled or decentralized in many places. We also didn't want to have our hands crafting our own integration like having scripts or pipeline. This is super expensive in terms of thinking about maintainability.

We were also left with the fact that the vault instances were not in our hands. This means that we didn't have much control to vault servers. This became our foundational requirement which puts forward in choosing a tool which is not tightly coupled to vault servers. Though in the actual work field, we didn't fully identify this at the beginning. This came to us after we had a fully working demo.

In short, we decided to choose [kubernetes-external-secret](https://github.com/external-secrets/kubernetes-external-secrets) (KES). KES employs a crd that takes a kubernetes object which is `ExternalSecret` to render secrets from vault as kubernetes secrets objects. Pods refer secrets by specifying secretsRef to which kubernetes secrets they are supposed to use like the conventional way kubernetes secrets are used.

One thing that makes KES stand out against other tools is that KES doesn't inject secrets to pods. Pod creations won't rely on our vault server availability. If our vault servers went down, pods would still be created with secrets obtained from kubernetes secrets earlier.

## Inspecting the kitchen

Let's have a look at how to setup an integration between kubernetes and vault.

```hcl
resource "vault_auth_backend" "kubernetes" {
  type = "kubernetes"
	...
}

resource "vault_kubernetes_auth_backend_config" "vault_backend" {
  backend                = vault_auth_backend.kubernetes.path
  kubernetes_host        = ""
  kubernetes_ca_cert     = ""
	...
}
```

This would allow kubernetes pods and vault to establish a consent to talk to each other. The detail can be discovered here [https://www.vaultproject.io/docs/auth/kubernetes](https://www.vaultproject.io/docs/auth/kubernetes).

The way KES authenticates its calls to copy secrets from vault to kubernetes is to use a service account token. Vault will validate the token authority used by KES by looking at its signature.

The story doesn't end up there. Vault needs to validate the authority of requests by mapping service account tokens sent by KES pods to a vault role which in this case is the `kubernetes-external-secret` role and the associated policy which is `reader`.

```hcl
resource "vault_kubernetes_auth_backend_role" "k8s_external_secrets" {
  backend                          = vault_auth_backend.kubernetes.path
  role_name                        = "kubernetes-external-secrets"
  bound_service_account_names      = ["external-secrets-kubernetes-external-secrets"]
  bound_service_account_namespaces = ["external-secretes"]
  # token_ttl                        = 3600
  audience                         = "vault"
  token_policies                   = [
    "reader",
  ]
}

resource "vault_policy" "reader_policy" {
  name = "reader"

  policy = <<EOF
		path "kubernetes/data/*" {
			capabilities = ["read"]
		}
		path "kubernetes/metadata/*" {
			capabilities = ["list", "read"]
		}
	EOF
}
```

The next thing we need to do is to deploy the kubernetes-external-secret crd. It's available as an helm chart, the installation is pretty straightforward. If we inspect the [KES rbac](https://github.com/external-secrets/kubernetes-external-secrets/blob/45e894895c009f724f342e9860768f54d7e4552f/charts/kubernetes-external-secrets/templates/rbac.yaml), we will see there is a system:auth-delegator role binding which lets KES to obtain kubernetes TokenReview object which tells whether its service account is authenticated or not which later on will be used to authenticate api requests to vault.

Now let's move to the secret part. Here's the way to tell KES to create kubernetes secrets from vault. The manifest below clearly states variables needed to knit vault secrets as kubernetes secrets.

```yaml
apiVersion: "kubernetes-client.io/v1"
kind: ExternalSecret
metadata:
  name: cool-secret
spec:
  backendType: vault
  vaultMountPoint: kubernetes
  vaultRole: kubernetes-external-secrets # The vault role configured for kubernetes external secret
  data:
    - name: test
      key: kubernetes/data/cool/secrets # The full path of the secret to read, as in `vault read secret/data/hello-service/credentials`
      property: test
```

KES will create a kubernetes secret named `cool-secret` , once the manifest above is applied and pods can be easily using it.

KES by default uses a pooler to watch secrets changes from vault. KES will frequently revise kubernetes secrets to match vault secrets latest change in a given interval time. This means that KES will make calls based on the amount of `ExternalSecret` objects times the configured interval time.

Let's say we 573 namespaces alongside with 1 `ExternalSecret` object with 5 vault key value secrets and we configure 10 seconds update interval, we would bring disastrous loads to our vault servers.

Cool softwares always come with cool configurations. KES gives us a way to disable this polling behavior. With this, we can get creative with what to do next. The poller can be disabled by specifying this environment variable below.

```yaml
env:
  DISABLE_POLLING: true
```

This means that secrets will only be created once when the first time we deploy KES `ExternalSecret` object. How do keep up with secret updates with this?

Here's the get creative part. KES allows us to trigger its secret sync api by putting changes to `ExternalSecret` objects. One way to do it is to have some sort of incremental or unique identifiers like git commit hash or timestamp.

```yaml
$ kubectl explain externalsecrets.spec.template
KIND:     ExternalSecret
VERSION:  kubernetes-client.io/v1

DESCRIPTION:
     Template which will be deep merged without mutating any existing fields.
     into generated secret, can be used to set for example annotations or type
     on the generated secret
```

The ExternalSecret will look like this

```yaml
apiVersion: "kubernetes-client.io/v1"
kind: ExternalSecret
metadata:
  name: cool-secret
spec:
	...
  template:
    metadata:
      labels:
        ts: 2021-09-25T16:13:32.00Z
				commit-hash: d4f0a2db0dde69771e65d66cad3d77227832bd76
	...
```

This aligns with our requirements. We are less relying on vault servers. Calls vault servers will be made only when we put changes on `ExternalSecrets`.

The downside of this is that it would entail a workaround if we want to implement stuffs like password rotations.

## Secret Sauce

The thing I want to stress out is secrets deployments should be treated very carefully. Secrets could leak or could be disclosed or visible to unqualified agents, the sense of secrets could be subjected by the way we manage them. This should be one thing we need to keep in mind.
