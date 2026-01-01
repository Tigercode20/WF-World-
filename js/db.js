// Database Logic (Compat Mode)
// Relies on firebase-firestore-compat.js being loaded.

class Database {
  constructor() {
    this.db = firebase.firestore();
    this.clientsCol = this.db.collection('clients');
    this.subscriptionsCol = this.db.collection('subscriptions');
    this.plansCol = this.db.collection('plans');
    this.updatesCol = this.db.collection('client_updates');

    // Settings document reference
    this.settingsDoc = this.db.collection('settings').doc('general');

    // Cache settings
    this.cachedSettings = null;
  }

  // ==================== HELPERS ====================

  generateClientCode() {
    const year = new Date().getFullYear().toString().substr(-2);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `C-${year}${random}`;
  }

  parseFlexibleDate(value) {
    if (!value) return '';
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'number') {
      if (value > 1000000) return new Date(value).toISOString();
      return new Date((value - 25569) * 86400 * 1000).toISOString();
    }
    if (typeof value !== 'string') return '';

    const dateStr = value.trim();
    // DD/MM/YYYY support
    const ddmmyyyy = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(.*)$/);
    if (ddmmyyyy) {
      try {
        const day = parseInt(ddmmyyyy[1], 10);
        const month = parseInt(ddmmyyyy[2], 10) - 1;
        const year = parseInt(ddmmyyyy[3], 10);
        const timeStr = ddmmyyyy[4].trim();
        let hours = 0, minutes = 0, seconds = 0;
        if (timeStr) {
          const timeParts = timeStr.split(':');
          if (timeParts[0]) hours = parseInt(timeParts[0], 10);
          if (timeParts[1]) minutes = parseInt(timeParts[1], 10);
          if (timeParts[2]) seconds = parseInt(timeParts[2], 10);
        }
        const date = new Date(year, month, day, hours, minutes, seconds);
        if (!isNaN(date.getTime())) return date.toISOString();
      } catch (e) {
        console.warn('Failed to parse DD/MM/YYYY:', dateStr);
      }
    }
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) return date.toISOString();
    return '';
  }

  // ==================== CLIENT OPERATIONS ====================

  async addClient(clientData) {
    const clientCode = clientData.clientCode || this.generateClientCode();

    // Check for duplicate
    const snapshot = await this.clientsCol.where("clientCode", "==", clientCode).get();
    if (!snapshot.empty) {
      return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    }

    const newClient = {
      clientCode: clientCode,
      fullName: clientData.fullName,
      email: clientData.email,
      phone: clientData.phone,
      country: clientData.country,
      religion: clientData.religion || '',
      registrationDate: clientData.registrationDate || new Date().toISOString(),
      status: 'active',
      createdAt: new Date().toISOString(),
      // Extended fields
      gender: clientData.gender || '',
      birthDate: clientData.birthDate || '',
      weight: clientData.weight || '',
      height: clientData.height || '',
      goal: clientData.goal || '',
      job: clientData.job || '',
      frontImage: clientData.frontImage || '',
      sideImage: clientData.sideImage || '',
      backImage: clientData.backImage || '',
      healthIssues: clientData.healthIssues || '',
      bloodTestsDone: clientData.bloodTestsDone || '',
      bloodTestsFile: clientData.bloodTestsFile || '',
      medications: clientData.medications || '',
      injuries: clientData.injuries || '',
      xrayFile: clientData.xrayFile || '',
      isSmoker: clientData.isSmoker || '',
      foodAllergies: clientData.foodAllergies || '',
      vitaminsRequested: clientData.vitaminsRequested || '',
      previousDiet: clientData.previousDiet || '',
      failureReasons: clientData.failureReasons || '',
      lastDietFile: clientData.lastDietFile || '',
      activityLevel: clientData.activityLevel || '',
      caffeineIntake: clientData.caffeineIntake || '',
      mealsCount: clientData.mealsCount || '',
      budget: clientData.budget || '',
      dislikedFood: clientData.dislikedFood || '',
      preferredProtein: clientData.preferredProtein || '',
      preferredCarbs: clientData.preferredCarbs || '',
      preferredFats: clientData.preferredFats || '',
      dietType: clientData.dietType || '',
      trainingExperience: clientData.trainingExperience || '',
      gymDuration: clientData.gymDuration || '',
      otherSports: clientData.otherSports || '',
      trainingPlace: clientData.trainingPlace || '',
      availableTools: clientData.availableTools || '',
      trainingDays: clientData.trainingDays || '',
      availableDays: clientData.availableDays || '',
      painfulExercises: clientData.painfulExercises || '',
      preferredCardio: clientData.preferredCardio || '',
      dailySteps: clientData.dailySteps || '',
      onlineCoachingExperience: clientData.onlineCoachingExperience || '',
      joiningReason: clientData.joiningReason || '',
      notes: clientData.notes || ''
    };

    // Use add() which auto-generates doc ID
    const docRef = await this.clientsCol.add(newClient);
    return { ...newClient, id: docRef.id };
  }

  async getClient(clientCode) {
    // Try as string first
    let snapshot = await this.clientsCol.where("clientCode", "==", clientCode.toString()).get();

    // If not found, try as number (in case it was stored as number from Excel/Sheets)
    if (snapshot.empty && !isNaN(clientCode)) {
      snapshot = await this.clientsCol.where("clientCode", "==", parseInt(clientCode)).get();
    }

    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  }

  async getAllClients() {
    const snapshot = await this.clientsCol.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async updateClient(clientCode, updates) {
    // Try as string first
    let snapshot = await this.clientsCol.where("clientCode", "==", clientCode.toString()).get();

    // If not found, try as number
    if (snapshot.empty && !isNaN(clientCode)) {
      snapshot = await this.clientsCol.where("clientCode", "==", parseInt(clientCode)).get();
    }

    if (snapshot.empty) return null;

    const docRef = snapshot.docs[0].ref;

    // Remove undefined/null values from updates
    const cleanUpdates = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined && value !== null && value !== '') {
        cleanUpdates[key] = value;
      }
    }

    await docRef.update(cleanUpdates);
    return { ...snapshot.docs[0].data(), ...cleanUpdates };
  }

  async deleteClient(clientCode) {
    const snapshot = await this.clientsCol.where("clientCode", "==", clientCode).get();
    if (snapshot.empty) return false;

    await snapshot.docs[0].ref.delete();
    return true;
  }

  // ==================== SEARCH & FILTER ====================
  // Client-side search for simplicity as Firestore native search is limited
  searchClients(queryStr) {
    // This is a placeholder. Since we fetch all clients in dashboard, filtering is done usually in UI.
    // But if we need a DB method:
    console.warn("searchClients implies client-side filtering after fetch");
    return [];
  }

  // ==================== SETTINGS ====================

  async getSettings() {
    if (this.cachedSettings) return this.cachedSettings;

    const docSnap = await this.settingsDoc.get();

    if (docSnap.exists) {
      this.cachedSettings = docSnap.data();
      return this.cachedSettings;
    } else {
      const defaults = {
        appName: 'WF World',
        currency: 'EGP',
        sheetsApiUrl: '',
        packages: [
          { name: 'باقة شهرية', duration: 30, price: 1500, currency: 'EGP' },
          { name: 'باقة 3 شهور', duration: 90, price: 3500, currency: 'EGP' },
          { name: 'باقة 6 شهور', duration: 180, price: 6000, currency: 'EGP' },
          { name: 'باقة سنوية', duration: 365, price: 10000, currency: 'EGP' }
        ],
        lastSyncDate: null
      };
      await this.settingsDoc.set(defaults);
      this.cachedSettings = defaults;
      return defaults;
    }
  }

  async updateSettings(newSettings) {
    // Ensure document exists first by calling getSettings if needed, or set with merge
    await this.settingsDoc.set(newSettings, { merge: true });
    // Update cache
    const current = await this.getSettings();
    this.cachedSettings = { ...current, ...newSettings };
    return this.cachedSettings;
  }

  // Helper for synchronous code (if any remains) -> returns null or cached
  // Prefer async getSettings()
  getLastSyncInfo() {
    return this.cachedSettings || {};
  }

  // ==================== GOOGLE SHEETS SYNC ====================

  async syncFromGoogleSheets() {
    const settings = await this.getSettings();

    if (!settings.sheetsApiUrl) {
      throw new Error('لم يتم تكوين رابط Google Sheets API. يرجى إضافته في الإعدادات.');
    }

    try {
      const response = await fetch(settings.sheetsApiUrl);
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      const result = await response.json();

      if (!result.success) throw new Error(result.error || 'Unknown error');

      const sheetClients = result.clients || [];
      let addedCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;
      const skippedReasons = [];

      for (let i = 0; i < sheetClients.length; i++) {
        const sheetClient = sheetClients[i];
        try {
          const clientData = this.mapSheetDataToClient(sheetClient);

          if (!clientData.fullName) {
            skippedCount++;
            skippedReasons.push(`الصف ${i + 2}: الاسم مفقود`);
            continue;
          }
          if (!clientData.email) {
            skippedCount++;
            skippedReasons.push(`الصف ${i + 2}: البريد الإلكتروني مفقود`);
            continue;
          }

          // Check existence
          const snapshot = await this.clientsCol.where("email", "==", clientData.email).get();

          if (!snapshot.empty) {
            const existingCode = snapshot.docs[0].data().clientCode;
            await this.updateClient(existingCode, clientData);
            updatedCount++;
          } else {
            await this.addClient(clientData);
            addedCount++;
          }
        } catch (error) {
          console.error('Error processing client:', sheetClient, error);
          skippedCount++;
          skippedReasons.push(`الصف ${i + 2}: ${error.message}`);
        }
      }

      await this.updateSettings({ lastSyncDate: new Date().toISOString() });

      let message = `تمت المزامنة: +${addedCount} جديد، 🔄 ${updatedCount} تحديث.`;
      if (skippedCount > 0) message += ` (تخطي ${skippedCount})`;

      return {
        success: true,
        total: sheetClients.length,
        added: addedCount,
        updated: updatedCount,
        skipped: skippedCount,
        skippedReasons: skippedReasons,
        message: message
      };

    } catch (error) {
      console.error('Sync error:', error);
      throw new Error(`فشلت المزامنة: ${error.message}`);
    }
  }

  mapSheetDataToClient(sheetData) {
    // Keyword mapping - find columns that CONTAIN these keywords
    const keywordMap = {
      'Timestamp': 'timestamp',
      'Email': 'email',
      'الكود': 'clientCode',
      'الاسم': 'fullName',
      'الدولة': 'country',
      'التليفون': 'phone',
      'الديانة': 'religion',
      'هدفك': 'goal',
      'الوزن': 'weight',
      'الطول': 'height',
      'النوع': 'gender',
      'الميلاد': 'birthDate',
      'الوظيفة': 'job',
      'صورة': 'images',
      'من الأمام': 'frontImage',
      'من الجانب': 'sideImage',
      'من الخلف': 'backImage',
      'مشاكل صحية': 'healthIssues',
      'تحاليل': 'bloodTestsDone',
      'أدوية': 'medications',
      'إصابات': 'injuries',
      'مدخن': 'isSmoker',
      'التزمت بنظام غذائي': 'previousDiet',
      'طبيعة يومك': 'activityLevel',
      'الالتزام بالدايت': 'failureReasons',
      'شاي': 'caffeineIntake',
      'قهوة': 'caffeineIntake',
      'حساسية': 'foodAllergies',
      'لا تحبه': 'dislikedFood',
      'فيتامينات': 'vitaminsRequested',
      'عدد الوجبات': 'mealsCount',
      'مرن': 'dietType',
      'الميزانية': 'budget',
      'البروتين': 'preferredProtein',
      'الكربوهيدرات': 'preferredCarbs',
      'الدهون': 'preferredFats',
      'تجربتك': 'trainingExperience',
      'ممارسة الحديد': 'gymDuration',
      'رياضة أخرى': 'otherSports',
      'تمارس تمرينك': 'trainingPlace',
      'الأدوات المتاحة': 'availableTools',
      'أيام التمرين': 'trainingDays',
      'الأيام المتاحة': 'availableDays',
      'تسبب لك ألم': 'painfulExercises',
      'الكارديو': 'preferredCardio',
      'خطوات': 'dailySteps',
      'الأونلاين': 'onlineCoachingExperience',
      'سبب اشتراكك': 'joiningReason',
      'ملاحظة': 'notes'
    };

    const clientData = {};
    const sheetKeys = Object.keys(sheetData);

    // For each keyword, find the matching sheet column
    for (const [keyword, dbKey] of Object.entries(keywordMap)) {
      // Skip if we already have this field
      if (clientData[dbKey]) continue;

      // Find a sheet key that contains this keyword
      for (const sheetKey of sheetKeys) {
        if (sheetKey.includes(keyword)) {
          const value = sheetData[sheetKey];
          if (value !== undefined && value !== '' && value !== null) {
            clientData[dbKey] = value;
            break; // Use first match
          }
        }
      }
    }

    // Handle timestamp -> registrationDate
    if (clientData.timestamp) {
      clientData.registrationDate = this.parseFlexibleDate(clientData.timestamp);
      delete clientData.timestamp;
    }

    // Parse date fields
    if (clientData.birthDate) {
      clientData.birthDate = this.parseFlexibleDate(clientData.birthDate);
    }

    // DEBUG: Log complete data
    console.log('📤 Mapped fields count:', Object.keys(clientData).length);
    console.log('📤 Mapped:', clientData.fullName, '| Fields:', Object.keys(clientData).join(', '));

    return clientData;
  }

  // ==================== SALES/SUBSCRIPTIONS SYNC ====================

  async addSubscription(subscriptionData) {
    // Generate unique ID if not provided
    const subId = subscriptionData.id || `SUB-${Date.now()}`;

    // Check for duplicate by clientCode + startDate
    const snapshot = await this.subscriptionsCol
      .where("clientCode", "==", subscriptionData.clientCode)
      .where("startDate", "==", subscriptionData.startDate)
      .get();

    if (!snapshot.empty) {
      // Update existing
      const docRef = snapshot.docs[0].ref;
      await docRef.update(subscriptionData);
      return { id: snapshot.docs[0].id, ...subscriptionData };
    }

    const newSub = {
      id: subId,
      clientCode: subscriptionData.clientCode || '',
      clientName: subscriptionData.clientName || '',
      email: subscriptionData.email || '',
      phone: subscriptionData.phone || '',
      subscriptionType: subscriptionData.subscriptionType || '',
      package: subscriptionData.package || '',
      amount: subscriptionData.amount || 0,
      currency: subscriptionData.currency || 'EGP',
      receiveAccount: subscriptionData.receiveAccount || '',
      startDate: subscriptionData.startDate || '',
      duration: subscriptionData.duration || 1,
      bonusDuration: subscriptionData.bonusDuration || 0,
      endDate: subscriptionData.endDate || '',
      paymentScreenshot: subscriptionData.paymentScreenshot || '',
      chatScreenshot: subscriptionData.chatScreenshot || '',
      trainingPlanSent: subscriptionData.trainingPlanSent || '',
      notes: subscriptionData.notes || '',
      createdAt: subscriptionData.createdAt || new Date().toISOString(),
      status: 'active'
    };

    const docRef = await this.subscriptionsCol.add(newSub);
    return { ...newSub, id: docRef.id };
  }

  async getAllSubscriptions() {
    const snapshot = await this.subscriptionsCol.get();
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id  // This MUST come after spread to override any internal 'id' field
    }));
  }

  async syncSalesFromGoogleSheets() {
    const settings = await this.getSettings();

    if (!settings.salesApiUrl) {
      throw new Error('لم يتم تكوين رابط Sales API. يرجى إضافته في الإعدادات.');
    }

    try {
      const response = await fetch(settings.salesApiUrl);
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      const result = await response.json();

      if (!result.success) throw new Error(result.error || 'Unknown error');

      const sheetSales = result.sales || [];
      let addedCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;

      for (let i = 0; i < sheetSales.length; i++) {
        const sheetSale = sheetSales[i];
        try {
          const saleData = this.mapSheetDataToSale(sheetSale);

          if (!saleData.clientCode) {
            skippedCount++;
            continue;
          }

          // Check existence by clientCode + startDate
          const snapshot = await this.subscriptionsCol
            .where("clientCode", "==", saleData.clientCode)
            .where("startDate", "==", saleData.startDate)
            .get();

          if (!snapshot.empty) {
            await snapshot.docs[0].ref.update(saleData);
            updatedCount++;
          } else {
            await this.addSubscription(saleData);
            addedCount++;
          }
        } catch (error) {
          console.error('Error processing sale:', sheetSale, error);
          skippedCount++;
        }
      }

      await this.updateSettings({ lastSalesSyncDate: new Date().toISOString() });

      let message = `تمت مزامنة المبيعات: +${addedCount} جديد، 🔄 ${updatedCount} تحديث.`;
      if (skippedCount > 0) message += ` (تخطي ${skippedCount})`;

      return {
        success: true,
        total: sheetSales.length,
        added: addedCount,
        updated: updatedCount,
        skipped: skippedCount,
        message: message
      };

    } catch (error) {
      console.error('Sales sync error:', error);
      throw new Error(`فشلت مزامنة المبيعات: ${error.message}`);
    }
  }

  mapSheetDataToSale(sheetData) {
    // Keyword mapping for sales columns
    const keywordMap = {
      'Timestamp': 'createdAt',
      'Email': 'email',
      'Subscription Type': 'subscriptionType',
      'Client Code': 'clientCode',
      'Client Name': 'clientName',
      'Phone': 'phone',
      'Amount': 'amount',
      'Currency': 'currency',
      'Receive Account': 'receiveAccount',
      'Package': 'package',
      'Start Date': 'startDate',
      'Duration': 'duration',
      'Bonus': 'bonusDuration',
      'Screenshot': 'paymentScreenshot',
      'سكرين شوت': 'chatScreenshot',
      'Training plan': 'trainingPlanSent',
      'Notes': 'notes'
    };

    const saleData = {};
    const sheetKeys = Object.keys(sheetData);

    for (const [keyword, dbKey] of Object.entries(keywordMap)) {
      if (saleData[dbKey]) continue;

      for (const sheetKey of sheetKeys) {
        if (sheetKey.includes(keyword)) {
          const value = sheetData[sheetKey];
          if (value !== undefined && value !== '' && value !== null) {
            saleData[dbKey] = value;
            break;
          }
        }
      }
    }

    // Parse dates
    if (saleData.createdAt) {
      saleData.createdAt = this.parseFlexibleDate(saleData.createdAt);
    }
    if (saleData.startDate) {
      saleData.startDate = this.parseFlexibleDate(saleData.startDate);
    }

    // Calculate end date
    if (saleData.startDate && saleData.duration) {
      const start = new Date(saleData.startDate);
      const totalMonths = parseInt(saleData.duration) + parseInt(saleData.bonusDuration || 0);
      start.setMonth(start.getMonth() + totalMonths);
      saleData.endDate = start.toISOString();
    }

    console.log('📤 Mapped sale:', saleData.clientCode, '| Fields:', Object.keys(saleData).length);

    return saleData;
  }
}

const dbInstance = new Database();
window.db = dbInstance;
