resource "aws_iam_role" "eb_role" {
  name        = "eb-role"
	assume_role_policy    = file("ec2-trust-policy.json")

  inline_policy {
    name = "eb-assume-role-policy"
    policy = file("eb-assume-role-policy.json")
  }
}