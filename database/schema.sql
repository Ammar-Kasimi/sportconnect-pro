DROP TABLE IF EXISTS waiting_list;
DROP TABLE IF EXISTS registrations;
DROP TABLE IF EXISTS members;
DROP TABLE IF EXISTS families;
DROP TABLE IF EXISTS activities;
DROP TABLE IF EXISTS associations;
DROP TABLE IF EXISTS facilities;

CREATE TABLE facilities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    address TEXT NOT NULL,
    erp_capacity INT NOT NULL,
    is_divisible BOOLEAN DEFAULT FALSE
);

CREATE TABLE associations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    contact_email VARCHAR(150) NOT NULL,
    phone VARCHAR(30)
);

CREATE TABLE activities (
    id SERIAL PRIMARY KEY,
    association_id INT REFERENCES associations(id),
    facility_id INT REFERENCES facilities(id),
    sub_zone VARCHAR(50),
    title VARCHAR(150) NOT NULL,
    base_price DECIMAL(10, 2) NOT NULL,
    max_capacity INT NOT NULL,
    day_of_week INT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    target_category VARCHAR(50) DEFAULT 'Tous publics',
    is_high_risk BOOLEAN DEFAULT FALSE
);

CREATE TABLE families (
    id SERIAL PRIMARY KEY,
    family_code VARCHAR(50) UNIQUE NOT NULL,
    quotient_familial DECIMAL(10, 2) NOT NULL
);

CREATE TABLE members (
    id SERIAL PRIMARY KEY,
    family_id INT REFERENCES families(id),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    birth_date DATE NOT NULL,
    is_resident BOOLEAN DEFAULT TRUE,
    pass_sport_code VARCHAR(50),
    medical_certificate_date DATE NOT NULL
);

CREATE TABLE registrations (
    id SERIAL PRIMARY KEY,
    member_id INT REFERENCES members(id),
    activity_id INT REFERENCES activities(id),
    final_price DECIMAL(10, 2) NOT NULL,
    payment_plan VARCHAR(20) DEFAULT 'single',
    status VARCHAR(30) DEFAULT 'confirmed'
);

CREATE TABLE waiting_list (
    id SERIAL PRIMARY KEY,
    activity_id INT REFERENCES activities(id),
    member_id INT REFERENCES members(id),
    priority_score INT DEFAULT 0,
    status VARCHAR(30) DEFAULT 'waiting',
    deadline_confirmation TIMESTAMP
);