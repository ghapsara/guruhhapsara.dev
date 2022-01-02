resource "aws_iam_instance_profile" "eb_instance_profile" {
  name = "eb-instance-profile"
  role = aws_iam_role.eb_role.name
}

resource "aws_elastic_beanstalk_environment" "eb_env" {
	#...
	setting {
		namespace = "aws:autoscaling:launchconfiguration"
		name      = "IamInstanceProfile"
		value     = "${aws_iam_instance_profile.eb_instance_profile.name}"
	}
}