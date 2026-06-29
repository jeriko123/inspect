import * as SQLite from 'expo-sqlite';

// Open the database synchronously
let db;

try {
  db = SQLite.openDatabaseSync('observations.db');
} catch (error) {
  console.error('Failed to open database synchronously:', error);
}

/**
 * Initialize the observations table if it does not exist.
 */
export const initDatabase = () => {
  if (!db) return;
  try {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS observations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        inspector_name TEXT NOT NULL,
        species TEXT NOT NULL,
        count INTEGER NOT NULL,
        latitude REAL,
        longitude REAL,
        notes TEXT
      );
    `);
    console.log('Database initialized successfully.');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

/**
 * Add a new observation.
 * @param {Object} observation 
 * @returns {number|null} The last inserted row ID or null on failure.
 */
export const addObservation = ({ date, time, inspector_name, species, count, latitude, longitude, notes }) => {
  if (!db) return null;
  try {
    const result = db.runSync(
      `INSERT INTO observations (date, time, inspector_name, species, count, latitude, longitude, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      date,
      time,
      inspector_name,
      species,
      count,
      latitude != null ? latitude : null,
      longitude != null ? longitude : null,
      notes || ''
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error inserting observation:', error);
    throw error;
  }
};

/**
 * Fetch paginated observations.
 * @param {number} limit 
 * @param {number} offset 
 * @returns {Array} List of observations.
 */
export const getObservations = (limit, offset) => {
  if (!db) return [];
  try {
    return db.getAllSync(
      `SELECT * FROM observations ORDER BY id DESC LIMIT ? OFFSET ?;`,
      limit,
      offset
    );
  } catch (error) {
    console.error('Error fetching paginated observations:', error);
    return [];
  }
};

/**
 * Fetch all observations for CSV export.
 * @returns {Array} All observations.
 */
export const getAllObservationsForExport = () => {
  if (!db) return [];
  try {
    return db.getAllSync(`SELECT * FROM observations ORDER BY id DESC;`);
  } catch (error) {
    console.error('Error fetching observations for export:', error);
    return [];
  }
};

/**
 * Import multiple observations in a transaction.
 * @param {Array} observations 
 * @returns {boolean} True if successful.
 */
export const importObservations = (observations) => {
  if (!db || !observations || observations.length === 0) return false;
  
  // Note: The new expo-sqlite API supports transactions.
  // We can run db.withTransactionSync (synchronous transaction helper).
  try {
    db.withTransactionSync(() => {
      for (const obs of observations) {
        db.runSync(
          `INSERT INTO observations (date, time, inspector_name, species, count, latitude, longitude, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
          obs.date,
          obs.time,
          obs.inspector_name,
          obs.species,
          parseInt(obs.count, 10) || 0,
          obs.latitude != null ? parseFloat(obs.latitude) : null,
          obs.longitude != null ? parseFloat(obs.longitude) : null,
          obs.notes || ''
        );
      }
    });
    console.log(`Successfully imported ${observations.length} observations.`);
    return true;
  } catch (error) {
    console.error('Error importing observations within transaction:', error);
    throw error;
  }
};

/**
 * Clear all observations from the database.
 */
export const clearDatabase = () => {
  if (!db) return;
  try {
    db.runSync('DELETE FROM observations;');
    console.log('Database cleared.');
  } catch (error) {
    console.error('Error clearing database:', error);
    throw error;
  }
};
