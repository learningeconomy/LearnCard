# Bootstrap cannot initialize an S3 backend before its bucket exists. Leave this
# commented for the first apply in EACH isolated environment directory; then
# uncomment and migrate that directory's local state as described in README.md.
# terraform {
#   backend "s3" {
#     encrypt      = true
#     use_lockfile = true
#   }
# }
