terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
    local = {
      source  = "hashicorp/local"
      version = "~> 2.5"
    }
  }
}

provider "aws" {
  region = var.region
}

# Reuse the account's default VPC/subnet — this is a single personal dev
# box, not worth building dedicated networking for.
data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# Avoids hardcoding an AMI id that eventually rots.
data "aws_ssm_parameter" "al2023_ami" {
  name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64"
}

resource "tls_private_key" "dev_box" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "aws_key_pair" "dev_box" {
  key_name   = "waypoint-dev-box"
  public_key = tls_private_key.dev_box.public_key_openssh
}

# Written locally so no pre-existing keypair is required. Gitignored —
# never commit this file.
resource "local_sensitive_file" "private_key" {
  filename        = "${path.module}/waypoint-dev-box.pem"
  content         = tls_private_key.dev_box.private_key_pem
  file_permission = "0600"
}

resource "random_password" "postgres" {
  length  = 24
  special = false
}

resource "aws_security_group" "dev_box" {
  name        = "waypoint-dev-box"
  description = "SSH only, locked to the current developer public IP"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description = "SSH from developer IP"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["${var.allowed_ip}/32"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "waypoint-dev-box"
  }
}

resource "aws_instance" "dev_box" {
  ami                    = data.aws_ssm_parameter.al2023_ami.value
  instance_type          = var.instance_type
  key_name               = aws_key_pair.dev_box.key_name
  subnet_id              = data.aws_subnets.default.ids[0]
  vpc_security_group_ids = [aws_security_group.dev_box.id]

  root_block_device {
    volume_size = 8
    volume_type = "gp3"
  }

  # Installs Docker, writes docker-compose.yml, and starts Postgres + Redis
  # bound to 127.0.0.1 only — never exposed beyond the box itself.
  user_data = templatefile("${path.module}/user_data.sh.tftpl", {
    docker_compose_yml = templatefile("${path.module}/docker-compose.yml.tftpl", {
      postgres_password = random_password.postgres.result
    })
  })

  tags = {
    Name = "waypoint-dev-box"
  }
}
