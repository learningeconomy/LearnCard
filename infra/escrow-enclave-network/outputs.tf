output "vpc_id" {
  value = aws_vpc.this.id
}

output "vpc_cidr" {
  value = aws_vpc.this.cidr_block
}

output "private_subnet_ids" {
  value = [for id in var.availability_zone_ids : aws_subnet.private[id].id]
}

output "nat_public_ips" {
  description = "Egress IPs, e.g. for allowlisting at a Roughtime operator."
  value       = [for eip in aws_eip.nat : eip.public_ip]
}
