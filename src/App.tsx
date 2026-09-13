import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, CheckCircle2, Trash2, Clock, Terminal, Activity, Copy, Check, 
  Search, BookOpen, ChevronRight, Heart, User, GraduationCap, AlertCircle, 
  Send, LogOut, Bell, Calendar, UserCheck, ShieldAlert, RefreshCw, LayoutDashboard, BookmarkCheck,
  Users, Plus, Filter, Server, Edit3, Phone, Mail, BadgeCheck
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
  phone?: string;
  joinDate?: string;
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
  // Auto-detect local development server vs production Render backend
  const isLocalhost = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
  const API_BASE = import.meta.env.VITE_API_URL || (isLocalhost ? "" : "https://smartcampus-backend-eubv.onrender.com");

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
  const [regSem, setRegSem] = useState("1");
  const [regStudentId, setRegStudentId] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPass, setRegPass] = useState("");

  // Edit Profile Modal States
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [profFullName, setProfFullName] = useState("");
  const [profEmail, setProfEmail] = useState("");
  const [profDept, setProfDept] = useState("");
  const [profSem, setProfSem] = useState("");
  const [profPhone, setProfPhone] = useState("");

  // Global State – data-backed by Supabase via backend API with offline persistence
  const [users, setUsers] = useState<UserProfile[]>(() => {
    const defaultUsers: UserProfile[] = [
      { userId: "USR-001", username: "admin", fullName: "Campus Administrator", email: "admin@campus.edu", role: "ADMIN", department: "IT Support", semester: "N/A", studentId: "ADM-999", phone: "+91 98765 00001", joinDate: "Jan 2024" },
      { userId: "USR-002", username: "student", fullName: "Rahul Sharma", email: "student@campus.edu", role: "STUDENT", department: "Computer Science", semester: "4", studentId: "STU-2024-001", phone: "+91 98765 43210", joinDate: "Aug 2024" }
    ];
    try {
      const localUsers = JSON.parse(localStorage.getItem("sc_local_users") || "[]");
      if (Array.isArray(localUsers) && localUsers.length > 0) {
        const merged = [...defaultUsers];
        localUsers.forEach((lu: any) => {
          const idx = merged.findIndex(m => m.userId === lu.userId || m.username === lu.username);
          if (idx !== -1) merged[idx] = { ...merged[idx], ...lu };
          else merged.push(lu);
        });
        return merged;
      }
    } catch {}
    return defaultUsers;
  });

  // Books, announcements, assignments, complaints are loaded from Supabase with local fallback cache
  const [books, setBooks] = useState<Book[]>(() => {
    try {
      const saved = localStorage.getItem("sc_local_books");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    try {
      const saved = localStorage.getItem("sc_local_announcements");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [assignments, setAssignments] = useState<Assignment[]>(() => {
    try {
      const saved = localStorage.getItem("sc_local_assignments");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [complaints, setComplaints] = useState<Complaint[]>(() => {
    try {
      const saved = localStorage.getItem("sc_local_complaints");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
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

  // Cache campus assets to local storage so admin operations survive page refreshes
  useEffect(() => {
    if (books.length > 0) localStorage.setItem("sc_local_books", JSON.stringify(books));
  }, [books]);
  useEffect(() => {
    if (announcements.length > 0) localStorage.setItem("sc_local_announcements", JSON.stringify(announcements));
  }, [announcements]);
  useEffect(() => {
    if (assignments.length > 0) localStorage.setItem("sc_local_assignments", JSON.stringify(assignments));
  }, [assignments]);
  useEffect(() => {
    if (complaints.length > 0) localStorage.setItem("sc_local_complaints", JSON.stringify(complaints));
  }, [complaints]);
  useEffect(() => {
    if (users.length > 0) localStorage.setItem("sc_local_users", JSON.stringify(users));
  }, [users]);

  // Synchronize book availability and data across multiple browser tabs in real-time
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "sc_local_books" && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setBooks(parsed);
          }
        } catch {}
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // ============================================================
  // FETCH ALL DATA FROM SUPABASE ON MOUNT
  // ============================================================
  useEffect(() => {
    const fetchAll = async () => {
      setDbLoading(true);
      try {
        // --- Books ---
        const booksRes = await fetch(`${API_BASE}/api/books`);
        if (booksRes.ok) {
          const data = await booksRes.json();
          const remoteBooks = data.map((b: any) => ({
            id: b.id,
            title: b.title,
            author: b.author,
            isbn: b.isbn || `ISBN-${Math.floor(100000 + Math.random() * 900000)}`,
            category: b.category || ["Programming", "Software Engineering", "Computer Science"][Math.floor(Math.random() * 3)],
            copies: 1,
            available: b.available ? 1 : 0,
            link: "#"
          }));
          setBooks(prev => {
            const merged = [...remoteBooks];
            prev.forEach(p => {
              if (!merged.some(m => m.id === p.id || m.title.toLowerCase() === p.title.toLowerCase())) {
                merged.unshift(p);
              }
            });
            return merged;
          });
        }

        // --- Announcements ---
        const annRes = await fetch(`${API_BASE}/api/announcements`);
        if (annRes.ok) {
          const data = await annRes.json();
          const remoteAnn = data.map((a: any) => ({
            id: a.id,
            title: a.title,
            content: a.message,
            author: "Campus Admin",
            priority: (a.priority || "MEDIUM") as "HIGH" | "MEDIUM" | "LOW",
            timestamp: a.created_at ? a.created_at.slice(0, 10) : ""
          }));
          setAnnouncements(prev => {
            const merged = [...remoteAnn];
            prev.forEach(p => {
              if (!merged.some(m => m.id === p.id || (m.title === p.title && m.content === p.content))) {
                merged.unshift(p);
              }
            });
            return merged;
          });
        }

        // --- Assignments ---
        const asgRes = await fetch(`${API_BASE}/api/assignments`);
        if (asgRes.ok) {
          const data = await asgRes.json();
          let savedSubs: Record<string, any> = {};
          try {
            savedSubs = JSON.parse(localStorage.getItem("sc_assignment_submissions") || "{}");
          } catch {}
          const remoteAsg = data.map((a: any) => ({
            id: a.id,
            title: a.title,
            subject: a.subject || "General",
            description: a.description || "",
            due: a.due_date ? a.due_date.slice(0, 10) : "",
            marks: a.marks || "100",
            priority: (a.priority || "MEDIUM") as "HIGH" | "MEDIUM" | "LOW",
            submissions: savedSubs[a.id] || a.submissions || {}
          }));
          setAssignments(prev => {
            const merged = [...remoteAsg];
            prev.forEach(p => {
              const existingIdx = merged.findIndex(m => m.id === p.id);
              if (existingIdx === -1) {
                merged.unshift({
                  ...p,
                  submissions: { ...(savedSubs[p.id] || {}), ...(p.submissions || {}) }
                });
              } else {
                merged[existingIdx].submissions = {
                  ...(savedSubs[p.id] || {}),
                  ...(p.submissions || {}),
                  ...(merged[existingIdx].submissions || {})
                };
              }
            });
            return merged;
          });
        }

        // --- Complaints ---
        const cmpRes = await fetch(`${API_BASE}/api/complaints`);
        if (cmpRes.ok) {
          const data = await cmpRes.json();
          let localStatuses: Record<string, any> = {};
          try {
            localStatuses = JSON.parse(localStorage.getItem("sc_complaint_statuses") || "{}");
          } catch {}
          const remoteCmp = data.map((c: any) => {
            const override = localStatuses[c.id];
            return {
              id: c.id,
              studentId: c.student_id || "STUDENT",
              studentName: "Student",
              category: c.category || "General",
              description: c.complaint || "",
              status: override?.status || (c.status === "Pending" ? "PENDING" : c.status === "Resolved" ? "RESOLVED" : "REVIEWING") as "PENDING" | "REVIEWING" | "RESOLVED",
              remark: override?.remark !== undefined ? override.remark : (c.remark || ""),
              timestamp: c.created_at ? c.created_at.slice(0, 10) : ""
            };
          });
          setComplaints(prev => {
            const merged = [...remoteCmp];
            prev.forEach(p => {
              if (!merged.some(m => m.id === p.id)) {
                merged.unshift(p);
              }
            });
            return merged;
          });
        }

        // --- Users ---
        const usersRes = await fetch(`${API_BASE}/api/users`);
        if (usersRes.ok) {
          const uData = await usersRes.json();
          let localUsers: any[] = [];
          try {
            localUsers = JSON.parse(localStorage.getItem("sc_local_users") || "[]");
          } catch {}

          const dbUsers = uData.map((u: any) => {
            let email = u.email || "";
            let username = u.email ? u.email.split("@")[0] : u.name.toLowerCase().replace(/\s+/g, "");
            let password = u.role === "ADMIN" ? "admin123" : "student123";

            let department = "";
            let semester = "";
            let studentId = "";
            let phone = "";

            if (u.email && u.email.includes("|")) {
              const parts = u.email.split("|");
              email = parts[0];
              username = parts[1] || username;
              password = parts[2] || password;
              department = parts[3] || "";
              semester = parts[4] || "";
              studentId = parts[5] || "";
              phone = parts[6] || "";
            }

            const localMatch = localUsers.find((lu: any) => lu.userId === String(u.id) || lu.username === username.toLowerCase());

            return {
              userId: String(u.id),
              username: username.toLowerCase(),
              fullName: localMatch?.fullName || u.name,
              email: localMatch?.email || email,
              role: (localMatch?.role || u.role || "STUDENT") as "STUDENT" | "ADMIN",
              department: localMatch?.department || department || (u.role === "ADMIN" ? "IT Support" : "Computer Science"),
              semester: localMatch?.semester || semester || (u.role === "ADMIN" ? "N/A" : "4"),
              studentId: localMatch?.studentId || studentId || (u.role === "ADMIN" ? "ADM-999" : `STU-2024-${String(u.id).substring(0, 3)}`),
              phone: localMatch?.phone || phone || "",
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
                merged[existingIdx] = { ...merged[existingIdx], ...dbU };
              }
            });
            return merged;
          });
        }

        // --- System Health ---
        try {
          const healthRes = await fetch(`${API_BASE}/api/health`);
          if (healthRes.ok) {
            const hData = await healthRes.json();
            setSystemHealth(hData);
          }
        } catch {
          // non-blocking
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
  const [complaintFilter, setComplaintFilter] = useState<"ALL" | "PENDING" | "REVIEWING" | "RESOLVED">("ALL");

  // Admin Book Form
  const [newBookTitle, setNewBookTitle] = useState("");
  const [newBookAuthor, setNewBookAuthor] = useState("");
  const [newBookCategory, setNewBookCategory] = useState("Computer Science");
  const [newBookIsbn, setNewBookIsbn] = useState("");
  const [showAddBook, setShowAddBook] = useState(false);

  // Admin User Creation Form
  const [newUserName, setNewUserName] = useState("");
  const [newUserUsername, setNewUserUsername] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<"STUDENT" | "ADMIN">("STUDENT");

  // Admin User Edit Form Modal
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editUserName, setEditUserName] = useState("");
  const [editUserEmail, setEditUserEmail] = useState("");
  const [editUserRole, setEditUserRole] = useState<"STUDENT" | "ADMIN">("STUDENT");
  const [editUserDept, setEditUserDept] = useState("");
  const [editUserSem, setEditUserSem] = useState("4");

  // System Diagnostics
  const [systemHealth, setSystemHealth] = useState<{ status: string; uptime: number; database: string; geminiConfigured: boolean } | null>(null);

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
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUser || !loginPass) {
      setAuthError("Please fill in all security fields.");
      return;
    }
    const response = await fetch(
      `${API_BASE}/api/users`
    );

    const allUsers = await response.json();

    const foundUser = allUsers.find((u: any) => {
      const parts = u.email.split("|");
      return parts[1]?.toLowerCase() === loginUser.toLowerCase();
    });
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
      const [, , dbPassword] = foundUser.email.split("|");
      if (dbPassword && loginPass !== dbPassword) {
        setAuthError(`Incorrect password for account '${loginUser}'.`);
        return;
      }
    }

    const parts = foundUser.email.split("|");
    const userEmail = parts[0] || foundUser.email;
    const username = parts[1] || loginUser;
    const deptFromEmail = parts[3];
    const semFromEmail = parts[4];
    const stuIdFromEmail = parts[5];
    const phoneFromEmail = parts[6];

    let localUsers: UserProfile[] = [];
    try {
      localUsers = JSON.parse(localStorage.getItem("sc_local_users") || "[]");
    } catch {}
    const localMatch = localUsers.find((lu: any) => lu.userId === String(foundUser.id) || lu.username?.toLowerCase() === (username || loginUser).toLowerCase());

    const isStudent = (foundUser.role || localMatch?.role) === "STUDENT";
    const userProfile: UserProfile = {
      userId: String(foundUser.id),
      username: (username || loginUser).toLowerCase(),
      fullName: localMatch?.fullName || (loginUser === "student" ? "Rahul Sharma" : foundUser.name),
      email: localMatch?.email || userEmail,
      role: (localMatch?.role || foundUser.role || "STUDENT") as "STUDENT" | "ADMIN",
      department: localMatch?.department || deptFromEmail || (isStudent ? "Computer Science" : "IT Support"),
      semester: localMatch?.semester || semFromEmail || (isStudent ? "4" : "N/A"),
      studentId: localMatch?.studentId || stuIdFromEmail || (isStudent ? (loginUser === "student" ? "STU-2024-001" : `STU-2026-${String(foundUser.id).slice(-3).padStart(3, "0")}`) : "ADM-999"),
      phone: localMatch?.phone || phoneFromEmail || (loginUser === "student" ? "+91 98765 43210" : ""),
      joinDate: localMatch?.joinDate || "Aug 2024"
    };

    setSession(userProfile);
    sessionStorage.setItem("sca_session", JSON.stringify(userProfile));
    addToast(`Successfully logged in as ${userProfile.fullName}`, "success");
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFullName.trim() || !regUsername.trim() || !regEmail.trim() || !regPass.trim()) {
      setAuthError("All registration criteria are mandatory.");
      return;
    }
    if (users.some(u => u.username.toLowerCase() === regUsername.trim().toLowerCase())) {
      setAuthError("Username is already taken by another account.");
      return;
    }

    const assignedStudentId = regStudentId.trim() || `STU-2026-${Math.floor(100 + Math.random() * 900)}`;

    try {
      const res = await fetch(`${API_BASE}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regFullName.trim(),
          email: `${regEmail.trim()}|${regUsername.trim().toLowerCase()}|${regPass.trim()}|${regDept}|${regSem}|${assignedStudentId}|${regPhone.trim()}`,
          role: "STUDENT"
        })
      });

      let savedId = `USR-${Date.now().toString().slice(-4)}`;
      if (res.ok) {
        const data = await res.json();
        const savedUser = Array.isArray(data) ? data[0] : data;
        if (savedUser?.id) savedId = String(savedUser.id);
      }

      const newUser: UserProfile = {
        userId: savedId,
        username: regUsername.trim().toLowerCase(),
        fullName: regFullName.trim(),
        email: regEmail.trim(),
        role: "STUDENT",
        department: regDept,
        semester: regSem,
        studentId: assignedStudentId,
        phone: regPhone.trim(),
        joinDate: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" })
      };

      setUsers(prev => {
        const nextUsers = [...prev, newUser];
        try {
          localStorage.setItem("sc_local_users", JSON.stringify(nextUsers));
        } catch {}
        return nextUsers;
      });

      setRegFullName("");
      setRegUsername("");
      setRegEmail("");
      setRegPass("");
      setRegStudentId("");
      setRegPhone("");
      setAuthError("");

      // Automatically sign in the registered student and take them to their profile!
      setSession(newUser);
      sessionStorage.setItem("sca_session", JSON.stringify(newUser));
      setActiveTab("profile");
      addToast(`Account created! Welcome, ${newUser.fullName}.`, "success");
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

  // Student Profile Modification Handlers
  const openEditProfile = () => {
    if (!session) return;
    setProfFullName(session.fullName);
    setProfEmail(session.email);
    setProfDept(session.department || "Computer Science");
    setProfSem(session.semester || "1");
    setProfPhone(session.phone || "");
    setShowEditProfile(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    const updatedUser: UserProfile = {
      ...session,
      fullName: profFullName.trim(),
      email: profEmail.trim(),
      department: profDept,
      semester: profSem,
      phone: profPhone.trim()
    };
    setSession(updatedUser);
    sessionStorage.setItem("sca_session", JSON.stringify(updatedUser));
    setUsers(prev => {
      const updatedList = prev.map(u => u.userId === session.userId ? updatedUser : u);
      try {
        localStorage.setItem("sc_local_users", JSON.stringify(updatedList));
      } catch {}
      return updatedList;
    });
    setShowEditProfile(false);
    addToast("Profile details updated successfully!", "success");

    try {
      await fetch(`${API_BASE}/api/users/${session.userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: updatedUser.fullName,
          email: `${updatedUser.email}|${updatedUser.username}|${(session as any).password || ""}|${updatedUser.department}|${updatedUser.semester}|${updatedUser.studentId}|${updatedUser.phone}`
        })
      });
    } catch {}
  };

  const copyStudentCredentials = () => {
    if (!session) return;
    try {
      navigator.clipboard?.writeText(
        `SmartCampus ID: ${session.studentId}\nName: ${session.fullName}\nDepartment: ${session.department}\nSemester: Semester ${session.semester}\nEmail: ${session.email}\nRole: ${session.role}`
      );
      addToast("Academic credentials copied to clipboard!", "success");
    } catch {
      addToast("Failed to copy to clipboard.", "error");
    }
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
      if (book && book.available !== 1) {
        addToast(`"${book.title}" is currently unavailable.`, "error");
        return;
      }
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
      const localStatuses = JSON.parse(localStorage.getItem("sc_complaint_statuses") || "{}");
      localStatuses[compId] = { status, remark };
      localStorage.setItem("sc_complaint_statuses", JSON.stringify(localStatuses));
    } catch {}

    try {
      const supabaseStatus = status === "PENDING" ? "Pending" : status === "RESOLVED" ? "Resolved" : "Reviewing";
      const res = await fetch(`${API_BASE}/api/complaints/${compId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: supabaseStatus })
      });
      if (!res.ok) console.warn("Supabase complaint update pending service role key on Render");
      addToast(`Complaint ticket status updated to ${status}`, "info");
    } catch (err) {
      console.error(err);
      addToast(`Complaint updated locally.`, "info");
    }
  };

  // Delete complaint → Supabase
  const removeComplaint = async (compId: string) => {
    setComplaints(c => c.filter(x => x.id !== compId));
    try {
      const localStatuses = JSON.parse(localStorage.getItem("sc_complaint_statuses") || "{}");
      delete localStatuses[compId];
      localStorage.setItem("sc_complaint_statuses", JSON.stringify(localStatuses));
    } catch {}
    addToast("Complaint ticket removed.", "success");
    try {
      const res = await fetch(`${API_BASE}/api/complaints/${compId}`, { method: "DELETE" });
      if (!res.ok) console.warn("Supabase complaint delete pending service role key on Render");
    } catch (err) {
      console.warn("Complaint removed locally:", err);
    }
  };

  // Post new Announcement → Supabase
  const makeAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnTitle || !newAnnContent) return addToast("Please fill announcement title and body.", "error");
    const titleSnapshot = newAnnTitle;
    const contentSnapshot = newAnnContent;
    const tempId = `ann-${Date.now()}`;
    const ann: Announcement = {
      id: tempId,
      title: titleSnapshot,
      content: contentSnapshot,
      author: session?.fullName || "Campus Admin",
      priority: newAnnPriority,
      timestamp: new Date().toISOString().slice(0, 10)
    };
    setAnnouncements(prev => [ann, ...prev]);
    setNewAnnTitle("");
    setNewAnnContent("");
    addToast(`Published Announcement: ${titleSnapshot.substring(0, 30)}...`, "success");

    try {
      const res = await fetch(`${API_BASE}/api/announcements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: titleSnapshot, message: contentSnapshot })
      });
      if (res.ok) {
        const saved = await res.json();
        const savedAnn = Array.isArray(saved) ? saved[0] : saved;
        if (savedAnn?.id) {
          setAnnouncements(prev => prev.map(a => a.id === tempId ? { ...a, id: savedAnn.id } : a));
        }
      } else {
        console.warn("Announcement saved locally; backend cloud sync pending service role key on Render");
      }
    } catch (err) {
      console.warn("Announcement saved locally:", err);
    }
  };

  // Delete Announcement → Supabase
  const removeAnnouncement = async (annId: string) => {
    setAnnouncements(p => p.filter(a => a.id !== annId));
    addToast("Announcement removed successfully.", "success");
    try {
      const res = await fetch(`${API_BASE}/api/announcements/${annId}`, { method: "DELETE" });
      if (!res.ok) console.warn("Supabase announcement delete pending service role key on Render");
    } catch (err) {
      console.warn("Announcement removed locally:", err);
    }
  };

  // Admin: Add new book → Supabase & state
  const addBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBookTitle.trim() || !newBookAuthor.trim()) {
      addToast("Please provide book title and author.", "error");
      return;
    }
    const titleSnap = newBookTitle.trim();
    const authorSnap = newBookAuthor.trim();
    const catSnap = newBookCategory || "Computer Science";
    const isbnSnap = newBookIsbn.trim() || `ISBN-${Math.floor(100000 + Math.random() * 900000)}`;
    const tempId = `book-${Date.now()}`;

    const newBook: Book = {
      id: tempId,
      title: titleSnap,
      author: authorSnap,
      isbn: isbnSnap,
      category: catSnap,
      copies: 1,
      available: 1,
      link: "#"
    };
    setBooks(prev => [newBook, ...prev]);
    setNewBookTitle("");
    setNewBookAuthor("");
    setNewBookIsbn("");
    setShowAddBook(false);
    addToast(`Book "${titleSnap}" added to catalog.`, "success");

    try {
      const res = await fetch(`${API_BASE}/api/books`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: titleSnap, author: authorSnap })
      });
      if (res.ok) {
        const data = await res.json();
        const saved = Array.isArray(data) ? data[0] : data;
        if (saved?.id) {
          setBooks(prev => prev.map(b => b.id === tempId ? { ...b, id: saved.id } : b));
        }
      } else {
        console.warn("Book saved locally; backend cloud sync pending service role key on Render");
      }
    } catch (err) {
      console.warn("Book saved locally:", err);
    }
  };

  // Admin: Delete book → Supabase & state
  const removeBook = async (bookId: string) => {
    setBooks(p => p.filter(b => b.id !== bookId));
    addToast("Book removed from catalog.", "success");
    try {
      const res = await fetch(`${API_BASE}/api/books/${bookId}`, { method: "DELETE" });
      if (!res.ok) console.warn("Supabase book delete pending service role key on Render");
    } catch (err) {
      console.warn("Book removed locally:", err);
    }
  };

  // Admin: Toggle book availability → Supabase & state
  const toggleBookAvailability = async (bookId: string, currentAvailable: boolean) => {
    const newAvailable = !currentAvailable;
    setBooks(prev => {
      const updated = prev.map(b => b.id === bookId ? { ...b, available: newAvailable ? 1 : 0 } : b);
      try {
        localStorage.setItem("sc_local_books", JSON.stringify(updated));
      } catch {}
      return updated;
    });
    addToast(`Book status set to ${newAvailable ? "Available" : "Unavailable"}.`, "info");
    try {
      const res = await fetch(`${API_BASE}/api/books/${bookId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ available: newAvailable })
      });
      if (!res.ok) console.warn("Supabase book toggle pending service role key on Render");
    } catch (err) {
      console.warn("Book availability toggled locally:", err);
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

    const submissionData = {
      timestamp: new Date().toLocaleString(),
      note: noteText,
      fileName: uploadedFile,
      studentName: session.fullName,
      studentEmail: session.email,
      studentId: session.studentId
    };

    setAssignments(prev => prev.map(a => {
      if (a.id === asgId) {
        const nextSubs = { ...a.submissions };
        nextSubs[session.userId] = submissionData;
        return { ...a, submissions: nextSubs };
      }
      return a;
    }));

    try {
      const savedSubs = JSON.parse(localStorage.getItem("sc_assignment_submissions") || "{}");
      if (!savedSubs[asgId]) savedSubs[asgId] = {};
      savedSubs[asgId][session.userId] = submissionData;
      localStorage.setItem("sc_assignment_submissions", JSON.stringify(savedSubs));
    } catch (e) {
      console.error(e);
    }

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

    try {
      const savedSubs = JSON.parse(localStorage.getItem("sc_assignment_submissions") || "{}");
      if (!savedSubs[asgId]) savedSubs[asgId] = {};
      if (!savedSubs[asgId][studentId]) {
        savedSubs[asgId][studentId] = { studentName: "Student", studentId };
      }
      savedSubs[asgId][studentId] = {
        ...savedSubs[asgId][studentId],
        grade: gradeVal,
        comment: commentVal
      };
      localStorage.setItem("sc_assignment_submissions", JSON.stringify(savedSubs));
    } catch (e) {
      console.error(e);
    }

    addToast("Grades and feedback saved permanently.", "success");
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
    const tempId = `asg-${Date.now()}`;
    const asg: Assignment = {
      id: tempId,
      title: titleSnap,
      subject: newAsgSub,
      description: descSnap,
      due: dueSnap,
      marks: newAsgMarks,
      priority: newAsgPriority,
      submissions: {}
    };
    setAssignments(prev => [asg, ...prev]);
    setNewAsgTitle("");
    setNewAsgDesc("");
    addToast("New assignment posted.", "success");

    try {
      const res = await fetch(`${API_BASE}/api/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: titleSnap,
          description: descSnap,
          due_date: dueSnap
        })
      });
      if (res.ok) {
        const saved = await res.json();
        const savedAsg = Array.isArray(saved) ? saved[0] : saved;
        if (savedAsg?.id) {
          setAssignments(prev => prev.map(a => a.id === tempId ? { ...a, id: savedAsg.id } : a));
        }
      } else {
        console.warn("Assignment saved locally; backend cloud sync pending service role key on Render");
      }
    } catch (err) {
      console.warn("Assignment saved locally:", err);
    }
  };

  // Delete Assignment → Supabase
  const removeAssignment = async (asgId: string) => {
    setAssignments(p => p.filter(a => a.id !== asgId));
    addToast("Assignment removed successfully.", "success");
    try {
      const res = await fetch(`${API_BASE}/api/assignments/${asgId}`, { method: "DELETE" });
      if (!res.ok) console.warn("Supabase assignment delete pending service role key on Render");
    } catch (err) {
      console.warn("Assignment removed locally:", err);
    }
  };

  // Admin: Create new user (Student or Admin)
  const adminCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserUsername.trim() || !newUserEmail.trim() || !newUserPassword.trim()) {
      addToast("Please fill all user details.", "error");
      return;
    }
    const nameSnap = newUserName.trim();
    const userSnap = newUserUsername.trim().toLowerCase();
    const emailSnap = newUserEmail.trim();
    const passSnap = newUserPassword.trim();
    const roleSnap = newUserRole;

    if (users.some(u => u.username.toLowerCase() === userSnap)) {
      addToast(`Username "${userSnap}" is already taken.`, "error");
      return;
    }

    const tempId = `USR-${Date.now().toString().slice(-4)}`;
    const createdUser: UserProfile & { password?: string } = {
      userId: tempId,
      username: userSnap,
      fullName: nameSnap,
      email: emailSnap,
      role: roleSnap,
      department: roleSnap === "ADMIN" ? "IT Support" : "Computer Science",
      semester: roleSnap === "ADMIN" ? "N/A" : "4",
      studentId: roleSnap === "ADMIN" ? "ADM-999" : `STU-2026-${Math.floor(100 + Math.random() * 900)}`,
      password: passSnap
    };
    setUsers(prev => [...prev, createdUser]);
    setNewUserName("");
    setNewUserUsername("");
    setNewUserEmail("");
    setNewUserPassword("");
    addToast(`User "${nameSnap}" added to directory as ${roleSnap}.`, "success");

    try {
      const res = await fetch(`${API_BASE}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nameSnap,
          email: `${emailSnap}|${userSnap}|${passSnap}`,
          role: roleSnap
        })
      });
      if (res.ok) {
        const data = await res.json();
        const saved = Array.isArray(data) ? data[0] : data;
        if (saved?.id) {
          setUsers(prev => prev.map(u => u.userId === tempId ? { ...u, userId: String(saved.id) } : u));
        }
      } else {
        console.warn("User saved locally; backend cloud sync pending service role key on Render");
      }
    } catch (err) {
      console.warn("User saved locally:", err);
    }
  };

  // Admin: Delete user
  const adminDeleteUser = async (userId: string, userName: string) => {
    if (session?.userId === userId) {
      addToast("Cannot delete your currently active session account.", "error");
      return;
    }
    setUsers(p => p.filter(u => u.userId !== userId));
    addToast(`User "${userName}" removed from system.`, "info");
    try {
      const res = await fetch(`${API_BASE}/api/users/${userId}`, { method: "DELETE" });
      if (!res.ok) console.warn("Supabase user delete pending service role key on Render");
    } catch (err) {
      console.warn("User deleted locally:", err);
    }
  };

  // Admin: Open Edit User Modal
  const openEditUser = (u: UserProfile) => {
    setEditingUser(u);
    setEditUserName(u.fullName);
    setEditUserEmail(u.email);
    setEditUserRole(u.role);
    setEditUserDept(u.department || (u.role === "ADMIN" ? "IT Support" : "Computer Science"));
    setEditUserSem(u.semester || "4");
  };

  // Admin: Save User Changes
  const adminUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    const uid = editingUser.userId;
    const nameSnap = editUserName.trim();
    const emailSnap = editUserEmail.trim();
    const roleSnap = editUserRole;
    const deptSnap = editUserDept.trim();
    const semSnap = editUserSem.trim();

    if (!nameSnap || !emailSnap) {
      addToast("Please fill all required fields.", "error");
      return;
    }

    const updatedUser: UserProfile = {
      ...editingUser,
      fullName: nameSnap,
      email: emailSnap,
      role: roleSnap,
      department: deptSnap,
      semester: roleSnap === "ADMIN" ? "N/A" : semSnap
    };

    setUsers(prev => prev.map(u => u.userId === uid ? updatedUser : u));
    if (session?.userId === uid) {
      setSession(updatedUser);
      sessionStorage.setItem("sca_session", JSON.stringify(updatedUser));
    }

    try {
      const localUsers = JSON.parse(localStorage.getItem("sc_local_users") || "[]");
      const filtered = localUsers.filter((u: any) => u.userId !== uid && u.username !== editingUser.username);
      filtered.push(updatedUser);
      localStorage.setItem("sc_local_users", JSON.stringify(filtered));
    } catch (e) {
      console.error(e);
    }

    addToast(`Updated details for "${nameSnap}".`, "success");

    try {
      const res = await fetch(`${API_BASE}/api/users/${uid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nameSnap,
          email: `${emailSnap}|${editingUser.username}|${editingUser.password || "student123"}`,
          role: roleSnap
        })
      });
      if (!res.ok) console.warn("Supabase user update pending service role key on Render");
    } catch (err) {
      console.warn("User updated locally:", err);
    }
    setEditingUser(null);
  };

  // Submit Complaint → Supabase
  const fileComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompDesc || newCompDesc.length < 5) return addToast("Please specify full problem details.", "error");
    const descSnap = newCompDesc;
    setNewCompDesc("");
    try {
      const res = await fetch(`${API_BASE}/api/complaints`, {
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
      const response = await fetch(`${API_BASE}/api/chat`, {
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

  // Auth Layout (Enterprise High-End Login)
  if (!session) {
    return (
      <div className="min-h-screen bg-[#070913] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans">
        {/* Animated Radial Backdrop Orbs */}
        <div className="absolute -top-40 -left-40 w-[550px] h-[550px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none float-bg"></div>
        <div className="absolute -bottom-40 -right-40 w-[550px] h-[550px] bg-violet-600/10 rounded-full blur-[140px] pointer-events-none float-bg" style={{ animationDelay: "3s" }}></div>

        <div className="max-w-4xl w-full pro-card rounded-3xl overflow-hidden grid grid-cols-1 md:grid-cols-2 relative z-10 shadow-2xl border border-white/[0.08]">
          
          {/* Logo Brand Frame */}
          <div className="bg-gradient-to-br from-indigo-950 via-[#0d1326] to-[#080c16] p-8 sm:p-10 flex flex-col justify-between text-white relative border-b md:border-b-0 md:border-r border-white/[0.06]">
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-xl font-bold shadow-lg shadow-indigo-500/25 border border-white/20">
                  🏛️
                </div>
                <div>
                  <span className="text-lg font-bold tracking-tight text-white block">SmartCampus</span>
                  <span className="text-[9px] uppercase font-mono tracking-widest text-indigo-400 font-bold block">Enterprise Academy Hub</span>
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight mb-3 tracking-tight text-white">
                Academic Operations, <br className="hidden sm:block" />Reimagined.
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-8">
                A unified campus experience for real-time administrative workflows, interactive course timetables, digital book loans, and AI-powered student assistance.
              </p>
            </div>
            
            <div className="space-y-2.5">
              <div className="flex items-center gap-3 bg-white/[0.03] hover:bg-white/[0.05] transition-colors p-3 rounded-xl border border-white/[0.06] text-xs">
                <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-xs">📚</span>
                <span className="text-slate-300 font-medium">Smart Library Catalog & Loan Tracking</span>
              </div>
              <div className="flex items-center gap-3 bg-white/[0.03] hover:bg-white/[0.05] transition-colors p-3 rounded-xl border border-white/[0.06] text-xs">
                <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-xs">⚡</span>
                <span className="text-slate-300 font-medium">Real-Time Academic Administration</span>
              </div>
            </div>
          </div>

          {/* Form Action */}
          <div className="p-8 sm:p-10 flex flex-col justify-center bg-[#090d18]/80">
            <div className="mb-6">
              <h2 className="text-2xl font-extrabold text-white tracking-tight">Sign In</h2>
              <p className="text-slate-400 text-xs mt-1">Access your verified campus credentials</p>
            </div>

            <div className="flex bg-slate-900/80 border border-slate-800 p-1 rounded-xl mb-6 shadow-inner">
              <button
                type="button"
                onClick={() => { setAuthTab("login"); setAuthError(""); }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${authTab === "login" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30" : "text-slate-400 hover:text-slate-200"}`}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => { setAuthTab("register"); setAuthError(""); }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${authTab === "register" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30" : "text-slate-400 hover:text-slate-200"}`}
              >
                Create Account
              </button>
            </div>

            {authError && (
              <div className="bg-rose-950/40 text-rose-300 p-3 rounded-xl border border-rose-900/40 text-xs mb-4 flex items-center gap-2.5 animate-slideIn">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{authError}</span>
              </div>
            )}

            {authTab === "login" ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Username Handle</label>
                  <input
                    type="text"
                    value={loginUser}
                    onChange={(e) => setLoginUser(e.target.value)}
                    required
                    placeholder="e.g. admin or student"
                    className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-200 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-600 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
                  <input
                    type="password"
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    required
                    placeholder="Enter password"
                    className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-200 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-600"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl font-bold text-xs transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 cursor-pointer active:scale-[0.99] mt-2"
                >
                  Sign In to SmartCampus
                </button>

                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 space-y-1 mt-4">
                  <div className="font-bold flex items-center gap-1.5 text-indigo-400">🔑 Quick Demo Logins</div>
                  <div>Student: <span className="font-mono text-slate-200 font-semibold">student</span> / <span className="font-mono text-slate-200">student123</span></div>
                  <div>Admin: <span className="font-mono text-slate-200 font-semibold">admin</span> / <span className="font-mono text-slate-200">admin123</span></div>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Full Name</label>
                  <input
                    type="text"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="e.g. John Doe"
                    required
                    className="w-full px-3.5 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-200 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Username</label>
                    <input
                      type="text"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      placeholder="Username"
                      required
                      className="w-full px-3.5 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-200 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email</label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="student@campus.edu"
                      required
                      className="w-full px-3.5 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-200 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Student Roll / ID</label>
                    <input
                      type="text"
                      value={regStudentId}
                      onChange={(e) => setRegStudentId(e.target.value)}
                      placeholder="Auto if empty (e.g. STU-2026-101)"
                      className="w-full px-3.5 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-200 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Contact Phone</label>
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="e.g. +91 98765 43210"
                      className="w-full px-3.5 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-200 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Department</label>
                    <select
                      value={regDept}
                      onChange={(e) => setRegDept(e.target.value)}
                      className="w-full px-2 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-300 outline-none [color-scheme:dark]"
                    >
                      <option>Computer Science</option>
                      <option>Information Technology</option>
                      <option>Electrical Engineering</option>
                      <option>Mechanical Engineering</option>
                      <option>Civil Engineering</option>
                      <option>Business Administration</option>
                      <option>Data Science & AI</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Current Semester</label>
                    <select
                      value={regSem}
                      onChange={(e) => setRegSem(e.target.value)}
                      className="w-full px-2 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-300 outline-none [color-scheme:dark]"
                    >
                      {[
                        { s: "1", y: "1st Year" },
                        { s: "2", y: "1st Year" },
                        { s: "3", y: "2nd Year" },
                        { s: "4", y: "2nd Year" },
                        { s: "5", y: "3rd Year" },
                        { s: "6", y: "3rd Year" },
                        { s: "7", y: "4th Year" },
                        { s: "8", y: "4th Year" }
                      ].map(({ s, y }) => (
                        <option key={s} value={s}>Semester {s} ({y})</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Password</label>
                  <input
                    type="password"
                    value={regPass}
                    onChange={(e) => setRegPass(e.target.value)}
                    placeholder="Minimum 6 characters"
                    required
                    className="w-full px-3.5 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-200 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 cursor-pointer active:scale-[0.99] mt-2"
                >
                  Create Account
                </button>
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
        <aside className="w-full md:w-68 bg-[#0a0d18]/95 backdrop-blur-2xl text-slate-300 flex flex-col md:sticky md:top-0 md:h-screen shrink-0 border-r border-slate-800/60 shadow-2xl select-none">
          <div className="p-5 border-b border-slate-800/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-lg shadow-lg shadow-indigo-600/30 border border-indigo-400/20">
                🏛️
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold tracking-tight text-white text-sm">SmartCampus</span>
                  <span className="text-[8px] font-mono font-bold bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/20">PRO</span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium block">Intelligent Academic Hub</span>
              </div>
            </div>
          </div>

          <div className="p-3 mx-3 my-3 bg-slate-900/60 border border-slate-800/80 rounded-2xl flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-violet-600 flex items-center justify-center font-bold text-white text-sm shadow-md border border-white/10">
              {session.fullName.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden flex-1">
              <div className="font-bold text-white text-xs truncate">{session.fullName}</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full ${session.role === "ADMIN" ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]" : "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"}`}></span>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{session.role}</span>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1 font-semibold text-xs">
            <div className="px-3 pb-2 pt-1 text-[9px] uppercase tracking-widest font-bold text-slate-500 font-mono">Academic Workspace</div>
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${activeTab === "dashboard" ? "bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/25 border border-indigo-500/30" : "hover:bg-white/[0.04] text-slate-400 hover:text-slate-200"}`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>General Dashboard</span>
            </button>
            <button
              onClick={() => setActiveTab("timetable")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${activeTab === "timetable" ? "bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/25 border border-indigo-500/30" : "hover:bg-white/[0.04] text-slate-400 hover:text-slate-200"}`}
            >
              <Calendar className="w-4 h-4" />
              <span>Weekly Timetable</span>
            </button>
            <button
              onClick={() => setActiveTab("announcements")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${activeTab === "announcements" ? "bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/25 border border-indigo-500/30" : "hover:bg-white/[0.04] text-slate-400 hover:text-slate-200"}`}
            >
              <Bell className="w-4 h-4" />
              <span>Announcements</span>
            </button>

            <div className="px-3 pt-5 pb-2 text-[9px] uppercase tracking-widest font-bold text-slate-500 font-mono">Campus Services</div>
            <button
              onClick={() => setActiveTab("library")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${activeTab === "library" ? "bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/25 border border-indigo-500/30" : "hover:bg-white/[0.04] text-slate-400 hover:text-slate-200"}`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Smart Library</span>
              {borrowedBookIds.length > 0 && (
                <span className="ml-auto bg-indigo-500 text-white font-bold px-2 py-0.5 rounded-full text-[10px] shadow-sm">{borrowedBookIds.length}</span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("assignments")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${activeTab === "assignments" ? "bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/25 border border-indigo-500/30" : "hover:bg-white/[0.04] text-slate-400 hover:text-slate-200"}`}
            >
              <BookmarkCheck className="w-4 h-4" />
              <span>Active Assignments</span>
              {session.role === "STUDENT" && pendingAssignments > 0 && (
                <span className="ml-auto bg-amber-500 text-slate-950 font-extrabold px-2 py-0.5 rounded-full text-[10px] shadow-sm">{pendingAssignments}</span>
              )}
            </button>
            {session.role === "STUDENT" && (
              <button
                onClick={() => setActiveTab("reminders")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${activeTab === "reminders" ? "bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/25 border border-indigo-500/30" : "hover:bg-white/[0.04] text-slate-400 hover:text-slate-200"}`}
              >
                <Clock className="w-4 h-4" />
                <span>My Reminders</span>
                {activeRemindersCount > 0 && (
                  <span className="ml-auto bg-indigo-500/20 text-indigo-300 font-bold px-2 py-0.5 rounded-full text-[10px] border border-indigo-500/30">{activeRemindersCount}</span>
                )}
              </button>
            )}
            <button
              onClick={() => setActiveTab("complaints")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${activeTab === "complaints" ? "bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/25 border border-indigo-500/30" : "hover:bg-white/[0.04] text-slate-400 hover:text-slate-200"}`}
            >
              <RefreshCw className="w-4 h-4" />
              <span>Complaints Desk</span>
            </button>
            <button
              onClick={() => setActiveTab("assistant")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${activeTab === "assistant" ? "bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/25 border border-indigo-500/30" : "hover:bg-white/[0.04] text-slate-400 hover:text-slate-200"}`}
            >
              <Terminal className="w-4 h-4" />
              <span>AI Campus BOT</span>
            </button>

            <div className="px-3 pt-5 pb-2 text-[9px] uppercase tracking-widest font-bold text-slate-500 font-mono">Account</div>
            <button
              onClick={() => setActiveTab("profile")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${activeTab === "profile" ? "bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/25 border border-indigo-500/30" : "hover:bg-white/[0.04] text-slate-400 hover:text-slate-200"}`}
            >
              <User className="w-4 h-4" />
              <span>{session.role === "STUDENT" ? "Student Profile" : "Admin Profile"}</span>
            </button>
          </nav>

          <div className="p-4 border-t border-slate-800/60 space-y-2">
            <button onClick={logout} className="w-full py-2.5 bg-slate-900/40 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border border-slate-800/80 hover:border-rose-900/40 transition-all cursor-pointer">
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out Account</span>
            </button>
          </div>
        </aside>

        {/* Content Container Area */}
        <section className="flex-1 flex flex-col min-w-0">
          
          {/* Header */}
          <header className="h-16 bg-[#0a0d18]/80 backdrop-blur-xl border-b border-slate-800/60 sticky top-0 z-20 flex items-center justify-between px-6 md:px-8 shadow-sm select-none">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">SmartCampus</span>
              <span className="text-slate-700">/</span>
              <span className="font-semibold text-slate-200 capitalize">{activeTab.replace("-", " ")}</span>
            </div>
            
            <div className="flex items-center gap-3.5">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-900/60 border border-slate-800/80 rounded-xl font-mono text-xs text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>{currentTime.toLocaleTimeString()}</span>
              </div>
              <div className="w-px h-6 bg-slate-800 hidden sm:block"></div>
              <button
                onClick={() => setActiveTab("profile")}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/80 rounded-xl transition-all cursor-pointer text-xs font-mono text-slate-300"
              >
                <span className="text-indigo-400 font-bold">{session.studentId || "ADM-999"}</span>
              </button>
            </div>
          </header>

          <main className="flex-1 p-6 md:p-8 overflow-y-auto">
            
            {/* 1. GENERAL DASHBOARD SCREEN */}
            {activeTab === "dashboard" && (
              <div className="space-y-6">
                <div className="relative overflow-hidden rounded-2xl pro-card p-8 border border-white/[0.08] bg-gradient-to-br from-indigo-950/50 via-slate-900/70 to-slate-950/90 shadow-xl">
                  <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-indigo-600/10 via-purple-600/5 to-transparent blur-3xl pointer-events-none"></div>
                  <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/25 text-indigo-300 text-[10px] font-semibold tracking-wider uppercase mb-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
                      <span>Academic Cloud Workspace Active</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                      Welcome back, {session.fullName}!
                    </h1>
                    <p className="text-slate-400 text-xs sm:text-sm mt-2 max-w-xl leading-relaxed">
                      Your smart academic assistant is ready. Browse the library catalog, review timetable schedules, track course assignments, or consult the AI CampusBot.
                    </p>
                  </div>
                </div>

                {/* Dashboard Stats */}
                {session.role === "ADMIN" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="pro-card pro-card-hover rounded-2xl p-5 flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-semibold tracking-wider block mb-1">Campus Directory</span>
                        <span className="text-2xl font-black font-mono text-white tracking-tight">{users.length}</span>
                        <span className="text-slate-500 text-[11px] block mt-1 font-medium">Registered Accounts</span>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-xl shadow-inner">
                        👥
                      </div>
                    </div>

                    <div className="pro-card pro-card-hover rounded-2xl p-5 flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-semibold tracking-wider block mb-1">Library Catalog</span>
                        <span className="text-2xl font-black font-mono text-white tracking-tight">{books.length}</span>
                        <span className="text-slate-500 text-[11px] block mt-1 font-medium">Volumes Available</span>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-xl shadow-inner">
                        📚
                      </div>
                    </div>

                    <div className="pro-card pro-card-hover rounded-2xl p-5 flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-semibold tracking-wider block mb-1">Pending Complaints</span>
                        <span className="text-2xl font-black font-mono text-rose-400 tracking-tight">
                          {complaints.filter(c => c.status === "PENDING").length}
                        </span>
                        <span className="text-slate-500 text-[11px] block mt-1 font-medium">Require Attention</span>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center text-xl shadow-inner">
                        ⚠️
                      </div>
                    </div>

                    <div className="pro-card pro-card-hover rounded-2xl p-5 flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-semibold tracking-wider block mb-1">Assignments</span>
                        <span className="text-2xl font-black font-mono text-indigo-300 tracking-tight">{assignments.length}</span>
                        <span className="text-slate-500 text-[11px] block mt-1 font-medium">Active Course Tasks</span>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-xl shadow-inner">
                        📋
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="pro-card pro-card-hover rounded-2xl p-5 flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-semibold tracking-wider block mb-1">Library Catalog</span>
                        <span className="text-2xl font-black font-mono text-white tracking-tight">{books.length}</span>
                        <span className="text-slate-500 text-[11px] block mt-1 font-medium">Catalog Volumes</span>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-xl shadow-inner">
                        📚
                      </div>
                    </div>

                    <div className="pro-card pro-card-hover rounded-2xl p-5 flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-semibold tracking-wider block mb-1">Weekly Courses</span>
                        <span className="text-2xl font-black font-mono text-white tracking-tight">{timetable.length}</span>
                        <span className="text-slate-500 text-[11px] block mt-1 font-medium">Scheduled Slots</span>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-xl shadow-inner">
                        🗓️
                      </div>
                    </div>

                    <div className="pro-card pro-card-hover rounded-2xl p-5 flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-semibold tracking-wider block mb-1">Borrowed Books</span>
                        <span className="text-2xl font-black font-mono text-indigo-300 tracking-tight">{borrowedBookIds.length}</span>
                        <span className="text-slate-500 text-[11px] block mt-1 font-medium">Active Rentals</span>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-xl shadow-inner">
                        🔔
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Class Outline */}
                  <div className="pro-card rounded-2xl p-6 flex flex-col">
                    <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/[0.06]">
                      <div className="flex items-center gap-2">
                        <span className="text-base">🗓️</span>
                        <h4 className="font-bold text-white text-sm">Upcoming Classes</h4>
                      </div>
                      <button onClick={() => setActiveTab("timetable")} className="text-xs text-indigo-400 hover:text-indigo-300 font-medium hover:underline transition-all">
                        View Schedule →
                      </button>
                    </div>
                    <div className="space-y-3 flex-1">
                      {timetable.slice(0, 3).map((t, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-950/40 border border-white/[0.04] rounded-xl hover:border-indigo-500/30 transition-all">
                          <div>
                            <span className="text-xs font-bold text-white block">{t.subject}</span>
                            <span className="text-[11px] text-slate-400 block mt-0.5">{t.lecturer} · {t.room}</span>
                          </div>
                          <span className="text-[10px] font-mono font-semibold text-indigo-300 bg-indigo-500/10 border border-indigo-500/25 px-2.5 py-1 rounded-lg">
                            {t.day} {t.start}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Announcements */}
                  <div className="pro-card rounded-2xl p-6 flex flex-col">
                    <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/[0.06]">
                      <div className="flex items-center gap-2">
                        <span className="text-base">📢</span>
                        <h4 className="font-bold text-white text-sm">Academic Bulletin</h4>
                      </div>
                      <button onClick={() => setActiveTab("announcements")} className="text-xs text-indigo-400 hover:text-indigo-300 font-medium hover:underline transition-all">
                        All Alerts →
                      </button>
                    </div>
                    <div className="space-y-3 flex-1">
                      {announcements.slice(0, 2).map((a) => (
                        <div key={a.id} className="p-4 bg-slate-950/40 border-l-2 border-indigo-500 rounded-r-xl border-y border-r border-white/[0.04]">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-xs font-bold text-white block">{a.title}</span>
                            <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase border ${a.priority === "HIGH" ? "bg-rose-500/10 text-rose-300 border-rose-500/20" : "bg-amber-500/10 text-amber-300 border-amber-500/20"}`}>
                              {a.priority}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed mb-2 line-clamp-2">{a.content}</p>
                          <span className="text-[10px] text-slate-500 block font-mono">{a.author} · {a.timestamp}</span>
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
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
                  <div>
                    <h3 className="font-extrabold text-white text-xl tracking-tight">Classroom Schedule Manager</h3>
                    <p className="text-slate-400 text-xs mt-1">Shared weekly timetable configuration database</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 bg-slate-900/60 border border-white/[0.06] p-1.5 rounded-2xl">
                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map(d => (
                      <button
                        key={d}
                        onClick={() => {
                          setTimetableDay(d);
                          setEditingSlotIdx(null);
                        }}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          timetableDay === d
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                            : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Admin Add / Change Slot Controls */}
                {session?.role === "ADMIN" && (
                  <form onSubmit={handleAddTimetableSlot} className="pro-card rounded-2xl p-6 space-y-4 border border-white/[0.08]">
                    <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">
                          {editingSlotIdx !== null ? "✏️ Edit Class Period" : "📅 Schedule New Class Period"}
                        </span>
                        <span className="text-[9px] uppercase bg-indigo-500/10 border border-indigo-400/20 text-indigo-400 px-2 py-0.5 rounded font-semibold font-mono">
                          Admin Control
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">
                        Selected Day: <b className="text-indigo-400 font-semibold">{timetableDay}</b>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Subject Title</label>
                        <input
                          type="text"
                          value={newSlotSubject}
                          onChange={(e) => setNewSlotSubject(e.target.value)}
                          required
                          placeholder="e.g. Adv. Algorithms"
                          className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 text-slate-200 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Lecturer / Faculty</label>
                        <input
                          type="text"
                          value={newSlotLecturer}
                          onChange={(e) => setNewSlotLecturer(e.target.value)}
                          required
                          placeholder="e.g. Dr. Roberts"
                          className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 text-slate-200 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Room or Lab</label>
                        <input
                          type="text"
                          value={newSlotRoom}
                          onChange={(e) => setNewSlotRoom(e.target.value)}
                          required
                          placeholder="e.g. Lab 4B"
                          className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 text-slate-200 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Start Time</label>
                        <input
                          type="time"
                          value={newSlotStart}
                          onChange={(e) => setNewSlotStart(e.target.value)}
                          required
                          className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs outline-none focus:border-indigo-500 text-slate-200 [color-scheme:dark]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">End Time</label>
                        <input
                          type="time"
                          value={newSlotEnd}
                          onChange={(e) => setNewSlotEnd(e.target.value)}
                          required
                          className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs outline-none focus:border-indigo-500 text-slate-200 [color-scheme:dark]"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end pt-2">
                      {editingSlotIdx !== null && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSlotIdx(null);
                            setNewSlotSubject("");
                            setNewSlotLecturer("");
                            setNewSlotRoom("");
                          }}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-600/20"
                      >
                        {editingSlotIdx !== null ? "Save Timetable Changes" : "Add to Schedule"}
                      </button>
                    </div>
                  </form>
                )}

                <div className="pro-card rounded-2xl overflow-hidden border border-white/[0.08] shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-950/80 border-b border-white/[0.06] uppercase font-semibold tracking-wider text-slate-400 text-[10px]">
                          <th className="p-4">Period Times</th>
                          <th className="p-4">Subject</th>
                          <th className="p-4">Lecturer</th>
                          <th className="p-4">Room/Lab</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {timetable.filter(t => t.day === timetableDay).length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-10 text-center text-slate-500">
                              No active classes scheduled for {timetableDay}.
                            </td>
                          </tr>
                        ) : (
                          timetable.filter(t => t.day === timetableDay).map((t, idx) => {
                            const originalIdx = timetable.findIndex(orig => orig.day === t.day && orig.start === t.start && orig.subject === t.subject);
                            return (
                              <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                                <td className="p-4 font-mono font-bold text-indigo-300">{t.start} – {t.end}</td>
                                <td className="p-4 font-semibold text-white">{t.subject}</td>
                                <td className="p-4 text-slate-300">{t.lecturer}</td>
                                <td className="p-4">
                                  <span className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/25 px-2.5 py-1 rounded-md font-mono font-semibold text-[10px]">
                                    {t.room}
                                  </span>
                                </td>
                                <td className="p-4 text-right">
                                  <div className="inline-flex items-center gap-2">
                                    <button
                                      onClick={() => {
                                        const tomorrow = new Date();
                                        tomorrow.setDate(tomorrow.getDate() + 1);
                                        const tomorrowStr = tomorrow.toISOString().slice(0, 10);
                                        setQuickReminder(`Class: ${t.subject}`, "Lecture", `${tomorrowStr}T${t.start}`);
                                      }}
                                      className="text-xs text-indigo-400 hover:text-indigo-300 font-medium hover:underline cursor-pointer"
                                    >
                                      Set Alert
                                    </button>
                                    {session?.role === "ADMIN" && (
                                      <>
                                        <span className="text-slate-700">|</span>
                                        <button
                                          onClick={() => {
                                            setEditingSlotIdx(originalIdx);
                                            setNewSlotSubject(t.subject);
                                            setNewSlotLecturer(t.lecturer);
                                            setNewSlotRoom(t.room);
                                            setNewSlotStart(t.start);
                                            setNewSlotEnd(t.end);
                                          }}
                                          className="text-xs text-amber-400 hover:text-amber-300 font-medium hover:underline cursor-pointer"
                                        >
                                          Edit
                                        </button>
                                        <span className="text-slate-700">|</span>
                                        <button
                                          onClick={() => handleDeleteTimetableSlot(t.day, t.start, t.subject)}
                                          className="text-xs text-rose-400 hover:text-rose-300 font-medium hover:underline cursor-pointer"
                                        >
                                          Delete
                                        </button>
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
                </div>

                <div className="pro-card border border-indigo-500/20 bg-indigo-950/15 p-4 rounded-xl text-xs text-indigo-300 leading-relaxed flex items-center justify-between">
                  <span>💡 This weekly academic calendar represents shared curriculum guidelines. All changes sync in real-time.</span>
                  {session?.role === "ADMIN" && <span className="text-[10px] font-bold text-indigo-400 font-mono tracking-wider">ADMIN MODE ACTIVE</span>}
                </div>
              </div>
            )}

            {/* 3. ANNOUNCEMENTS SCREEN */}
            {activeTab === "announcements" && (
              <div className="space-y-6">
                {session.role === "ADMIN" && (
                  <form onSubmit={makeAnnouncement} className="pro-card rounded-2xl p-6 space-y-4 border border-white/[0.08] shadow-xl">
                    <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">⚡ Publish Campus Announcement</span>
                        <span className="text-[9px] uppercase tracking-wider font-semibold text-indigo-400 font-mono bg-indigo-500/10 border border-indigo-400/25 px-2 py-0.5 rounded">
                          Broadcast Master
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      <div className="md:col-span-8">
                        <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Announcement Title</label>
                        <input
                          type="text"
                          value={newAnnTitle}
                          onChange={(e) => setNewAnnTitle(e.target.value)}
                          required
                          placeholder="e.g. End Semester Exam Timetable Released"
                          className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 text-slate-200 transition-all"
                        />
                      </div>
                      <div className="md:col-span-4">
                        <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Priority Level</label>
                        <select
                          value={newAnnPriority}
                          onChange={(e) => setNewAnnPriority(e.target.value as any)}
                          className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs outline-none focus:border-indigo-500 text-slate-200 [color-scheme:dark]"
                        >
                          <option value="HIGH">High Priority (Urgent Notice)</option>
                          <option value="MEDIUM">Medium Priority (Standard)</option>
                          <option value="LOW">Low Priority (Informational)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Detailed Bulletin Content</label>
                      <textarea
                        value={newAnnContent}
                        onChange={(e) => setNewAnnContent(e.target.value)}
                        required
                        placeholder="Provide clear, detailed academic or campus instructions..."
                        rows={3}
                        className="w-full p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 text-slate-200 resize-none transition-all"
                      />
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-600/20"
                      >
                        Broadcast Announcement
                      </button>
                    </div>
                  </form>
                )}

                <div className="space-y-4">
                  {announcements.map(a => {
                    const savedRem = reminders.some(r => r.title.includes(a.title));
                    const isHigh = a.priority === "HIGH";
                    return (
                      <div key={a.id} className="pro-card pro-card-hover rounded-2xl p-6 flex items-start gap-4 border border-white/[0.08]">
                        <div className={`w-11 h-11 rounded-xl shrink-0 flex items-center justify-center font-bold text-lg border shadow-inner ${
                          isHigh
                            ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        }`}>
                          📢
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2.5 flex-wrap mb-2">
                            <h4 className="font-bold text-white text-sm">{a.title}</h4>
                            <span className={`text-[9px] font-mono px-2 py-0.5 rounded-md font-bold uppercase border ${
                              isHigh
                                ? "bg-rose-500/10 text-rose-300 border-rose-500/25"
                                : "bg-amber-500/10 text-amber-300 border-amber-500/25"
                            }`}>
                              {a.priority} PRIORITY
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed mb-4">{a.content}</p>
                          <div className="flex items-center justify-between flex-wrap gap-2 text-[11px] text-slate-500 font-mono border-t border-white/[0.04] pt-3">
                            <span>Author: {a.author} · {a.timestamp}</span>
                            <div className="flex items-center gap-2">
                              {session.role === "STUDENT" && (
                                <button
                                  onClick={() => {
                                    const tomorrow = new Date();
                                    tomorrow.setDate(tomorrow.getDate() + 1);
                                    const tomorrowStr = tomorrow.toISOString().slice(0, 10);
                                    setQuickReminder(`Alert: ${a.title}`, "Event", `${tomorrowStr}T09:00`);
                                  }}
                                  disabled={savedRem}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 border ${
                                    savedRem
                                      ? "bg-slate-900 text-slate-500 border-slate-800 cursor-not-allowed"
                                      : "bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border-indigo-500/25"
                                  }`}
                                >
                                  {savedRem ? "✓ Reminder Active" : "🔔 Set Reminder"}
                                </button>
                              )}
                              {session.role === "ADMIN" && (
                                <button
                                  onClick={() => removeAnnouncement(a.id)}
                                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 transition-all cursor-pointer flex items-center gap-1.5"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Delete Alert</span>
                                </button>
                              )}
                            </div>
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
                <div className="pro-card rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-3 border border-white/[0.08] shadow-xl">
                  <div className="relative flex-1 w-full text-xs">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      🔍
                    </span>
                    <input
                      type="text"
                      value={bookSearch}
                      onChange={(e) => setBookSearch(e.target.value)}
                      placeholder="Search catalog by title, author, category..."
                      className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 outline-none pl-10 pr-4 py-2.5 rounded-xl text-slate-200 placeholder:text-slate-500 transition-all text-xs"
                    />
                  </div>
                  <div className="flex gap-1.5 flex-wrap bg-slate-950/50 p-1 rounded-xl border border-white/[0.04]">
                    {["all", "Programming", "Software Engineering", "Computer Science"].map(cat => (
                      <button
                        key={cat}
                        onClick={() => setBookCatFilter(cat)}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          bookCatFilter === cat
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                            : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                        }`}
                      >
                        {cat === "all" ? "All Volumes" : cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* User-Specific Borrowed Books Dashboard */}
                {session.role === "STUDENT" && borrowedBookIds.length > 0 && (
                  <div className="pro-card rounded-2xl p-6 border border-indigo-500/20 bg-indigo-950/15 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">📚 My Borrowed Books</span>
                        <span className="text-[10px] uppercase font-mono tracking-wider bg-indigo-500/10 border border-indigo-400/25 px-2 py-0.5 rounded text-indigo-300 font-semibold">
                          {borrowedBookIds.length} Active Rentals
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {books.filter(b => borrowedBookIds.includes(b.id)).map(b => (
                        <div key={b.id} className="bg-slate-950/60 border border-white/[0.06] p-4.5 rounded-xl flex flex-col justify-between">
                          <div>
                            <span className="text-[9px] bg-indigo-500/10 border border-indigo-400/25 text-indigo-300 px-2 py-0.5 rounded font-semibold font-mono uppercase">
                              {b.category}
                            </span>
                            <h5 className="font-bold text-white text-xs mt-2 leading-snug">{b.title}</h5>
                            <span className="text-slate-400 text-[11px] block mt-1">Author: {b.author}</span>
                          </div>
                          <div className="border-t border-white/[0.04] pt-3 mt-4 flex items-center justify-between">
                            <span className="text-[11px] text-amber-400 font-mono font-medium">📅 14 Days Remaining</span>
                            <button
                              onClick={() => toggleBorrowBook(b.id)}
                              className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/25 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                            >
                              Return Book
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Admin Add Book Bar */}
                {session.role === "ADMIN" && (
                  <div className="pro-card rounded-2xl p-6 space-y-4 border border-white/[0.08] shadow-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">📚 Library Administration</span>
                        <span className="text-[9px] uppercase font-mono tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-400/25 px-2 py-0.5 rounded font-semibold">
                          Catalog Manager
                        </span>
                      </div>
                      <button
                        onClick={() => setShowAddBook(!showAddBook)}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/20"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{showAddBook ? "Close Form" : "Add New Book"}</span>
                      </button>
                    </div>

                    {showAddBook && (
                      <form onSubmit={addBook} className="border-t border-white/[0.06] pt-4 mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Book Title</label>
                          <input
                            type="text"
                            value={newBookTitle}
                            onChange={(e) => setNewBookTitle(e.target.value)}
                            required
                            placeholder="e.g. Operating Systems Principles"
                            className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 text-slate-200 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Author</label>
                          <input
                            type="text"
                            value={newBookAuthor}
                            onChange={(e) => setNewBookAuthor(e.target.value)}
                            required
                            placeholder="e.g. Silberschatz"
                            className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 text-slate-200 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Category</label>
                          <select
                            value={newBookCategory}
                            onChange={(e) => setNewBookCategory(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs outline-none focus:border-indigo-500 text-slate-200 [color-scheme:dark]"
                          >
                            <option>Computer Science</option>
                            <option>Programming</option>
                            <option>Software Engineering</option>
                            <option>Database Systems</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Custom ISBN (Optional)</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newBookIsbn}
                              onChange={(e) => setNewBookIsbn(e.target.value)}
                              placeholder="Auto if empty"
                              className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs outline-none focus:border-indigo-500 text-slate-200 transition-all"
                            />
                            <button
                              type="submit"
                              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer shrink-0 shadow-lg shadow-indigo-600/20"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      </form>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {books.filter(b => {
                    const matchQ = b.title.toLowerCase().includes(bookSearch.toLowerCase()) || b.author.toLowerCase().includes(bookSearch.toLowerCase());
                    const matchC = bookCatFilter === "all" || b.category === bookCatFilter;
                    return matchQ && matchC;
                  }).map(b => {
                    const isBorrowedByMe = borrowedBookIds.includes(b.id);
                    const isBookAvailable = b.available === 1;
                    return (
                      <div key={b.id} className="pro-card pro-card-hover rounded-2xl p-6 flex flex-col justify-between border border-white/[0.08] shadow-lg">
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-[9px] bg-indigo-500/10 border border-indigo-400/25 text-indigo-300 px-2.5 py-0.5 rounded-md font-semibold font-mono uppercase">
                              {b.category}
                            </span>
                            {session.role === "ADMIN" ? (
                              <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-semibold font-mono border ${
                                isBookAvailable
                                  ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/25"
                                  : "bg-rose-500/10 text-rose-300 border-rose-500/25"
                              }`}>
                                {isBookAvailable ? "In Stock" : "Unavailable"}
                              </span>
                            ) : (
                              <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-semibold font-mono border ${
                                isBorrowedByMe
                                  ? "bg-amber-500/10 text-amber-300 border-amber-500/25"
                                  : isBookAvailable
                                    ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/25"
                                    : "bg-rose-500/10 text-rose-300 border-rose-500/25"
                              }`}>
                                {isBorrowedByMe ? "Borrowed by You" : (isBookAvailable ? "Available" : "Unavailable")}
                              </span>
                            )}
                          </div>
                          
                          <h4 className="font-bold text-white text-sm mb-1.5 leading-snug">{b.title}</h4>
                          <span className="text-slate-400 text-xs block mb-1">Author: {b.author}</span>
                          <span className="text-slate-500 text-[10px] block font-mono">ISBN: {b.isbn}</span>
                        </div>

                        <div className="border-t border-white/[0.04] pt-4 mt-5 flex items-center justify-between gap-2">
                          <a href={b.link} className="text-indigo-400 text-xs font-semibold hover:text-indigo-300 hover:underline">
                            Reference Guide →
                          </a>
                          {session.role === "STUDENT" && (
                            isBorrowedByMe ? (
                              <button
                                onClick={() => toggleBorrowBook(b.id)}
                                className="px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/25"
                              >
                                Return Book
                              </button>
                            ) : isBookAvailable ? (
                              <button
                                onClick={() => toggleBorrowBook(b.id)}
                                className="px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20"
                              >
                                Rent / Borrow
                              </button>
                            ) : (
                              <button
                                disabled
                                className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-800/80 text-slate-500 border border-slate-700/40 cursor-not-allowed opacity-75"
                              >
                                Unavailable
                              </button>
                            )
                          )}
                          {session.role === "ADMIN" && (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => toggleBookAvailability(b.id, b.available === 1)}
                                className={`px-2.5 py-1.5 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer border ${
                                  b.available === 1
                                    ? "bg-amber-500/10 text-amber-300 border-amber-500/25 hover:bg-amber-500/20"
                                    : "bg-emerald-500/10 text-emerald-300 border-emerald-500/25 hover:bg-emerald-500/20"
                                }`}
                              >
                                {b.available === 1 ? "Mark Unavailable" : "Mark Available"}
                              </button>
                              <button
                                onClick={() => removeBook(b.id)}
                                title="Delete book"
                                className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/25 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
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
                  <form onSubmit={publishAssignment} className="pro-card rounded-2xl p-6 space-y-4 border border-white/[0.08] shadow-xl">
                    <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">📋 Publish Course Assignment</span>
                        <span className="text-[9px] uppercase tracking-wider font-semibold text-indigo-400 font-mono bg-indigo-500/10 border border-indigo-400/25 px-2 py-0.5 rounded">
                          Curriculum Action
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      <div className="md:col-span-6">
                        <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Assignment Title</label>
                        <input
                          type="text"
                          value={newAsgTitle}
                          onChange={(e) => setNewAsgTitle(e.target.value)}
                          required
                          placeholder="e.g. Binary Search Tree Implementation"
                          className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 text-slate-200 transition-all"
                        />
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Subject Course</label>
                        <select
                          value={newAsgSub}
                          onChange={(e) => setNewAsgSub(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs outline-none focus:border-indigo-500 text-slate-200 [color-scheme:dark]"
                        >
                          <option>OOP with Java</option>
                          <option>Database Systems</option>
                          <option>Algorithms Design</option>
                          <option>Computer Science</option>
                        </select>
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Submission Deadline</label>
                        <input
                          type="date"
                          value={newAsgDue}
                          onChange={(e) => setNewAsgDue(e.target.value)}
                          required
                          className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs outline-none focus:border-indigo-500 text-slate-200 [color-scheme:dark]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Maximum Marks</label>
                        <input
                          type="number"
                          value={newAsgMarks}
                          onChange={(e) => setNewAsgMarks(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 text-slate-200 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Priority Level</label>
                        <select
                          value={newAsgPriority}
                          onChange={(e) => setNewAsgPriority(e.target.value as any)}
                          className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs outline-none focus:border-indigo-500 text-slate-200 [color-scheme:dark]"
                        >
                          <option value="HIGH">High Priority</option>
                          <option value="MEDIUM">Medium Priority</option>
                          <option value="LOW">Low Priority</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Task Requirements & Guidelines</label>
                      <textarea
                        value={newAsgDesc}
                        onChange={(e) => setNewAsgDesc(e.target.value)}
                        placeholder="Provide detailed submission requirements, rubric, format..."
                        rows={2}
                        className="w-full p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 text-slate-200 resize-none transition-all"
                      />
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-600/20"
                      >
                        Publish Assignment
                      </button>
                    </div>
                  </form>
                )}

                <div className="space-y-4">
                  {assignments.map(a => {
                    const submission = a.submissions[session.userId];
                    const isSubmitted = !!submission;
                    const parsedSub = isSubmitted ? getSubmissionDetails(submission) : null;
                    const isHigh = a.priority === "HIGH";
                    return (
                      <div key={a.id} className="pro-card pro-card-hover rounded-2xl p-6 border border-white/[0.08] shadow-lg">
                        <div className="flex items-start justify-between flex-wrap gap-4 border-b border-white/[0.06] pb-4 mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-[9px] bg-indigo-500/10 border border-indigo-400/25 px-2.5 py-0.5 rounded-md font-mono font-semibold text-indigo-300">
                                {a.subject}
                              </span>
                              <span className={`text-[9px] font-mono px-2 py-0.5 rounded-md font-bold uppercase border ${
                                isHigh
                                  ? "bg-rose-500/10 text-rose-300 border-rose-500/25"
                                  : "bg-amber-500/10 text-amber-300 border-amber-500/25"
                              }`}>
                                {a.priority} Priority
                              </span>
                            </div>
                            <h4 className="font-bold text-white text-base tracking-tight mb-1.5">{a.title}</h4>
                            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">{a.description}</p>
                          </div>

                          <div className="text-right shrink-0 flex flex-col items-end gap-2">
                            <div>
                              <span className="text-xs font-semibold text-slate-400 block mb-1">Max Marks: {a.marks}</span>
                              <span className="text-xs font-mono font-semibold text-indigo-300 block bg-indigo-500/10 border border-indigo-500/25 px-3 py-1 rounded-xl">
                                Due: {a.due}
                              </span>
                            </div>
                            {session.role === "ADMIN" && (
                              <button
                                onClick={() => removeAssignment(a.id)}
                                className="px-3 py-1.5 text-xs font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete Task</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* ADMIN SUBMISSIONS VIEW */}
                        {session.role === "ADMIN" && (
                          <div className="bg-slate-950/60 p-5 rounded-2xl border border-white/[0.06] space-y-3">
                            <div className="font-bold text-slate-300 flex items-center justify-between border-b border-white/[0.06] pb-2 mb-3 text-xs">
                              <span>📋 Student Submissions ({Object.keys(a.submissions).length} Submitted)</span>
                            </div>
                            {Object.keys(a.submissions).length === 0 ? (
                              <span className="text-slate-500 text-xs block py-3 italic text-center">
                                No submissions recorded for this assignment yet.
                              </span>
                            ) : (
                              Object.entries(a.submissions).map(([uid, subObject]) => {
                                const details = getSubmissionDetails(subObject);
                                return (
                                  <div key={uid} className="pro-card rounded-xl p-4 space-y-3 border border-white/[0.06]">
                                    <div className="flex justify-between items-center bg-slate-950/70 p-2.5 rounded-lg text-xs font-mono">
                                      <div className="font-semibold text-indigo-300">
                                        👩‍🎓 {details.studentName} <span className="text-slate-500">({details.studentId})</span>
                                      </div>
                                      <div className="text-slate-500 text-[11px]">
                                        Submitted: {details.timestamp}
                                      </div>
                                    </div>
                                    <div className="py-1">
                                      <span className="block text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Submission Note:</span>
                                      <div className="bg-slate-950/80 rounded-xl p-3 text-xs font-mono text-slate-200 border-l-2 border-indigo-500 whitespace-pre-wrap">
                                        {details.note}
                                      </div>
                                    </div>
                                    {details.fileName && (
                                      <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-1">
                                        <span>📎 Attachment:</span>
                                        <b className="text-white">{details.fileName}</b>
                                        <button
                                          onClick={() => addToast(`Downloaded attachment "${details.fileName}"`, "info")}
                                          className="text-indigo-400 font-semibold hover:underline cursor-pointer"
                                        >
                                          Download
                                        </button>
                                      </div>
                                    )}

                                    {/* Instructor Grading Inputs */}
                                    <div className="border-t border-white/[0.06] pt-3 mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                                      <div>
                                        <input
                                          type="text"
                                          placeholder={`Grade /${a.marks}`}
                                          value={adminGrades[`${a.id}_${uid}`] || details.grade || ""}
                                          onChange={(e) => setAdminGrades({...adminGrades, [`${a.id}_${uid}`]: e.target.value})}
                                          className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 outline-none focus:border-indigo-500 transition-all font-mono"
                                        />
                                      </div>
                                      <div>
                                        <input
                                          type="text"
                                          placeholder="Evaluation Remarks..."
                                          value={adminFeedback[`${a.id}_${uid}`] || details.comment || ""}
                                          onChange={(e) => setAdminFeedback({...adminFeedback, [`${a.id}_${uid}`]: e.target.value})}
                                          className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 outline-none focus:border-indigo-500 transition-all"
                                        />
                                      </div>
                                      <button
                                        onClick={() => submitGradeForStudent(a.id, uid)}
                                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-4 rounded-xl text-xs cursor-pointer shadow-md shadow-indigo-600/20 transition-all"
                                      >
                                        Record Evaluation
                                      </button>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        )}

                        {/* STUDENT FORM */}
                        {session.role === "STUDENT" && !isSubmitted && (
                          <div className="pro-card p-5 rounded-2xl border border-white/[0.06] mt-4 space-y-3.5">
                            <div className="font-bold text-indigo-300 text-xs flex items-center gap-1.5">
                              <span>✍️ Open Homework Workspace</span>
                              <span className="text-[9px] bg-indigo-500/10 border border-indigo-400/25 text-indigo-300 px-2 py-0.5 rounded font-semibold">
                                Draft Submission
                              </span>
                            </div>
                            
                            <div>
                              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                                Solution Notes, Code Highlights, or Resource URLs
                              </label>
                              <textarea
                                rows={3}
                                placeholder="Describe your solution architecture, algorithmic complexity, or paste references..."
                                value={submissionNotes[a.id] || ""}
                                onChange={(e) => setSubmissionNotes({...submissionNotes, [a.id]: e.target.value})}
                                className="w-full p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs outline-none focus:border-indigo-500 text-slate-200 resize-none font-mono transition-all"
                              />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
                              <div
                                onClick={() => setSubmissionFiles({...submissionFiles, [a.id]: `${session.username}_${a.id}.zip`})}
                                className="border border-dashed border-slate-800 hover:border-indigo-500 rounded-xl p-3.5 text-center cursor-pointer bg-slate-950/40 text-xs text-slate-400 transition-all"
                              >
                                {submissionFiles[a.id] ? `📎 Mounted: ${submissionFiles[a.id]}` : "📂 Add Workspace Archive (.zip)"}
                              </div>
                              <button
                                onClick={() => submitAssignmentRich(a.id)}
                                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
                              >
                                Submit Task Solutions
                              </button>
                            </div>
                          </div>
                        )}

                        {/* STUDENT SUBMISSION COMPLETED VIEW */}
                        {session.role === "STUDENT" && isSubmitted && (
                          <div className="pro-card border border-emerald-500/25 bg-emerald-950/15 p-5 rounded-2xl mt-4 text-xs space-y-3">
                            <div className="flex justify-between items-center font-bold text-emerald-400">
                              <span className="flex items-center gap-1.5">✓ Homework Task Submitted</span>
                              <span className="font-mono text-[9px] bg-emerald-500/10 border border-emerald-400/25 px-2.5 py-0.5 rounded font-semibold">
                                Status: Completed
                              </span>
                            </div>
                            
                            <div className="text-slate-400 text-[11px] font-mono">
                              Submitted: {parsedSub?.timestamp}
                            </div>

                            <div className="bg-slate-950/70 border border-white/[0.04] rounded-xl p-3 text-xs font-mono text-slate-300">
                              {parsedSub?.note}
                            </div>

                            {parsedSub?.fileName && (
                              <div className="text-[11px] text-slate-400 font-mono">
                                Attachment: <b className="text-white">{parsedSub?.fileName}</b>
                              </div>
                            )}

                            {parsedSub?.grade ? (
                              <div className="pro-card border border-indigo-500/30 bg-indigo-950/30 p-4 rounded-xl mt-3 space-y-1.5">
                                <div className="font-bold text-white text-xs flex justify-between">
                                  <span>🎓 Evaluation Score:</span>
                                  <span className="font-mono text-indigo-300 font-black">{parsedSub.grade} / {a.marks} Marks</span>
                                </div>
                                <div className="text-slate-300 text-xs">
                                  Remarks: <span className="italic font-medium">"{parsedSub.comment}"</span>
                                </div>
                              </div>
                            ) : (
                              <div className="text-xs text-amber-300 font-mono bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl mt-2 flex items-center gap-2">
                                <span>⏳ Waiting for faculty evaluation and grading.</span>
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
                <form onSubmit={createReminder} className="pro-card rounded-2xl p-6 space-y-4 border border-white/[0.08] shadow-xl">
                  <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">⏰ Configure Personal Reminder Alarm</span>
                      <span className="text-[9px] uppercase tracking-wider font-semibold text-indigo-400 font-mono bg-indigo-500/10 border border-indigo-400/25 px-2.5 py-0.5 rounded">
                        Personal Desk
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Reminder Subject / Title</label>
                      <input
                        type="text"
                        value={newRemTitle}
                        onChange={(e) => setNewRemTitle(e.target.value)}
                        required
                        placeholder="e.g. Midterm Lab Exam Preparation"
                        className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 text-slate-200 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Category</label>
                      <select
                        value={newRemCat}
                        onChange={(e) => setNewRemCat(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs outline-none focus:border-indigo-500 text-slate-200 [color-scheme:dark]"
                      >
                        <option value="Exam">Exam Preparation</option>
                        <option value="Assignment">Assignment Deadline</option>
                        <option value="Lecture">Extra Curricular</option>
                        <option value="Personal">Personal Routine</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Target Date &amp; Time</label>
                      <input
                        type="datetime-local"
                        value={newRemTime}
                        onChange={(e) => setNewRemTime(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs outline-none focus:border-indigo-500 text-slate-200 [color-scheme:dark]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Checklist Notes / Instructions</label>
                    <input
                      type="text"
                      value={newRemNote}
                      onChange={(e) => setNewRemNote(e.target.value)}
                      placeholder="e.g. Bring scientific calculator and student ID card..."
                      className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 text-slate-200 transition-all"
                    />
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-600/20"
                    >
                      Register Reminder
                    </button>
                  </div>
                </form>

                <div className="pro-card rounded-2xl overflow-hidden border border-white/[0.08] shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-950/80 border-b border-white/[0.06] uppercase font-semibold tracking-wider text-slate-400 text-[10px]">
                          <th className="p-4">Alarm / Notes</th>
                          <th className="p-4">Category</th>
                          <th className="p-4">Target Date</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {reminders.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-10 text-center text-slate-500">
                              No personal reminder alarms configured.
                            </td>
                          </tr>
                        ) : (
                          reminders.map(r => (
                            <tr key={r.id} className={`hover:bg-white/[0.02] transition-colors ${r.fired ? "opacity-40" : ""}`}>
                              <td className="p-4 font-semibold text-white">
                                <span className={`block ${r.fired ? "line-through text-slate-500" : ""}`}>{r.title}</span>
                                <span className="text-[11px] text-slate-400 font-normal block mt-0.5">{r.note || "No custom notes."}</span>
                              </td>
                              <td className="p-4">
                                <span className={`px-2.5 py-1 rounded-md font-mono text-[10px] font-semibold border ${
                                  r.fired
                                    ? "bg-slate-900 text-slate-500 border-slate-800"
                                    : "bg-indigo-500/10 text-indigo-300 border-indigo-500/25"
                                }`}>
                                  {r.category}
                                </span>
                              </td>
                              <td className={`p-4 font-mono font-semibold ${r.fired ? "text-slate-500" : "text-indigo-300"}`}>
                                {r.datetime.replace("T", " ")}
                              </td>
                              <td className="p-4 text-right">
                                <div className="inline-flex gap-2 items-center">
                                  {r.fired && (
                                    <span className="text-[9px] bg-slate-900 border border-slate-800 text-slate-500 px-2 py-0.5 rounded font-semibold uppercase">
                                      Passed
                                    </span>
                                  )}
                                  <button
                                    onClick={() => deleteReminder(r.id)}
                                    className="text-xs text-rose-400 hover:text-rose-300 font-semibold hover:underline cursor-pointer"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 7. COMPLAINTS DESK VIEW */}
            {activeTab === "complaints" && (
              <div className="space-y-6">
                {session.role === "STUDENT" && (
                  <form onSubmit={fileComplaint} className="pro-card rounded-2xl p-6 space-y-4 border border-white/[0.08] shadow-xl">
                    <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">⚠️ Report Campus Grievance or Technical Issue</span>
                        <span className="text-[9px] uppercase tracking-wider font-semibold text-indigo-400 font-mono bg-indigo-500/10 border border-indigo-400/25 px-2.5 py-0.5 rounded">
                          Student Helpdesk
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-1">
                        <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Problem Category</label>
                        <select
                          value={newCompCat}
                          onChange={(e) => setNewCompCat(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs outline-none focus:border-indigo-500 text-slate-200 [color-scheme:dark]"
                        >
                          <option>IT Support (WiFi/Portal)</option>
                          <option>Hostel Curriculum Curfew</option>
                          <option>Library book reservations</option>
                          <option>Infrastructure (Plumbing/AC)</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Problem Description</label>
                        <input
                          type="text"
                          value={newCompDesc}
                          onChange={(e) => setNewCompDesc(e.target.value)}
                          required
                          placeholder="Describe the problem clearly (e.g. WiFi router drops connection on 3rd floor)..."
                          className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 text-slate-200 transition-all"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-600/20"
                      >
                        Submit Grievance Ticket
                      </button>
                    </div>
                  </form>
                )}

                {/* Complaint Filters & Status */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-1.5 bg-slate-900/60 border border-white/[0.06] p-1.5 rounded-2xl text-xs">
                    {(["ALL", "PENDING", "REVIEWING", "RESOLVED"] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => setComplaintFilter(f)}
                        className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                          complaintFilter === f
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                            : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                        }`}
                      >
                        {f === "ALL" ? "All Tickets" : f.charAt(0) + f.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    Showing {complaints.filter(c => (session.role === "ADMIN" || c.studentId === session.userId) && (complaintFilter === "ALL" || c.status === complaintFilter)).length} tickets
                  </span>
                </div>

                <div className="pro-card rounded-2xl overflow-hidden border border-white/[0.08] shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-950/80 border-b border-white/[0.06] uppercase font-semibold tracking-wider text-slate-400 text-[10px]">
                          <th className="p-4">Ticket Details</th>
                          <th className="p-4">Category</th>
                          <th className="p-4">Status / Remarks</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {complaints.filter(c => (session.role === "ADMIN" || c.studentId === session.userId) && (complaintFilter === "ALL" || c.status === complaintFilter)).length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-10 text-center text-slate-500">
                              No complaints found in this category.
                            </td>
                          </tr>
                        ) : (
                          complaints.filter(c => (session.role === "ADMIN" || c.studentId === session.userId) && (complaintFilter === "ALL" || c.status === complaintFilter)).map(c => {
                            const isPending = c.status === "PENDING";
                            const isResolved = c.status === "RESOLVED";
                            return (
                              <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                                <td className="p-4 font-sans max-w-[300px] whitespace-normal">
                                  <span className="block font-semibold text-white leading-relaxed">{c.description}</span>
                                  <span className="text-[11px] text-slate-400 font-mono mt-1 block">
                                    Student: {c.studentName} ({c.studentId}) · {c.timestamp}
                                  </span>
                                </td>
                                <td className="p-4">
                                  <span className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/25 px-2.5 py-1 rounded-md font-mono text-[10px] font-semibold">
                                    {c.category}
                                  </span>
                                </td>
                                <td className="p-4 whitespace-normal max-w-[280px]">
                                  <div className="flex flex-col gap-1.5">
                                    <span className={`inline-block w-fit text-[10px] font-mono px-2.5 py-0.5 rounded-full font-semibold border ${
                                      isResolved
                                        ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/25"
                                        : isPending
                                        ? "bg-rose-500/10 text-rose-300 border-rose-500/25"
                                        : "bg-amber-500/10 text-amber-300 border-amber-500/25"
                                    }`}>
                                      {c.status}
                                    </span>
                                    {c.remark && (
                                      <span className="text-[11px] text-slate-300 italic block">Remarks: "{c.remark}"</span>
                                    )}
                                  </div>
                                </td>
                                <td className="p-4 text-right">
                                  {session.role === "ADMIN" ? (
                                    <div className="inline-flex items-center gap-2">
                                      {c.status !== "RESOLVED" && (
                                        <button
                                          onClick={() => updateComplaintStatus(c.id, "RESOLVED", "Resolved by IT Support.")}
                                          className="text-xs text-emerald-400 hover:text-emerald-300 font-medium hover:underline cursor-pointer"
                                        >
                                          Mark Resolved
                                        </button>
                                      )}
                                      {c.status === "PENDING" && (
                                        <>
                                          <span className="text-slate-700">|</span>
                                          <button
                                            onClick={() => updateComplaintStatus(c.id, "REVIEWING", "Audit review initiated.")}
                                            className="text-xs text-amber-400 hover:text-amber-300 font-medium hover:underline cursor-pointer"
                                          >
                                            Under Audit
                                          </button>
                                        </>
                                      )}
                                      <span className="text-slate-700">|</span>
                                      <button
                                        onClick={() => removeComplaint(c.id)}
                                        title="Delete ticket"
                                        className="text-xs text-rose-400 hover:text-rose-300 font-medium hover:underline cursor-pointer"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => removeComplaint(c.id)}
                                      className="text-xs text-rose-400 hover:text-rose-300 font-medium hover:underline cursor-pointer"
                                    >
                                      Cancel Ticket
                                    </button>
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
              </div>
            )}

            {/* 8. AI CAMPUS BOT SCREEN */}
            {activeTab === "assistant" && (
              <div className="max-w-4xl mx-auto pro-card border border-white/[0.08] rounded-2xl shadow-2xl flex flex-col h-[600px] overflow-hidden">
                <div className="p-4 bg-slate-950/80 border-b border-white/[0.06] flex justify-between items-center text-slate-300 backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 flex items-center justify-center text-xl shadow-inner">
                      🤖
                    </div>
                    <div>
                      <span className="font-bold text-white text-sm block">CampusBot Smart Assistant</span>
                      <span className="text-[10px] text-emerald-400 font-mono font-semibold block mt-0.5">
                        ● Gemini AI Core Active
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setChatLog([{ role: "model", text: "👋 Chat refreshed. Ask me anything about campus schedules, courses, or facilities!", time: new Date().toTimeString().slice(0, 5) }])}
                    className="bg-slate-900/80 hover:bg-slate-800 text-slate-300 px-3 py-1.5 rounded-xl text-xs font-semibold border border-white/[0.06] transition-all cursor-pointer"
                  >
                    Clear Logs
                  </button>
                </div>

                <div className="flex-1 p-5 overflow-y-auto bg-slate-950/30 space-y-4">
                  {chatLog.map((m, idx) => (
                    <div key={idx} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] p-4 rounded-2xl shadow-md border ${
                        m.role === "user"
                          ? "bg-indigo-600 border-indigo-500/20 text-white rounded-br-none shadow-indigo-600/20"
                          : "pro-card border-white/[0.08] text-slate-200 rounded-bl-none"
                      }`}>
                        <div className="text-xs leading-relaxed font-sans whitespace-pre-wrap">{m.text}</div>
                        <span className={`block text-[9px] font-mono mt-2 text-right ${m.role === "user" ? "text-indigo-200" : "text-slate-500"}`}>
                          {m.time}
                        </span>
                      </div>
                    </div>
                  ))}

                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="pro-card border-white/[0.08] p-4 rounded-2xl flex items-center gap-3 text-xs text-slate-400 shadow-md">
                        <div className="flex gap-1.5 items-center">
                          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce-slow-1"></span>
                          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce-slow-2"></span>
                          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce-slow-3"></span>
                        </div>
                        <span className="font-mono text-[11px] text-slate-400">CampusBot is thinking...</span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <div className="p-4 border-t border-white/[0.06] bg-slate-950/50 space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => setChatInput("What is the WiFi password?")}
                      className="bg-slate-900/60 border border-white/[0.06] hover:border-indigo-500/40 rounded-xl px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 font-medium transition-all cursor-pointer"
                    >
                      SSID &amp; WiFi Connection
                    </button>
                    <button
                      onClick={() => setChatInput("When does the library close?")}
                      className="bg-slate-900/60 border border-white/[0.06] hover:border-indigo-500/40 rounded-xl px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 font-medium transition-all cursor-pointer"
                    >
                      Library Hours
                    </button>
                    <button
                      onClick={() => setChatInput("What are the hostel curfew hours?")}
                      className="bg-slate-900/60 border border-white/[0.06] hover:border-indigo-500/40 rounded-xl px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 font-medium transition-all cursor-pointer"
                    >
                      Hostel Night Curfew
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleChat()}
                      placeholder="Ask CampusBot about curfew, courses, Wi-Fi password..."
                      className="flex-1 bg-slate-950/80 border border-slate-800 outline-none px-4 py-3 rounded-full focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 text-xs text-slate-200 placeholder:text-slate-500 transition-all"
                    />
                    <button
                      onClick={handleChat}
                      className="p-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full flex items-center justify-center shrink-0 shadow-lg shadow-indigo-600/20 cursor-pointer transition-all"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 10. PROFILE VIEW */}
            {activeTab === "profile" && (
              <div className="space-y-6">
                {/* Header Banner */}
                <div className="pro-card rounded-2xl p-6 border border-white/[0.08] bg-gradient-to-br from-indigo-950/50 via-slate-900/70 to-slate-950/90 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[9px] uppercase font-bold tracking-wider bg-indigo-500/10 border border-indigo-400/25 text-indigo-300 px-2.5 rounded-full py-0.5">
                        {session.role === "STUDENT" ? "Student Academic Identity" : "Administrative Account"}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400 font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        Verified Campus Member
                      </span>
                    </div>
                    <h2 className="text-2xl font-extrabold text-white tracking-tight">
                      {session.role === "STUDENT" ? "Student Registration & Identity Profile" : "Campus Administrator Profile"}
                    </h2>
                    <p className="text-slate-400 text-xs mt-1">
                      Official institutional credentials, academic status, and campus service engagement records.
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={copyStudentCredentials}
                      className="px-3.5 py-2 bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-white/[0.08] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Copy Credentials</span>
                    </button>
                    <button
                      onClick={openEditProfile}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-indigo-600/25"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Profile</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* Left Column: Official Digital Student ID Card (5 cols) */}
                  <div className="lg:col-span-5 space-y-4">
                    <div className="relative rounded-3xl p-6 overflow-hidden border border-indigo-500/30 bg-gradient-to-br from-[#0e1426] via-[#111936] to-[#0a0f22] shadow-2xl">
                      {/* Holographic background glows */}
                      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
                      <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none"></div>

                      <div className="relative z-10 space-y-5">
                        {/* ID Card Top Header */}
                        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-sm shadow-md border border-white/20">
                              🏛️
                            </div>
                            <div>
                              <span className="font-black text-white text-xs tracking-wider block font-mono">SMARTCAMPUS ACADEMY</span>
                              <span className="text-[8px] uppercase font-mono tracking-widest text-indigo-400 font-bold block">Official Identification Card</span>
                            </div>
                          </div>
                          <div className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-[9px] font-mono font-bold flex items-center gap-1">
                            <BadgeCheck className="w-3 h-3 text-emerald-400" />
                            <span>ACTIVE</span>
                          </div>
                        </div>

                        {/* ID Card User Overview */}
                        <div className="flex items-center gap-4">
                          <div className="relative shrink-0">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center text-3xl font-black text-white shadow-xl border-2 border-indigo-400/40">
                              {session.fullName.charAt(0).toUpperCase()}
                            </div>
                            <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#0e1426] flex items-center justify-center text-[10px] text-white">
                              ✓
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-extrabold text-white text-lg leading-tight truncate">
                              {session.fullName}
                            </h3>
                            <span className="text-xs font-mono text-indigo-400 font-semibold block mt-0.5">
                              @{session.username}
                            </span>
                            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08] text-[10px] font-medium text-slate-300">
                              <GraduationCap className="w-3 h-3 text-indigo-400" />
                              <span>{session.role === "STUDENT" ? "Institutional Scholar" : "Campus Master Admin"}</span>
                            </div>
                          </div>
                        </div>

                        {/* ID Card Key Parameters */}
                        <div className="bg-slate-950/70 border border-white/[0.06] rounded-xl p-4 space-y-2.5 text-xs font-mono">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 text-[10px] uppercase tracking-wider font-sans font-semibold">Student / User ID</span>
                            <span className="text-indigo-300 font-bold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                              {session.studentId || "STU-2024-001"}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 text-[10px] uppercase tracking-wider font-sans font-semibold">Department</span>
                            <span className="text-slate-200 font-medium font-sans">
                              {session.department || "Computer Science"}
                            </span>
                          </div>
                          {session.role === "STUDENT" && (
                            <div className="flex justify-between items-center">
                              <span className="text-slate-400 text-[10px] uppercase tracking-wider font-sans font-semibold">Current Level</span>
                              <span className="text-slate-200 font-medium font-sans">
                                Semester {session.semester || "1"} ({Number(session.semester) <= 2 ? "1st Year" : Number(session.semester) <= 4 ? "2nd Year" : Number(session.semester) <= 6 ? "3rd Year" : "4th Year"})
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 text-[10px] uppercase tracking-wider font-sans font-semibold">Valid Academic Term</span>
                            <span className="text-slate-300 font-medium font-mono text-[11px]">
                              2024 – 2028 Academic Cycle
                            </span>
                          </div>
                        </div>

                        {/* Barcode / Authenticity Seal */}
                        <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-slate-500 font-mono">
                          <div className="space-y-0.5">
                            <div className="h-4 flex items-center gap-[2px] opacity-70">
                              {[2, 4, 1, 3, 2, 5, 2, 1, 4, 2, 3, 1, 5, 2, 3, 4, 1, 2, 5, 3, 2, 4, 1, 3, 2].map((w, idx) => (
                                <span key={idx} className="bg-slate-400 inline-block h-full" style={{ width: `${w}px` }}></span>
                              ))}
                            </div>
                            <span className="text-[8px] uppercase tracking-widest text-slate-500">SECURE DIGITAL CREDENTIAL</span>
                          </div>
                          <span className="font-semibold text-slate-400">{session.userId}</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick credential card helpers */}
                    <div className="pro-card rounded-2xl p-4 border border-white/[0.06] flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-slate-400">
                        <UserCheck className="w-4 h-4 text-emerald-400" />
                        <span>Account Status: <strong className="text-emerald-300 font-semibold">Verified &amp; Active</strong></span>
                      </div>
                      <button
                        onClick={copyStudentCredentials}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer hover:underline"
                      >
                        Copy Details
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Complete Registration Breakdown & Campus Activity Records (7 cols) */}
                  <div className="lg:col-span-7 space-y-6">
                    
                    {/* Official Registration Record */}
                    <div className="pro-card rounded-2xl p-6 border border-white/[0.08] shadow-xl space-y-5">
                      <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="w-4 h-4 text-indigo-400" />
                          <h4 className="font-bold text-white text-sm">Official Academic Registration Details</h4>
                        </div>
                        <span className="text-[10px] font-mono font-semibold bg-indigo-500/10 text-indigo-300 px-2.5 py-0.5 rounded border border-indigo-500/20">
                          {session.role}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div className="bg-slate-950/50 p-3.5 rounded-xl border border-white/[0.04]">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Full Legal Name</span>
                          <span className="font-bold text-white text-sm block">{session.fullName}</span>
                        </div>

                        <div className="bg-slate-950/50 p-3.5 rounded-xl border border-white/[0.04]">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Student Roll / ID</span>
                          <span className="font-mono font-bold text-indigo-300 text-sm block">{session.studentId || "STU-2024-001"}</span>
                        </div>

                        <div className="bg-slate-950/50 p-3.5 rounded-xl border border-white/[0.04]">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-500" />
                            <span>Institutional Email</span>
                          </span>
                          <span className="font-medium text-slate-200 block truncate">{session.email}</span>
                        </div>

                        <div className="bg-slate-950/50 p-3.5 rounded-xl border border-white/[0.04]">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-500" />
                            <span>Contact Phone</span>
                          </span>
                          <span className="font-mono font-medium text-slate-200 block">
                            {session.phone || "+91 98765 43210"}
                          </span>
                        </div>

                        <div className="bg-slate-950/50 p-3.5 rounded-xl border border-white/[0.04]">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Academic Department</span>
                          <span className="font-semibold text-white block">{session.department || "Computer Science"}</span>
                        </div>

                        {session.role === "STUDENT" ? (
                          <div className="bg-slate-950/50 p-3.5 rounded-xl border border-white/[0.04]">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Academic Semester Progress</span>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="font-bold text-white">Semester {session.semester || "1"} of 8</span>
                              <span className="text-[10px] font-mono text-indigo-400">{Math.round(((Number(session.semester) || 1) / 8) * 100)}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, Math.max(12.5, ((Number(session.semester) || 1) / 8) * 100))}%` }}
                              ></div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-slate-950/50 p-3.5 rounded-xl border border-white/[0.04]">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Administrative Privileges</span>
                            <span className="font-bold text-emerald-400 block">Full Master Control</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Campus Service Engagement Record */}
                    <div className="pro-card rounded-2xl p-6 border border-white/[0.08] shadow-xl space-y-4">
                      <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-indigo-400" />
                          <h4 className="font-bold text-white text-sm">Student Campus Activity &amp; Services</h4>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">Live Synchronization</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <button
                          onClick={() => setActiveTab("library")}
                          className="bg-slate-950/60 hover:bg-slate-900/80 border border-white/[0.04] hover:border-indigo-500/30 p-3.5 rounded-xl text-left transition-all cursor-pointer group"
                        >
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Books Loaned</span>
                          <span className="text-xl font-bold font-mono text-white group-hover:text-indigo-400 transition-colors">
                            {borrowedBookIds.length}
                          </span>
                          <span className="text-[9px] text-indigo-400 block mt-1">Smart Library →</span>
                        </button>

                        <button
                          onClick={() => setActiveTab("assignments")}
                          className="bg-slate-950/60 hover:bg-slate-900/80 border border-white/[0.04] hover:border-indigo-500/30 p-3.5 rounded-xl text-left transition-all cursor-pointer group"
                        >
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Assignments</span>
                          <span className="text-xl font-bold font-mono text-white group-hover:text-indigo-400 transition-colors">
                            {assignments.length}
                          </span>
                          <span className="text-[9px] text-indigo-400 block mt-1">Class Tasks →</span>
                        </button>

                        <button
                          onClick={() => setActiveTab("reminders")}
                          className="bg-slate-950/60 hover:bg-slate-900/80 border border-white/[0.04] hover:border-indigo-500/30 p-3.5 rounded-xl text-left transition-all cursor-pointer group"
                        >
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Reminders</span>
                          <span className="text-xl font-bold font-mono text-white group-hover:text-indigo-400 transition-colors">
                            {reminders.length}
                          </span>
                          <span className="text-[9px] text-indigo-400 block mt-1">My Alerts →</span>
                        </button>

                        <button
                          onClick={() => setActiveTab("complaints")}
                          className="bg-slate-950/60 hover:bg-slate-900/80 border border-white/[0.04] hover:border-indigo-500/30 p-3.5 rounded-xl text-left transition-all cursor-pointer group"
                        >
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Help Desk</span>
                          <span className="text-xl font-bold font-mono text-white group-hover:text-indigo-400 transition-colors">
                            {complaints.filter(c => session.role === "ADMIN" || c.studentId === session.userId).length}
                          </span>
                          <span className="text-[9px] text-indigo-400 block mt-1">Tickets Desk →</span>
                        </button>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Edit Profile Modal Dialog */}
                {showEditProfile && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
                    <div className="bg-[#0b0f1d] border border-white/[0.1] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
                      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                        <div className="flex items-center gap-2">
                          <Edit3 className="w-4 h-4 text-indigo-400" />
                          <h4 className="font-bold text-white text-base">Update Registration Credentials</h4>
                        </div>
                        <button
                          onClick={() => setShowEditProfile(false)}
                          className="text-slate-400 hover:text-white text-sm font-bold cursor-pointer transition-colors"
                        >
                          ✕
                        </button>
                      </div>

                      <form onSubmit={handleSaveProfile} className="space-y-3.5">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Full Legal Name</label>
                          <input
                            type="text"
                            value={profFullName}
                            onChange={(e) => setProfFullName(e.target.value)}
                            required
                            className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs outline-none focus:border-indigo-500 text-slate-200 transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
                          <input
                            type="email"
                            value={profEmail}
                            onChange={(e) => setProfEmail(e.target.value)}
                            required
                            className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs outline-none focus:border-indigo-500 text-slate-200 transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Contact Phone</label>
                          <input
                            type="tel"
                            value={profPhone}
                            onChange={(e) => setProfPhone(e.target.value)}
                            placeholder="e.g. +91 98765 43210"
                            className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs outline-none focus:border-indigo-500 text-slate-200 transition-all"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Department</label>
                            <select
                              value={profDept}
                              onChange={(e) => setProfDept(e.target.value)}
                              className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs outline-none focus:border-indigo-500 text-slate-200 [color-scheme:dark]"
                            >
                              <option>Computer Science</option>
                              <option>Information Technology</option>
                              <option>Electrical Engineering</option>
                              <option>Mechanical Engineering</option>
                              <option>Civil Engineering</option>
                              <option>Business Administration</option>
                              <option>Data Science & AI</option>
                            </select>
                          </div>

                          {session.role === "STUDENT" && (
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Current Semester</label>
                              <select
                                value={profSem}
                                onChange={(e) => setProfSem(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs outline-none focus:border-indigo-500 text-slate-200 [color-scheme:dark]"
                              >
                                {[
                                  { s: "1", y: "1st Year" },
                                  { s: "2", y: "1st Year" },
                                  { s: "3", y: "2nd Year" },
                                  { s: "4", y: "2nd Year" },
                                  { s: "5", y: "3rd Year" },
                                  { s: "6", y: "3rd Year" },
                                  { s: "7", y: "4th Year" },
                                  { s: "8", y: "4th Year" }
                                ].map(({ s, y }) => (
                                  <option key={s} value={s}>Semester {s} ({y})</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-end gap-2.5 pt-3 border-t border-white/[0.06]">
                          <button
                            type="button"
                            onClick={() => setShowEditProfile(false)}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-600/20"
                          >
                            Save Credentials
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}

          </main>

          <footer className="py-5 border-t border-white/[0.04] text-center text-slate-500 text-xs bg-slate-950/40 select-none">
            <p>SmartCampus Assistant Portal System · Designed with <Heart className="w-3.5 h-3.5 inline text-rose-500 fill-rose-500" /> for Academic Excellence</p>
          </footer>

        </section>

      </div>

      {/* Global Toast Stack */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto pro-card border border-white/[0.1] text-white rounded-2xl shadow-2xl p-4 text-xs flex items-center gap-3 animate-slideIn">
            <span className={`w-2 h-2 rounded-full shrink-0 ${t.type === "error" ? "bg-rose-500 shadow-rose-500/50" : t.type === "info" ? "bg-amber-500 shadow-amber-500/50" : "bg-emerald-500 shadow-emerald-500/50"} shadow-lg`}></span>
            <span className="font-medium">{t.msg}</span>
          </div>
        ))}
      </div>

    </div>
  );
}