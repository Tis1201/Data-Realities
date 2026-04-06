require('dotenv').config();

module.exports = {
    apiBaseURL: 'https://app-dev-v2.datarealities.com/auth/login',
    baseURL: 'https://app-dev-v2.datarealities.com/auth/login',
    username: '',
    password: '',
    pageURL: {
        preconditions: {
            tags: ['auto_test', 'auto_test 2', 'auto_test 3'],
        },
        accounts: {
            url: 'https://app-dev-v2.datarealities.com/admin/accounts/accounts',
            name: 'auto_test Account',
            description: 'auto_test Account',
        },
        companies: {
            url: 'https://app-dev-v2.datarealities.com/admin/accounts/companies',
            name: 'Test Company',
            accountName: 'Test Account',
            contactEmail: 'test@company.com',
        },
        users: {
            url: 'https://app-dev-v2.datarealities.com/admin/users',
            email: 'test@example.com',
            name: 'Test User',
        },
        groups: {
            url: 'https://app-dev-v2.datarealities.com/admin/accounts/groups',
            name: 'Test Group',
            accountName: 'Test Account',
        },
        factoryTokens: {
            url: 'https://app-dev-v2.datarealities.com/admin/iot/factory_tokens',
            name: 'Test factory token',
            hardwareModel: 'GeForce',
            firmwareVersion: '1.0',
        }
    }
};
