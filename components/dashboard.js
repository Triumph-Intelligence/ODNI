/**
 * Dashboard Component
 * Displays KPIs and recent activity
 */

const DashboardComponent = {
  /**
   * Initialize dashboard
   */
  async init() {
    console.log('📊 Dashboard initializing...');
    await this.render();
  },

  /**
   * Render dashboard
   */
  async render() {
    try {
      // Get filtered data based on current org
      const companies = await DataService.getCompanies();
      const contacts = await DataService.getContacts();
      const gifts = await DataService.getGifts();
      const referrals = await DataService.getReferrals();
      const opportunities = await DataService.getOpportunities();
      const changeLog = await DataService.getChangeLog();

      // Filter data by visibility
      const currentOrg = VisibilityService.getCurrentOrg();
      const visibleCompanies = companies.filter(c => 
        VisibilityService.isCompanyVisible(c, currentOrg)
      );
      
      const visibleCompanyIds = visibleCompanies.map(c => c.normalized);
      
      const visibleContacts = contacts.filter(c => 
        visibleCompanyIds.includes(c.company)
      );

      // Calculate KPIs
      this.renderKPIs(visibleContacts, gifts, referrals, opportunities);

      // Render activity
      this.renderActivity(changeLog, currentOrg);

      console.log('✅ Dashboard rendered');
    } catch (error) {
      console.error('Error rendering dashboard:', error);
      this.showError();
    }
  },

  /**
   * Render KPIs
   */
  renderKPIs(contacts, gifts, referrals, opportunities) {
    // KPI 1: Overdue Touches
    const overdueTouches = this.calculateOverdueTouches(contacts);
    document.getElementById('kpi-overdue-touches').textContent = overdueTouches;

    // KPI 2: Days Since Last Gift
    const daysSinceGift = this.calculateDaysSinceLastGift(gifts);
    document.getElementById('kpi-last-gift').textContent = daysSinceGift;

    // KPI 3: Referrals Asked (30d)
    const recentReferrals = this.calculateRecentReferrals(referrals);
    document.getElementById('kpi-referrals').textContent = recentReferrals;

    // KPI 4: Open Opportunities (Weighted)
    const openOpps = this.calculateOpenOpportunities(opportunities);
    document.getElementById('kpi-open-opps').textContent = openOpps;
  },

  /**
   * Calculate overdue touches
   */
  calculateOverdueTouches(contacts) {
    const today = new Date();
    let overdue = 0;

    contacts.forEach(contact => {
      if (!contact.last_contacted || !contact.cadence) return;

      const lastContact = new Date(contact.last_contacted);
      const daysSince = Math.floor((today - lastContact) / (1000 * 60 * 60 * 24));
      
      if (daysSince > contact.cadence) {
        overdue++;
      }
    });

    return overdue;
  },

  /**
   * Calculate days since last gift
   */
  calculateDaysSinceLastGift(gifts) {
    if (gifts.length === 0) return '—';

    // Sort by date descending
    const sortedGifts = [...gifts].sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    );

    const lastGift = sortedGifts[0];
    const lastGiftDate = new Date(lastGift.date);
    const today = new Date();
    const daysSince = Math.floor((today - lastGiftDate) / (1000 * 60 * 60 * 24));

    return daysSince;
  },

  /**
   * Calculate recent referrals (30 days)
   */
  calculateRecentReferrals(referrals) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recent = referrals.filter(r => {
      const followupDate = new Date(r.followup_date);
      return followupDate >= thirtyDaysAgo;
    });

    return recent.length;
  },

  /**
   * Calculate open opportunities with weighted value
   */
  calculateOpenOpportunities(opportunities) {
    if (opportunities.length === 0) return '$0';

    // Parse valuation strings like "$125,000" to numbers
    const total = opportunities.reduce((sum, opp) => {
      const value = parseFloat(opp.valuation.replace(/[$,]/g, ''));
      return sum + value;
    }, 0);

    // Format with K/M suffix
    if (total >= 1000000) {
      return `$${(total / 1000000).toFixed(1)}M`;
    } else if (total >= 1000) {
      return `$${(total / 1000).toFixed(0)}K`;
    }
    return `$${total}`;
  },

  /**
   * Render activity table
   */
  renderActivity(changeLog, currentOrg) {
    const tbody = document.getElementById('dashboard-activity-body');
    
    if (!changeLog || changeLog.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3" class="table-empty">No recent activity</td></tr>';
      return;
    }

    // Filter by current org if not Triumph Atlantic
    let filteredLog = changeLog;
    if (currentOrg !== 'Triumph Atlantic') {
      filteredLog = changeLog.filter(entry => entry.org === currentOrg);
    }

    // Get most recent 10 entries
    const recentActivity = filteredLog.slice(0, 10);

    if (recentActivity.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3" class="table-empty">No recent activity for this organization</td></tr>';
      return;
    }

    // Render rows
    tbody.innerHTML = recentActivity.map(entry => {
      const date = new Date(entry.timestamp);
      const dateStr = date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
      
      return `
        <tr>
          <td>${dateStr}</td>
          <td><span class="badge badge-info">${entry.action}</span></td>
          <td>${entry.details}</td>
        </tr>
      `;
    }).join('');
  },

  /**
   * Show error state
   */
  showError() {
    document.getElementById('kpi-overdue-touches').textContent = 'Error';
    document.getElementById('kpi-last-gift').textContent = 'Error';
    document.getElementById('kpi-referrals').textContent = 'Error';
    document.getElementById('kpi-open-opps').textContent = 'Error';
    
    const tbody = document.getElementById('dashboard-activity-body');
    tbody.innerHTML = '<tr><td colspan="3" class="table-empty">Error loading activity</td></tr>';
  },

  /**
   * Refresh dashboard (called when org changes)
   */
  async refresh() {
    console.log('🔄 Refreshing dashboard...');
    await this.render();
  }
};

// Make available globally
window.DashboardComponent = DashboardComponent;

// Wait for all dependencies to load, then auto-initialize
function initDashboardWhenReady() {
  // Check if all dependencies exist
  if (typeof window.DataService === 'undefined' || 
      typeof window.VisibilityService === 'undefined') {
    console.log('⏳ Dashboard waiting for dependencies...');
    setTimeout(initDashboardWhenReady, 100);
    return;
  }

  // Check if dashboard page is active
  const dashboardPage = document.getElementById('dashboard');
  if (dashboardPage && dashboardPage.classList.contains('active')) {
    console.log('🚀 Starting dashboard initialization...');
    DashboardComponent.init();
  }
}

// Start initialization check when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDashboardWhenReady);
} else {
  initDashboardWhenReady();
}

console.log('📊 Dashboard Component loaded');
