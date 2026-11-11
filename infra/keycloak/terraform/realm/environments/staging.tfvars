environment         = "staging"
expected_account_id = "281762601323"
aws_region          = "us-east-1"
# Each provider needs its <realm>/google or <realm>/apple secret in this account.
social_providers = ["google", "apple"]
# Pair with generated/keycloak-staging.tfvars.json (tenant stage differs).
