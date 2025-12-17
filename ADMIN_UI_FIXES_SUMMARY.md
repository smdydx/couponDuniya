# Admin Dashboard UI & Functionality Fixes

## 1. Tabbed Interface Implementation
Refactored the following Admin pages to use a cleaner, tab-wise layout for easier data entry:
- **Merchants**: Broken down into *General*, *Business*, *Financial*, and *Settings* tabs.
- **Products**: Broken down into *Details*, *Pricing & Inventory*, and *Settings* tabs.
- **Offers**: Broken down into *General* and *Settings* tabs.

## 2. Status Update Fixes
Addressed the issue where status updates (Active, Featured, Verified, Bestseller) were not saving correctly.
- **Backend (`backend/app/api/v1/admin.py`)**:
    - Updated `create_merchant` and `update_merchant` to correctly process `is_featured` and `is_verified`.
    - Updated `create_admin_product` and `update_admin_product` to correctly process `is_featured` and `is_bestseller`.
- **Frontend**:
    - Added UI Switches for *Featured* and *Bestseller* to the Product edit modal.
    - Ensured all status switches correctly bind to the form data.

## 3. Type Definitions
- Updated global `Product` type definition to include the missing `is_featured` field.

## Usage
- Go to Admin > Merchants/Products/Offers.
- Click "Add New" or "Edit".
- You will see the new Tabbed interface.
- Toggling "Active", "Featured", "Verified", or "Bestseller" will now correctly persist to the database.
