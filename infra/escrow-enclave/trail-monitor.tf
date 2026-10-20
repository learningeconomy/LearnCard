# Direct EventBridge -> SNS: no monitor Lambda or CloudWatch metric dependency.
# Bootstrap owns these deterministic names; no reverse state dependency.
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
      { source = ["aws.s3"], detail = {
        eventSource       = ["s3.amazonaws.com"],
        eventName         = ["PutBucketPolicy", "DeleteBucketPolicy", "PutObjectLockConfiguration", "PutBucketLifecycle", "PutBucketLifecycleConfiguration", "PutBucketVersioning", "PutBucketEncryption", "PutBucketReplication", "DeleteBucketEncryption", "DeleteBucketLifecycle", "DeleteBucketReplication", "PutBucketPublicAccessBlock", "DeleteBucketPublicAccessBlock", "PutBucketOwnershipControls", "DeleteBucketOwnershipControls", "PutBucketAcl", "PutObjectAcl"],
        requestParameters = { bucketName = ["learncard-escrow-cloudtrail-${var.environment}-${data.aws_caller_identity.current.account_id}"] }
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
