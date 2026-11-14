DROP TABLE IF EXISTS attendance;
DROP TYPE IF EXISTS attendance_status;
DROP TABLE IF EXISTS users;
DROP TYPE IF EXISTS role_type;
DROP TABLE IF EXISTS employee;
DROP TYPE IF EXISTS employment_status;
DROP TYPE IF EXISTS salary_type;
DROP TABLE IF EXISTS department;
DROP TABLE IF EXISTS work_schedule;

CREATE TABLE work_schedule (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    work_days JSONB NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    grace_period_minutes INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE department (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TYPE employment_status AS ENUM (
    'active',
    'inactive',
    'resigned'
);
CREATE TYPE salary_type AS ENUM (
    'monthly',
    'daily'
);

CREATE TABLE employee (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    employee_number VARCHAR(50) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    position VARCHAR(100) NOT NULL,
    hire_date DATE NOT NULL,
    employment_status employment_status NOT NULL DEFAULT 'active',
    base_salary NUMERIC(10,2) NOT NULL,
    salary_type salary_type NOT NULL, 
    sss_number VARCHAR(30) UNIQUE,
    philhealth_number VARCHAR(30) UNIQUE,
    pagibig_number VARCHAR(30) UNIQUE,
    tin VARCHAR(30) UNIQUE,
    department_id INT NOT NULL REFERENCES department(id) ON DELETE RESTRICT,
    work_schedule_id INT NOT NULL REFERENCES work_schedule(id) ON DELETE RESTRICT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TYPE user_role AS ENUM (
    'employee',
    'hr',
    'admin'
);

CREATE TABLE users (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    employee_id INT NOT NULL UNIQUE REFERENCES employee(id) ON DELETE RESTRICT,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'employee',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TYPE attendance_status AS ENUM (
    'present',
    'late',
    'absent',
    'half_day'
);

CREATE TABLE attendance (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    employee_id INT NOT NULL REFERENCES employee(id) ON DELETE RESTRICT,
    attendance_date DATE NOT NULL,
    clock_in TIMESTAMPTZ,
    clock_out TIMESTAMPTZ,
    status attendance_status NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (employee_id, attendance_date),
    CHECK (
        clock_out IS NULL
        OR clock_in IS NULL
        OR clock_out >= clock_in
    )
);