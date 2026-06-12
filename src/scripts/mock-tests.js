/*import { initShell }      from '../components/shell.js';
import { userStore }      from '../store/userStore.js';
import { api }            from '../services/api.js';
import { ENDPOINTS }      from '../services/endpoints.js'; */

let mocks = []
const pastTests = document.querySelector(".past-mock-tests-box");

async function loadMockStats(){
try {
     const response = await api.get(ENDPOINTS.ANALYTICS_ME);
     const data  =  response.data;
     renderMockStats(data);
} catch(err) {
    showToast('Failed to load page data. Please refresh.', 'error');
}
}; // end of loadMockStats

     
  function showToast(message, type = '') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.className   = `toast ${type}`.trim();
  void toast.offsetWidth;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}

loadMockStats();

