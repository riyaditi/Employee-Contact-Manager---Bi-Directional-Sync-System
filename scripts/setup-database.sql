CREATE TABLE employee_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sheet_row_id TEXT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  department TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create indexes
CREATE INDEX idx_employee_email ON employee_contacts(email);
CREATE INDEX idx_employee_department ON employee_contacts(department);
