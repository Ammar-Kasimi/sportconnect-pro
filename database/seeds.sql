-- database/seeds.sql

-- Nettoyage complet avant l'insertion pour éviter les doublons
TRUNCATE TABLE waiting_list, registrations, members, activities, families, associations, facilities RESTART IDENTITY CASCADE;

-- 1. Complexes sportifs municipaux (avec capacités ERP et divisibilité)
INSERT INTO facilities (name, address, erp_capacity, is_divisible) VALUES
('Gymnase Victor Hugo', '12 Rue de Paris', 30, true),
('Centre Aquatique Olympique', '5 Boulevard Maritime', 50, false),
('Dojo Municipal', '8 Allée des Sports', 20, false);

-- 2. Associations sportives partenaires
INSERT INTO associations (name, contact_email, phone) VALUES
('Club Nautique Métropolitain', 'contact@nautique-sport.fr', '0102030405'),
('Judo Club de la Ville', 'info@judoclub.fr', '0607080910'),
('Boxing Club Municipal', 'ring@boxingclub.fr', '0708091011');

-- 3. Foyers fiscaux (pour tester les remises fratrie et QF)
INSERT INTO families (family_code, quotient_familial) VALUES
('FAM-MARTIN-01', 520.00),
('FAM-DUPONT-02', 780.00),
('FAM-BERNARD-03', 1200.00);

-- 4. Activités & Cours (day_of_week corrigé en VARCHAR)
INSERT INTO activities (association_id, facility_id, sub_zone, name, base_price, max_capacity, day_of_week, start_time, end_time, target_category, is_high_risk) VALUES
(1, 2, NULL, 'Natation Loisir Adulte', 200.00, 25, 'Lundi', '18:00:00', '19:30:00', 'Senior', false),
(2, 3, NULL, 'Judo Éveil / Baby-Sport', 150.00, 15, 'Mercredi', '14:00:00', '15:00:00', 'Éveil / Baby-Sport', false),
(2, 3, NULL, 'Judo Minimes (U13)', 180.00, 2, 'Mercredi', '15:00:00', '16:30:00', 'Minime (U13)', false),
(3, 1, 'Demi-terrain A', 'Boxe Anglaise Débutant', 220.00, 12, 'Jeudi', '19:00:00', '20:30:00', 'Senior', true);

-- 5. Adhérents / Membres
INSERT INTO members (family_id, first_name, last_name, birth_date, is_resident, pass_sport_code, medical_certificate_date) VALUES
(1, 'Lucas', 'Martin', '2014-06-15', true, 'PASS-SPORT-2026-A', '2025-09-01'), 
(1, 'Emma', 'Martin', '2016-03-22', true, NULL, '2025-09-01'),               
(2, 'Thomas', 'Dupont', '1995-11-04', false, NULL, '2024-05-10'),             
(3, 'Julien', 'Bernard', '1990-01-10', true, NULL, '2021-01-01'),
(3, 'Sophie', 'Bernard', '2015-05-05', true, NULL, '2025-01-01');

-- 6. Inscriptions initiales (remplit l'activité Judo U13 avec 2 places sur 2)
INSERT INTO registrations (member_id, activity_id, final_price, payment_plan, status) VALUES
(1, 3, 150.00, 'single', 'confirmed'),
(2, 3, 127.50, 'three_times', 'confirmed'),
(3, 1, 270.00, 'single', 'confirmed');

-- 7. File d'attente (Un adhérent tente de s'inscrire au Judo U13 qui est déjà plein)
INSERT INTO waiting_list (activity_id, member_id, priority_score, status) VALUES
(3, 5, 10, 'waiting');