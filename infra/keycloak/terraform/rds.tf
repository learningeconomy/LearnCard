locals {
  db_engine_version = "16.14"
  private_azs       = sort(tolist(toset([for subnet in data.aws_subnet.private : subnet.availability_zone])))
  # ARN of the RDS-managed master-user secret ({"username","password"} JSON).
  db_master_secret_arn = aws_rds_cluster.keycloak.master_user_secret[0].secret_arn
}

resource "aws_db_subnet_group" "keycloak" {
  name       = local.name
  subnet_ids = var.private_subnet_ids

  lifecycle {
    precondition {
      condition     = alltrue([for subnet in data.aws_subnet.private : subnet.vpc_id == var.vpc_id]) && length(local.private_azs) >= 2
      error_message = "Private subnets must be in the selected VPC and span at least two availability zones."
    }
  }
}

resource "aws_rds_cluster" "keycloak" {
  cluster_identifier = local.name
  engine             = "aurora-postgresql"
  engine_version     = local.db_engine_version
  engine_mode        = "provisioned"
  database_name      = "keycloak"
  master_username    = "keycloak"
  # RDS generates, stores and rotates the master password in Secrets Manager.
  # Terraform never reads the value, so it never lands in state or saved plans.
  manage_master_user_password = true
  port                        = 5432
  db_subnet_group_name        = aws_db_subnet_group.keycloak.name
  vpc_security_group_ids      = [aws_security_group.db.id]
  storage_encrypted           = true
  backup_retention_period     = var.db_backup_retention_days
  deletion_protection         = var.db_deletion_protection
  copy_tags_to_snapshot       = true
  skip_final_snapshot         = var.environment != "production"
  final_snapshot_identifier   = "${local.name}-final"
  apply_immediately           = false

  serverlessv2_scaling_configuration {
    min_capacity = var.db_min_capacity
    max_capacity = var.db_max_capacity
  }

  lifecycle {
    precondition {
      condition     = var.db_max_capacity >= var.db_min_capacity
      error_message = "Maximum database capacity must be at least the minimum capacity."
    }
  }
}

resource "aws_rds_cluster_instance" "keycloak" {
  count                      = var.environment == "production" ? 2 : 1
  identifier                 = "${local.name}-${count.index + 1}"
  cluster_identifier         = aws_rds_cluster.keycloak.id
  engine                     = aws_rds_cluster.keycloak.engine
  engine_version             = aws_rds_cluster.keycloak.engine_version
  instance_class             = "db.serverless"
  db_subnet_group_name       = aws_db_subnet_group.keycloak.name
  availability_zone          = local.private_azs[count.index]
  publicly_accessible        = false
  auto_minor_version_upgrade = false
  copy_tags_to_snapshot      = true
  promotion_tier             = count.index
}
