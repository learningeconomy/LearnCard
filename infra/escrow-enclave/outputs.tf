output "nlb_dns_name" {
  description = "DNS name of the internal Network Load Balancer fronting the escrow enclave-host ASG. lca-api's remote enclave client should target https://<nlb_dns_name>:8443."
  value       = aws_lb.enclave_host.dns_name
}

output "asg_name" {
  description = "Name of the enclave-host Auto Scaling Group."
  value       = aws_autoscaling_group.enclave_host.name
}

output "security_group_id" {
  description = "ID of the security group attached to enclave-host instances (ingress: 8443 from lca_api_security_group_id, 8444 from the VPC CIDR)."
  value       = aws_security_group.enclave_host.id
}

output "launch_template_id" {
  description = "ID of the enclave-host launch template (Nitro-enabled, AL2023, IMDSv2-only)."
  value       = aws_launch_template.enclave_host.id
}
