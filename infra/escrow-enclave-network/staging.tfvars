environment = "staging"

# use1-az4 is where the staging lca-api subnet lives (its account calls it
# us-east-1a); PrivateLink needs the escrow NLB in that AZ ID too.
availability_zone_ids = ["use1-az4", "use1-az2"]
