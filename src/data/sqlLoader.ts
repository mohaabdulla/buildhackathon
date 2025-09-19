// sql.js wrapper to handle import issues

export async function loadSqlJs() {
  try {
    // Try to import sql.js normally first
    const sqlModule = await import('sql.js');
    
    if (sqlModule.default && typeof sqlModule.default === 'function') {
      return sqlModule.default;
    }
    
    // If that fails, try loading from CDN
    console.warn('Falling back to CDN version of sql.js');
    
    // Load sql.js from CDN
    const response = await fetch('https://sql.js.org/dist/sql-wasm.js');
    const sqlCode = await response.text();
    
    // Create a function from the code
    const initSqlJs = new Function('module', 'exports', sqlCode + '; return initSqlJs;')({}, {});
    
    if (typeof initSqlJs === 'function') {
      return initSqlJs;
    }
    
    throw new Error('Failed to load sql.js');
  } catch (error) {
    console.error('Error loading sql.js:', error);
    throw error;
  }
}
