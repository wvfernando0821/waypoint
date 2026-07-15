variable "region" {
  description = "AWS region for the dev box"
  type        = string
  default     = "ap-southeast-1"
}

variable "allowed_ip" {
  description = "Public IP allowed to SSH into the dev box (no CIDR suffix, e.g. \"35.183.15.149\")"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}
