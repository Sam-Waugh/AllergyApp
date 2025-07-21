# Complete Firestore Migration

## Issue
The main issue was that symptom logs and user/child data were still using SQLAlchemy/SQLite database when they should be using Firestore according to the project requirements. This was causing inconsistencies in data storage and retrieval.

## Migration Solution
We've implemented a full migration to Firestore for all user, child, and log data:

1. Created Firestore services:
   - `firestore_users.py` - User management 
   - `firestore_children.py` - Child profile management
   - `firestore_logs.py` - Daily logs management

2. Created Firestore-compatible schemas in `firestore_schemas.py` that use string IDs instead of integer IDs.

3. Created Firestore-compatible routers:
   - `firestore_auth.py` - Authentication with Firestore users
   - `firestore_profiles.py` - Child profile management 
   - `firestore_logs.py` - Daily log management

4. Updated main.py to use these new routers as primary endpoints.

5. Kept legacy SQLAlchemy endpoints for backward compatibility, but moved them to `/api/v1/legacy/` paths.

## Required Firestore Indexes

For optimal performance with the queries we're using, the following Firestore indexes should be created:

### Simple indexes
- Collection: `users`
  - Field: `email` (for user lookup by email)
  - Field: `is_active` (for filtering active users)

- Collection: `children` 
  - Field: `parent_id` (for finding children by parent)
  - Field: `name` (for sorting children by name)

- Collection: `daily_logs`
  - Field: `child_id` (for finding logs by child)
  - Field: `date` (for sorting and filtering by date)

### Composite indexes
- Collection: `daily_logs`
  - Fields: 
    - `child_id` (Ascending)
    - `date` (Descending)
  - Purpose: Efficiently retrieve a child's logs in date order

- Collection: `daily_logs`
  - Fields:
    - `child_id` (Ascending)
    - `date` (Ascending)
    - `eczema_severity` (Ascending)
  - Purpose: Filter logs by date range and severity

- Collection: `daily_logs`
  - Fields:
    - `child_id` (Ascending)
    - `created_at` (Descending)
  - Purpose: Retrieve logs by creation order

## Date Range Queries

When filtering logs by date range, ensure that:
1. All dates are stored in consistent format (UTC)
2. All date comparisons account for potential timezone differences
3. Range queries use proper Firestore operators (`>=` for start date, `<=` for end date)

Example query:
```python
logs_ref = db.collection('daily_logs')
query = (logs_ref
        .where('child_id', '==', child_id)
        .where('date', '>=', start_date)
        .where('date', '<=', end_date)
        .order_by('date', direction=firestore.Query.DESCENDING))
```

## Implementation Notes

1. All IDs in Firestore are strings (not integers like in SQLAlchemy)
2. Dates are stored as Firestore Timestamp objects or datetime objects
3. Lists/arrays are stored directly (no need for JSON serialization)
4. The hybrid AI report generator now retrieves data exclusively from Firestore

## Future Work

1. Remove legacy SQLAlchemy routes once the frontend is fully migrated
2. Remove SQLAlchemy models and database setup
3. Update any remaining endpoints (photos, environment) to use Firestore
