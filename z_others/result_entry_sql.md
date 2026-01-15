z_others\result_entry.html এ করবে। 

প্রথমে "student_database_others" টেবিল থেকে ডাটা লোড নেয়ার জন্য iid ইনপুট চাইবে, ইনপুট দেয়ার পর লোড দিলে 
  1. student_name_en text null,   father_name_en text null লোড নিবে;
  2. class_2025 text null,   section_2025 text null,   roll_2025 numeric null,   exam_name_year text এন্ট্রি চাইবে।
  ৩. এন্ট্রি দিলে পরবর্তীতে  নিচের টেবিলের তথ্যগুলো এন্টি চাইবে। 
৪। দিয়ে সেভ দিলে আপডেটেড দেখাবে। 
------------------ 
এখানে বিষয় ও অন্যান্য লজিক এর জন্য দেখতে পারো এই চারটি ফাইল> resultprocessing_ann25\result_entry_admin.html; resultprocessing_ann25/2_total_average.html;  resultprocessing_ann25/3_Subject_GPA.html ;resultprocessing_ann25/4_gpa_final.html


where table public.exam_others_school (
  iid bigint not null,
  class_2025 text null,
  section_2025 text null,
  roll_2025 numeric null,
  student_name_en text null,
  father_name_en text null,
  "*Bangla 1st Paper_CQ" numeric null,
  "*Bangla 1st Paper_MCQ" numeric null,
  "*Bangla 1st Paper_Total" numeric null,
  "*Bangla 2nd Paper_CQ" numeric null,
  "*Bangla 2nd Paper_MCQ" numeric null,
  "*Bangla 2nd Paper_Total" numeric null,
  "*English 1st Paper_Total" numeric null,
  "*English 2nd Paper_CQ" numeric null,
  "*Mathematics_CQ" numeric null,
  "*Mathematics_MCQ" numeric null,
  "*Mathematics_Total" numeric null,
  "*Religion_CQ" numeric null,
  "*Religion_MCQ" numeric null,
  "*Religion_Total" numeric null,
  "*Science_CQ" numeric null,
  "*Science_MCQ" numeric null,
  "*Science_Total" numeric null,
  "*ICT_MCQ" numeric null,
  "*ICT_Practical" numeric null,
  "*ICT_Total" numeric null,
  "*Bangladesh And Global Studies_CQ" numeric null,
  "*Bangladesh And Global Studies_MCQ" numeric null,
  "*Bangladesh And Global Studies_Total" numeric null,
  "*Bangla 1st Paper_GPA" text null,
  "*English 1st Paper_GPA" text null,
  "*Mathematics_GPA" text null,
  "*Religion_GPA" text null,
  "*Science_GPA" text null,
  "*ICT_GPA" text null,
  "*Bangladesh And Global Studies_GPA" text null,
  father_mobile numeric null,
  "*English 1st Paper_CQ" numeric null,
  "*English 2nd Paper_Total" numeric null,
  total_mark numeric null,
  average_mark numeric null,
  gpa_final numeric null,
  count_absent text null,
  class_rank numeric null,
  remark text null,
  exam_name_year text null,
  constraint exam_others_pkey primary key (iid),
  constraint exam_others_iid_key unique (iid)
) TABLESPACE pg_default;
