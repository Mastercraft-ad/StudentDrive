import { parse } from 'csv-parse/sync';
import type { InsertInstitution } from '@shared/schema';

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function parseInstitutionCSV(csvContent: string): InsertInstitution[] {
  try {
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    return records.map((record: any) => {
      // Auto-generate profileSlug if not provided
      const slug = record.profileSlug || generateSlug(record.name);
      
      return {
        name: record.name,
        profileSlug: slug,
        description: record.description || null,
        logoUrl: record.logoUrl || null,
        website: record.website || null,
        country: record.country || null,
        city: record.city || null,
        address: record.address || null,
        postalCode: record.postalCode || null,
        email: record.email || null,
        phone: record.phone || null,
        type: record.type || null,
        founded: record.founded ? parseInt(record.founded) : null,
        studentCount: record.studentCount ? parseInt(record.studentCount) : null,
      };
    });
  } catch (error) {
    throw new Error(`CSV parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function validateInstitutionData(data: any): string[] {
  const errors: string[] = [];
  
  if (!data.name || data.name.trim() === '') {
    errors.push('Institution name is required');
  }
  
  if (!data.profileSlug || data.profileSlug.trim() === '') {
    errors.push('Profile slug is required');
  }
  
  return errors;
}
