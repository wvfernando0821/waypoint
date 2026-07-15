# Waypoint dev box

A single personal EC2 instance running Postgres + Redis in Docker, for
local development of `orchestrator/` (M3) — not part of the platform's own
Terraform (that's M8, and templates infrastructure for *migrated customer
apps*, a completely different thing from this dev box).

**Security model:** Postgres and Redis are bound to `127.0.0.1` on the
instance — never reachable from the internet. The only open port is SSH
(22), locked to one IP (`var.allowed_ip`). You reach the databases through
an SSH tunnel; the orchestrator app itself keeps running on your own
machine.

**Cost:** t3.micro ≈ $0.0104/hr in ap-southeast-1 while running (may be
free-tier eligible), plus a small EBS volume charge (~$0.64/mo) even when
stopped. `terraform apply` creates real billable resources.

## First-time setup

```
terraform init
terraform apply
```

Review the plan before confirming. Note the `public_ip` and
`ssh_tunnel_command` outputs; get `database_url` with:

```
terraform output -raw database_url
```

## Day to day

**Start using it:**
```
aws ec2 start-instances --instance-ids $(terraform output -raw instance_id)
```

Then open the tunnel (keep this terminal open while you work):
```
$(terraform output -raw ssh_tunnel_command)
```

**Done for the day — stop it to stop the compute charge** (this keeps the
disk/containers, just pauses billing for the instance itself):
```
aws ec2 stop-instances --instance-ids $(terraform output -raw instance_id)
```

**Your IP changed and SSH stopped working:** update `terraform.tfvars`
(`allowed_ip`, gitignored — it's local machine-specific config) with your
current public IP (`curl -s https://checkip.amazonaws.com`), then
`terraform apply` again.

**Permanently done with this box:**
```
terraform destroy
```

## Files that must never be committed

`terraform.tfstate*` contains the generated SSH private key and the
Postgres password in plaintext. `*.pem` is the private key itself.
`terraform.tfvars` holds your IP. All three are gitignored — double-check
`git status` shows none of them before pushing.
