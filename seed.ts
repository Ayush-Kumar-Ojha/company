import { db } from "./db";
import { colleges, events, students, registrations, attendance, feedback } from "@shared/schema";

async function seed() {
  console.log("🌱 Seeding database...");

  try {
    // Create colleges
    const [college1, college2, college3] = await db
      .insert(colleges)
      .values([
        { name: "Massachusetts Institute of Technology" },
        { name: "Stanford University" },
        { name: "University of California, Berkeley" },
      ])
      .returning();

    console.log("✅ Created colleges");

    // Create events
    const [event1, event2, event3, event4] = await db
      .insert(events)
      .values([
        {
          collegeId: college1.id,
          name: "AI & Machine Learning Workshop",
          type: "Workshop",
          description: "Learn the fundamentals of AI and ML with hands-on projects",
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          maxCapacity: 50,
          createdBy: "Dr. Sarah Johnson",
        },
        {
          collegeId: college2.id,
          name: "Tech Career Fair 2024",
          type: "Career",
          description: "Meet with top tech companies and explore career opportunities",
          date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
          maxCapacity: 200,
          createdBy: "Career Services",
        },
        {
          collegeId: college3.id,
          name: "Innovation Exhibition",
          type: "Exhibition",
          description: "Showcase of student projects and innovative solutions",
          date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
          maxCapacity: 100,
          createdBy: "Prof. Michael Chen",
        },
        {
          collegeId: college1.id,
          name: "Cultural Fest 2024",
          type: "Cultural",
          description: "Celebrate diversity with music, dance, and food from around the world",
          date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          maxCapacity: 300,
          createdBy: "Student Council",
        },
      ])
      .returning();

    console.log("✅ Created events");

    // Create students
    const [student1, student2, student3, student4, student5] = await db
      .insert(students)
      .values([
        {
          name: "Alice Johnson",
          email: "alice.johnson@student.mit.edu",
          collegeId: college1.id,
        },
        {
          name: "Bob Smith",
          email: "bob.smith@student.stanford.edu",
          collegeId: college2.id,
        },
        {
          name: "Carol Davis",
          email: "carol.davis@student.berkeley.edu",
          collegeId: college3.id,
        },
        {
          name: "David Wilson",
          email: "david.wilson@student.mit.edu",
          collegeId: college1.id,
        },
        {
          name: "Emma Brown",
          email: "emma.brown@student.stanford.edu",
          collegeId: college2.id,
        },
      ])
      .returning();

    console.log("✅ Created students");

    // Create registrations
    const [reg1, reg2, reg3, reg4, reg5] = await db
      .insert(registrations)
      .values([
        {
          eventId: event1.id,
          studentId: student1.id,
        },
        {
          eventId: event1.id,
          studentId: student2.id,
        },
        {
          eventId: event2.id,
          studentId: student3.id,
        },
        {
          eventId: event3.id,
          studentId: student4.id,
        },
        {
          eventId: event4.id,
          studentId: student5.id,
        },
      ])
      .returning();

    console.log("✅ Created registrations");

    // Create attendance records
    await db
      .insert(attendance)
      .values([
        {
          registrationId: reg1.id,
          attended: true,
        },
        {
          registrationId: reg2.id,
          attended: false,
        },
        {
          registrationId: reg3.id,
          attended: true,
        },
      ]);

    console.log("✅ Created attendance records");

    // Create feedback
    await db
      .insert(feedback)
      .values([
        {
          registrationId: reg1.id,
          rating: 5,
          comment: "Excellent workshop! Learned so much about AI and ML.",
        },
        {
          registrationId: reg3.id,
          rating: 4,
          comment: "Great career fair with many opportunities.",
        },
      ]);

    console.log("✅ Created feedback");

    console.log("🎉 Database seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

// Run if called directly (ES module way)
const runSeed = async () => {
  try {
    await seed();
    console.log("✅ Seeding completed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

// Check if this file is being run directly
if (process.argv[1].endsWith('seed.ts') || process.argv[1].endsWith('seed.js')) {
  runSeed();
}

export { seed };