# 外部访问配置指南

## 概述
本项目已配置为支持外部访问。所有服务现在都绑定到 `0.0.0.0`，这意味着它们可以从网络上的任何地址访问。

## 服务端口
- **前端服务**: 5173
- **评分服务**: 3000  
- **转换服务**: 5001

## 防火墙配置

### Ubuntu/Debian (使用 ufw)
```bash
# 启用防火墙
sudo ufw enable

# 允许必要的端口
sudo ufw allow 3000/tcp
sudo ufw allow 5001/tcp  
sudo ufw allow 5173/tcp

# 检查状态
sudo ufw status
```

### CentOS/RHEL (使用 firewalld)
```bash
# 启动防火墙服务
sudo systemctl start firewalld
sudo systemctl enable firewalld

# 允许必要的端口
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-port=5001/tcp
sudo firewall-cmd --permanent --add-port=5173/tcp

# 重新加载配置
sudo firewall-cmd --reload

# 检查状态
sudo firewall-cmd --list-ports
```

### 云服务器注意事项
如果你使用的是云服务器（如AWS、阿里云、腾讯云等），还需要在云控制台的安全组/防火墙规则中开放这些端口。

## 访问地址
启动脚本会自动检测并显示：
- 本地访问地址 (localhost)
- 局域网访问地址 (内网IP)
- 外网访问地址 (公网IP，如果可用)

## 安全建议

### 生产环境
1. **设置具体的CORS域名**: 在生产环境中，修改CORS配置以仅允许特定域名
2. **使用HTTPS**: 配置SSL证书以启用HTTPS访问
3. **API速率限制**: 已内置速率限制，但可根据需要调整
4. **身份验证**: 确保所有敏感操作都需要适当的身份验证

### 网络安全
1. **VPN访问**: 考虑通过VPN访问内部服务
2. **反向代理**: 使用Nginx或Apache作为反向代理
3. **端口监控**: 定期监控开放端口的使用情况

## 故障排除

### 检查服务是否正在监听
```bash
# 检查端口是否被占用
sudo netstat -tlnp | grep -E ':(3000|5001|5173)'

# 或使用 ss
sudo ss -tlnp | grep -E ':(3000|5001|5173)'

# 使用状态检查脚本
./status.sh
```

### 检查防火墙状态
```bash
# Ubuntu/Debian
sudo ufw status verbose

# CentOS/RHEL  
sudo firewall-cmd --list-all
```

### 测试连接
```bash
# 从其他机器测试连接
curl http://YOUR_SERVER_IP:3000/health
curl http://YOUR_SERVER_IP:5001/health
```

### 服务独立运行
服务现在使用 `setsid` 启动，这确保了：
- 服务完全独立于启动终端
- 关闭终端不会影响服务运行
- 服务在新的会话中运行，不受父进程影响

## 修改内容总结

1. **后端服务绑定**: 将 Express 服务器绑定到 `0.0.0.0` 而不是默认的 localhost
2. **前端服务配置**: 修改 Vite 配置以在 `0.0.0.0` 上提供服务
3. **CORS配置**: 更新CORS策略以在开发环境中允许所有来源
4. **启动脚本**: 增强启动脚本以显示所有可用的访问地址
5. **类型安全**: 修复TypeScript类型问题
6. **守护进程**: 使用 `setsid` 确保服务完全独立于终端运行
7. **状态检查**: 新增 `status.sh` 脚本用于检查服务运行状态

## 使用方法

### 启动服务
```bash
./start.sh
```
启动后可以安全地关闭终端，服务会继续运行。

### 检查状态
```bash
./status.sh
```

### 停止服务
```bash
./stop.sh
```

现在你可以通过运行 `./start.sh` 来启动支持外部访问的服务，关闭终端后服务仍会继续运行！
