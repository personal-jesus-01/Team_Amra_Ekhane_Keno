export const dashboardStats = {
  totalUsers: 12847,
  activeSubscriptions: 8234,
  slidesToday: 1456,
  slidesWeek: 8923,
  slidesMonth: 34521,
  aiCreditsConsumed: 456789,
  totalRevenue: 2345600,
  monthlyRevenue: 234560,
};

export const recentActivities = [
  { id: 1, type: 'user_signup', user: 'Ahmed Rahman', time: '2 min ago', icon: 'user-plus' },
  { id: 2, type: 'slide_generated', user: 'Fatima Khan', time: '5 min ago', icon: 'presentation' },
  { id: 3, type: 'payment', user: 'Rafiq Islam', amount: 499, time: '12 min ago', icon: 'credit-card' },
  { id: 4, type: 'assessment', user: 'Nadia Begum', score: 87, time: '18 min ago', icon: 'mic' },
  { id: 5, type: 'subscription', user: 'Karim Hassan', plan: 'Pro', time: '25 min ago', icon: 'crown' },
  { id: 6, type: 'ocr_process', user: 'Salma Akter', pages: 12, time: '32 min ago', icon: 'scan' },
];

export const systemHealth = {
  apiStatus: 'operational',
  ocrService: 'operational',
  speechService: 'operational',
  database: 'operational',
  storage: 'warning',
  bkashGateway: 'operational',
};

export const users = [
  { id: 1, name: 'Ahmed Rahman', email: 'ahmed@example.com', plan: 'Pro', status: 'active', slides: 234, joinDate: '2024-01-15', lastActive: '2 hours ago' },
  { id: 2, name: 'Fatima Khan', email: 'fatima@example.com', plan: 'Enterprise', status: 'active', slides: 567, joinDate: '2024-02-20', lastActive: '5 min ago' },
  { id: 3, name: 'Rafiq Islam', email: 'rafiq@example.com', plan: 'Basic', status: 'active', slides: 45, joinDate: '2024-03-10', lastActive: '1 day ago' },
  { id: 4, name: 'Nadia Begum', email: 'nadia@example.com', plan: 'Pro', status: 'suspended', slides: 189, joinDate: '2024-01-28', lastActive: '5 days ago' },
  { id: 5, name: 'Karim Hassan', email: 'karim@example.com', plan: 'Pro', status: 'active', slides: 312, joinDate: '2024-04-05', lastActive: '3 hours ago' },
  { id: 6, name: 'Salma Akter', email: 'salma@example.com', plan: 'Basic', status: 'active', slides: 78, joinDate: '2024-05-12', lastActive: '30 min ago' },
  { id: 7, name: 'Imran Hossain', email: 'imran@example.com', plan: 'Enterprise', status: 'active', slides: 891, joinDate: '2023-11-20', lastActive: '1 hour ago' },
  { id: 8, name: 'Rima Sultana', email: 'rima@example.com', plan: 'Pro', status: 'active', slides: 156, joinDate: '2024-06-01', lastActive: '15 min ago' },
];

export const subscriptionPlans = [
  { id: 1, name: 'Basic', price: 299, currency: 'BDT', aiCredits: 100, ocrPages: 50, storage: '1GB', features: ['Basic OCR', 'Standard slides', 'Email support'], active: 2341 },
  { id: 2, name: 'Pro', price: 799, currency: 'BDT', aiCredits: 500, ocrPages: 200, storage: '10GB', features: ['Advanced OCR', 'Premium slides', 'Bangla speech', 'Priority support'], active: 4521 },
  { id: 3, name: 'Enterprise', price: 1999, currency: 'BDT', aiCredits: 2000, ocrPages: 1000, storage: '100GB', features: ['Unlimited OCR', 'Custom templates', 'API access', 'Dedicated support', 'Analytics'], active: 1372 },
];

export const slides = [
  { id: 1, title: 'Q4 Business Review', user: 'Ahmed Rahman', createdAt: '2025-01-07', quality: 92, source: 'PDF', slides: 24, status: 'completed' },
  { id: 2, title: 'Marketing Strategy 2025', user: 'Fatima Khan', createdAt: '2025-01-07', quality: 88, source: 'DOCX', slides: 18, status: 'completed' },
  { id: 3, title: 'Product Launch Deck', user: 'Karim Hassan', createdAt: '2025-01-06', quality: 95, source: 'Image', slides: 32, status: 'completed' },
  { id: 4, title: 'Financial Report', user: 'Imran Hossain', createdAt: '2025-01-06', quality: 78, source: 'PDF', slides: 15, status: 'needs_review' },
  { id: 5, title: 'Training Materials', user: 'Salma Akter', createdAt: '2025-01-05', quality: 85, source: 'DOCX', slides: 42, status: 'completed' },
  { id: 6, title: 'Sales Pitch', user: 'Rima Sultana', createdAt: '2025-01-05', quality: 91, source: 'PDF', slides: 12, status: 'completed' },
];

export const aiUsageData = {
  daily: [
    { date: 'Mon', ocr: 1200, slideGen: 890, speechEn: 234, speechBn: 156 },
    { date: 'Tue', ocr: 1350, slideGen: 920, speechEn: 267, speechBn: 189 },
    { date: 'Wed', ocr: 1100, slideGen: 780, speechEn: 198, speechBn: 145 },
    { date: 'Thu', ocr: 1450, slideGen: 1020, speechEn: 312, speechBn: 234 },
    { date: 'Fri', ocr: 1600, slideGen: 1150, speechEn: 345, speechBn: 278 },
    { date: 'Sat', ocr: 890, slideGen: 560, speechEn: 156, speechBn: 112 },
    { date: 'Sun', ocr: 720, slideGen: 480, speechEn: 123, speechBn: 98 },
  ],
  totalCredits: 1000000,
  usedCredits: 456789,
  ocrProcessed: 23456,
  slidesGenerated: 34521,
  speechEnglish: 8923,
  speechBangla: 5678,
};

export const assessments = [
  { id: 1, user: 'Ahmed Rahman', title: 'Q4 Review Presentation', date: '2025-01-07', score: 87, language: 'English', duration: '12:34', pace: 'Good', clarity: 92 },
  { id: 2, user: 'Fatima Khan', title: 'Marketing Pitch', date: '2025-01-07', score: 94, language: 'Bangla', duration: '8:45', pace: 'Excellent', clarity: 96 },
  { id: 3, user: 'Karim Hassan', title: 'Product Demo', date: '2025-01-06', score: 78, language: 'English', duration: '15:22', pace: 'Slow', clarity: 82 },
  { id: 4, user: 'Nadia Begum', title: 'Team Update', date: '2025-01-06', score: 85, language: 'Bangla', duration: '6:18', pace: 'Good', clarity: 88 },
  { id: 5, user: 'Imran Hossain', title: 'Investor Pitch', date: '2025-01-05', score: 91, language: 'English', duration: '10:45', pace: 'Excellent', clarity: 94 },
];

export const payments = [
  { id: 'TXN001', user: 'Ahmed Rahman', amount: 799, status: 'completed', date: '2025-01-07 14:23', bkashId: 'BK123456789', plan: 'Pro' },
  { id: 'TXN002', user: 'Fatima Khan', amount: 1999, status: 'completed', date: '2025-01-07 12:45', bkashId: 'BK987654321', plan: 'Enterprise' },
  { id: 'TXN003', user: 'Rafiq Islam', amount: 299, status: 'pending', date: '2025-01-07 11:30', bkashId: 'BK456789123', plan: 'Basic' },
  { id: 'TXN004', user: 'Karim Hassan', amount: 799, status: 'completed', date: '2025-01-06 16:20', bkashId: 'BK789123456', plan: 'Pro' },
  { id: 'TXN005', user: 'Salma Akter', amount: 299, status: 'failed', date: '2025-01-06 09:15', bkashId: 'BK321654987', plan: 'Basic' },
  { id: 'TXN006', user: 'Imran Hossain', amount: 1999, status: 'completed', date: '2025-01-05 18:40', bkashId: 'BK654987321', plan: 'Enterprise' },
];

export const supportTickets = [
  { id: 'TKT001', user: 'Ahmed Rahman', subject: 'OCR not recognizing Bangla text', status: 'open', priority: 'high', created: '2025-01-07', lastUpdate: '2 hours ago' },
  { id: 'TKT002', user: 'Fatima Khan', subject: 'Payment verification issue', status: 'in_progress', priority: 'medium', created: '2025-01-06', lastUpdate: '1 day ago' },
  { id: 'TKT003', user: 'Rafiq Islam', subject: 'Cannot download slides', status: 'resolved', priority: 'low', created: '2025-01-05', lastUpdate: '2 days ago' },
  { id: 'TKT004', user: 'Nadia Begum', subject: 'Speech recognition accuracy', status: 'open', priority: 'medium', created: '2025-01-07', lastUpdate: '5 hours ago' },
  { id: 'TKT005', user: 'Karim Hassan', subject: 'API integration help needed', status: 'in_progress', priority: 'high', created: '2025-01-04', lastUpdate: '3 days ago' },
];

export const auditLogs = [
  { id: 1, admin: 'Super Admin', action: 'User suspended', target: 'nadia@example.com', timestamp: '2025-01-07 15:30:22', ip: '192.168.1.100' },
  { id: 2, admin: 'Support Admin', action: 'Refund processed', target: 'TXN005', timestamp: '2025-01-07 14:22:15', ip: '192.168.1.101' },
  { id: 3, admin: 'Super Admin', action: 'Plan modified', target: 'Pro Plan', timestamp: '2025-01-07 12:15:45', ip: '192.168.1.100' },
  { id: 4, admin: 'Moderator', action: 'Ticket resolved', target: 'TKT003', timestamp: '2025-01-06 18:45:30', ip: '192.168.1.102' },
  { id: 5, admin: 'Super Admin', action: 'System backup', target: 'Full backup', timestamp: '2025-01-06 03:00:00', ip: '192.168.1.100' },
  { id: 6, admin: 'Support Admin', action: 'User credits added', target: 'ahmed@example.com', timestamp: '2025-01-05 16:20:10', ip: '192.168.1.101' },
];

export const revenueData = [
  { month: 'Aug', revenue: 185000 },
  { month: 'Sep', revenue: 198000 },
  { month: 'Oct', revenue: 212000 },
  { month: 'Nov', revenue: 225000 },
  { month: 'Dec', revenue: 234560 },
  { month: 'Jan', revenue: 256000 },
];