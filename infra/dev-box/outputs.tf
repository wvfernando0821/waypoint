output "instance_id" {
  value = aws_instance.dev_box.id
}

output "public_ip" {
  value = aws_instance.dev_box.public_ip
}

output "ssh_tunnel_command" {
  description = "Run this in its own terminal, keep it open while using the orchestrator."
  value       = "ssh -i ${local_sensitive_file.private_key.filename} -N -L 5432:localhost:5432 -L 6379:localhost:6379 ec2-user@${aws_instance.dev_box.public_ip}"
}

output "database_url" {
  description = "Put this in orchestrator/.env as DATABASE_URL (only reachable once the SSH tunnel is open)."
  value       = "postgres://postgres:${random_password.postgres.result}@localhost:5432/waypoint"
  sensitive   = true
}
