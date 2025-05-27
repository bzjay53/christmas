// Auto-generated environment validation for Christmas Trading Backend
// 2025-05-27 - PM AI Assistant

const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY', 
    'SUPABASE_SERVICE_KEY',
    'JWT_SECRET',
    'PORT'
];

const placeholderValues = [
    'your-supabase-service-role-key',
    'your-jwt-secret',
    'placeholder',
    'change-me',
    'example'
];

const validateEnvironment = () => {
    console.log('?뵇 Validating environment variables...');
    
    // Check for missing variables
    const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missing.length > 0) {
        console.error('??Missing required environment variables:', missing);
        process.exit(1);
    }
    
    // Check for placeholder values
    for (const envVar of requiredEnvVars) {
        const value = process.env[envVar];
        if (placeholderValues.some(placeholder => value.includes(placeholder))) {
            console.error(??Environment variable ${envVar} contains placeholder value: ${value});
            process.exit(1);
        }
    }
    
    console.log('??All environment variables validated successfully');
    return true;
};

// Export for use in main application
module.exports = { validateEnvironment };

// Run validation if called directly
if (require.main === module) {
    validateEnvironment();
}
