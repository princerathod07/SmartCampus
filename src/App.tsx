import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, CheckCircle2, Trash2, Clock, Terminal, Activity, Copy, Check, 
  Search, BookOpen, ChevronRight, Heart, User, GraduationCap, AlertCircle, 
  Send, LogOut, Bell, Calendar, UserCheck, ShieldAlert, RefreshCw, LayoutDashboard, BookmarkCheck
} from "lucide-react";

// Robust TypeScript Interfaces
interface UserProfile {
  userId: string;
  username: string;
  fullName: string;
  email: string;
  role: "STUDENT" | "ADMIN";
  department: string;
  semester: string;
  studentId: string;
}

interface ClassSlot {
  day: string;
  start: string;
  end: string;
  subject: string;
  lecturer: string;
  room: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  author: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  timestamp: string;
}

interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  copies: number;
  available: number;
  link: string;
}

interface StudentSubmission {
  timestamp: string;
  note: string;
  fileName?: string;
  studentName: string;
  studentEmail: string;
  studentId: string;
  grade?: string;
  comment?: string;
}

interface Assignment {
  id: string;
  title: string;
  subject: string;
  description: string;
  due: string;
  marks: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  submissions: Record<string, any>; // userId -> StudentSubmission
}

interface Complaint {
  id: string;
  studentId: string;
  studentName: string;
  category: string;
  description: string;
  status: "PENDING" | "REVIEWING" | "RESOLVED";
  remark: string;
  timestamp: string;
}

interface Reminder {
  id: string;
  title: string;
  category: string;
  datetime: string;
  note: string;
  fired: boolean;
}

interface ChatMessage {
  role: "user" | "model";
  text: string;
  time: string;
}

export default function App() {
  // Session & Authentication
  const [session, setSession] = useState<UserProfile | null>(() => {
    const saved = sessionStorage.getItem("sca_session");
    return saved ? JSON.parse(saved) : null;
  });

  const [authTab, setAuthTab] = useState<"login" | "register">("login");
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [authError, setAuthError] = useState("");

  // Register Fields
  const [regFullName, setRegFullName] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regDept, setRegDept] = useState("Computer Science");
  const [regSem, setRegSem] = useState("4");
  const [regPass, setRegPass] = useState("");

  // Global State – data-backed by Supabase via backend API
  const [users, setUsers] = useState<UserProfile[]>([
    { userId: "USR-001", username: "admin", fullName: "Campus Admin", email: "admin@campus.edu|admin|admin123", role: "ADMIN", department: "IT Support", semester: "N/A", studentId: "ADM-999" },
    { userId: "USR-002", username: "student", fullName: "student", email: "renish@campus.edu|student|student123", role: "STUDENT", department: "Computer Science", semester: "4", studentId: "STU-2024-001" }
  ]);

  // Books, announcements, assignments, complaints are loaded from Supabase
  const [books, setBooks] = useState<Book[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [dbLoading, setDbLoading] = useState(true);

  // Reminders & library checkouts & chatbot logs are user-specific
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [borrowedBookIds, setBorrowedBookIds] = useState<string[]>([]);
  const [chatLog, setChatLog] = useState<ChatMessage[]>([]);

  // Timetable is global (remains same for everyone)
  const [timetable, setTimetable] = useState<ClassSlot[]>(() => {
    const saved = localStorage.getItem("sc_timetable");
    return saved ? JSON.parse(saved) : [
      { day: "Monday", start: "09:00", end: "10:30", subject: "OOP with Java", lecturer: "Dr. Patel", room: "Room 204" },
      { day: "Monday", start: "11:00", end: "12:30", subject: "Data Structures", lecturer: "Dr. Smith", room: "Lab 3" },
      { day: "Tuesday", start: "09:00", end: "10:30", subject: "Database Systems", lecturer: "Dr. Lee", room: "Room 101" },
      { day: "Wednesday", start: "14:00", end: "17:00", subject: "Software Engineering Lab", lecturer: "Dr. Johnson", room: "Lab 1" },
      { day: "Thursday", start: "11:00", end: "12:30", subject: "Computer Network Protocols", lecturer: "Dr. Kim", room: "Room 305" },
      { day: "Friday", start: "09:00", end: "10:30", subject: "Algorithms Design", lecturer: "Dr. Johnson", room: "Lab 3" }
    ];
  });

  // Save global timetable
  useEffect(() => {
    localStorage.setItem("sc_timetable", JSON.stringify(timetable));
  }, [timetable]);

  // Synchronize user-specific state on session change (using stable username key)
  useEffect(() => {
    if (session) {
      const savedReminders = localStorage.getItem(`sc_reminders_${session.username}`);
      setReminders(savedReminders ? JSON.parse(savedReminders) : []);

      const savedBorrowed = localStorage.getItem(`sc_borrowed_books_${session.username}`);
      setBorrowedBookIds(savedBorrowed ? JSON.parse(savedBorrowed) : []);

      const savedChatLog = localStorage.getItem(`sc_chatlog_${session.username}`);
      setChatLog(savedChatLog ? JSON.parse(savedChatLog) : [
        { role: "model", text: "👋 Hello! I'm CampusBot, your Smart Campus AI Assistant. Ask me anything about WiFi, library schedules, course credits, or complaints!", time: "09:00" }
      ]);
    } else {
      setReminders([]);
      setBorrowedBookIds([]);
      setChatLog([]);
    }
  }, [session]);

  // Save reminders locally per user
  useEffect(() => {
    if (session) {
      localStorage.setItem(`sc_reminders_${session.username}`, JSON.stringify(reminders));
    }
  }, [reminders, session]);

  // Save library borrowed items locally per user
  useEffect(() => {
    if (session) {
      localStorage.setItem(`sc_borrowed_books_${session.username}`, JSON.stringify(borrowedBookIds));
    }
  }, [borrowedBookIds, session]);

  // Save chatbot logs locally per user
  useEffect(() => {
    if (session) {
      localStorage.setItem(`sc_chatlog_${session.username}`, JSON.stringify(chatLog));
    }
  }, [chatLog, session]);

  // ============================================================
  // FETCH ALL DATA FROM SUPABASE ON MOUNT
  // ============================================================
  useEffect(() => {
    const fetchAll = async () => {
      setDbLoading(true);
      try {
        // --- Books ---
        const booksRes = await fetch("/api/books");
        if (booksRes.ok) {
          const data = await booksRes.json();
          setBooks(data.map((b: any) => ({
            id: b.id,
            title: b.title,
            author: b.author,
            isbn: b.isbn || `ISBN-${Math.floor(100000 + Math.random() * 900000)}`,
            category: b.category || ["Programming", "Software Engineering", "Computer Science"][Math.floor(Math.random() * 3)],
            copies: 1,
            available: b.available ? 1 : 0,
            link: "#"
          })));
        }

        // --- Announcements ---
        const annRes = await fetch("/api/announcements");
        if (annRes.ok) {
          const data = await annRes.json();
          setAnnouncements(data.map((a: any) => ({
            id: a.id,
            title: a.title,
            content: a.message,
            author: "Campus Admin",
            priority: (a.priority || "MEDIUM") as "HIGH" | "MEDIUM" | "LOW",
            timestamp: a.created_at ? a.created_at.slice(0, 10) : ""
          })));
        }

        // --- Assignments ---
        const asgRes = await fetch("/api/assignments");
        if (asgRes.ok) {
          const data = await asgRes.json();
          setAssignments(data.map((a: any) => ({
            id: a.id,
            title: a.title,
            subject: a.subject || "General",
            description: a.description || "",
            due: a.due_date ? a.due_date.slice(0, 10) : "",
            marks: a.marks || "100",
            priority: (a.priority || "MEDIUM") as "HIGH" | "MEDIUM" | "LOW",
            submissions: a.submissions || {}
          })));
        }

        // --- Complaints ---
        const cmpRes = await fetch("/api/complaints");
        if (cmpRes.ok) {
          const data = await cmpRes.json();
          setComplaints(data.map((c: any) => ({
            id: c.id,
            studentId: c.student_id || "STUDENT",
            studentName: "Student",
            category: c.category || "General",
            description: c.complaint || "",
            status: (c.status === "Pending" ? "PENDING" : c.status === "Resolved" ? "RESOLVED" : "REVIEWING") as "PENDING" | "REVIEWING" | "RESOLVED",
            remark: c.remark || "",
            timestamp: c.created_at ? c.created_at.slice(0, 10) : ""
          })));
        }

        // --- Users ---
        const usersRes = await fetch("/api/users");
        if (usersRes.ok) {
          const uData = await usersRes.json();
          const dbUsers = uData.map((u: any) => {
            let email = u.email || "";
            let username = u.email ? u.email.split("@")[0] : u.name.toLowerCase().replace(/\s+/g, "");
            let password = u.role === "ADMIN" ? "admin123" : "student123";

            if (u.email && u.email.includes("|")) {
              const parts = u.email.split("|");
              email = parts[0];
              username = parts[1] || username;
              password = parts[2] || password;
            }

            return {
              userId: String(u.id),
              username: username.toLowerCase(),
              fullName: u.name,
              email: email,
              role: (u.role || "STUDENT") as "STUDENT" | "ADMIN",
              department: u.role === "ADMIN" ? "IT Support" : "Computer Science",
              semester: u.role === "ADMIN" ? "N/A" : "8",
              studentId: u.role === "ADMIN" ? "ADM-999" : `STU-2024-${String(u.id).substring(0, 3)}`,
              password: password
            };
          });

          setUsers(prev => {
            const merged = [...prev];
            dbUsers.forEach((dbU: any) => {
              const existingIdx = merged.findIndex(m => m.email.toLowerCase() === dbU.email.toLowerCase() || m.username.toLowerCase() === dbU.username.toLowerCase());
              if (existingIdx === -1) {
                merged.push(dbU);
              } else {
                merged[existingIdx].userId = dbU.userId;
                merged[existingIdx].password = dbU.password;
                merged[existingIdx].fullName = dbU.fullName;
              }
            });
            return merged;
          });
        }
      } catch (err) {
        console.error("Failed to load data from Supabase:", err);
      } finally {
        setDbLoading(false);
      }
    };
    fetchAll();
  }, []);

  // UI state
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // Timetable Add Slot Fields
  const [newSlotStart, setNewSlotStart] = useState("09:00");
  const [newSlotEnd, setNewSlotEnd] = useState("10:30");
  const [newSlotSubject, setNewSlotSubject] = useState("");
  const [newSlotLecturer, setNewSlotLecturer] = useState("");
  const [newSlotRoom, setNewSlotRoom] = useState("");
  const [editingSlotIdx, setEditingSlotIdx] = useState<number | null>(null);

  // Stateful tracking of student assignment uploads and textnotes
  const [submissionNotes, setSubmissionNotes] = useState<Record<string, string>>({});
  const [submissionFiles, setSubmissionFiles] = useState<Record<string, string>>({});

  // Administrative grading input trackers (keyed by "asgId_studentId")
  const [adminGrades, setAdminGrades] = useState<Record<string, string>>({});
  const [adminFeedback, setAdminFeedback] = useState<Record<string, string>>({});

  // Toasts and clock
  const [toasts, setToasts] = useState<{ id: string; msg: string; type: "success" | "info" | "error" }[]>([]);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Search/Filters
  const [bookSearch, setBookSearch] = useState("");
  const [bookCatFilter, setBookCatFilter] = useState("all");
  const [timetableDay, setTimetableDay] = useState("Monday");

  // Chatbot State
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Administrative Forms
  const [newAnnTitle, setNewAnnTitle] = useState("");
  const [newAnnContent, setNewAnnContent] = useState("");
  const [newAnnPriority, setNewAnnPriority] = useState<"HIGH" | "MEDIUM" | "LOW">("MEDIUM");

  const [newAsgTitle, setNewAsgTitle] = useState("");
  const [newAsgSub, setNewAsgSub] = useState("OOP with Java");
  const [newAsgDue, setNewAsgDue] = useState("");
  const [newAsgMarks, setNewAsgMarks] = useState("100");
  const [newAsgPriority, setNewAsgPriority] = useState<"HIGH" | "MEDIUM" | "LOW">("MEDIUM");
  const [newAsgDesc, setNewAsgDesc] = useState("");

  const [newCompCat, setNewCompCat] = useState("IT Support (WiFi/Portal)");
  const [newCompDesc, setNewCompDesc] = useState("");

  const [newRemTitle, setNewRemTitle] = useState("");
  const [newRemCat, setNewRemCat] = useState("Exam");
  const [newRemTime, setNewRemTime] = useState("");
  const [newRemNote, setNewRemNote] = useState("");

  // Auto Scroll Chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatLog, chatLoading]);

  // Global Time Sync Event
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Real-time Reminder Alarm Checking
  useEffect(() => {
    if (!session) return;
    let changed = false;
    const now = new Date();

    const updatedReminders = reminders.map(r => {
      if (!r.fired && r.datetime) {
        const remDate = new Date(r.datetime);
        if (!isNaN(remDate.getTime()) && now >= remDate) {
          addToast(`⏰ Reminder: ${r.title} ${r.note ? `(${r.note})` : ""}`, "info");
          changed = true;
          return { ...r, fired: true };
        }
      }
      return r;
    });

    if (changed) {
      setReminders(updatedReminders);
    }
  }, [currentTime, reminders, session]);

  const addToast = (msg: string, type: "success" | "info" | "error" = "success") => {
    const id = Math.random().toString();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  // Render-time safe details parser
  const getSubmissionDetails = (sub: any) => {
    if (!sub) return null;
    if (typeof sub === 'string') {
      return {
        timestamp: sub,
        note: "Submitted via default checklist confirmation.",
        fileName: "solution_code.java",
        studentName: "Verified Active Student",
        studentEmail: "student@campus.edu",
        studentId: "STU-2024-001"
      };
    }
    return sub;
  };

  // Auth Operations
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUser || !loginPass) {
      setAuthError("Please fill in all security fields.");
      return;
    }
    const foundUser = users.find(u => u.username.toLowerCase() === loginUser.toLowerCase());
    if (!foundUser) {
      setAuthError("Credentials invalid. Check your username or choose to Register.");
      return;
    }
    // Demo password rules
    if (loginUser === "student" && loginPass !== "student123") {
      setAuthError("Incorrect password for account 'student'.");
      return;
    }
    if (loginUser === "admin" && loginPass !== "admin123") {
      setAuthError("Incorrect password for account 'admin'.");
      return;
    }

    // Match registered database password
    if (loginUser !== "student" && loginUser !== "admin") {
      const dbPassword = (foundUser as any).password;
      if (dbPassword && loginPass !== dbPassword) {
        setAuthError(`Incorrect password for account '${loginUser}'.`);
        return;
      }
    }

    setSession(foundUser);
    sessionStorage.setItem("sca_session", JSON.stringify(foundUser));
    setAuthError("");
    setLoginPass("");
    addToast(`Successfully logged in as ${foundUser.fullName}`, "success");
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFullName || !regUsername || !regEmail || !regPass) {
      setAuthError("All registration criteria are mandatory.");
      return;
    }
    if (users.some(u => u.username.toLowerCase() === regUsername.toLowerCase())) {
      setAuthError("Username is already taken by another account.");
      return;
    }

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regFullName,
          email: `${regEmail}|${regUsername}|${regPass}`,
          role: "STUDENT"
        })
      });

      if (!res.ok) {
        throw new Error("Failed to register user in database.");
      }

      const data = await res.json();
      const savedUser = Array.isArray(data) ? data[0] : data;
      if (!savedUser) {
        throw new Error("Invalid response from database.");
      }

      const newUser: UserProfile & { password?: string } = {
        userId: String(savedUser.id),
        username: regUsername.toLowerCase(),
        fullName: regFullName,
        email: regEmail,
        role: "STUDENT",
        department: regDept,
        semester: regSem,
        studentId: `STU-2026-${Math.floor(100 + Math.random() * 900)}`,
        password: regPass
      };

      setUsers(prev => [...prev, newUser]);
      setRegFullName("");
      setRegUsername("");
      setRegEmail("");
      setRegPass("");
      setAuthError("");
      setAuthTab("login");
      addToast("Registered successfully! You can now sign in.", "success");
    } catch (err: any) {
      console.error("Registration error:", err);
      setAuthError(err.message || "Registration failed. Please try again.");
      addToast("Registration failed.", "error");
    }
  };

  const logout = () => {
    setSession(null);
    sessionStorage.removeItem("sca_session");
    setActiveTab("dashboard");
    addToast("Logged out of SmartCampus Portal.", "info");
  };

  // Student Borrow/Return operations (User-Specific Library)
  const toggleBorrowBook = (bookId: string) => {
    if (!session) return;
    const isAlreadyBorrowed = borrowedBookIds.includes(bookId);
    const book = books.find(b => b.id === bookId);

    if (isAlreadyBorrowed) {
      setBorrowedBookIds(prev => prev.filter(id => id !== bookId));
      addToast(book ? `Returned "${book.title}"` : "Returned book", "success");
    } else {
      setBorrowedBookIds(prev => [...prev, bookId]);
      addToast(book ? `Successfully checked out "${book.title}"` : "Checked out book", "success");
    }
  };

  // Add Alert / Reminder from generic page context
  const setQuickReminder = (title: string, category: string, datetm: string) => {
    const id = `REM-${Date.now().toString().slice(-4)}`;
    const newRem: Reminder = { id, title, category, datetime: datetm, note: "Auto-generated deadline reminder", fired: false };
    setReminders(prev => [newRem, ...prev]);
    addToast(`Set reminder alert for "${title}"`, "success");
  };

  // Save Admin Complaint Response → Supabase
  const updateComplaintStatus = async (compId: string, status: Complaint["status"], remark: string) => {
    setComplaints(prev => prev.map(c => c.id === compId ? { ...c, status, remark } : c));
    try {
      const supabaseStatus = status === "PENDING" ? "Pending" : status === "RESOLVED" ? "Resolved" : "Reviewing";
      const res = await fetch(`/api/complaints/${compId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: supabaseStatus })
      });
      if (!res.ok) throw new Error("Failed to update complaint");
      addToast(`Complaint ticket status updated to ${status}`, "info");
    } catch (err) {
      console.error(err);
      addToast("Failed to update complaint status. Please try again.", "error");
    }
  };

  // Delete complaint → Supabase
  const removeComplaint = async (compId: string) => {
    const prev = complaints;
    setComplaints(c => c.filter(x => x.id !== compId));
    try {
      const res = await fetch(`/api/complaints/${compId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete complaint");
      addToast("Complaint ticket removed.", "success");
    } catch (err) {
      setComplaints(prev);
      addToast("Failed to remove complaint. Please try again.", "error");
    }
  };

  // Post new Announcement → Supabase
  const makeAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnTitle || !newAnnContent) return addToast("Please fill announcement title and body.", "error");
    const titleSnapshot = newAnnTitle;
    const contentSnapshot = newAnnContent;
    setNewAnnTitle("");
    setNewAnnContent("");
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: titleSnapshot, message: contentSnapshot })
      });
      if (!res.ok) throw new Error("Failed to save announcement");
      const saved = await res.json();
      const savedAnn = Array.isArray(saved) ? saved[0] : saved;
      const ann: Announcement = {
        id: savedAnn.id,
        title: savedAnn.title,
        content: savedAnn.message,
        author: session?.fullName || "Campus Admin",
        priority: newAnnPriority,
        timestamp: savedAnn.created_at ? savedAnn.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10)
      };
      setAnnouncements(prev => [ann, ...prev]);
      addToast(`Published Announcement: ${titleSnapshot.substring(0, 30)}...`, "success");
    } catch (err) {
      console.error(err);
      addToast("Failed to publish announcement. Please try again.", "error");
    }
  };

  // Student Homework Submissions
  const submitAssignmentRich = (asgId: string) => {
    if (!session) return;
    const noteText = submissionNotes[asgId]?.trim() || "";
    if (!noteText) {
      addToast("Please write your homework solution notes/contents before submitting.", "error");
      return;
    }
    const uploadedFile = submissionFiles[asgId] || "solution_code.java";

    setAssignments(prev => prev.map(a => {
      if (a.id === asgId) {
        const nextSubs = { ...a.submissions };
        nextSubs[session.userId] = {
          timestamp: new Date().toLocaleString(),
          note: noteText,
          fileName: uploadedFile,
          studentName: session.fullName,
          studentEmail: session.email,
          studentId: session.studentId
        };
        return { ...a, submissions: nextSubs };
      }
      return a;
    }));

    // Reset local inputs
    setSubmissionNotes(prev => {
      const copy = { ...prev };
      delete copy[asgId];
      return copy;
    });
    setSubmissionFiles(prev => {
      const copy = { ...prev };
      delete copy[asgId];
      return copy;
    });

    addToast("Assignment submitted successfully!", "success");
  };

  // Admin submits a grade and comment for a student's submission
  const submitGradeForStudent = (asgId: string, studentId: string) => {
    const key = `${asgId}_${studentId}`;
    const gradeVal = adminGrades[key]?.trim();
    const commentVal = adminFeedback[key]?.trim() || "Reviewed.";

    if (!gradeVal) {
      addToast("Please provide a grade.", "error");
      return;
    }

    setAssignments(prev => prev.map(a => {
      if (a.id === asgId) {
        const nextSubs = { ...a.submissions };
        if (nextSubs[studentId]) {
          const currentSub = getSubmissionDetails(nextSubs[studentId]);

          nextSubs[studentId] = {
            ...currentSub,
            grade: gradeVal,
            comment: commentVal
          };
        }
        return { ...a, submissions: nextSubs };
      }
      return a;
    }));

    addToast("Grades and feedback updated.", "success");
  };

  // Timetable Operations (Global - same for everyone)
  const handleAddTimetableSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlotSubject || !newSlotLecturer || !newSlotRoom) {
      addToast("Please fill in the subject, lecturer and room.", "error");
      return;
    }
    const newSlot: ClassSlot = {
      day: timetableDay,
      start: newSlotStart,
      end: newSlotEnd,
      subject: newSlotSubject,
      lecturer: newSlotLecturer,
      room: newSlotRoom
    };
    
    if (editingSlotIdx !== null) {
      setTimetable(prev => prev.map((s, idx) => idx === editingSlotIdx ? newSlot : s));
      setEditingSlotIdx(null);
      addToast(`Updated timetable entry for ${newSlotSubject}!`, "success");
    } else {
      setTimetable(prev => [...prev, newSlot]);
      addToast(`Added slot for ${newSlotSubject} to ${timetableDay}'s timetable!`, "success");
    }

    setNewSlotSubject("");
    setNewSlotLecturer("");
    setNewSlotRoom("");
  };

  const handleDeleteTimetableSlot = (day: string, start: string, subject: string) => {
    setTimetable(prev => prev.filter(s => !(s.day === day && s.start === start && s.subject === subject)));
    addToast("Class slot deleted from the academic schedule.", "info");
  };

  // Post dynamic assignment → Supabase
  const publishAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAsgTitle) return addToast("Assignment title is required.", "error");
    const titleSnap = newAsgTitle;
    const descSnap = newAsgDesc || "Review criteria checklist.";
    const dueSnap = newAsgDue || new Date().toISOString().slice(0, 10);
    setNewAsgTitle("");
    setNewAsgDesc("");
    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: titleSnap,
          description: descSnap,
          due_date: dueSnap
        })
      });
      if (!res.ok) throw new Error("Failed to save assignment");
      const saved = await res.json();
      const savedAsg = Array.isArray(saved) ? saved[0] : saved;
      const asg: Assignment = {
        id: savedAsg.id,
        title: savedAsg.title,
        subject: newAsgSub,
        description: savedAsg.description || descSnap,
        due: savedAsg.due_date ? savedAsg.due_date.slice(0, 10) : dueSnap,
        marks: newAsgMarks,
        priority: newAsgPriority,
        submissions: {}
      };
      setAssignments(prev => [asg, ...prev]);
      addToast("New assignment posted.", "success");
    } catch (err) {
      console.error(err);
      addToast("Failed to publish assignment. Please try again.", "error");
    }
  };

  // Submit Complaint → Supabase
  const fileComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompDesc || newCompDesc.length < 5) return addToast("Please specify full problem details.", "error");
    const descSnap = newCompDesc;
    setNewCompDesc("");
    try {
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: session?.userId || "STUDENT",
          complaint: `[${newCompCat}] ${descSnap}`,
          status: "Pending"
        })
      });
      if (!res.ok) throw new Error("Failed to submit complaint");
      const data = await res.json();
      const saved = Array.isArray(data) ? data[0] : data;
      if (!saved) throw new Error("No data returned from database.");

      const cmp: Complaint = {
        id: saved.id,
        studentId: saved.student_id || session?.userId || "STUDENT",
        studentName: session?.fullName || "Student",
        category: newCompCat,
        description: descSnap,
        status: "PENDING",
        remark: "",
        timestamp: saved.created_at ? saved.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10)
      };
      setComplaints(prev => [cmp, ...prev]);
      addToast("Your complaint has been submitted successfully.", "success");
    } catch (err) {
      console.error(err);
      addToast("Failed to submit complaint. Please try again.", "error");
    }
  };

  // Add individual task reminder
  const createReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRemTitle || !newRemTime) return;
    const rem: Reminder = {
      id: `REM-${Date.now().toString().slice(-4)}`,
      title: newRemTitle,
      category: newRemCat,
      datetime: newRemTime,
      note: newRemNote,
      fired: false
    };
    setReminders(prev => [rem, ...prev]);
    setNewRemTitle("");
    setNewRemTime("");
    setNewRemNote("");
    addToast("Reminder registered successfully.", "success");
  };

  // Remove reminder
  const deleteReminder = (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
    addToast("Reminder removed.", "info");
  };

  // AI Chat Agent Proxy Call
  const handleChat = async () => {
    if (!chatInput.trim()) return;
    const userText = chatInput.trim();
    setChatInput("");

    // Setup active message list
    const userMsg: ChatMessage = { role: "user", text: userText, time: currentTime.toTimeString().slice(0, 5) };
    const tempLog = [...chatLog, userMsg];
    setChatLog(tempLog);
    setChatLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          history: chatLog.slice(-5) 
        })
      });

      const data = await response.json();
      setChatLog(prev => [...prev, {
        role: "model",
        text: data.reply || "I am here to help. What details do you need?",
        time: new Date().toTimeString().slice(0, 5)
      }]);
    } catch {
      // Fallback FAQ search
      const botText = simulateCampusFAQ(userText);
      setChatLog(prev => [...prev, { role: "model", text: botText, time: new Date().toTimeString().slice(0, 5) }]);
    } finally {
      setChatLoading(false);
    }
  };

  // FAQ fallback engine
  const simulateCampusFAQ = (q: string): string => {
    const l = q.toLowerCase();
    if (l.includes("wifi") || l.includes("internet")) return "📶 Campus WiFi SSID is 'SmartCampus_Secure'. To connect, login using your student ID and registration password. Tech support is at Block B.";
    if (l.includes("library") || l.includes("book")) return "📚 The library operates Mon-Sat 8:00 AM – 8:00 PM. Book checkouts are valid for a maximum of 14 days, and overdue fees are $0.50 per day.";
    if (l.includes("curfew") || l.includes("hostel")) return "🏠 All on-campus residence halls strictly secure outer security gates starting at 10:00 PM. Late check-ins require administrative signatures.";
    if (l.includes("cafeteria") || l.includes("food") || l.includes("lunch")) return "🍽️ The Main Cafeteria is open 7:30 AM to 7:00 PM on weekdays. Highlights: Monday Special features vegetarian lunch platters.";
    if (l.includes("exam") || l.includes("test")) return "🗓️ Term papers and standard mid-sem testing are listed under Announcements & Timetables. Check dates to configure alert reminders.";
    return "🤖 I'm operating in Campus Assistant Mode. Let me know if you need help with assignments, books, Wi-Fi password, or complaints!";
  };

  // Auth Layout (Premium glassmorphic login)
  if (!session) {
    return (
      <div className="min-h-screen bg-[#070913] flex items-center justify-center p-4 relative overflow-hidden font-sans">
        {/* Animated Orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none float-bg"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none float-bg" style={{ animationDelay: "2s" }}></div>

        <div className="max-w-4xl w-full bg-slate-900/40 border border-slate-800/80 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 relative z-10">
          
          {/* Logo Brand Frame */}
          <div className="bg-gradient-to-br from-indigo-700 via-indigo-900 to-slate-950 p-10 flex flex-col justify-between text-white relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent opacity-50"></div>
            <div>
              <div className="flex items-center gap-3 mb-10">
                <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center text-2xl font-bold border border-white/20">🏛️</div>
                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent display-font">SmartCampus</span>
              </div>
              <h1 className="text-3xl font-extrabold leading-tight mb-4 tracking-tight text-white display-font">Your Intelligent Academy Hub.</h1>
              <p className="text-slate-300 text-sm leading-relaxed mb-8">Elevate your college experience with a premium, centralized portal for personalized reminders, collaborative library catalog loans, and interactive AI assistance.</p>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 bg-white/5 p-3.5 rounded-xl border border-white/10 text-xs shadow-inner">
                <span className="text-lg">📚</span>
                <span className="text-slate-200">User-Specific Book Loans &amp; Checkouts</span>
              </div>
              <div className="flex items-center gap-3 bg-white/5 p-3.5 rounded-xl border border-white/10 text-xs text-slate-200 shadow-inner">
                <span className="text-lg">⏰</span>
                <span className="text-slate-200">Dynamic Multi-User Event Reminders</span>
              </div>
            </div>
          </div>

          {/* Form Action */}
          <div className="p-10 flex flex-col justify-center bg-slate-950/60 border-l border-slate-800/80">
            <h2 className="text-2xl font-bold text-white mb-2 display-font">Welcome back</h2>
            <p className="text-slate-400 text-sm mb-6">Access your student or admin panel</p>

            <div className="flex border-b border-slate-800 mb-6 bg-slate-900/40 p-1 rounded-lg">
              <button onClick={() => { setAuthTab("login"); setAuthError(""); }} className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${authTab === "login" ? "bg-indigo-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-200"}`}>Log In</button>
              <button onClick={() => { setAuthTab("register"); setAuthError(""); }} className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${authTab === "register" ? "bg-indigo-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-200"}`}>Create Account</button>
            </div>

            {authError && (
              <div className="bg-rose-950/40 text-rose-300 p-3 rounded-lg border border-rose-900/50 text-xs mb-4 flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{authError}</span>
              </div>
            )}

            {authTab === "login" ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Username</label>
                  <input type="text" value={loginUser} onChange={(e) => setLoginUser(e.target.value)} required placeholder="e.g. student or admin" className="w-full px-4 py-3 bg-slate-900/60 border border-slate-800 rounded-xl text-sm text-slate-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Password</label>
                  <input type="password" value={loginPass} onChange={(e) => setLoginPass(e.target.value)} required placeholder="Enter password (e.g. student123 or admin123)" className="w-full px-4 py-3 bg-slate-900/60 border border-slate-800 rounded-xl text-sm text-slate-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600" />
                </div>
                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold text-sm transition-all duration-200 hover:shadow-indigo-500/20 hover:shadow-lg mt-2 cursor-pointer">Access Dashboard</button>

                <div className="bg-amber-950/20 p-3.5 rounded-xl border border-amber-900/40 text-xs text-amber-300 space-y-1 mt-4">
                  <div className="font-bold flex items-center gap-1.5 text-amber-400">🔑 Demo Credentials</div>
                  <div>Student: <span className="font-bold text-white">student</span> / <span className="font-bold text-white">student123</span></div>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Full Name</label>
                  <input type="text" value={regFullName} onChange={(e) => setRegFullName(e.target.value)} placeholder="e.g. John Doe" required className="w-full px-3.5 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-200 outline-none focus:border-indigo-500 transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Username</label>
                    <input type="text" value={regUsername} onChange={(e) => setRegUsername(e.target.value)} placeholder="Username" required className="w-full px-3.5 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-200 outline-none focus:border-indigo-500 transition-all" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email</label>
                    <input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="student@email.com" required className="w-full px-3.5 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-200 outline-none focus:border-indigo-500 transition-all" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Department</label>
                    <select value={regDept} onChange={(e) => setRegDept(e.target.value)} className="w-full px-2 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 outline-none">
                      <option>Computer Science</option>
                      <option>Electrical Eng.</option>
                      <option>Mechanical Eng.</option>
                      <option>Business Admin.</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Semester</label>
                    <select value={regSem} onChange={(e) => setRegSem(e.target.value)} className="w-full px-2 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 outline-none">
                      <option value="1">Semester 1</option>
                      <option value="2">Semester 2</option>
                      <option value="3">Semester 3</option>
                      <option value="4">Semester 4</option>
                      <option value="4">Semester 5</option>
                      <option value="4">Semester 6</option>
                      <option value="4">Semester 7</option>
                      <option value="4">Semester 8</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Password</label>
                  <input type="password" value={regPass} onChange={(e) => setRegPass(e.target.value)} placeholder="Minimum 6 characters" required className="w-full px-3.5 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-200 outline-none focus:border-indigo-500 transition-all" />
                </div>
                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl text-xs font-bold transition-all duration-200 hover:shadow-indigo-500/20 hover:shadow-lg mt-2 cursor-pointer">Create Account</button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Active Main Dashboard Counters
  const pendingAssignments = assignments.filter(a => !a.submissions[session.userId]).length;
  const activeRemindersCount = reminders.filter(r => !r.fired).length;

  return (
    <div className="min-h-screen bg-[#060813] text-slate-100 flex flex-col font-sans relative">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[45%] h-[45%] bg-violet-600/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Supabase sync banner */}
      {dbLoading && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-indigo-600/90 backdrop-blur-md text-white text-xs font-semibold px-4 py-2 flex items-center justify-center gap-2 shadow-md">
          <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          <span>Syncing live campus data from Supabase...</span>
        </div>
      )}

      <div className="flex-1 flex flex-col md:flex-row relative z-10" style={dbLoading ? { marginTop: "32px" } : {}}>
        
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-64 bg-slate-950/80 backdrop-blur-xl text-slate-300 flex flex-col md:sticky md:top-0 md:h-screen shrink-0 border-r border-slate-900 shadow-2xl select-none">
          <div className="p-6 border-b border-slate-900 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏛️</span>
              <div>
                <span className="font-bold tracking-tight text-white block text-sm display-font">SmartCampus</span>
                <span className="text-[9px] uppercase font-mono tracking-widest text-indigo-400 font-bold block mt-0.5">Admin & Student</span>
              </div>
            </div>
          </div>

          <div className="p-4 mx-4 my-3 bg-slate-900/50 border border-slate-800/80 rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-white uppercase shadow-lg border border-indigo-400/20">
              {session.fullName.substring(0, 1)}
            </div>
            <div className="overflow-hidden">
              <div className="font-bold text-white text-xs truncate max-w-[130px]">{session.fullName}</div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span className="text-[9px] font-bold text-indigo-300 font-mono tracking-wider">{session.role}</span>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1 font-semibold text-xs">
            <div className="px-3 pb-2 text-[9px] uppercase tracking-widest font-bold text-slate-500 font-mono">Main Dashboard</div>
            <button onClick={() => setActiveTab("dashboard")} className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-lg transition-all ${activeTab === "dashboard" ? "bg-indigo-600/90 text-white font-bold shadow-lg shadow-indigo-600/10 border border-indigo-500/20" : "hover:bg-slate-900/60 hover:text-slate-100 text-slate-400"}`}>
              <LayoutDashboard className="w-4 h-4" />
              <span>General Dashboard</span>
            </button>
            <button onClick={() => setActiveTab("timetable")} className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-lg transition-all ${activeTab === "timetable" ? "bg-indigo-600/90 text-white font-bold shadow-lg shadow-indigo-600/10 border border-indigo-500/20" : "hover:bg-slate-900/60 hover:text-slate-100 text-slate-400"}`}>
              <Calendar className="w-4 h-4" />
              <span>Weekly Timetable</span>
            </button>
            <button onClick={() => setActiveTab("announcements")} className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-lg transition-all ${activeTab === "announcements" ? "bg-indigo-600/90 text-white font-bold shadow-lg shadow-indigo-600/10 border border-indigo-500/20" : "hover:bg-slate-900/60 hover:text-slate-100 text-slate-400"}`}>
              <Bell className="w-4 h-4" />
              <span>Announcements</span>
            </button>

            <div className="px-3 pt-5 pb-2 text-[9px] uppercase tracking-widest font-bold text-slate-500 font-mono">Campus Services</div>
            <button onClick={() => setActiveTab("library")} className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-lg transition-all ${activeTab === "library" ? "bg-indigo-600/90 text-white font-bold shadow-lg shadow-indigo-600/10 border border-indigo-500/20" : "hover:bg-slate-900/60 hover:text-slate-100 text-slate-400"}`}>
              <BookOpen className="w-4 h-4" />
              <span>Smart Library</span>
              {borrowedBookIds.length > 0 && (
                <span className="ml-auto bg-violet-600 text-white font-bold px-1.5 py-0.5 rounded text-[10px]">{borrowedBookIds.length}</span>
              )}
            </button>
            <button onClick={() => setActiveTab("assignments")} className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-lg transition-all ${activeTab === "assignments" ? "bg-indigo-600/90 text-white font-bold shadow-lg shadow-indigo-600/10 border border-indigo-500/20" : "hover:bg-slate-900/60 hover:text-slate-100 text-slate-400"}`}>
              <BookmarkCheck className="w-4 h-4" />
              <span>Active Assignments</span>
              {session.role === "STUDENT" && pendingAssignments > 0 && (
                <span className="ml-auto bg-amber-500 text-slate-950 font-bold px-1.5 py-0.5 rounded text-[10px]">{pendingAssignments}</span>
              )}
            </button>
            {session.role === "STUDENT" && (
              <button onClick={() => setActiveTab("reminders")} className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-lg transition-all ${activeTab === "reminders" ? "bg-indigo-600/90 text-white font-bold shadow-lg shadow-indigo-600/10 border border-indigo-500/20" : "hover:bg-slate-900/60 hover:text-slate-100 text-slate-400"}`}>
                <Clock className="w-4 h-4" />
                <span>My Reminders</span>
                {activeRemindersCount > 0 && <span className="ml-auto bg-indigo-500 text-white px-1.5 py-0.5 rounded-full text-[9px]">{activeRemindersCount}</span>}
              </button>
            )}
            <button onClick={() => setActiveTab("complaints")} className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-lg transition-all ${activeTab === "complaints" ? "bg-indigo-600/90 text-white font-bold shadow-lg shadow-indigo-600/10 border border-indigo-500/20" : "hover:bg-slate-900/60 hover:text-slate-100 text-slate-400"}`}>
              <RefreshCw className="w-4 h-4" />
              <span>Complaints Desk</span>
            </button>
            <button onClick={() => setActiveTab("assistant")} className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-lg transition-all ${activeTab === "assistant" ? "bg-indigo-600/90 text-white font-bold shadow-lg shadow-indigo-600/10 border border-indigo-500/20" : "hover:bg-slate-900/60 hover:text-slate-100 text-slate-400"}`}>
              <Terminal className="w-4 h-4" />
              <span>AI Campus BOT</span>
            </button>
          </nav>

          <div className="p-4 border-t border-slate-900 space-y-2">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-mono font-bold border transition-all ${dbLoading ? "bg-amber-950/20 border-amber-900/30 text-amber-400" : "bg-emerald-950/20 border-emerald-900/30 text-emerald-400"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${dbLoading ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`}></span>
              <span>{dbLoading ? "SYNCING…" : "SUPABASE LIVE"}</span>
            </div>
            <button onClick={logout} className="w-full py-2.5 bg-rose-950/30 hover:bg-rose-900/40 text-rose-300 hover:text-rose-100 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border border-rose-900/20 transition-all cursor-pointer">
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out Account</span>
            </button>
          </div>
        </aside>

        {/* Content Container Area */}
        <section className="flex-1 flex flex-col min-w-0">
          
          {/* Header */}
          <header className="h-16 bg-slate-950/50 backdrop-blur-md border-b border-slate-900/80 sticky top-0 z-20 flex items-center justify-between px-8 shadow-md select-none">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white uppercase tracking-wider font-mono">{activeTab} Panel</span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col text-right">
                <span className="font-mono text-xs font-bold text-slate-300 tracking-wider">
                  {currentTime.toLocaleTimeString()}
                </span>
                <span className="text-[9px] text-slate-500 font-mono mt-0.5">
                  {currentTime.toLocaleDateString(undefined, { weekday: "short", year: "numeric", month: "short", day: "numeric" })}
                </span>
              </div>
              <div className="w-px h-8 bg-slate-800"></div>
              <button onClick={() => setActiveTab("profile")} className="flex items-center gap-2 hover:opacity-85 text-slate-300">
                <span className="text-xs font-bold font-mono text-indigo-400 bg-indigo-950/40 border border-indigo-900/30 rounded px-2.5 py-1">
                  ID: {session.studentId || "ADM-999"}
                </span>
              </button>
            </div>
          </header>

          <main className="flex-1 p-6 md:p-8 overflow-y-auto">
            
            {/* 1. GENERAL DASHBOARD SCREEN */}
            {activeTab === "dashboard" && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-indigo-950/80 via-slate-900/90 to-slate-950 border border-indigo-500/10 rounded-2xl p-8 text-white relative overflow-hidden shadow-2xl">
                  <div className="absolute top-0 right-0 w-80 h-full bg-indigo-500/5 rounded-l-full blur-2xl pointer-events-none"></div>
                  <span className="text-[9px] uppercase font-bold tracking-widest bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 px-2.5 rounded-full py-1 select-none display-font">University Sandbox Sync Connected</span>
                  <h1 className="text-3xl font-extrabold mt-4 tracking-tight display-font">Welcome back, {session.fullName}!</h1>
                  <p className="text-slate-400 text-sm mt-2 max-w-xl leading-relaxed">Your smart academic assistant is ready. Browse the catalog, check course details, configure alerts, or consult the CampusBot.</p>
                </div>

                {/* Dashboard Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 shadow-lg flex items-center justify-between hover:border-indigo-500/30 transition-all glow-card">
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider block mb-1">Library Catalog</span>
                      <span className="text-2xl font-black font-mono text-white">{books.length}</span>
                      <span className="text-slate-400 text-[11px] block mt-1">Total Books Available</span>
                    </div>
                    <div className="p-3.5 bg-indigo-950/60 text-indigo-400 border border-indigo-900/30 rounded-xl font-bold text-xl shadow-md">📚</div>
                  </div>

                  <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 shadow-lg flex items-center justify-between hover:border-indigo-500/30 transition-all glow-card">
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider block mb-1">Weekly Courses</span>
                      <span className="text-2xl font-black font-mono text-white">{timetable.length}</span>
                      <span className="text-slate-400 text-[11px] block mt-1">Class Schedules</span>
                    </div>
                    <div className="p-3.5 bg-indigo-950/60 text-indigo-400 border border-indigo-900/30 rounded-xl font-bold text-xl shadow-md">🗓️</div>
                  </div>

                  <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 shadow-lg flex items-center justify-between hover:border-indigo-500/30 transition-all glow-card">
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider block mb-1">
                        {session.role === "STUDENT" ? "My Borrowed Books" : "Active Reminders"}
                      </span>
                      <span className="text-2xl font-black font-mono text-indigo-400">
                        {session.role === "STUDENT" ? borrowedBookIds.length : reminders.length}
                      </span>
                      <span className="text-slate-400 text-[11px] block mt-1">
                        {session.role === "STUDENT" ? "Personal Library Rentals" : "Total Active Alarms"}
                      </span>
                    </div>
                    <div className="p-3.5 bg-indigo-950/60 text-indigo-400 border border-indigo-900/30 rounded-xl font-bold text-xl shadow-md">🔔</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Class Outline */}
                  <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 shadow-lg flex flex-col">
                    <h4 className="font-bold text-white text-sm mb-4 border-b border-slate-800 pb-3 flex items-center justify-between display-font">
                      <span className="flex items-center gap-2">🗓️ Weekly Classes</span>
                      <button onClick={() => setActiveTab("timetable")} className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline">View full grid</button>
                    </h4>
                    <div className="space-y-3 flex-1">
                      {timetable.slice(0, 3).map((t, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-slate-950/60 border border-slate-900 rounded-xl hover:border-slate-800 transition-all">
                          <div>
                            <span className="text-xs font-bold text-white block">{t.subject}</span>
                            <span className="text-[10px] text-slate-500 block mt-1">{t.lecturer} · {t.room}</span>
                          </div>
                          <span className="text-[10px] font-mono font-bold text-indigo-400 tracking-wider bg-indigo-950/60 border border-indigo-900/40 px-2.5 py-1 rounded-lg">{t.day} {t.start}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Announcements */}
                  <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 shadow-lg flex flex-col">
                    <h4 className="font-bold text-white text-sm mb-4 border-b border-slate-800 pb-3 flex items-center justify-between display-font">
                      <span className="flex items-center gap-2">📢 Academic Board</span>
                      <button onClick={() => setActiveTab("announcements")} className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline">All alerts</button>
                    </h4>
                    <div className="space-y-3 flex-1">
                      {announcements.slice(0, 2).map((a) => (
                        <div key={a.id} className="p-4 border-l-4 border-indigo-600 bg-slate-950/60 rounded-r-xl border border-y-slate-900 border-r-slate-900">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-xs font-bold text-white block">{a.title}</span>
                            <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded font-extrabold uppercase border ${a.priority === "HIGH" ? "bg-rose-950/20 text-rose-400 border-rose-900/30" : "bg-amber-950/20 text-amber-400 border-amber-900/30"}`}>{a.priority}</span>
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed mb-2">{a.content}</p>
                          <span className="text-[9px] text-slate-500 block font-mono">{a.author} · {a.timestamp}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* 2. WEEKLY TIMETABLE SCREEN */}
            {activeTab === "timetable" && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-900 pb-4">
                  <div>
                    <h3 className="font-bold text-white text-lg display-font">Classroom Schedule Manager</h3>
                    <p className="text-slate-400 text-xs mt-1">Shared weekly timetable configuration database</p>
                  </div>
                  <div className="flex flex-wrap gap-1 bg-slate-950/60 border border-slate-850 p-1.5 rounded-xl">
                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map(d => (
                      <button key={d} onClick={() => {
                        setTimetableDay(d);
                        setEditingSlotIdx(null);
                      }} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${timetableDay === d ? "bg-indigo-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-200"}`}>{d}</button>
                    ))}
                  </div>
                </div>

                {/* Admin Add / Change Slot Controls */}
                {session?.role === "ADMIN" && (
                  <form onSubmit={handleAddTimetableSlot} className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
                    <h4 className="font-bold text-white text-sm pb-2.5 flex items-center justify-between border-b border-slate-800 display-font">
                      <div className="flex items-center gap-2">
                        <span>📅 {editingSlotIdx !== null ? "Edit Timetable Class Period" : "Inject Class Schedule Period"}</span>
                        <span className="text-[9px] uppercase bg-indigo-500/10 border border-indigo-400/20 text-indigo-400 px-2 py-0.5 rounded font-bold font-mono">Academic Master Controls</span>
                      </div>
                      <span className="text-xs text-slate-400">Selected Day: <b className="text-indigo-400">{timetableDay}</b></span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Subject Title</label>
                        <input type="text" value={newSlotSubject} onChange={(e) => setNewSlotSubject(e.target.value)} required placeholder="e.g. Adv. Java Algorithms" className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs outline-none focus:border-indigo-500 text-slate-200" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Lecturer/Faculty</label>
                        <input type="text" value={newSlotLecturer} onChange={(e) => setNewSlotLecturer(e.target.value)} required placeholder="e.g. Dr. Roberts" className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs outline-none focus:border-indigo-500 text-slate-200" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Room or Lab</label>
                        <input type="text" value={newSlotRoom} onChange={(e) => setNewSlotRoom(e.target.value)} required placeholder="e.g. Lab 4B / Room 102" className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs outline-none focus:border-indigo-500 text-slate-200" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Start Time</label>
                        <input type="time" value={newSlotStart} onChange={(e) => setNewSlotStart(e.target.value)} required className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs outline-none focus:border-indigo-500 text-slate-200 [color-scheme:dark]" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">End Time</label>
                        <input type="time" value={newSlotEnd} onChange={(e) => setNewSlotEnd(e.target.value)} required className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs outline-none focus:border-indigo-500 text-slate-200 [color-scheme:dark]" />
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end">
                      {editingSlotIdx !== null && (
                        <button type="button" onClick={() => {
                          setEditingSlotIdx(null);
                          setNewSlotSubject("");
                          setNewSlotLecturer("");
                          setNewSlotRoom("");
                        }} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition-colors cursor-pointer">
                          Cancel
                        </button>
                      )}
                      <button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-lg shadow-indigo-600/10">
                        {editingSlotIdx !== null ? "Save Timetable Changes" : "Inject Slot to Schedule"}
                      </button>
                    </div>
                  </form>
                )}

                <div className="bg-slate-950/40 border border-slate-900 rounded-xl shadow-lg overflow-hidden whitespace-nowrap overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-900/60 border-b border-slate-850 uppercase font-bold tracking-wider text-slate-400">
                        <th className="p-4">Period Times</th>
                        <th className="p-4">Subject</th>
                        <th className="p-4">Lecturer</th>
                        <th className="p-4">Room/Lab</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900">
                      {timetable.filter(t => t.day === timetableDay).length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-500">
                            No active classes scheduled for {timetableDay}.
                          </td>
                        </tr>
                      ) : (
                        timetable.filter(t => t.day === timetableDay).map((t, idx) => {
                          const originalIdx = timetable.findIndex(orig => orig.day === t.day && orig.start === t.start && orig.subject === t.subject);
                          return (
                            <tr key={idx} className="hover:bg-slate-900/20 transition-all">
                              <td className="p-4 font-mono font-bold text-indigo-400">{t.start} – {t.end}</td>
                              <td className="p-4 font-semibold text-white">{t.subject}</td>
                              <td className="p-4 text-slate-300">{t.lecturer}</td>
                              <td className="p-4">
                                <span className="bg-indigo-950/60 text-indigo-300 border border-indigo-900/30 px-2.5 py-1 rounded font-mono font-bold text-[10px]">{t.room}</span>
                              </td>
                              <td className="p-4 text-right">
                                <div className="inline-flex gap-2">
                                  <button onClick={() => {
                                    const tomorrow = new Date();
                                    tomorrow.setDate(tomorrow.getDate() + 1);
                                    const tomorrowStr = tomorrow.toISOString().slice(0, 10);
                                    setQuickReminder(`Class: ${t.subject}`, "Lecture", `${tomorrowStr}T${t.start}`);
                                  }} className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline">Set Alert</button>
                                  {session?.role === "ADMIN" && (
                                    <>
                                      <span className="text-slate-700">|</span>
                                      <button onClick={() => {
                                        setEditingSlotIdx(originalIdx);
                                        setNewSlotSubject(t.subject);
                                        setNewSlotLecturer(t.lecturer);
                                        setNewSlotRoom(t.room);
                                        setNewSlotStart(t.start);
                                        setNewSlotEnd(t.end);
                                      }} className="text-xs text-amber-400 hover:text-amber-300 hover:underline">Edit</button>
                                      <span className="text-slate-700">|</span>
                                      <button onClick={() => handleDeleteTimetableSlot(t.day, t.start, t.subject)} className="text-xs text-rose-400 hover:text-rose-350 hover:underline font-semibold">Delete</button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="bg-indigo-950/20 border border-indigo-900/40 p-4.5 rounded-xl text-xs text-indigo-300 leading-relaxed flex items-center justify-between">
                  <span>💡 This weekly academic calendar represents shared curriculum guidelines. All changes sync in real-time.</span>
                  {session?.role === "ADMIN" && <span className="text-[10px] font-bold text-indigo-400 font-mono tracking-wider">ADMINISTRATIVE ACTION MODE ACTIVATED</span>}
                </div>
              </div>
            )}

            {/* 3. ANNOUNCEMENTS SCREEN */}
            {activeTab === "announcements" && (
              <div className="space-y-6">
                {session.role === "ADMIN" && (
                  <form onSubmit={makeAnnouncement} className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
                    <h4 className="font-bold text-white text-sm pb-2 flex items-center gap-2 border-b border-slate-800 display-font">
                      <span>⚡ Post New Announcement</span>
                      <span className="text-[9px] uppercase tracking-widest font-bold text-indigo-400 font-mono bg-indigo-500/10 border border-indigo-400/20 px-2 py-0.5 rounded">Admin Control</span>
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      <div className="md:col-span-8">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Announcement Title</label>
                        <input type="text" value={newAnnTitle} onChange={(e) => setNewAnnTitle(e.target.value)} required placeholder="e.g. Lab Session Rescheduled" className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs outline-none focus:border-indigo-500 text-slate-200" />
                      </div>
                      <div className="md:col-span-4">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Priority level</label>
                        <select value={newAnnPriority} onChange={(e) => setNewAnnPriority(e.target.value as any)} className="w-full px-3 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs outline-none text-slate-300">
                          <option value="HIGH">High (Priority Block)</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="LOW">Low</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Alert Content Details</label>
                      <textarea value={newAnnContent} onChange={(e) => setNewAnnContent(e.target.value)} required placeholder="Describe full academic instructions..." rows={3} className="w-full p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs outline-none focus:border-indigo-500 text-slate-200 resize-none" />
                    </div>

                    <button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-lg shadow-indigo-600/10">Publish Announcement</button>
                  </form>
                )}

                <div className="space-y-4">
                  {announcements.map(a => {
                    const savedRem = reminders.some(r => r.title.includes(a.title));
                    return (
                      <div key={a.id} className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 flex items-start gap-4 hover:border-indigo-500/20 transition-all glow-card">
                        <div className={`p-3 rounded-lg ${a.priority === "HIGH" ? "bg-rose-950/40 text-rose-400 border border-rose-900/20" : "bg-amber-950/20 text-amber-400 border border-amber-900/20"} shrink-0 font-bold text-sm shadow-md`}>🔔</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
                            <h4 className="font-bold text-white text-sm display-font">{a.title}</h4>
                            <span className={`text-[8px] font-mono px-2 py-0.5 rounded font-extrabold uppercase border ${a.priority === "HIGH" ? "bg-rose-950/20 text-rose-400 border-rose-900/30" : "bg-amber-950/20 text-amber-400 border-amber-900/30"}`}>{a.priority} Priority</span>
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed mb-3.5 pr-4">{a.content}</p>
                          <div className="flex items-center justify-between flex-wrap gap-2 text-[10px] text-slate-500 font-mono border-t border-slate-900 pt-3">
                            <span>Admin Post · {a.timestamp}</span>
                            {session.role === "STUDENT" && (
                              <button onClick={() => {
                                const tomorrow = new Date();
                                tomorrow.setDate(tomorrow.getDate() + 1);
                                const tomorrowStr = tomorrow.toISOString().slice(0, 10);
                                setQuickReminder(`Alert: ${a.title}`, "Event", `${tomorrowStr}T09:00`);
                              }} disabled={savedRem} className={`px-3 py-1 font-sans rounded-lg transition-all font-bold cursor-pointer ${savedRem ? "bg-slate-900 text-slate-600 border border-slate-850 cursor-not-allowed" : "bg-indigo-950/40 hover:bg-indigo-900/40 text-indigo-400 border border-indigo-900/20"}`}>
                                {savedRem ? "✓ Pin Reminder Active" : "🔔 Set Reminder Alert"}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4. SMART LIBRARY SCREEN */}
            {activeTab === "library" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-900/40 p-4 border border-slate-800 rounded-xl shadow-lg">
                  <div className="relative flex-1 w-full text-xs">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">🔍</span>
                    <input type="text" value={bookSearch} onChange={(e) => setBookSearch(e.target.value)} placeholder="Search catalog by title, author, category..." className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500 outline-none pl-9 pr-4 py-2.5 rounded-xl text-slate-200 placeholder:text-slate-600" />
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {["all", "Programming", "Software Engineering", "Computer Science"].map(cat => (
                      <button key={cat} onClick={() => setBookCatFilter(cat)} className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${bookCatFilter === cat ? "bg-indigo-600 text-white border-transparent shadow-lg" : "bg-slate-950/40 text-slate-400 border-slate-800 hover:text-slate-200"}`}>{cat}</button>
                    ))}
                  </div>
                </div>

                {/* User-Specific Borrowed Books Dashboard */}
                {session.role === "STUDENT" && borrowedBookIds.length > 0 && (
                  <div className="bg-indigo-950/10 border border-indigo-900/30 p-6 rounded-2xl space-y-4">
                    <h4 className="text-sm font-bold text-indigo-400 flex items-center gap-2 display-font">
                      <span>📚 My Borrowed Books ({borrowedBookIds.length})</span>
                      <span className="text-[9px] uppercase font-mono tracking-widest bg-indigo-500/10 border border-indigo-400/20 px-2 py-0.5 rounded text-indigo-300">Active Rentals</span>
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {books.filter(b => borrowedBookIds.includes(b.id)).map(b => (
                        <div key={b.id} className="bg-slate-950/60 border border-slate-800 p-4.5 rounded-xl flex flex-col justify-between">
                          <div>
                            <span className="text-[8px] bg-indigo-500/10 border border-indigo-400/20 text-indigo-400 px-2 py-0.5 rounded font-bold font-mono uppercase">{b.category}</span>
                            <h5 className="font-bold text-white text-xs mt-2 display-font">{b.title}</h5>
                            <span className="text-slate-500 text-[10px] block mt-1">Author: {b.author}</span>
                          </div>
                          <div className="border-t border-slate-900 pt-3 mt-4 flex items-center justify-between">
                            <span className="text-[10px] text-amber-400 font-mono">📅 14 Days Remaining</span>
                            <button onClick={() => toggleBorrowBook(b.id)} className="px-3 py-1.5 bg-amber-950/40 hover:bg-amber-900/40 text-amber-400 border border-amber-900/30 text-[10px] font-bold rounded-lg transition-colors cursor-pointer">
                              Return Book
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {books.filter(b => {
                    const matchQ = b.title.toLowerCase().includes(bookSearch.toLowerCase()) || b.author.toLowerCase().includes(bookSearch.toLowerCase());
                    const matchC = bookCatFilter === "all" || b.category === bookCatFilter;
                    return matchQ && matchC;
                  }).map(b => {
                    const isBorrowedByMe = borrowedBookIds.includes(b.id);
                    const isAvailable = !isBorrowedByMe; // User specific availability calculation
                    return (
                      <div key={b.id} className="bg-slate-900/40 border border-slate-800 p-5 rounded-xl flex flex-col justify-between shadow-lg hover:border-indigo-500/30 transition-all glow-card">
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-[9px] bg-indigo-500/10 border border-indigo-400/20 text-indigo-400 px-2.5 py-0.5 rounded font-bold font-mono uppercase">{b.category}</span>
                            <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-bold font-mono border ${isAvailable ? "bg-emerald-950/20 text-emerald-400 border-emerald-900/20" : "bg-rose-950/20 text-rose-400 border-rose-900/20"}`}>
                              {isAvailable ? "1/1 Available" : "Borrowed by You"}
                            </span>
                          </div>
                          
                          <h4 className="font-extrabold text-white tracking-tight text-sm mb-1 leading-tight display-font">{b.title}</h4>
                          <span className="text-slate-400 text-xs block mb-1">Author: {b.author}</span>
                          <span className="text-slate-600 text-[10px] block font-mono">ISBN: {b.isbn}</span>
                        </div>

                        <div className="border-t border-slate-900 pt-4 mt-5 flex items-center justify-between">
                          <a href={b.link} className="text-indigo-400 text-xs font-bold hover:text-indigo-300 hover:underline">Reference Guide</a>
                          {session.role === "STUDENT" && (
                            <button onClick={() => toggleBorrowBook(b.id)} className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${isBorrowedByMe ? "bg-amber-950/40 hover:bg-amber-900/40 text-amber-400 border border-amber-900/20" : "bg-indigo-600 hover:bg-indigo-500 text-white"}`}>
                              {isBorrowedByMe ? "Return Book" : "Rent / Borrow"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 5. ACTIVE ASSIGNMENTS VIEW */}
            {activeTab === "assignments" && (
              <div className="space-y-6">
                {session.role === "ADMIN" && (
                  <form onSubmit={publishAssignment} className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
                    <h4 className="font-bold text-white text-sm pb-2 flex items-center gap-2 border-b border-slate-800 display-font">
                      <span>📋 Publish New Student Assignment</span>
                      <span className="text-[9px] uppercase tracking-widest font-bold text-indigo-400 font-mono bg-indigo-500/10 border border-indigo-400/20 px-2 py-0.5 rounded">Admin Controls</span>
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      <div className="md:col-span-6">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Assignment Title</label>
                        <input type="text" value={newAsgTitle} onChange={(e) => setNewAsgTitle(e.target.value)} required placeholder="e.g. Binary Tree Operations" className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs outline-none focus:border-indigo-500 text-slate-200" />
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Subject course</label>
                        <select value={newAsgSub} onChange={(e) => setNewAsgSub(e.target.value)} className="w-full px-3 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs outline-none text-slate-300">
                          <option>OOP with Java</option>
                          <option>Database Systems</option>
                          <option>Algorithms Design</option>
                          <option>Computer Science</option>
                        </select>
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Submission Deadline</label>
                        <input type="date" value={newAsgDue} onChange={(e) => setNewAsgDue(e.target.value)} required className="w-full px-3 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs outline-none text-slate-300 [color-scheme:dark]" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Max Marks</label>
                        <input type="number" value={newAsgMarks} onChange={(e) => setNewAsgMarks(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs outline-none focus:border-indigo-500 text-slate-200" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Priority level</label>
                        <select value={newAsgPriority} onChange={(e) => setNewAsgPriority(e.target.value as any)} className="w-full px-3 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs outline-none text-slate-300">
                          <option value="HIGH">High Priority</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="LOW">Low</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Detailed Task Guidelines</label>
                      <textarea value={newAsgDesc} onChange={(e) => setNewAsgDesc(e.target.value)} placeholder="Guidelines..." rows={2} className="w-full p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs outline-none focus:border-indigo-500 text-slate-200 resize-none" />
                    </div>

                    <button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-lg shadow-indigo-600/10">Post Classroom Assignment</button>
                  </form>
                )}

                <div className="space-y-4">
                  {assignments.map(a => {
                    const submission = a.submissions[session.userId];
                    const isSubmitted = !!submission;
                    const parsedSub = isSubmitted ? getSubmissionDetails(submission) : null;
                    return (
                      <div key={a.id} className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 shadow-lg hover:border-indigo-500/20 transition-all glow-card">
                        <div className="flex items-start justify-between flex-wrap gap-4 border-b border-slate-900 pb-4 mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-[9px] bg-indigo-500/10 border border-indigo-400/20 px-2 py-0.5 rounded font-mono font-bold text-indigo-400">{a.subject}</span>
                              <span className={`text-[8px] font-mono px-2 py-0.5 rounded font-extrabold uppercase border ${a.priority === "HIGH" ? "bg-rose-950/20 text-rose-400 border-rose-900/30" : "bg-amber-950/20 text-amber-400 border-amber-900/30"}`}>{a.priority} Priority</span>
                            </div>
                            <h4 className="font-extrabold text-white tracking-tight text-sm mb-1.5 display-font">{a.title}</h4>
                            <p className="text-xs text-slate-400 max-w-xl leading-relaxed">{a.description}</p>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-xs font-bold text-slate-500 block mb-1">Max Marks: {a.marks}</span>
                            <span className="text-xs font-mono font-bold text-indigo-400 block bg-indigo-950/60 border border-indigo-900/40 px-2.5 py-1 rounded-lg">Due: {a.due}</span>
                          </div>
                        </div>

                        {/* ADMIN SUBMISSIONS VIEW */}
                        {session.role === "ADMIN" && (
                          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-900 space-y-3">
                            <div className="font-bold text-slate-400 flex items-center justify-between border-b border-slate-900 pb-2 mb-2 text-xs">
                              <span>📋 Student Submissions ({Object.keys(a.submissions).length} Submitted)</span>
                            </div>
                            {Object.keys(a.submissions).length === 0 ? (
                              <span className="text-slate-500 text-xs block py-2 italic">No submissions for this assignment yet.</span>
                            ) : (
                              Object.entries(a.submissions).map(([uid, subObject]) => {
                                const details = getSubmissionDetails(subObject);
                                return (
                                  <div key={uid} className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-3 shadow-inner">
                                    <div className="flex justify-between items-center bg-slate-950 p-2 rounded-lg text-[10px] font-mono">
                                      <div className="font-bold text-indigo-400">
                                        👩‍🎓 {details.studentName} <span className="text-slate-500">({details.studentId})</span>
                                      </div>
                                      <div className="text-slate-500">
                                        Submitted: {details.timestamp}
                                      </div>
                                    </div>
                                    <div className="py-1">
                                      <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Submission Note:</span>
                                      <div className="bg-slate-950/60 rounded-lg p-3 text-xs font-mono text-slate-300 border-l-2 border-indigo-500 whitespace-pre-wrap">
                                        {details.note}
                                      </div>
                                    </div>
                                    {details.fileName && (
                                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono mt-1">
                                        <span>📎 Attachment:</span>
                                        <b className="text-white">{details.fileName}</b>
                                        <button onClick={() => addToast(`Downloaded attachment "${details.fileName}"`, "info")} className="text-[10px] text-indigo-400 font-bold hover:underline cursor-pointer">Download</button>
                                      </div>
                                    )}

                                    {/* Instructor Grading Inputs */}
                                    <div className="border-t border-slate-900 pt-3 mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                                      <div>
                                        <input type="text" placeholder={`Grade /${a.marks}`} value={adminGrades[`${a.id}_${uid}`] || details.grade || ""} onChange={(e) => setAdminGrades({...adminGrades, [`${a.id}_${uid}`]: e.target.value})} className="w-full p-2 bg-slate-950/60 border border-slate-800 rounded-lg text-xs text-slate-200 outline-none focus:border-indigo-500" />
                                      </div>
                                      <div>
                                        <input type="text" placeholder="Evaluation Remarks..." value={adminFeedback[`${a.id}_${uid}`] || details.comment || ""} onChange={(e) => setAdminFeedback({...adminFeedback, [`${a.id}_${uid}`]: e.target.value})} className="w-full p-2 bg-slate-950/60 border border-slate-800 rounded-lg text-xs text-slate-200 outline-none focus:border-indigo-500" />
                                      </div>
                                      <button onClick={() => submitGradeForStudent(a.id, uid)} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-3 rounded-lg text-xs cursor-pointer shadow">Record Evaluation</button>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        )}

                        {/* STUDENT FORM */}
                        {session.role === "STUDENT" && !isSubmitted && (
                          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-900 mt-4 space-y-3">
                            <div className="font-bold text-indigo-400 text-xs flex items-center gap-1.5 display-font">
                              <span>✍️ Open Homework Workspace</span>
                              <span className="text-[9px] bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 px-2 py-0.5 rounded">Draft</span>
                            </div>
                            
                            <div>
                              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Solution Notes, Explanations, or URLs</label>
                              <textarea rows={3} placeholder="Provide your answer description, solution algorithms, or links here..." value={submissionNotes[a.id] || ""} onChange={(e) => setSubmissionNotes({...submissionNotes, [a.id]: e.target.value})} className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs outline-none focus:border-indigo-500 text-slate-200 resize-none font-mono" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
                              <div onClick={() => setSubmissionFiles({...submissionFiles, [a.id]: `${session.username}_${a.id}.zip`})} className="border border-dashed border-slate-800 hover:border-indigo-500 rounded-xl p-3 text-center cursor-pointer bg-slate-900/60 text-xs text-slate-500 transition-all">
                                📂 {submissionFiles[a.id] ? `📎 Mounted: ${submissionFiles[a.id]}` : "Add Workspace Zip Archive"}
                              </div>
                              <button onClick={() => submitAssignmentRich(a.id)} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow cursor-pointer">
                                Submit Task Solutions
                              </button>
                            </div>
                          </div>
                        )}

                        {/* STUDENT SUBMISSION COMPLETED VIEW */}
                        {session.role === "STUDENT" && isSubmitted && (
                          <div className="bg-emerald-950/20 border border-emerald-900/30 p-4.5 rounded-xl mt-4 text-xs space-y-3">
                            <div className="flex justify-between items-center font-bold text-emerald-400 display-font">
                              <span className="flex items-center gap-1.5">✓ Homework Task Submitted</span>
                              <span className="font-mono text-[9px] bg-emerald-500/10 border border-emerald-400/20 px-2.5 py-0.5 rounded">Status: Completed</span>
                            </div>
                            
                            <div className="text-slate-400 text-[10px] font-mono">
                              Submitted at: {parsedSub?.timestamp}
                            </div>

                            <div className="bg-slate-950/60 border border-slate-900 rounded-lg p-3 text-xs font-mono text-slate-300">
                              {parsedSub?.note}
                            </div>

                            {parsedSub?.fileName && (
                              <div className="text-[10px] text-slate-500 font-mono">
                                Attachment: <b className="text-white">{parsedSub?.fileName}</b>
                              </div>
                            )}

                            {parsedSub?.grade ? (
                              <div className="bg-indigo-950/40 border border-indigo-900/40 p-4 rounded-xl mt-3 space-y-1.5">
                                <div className="font-bold text-white text-xs flex justify-between display-font">
                                  <span>🎓 Evaluation Score:</span>
                                  <span className="font-mono text-indigo-400 font-black">{parsedSub.grade} / {a.marks} Marks</span>
                                </div>
                                <div className="text-slate-400 text-xs">
                                  Remarks: <span className="italic">"{parsedSub.comment}"</span>
                                </div>
                              </div>
                            ) : (
                              <div className="text-[10px] text-amber-400 font-mono bg-amber-950/20 border border-amber-900/30 p-2.5 rounded-lg mt-2 flex items-center gap-2">
                                <span>⏳ Waiting for grading evaluation.</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 6. MY REMINDERS MODULE (USER-SPECIFIC) */}
            {activeTab === "reminders" && session.role === "STUDENT" && (
              <div className="space-y-6">
                <form onSubmit={createReminder} className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
                  <h4 className="font-bold text-white text-sm pb-2 flex items-center gap-2 border-b border-slate-800 display-font">
                    <span>⏰ Configure Personal Reminder Alarm</span>
                    <span className="text-[9px] uppercase tracking-widest font-bold text-indigo-400 font-mono bg-indigo-500/10 border border-indigo-400/20 px-2.5 py-0.5 rounded">Personal</span>
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Reminder Subject/Title</label>
                      <input type="text" value={newRemTitle} onChange={(e) => setNewRemTitle(e.target.value)} required placeholder="e.g. Midterm Preparation" className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs outline-none focus:border-indigo-500 text-slate-200" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Category</label>
                      <select value={newRemCat} onChange={(e) => setNewRemCat(e.target.value)} className="w-full px-3 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs outline-none text-slate-300">
                        <option value="Exam">Exam Preparation</option>
                        <option value="Assignment">Assignment Deadline</option>
                        <option value="Lecture">Extra Curricular</option>
                        <option value="Personal">Personal Routine</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Target Date &amp; Time</label>
                      <input type="datetime-local" value={newRemTime} onChange={(e) => setNewRemTime(e.target.value)} required className="w-full px-3 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs outline-none text-slate-300 [color-scheme:dark]" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Short Checklist Notes</label>
                    <input type="text" value={newRemNote} onChange={(e) => setNewRemNote(e.target.value)} placeholder="Read pages 24-40..." className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs outline-none focus:border-indigo-500 text-slate-200" />
                  </div>

                  <button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-lg shadow-indigo-600/10">Register Reminder</button>
                </form>

                <div className="bg-slate-950/40 border border-slate-900 rounded-xl shadow-lg overflow-hidden whitespace-nowrap overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-900/60 border-b border-slate-850 uppercase font-bold tracking-wider text-slate-400">
                        <th className="p-4">Alarms/Notes</th>
                        <th className="p-4">Category</th>
                        <th className="p-4">Target Date</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900">
                      {reminders.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-slate-500">
                            No personal reminder alarms configured.
                          </td>
                        </tr>
                      ) : (
                        reminders.map(r => (
                          <tr key={r.id} className={`hover:bg-slate-900/20 transition-all ${r.fired ? "opacity-40" : ""}`}>
                            <td className="p-4 font-semibold text-white">
                              <span className={`block ${r.fired ? "line-through text-slate-500" : ""}`}>{r.title}</span>
                              <span className="text-[10px] text-slate-500 font-mono font-normal block mt-1">{r.note || "No custom notes."}</span>
                            </td>
                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded font-mono text-[9px] font-bold border ${r.fired ? "bg-slate-900 text-slate-500 border-slate-850" : "bg-indigo-950/60 text-indigo-400 border-indigo-900/30"}`}>{r.category}</span>
                            </td>
                            <td className={`p-4 font-mono font-bold ${r.fired ? "text-slate-500" : "text-indigo-400"}`}>{r.datetime.replace("T", " ")}</td>
                            <td className="p-4 text-right">
                              <div className="inline-flex gap-2 items-center">
                                {r.fired && <span className="text-[9px] bg-slate-900 border border-slate-850 text-slate-500 px-2 py-0.5 rounded font-bold uppercase mr-1">Passed</span>}
                                <button onClick={() => deleteReminder(r.id)} className="text-xs text-rose-400 hover:text-rose-350 hover:underline font-semibold cursor-pointer">Delete</button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 7. COMPLAINTS DESK VIEW */}
            {activeTab === "complaints" && (
              <div className="space-y-6">
                {session.role === "STUDENT" && (
                  <form onSubmit={fileComplaint} className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
                    <h4 className="font-bold text-white text-sm pb-2 flex items-center gap-2 border-b border-slate-800 display-font">
                      <span>⚠️ Report Infrastructure &amp; Campus Problems</span>
                      <span className="text-[9px] uppercase tracking-widest font-bold text-indigo-400 font-mono bg-indigo-500/10 border border-indigo-400/20 px-2.5 py-0.5 rounded">Student Action</span>
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Problem Category</label>
                        <select value={newCompCat} onChange={(e) => setNewCompCat(e.target.value)} className="w-full px-3 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs outline-none text-slate-350">
                          <option>IT Support (WiFi/Portal)</option>
                          <option>Hostel Curriculum Curfew</option>
                          <option>Library book reservations</option>
                          <option>Infrastructure (Plumbing/AC)</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Problem Description</label>
                        <input type="text" value={newCompDesc} onChange={(e) => setNewCompDesc(e.target.value)} required placeholder="Describe issue detail (e.g. WiFi connection drops in hostel)..." className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs outline-none focus:border-indigo-500 text-slate-200" />
                      </div>
                    </div>

                    <button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-lg shadow-indigo-600/10">Submit Ticket to Admin</button>
                  </form>
                )}

                <div className="bg-slate-950/40 border border-slate-900 rounded-xl shadow-lg overflow-hidden whitespace-nowrap overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-900/60 border-b border-slate-850 uppercase font-bold tracking-wider text-slate-400">
                        <th className="p-4">Ticket Details</th>
                        <th className="p-4">Category</th>
                        <th className="p-4">Status / Remarks</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900">
                      {complaints.filter(c => session.role === "ADMIN" || c.studentId === session.userId).length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-slate-500">
                            No complaints filed in this ledger.
                          </td>
                        </tr>
                      ) : (
                        complaints.filter(c => session.role === "ADMIN" || c.studentId === session.userId).map(c => {
                          const isPending = c.status === "PENDING";
                          const isResolved = c.status === "RESOLVED";
                          return (
                            <tr key={c.id} className="hover:bg-slate-900/20 transition-all">
                              <td className="p-4 font-sans max-w-[280px] whitespace-normal">
                                <span className="block font-bold text-white leading-relaxed">{c.description}</span>
                                <span className="text-[10px] text-slate-500 font-mono mt-1 block">Student: {c.studentName} ({c.studentId}) · {c.timestamp}</span>
                              </td>
                              <td className="p-4">
                                <span className="bg-indigo-950/60 text-indigo-400 border border-indigo-900/30 px-2.5 py-1 rounded font-mono text-[9px] font-bold">{c.category}</span>
                              </td>
                              <td className="p-4 whitespace-normal max-w-[280px]">
                                <div className="flex flex-col gap-1.5">
                                  <span className={`inline-block w-fit text-[9px] font-mono px-2 py-0.5 rounded-full font-bold border ${isResolved ? "bg-emerald-950/20 text-emerald-400 border-emerald-900/20" : isPending ? "bg-rose-950/20 text-rose-400 border-rose-900/20" : "bg-amber-950/20 text-amber-400 border-amber-900/20"}`}>
                                    {c.status}
                                  </span>
                                  {c.remark && (
                                    <span className="text-[10px] text-slate-400 italic block">Remarks: "{c.remark}"</span>
                                  )}
                                </div>
                              </td>
                              <td className="p-4 text-right">
                                {session.role === "ADMIN" ? (
                                  <div className="inline-flex gap-2">
                                    <button onClick={() => updateComplaintStatus(c.id, "RESOLVED", "Resolved by IT Support.")} className="text-xs text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer">Mark Resolved</button>
                                    <span className="text-slate-700">|</span>
                                    <button onClick={() => updateComplaintStatus(c.id, "REVIEWING", "Audit review initiated.")} className="text-xs text-amber-400 hover:text-amber-300 hover:underline font-semibold cursor-pointer">Under Audit</button>
                                  </div>
                                ) : (
                                  <button onClick={() => removeComplaint(c.id)} className="text-xs text-rose-400 hover:text-rose-350 hover:underline font-semibold cursor-pointer">Cancel Ticket</button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 8. AI CAMPUS BOT SCREEN */}
            {activeTab === "assistant" && (
              <div className="max-w-4xl mx-auto bg-slate-900/40 border border-slate-800 rounded-2xl shadow-2xl flex flex-col h-[560px] overflow-hidden">
                <div className="p-4 bg-slate-950 border-b border-slate-900 flex justify-between items-center text-slate-300">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🤖</span>
                    <div>
                      <span className="font-extrabold text-white text-xs block display-font">CampusBot Smart Assistant</span>
                      <span className="text-[9px] text-emerald-400 font-mono font-bold block mt-0.5">● Gemini AI Core Enabled</span>
                    </div>
                  </div>
                  <button onClick={() => setChatLog([{ role: "model", text: "👋 Chat refreshed. Ask me anything!", time: new Date().toTimeString().slice(0, 5) }])} className="bg-slate-900 hover:bg-slate-850 text-slate-300 px-3 py-1.5 rounded-lg text-[10px] font-bold border border-slate-800 transition-all cursor-pointer">Clear Logs</button>
                </div>

                <div className="flex-1 p-5 overflow-y-auto bg-slate-950/20 space-y-4">
                  {chatLog.map((m, idx) => (
                    <div key={idx} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] p-4 rounded-2xl shadow-md border ${m.role === "user" ? "bg-indigo-600 border-indigo-500/20 text-white rounded-br-none" : "bg-slate-900 border-slate-800/80 text-slate-200 rounded-bl-none"}`}>
                        <div className="text-xs leading-relaxed font-sans whitespace-pre-wrap">{m.text}</div>
                        <span className={`block text-[8px] font-mono mt-2 text-right ${m.role === "user" ? "text-indigo-200" : "text-slate-500"}`}>{m.time}</span>
                      </div>
                    </div>
                  ))}

                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl flex items-center gap-3 text-xs text-slate-400 shadow-md">
                        <div className="flex gap-1.5 items-center">
                          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce-slow-1"></span>
                          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce-slow-2"></span>
                          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce-slow-3"></span>
                        </div>
                        <span className="font-mono text-[10px]">CampusBot is analyzing...</span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <div className="p-4 border-t border-slate-900 bg-slate-950/40 space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    <button onClick={() => setChatInput("What is the WiFi password?")} className="bg-slate-900/60 border border-slate-800 hover:border-indigo-500/60 rounded-lg px-3 py-1.5 text-[10px] text-slate-400 font-bold transition-all cursor-pointer">SSID &amp; WiFi Connection</button>
                    <button onClick={() => setChatInput("When does the library close?")} className="bg-slate-900/60 border border-slate-800 hover:border-indigo-500/60 rounded-lg px-3 py-1.5 text-[10px] text-slate-400 font-bold transition-all cursor-pointer">Library hours</button>
                    <button onClick={() => setChatInput("What are the hostel curfew hours?")} className="bg-slate-900/60 border border-slate-800 hover:border-indigo-500/60 rounded-lg px-3 py-1.5 text-[10px] text-slate-400 font-bold transition-all cursor-pointer">Residences Night Curfew</button>
                  </div>
                  <div className="flex gap-2">
                    <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleChat()} placeholder="Ask CampusBot about curfew, courses, Wi-Fi password..." className="flex-1 bg-slate-950/80 border border-slate-800 outline-none px-4 py-3 rounded-full focus:border-indigo-500 text-xs text-slate-200 placeholder:text-slate-600" />
                    <button onClick={handleChat} className="p-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full flex items-center justify-center shrink-0 shadow-lg cursor-pointer transition-colors"><Send className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            )}

            {/* 10. PROFILE VIEW */}
            {activeTab === "profile" && (
              <div className="max-w-xl mx-auto bg-slate-900/40 border border-slate-800 rounded-2xl shadow-lg p-8 space-y-6">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center text-3xl font-black text-white mx-auto mb-4 shadow-lg border border-indigo-400/20">
                    {session.fullName.substring(0,1).toUpperCase()}
                  </div>
                  <h4 className="font-bold text-white text-base leading-tight display-font">{session.fullName}</h4>
                  <span className="text-indigo-400 text-xs font-mono font-bold block mt-1.5">User ID: {session.userId} · Role: {session.role}</span>
                </div>

                <div className="border-t border-slate-900 pt-5 space-y-4 text-xs font-sans">
                  <div className="flex justify-between py-2 border-b border-slate-900/40">
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[9px]">Academic Student Id</span>
                    <span className="font-mono text-slate-200 font-semibold">{session.studentId}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-900/40">
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[9px]">Username Handle</span>
                    <span className="text-slate-200 font-semibold">@{session.username}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-900/40">
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[9px]">Email Address</span>
                    <span className="text-slate-200 font-semibold">{session.email}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-900/40">
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[9px]">Department Desk</span>
                    <span className="text-slate-200 font-semibold">{session.department}</span>
                  </div>
                  {session.role === "STUDENT" && (
                    <div className="flex justify-between py-2 border-b border-slate-900/40">
                      <span className="font-bold text-slate-500 uppercase tracking-wider text-[9px]">Current Semester</span>
                      <span className="text-slate-200 font-semibold">{session.semester}th Semester</span>
                    </div>
                  )}
                </div>
              </div>
            )}

          </main>

          <footer className="py-4.5 border-t border-slate-900 text-center text-slate-600 text-[10px] bg-slate-950/30 select-none">
            <p>SmartCampus Assistant Portal System · Designed with <Heart className="w-3 h-3 inline text-rose-500 fill-rose-500" /> for Academic Excellence</p>
          </footer>

        </section>

      </div>

      {/* Global Toast Stack */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto bg-slate-950/95 backdrop-blur border border-slate-800 text-white rounded-xl shadow-2xl p-4 text-xs flex items-center gap-3 animate-slideIn">
            <span className={`w-2 h-2 rounded-full shrink-0 ${t.type === "error" ? "bg-rose-500 shadow-rose-500/50" : t.type === "info" ? "bg-amber-500 shadow-amber-500/50" : "bg-emerald-500 shadow-emerald-500/50"} shadow-lg`}></span>
            <span>{t.msg}</span>
          </div>
        ))}
      </div>

    </div>
  );
}