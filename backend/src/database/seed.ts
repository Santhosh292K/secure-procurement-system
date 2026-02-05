/**
 * Seed database with initial data
 */

import { Database } from './database';
import { HashUtil } from '../utils/security/hash.util';

export async function seedDatabase(): Promise<void> {
    console.log('Seeding database...');

    try {
        // Check if admin already exists
        const existingAdmin = await Database.get('SELECT * FROM users WHERE email = ?', [
            'admin@procurement.com'
        ]);

        if (existingAdmin) {
            console.log('Database already seeded');
            return;
        }

        // Create admin user
        const adminPassword = await HashUtil.hashPassword('admin123');
        await Database.run(
            `INSERT INTO users (email, password_hash, full_name, role, company_name, phone)
       VALUES (?, ?, ?, ?, ?, ?)`,
            ['admin@procurement.com', adminPassword, 'Admin User', 'admin', 'Procurement Corp', '+1234567890']
        );

        // Create sample vendors
        const vendor1Password = await HashUtil.hashPassword('vendor123');
        await Database.run(
            `INSERT INTO users (email, password_hash, full_name, role, company_name, phone)
       VALUES (?, ?, ?, ?, ?, ?)`,
            ['vendor1@techsolutions.com', vendor1Password, 'John Doe', 'vendor', 'Tech Solutions Inc', '+1234567891']
        );

        const vendor2Password = await HashUtil.hashPassword('vendor123');
        await Database.run(
            `INSERT INTO users (email, password_hash, full_name, role, company_name, phone)
       VALUES (?, ?, ?, ?, ?, ?)`,
            ['vendor2@innovate.com', vendor2Password, 'Jane Smith', 'vendor', 'Innovate Systems Ltd', '+1234567892']
        );

        // Create sample approvers
        const approver1Password = await HashUtil.hashPassword('approver123');
        await Database.run(
            `INSERT INTO users (email, password_hash, full_name, role, company_name, phone)
       VALUES (?, ?, ?, ?, ?, ?)`,
            [
                'approver1@procurement.com',
                approver1Password,
                'Mike Johnson',
                'approver',
                'Procurement Corp',
                '+1234567893'
            ]
        );

        const approver2Password = await HashUtil.hashPassword('approver123');
        await Database.run(
            `INSERT INTO users (email, password_hash, full_name, role, company_name, phone)
       VALUES (?, ?, ?, ?, ?, ?)`,
            [
                'approver2@procurement.com',
                approver2Password,
                'Sarah Williams',
                'approver',
                'Procurement Corp',
                '+1234567894'
            ]
        );

        console.log('✓ Database seeded successfully');
        console.log('\nDefault Credentials:');
        console.log('Admin: admin@procurement.com / admin123');
        console.log('Vendor1: vendor1@techsolutions.com / vendor123');
        console.log('Vendor2: vendor2@innovate.com / vendor123');
        console.log('Approver1: approver1@procurement.com / approver123');
        console.log('Approver2: approver2@procurement.com / approver123');
    } catch (error) {
        console.error('Error seeding database:', error);
        throw error;
    }
}

// Run seed if called directly
if (require.main === module) {
    Database.initialize()
        .then(() => seedDatabase())
        .then(() => {
            console.log('Seeding complete');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Seeding failed:', error);
            process.exit(1);
        });
}
