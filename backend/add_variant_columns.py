#!/usr/bin/env python3
"""Direct migration script to add denomination and selling_price to product_variants"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import get_db
from sqlalchemy import text

def add_columns():
    """Add denomination and selling_price columns directly to database"""
    db = next(get_db())
    try:
        # Check if columns already exist
        result = db.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'product_variants' AND column_name IN ('denomination', 'selling_price')"))
        existing_columns = {row[0] for row in result}
        
        if 'denomination' not in existing_columns:
            print("Adding 'denomination' column...")
            db.execute(text("ALTER TABLE product_variants ADD COLUMN denomination NUMERIC(10,2)"))
            db.execute(text("UPDATE product_variants SET denomination = price"))
            db.commit()
            print("✓ denomination column added")
        
        if 'selling_price' not in existing_columns:
            print("Adding 'selling_price' column...")
            db.execute(text("ALTER TABLE product_variants ADD COLUMN selling_price NUMERIC(10,2)"))
            db.execute(text("UPDATE product_variants SET selling_price = price"))
            db.commit()
            print("✓ selling_price column added")
        
        print("\n✓ All columns added successfully!")
        return True
    except Exception as e:
        print(f"✗ Error: {e}")
        db.rollback()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    success = add_columns()
    sys.exit(0 if success else 1)
