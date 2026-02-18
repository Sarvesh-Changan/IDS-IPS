const now = new Date();
const hour = 3600000;
const day = 86400000;

const alerts = [
  { id: 1, timestamp: new Date(now - 0.5 * hour).toISOString(), severity: 'Critical', category: 'DDOS', status: 'Escalated', device: 'Edge Firewall', color: '#ef5350' },
  { id: 2, timestamp: new Date(now - 1 * hour).toISOString(), severity: 'High', category: 'FTP Bruteforce', status: 'Escalated', device: 'FTP Gateway', color: '#ff6b6b' },
  { id: 3, timestamp: new Date(now - 2 * hour).toISOString(), severity: 'High', category: 'SSH Bruteforce', status: 'Escalated', device: 'SSH Bastion', color: '#ff6b6b' },
  { id: 4, timestamp: new Date(now - 12 * hour).toISOString(), severity: 'Medium', category: 'SQL Injection', status: 'Remediated', device: 'Web App Firewall', color: '#4caf50' },
  { id: 5, timestamp: new Date(now - 1 * day).toISOString(), severity: 'Medium', category: 'Bruteforce XSS', status: 'Remediated', device: 'API Gateway', color: '#4caf50' },
  { id: 6, timestamp: new Date(now - 2 * day).toISOString(), severity: 'Low', category: 'FTP Bruteforce', status: 'Remediated', device: 'FTP Gateway', color: '#fdd835' },
  { id: 7, timestamp: new Date(now - 3 * day).toISOString(), severity: 'Low', category: 'SSH Bruteforce', status: 'Remediated', device: 'SSH Bastion', color: '#fdd835' },
  { id: 8, timestamp: new Date(now - 8 * day).toISOString(), severity: 'High', category: 'DDOS', status: 'Escalated', device: 'Edge Firewall', color: '#ff6b6b' },
  { id: 9, timestamp: new Date(now - 10 * day).toISOString(), severity: 'Medium', category: 'SQL Injection', status: 'Remediated', device: 'Web App Firewall', color: '#4caf50' },
  { id: 10, timestamp: new Date(now - 14 * day).toISOString(), severity: 'Low', category: 'Bruteforce XSS', status: 'Remediated', device: 'API Gateway', color: '#fdd835' },
  { id: 11, timestamp: new Date(now - 20 * day).toISOString(), severity: 'Critical', category: 'DDOS', status: 'Escalated', device: 'Edge Firewall', color: '#ef5350' },
  { id: 12, timestamp: new Date(now - 25 * day).toISOString(), severity: 'High', category: 'FTP Bruteforce', status: 'Escalated', device: 'FTP Gateway', color: '#ff6b6b' },
  { id: 13, timestamp: new Date(now - 35 * day).toISOString(), severity: 'High', category: 'SSH Bruteforce', status: 'Escalated', device: 'SSH Bastion', color: '#ff6b6b' },
  { id: 14, timestamp: new Date(now - 45 * day).toISOString(), severity: 'Medium', category: 'SQL Injection', status: 'Remediated', device: 'Web App Firewall', color: '#4caf50' },
  { id: 15, timestamp: new Date(now - 55 * hour).toISOString(), severity: 'Medium', category: 'Bruteforce XSS', status: 'Remediated', device: 'API Gateway', color: '#4caf50' },
  { id: 16, timestamp: new Date(now - 70 * day).toISOString(), severity: 'Low', category: 'FTP Bruteforce', status: 'Remediated', device: 'FTP Gateway', color: '#fdd835' },
  { id: 17, timestamp: new Date(now - 85 * day).toISOString(), severity: 'Low', category: 'SSH Bruteforce', status: 'Remediated', device: 'SSH Bastion', color: '#fdd835' },
  { id: 18, timestamp: new Date(now - 100 * day).toISOString(), severity: 'High', category: 'DDOS', status: 'Escalated', device: 'Edge Firewall', color: '#ff6b6b' },
  { id: 19, timestamp: new Date(now - 120 * day).toISOString(), severity: 'Medium', category: 'SQL Injection', status: 'Remediated', device: 'Web App Firewall', color: '#4caf50' },
  { id: 20, timestamp: new Date(now - 150 * day).toISOString(), severity: 'Low', category: 'Bruteforce XSS', status: 'Remediated', device: 'API Gateway', color: '#fdd835' }
];

export default alerts;
