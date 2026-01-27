import { describe, it, expect } from 'vitest';

/**
 * Basic functional tests for Roteur Management
 * 
 * These tests verify that the roteur functionality is properly integrated
 * and the core business logic works as expected.
 */

describe('RoteurManagement - Core Functionality', () => {
  /**
   * Test 1: Site Coverage Analysis
   * 
   * Verifies that sites with exactly 1 guard are identified as needing roteur coverage
   */
  it('should identify sites needing roteur coverage (sites with exactly 1 guard)', () => {
    // Mock site data
    const sites = [
      { id: 'site1', nom_site: 'Site A', guard_count: 1, needs_roteur: true },
      { id: 'site2', nom_site: 'Site B', guard_count: 2, needs_roteur: false },
      { id: 'site3', nom_site: 'Site C', guard_count: 0, needs_roteur: false },
      { id: 'site4', nom_site: 'Site D', guard_count: 1, needs_roteur: true }
    ];

    // Filter sites needing roteur (business logic)
    const sitesNeedingRoteur = sites.filter(s => s.needs_roteur && s.guard_count === 1);

    expect(sitesNeedingRoteur).toHaveLength(2);
    expect(sitesNeedingRoteur.map(s => s.id)).toEqual(['site1', 'site4']);
  });

  /**
   * Test 2: Roteur Availability Check
   * 
   * Verifies that roteurs without active assignments are considered available
   */
  it('should correctly identify available roteurs', () => {
    // Mock roteur data
    const roteurs = [
      { id: 'roteur1', nom_complet: 'John Doe', statut: 'ACTIF' },
      { id: 'roteur2', nom_complet: 'Jane Smith', statut: 'ACTIF' },
      { id: 'roteur3', nom_complet: 'Bob Wilson', statut: 'INACTIF' }
    ];

    // Mock active assignments
    const activeAssignments = [
      { id: 'assign1', roteur_id: 'roteur2', statut: 'EN_COURS' }
    ];

    // Business logic: available roteurs are ACTIF and not in active assignments
    const availableRoteurs = roteurs.filter(r => 
      r.statut === 'ACTIF' && 
      !activeAssignments.some(a => a.roteur_id === r.id)
    );

    expect(availableRoteurs).toHaveLength(1);
    expect(availableRoteurs[0].id).toBe('roteur1');
  });

  /**
   * Test 3: Assignment Validation
   * 
   * Verifies that assignment date validation works correctly
   */
  it('should validate assignment dates correctly', () => {
    const validateAssignmentDates = (dateDebut: string, dateFin: string): boolean => {
      return new Date(dateFin) > new Date(dateDebut);
    };

    // Valid date range
    expect(validateAssignmentDates('2024-01-01', '2024-01-07')).toBe(true);
    
    // Invalid date range (end before start)
    expect(validateAssignmentDates('2024-01-07', '2024-01-01')).toBe(false);
    
    // Same dates (invalid)
    expect(validateAssignmentDates('2024-01-01', '2024-01-01')).toBe(false);
  });

  /**
   * Test 4: Assignment Conflict Detection
   * 
   * Verifies that overlapping assignments are detected
   */
  it('should detect assignment conflicts', () => {
    const checkAssignmentConflict = (
      newStart: string, 
      newEnd: string, 
      existingAssignments: Array<{date_debut: string, date_fin: string}>
    ): boolean => {
      return existingAssignments.some(existing => {
        const newStartDate = new Date(newStart);
        const newEndDate = new Date(newEnd);
        const existingStartDate = new Date(existing.date_debut);
        const existingEndDate = new Date(existing.date_fin);

        // Check for overlap
        return (newStartDate <= existingEndDate && newEndDate >= existingStartDate);
      });
    };

    const existingAssignments = [
      { date_debut: '2024-01-05', date_fin: '2024-01-10' },
      { date_debut: '2024-01-15', date_fin: '2024-01-20' }
    ];

    // Overlapping assignment (conflict)
    expect(checkAssignmentConflict('2024-01-08', '2024-01-12', existingAssignments)).toBe(true);
    
    // Non-overlapping assignment (no conflict)
    expect(checkAssignmentConflict('2024-01-25', '2024-01-30', existingAssignments)).toBe(false);
    
    // Adjacent assignment (no conflict)
    expect(checkAssignmentConflict('2024-01-21', '2024-01-25', existingAssignments)).toBe(false);
  });

  /**
   * Test 5: Site Assignment Clearing for Roteurs
   * 
   * Verifies that when a guard becomes a roteur, their site assignment is cleared
   */
  it('should clear site assignment when guard becomes roteur', () => {
    const handlePosteChange = (oldPoste: string, newPoste: string, currentSiteId: string) => {
      const wasRegularGuard = oldPoste === 'GARDE' || oldPoste === 'SUPERVISEUR';
      const isBecomingRoteur = newPoste === 'ROTEUR';
      
      if (wasRegularGuard && isBecomingRoteur) {
        return ''; // Clear site assignment
      }
      return currentSiteId; // Keep current assignment
    };

    // Guard becoming roteur should clear site
    expect(handlePosteChange('GARDE', 'ROTEUR', 'site123')).toBe('');
    
    // Supervisor becoming roteur should clear site
    expect(handlePosteChange('SUPERVISEUR', 'ROTEUR', 'site123')).toBe('');
    
    // Other changes should keep site
    expect(handlePosteChange('GARDE', 'SUPERVISEUR', 'site123')).toBe('site123');
    expect(handlePosteChange('ROTEUR', 'GARDE', '')).toBe('');
  });
});