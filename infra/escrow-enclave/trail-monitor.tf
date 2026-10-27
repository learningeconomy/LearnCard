# Direct EventBridge -> SNS: no monitor Lambda or CloudWatch metric dependency.
# Bootstrap owns these deterministic names; no reverse state dependency.
#
# 2026-10-23 staging incident: an SCP-denied `StopLogging` produced ZERO
# invocations. CloudTrail still emits the event, but `requestParameters` is
# `null` once a deny short-circuits the call (confirmed via `lookup-events`),
# so the name/trailName/bucketName branches below never matched a denied
# attempt -- exactly the case most worth alerting on. Fix: every branch has a
# sibling keyed on `errorCode` (prefix "AccessDenied", same convention as
# authority-monitor.tf's `denied_write`) instead of requestParameters. This
# account has exactly one trail and four buckets (audit and artifacts in
# storage.tf; the CloudTrail log and tfstate buckets in bootstrap), so dropping
# the resource-name constraint only for denied calls just widens scope to "any
# denied call to these APIs in this account" -- an accepted false-positive
# tradeoff here (alerting > missing a real tamper attempt). Successful calls
# still require naming this trail/bucket.
resource "aws_cloudwatch_event_rule" "trail_tamper" {
  name = "${local.name_prefix}-trail-tamper"
  event_pattern = jsonencode({
    "detail-type" = ["AWS API Call via CloudTrail"],
    "$or" = [
      { source = ["aws.cloudtrail"], detail = {
        eventSource       = ["cloudtrail.amazonaws.com"],
        eventName         = ["StopLogging", "DeleteTrail", "UpdateTrail", "PutEventSelectors", "PutInsightSelectors"],
        requestParameters = { name = ["${local.name_prefix}-audit", "arn:${data.aws_partition.current.partition}:cloudtrail:${var.aws_region}:${data.aws_caller_identity.current.account_id}:trail/${local.name_prefix}-audit"] }
      } },
      { source = ["aws.cloudtrail"], detail = {
        eventSource       = ["cloudtrail.amazonaws.com"],
        eventName         = ["PutEventSelectors", "PutInsightSelectors"],
        requestParameters = { trailName = ["${local.name_prefix}-audit", "arn:${data.aws_partition.current.partition}:cloudtrail:${var.aws_region}:${data.aws_caller_identity.current.account_id}:trail/${local.name_prefix}-audit"] }
      } },
      # Denied CloudTrail tamper attempts (requestParameters unreliable once
      # an SCP/IAM deny short-circuits the call -- see header comment).
      { source = ["aws.cloudtrail"], detail = {
        eventSource = ["cloudtrail.amazonaws.com"],
        eventName   = ["StopLogging", "DeleteTrail", "UpdateTrail", "PutEventSelectors", "PutInsightSelectors"],
        errorCode   = [{ prefix = "AccessDenied" }]
      } },
      { source = ["aws.s3"], detail = {
        eventSource       = ["s3.amazonaws.com"],
        eventName         = ["PutBucketPolicy", "DeleteBucketPolicy", "PutObjectLockConfiguration", "PutBucketLifecycle", "PutBucketLifecycleConfiguration", "PutBucketVersioning", "PutBucketEncryption", "PutBucketReplication", "DeleteBucketEncryption", "DeleteBucketLifecycle", "DeleteBucketReplication", "PutBucketPublicAccessBlock", "DeleteBucketPublicAccessBlock", "PutBucketOwnershipControls", "DeleteBucketOwnershipControls", "PutBucketAcl", "PutObjectAcl"],
        requestParameters = { bucketName = ["learncard-escrow-cloudtrail-${var.environment}-${data.aws_caller_identity.current.account_id}"] }
      } },
      # Denied S3 tamper attempts. The null-requestParameters behavior was
      # observed for CloudTrail; S3's denied-call shape is verified by drill 3
      # (STAGING.md). Denied calls on any of the four buckets in this account
      # page as trail tamper -- the same accepted false-positive tradeoff.
      { source = ["aws.s3"], detail = {
        eventSource = ["s3.amazonaws.com"],
        eventName   = ["PutBucketPolicy", "DeleteBucketPolicy", "PutObjectLockConfiguration", "PutBucketLifecycle", "PutBucketLifecycleConfiguration", "PutBucketVersioning", "PutBucketEncryption", "PutBucketReplication", "DeleteBucketEncryption", "DeleteBucketLifecycle", "DeleteBucketReplication", "PutBucketPublicAccessBlock", "DeleteBucketPublicAccessBlock", "PutBucketOwnershipControls", "DeleteBucketOwnershipControls", "PutBucketAcl", "PutObjectAcl"],
        errorCode   = [{ prefix = "AccessDenied" }]
      } },
    ]
  })
}

resource "aws_cloudwatch_event_target" "trail_tamper" {
  rule  = aws_cloudwatch_event_rule.trail_tamper.name
  arn   = aws_sns_topic.monitor.arn
  input = jsonencode({ alarm = "EscrowCloudTrailTamper", response = "Review bootstrap-owned trail and log bucket changes immediately; suspend recovery if unauthorized." })
  dead_letter_config { arn = aws_sqs_queue.monitor_dlq.arn }
}
