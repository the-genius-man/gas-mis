// Test script to create a weekly assignment and verify it works
const { ipcRenderer } = require('electron');

async function testWeeklyAssignment() {
  console.log('🧪 Testing weekly assignment creation...');
  
  try {
    // Get available roteurs and sites first
    const roteurs = await ipcRenderer.invoke('db-get-roteurs');
    const sites = await ipcRenderer.invoke('db-get-sites-eligible-for-roteur');
    
    console.log('Available roteurs:', roteurs.length);
    console.log('Available sites:', sites.length);
    
    if (roteurs.length === 0 || sites.length === 0) {
      console.log('❌ No roteurs or sites available for testing');
      return;
    }
    
    // Create a test weekly assignment
    const testAssignment = {
      roteur_id: roteurs[0].id,
      date_debut: '2024-02-01',
      date_fin: '2099-12-31',
      poste: 'NUIT',
      notes: 'Test weekly assignment',
      weekly_assignments: [
        {
          day_of_week: 1, // Monday
          site_id: sites[0].id,
          poste: 'NUIT',
          notes: 'Monday test'
        },
        {
          day_of_week: 3, // Wednesday
          site_id: sites.length > 1 ? sites[1].id : sites[0].id,
          poste: 'NUIT', 
          notes: 'Wednesday test'
        }
      ],
      statut: 'PLANIFIE'
    };
    
    console.log('📤 Creating test assignment:', testAssignment);
    
    const result = await ipcRenderer.invoke('db-create-roteur-assignment', testAssignment);
    
    console.log('✅ Assignment created:', result);
    
    // Now fetch assignments to verify
    const assignments = await ipcRenderer.invoke('db-get-roteur-assignments');
    const newAssignment = assignments.find(a => a.id === result.id);
    
    if (newAssignment) {
      console.log('✅ New assignment retrieved:', {
        id: newAssignment.id,
        roteur_nom: newAssignment.roteur_nom,
        weekly_assignments_count: newAssignment.weekly_assignments?.length || 0,
        weekly_assignments: newAssignment.weekly_assignments
      });
    } else {
      console.log('❌ Could not find new assignment');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Export for use in renderer process
if (typeof window !== 'undefined' && window.electronAPI) {
  window.testWeeklyAssignment = testWeeklyAssignment;
}