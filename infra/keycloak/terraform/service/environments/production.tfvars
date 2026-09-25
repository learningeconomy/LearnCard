environment          = "production"
expected_account_id  = "206533012615"
aws_region           = "us-east-1"
task_cpu             = 2048
task_memory          = 4096
desired_count        = 2
min_task_count       = 2
max_task_count       = 6
db_min_capacity      = 2
db_max_capacity      = 16
db_instance_count    = 2
db_pool_size         = 10
db_connection_budget = 2000
waf_block_mode       = true
enable_aws_backup    = true
alarm_emails         = ["jackson@learningeconomy.io"]
# A human must explicitly acknowledge the temporary rotation risk at first apply.
