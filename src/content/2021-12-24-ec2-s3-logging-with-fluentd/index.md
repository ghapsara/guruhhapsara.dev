---
kind: blog
published: true
title: "Associating Multiple AWS Accounts For EC2 S3 Logging Integration With Fluentd"
date: 2021-12-24T02:46:53.00Z
path: /ec2-s3-logging-with-fluentd
tags:
  - AWS
  - IAM
  - S3
  - fluentd
  - assume-role
description: I’m going to talk about my impression of one of mesmerizing terrains in AWS identity management plateau. I was lucky to work on a job bootstraping an integration for forwarding an Elastic Beanstalk application’s logs to an S3 bucket located in a different AWS account.
---

I was involved in a migration project of replacing datadog monitoring with new relic. This should be simple as we would only need to bring new relic apm to the app and remove the datadog agent. In the beginning of the project, I was a bit worried, I knew something was coming to unfold. The word migration in my mind always implies uncharted body of works.

Later on, we found out that there was an application utilizing one of datadog features which was something I had never heard before, datadog pipeline. In datadog, we have an ability to do a kind of ETL thing to logs. The pipeline was used as a way to export the application logs captured by datadog agent to an S3 bucket.

My stomach went growling immediately when this was discovered. As a result, we had to find a replacement for this before we could terminate the datadog apm.

Initially we looked at a couple managed solutions. We did a brief assessment to consider having either cloudwatch or new relic itself to batch the application logs to S3. Nonetheless, we were not really into these both platforms. We wanted a simple solution that would just do the job.

## Fluentd

I would never be tired to tell you how fascinating the open source world is. Surprisingly, we tapped into a freaking awesome solution that really suited to our need.

Fluentd has a plugin which lets us to export logs to S3 buckets named `fluent-s3-plugin`. Another requirement we had in S3 log pipeline is to export the logs in a windowed duration. There’s a fluentd configuration that allows us to have partitioned logs called `buffer`, we will dive into how to use it soon.

Fluentd unequivocally became our choice of replacing the application log pipeline.

Let's assume that the bucket is set up and ready to use. In our case, we expect fluentd to read logs from several files produced by the application. The configuration is rather simple but the thing it does is marvelous. First we need to specify the `source` configuration telling how fluentd should read the log.

```xml
<source>
    @type tail
    tag s3.*
    path /var/app/current/log/*.log
    pos_file /var/log/td-agent/s3.pos
</source>
```

We see that there are a few things specified there. First is the `@type`, we set it to `tail` as we don't want to capture complete text logs in every fluentd read task, we only need to catch last added logs.

You might wonder, logs are often compulsively bursted in a massive number of lines. A question comes to mind, how does fluentd manage to stream logs continuously without missing any lines.

That's how the `pos_file` configuration comes into play. This configuration is used by fluentd to keep track fluentd last read index. If fluentd agent got rebooted at any given moment, fluentd would use the file specified in the `post_file` property to figure out which lines that it needs to read.

The two pieces of config left are `tag` and `path`. The `path` property defines how we tell which files fluentd should read. It works with multiple paths too. We can have commas like how we specify items in an array or we can use `*` like how we do it in the config above. The `tag` configuration is important as this is used by fluentd for its internal routing. We will refer this tag in another fluentd configuration part.

The next thing we need to do is telling fluentd what should do with the source data. In our case, we want to dump logs to an s3 bucket. The configuration looks like this.

```xml
<match s3.**>
    @type s3
    s3_bucket eb-logs-bucket
    path /dev
</match>
```

The `@type` configuration is set to `s3` to tell fluentd to process the captured data with the `fluentd-s3-plugin`. Previously we specified the tag in the source configuration as `s3.*` , this allows us to easily capture data from multiple log files and refer them in the match configuration by specifying `s3.**`.

Recalling one of our requirements, we need to make logs sent to the s3 bucket chunked in a particular time window. The `buffer` configuration is the special configuration we talked about earlier that makes it possible.

```xml
<match s3.**>
	...
  <buffer tag,time>
    @type file
    path /var/log/td-agent/s3 # path for buffer
    timekey 1h # 1 hour partition
    timekey_use_utc true # use utc
    chunk_limit_size 256m
  </buffer>
</match>
```

By adding the `buffer` configuration above to the match configuration, we're telling fluentd to partition the captured logs in an hourly window. We can also specify the size of the chunk. There'll be an increasing number appended to the chunk files which indicates the index of the chunked data. This is very useful as we don't to make fluentd to push big size data in one shot.

If the configuration is correct, we would see list of files under the configured folder defined in the `path` property. fluentd will continuously watch this folder and upload gzipped files to the s3 bucket.

Doesn't it strike you as odd as we're not putting any credentials in our configuration. Now we're getting into the serious part.

## AWS role and policy

In our case, our setup is deployed to an elastic beanstalk application. The elastic beanstalk app lives on top of EC2 instances. In EC2, we would specify a role that lets instances to interact with AWS entities.

That means we don’t need to throw AWS secrets to EC2 instances to call AWS APIs which in our case is S3. How does AWS validate the authenticity of AWS API service interaction requests? It’s the identity comes into play.

I’m not going to brag out about identity machine again. I have testified my deep fascination in how identity machine really changes the whole game of authentication in [my sanctifying secrets series here](https://www.guruhhapsara.dev/sanctifying-secrets-pt-2).

How do we get this to work? First we need to settle down that every AWS services interaction is strictly regulated with IAM roles and policies. In this article, we're going to make use of AWS terraform module to manage our AWS IAM roles. There are 3 main important parts needed to configure to make roles to work. Let’s dive into it.

```hcl
resource "aws_iam_role" "eb_role" {
  name                = "eb-role"

  assume_role_policy  = file("ec2-trust-policy.json")

  inline_policy {
    name    = "s3-log-policy"
    policy  = file("s3-log-policy.json")
  }
}
```

There’s a couple ways to define role’s policies. First is using terraform `aws_iam_policy_document`. Second is to put it in a file then we import it like we do in the `inline_policy` block above.

With respect to our case, the minimum capabilities we need to get the fluentd s3 integration working can be limited to only list, get, and put operations to our S3 bucket. Furthermore, we can restrict the configured capabilities to work for a specific S3 folder. The policies defined below regulates the permitted operations to work only on the bucket `dev` folder.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "",
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject"],
      "Resource": ["arn:aws:s3:::eb-logs-bucket/dev/*"]
    },
    {
      "Sid": "",
      "Effect": "Allow",
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::eb-logs-bucket",
      "Condition": {
        "StringLike": {
          "s3:prefix": ["dev/*"]
        }
      }
    }
  ]
}
```

The last important configuration piece needed is trust policy. This is what allows which entities that can be authorized to use the role. The entity that we should trust to use the role is EC2 as the elastic beanstalk application is deployed as EC2 instances.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

Now we have the role set up in place. However, this is not done yet, we need to create a component called instance profile to configure the elastic beanstalk EC2 instances with the role.

```hcl
resource "aws_iam_instance_profile" "eb_instance_profile" {
  name = "eb-instance-profile"
  role = aws_iam_role.eb_role.name
}
```

Then we need to update our elastic beanstalk environment setting to use the instance profile.

```hcl
resource "aws_elastic_beanstalk_environment" "eb_env" {
	...
	setting {
		namespace = "aws:autoscaling:launchconfiguration"
		name      = "IamInstanceProfile"
		value     = "${aws_iam_instance_profile.eb_instance_profile.name}"
	}
}
```

## AWS multi accounts auth setup

If we think about having a simple super slick role definition, it would only make sense to mingle the S3 policy inside the elastic beanstalk instance profile role. However, in our case this is not possible. One of our requirements is to get logs to an S3 bucket which is not in the same account that hosts the EB instances.

This entails us to divide the EB and S3 policies in 2 different roles in 2 separate accounts. Let’s say that our EB instances are located in `acccount-a` and the S3 bucket is in `account-b`.

We need to remove the S3 policy defined in our previous `eb_role` iam role block and add a policy that allows an `account-a` role to assume a role in `account-b` which holds policies that are required to operate on the configured S3 bucket in `account-b`.

The `eb-role` setup in `account-a` will have these role and trust relationship policy like below.

```hcl
resource "aws_iam_role" "eb_role" {
  name                = "eb-role"
	assume_role_policy  = file("ec2-trust-policy.json")

  inline_policy {
    name    = "eb-assume-role-policy"
    policy  = file("eb-assume-role-policy.json")
  }
}
```

The trust relationship policy in our `eb-role` which we defined earlier doesn’t need a modification because we still need to allow EC2 to assume our role to perform its function. The only update we need to have is the role policy to allow the `eb-role` to assume the S3 role in `account-b`. The trust policy is defined in the `eb-assume-role-policy.json` file like below.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "sts:AssumeRole",
      "Resource": ["arn:aws:iam::account-b:role/s3-log-role"]
    }
  ]
}
```

Notice that the S3 policy is not defined in the `eb-role` setup. This is expected because the S3 access permission in `account-a` is no longer relevant as the bucket is located in `account-b`, the policy will be delegated to S3 role in `account-b` instead.

Moving to `account-b` role setup, we need to bring the S3 policies defined in `account-a` earlier which lets the fluentd S3 to work to `account-b`. The S3 policies definition is still the same, we only need to refer it in our `inline_policy`.

```hcl
resource "aws_iam_role" "s3_role" {
	name							  = "s3-role"
	assume_role_policy  = file("s3-trust-policy.json")

  inline_policy {
    name    = "s3-log-policy"
    policy  = file("s3-log-policy.json")
  }
}
```

Then we need to specify a trust relationship which permits the `eb-role` from `account-a` to be authorized to perform eligible actions defined in our `s3-role` in `account-b` . The `s3-trust-policy.json` file looks like this.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::account-a:role/eb-role"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

## Test

If everything is set up correctly, we would be able to assume the `account-b` `s3-role` from our elastic beanstalk machine in `account-a` . To test out our setup, we can use aws-cli and run this sts assume-role command below.

```bash
aws sts assume-role --role-arn "arn:aws:iam::account-b:role/s3-log-role" --role-session-name "test"
```

It will return a json response like this.

```json
{
  "AssumedRoleUser": {
    "AssumedRoleId": "",
    "Arn": "arn:aws:iam::account-b:role/s3-log-role"
  },
  "Credentials": {
    "SecretAccessKey": "",
    "SessionToken": "",
    "Expiration": "2021-12-23T05:21:31Z",
    "AccessKeyId": ""
  }
}
```

Pull the `SecretAccessKey` , `SessionToken` , and `AccessKeyId` and pass them to s3 ls command. If everything is in the right place, we shouldn’t receive an unauthorized error.

```bash
AWS_ACCESS_KEY_ID="" \
AWS_SECRET_ACCESS_KEY="" \
AWS_SESSION_TOKEN="" \
aws s3 ls s3://eb-logs-bucket/dev/
```

We should be seeing an empty list because we haven’t uploaded any objects yet. We need to go back to our logging configuration as fluentd is the agent that will push objects to our bucket.

In light of the fact that our authentication method is changed to assume role, our `fluentd-s3-plugin` implicit auth configuration won’t work anymore.

Fortunately, the assume role auth model is supported by the `fluentd-s3-plugin`. The required parameters needed for the auth configuration are the same with our previous aws sts assume-role command. The fluentd configuration update will look like this.

```xml
<match s3.**>
    ...
    <assume_role_credentials>
        role_arn arn:aws:iam::account-b:role/s3-log-role
        role_session_name s3-log-session
    </assume_role_credentials>
</match>
```

If we run s3 ls command again, we should see a list of gzipped logs in our bucket.

```less
2021-12-03 16:17:50          0
2021-12-03 16:33:09       3248 2021120315_0.gz
2021-12-03 16:33:10      27203 2021120315_1.gz
2021-12-03 16:33:14       1793 2021120315_2.gz
```

## Recap

The number of raw materials we compose in our setup is a lot, frankly. If we zoom out our binocular lens, the groundwork will look simply like this.

```
Streaming EC2 logs in account-a to access an S3 bucket in account-b with fluentd
-> Defining EC2 role in account-a
-> Allowing EC2 role to perfom assume-role action in account-a
-> Defining S3 role in account-b
-> Trusting EC2 role to assume role S3 role in account-b
-> Getting S3 bucket access authenticated using EC2 role which assumes role S3 role in EC2 instances
-> Adjusting fluentd configuration to use assume role auth model.
```

In any case, if you’re interested in probing a further inquiry about substances we attribute in our construct, take a stab at visiting these great instructive articles below.

- [aws assume role](https://aws.amazon.com/premiumsupport/knowledge-center/iam-assume-role-cli/)
- [fluentd-s3-plugin](https://docs.fluentd.org/output/s3)
- [fluent-s3 with assume role](https://github.com/fluent/fluent-plugin-s3/blob/master/docs/credentials.md#assume_role_credentials-section)

Lastly, I put the full working code [here](https://github.com/ghapsara/guruhhapsara.dev/tree/master/src/content/2021-12-24-ec2-s3-logging-with-fluentd/samples). Thanks for reading.
