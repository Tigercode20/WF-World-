/**
 * Custom confirmation dialog
 */
function showCustomConfirm(message, onConfirm) {
    const modal = document.createElement('div');
    modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    backdrop-filter: blur(5px);
  `;

    modal.innerHTML = `
    <div style="
      background: var(--bg-card);
      border-radius: var(--radius-lg);
      padding: 2rem;
      max-width: 500px;
      box-shadow: var(--shadow-lg);
      border: 1px solid rgba(255, 255, 255, 0.1);
    ">
      <h3 style="margin: 0 0 1rem 0; color: var(--text-primary);">⚠️ تأكيد</h3>
      <p style="color: var(--text-secondary); white-space: pre-wrap; line-height: 1.6;">${message}</p>
      <div style="display: flex; gap: 0.5rem; margin-top: 1.5rem; justify-content: flex-end;">
        <button onclick="this.closest('div').parentElement.remove()" class="btn btn-outline">
          إلغاء
        </button>
        <button id="confirm-btn" class="btn btn-primary" style="background: linear-gradient(135deg, #f44336 0%, #e91e63 100%);">
          تأكيد الحذف
        </button>
      </div>
    </div>
  `;

    document.body.appendChild(modal);

    modal.querySelector('#confirm-btn').onclick = function () {
        modal.remove();
        onConfirm();
    };

    // Close on background click
    modal.onclick = function (e) {
        if (e.target === modal) {
            modal.remove();
        }
    };
}
