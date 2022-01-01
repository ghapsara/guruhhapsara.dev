---
kind: blog
published: true
title: "Sanctifying Secrets (Part 2) - Federating Credential Life Cycle"
date: 2021-10-23T22:59:06.00Z
path: /sanctifying-secrets-pt-2
tags:
  - vault
  - azure
  - secrets
description: This is the last piece of work I did for my previous employment and I'm glad of my involvement in this project which was sweetening my last working days there.
---

The project was about complying one of security assessments mandated by our security team. I couldn't imagine what would I do if I were working on this field 9 years ago. Let's begin with a rudimentary analogy.

Let's say we’re mistakenly inviting a non eligible apparatus to our birthday party and they're showing up in the party with a really bad intention, we couldn't know them easily and we don't want to end nor reschedule our party to another day. The show must keep going on. What should we do? It's not really a huge problem if we couldn't catch them up, but we'd be ripped off if that criminals could eat the birthday cake and take everything they want for free. How do we avoid this from happening?

How do we prevent somebody from stealing our resources when they're already in our machines. This question is answered with a fundamental yet underrated concept? Identity.

If users / human beings access their favorite websites via user login, or at least TLS handshakes in order to get authenticated, machines communications should have this privilege as well.

Governing machine access could be very challenging as we need to make sure that they're both authenticated and authorized to download copies of sacred credentials from a secret store.

Practically we would have hosts delegated for executing repeatable tasks which come along with a long last service account embedded inside the machines. This exercise frankly smuggles a smashing pitfall. If bad actors had access to our disk, we would grant them with a such insurmountable capability.

Luckily, we're living in this era when numbers innovative tools have been invented. We can pull available solutions from the open source community. In my opinion, It's safe to say that the current go to tool to deal with secrets is hashicorp vault.

Vault has a commendable feature called secret engine which lets us to outsource the complexity of integrating secret management with existing systems such as database, PKIs, KMS, etc. This cool technology is well document [here](https://www.vaultproject.io/docs/secrets.).

In this post, we will explore vault secret engine for azure which interlaces vault and azure dynamic service principals. What we're doing is essentially letting vault to create, retain, and destroy dynamic service principals which extends azure identity service upon which roles or identities are authorized in particular machines.

The reason why I'm not saying it azure virtual machines is because we can also have this integration in azure kubernetes service which is super dope.

## Assembling the machinery

First off, we need to enable vault azure backend. I'm not going to talk about how to set this up, this vault documentation [here](https://www.vaultproject.io/docs/secrets/azure#setup) clearly describes how to do it. We will dive right in how vault azure secret engine work and how to configure them instead.

Let's jump straight to create a user-assigned managed identity which allows us to authenticate machines making calls to azure active directory api. In short, this is what allows machines to perform logins to vault. Virtual machines use JWTs which can be obtained by requesting azure metadata server for login. A further detail is described in this [azure docs](https://docs.microsoft.com/en-us/azure/active-directory/managed-identities-azure-resources/how-to-use-vm-token).

Prior to that, virtual machines should have a managed identity attached to them first, otherwise azure metadata service server will never respond back with JWTs. If we create the virtual machines using terraform, we need to do something like this.

```hcl
resource "azurerm_user_assigned_identity" "identity" {
	...
}

resource "azurerm_linux_virtual_machine" "vm" {
  identity {
    type  = "UserAssigned"
    identity_ids  = [
      azurerm_user_assigned_identity.identity.id,
    ]
  }
	...
}
```

This identity setup can be done with azure cli as well. Now we can to test it by sending a curl request for a JWT to azure metadata server.

```bash
curl -H "Metadata:true" "http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=https://management.azure.com&object_id=$OBJECT_ID"
```

The `object_id` value there is optional, but if the host vm is having multiple identities, it'll be mandatory. The value of the `object_id` is the user assigned identity attached to the vm. This id is commonly referred as MSI (managed service identity) id.

The nice thing about this is that azure provides a very neat logging feature which traces and records all activities performed on behalf of MSI. This brings audit and debugging experiences to a higher bar even though vault also has already had a great audit log as well.

If everything is set the MSI up correctly, we should receive a JWT access token.

```json
{
  "access_token": "eyJ0eXAi...",
	...
}
```

Now, the vault part. We login to vault by using the `access_token` value above.

```bash
vault write -format=json auth/azure/login \
  jwt="$access_token" \
  subscription_id="$MACHINE_SUBS" \
  resource_group_name="$MACHINE_RG" \
  vm_name="$MACHINE_HOSTNAME" \
  role="$ROLE"
```

This command will output a vault token which we can export as `VAULT_TOKEN` variable to log in as an authenticated vault session.

Let's take a look at 3 other interesting parameters there which are `subscription_id`, `resource_group`, and `vm_name`. These parameters are bound to the virtual machine resources.

At least there are 2 ways of getting these required parameter values as far as I know. First is getting them directly from azure portal, azure cli, or terraform. Second is we can obtain them by calling azure metadata server right from the virtual machine.

```bash
curl -s -H Metadata:true "http://169.254.169.254/metadata/instance?api-version=2018-02-01"
# response
{
  "compute": {
    "name": "",
    "resourceGroupName": "",
    "subscriptionId": "",
  }
  ...
}
```

Think of it as if we need a username and a password for login. The JWT access token is our password and the `subscription_id`, `resource_group`, and `vm_name` substitute the username. By supplying these parameters to vault `auth/azure/login` endpoint, we are expecting vault to let virtual machines to have a vault session.

This is not done yet, when a vault session is given to the virtual machine, vault does not necessarily grant capabilities to it which means the virtual machine couldn't perform anything.

Our next job is to make the authenticated session authorized to perform vault read operations. This is required as the way we obtain dynamic service principal generated by azure secret engine is to read them from a vault path.

If we look at the vault login command previously, we see that there's a `role` parameter. This parameter is essential as it tethers several resources to make vault azure secret engine work.

Here's how we create a vault `auth role` which glues a vault policies and an azure service principal id though this can be configured for multiple policies and multiple service principal ids.

```hcl
resource "vault_azure_auth_backend_role" "role" {
  backend                     = "azure"
  role                        = "an_auth_role"
  token_policies              = [
		"a_vault_policy",
	]
  bound_service_principal_ids = [
		"the_machine_user_assigned_id",
	]
}
```

From the configuration above, we're telling vault that if there's a login session as `an_auth_role` by a JWT which authority is a user assigned id which in this case is `the_machine_user_assigned_id` / the `MSI` id should be permitted to perform any capabilities configured in token policies which is `a_vault_policy`.

Next is setting up the vault policy.

```hcl
resource "vault_policy" "policy" {
  name = "a_vault_policy"
  policy = <<EOF
    path "azure/creds/a_secret_role" {
      capabilities = ["read"]
    }
  EOF
}
```

The policy configured above will become a place where the vault azure backend generates dynamic service principals. Generated service principals are bound to particular azure roles and subscriptions. Now we need to configure a vault secret backend which does the role capability stitching duty.

```hcl
resource "vault_azure_secret_backend_role" "a_secret_role" {
  backend = "azure"
  role    = "a_secret_role"
  ttl     = "3600"
  max_ttl = "3600"

  azure_roles {
    role_name = "Contributor"
    scope     = "/subscriptions/subscription-id/resourceGroups/rg-name-1"
  }

  azure_roles {
    role_name = "Contributor"
    scope     = "/subscriptions/subscription-id/resourceGroups/rg-name-2"
  }

	...
}
```

The `vault_azure_secret_backend_role` will be able to issue dynamic service principals constricted with azure role permissions administered to them.

The super nice thing about the vault secret backend configuration above is that we can set a time to leave. This is huge. We have the ability to let vault to invalidate generated dynamic service principals for each given time.

Note that `a_vault_policy` we created earlier was configured with `azure/creds/a_secret_role` , this has to be structured this way as the `vault_azure_secret_backend_role` is configured with `a_secret_role` , except the vault auth azure plugin is mounted with a custom path.

Now, we can obtain dynamic service principals with vault read command.

```bash
vault read --format=json a_secret_role
# response
{
	"data": {
		"client_id": "",
		"client_secret": "",
		...
	}
}
```

These `client_id` and `client_secret` are used for authenticating azure auth sessions with azure cli, terraform, or other platforms.

```bash
az login --service-principal --username $client_id --password $client_secret --tenant $azure_tenant_id
```

The azure session is authorized to perform all capabilities of azure roles we configure in the `vault_azure_secret_backend_role` setup.

To put it simply, we authenticate virtual machines for vault sessions with vault azure auth backend roles then we authorize vault azure secret engine operations with vault azure secret backend roles.

Lastly, this is super important. We've seen how vault elegantly generates dynamic service principals and maintains their time to leave. Additionally, we can revoke dynamic service principals generated by azure vault secret engine.

This last configuration piece will allow vault sessions to perform revocations. We're only required to add an update capability to `sys/leases/revoke/azure/creds/a_secret_role/*` to the vault policy we created earlier.

```hcl
resource "vault_policy" "policy" {
  name = "a_vault_policy"
  policy = <<EOF
    path "azure/creds/a_secret_role" {
      capabilities = ["read"]
    }
		path "sys/leases/revoke/azure/creds/a_secret_role/*" {
      capabilities = ["update"]
    }
  EOF
}
```

Now we can revoke service principal from the virtual machine

```bash
vault lease revoke $lease_id
```

When we ask vault to generate dynamic secrets with vault read command, vault creates `leases`. We can explicitly enforce vault to expire these secrets by revoking `lease_id` which is included in vault read responses along side with dynamic secrets.

```json
{
	"data": {
		"client_id": "",
		"client_secret": "",
		...
	}
	"lease_id": "",
}
```

With revocations, we don't need to wait for vault secret time to leave to invalidate dynamic service principals.

## Transmuted reverbs

Where can we implement this technology? The best place I could imagine is automation. It could be ansible, terraform, gitlab pipeline, github actions, or any other platforms.

The hard problem addressed by this tool at hand is secret life cycle. Securing secrets is hard, managing them is even harder. In my opinion, the most underrated mistake I see in productionizing pipelines is how secrets are employed in the working space.

We tend to think that base64 encoding is sufficient despite it's never an encryption. We are comfortable holding secrets in our local machines. Having one secret that holds mighty capabilities is considered as double quotes negotiable. Oftentimes, priorities beat the hell out of putting scrutinies to all these things.

I had a coworker in my previous employment, he's really top notch, one of the bravest and highly competent person I've ever worked with. One thing he said that strikes me until today is you'll never revisit your IAM roles, you better set them up with minimum capabilities.

That makes me forthrightly think, this is what commonly happens to service accounts as well, ironically. We create them once, we use to do tons of things, then we leave.

In addition, this vault azure secret engine itself could still become an attack vector. If somebody took over the msi machine, secrets could be stolen. However, everything'd be recorded and we'd know their suspicious movements, we could take accurate actions. If we agree with no 100% SLO, it should be fair that we say there's no 100% secure systems.

With this vault azure secret engine, we can build a governance for utilizing secrets. No body is encouraged to provision resources from their local machines which prescribe automations and pipelines as compulsory in turn. Team collaborations become main daily directives which are demonstrated in code and documentations. Repeatable tasks are eminently handed to machines. Isn't it shocking that one fundamental adoption chains series of advantageous practices in consequence.
