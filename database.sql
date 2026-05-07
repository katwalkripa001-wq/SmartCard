-- =============================================
--  SMART CARD MANAGEMENT SYSTEM — database.sql
--  Run this in phpMyAdmin or MySQL CLI
-- =============================================

-- 1. Create the database
CREATE DATABASE IF NOT EXISTS smartcard_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE smartcard_db;

-- 2. Create the table
CREATE TABLE IF NOT EXISTS smart_cards (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(150)  NOT NULL,
  card_number VARCHAR(50)   NOT NULL UNIQUE,
  district    VARCHAR(100),
  ward        VARCHAR(100),
  -- status must be one of: 'distributed', 'printing'
  -- if no row found → PHP returns 'notfound' automatically
  status      ENUM('distributed', 'printing') NOT NULL DEFAULT 'printing',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 3. Sample data (replace with real data)
INSERT INTO smart_cards (name, card_number, district, ward, status) VALUES
('Ram Bahadur Thapa',    'SC-2024-00123', 'Kathmandu', 'Ward No. 5',  'distributed'),
('Sita Kumari Sharma',   'SC-2024-00456', 'Lalitpur',  'Ward No. 3',  'printing'),
('Hari Prasad Koirala',  'SC-2024-00789', 'Bhaktapur', 'Ward No. 7',  'distributed'),
('Gita Devi Adhikari',   'SC-2024-01011', 'Kathmandu', 'Ward No. 12', 'printing'),
('Bishnu Prasad Poudel', 'SC-2024-01234', 'Kathmandu', 'Ward No. 2',  'distributed');

-- 4. To search manually in SQL (for testing):
-- SELECT * FROM smart_cards WHERE name = 'Ram Bahadur Thapa';
-- SELECT * FROM smart_cards WHERE card_number = 'SC-2024-00123';
-- SELECT * FROM smart_cards WHERE name = 'Ram Bahadur Thapa' AND card_number = 'SC-2024-00123';
