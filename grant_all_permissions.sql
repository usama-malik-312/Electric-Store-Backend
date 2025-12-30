-- Grant all permissions to all roles
-- This script will assign every permission to every role in the system
-- Run this if you need to give all users all permissions

-- Insert all permission-role combinations
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    r.id AS role_id,
    p.id AS permission_id
FROM roles r
CROSS JOIN permissions p
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Display summary
SELECT 
    r.name AS role_name,
    COUNT(rp.permission_id) AS permission_count
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
GROUP BY r.id, r.name
ORDER BY r.name;

