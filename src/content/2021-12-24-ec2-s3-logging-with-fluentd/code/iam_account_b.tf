resource "aws_iam_role" "s3_role" {
	name							  = "s3-role"
	assume_role_policy  = file("s3-trust-policy.json")

  inline_policy {
    name = "s3-log-policy"
    policy = file("s3-log-policy.json")
  }
}