data "aws_ssm_parameter" "al2023_ami" {
  name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64"
}

resource "aws_launch_template" "enclave_host" {
  name_prefix            = "${local.name_prefix}-"
  description            = "escrow-enclave-host: AL2023 + Nitro Enclaves, image ${var.enclave_image_version}"
  image_id               = data.aws_ssm_parameter.al2023_ami.value
  instance_type          = var.instance_type
  update_default_version = true

  iam_instance_profile {
    name = var.instance_profile_name
  }

  enclave_options {
    enabled = true
  }

  # IMDSv2 required, hop limit 1 — no SSRF-via-IMDS path off this host.
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
    instance_metadata_tags      = "disabled"
  }

  block_device_mappings {
    device_name = "/dev/xvda"

    ebs {
      volume_size           = 30
      volume_type           = "gp3"
      encrypted             = true
      delete_on_termination = true
    }
  }

  # No public IP, no SSH key (key_name intentionally omitted). This block is
  # required (rather than top-level vpc_security_group_ids) specifically
  # because associate_public_ip_address only exists here.
  network_interfaces {
    associate_public_ip_address = false
    delete_on_termination       = true
    security_groups             = [aws_security_group.enclave_host.id]
  }

  user_data = base64encode(templatefile("${path.module}/templates/user-data.sh.tftpl", {
    aws_region            = var.aws_region
    enclave_cpu_count     = var.enclave_cpu_count
    enclave_memory_mib    = var.enclave_memory_mib
    eif_s3_uri            = var.eif_s3_uri
    enclave_image_version = var.enclave_image_version
    roughtime_servers_csv = join(",", [for s in var.roughtime_servers : "${s.host}:${s.port}"])
  }))

  tag_specifications {
    resource_type = "instance"
    tags          = merge(local.common_tags, { Name = local.name_prefix })
  }

  tag_specifications {
    resource_type = "volume"
    tags          = merge(local.common_tags, { Name = "${local.name_prefix}-volume" })
  }

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-lt" })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_autoscaling_group" "enclave_host" {
  name                      = "${local.name_prefix}-asg"
  min_size                  = var.asg_min_size
  max_size                  = var.asg_max_size
  desired_capacity          = var.asg_min_size
  vpc_zone_identifier       = var.private_subnet_ids
  health_check_type         = "ELB"
  health_check_grace_period = 300
  target_group_arns         = [aws_lb_target_group.enclave_host.arn]

  launch_template {
    id      = aws_launch_template.enclave_host.id
    version = "$Latest"
  }

  instance_refresh {
    strategy = "Rolling"
    preferences {
      min_healthy_percentage = 50
    }
  }

  # aws_autoscaling_group tags use a distinct {key,value,propagate_at_launch}
  # model that provider default_tags does NOT merge into automatically, so
  # common_tags must be applied explicitly here.
  dynamic "tag" {
    for_each = merge(local.common_tags, { Name = local.name_prefix })
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }
}
