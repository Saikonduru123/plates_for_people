#!/usr/bin/env python3
"""Fix admin user for login"""
import sys
sys.path.insert(0, '/home/whirldata/plates_for_people/backend')

from passlib.context import CryptContext
import psycopg2

pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')

try:
    # Hash password
    hashed = pwd_context.hash('admin123')
    print(f"Password hash generated: {hashed[:50]}...")
    
    # Connect to database
    conn = psycopg2.connect(
        host='127.0.0.1',
        database='plates_for_people',
        user='postgres',
        password='Newborn@123'
    )
    cur = conn.cursor()
    
    # Check if admin exists
    cur.execute("SELECT id, role FROM users WHERE email = 'admin@platesforpeople.org'")
    result = cur.fetchone()
    
    if result:
        admin_id, role = result
        print(f"\n✅ Admin user found: ID={admin_id}, Role={role}")
        
        # Update password
        cur.execute(
            "UPDATE users SET password_hash = %s, is_active = %s, is_verified = %s WHERE email = 'admin@platesforpeople.org'",
            (hashed, True, True)
        )
        print("✅ Updated admin password and status")
    else:
        # Create new admin
        cur.execute(
            """INSERT INTO users (email, password_hash, role, is_active, is_verified, created_at) 
               VALUES (%s, %s, %s, %s, %s, NOW()) RETURNING id""",
            ('admin@platesforpeople.org', hashed, 'ADMIN', True, True)
        )
        admin_id = cur.fetchone()[0]
        print(f"✅ Created new admin user with ID: {admin_id}")
    
    conn.commit()
    
    # Test password verification
    cur.execute("SELECT password_hash FROM users WHERE email = 'admin@platesforpeople.org'")
    stored_hash = cur.fetchone()[0]
    
    if pwd_context.verify('admin123', stored_hash):
        print("✅ Password verification successful!")
    else:
        print("❌ Password verification FAILED!")
    
    # Final verification
    cur.execute("SELECT id, email, role, is_active, is_verified FROM users WHERE email = 'admin@platesforpeople.org'")
    admin = cur.fetchone()
    
    print("\n📋 Admin User Details:")
    print(f"   ID: {admin[0]}")
    print(f"   Email: {admin[1]}")
    print(f"   Role: {admin[2]}")
    print(f"   Active: {admin[3]}")
    print(f"   Verified: {admin[4]}")
    
    print("\n🔐 Admin Credentials:")
    print("   Email: admin@platesforpeople.org")
    print("   Password: admin123")
    
    cur.close()
    conn.close()
    
    print("\n✅ Admin user is ready for login!")
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
