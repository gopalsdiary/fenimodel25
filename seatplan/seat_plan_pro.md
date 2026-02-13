🏗️ ExamSeat Planner Pro: Full Development Prompt
Role: You are an expert Full-Stack Developer specializing in Next.js 14 (App Router), Supabase (PostgreSQL), and Tailwind CSS.

Objective: Build a comprehensive "Exam Seat Planning System" that automates student seating based on complex logic (Gender, Class, Roll No) while allowing manual overrides and PDF generation.

1. Database Schema & Supabase Setup
Create a robust PostgreSQL schema in Supabase with the following tables and relationships:

টেবিল: student_database
ফিল্ড (ফিল্টার/লিস্ট):
session
active_class
active_section
status
ফিল্ড (ছাত্র বিশদ লোড):
iid
student_name_en
father_name_en
group (বা GROUP)
status
session
active_class
active_section
active_roll


rooms: id, building_name, room_no, capacity, rows, columns (for grid layout), bench_size.

classes: id, class_name, section_name.

seat_plans: id, exam_name, student_id, room_id, seat_no, row_index, col_index, academic_year.

settings: Institution details, QR code config, system preferences.

2. Core Logic & Features to Implement
A. Smart Auto-Planning Algorithm (The "Z" & "I" Systems)
Implement an algorithm that distributes students across rooms based on:

Sequence Patterns: Support both Z-pattern (filling row by row) and I-pattern (filling column by column).

Gender Logic: Option to keep boys and girls in separate rows/blocks or alternate them.

Anti-Cheating: Ensure students of the same class/section do not sit directly next to each other (if multiple classes are in one room).

Special Needs: Automatically place students marked with "special needs" in the first row near the door.

B. Manual Planning & UI
Drag-and-Drop: A visual grid representing the room where admins can drag a student from one seat to another.

Conflict Detection: Real-time alerts if a seat is double-booked or if a room exceeds capacity.

Excel Integration: Bulk upload students and rooms via .xlsx or .csv.

C. Reporting & Export
PDF Generation: * Room-wise Seat Map (to stick on doors).

Student Admit Cards with QR codes.

Attendance Sheets sorted by Roll No.

Printable Labels: Small seat labels with Name, Roll, and Class.

3. Technical Requirements (Next.js + Supabase)
Frontend: Next.js 14, Tailwind CSS, Lucide React (Icons), Shadcn UI (Components), Framer Motion (for drag-drop).

State Management: TanStack Query (React Query) for server state.

Auth: Supabase Auth (Admin/Teacher roles).

Storage: Supabase Storage for student photos.

4. Step-by-Step Implementation Instructions
Setup: Initialize Next.js with Tailwind and Supabase client.

Dashboard: Create a summary view showing total students, rooms, and upcoming exams.

Student Management: Build a CRUD interface for student data with filtering by class/gender.

Room Configuration: A UI to define room grids (e.g., 5 rows x 4 columns).

The Planner Engine: * Create a "Plan Generator" page.

Input: Select classes, select rooms, choose "Z" or "I" pattern, choose gender-wise separation.

Output: A preview of the seat plan.

Search & Filter: Advanced search to find any student's seat instantly by Roll No.

5. Advanced Features (Bonus)
Responsive Design: Fully mobile-friendly for teachers to check seats on their phones during the exam.

Output Style: Please provide the Folder Structure, Database SQL Schema, and the Core Algorithm Logic in TypeScript. Use Shadcn UI for the components.
write also a database sql schema for the above requirements.