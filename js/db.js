/**
 * WF World - Database Management System
 * Using LocalStorage/IndexedDB for client-side data storage
 */

class Database {
  constructor() {
    this.DB_NAME = 'raw123_world_db';
    this.version = '1.0.0';
    this.initializeDatabase();
  }

  /**
   * Initialize database structure
   */
  initializeDatabase() {
    if (!localStorage.getItem(this.DB_NAME)) {
      const initialData = {
        clients: [],
        subscriptions: [],
        plans: [],
        updates: [],
        settings: {
          nextClientCode: 1,
          nextSubscriptionId: 1,
          nextPlanId: 1,
          nextUpdateId: 1,
          currencies: ['EGP', 'USD', 'SAR', 'AED', 'EUR'],
          packages: [
            { name: 'Bronze', duration: 30, color: '#CD7F32' },
            { name: 'Silver', duration: 60, color: '#C0C0C0' },
            { name: 'Gold', duration: 90, color: '#FFD700' },
            { name: 'Platinum', duration: 120, color: '#E5E4E2' }
          ],
          paymentMethods: ['فودافون كاش', 'اتصالات كاش', 'Orange Cash', 'حساب بنكي', 'PayPal', 'نقدي']
        }
      };
      this.saveData(initialData);
    }
  }

  /**
   * Save entire database
   */
  saveData(data) {
    localStorage.setItem(this.DB_NAME, JSON.stringify(data));
  }

  /**
   * Load entire database
   */
  loadData() {
    const data = localStorage.getItem(this.DB_NAME);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Generate unique client code
   */
  generateClientCode() {
    const data = this.loadData();
    const code = `C${String(data.settings.nextClientCode).padStart(4, '0')}`;
    data.settings.nextClientCode++;
    this.saveData(data);
    return code;
  }

  /**
   * Generate unique subscription ID
   */
  generateSubscriptionId() {
    const data = this.loadData();
    const id = `SUB${String(data.settings.nextSubscriptionId).padStart(4, '0')}`;
    data.settings.nextSubscriptionId++;
    this.saveData(data);
    return id;
  }

  /**
   * Generate unique plan ID
   */
  generatePlanId() {
    const data = this.loadData();
    const id = `PLAN${String(data.settings.nextPlanId).padStart(4, '0')}`;
    data.settings.nextPlanId++;
    this.saveData(data);
    return id;
  }

  /**
   * Generate unique update ID
   */
  generateUpdateId() {
    const data = this.loadData();
    const id = `UPD${String(data.settings.nextUpdateId).padStart(4, '0')}`;
    data.settings.nextUpdateId++;
    this.saveData(data);
    return id;
  }

  // ==================== CLIENT OPERATIONS ====================

  /**
   * Add new client
   */
  addClient(clientData) {
    const data = this.loadData();

    // Use provided clientCode if available, otherwise generate new one
    const clientCode = clientData.clientCode || this.generateClientCode();

    // Check if client already exists
    const existing = data.clients.find(c => c.clientCode === clientCode);
    if (existing) {
      console.warn(`Client with code ${clientCode} already exists`);
      return existing;
    }

    const client = {
      clientCode: clientCode,
      fullName: clientData.fullName,
      email: clientData.email,
      phone: clientData.phone,
      country: clientData.country,
      religion: clientData.religion || '',
      registrationDate: clientData.registrationDate || new Date().toISOString(),
      status: 'active',
      createdAt: new Date().toISOString()
    };
    data.clients.push(client);
    this.saveData(data);
    return client;
  }

  /**
   * Get client by code
   */
  getClient(clientCode) {
    const data = this.loadData();
    return data.clients.find(c => c.clientCode === clientCode);
  }

  /**
   * Get all clients
   */
  getAllClients() {
    const data = this.loadData();
    return data.clients;
  }

  /**
   * Update client
   */
  updateClient(clientCode, updates) {
    const data = this.loadData();
    const index = data.clients.findIndex(c => c.clientCode === clientCode);
    if (index !== -1) {
      data.clients[index] = { ...data.clients[index], ...updates };
      this.saveData(data);
      return data.clients[index];
    }
    return null;
  }

  /**
   * Delete client and all associated data
   */
  deleteClient(clientCode) {
    const data = this.loadData();

    // Remove client
    data.clients = data.clients.filter(c => c.clientCode !== clientCode);

    // Remove all associated subscriptions
    data.subscriptions = data.subscriptions.filter(s => s.clientCode !== clientCode);

    // Remove all associated plans
    data.plans = data.plans.filter(p => p.clientCode !== clientCode);

    // Remove all associated updates
    data.updates = data.updates.filter(u => u.clientCode !== clientCode);

    this.saveData(data);
    return true;
  }

  /**
   * Search clients
   */
  searchClients(query) {
    const data = this.loadData();
    const lowerQuery = query.toLowerCase();
    return data.clients.filter(client =>
      client.fullName.toLowerCase().includes(lowerQuery) ||
      client.email.toLowerCase().includes(lowerQuery) ||
      client.phone.includes(query) ||
      client.clientCode.toLowerCase().includes(lowerQuery)
    );
  }

  // ==================== SUBSCRIPTION OPERATIONS ====================

  /**
   * Add new subscription
   */
  addSubscription(subscriptionData) {
    const data = this.loadData();

    // Calculate end date based on package duration
    const startDate = new Date(subscriptionData.startDate || new Date());
    const packageInfo = data.settings.packages.find(p => p.name === subscriptionData.package);
    const duration = packageInfo ? packageInfo.duration : 30;
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + duration);

    const subscription = {
      subscriptionId: this.generateSubscriptionId(),
      clientCode: subscriptionData.clientCode,
      type: subscriptionData.type, // 'new' or 'renew'
      package: subscriptionData.package,
      amount: parseFloat(subscriptionData.amount),
      currency: subscriptionData.currency,
      paymentMethod: subscriptionData.paymentMethod,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      duration: duration,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    data.subscriptions.push(subscription);
    this.saveData(data);
    return subscription;
  }

  /**
   * Get subscriptions by client
   */
  getClientSubscriptions(clientCode) {
    const data = this.loadData();
    return data.subscriptions.filter(s => s.clientCode === clientCode);
  }

  /**
   * Get active subscription for client
   */
  getActiveSubscription(clientCode) {
    const subscriptions = this.getClientSubscriptions(clientCode);
    const now = new Date();
    return subscriptions.find(s => {
      const endDate = new Date(s.endDate);
      return s.isActive && endDate > now;
    });
  }

  /**
   * Get all subscriptions
   */
  getAllSubscriptions() {
    const data = this.loadData();
    return data.subscriptions;
  }

  /**
   * Update subscription status (check for expiry)
   */
  updateSubscriptionStatuses() {
    const data = this.loadData();
    const now = new Date();

    data.subscriptions.forEach(sub => {
      const endDate = new Date(sub.endDate);
      if (endDate < now && sub.isActive) {
        sub.isActive = false;
      }
    });

    this.saveData(data);
  }

  // ==================== PLAN OPERATIONS ====================

  /**
   * Add new plan
   */
  addPlan(planData) {
    const data = this.loadData();
    const plan = {
      planId: this.generatePlanId(),
      clientCode: planData.clientCode,
      dietPlan: planData.dietPlan || {},
      workoutPlan: planData.workoutPlan || {},
      duration: planData.duration || 30,
      notes: planData.notes || '',
      createdAt: new Date().toISOString()
    };
    data.plans.push(plan);
    this.saveData(data);
    return plan;
  }

  /**
   * Get plans by client
   */
  getClientPlans(clientCode) {
    const data = this.loadData();
    return data.plans.filter(p => p.clientCode === clientCode);
  }

  /**
   * Get latest plan for client
   */
  getLatestPlan(clientCode) {
    const plans = this.getClientPlans(clientCode);
    if (plans.length === 0) return null;
    return plans.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
  }

  /**
   * Update plan
   */
  updatePlan(planId, updates) {
    const data = this.loadData();
    const index = data.plans.findIndex(p => p.planId === planId);
    if (index !== -1) {
      data.plans[index] = { ...data.plans[index], ...updates };
      this.saveData(data);
      return data.plans[index];
    }
    return null;
  }

  // ==================== UPDATE OPERATIONS ====================

  /**
   * Add client update
   */
  addUpdate(updateData) {
    const data = this.loadData();
    const update = {
      updateId: this.generateUpdateId(),
      clientCode: updateData.clientCode,
      compliancePercentage: parseFloat(updateData.compliancePercentage),
      dietFeedback: updateData.dietFeedback || '',
      workoutFeedback: updateData.workoutFeedback || '',
      currentStatus: updateData.currentStatus || '',
      createdAt: new Date().toISOString()
    };
    data.updates.push(update);
    this.saveData(data);
    return update;
  }

  /**
   * Get updates by client
   */
  getClientUpdates(clientCode) {
    const data = this.loadData();
    return data.updates.filter(u => u.clientCode === clientCode)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  /**
   * Get latest update for client
   */
  getLatestUpdate(clientCode) {
    const updates = this.getClientUpdates(clientCode);
    return updates.length > 0 ? updates[0] : null;
  }

  // ==================== CALCULATIONS ====================

  /**
   * Calculate days remaining in subscription
   */
  calculateDaysRemaining(subscription) {
    if (!subscription || !subscription.isActive) return 0;
    const now = new Date();
    const endDate = new Date(subscription.endDate);
    const diffTime = endDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }

  /**
   * Get subscription status
   */
  getSubscriptionStatus(subscription) {
    if (!subscription) return 'inactive';
    const daysRemaining = this.calculateDaysRemaining(subscription);

    if (daysRemaining === 0) return 'expired';
    if (daysRemaining <= 7) return 'expiring-soon';
    return 'active';
  }

  /**
   * Get client complete data
   */
  getClientCompleteData(clientCode) {
    const client = this.getClient(clientCode);
    if (!client) return null;

    const subscriptions = this.getClientSubscriptions(clientCode);
    const activeSubscription = this.getActiveSubscription(clientCode);
    const plans = this.getClientPlans(clientCode);
    const updates = this.getClientUpdates(clientCode);

    return {
      client,
      subscriptions,
      activeSubscription,
      subscriptionStatus: this.getSubscriptionStatus(activeSubscription),
      daysRemaining: this.calculateDaysRemaining(activeSubscription),
      plans,
      latestPlan: plans.length > 0 ? plans[plans.length - 1] : null,
      updates,
      latestUpdate: updates.length > 0 ? updates[0] : null
    };
  }

  // ==================== STATISTICS ====================

  /**
   * Get dashboard statistics
   */
  getStatistics() {
    const data = this.loadData();
    this.updateSubscriptionStatuses();

    const totalClients = data.clients.length;
    const activeClients = data.clients.filter(c => c.status === 'active').length;

    const activeSubscriptions = data.subscriptions.filter(s => s.isActive).length;

    const totalRevenue = data.subscriptions.reduce((sum, sub) => {
      // Convert all to EGP for simplicity (you can add real conversion rates)
      const rates = { EGP: 1, USD: 50, SAR: 13, AED: 14, EUR: 55 };
      return sum + (sub.amount * (rates[sub.currency] || 1));
    }, 0);

    const expiringSubscriptions = data.subscriptions.filter(s => {
      if (!s.isActive) return false;
      const days = this.calculateDaysRemaining(s);
      return days > 0 && days <= 7;
    }).length;

    return {
      totalClients,
      activeClients,
      activeSubscriptions,
      expiringSubscriptions,
      totalRevenue: Math.round(totalRevenue),
      totalPlans: data.plans.length,
      totalUpdates: data.updates.length
    };
  }

  /**
   * Get revenue by package
   */
  getRevenueByPackage() {
    const data = this.loadData();
    const revenue = {};

    data.subscriptions.forEach(sub => {
      if (!revenue[sub.package]) {
        revenue[sub.package] = 0;
      }
      const rates = { EGP: 1, USD: 50, SAR: 13, AED: 14, EUR: 55 };
      revenue[sub.package] += sub.amount * (rates[sub.currency] || 1);
    });

    return revenue;
  }

  /**
   * Get sales trend (last 30 days)
   */
  getSalesTrend(days = 30) {
    const data = this.loadData();
    const trend = {};
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      trend[dateStr] = 0;
    }

    data.subscriptions.forEach(sub => {
      const subDate = new Date(sub.createdAt).toISOString().split('T')[0];
      if (trend.hasOwnProperty(subDate)) {
        const rates = { EGP: 1, USD: 50, SAR: 13, AED: 14, EUR: 55 };
        trend[subDate] += sub.amount * (rates[sub.currency] || 1);
      }
    });

    return trend;
  }

  // ==================== EXPORT/IMPORT ====================

  /**
   * Export all data as JSON
   */
  exportData() {
    const data = this.loadData();
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `raw123_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Import data from JSON
   */
  importData(jsonData) {
    try {
      const data = JSON.parse(jsonData);
      this.saveData(data);
      return { success: true, message: 'تم استيراد البيانات بنجاح' };
    } catch (error) {
      return { success: false, message: 'خطأ في استيراد البيانات: ' + error.message };
    }
  }

  /**
   * Clear all data (use with caution!)
   */
  clearAllData() {
    if (confirm('هل أنت متأكد من حذف جميع البيانات؟ هذا الإجراء لا يمكن التراجع عنه!')) {
      localStorage.removeItem(this.DB_NAME);
      this.initializeDatabase();
      return { success: true, message: 'تم حذف جميع البيانات' };
    }
    return { success: false, message: 'تم إلغاء العملية' };
  }

  // ==================== SETTINGS ====================

  /**
   * Get settings
   */
  getSettings() {
    const data = this.loadData();
    return data.settings;
  }

  /**
   * Update settings
   */
  updateSettings(newSettings) {
    const data = this.loadData();
    data.settings = { ...data.settings, ...newSettings };
    this.saveData(data);
    return data.settings;
  }
}

// Initialize global database instance
const db = new Database();

// Auto-update subscription statuses on page load
window.addEventListener('load', () => {
  db.updateSubscriptionStatuses();
});
