#!/usr/bin/env python3
"""Clean up empty category names"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import get_db
from app.models.category import Category
from sqlalchemy import select, text

def cleanup_categories():
    """Remove or fix categories with empty names"""
    db = next(get_db())
    try:
        # Find categories with empty or dash names
        categories = db.scalars(select(Category).order_by(Category.id)).all()
        print(f"Total categories: {len(categories)}")
        
        empty_categories = []
        for cat in categories:
            if not cat.name or cat.name.strip() in ['-', '']:
                empty_categories.append(cat)
        
        print(f"\nCategories with empty names: {len(empty_categories)}")
        
        if empty_categories:
            print("\nDeleting empty categories:")
            for cat in empty_categories:
                print(f"  Deleting ID: {cat.id}, Name: '{cat.name}', Slug: '{cat.slug}'")
                db.delete(cat)
            
            db.commit()
            print(f"\n✓ Deleted {len(empty_categories)} empty categories")
        
        # Show remaining categories
        remaining = db.scalars(select(Category).order_by(Category.id)).all()
        print(f"\nRemaining categories ({len(remaining)}):")
        for cat in remaining:
            print(f"  ID: {cat.id}, Name: '{cat.name}', Slug: '{cat.slug}', Active: {cat.is_active}")
        
        return True
    except Exception as e:
        print(f"✗ Error: {e}")
        db.rollback()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    success = cleanup_categories()
    sys.exit(0 if success else 1)
