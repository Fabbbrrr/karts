# AWS Deployment Guide - RaceFacer Analysis Server

This guide covers deploying the RaceFacer Analysis Server to AWS Free Tier.

## AWS Free Tier Services Used

- **EC2 t2.micro**: 750 hours/month (enough for 24/7 operation)
- **EBS Storage**: 30 GB General Purpose (SSD)
- **Data Transfer**: 15 GB/month outbound
- **CloudWatch**: Basic monitoring (10 metrics, 10 alarms)

## Deployment Options

### Option 1: EC2 with Docker (Recommended)

Best for: Full control, easy to maintain, Docker experience

#### Prerequisites
- AWS account with Free Tier eligibility
- AWS CLI installed locally
- SSH key pair created in AWS Console

#### Step 1: Launch EC2 Instance

```bash
# Launch t2.micro instance with Amazon Linux 2
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t2.micro \
  --key-name YOUR_KEY_NAME \
  --security-group-ids YOUR_SECURITY_GROUP_ID \
  --subnet-id YOUR_SUBNET_ID \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=RaceFacer-Analysis}]' \
  --user-data file://user-data.sh
```

#### Step 2: Configure Security Group

Allow inbound traffic:
- Port 22 (SSH) - Your IP only
- Port 3001 (HTTP API) - As needed
- Optional: Port 443 (HTTPS) if using SSL

```bash
# Create security group
aws ec2 create-security-group \
  --group-name racefacer-sg \
  --description "Security group for RaceFacer Analysis Server"

# Add rules
aws ec2 authorize-security-group-ingress \
  --group-id YOUR_SG_ID \
  --protocol tcp \
  --port 22 \
  --cidr YOUR_IP/32

aws ec2 authorize-security-group-ingress \
  --group-id YOUR_SG_ID \
  --protocol tcp \
  --port 3001 \
  --cidr 0.0.0.0/0
```

#### Step 3: Connect and Setup

```bash
# SSH into instance
ssh -i your-key.pem ec2-user@your-instance-ip

# Install Docker
sudo yum update -y
sudo yum install docker -y
sudo service docker start
sudo usermod -a -G docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version

# Log out and back in for group changes to take effect
exit
ssh -i your-key.pem ec2-user@your-instance-ip
```

#### Step 4: Deploy Application

```bash
# Clone or copy your application
git clone YOUR_REPO_URL racefacer-server
cd racefacer-server

# Create environment file
cat > server/.env << EOL
NODE_ENV=production
PORT=3001
WS_HOST=your-timing-system-host
WS_PORT=8131
WS_PROTOCOL=ws
LOG_LEVEL=info
MAX_SESSIONS=50
ALLOWED_ORIGINS=*
EOL

# Build and start services
docker-compose up -d --build

# Check status
docker-compose ps
docker-compose logs -f
```

#### Step 5: Setup Auto-Start on Reboot

```bash
# Create systemd service
sudo tee /etc/systemd/system/racefacer.service > /dev/null <<EOL
[Unit]
Description=RaceFacer Analysis Server
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/ec2-user/racefacer-server
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
User=ec2-user

[Install]
WantedBy=multi-user.target
EOL

# Enable and start service
sudo systemctl enable racefacer
sudo systemctl start racefacer
```

### Option 2: Elastic Beanstalk (Easiest)

Best for: Minimal AWS experience, automatic scaling

#### Step 1: Install EB CLI

```bash
pip install awsebcli --upgrade --user
```

#### Step 2: Initialize Elastic Beanstalk

```bash
cd server
eb init -p docker racefacer-analysis --region us-east-1
```

#### Step 3: Create Environment

```bash
# Create environment (free tier eligible)
eb create racefacer-prod \
  --instance-type t2.micro \
  --single

# Set environment variables
eb setenv \
  NODE_ENV=production \
  WS_HOST=your-timing-system-host \
  WS_PORT=8131 \
  LOG_LEVEL=info
```

#### Step 4: Deploy

```bash
eb deploy
eb open
```

### Option 3: AWS Lightsail (Simplest)

Best for: Beginners, fixed pricing, simple setup

#### Step 1: Create Instance

1. Go to AWS Lightsail Console
2. Create Instance
3. Choose Linux/Unix platform
4. Select "OS Only" → Ubuntu 20.04 LTS
5. Choose $5/month plan (includes free tier credits)
6. Name it "racefacer-analysis"

#### Step 2: Connect via SSH

```bash
# From Lightsail console, use SSH directly or download key
ssh -i lightsail-key.pem ubuntu@your-instance-ip

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Log out and back in
exit
```

#### Step 3: Deploy (same as EC2 Step 4)

## Post-Deployment Configuration

### 1. Setup CloudWatch Monitoring (Free Tier)

```bash
# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
sudo rpm -U ./amazon-cloudwatch-agent.rpm

# Configure monitoring (create config file)
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-config-wizard

# Start agent
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config \
  -m ec2 \
  -s \
  -c file:/opt/aws/amazon-cloudwatch-agent/config.json
```

### 2. Setup CloudWatch Alarms

```bash
# Create alarm for high CPU
aws cloudwatch put-metric-alarm \
  --alarm-name racefacer-high-cpu \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/EC2 \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --dimensions Name=InstanceId,Value=YOUR_INSTANCE_ID
```

### 3. Setup Log Rotation

```bash
# Create logrotate config
sudo tee /etc/logrotate.d/racefacer > /dev/null <<EOL
/home/ec2-user/racefacer-server/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    missingok
    copytruncate
}
EOL
```

### 4. Setup Backup Script

```bash
# Create backup script
cat > ~/backup-racefacer.sh << 'EOL'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/ec2-user/backups"
mkdir -p $BACKUP_DIR

# Backup storage directory
tar -czf $BACKUP_DIR/storage_$DATE.tar.gz -C /home/ec2-user/racefacer-server storage/

# Keep only last 7 backups
ls -t $BACKUP_DIR/storage_*.tar.gz | tail -n +8 | xargs -r rm

echo "Backup completed: storage_$DATE.tar.gz"
EOL

chmod +x ~/backup-racefacer.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /home/ec2-user/backup-racefacer.sh") | crontab -
```

## Maintenance Commands

```bash
# View logs
docker-compose logs -f

# Restart service
docker-compose restart

# Update application
git pull
docker-compose down
docker-compose up -d --build

# Check disk space
df -h

# Clean up Docker
docker system prune -a

# View resource usage
htop
docker stats
```

## Cost Optimization Tips

1. **Use spot instances** for non-critical testing (up to 90% savings)
2. **Stop instance when not needed** (only pay for storage)
3. **Setup auto-shutdown** for non-business hours if applicable
4. **Monitor billing** with AWS Budgets (free)
5. **Use S3 for logs** older than 7 days (cheaper than EBS)

## Monitoring & Alerts

### Check Server Health

```bash
# Health check
curl http://your-server-ip:3001/health

# API stats
curl http://your-server-ip:3001/api/stats

# Current analysis
curl http://your-server-ip:3001/api/current
```

### Setup Email Alerts

Use AWS SNS (Simple Notification Service) - Free Tier includes:
- 1,000 email deliveries/month
- 100 SMS messages/month

```bash
# Create SNS topic
aws sns create-topic --name racefacer-alerts

# Subscribe email
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:YOUR_ACCOUNT_ID:racefacer-alerts \
  --protocol email \
  --notification-endpoint your-email@example.com
```

## Troubleshooting

### Server Not Responding

```bash
# Check if Docker is running
sudo systemctl status docker

# Check container status
docker ps -a

# View recent logs
docker-compose logs --tail=100

# Restart everything
docker-compose restart
```

### WebSocket Connection Issues

```bash
# Test WebSocket connectivity
telnet your-timing-system-host 8131

# Check firewall rules
sudo iptables -L -n

# Check DNS resolution
nslookup your-timing-system-host
```

### High Memory Usage

```bash
# Check memory
free -h

# Check container memory
docker stats

# Restart container
docker-compose restart racefacer-analysis
```

## Security Best Practices

1. ✅ Use security groups to restrict access
2. ✅ Keep system updated: `sudo yum update -y`
3. ✅ Use SSH keys only (no password authentication)
4. ✅ Setup fail2ban for SSH protection
5. ✅ Use HTTPS with Let's Encrypt (free SSL)
6. ✅ Regular backups
7. ✅ Monitor logs for suspicious activity

## Performance Tuning

### For t2.micro (1GB RAM):

```bash
# Optimize Node.js memory
export NODE_OPTIONS="--max-old-space-size=768"

# Add to docker-compose environment
  environment:
    - NODE_OPTIONS=--max-old-space-size=768
```

### Enable Swap (for low memory situations):

```bash
sudo dd if=/dev/zero of=/swapfile bs=1M count=1024
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## Next Steps

1. ✅ Deploy server to AWS
2. ✅ Test WebSocket connection to timing system
3. ✅ Verify data collection is working
4. ✅ Setup monitoring and alerts
5. ✅ Configure automatic backups
6. 🔄 Wait 24-48 hours to verify stability
7. 🔄 Migrate web app to use server API (Phase 2)

## Support

For issues or questions:
- Check logs: `docker-compose logs`
- Review documentation in server/README.md
- AWS Support (Free Basic Support included)

