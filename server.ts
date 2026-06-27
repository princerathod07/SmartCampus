import { supabase } from "./config/supabase";

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

function simulateCampusFAQ(q: string): string {
  const l = q.toLowerCase();
  if (l.includes("wifi") || l.includes("internet")) return "📶 Campus WiFi SSID is 'SmartCampus_Secure'. To connect, login using your student ID and registration password. Tech support is at Block B.";
  if (l.includes("library") || l.includes("book")) return "📚 The library operates Mon-Sat 8:00 AM – 8:00 PM. Book checkouts are valid for a maximum of 14 days, and overdue fees are $0.50 per day.";
  if (l.includes("curfew") || l.includes("hostel")) return "🏠 All on-campus residence halls strictly secure outer security gates starting at 10:00 PM. Late check-ins require administrative signatures.";
  if (l.includes("cafeteria") || l.includes("food") || l.includes("lunch")) return "🍽️ The Main Cafeteria is open 7:30 AM to 7:00 PM on weekdays. Highlights: Monday Special features vegetarian lunch platters.";
  if (l.includes("exam") || l.includes("test")) return "🗓️ Term papers and standard mid-sem testing are listed under Announcements & Timetables. Check dates to configure alert reminders.";
  return "🤖 I'm operating in Campus Assistant Mode. Let me know if you need help with assignments, books, Wi-Fi password, or complaints!";
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // =========================
  // SUPABASE TEST ROUTE
  // =========================
  app.get("/api/test-db", async (req, res) => {
    try {
      const { data, error } = await supabase.from("books").select("*");
      if (error) return res.status(500).json(error);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // =========================
  // BOOKS API
  // =========================
  app.get("/api/books", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) return res.status(500).json(error);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/books", async (req, res) => {
    try {
      const { title, author } = req.body;
      const { data, error } = await supabase
        .from("books")
        .insert([{ title, author, available: true }])
        .select();
      if (error) return res.status(500).json(error);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.patch("/api/books/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { available } = req.body;
      const { data, error } = await supabase
        .from("books")
        .update({ available })
        .eq("id", id)
        .select();
      if (error) return res.status(500).json(error);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/books/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { error } = await supabase.from("books").delete().eq("id", id);
      if (error) return res.status(500).json(error);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // =========================
  // ANNOUNCEMENTS API
  // =========================
  app.get("/api/announcements", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) return res.status(500).json(error);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/announcements", async (req, res) => {
    try {
      const { title, message } = req.body;
      const { data, error } = await supabase
        .from("announcements")
        .insert([{ title, message }])
        .select();
      if (error) return res.status(500).json(error);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/announcements/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { error } = await supabase
        .from("announcements")
        .delete()
        .eq("id", id);
      if (error) return res.status(500).json(error);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // =========================
  // ASSIGNMENTS API
  // =========================
  app.get("/api/assignments", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("assignments")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) return res.status(500).json(error);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/assignments", async (req, res) => {
    try {
      const { title, description, due_date } = req.body;
      const { data, error } = await supabase
        .from("assignments")
        .insert([{ title, description, due_date }])
        .select();
      if (error) return res.status(500).json(error);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/assignments/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { error } = await supabase
        .from("assignments")
        .delete()
        .eq("id", id);
      if (error) return res.status(500).json(error);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // =========================
  // COMPLAINTS API
  // =========================
  app.get("/api/complaints", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("complaints")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) return res.status(500).json(error);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/complaints", async (req, res) => {
    try {
      const { student_id, complaint, status } = req.body;
      const { data, error } = await supabase
        .from("complaints")
        .insert([{ student_id, complaint, status: status || "Pending" }])
        .select();
      if (error) return res.status(500).json(error);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.patch("/api/complaints/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const { data, error } = await supabase
        .from("complaints")
        .update({ status })
        .eq("id", id)
        .select();
      if (error) return res.status(500).json(error);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/complaints/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { error } = await supabase
        .from("complaints")
        .delete()
        .eq("id", id);
      if (error) return res.status(500).json(error);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // =========================
  // USERS API
  // =========================
  app.get("/api/users", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) return res.status(500).json(error);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const { name, email, role } = req.body;
      const { data, error } = await supabase
        .from("users")
        .insert([{ name, email, role: role || "STUDENT" }])
        .select();
      if (error) return res.status(500).json(error);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // =========================
  // CHATBOT API
  // =========================
  app.post("/api/chat", async (req, res) => {
    const { message, history } = req.body;
    try {
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        const reply = simulateCampusFAQ(message);
        return res.json({ reply });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const chatContents =
        history && history.length > 0
          ? [
              ...history.map((h: any) => ({
                role: h.role === "user" ? "user" : "model",
                parts: [{ text: h.text }],
              })),
              {
                role: "user",
                parts: [{ text: message }],
              },
            ]
          : [
              {
                role: "user",
                parts: [{ text: message }],
              },
            ];

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: chatContents,
        config: {
          systemInstruction:
            "You are CampusBot, a highly advanced campus assistant for SmartCampus university portal. Help students and admins with library info, timetables, assignments, complaints, and general campus queries.",
          temperature: 0.7,
        },
      });

      res.json({
        reply: response.text,
      });
    } catch (err: any) {
      console.error("Gemini API Error:", err);
      // Fallback on error
      const reply = simulateCampusFAQ(message);
      res.json({ reply });
    }
  });

  // // =========================
  // // SEED DEFAULT USERS
  // // =========================
  // async function seedDefaultUsers() {
  //   try {
  //     // Clear existing default users to re-seed correctly
  //     await supabase
  //       .from("users")
  //       .delete()
  //       .neq("email", "dummy_unlikely_match_email@nonexistent.com");

  //     console.log("Seeding default users into Supabase with credentials format...");
  //     const { error: insertError } = await supabase
  //       .from("users")
  //       .insert([
  //         { name: "Campus Admin", email: "admin@campus.edu|admin|admin123", role: "ADMIN" },
  //         { name: "student", email: "renish@campus.edu|student|student123", role: "STUDENT" }
  //       ]);
      
  //     if (insertError) {
  //       console.error("Error seeding default users:", insertError.message);
  //     } else {
  //       console.log("Default users seeded successfully.");
  //     }
  //   } catch (err: any) {
  //     console.error("Error in seedDefaultUsers:", err.message);
  //   }
  // }

  // await seedDefaultUsers();
  // =========================
  // VITE SETUP
  // =========================
  if (process.env.NODE_ENV !== "production") {
    console.log(
      "Starting server in DEVELOPMENT mode with Vite middleware..."
    );

    const vite = await createViteServer({
      server: {
        middlewareMode: true,
      },
      appType: "spa",
    });

    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode...");

    const distPath = path.join(process.cwd(), "dist");

    app.use(express.static(distPath));

    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start full-stack server:", err);
  process.exit(1);
});