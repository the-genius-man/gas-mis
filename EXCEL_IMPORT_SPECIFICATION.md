# Excel Import Specification

## Overview
This document specifies the backend implementation needed for importing customers from `public/customers.xlsx` into the clients and sites system.

## Backend API Required

### Method: `window.electronAPI.importCustomersFromExcel()`

**Purpose**: Import customers from the Excel file and create clients/sites based on the business logic.

**Business Logic**:
1. **Unique customers** → Create as new clients
2. **Duplicate customers** → Create as additional sites for the existing client
3. **Data mapping** → Map Excel columns to database fields

**Expected Return Format**:
```javascript
{
  success: boolean,
  clientsCreated: number,
  sitesCreated: number,
  totalProcessed: number,
  errors?: string[],
  error?: string // if success is false
}
```

## Excel File Structure Expected

The `public/customers.xlsx` file should contain columns that map to:

### Client Fields:
- `nom_entreprise` (Company Name)
- `type_client` (MORALE/PHYSIQUE)
- `contact_nom` (Contact Name)
- `contact_telephone` (Phone)
- `contact_email` (Email)
- `adresse_facturation` (Billing Address)
- `nif` (Tax ID)
- `numero_contrat` (Contract Number)

### Site Fields (when duplicates are found):
- `nom_site` (Site Name - could be derived from company name + location)
- `adresse_physique` (Physical Address)
- `effectif_jour_requis` (Day Guards Required)
- `effectif_nuit_requis` (Night Guards Required)
- `tarif_mensuel_client` (Monthly Rate)
- `cout_unitaire_garde` (Unit Cost per Guard)

## Processing Logic

1. **Read Excel File**: Parse `public/customers.xlsx`
2. **Identify Duplicates**: Group rows by company name or unique identifier
3. **Create Clients**: For each unique company, create a client record
4. **Create Sites**: For each location/duplicate, create a site record linked to the client
5. **Error Handling**: Track and return any processing errors
6. **Return Results**: Provide summary of created records

## Example Implementation Flow

```javascript
// Pseudo-code for backend implementation
async function importCustomersFromExcel() {
  try {
    // 1. Read Excel file
    const workbook = XLSX.readFile('public/customers.xlsx');
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    // 2. Group by company name
    const groupedData = groupBy(data, 'nom_entreprise');
    
    let clientsCreated = 0;
    let sitesCreated = 0;
    const errors = [];
    
    // 3. Process each group
    for (const [companyName, records] of Object.entries(groupedData)) {
      try {
        // Create client from first record
        const clientData = mapToClientData(records[0]);
        const client = await createClient(clientData);
        clientsCreated++;
        
        // Create sites for all records (including first one)
        for (const record of records) {
          const siteData = mapToSiteData(record, client.id);
          await createSite(siteData);
          sitesCreated++;
        }
      } catch (error) {
        errors.push(`Error processing ${companyName}: ${error.message}`);
      }
    }
    
    return {
      success: true,
      clientsCreated,
      sitesCreated,
      totalProcessed: data.length,
      errors: errors.length > 0 ? errors : undefined
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
```

## UI Integration

The frontend now includes:
- **Import Button**: Green "Importer Excel" button in ClientsManagement header
- **Import Modal**: Confirmation dialog with instructions and warnings
- **Progress Indicator**: Loading state during import
- **Results Display**: Success/error messages with detailed statistics
- **Auto Refresh**: Automatically refreshes client list after successful import

## Error Handling

The system should handle:
- Missing Excel file
- Invalid Excel format
- Missing required columns
- Database constraint violations
- Duplicate client detection
- Invalid data formats

## Testing

To test the implementation:
1. Place a properly formatted `customers.xlsx` file in the `public/` folder
2. Click "Importer Excel" in the Clients Management page
3. Confirm the import in the modal
4. Verify results in the success message
5. Check that clients and sites were created correctly