output "ec2_public_ip" {
  description = "Elastic IP of the preview EC2 instance"
  value       = aws_eip.preview.public_ip
}

output "ec2_instance_id" {
  description = "EC2 instance ID"
  value       = aws_instance.preview.id
}

output "lambda_function_url" {
  description = "Lambda Function URL (use as PREVIEW_EC2_LAMBDA_URL secret)"
  value       = trimright(aws_lambda_function_url.preview_manager.function_url, "/")
}

output "ssh_command" {
  description = "SSH command to connect to the preview server"
  value       = "ssh -i <private_key> ubuntu@${aws_eip.preview.public_ip}"
}

output "wildcard_dns" {
  description = "Wildcard DNS record created"
  value       = "*.${var.base_domain} → ${aws_eip.preview.public_ip}"
}

output "github_secrets_summary" {
  description = "Values to configure as GitHub secrets in the 'preview' environment"
  value = {
    PREVIEW_EC2_LAMBDA_URL = trimright(aws_lambda_function_url.preview_manager.function_url, "/")
    PREVIEW_EC2_USERNAME   = "ubuntu"
    PREVIEW_EC2_SSH_KEY    = "<contents of your private key file>"
    PREVIEW_EC2_API_KEY    = "<the api_key you set in terraform.tfvars>"
  }
}
