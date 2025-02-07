# Troubleshooting Guide

## Common Issues

### 1. Local Development

#### Issue: Deno Cache Problems 
`deno cache --reload`

#### Issue: Permission Errors
Ensure you're running with correct permissions: 
`chmod +x apps/data-prep/main.ts`
`deno task start:data-prep --allow-net --allow-read --allow-write`

### 2. Kubernetes

#### Issue: Service Not Starting
Check logs: 
`kubectl logs <pod-name>`

### 3. External Services

#### Issue: Service-1 Connection Timeouts
1. Check VPN connection
2. Verify service health
3. Check rate limits

## Support

### Getting Help
1. Check existing documentation
2. Search JIRA tickets
3. Contact team on Slack
4. Create support ticket

### Reporting Bugs
1. Check if bug exists in JIRA
2. Create detailed report
3. Include reproduction steps
4. Attach relevant logs
