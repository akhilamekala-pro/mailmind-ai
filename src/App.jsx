
import {useMemo, useState } from "react";

const initialEmails = [
  {
    id: 1,
    from: "HR Department",
    email: "hr@company.com",
    subject: "Interview Invitation",
    message:
      "Dear Candidate, We are pleased to invite you for an interview. Please confirm your availability for tomorrow at 10 AM. Thank you.",
    date: "Today",
    folder: "Inbox",
    starred: true,
    read: false,
  },
  {
    id: 2,
    from: "Project Manager",
    email: "manager@company.com",
    subject: "Project Meeting",
    message:
      "Hello, We have scheduled a project meeting tomorrow. Please prepare your project progress report and share the latest updates.",
    date: "Today",
    folder: "Inbox",
    starred: false,
    read: false,
  },
  {
    id: 3,
    from: "Google",
    email: "no-reply@google.com",
    subject: "Security Alert",
    message:
      "A new sign-in was detected on your Google account. If this was you, no action is required.",
    date: "Yesterday",
    folder: "Inbox",
    starred: false,
    read: true,
  },
  {
    id: 4,
    from: "College",
    email: "college@example.com",
    subject: "Assessment Submission",
    message:
      "Students are requested to submit their project assessment before the deadline.",
    date: "Yesterday",
    folder: "Inbox",
    starred: true,
    read: true,
  },
];

export default function App() {
  const [emails, setEmails] = useState(initialEmails);
  const [activeFolder, setActiveFolder] = useState("Dashboard");
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [showCompose, setShowCompose] = useState(false);
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [summary, setSummary] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState("");
  const [notice, setNotice] = useState("");

  const inbox = emails.filter((e) => e.folder === "Inbox");
  const sent = emails.filter((e) => e.folder === "Sent");
  const starred = emails.filter((e) => e.starred && e.folder !== "Trash");
  const trash = emails.filter((e) => e.folder === "Trash");
  const unread = inbox.filter((e) => !e.read).length;

  const visibleEmails = useMemo(() => {
    let list = emails;

    if (activeFolder === "Inbox") {
      list = emails.filter((e) => e.folder === "Inbox");
    } else if (activeFolder === "Sent") {
      list = emails.filter((e) => e.folder === "Sent");
    } else if (activeFolder === "Starred") {
      list = emails.filter((e) => e.starred && e.folder !== "Trash");
    } else if (activeFolder === "Trash") {
      list = emails.filter((e) => e.folder === "Trash");
    } else if (activeFolder === "Dashboard") {
      list = emails.filter((e) => e.folder === "Inbox");
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.from.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q) ||
          e.subject.toLowerCase().includes(q) ||
          e.message.toLowerCase().includes(q)
      );
    }

    return list;
  }, [emails, activeFolder, search]);

  function openEmail(email) {
    setSelected(email);
    setSummary("");
    setReply("");

    setEmails((prev) =>
      prev.map((e) =>
        e.id === email.id ? { ...e, read: true } : e
      )
    );
  }

  function toggleStar(id) {
    setEmails((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, starred: !e.starred } : e
      )
    );

    if (selected?.id === id) {
      setSelected((prev) => ({ ...prev, starred: !prev.starred }));
    }
  }

  function deleteEmail(id) {
    setEmails((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, folder: "Trash" } : e
      )
    );
    setSelected(null);
    setNotice("Email moved to Trash");
  }

  function restoreEmail(id) {
    setEmails((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, folder: "Inbox" } : e
      )
    );
    setSelected(null);
    setNotice("Email restored to Inbox");
  }

  function permanentlyDelete(id) {
    setEmails((prev) => prev.filter((e) => e.id !== id));
    setSelected(null);
    setNotice("Email permanently deleted");
  }

  function sendEmail(event) {
    event.preventDefault();

    if (!to.trim() || !subject.trim() || !message.trim()) {
      setNotice("Please fill in all email fields");
      return;
    }

    const newEmail = {
      id: Date.now(),
      from: "You",
      email: to,
      subject,
      message,
      date: "Just now",
      folder: "Sent",
      starred: false,
      read: true,
    };

    setEmails((prev) => [newEmail, ...prev]);
    setShowCompose(false);
    setTo("");
    setSubject("");
    setMessage("");
    setNotice("Demo email added to Sent folder");
    setActiveFolder("Sent");
    setSelected(null);
  }

  async function callAI(task) {
    if (!selected) return;

    setLoading(task);
    setNotice("");
    if (task === "summary") setSummary("Generating AI summary...");
    if (task === "reply") setReply("Generating AI reply...");

    try {
      const response = await fetch("http://localhost:5000/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          task,
          emailText:
            "From: " + selected.from +
            "\nSubject: " + selected.subject +
            "\n\n" + selected.message,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "AI request failed");
      }

      if (task === "summary") setSummary(data.result);
      if (task === "reply") setReply(data.result);
    } catch (error) {
      const errorText =
        error.message || "Could not connect to AI backend";

      if (task === "summary") setSummary("Error: " + errorText);
      if (task === "reply") setReply("Error: " + errorText);
    } finally {
      setLoading("");
    }
  }

  function useReply() {
    if (!reply || reply.startsWith("Generating") || reply.startsWith("Error:")) {
      return;
    }

    setTo(selected?.email || "");
    setSubject(
      selected?.subject?.startsWith("Re:")
        ? selected.subject
        : "Re: " + (selected?.subject || "")
    );
    setMessage(reply);
    setShowCompose(true);
  }

  const navItems = [
    { name: "Dashboard", icon: "▦" },
    { name: "Inbox", icon: "✉", count: unread },
    { name: "Sent", icon: "➤" },
    { name: "Starred", icon: "★" },
    { name: "Trash", icon: "▤" },
  ];

  return (
    <div className="app">
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; font-family: Arial, sans-serif; background: #f4f6fb; color: #20243a; }
        button, input, textarea { font: inherit; }
        button { cursor: pointer; }
        .app { min-height: 100vh; }
        .topbar { height: 68px; background: white; display: flex; align-items: center; justify-content: space-between; padding: 0 28px; border-bottom: 1px solid #e8eaf1; }
        .brand { font-size: 23px; font-weight: 800; color: #5146d8; }
        .top-right { color: #68708a; font-size: 14px; }
        .layout { display: flex; min-height: calc(100vh - 68px); }
        .sidebar { width: 230px; background: white; padding: 24px 15px; border-right: 1px solid #e8eaf1; flex-shrink: 0; }
        .compose { width: 100%; border: 0; border-radius: 10px; background: #5146d8; color: white; padding: 14px; font-weight: 700; margin-bottom: 25px; }
        .nav { display: flex; gap: 12px; align-items: center; width: 100%; border: 0; background: transparent; padding: 13px 12px; border-radius: 9px; color: #626981; text-align: left; margin: 4px 0; }
        .nav.active { background: #eeedff; color: #5146d8; font-weight: 700; }
        .nav-count { margin-left: auto; font-size: 12px; }
        .main { flex: 1; min-width: 0; padding: 28px; }
        .heading { font-size: 25px; margin: 0 0 8px; }
        .subheading { color: #82899c; margin: 0 0 24px; font-size: 14px; }
        .stats { display: grid; grid-template-columns: repeat(4, minmax(130px, 1fr)); gap: 15px; margin-bottom: 25px; }
        .stat { background: white; border: 1px solid #eceef4; border-radius: 13px; padding: 19px; }
        .stat-label { color: #82899c; font-size: 13px; }
        .stat-number { font-size: 27px; font-weight: 800; margin-top: 10px; }
        .panel { background: white; border: 1px solid #eceef4; border-radius: 13px; overflow: hidden; }
        .panel-head { padding: 18px 20px; border-bottom: 1px solid #eceef4; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .panel-title { font-weight: 700; }
        .search { width: min(320px, 100%); border: 1px solid #e0e3ed; border-radius: 8px; padding: 10px 12px; outline: none; }
        .email-row { display: flex; align-items: center; gap: 13px; padding: 16px 20px; border-bottom: 1px solid #f0f1f5; cursor: pointer; }
        .email-row:hover { background: #f8f8ff; }
        .email-row:last-child { border-bottom: 0; }
        .avatar { width: 39px; height: 39px; border-radius: 50%; background: #eeedff; color: #5146d8; display: grid; place-items: center; font-weight: 700; flex-shrink: 0; }
        .email-info { flex: 1; min-width: 0; }
        .email-from { font-weight: 700; font-size: 14px; }
        .email-subject { font-size: 14px; margin-top: 5px; }
        .email-preview { color: #9298a9; font-size: 12px; margin-top: 4px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
        .email-date { color: #9298a9; font-size: 12px; white-space: nowrap; }
        .star { border: 0; background: transparent; color: #c5c8d2; font-size: 20px; padding: 4px; }
        .star.on { color: #f3ae27; }
        .detail { margin-top: 18px; padding: 22px; }
        .detail-title { font-size: 21px; margin: 0 0 15px; }
        .detail-meta { color: #81889b; font-size: 13px; margin-bottom: 20px; }
        .detail-message { white-space: pre-wrap; line-height: 1.7; font-size: 14px; }
        .actions { display: flex; flex-wrap: wrap; gap: 9px; margin: 18px 0; }
        .btn { border: 1px solid #e0e3ed; background: white; color: #434a60; padding: 10px 13px; border-radius: 8px; font-size: 13px; }
        .btn.primary { background: #5146d8; border-color: #5146d8; color: white; }
        .btn.danger { color: #c0394b; }
        .ai-box { background: #f7f6ff; border: 1px solid #e8e5ff; border-radius: 10px; padding: 15px; margin-top: 14px; }
        .ai-box h4 { margin: 0 0 9px; color: #5146d8; }
        .ai-result { white-space: pre-wrap; font-size: 14px; line-height: 1.6; }
        .notice { background: #edfbf2; color: #217444; border: 1px solid #ccefd9; padding: 10px 14px; border-radius: 8px; margin-bottom: 16px; font-size: 13px; }
        .empty { padding: 35px; text-align: center; color: #9298a9; }
        .modal-backdrop { position: fixed; inset: 0; background: #16172b88; display: grid; place-items: center; padding: 15px; z-index: 5; }
        .modal { width: min(560px, 100%); background: white; border-radius: 14px; padding: 23px; }
        .modal h2 { margin: 0 0 18px; }
        .field { width: 100%; border: 1px solid #e0e3ed; border-radius: 8px; padding: 12px; margin: 7px 0 13px; outline: none; }
        .field-label { font-size: 13px; color: #68708a; }
        textarea.field { min-height: 145px; resize: vertical; }
        .modal-actions { display: flex; justify-content: flex-end; gap: 10px; }
        @media(max-width: 800px) {
          .layout { display: block; }
          .sidebar { width: 100%; display: flex; flex-wrap: wrap; gap: 5px; padding: 10px; border-right: 0; }
          .compose { width: auto; margin: 0; }
          .nav { width: auto; padding: 10px; }
          .main { padding: 16px; }
          .stats { grid-template-columns: repeat(2, 1fr); }
          .topbar { padding: 0 15px; }
        }
        @media(max-width: 480px) {
          .stats { grid-template-columns: 1fr 1fr; gap: 8px; }
          .stat { padding: 13px; }
          .email-row { padding: 13px 10px; gap: 8px; }
          .email-date { display: none; }
        }
      `}</style>

      <header className="topbar">
        <div className="brand">✉ MailMind AI</div>
        <div className="top-right">AI-Powered Email Management</div>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <button className="compose" onClick={() => setShowCompose(true)}>
            + Compose Email
          </button>

          {navItems.map((item) => (
            <button
              key={item.name}
              className={"nav " + (activeFolder === item.name ? "active" : "")}
              onClick={() => {
                setActiveFolder(item.name);
                setSelected(null);
                setSummary("");
                setReply("");
              }}
            >
              <span>{item.icon}</span>
              <span>{item.name}</span>
              {item.name === "Inbox" && (
                <span className="nav-count">{unread}</span>
              )}
              {item.name === "Sent" && (
                <span className="nav-count">{sent.length}</span>
              )}
              {item.name === "Starred" && (
                <span className="nav-count">{starred.length}</span>
              )}
              {item.name === "Trash" && (
                <span className="nav-count">{trash.length}</span>
              )}
            </button>
          ))}
        </aside>

        <main className="main">
          {notice && (
            <div className="notice">
              {notice}
              <button
                onClick={() => setNotice("")}
                style={{ float: "right", border: 0, background: "none" }}
              >
                ✕
              </button>
            </div>
          )}

          {activeFolder === "Dashboard" ? (
            <>
              <h1 className="heading">Dashboard</h1>
              <p className="subheading">
                Welcome to your MailMind email workspace.
              </p>

              <div className="stats">
                <div className="stat">
                  <div className="stat-label">Inbox Emails</div>
                  <div className="stat-number">{inbox.length}</div>
                </div>
                <div className="stat">
                  <div className="stat-label">Unread Emails</div>
                  <div className="stat-number">{unread}</div>
                </div>
                <div className="stat">
                  <div className="stat-label">Sent Emails</div>
                  <div className="stat-number">{sent.length}</div>
                </div>
                <div className="stat">
                  <div className="stat-label">Starred Emails</div>
                  <div className="stat-number">{starred.length}</div>
                </div>
              </div>
            </>
          ) : (
            <>
              <h1 className="heading">{activeFolder}</h1>
              <p className="subheading">
                Manage and organize your {activeFolder.toLowerCase()} emails.
              </p>
            </>
          )}

          <section className="panel">
            <div className="panel-head">
              <div className="panel-title">
                {activeFolder === "Dashboard" ? "Recent Emails" : activeFolder}
              </div>
              <input
                className="search"
                placeholder="Search emails..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {visibleEmails.length === 0 ? (
              <div className="empty">No emails found.</div>
            ) : (
              visibleEmails.map((email) => (
                <div
                  className="email-row"
                  key={email.id}
                  onClick={() => openEmail(email)}
                >
                  <div className="avatar">
                    {email.from.charAt(0).toUpperCase()}
                  </div>

                  <div className="email-info">
                    <div
                      className="email-from"
                      style={{ fontWeight: email.read ? 400 : 800 }}
                    >
                      {email.from}
                    </div>
                    <div className="email-subject">{email.subject}</div>
                    <div className="email-preview">{email.message}</div>
                  </div>

                  <button
                    className={"star " + (email.starred ? "on" : "")}
                    title="Star email"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleStar(email.id);
                    }}
                  >
                    ★
                  </button>

                  <div className="email-date">{email.date}</div>
                </div>
              ))
            )}
          </section>

          {selected && (
            <section className="panel detail">
              <h2 className="detail-title">{selected.subject}</h2>
              <div className="detail-meta">
                From: {selected.from} ({selected.email}) · {selected.date}
              </div>

              <div className="detail-message">{selected.message}</div>

              <div className="actions">
                {selected.folder !== "Trash" && (
                  <>
                    <button
                      className="btn"
                      onClick={() => toggleStar(selected.id)}
                    >
                      {selected.starred ? "★ Unstar" : "☆ Star"}
                    </button>
                    <button
                      className="btn danger"
                      onClick={() => deleteEmail(selected.id)}
                    >
                      Delete
                    </button>
                  </>
                )}

                {selected.folder === "Trash" && (
                  <>
                    <button
                      className="btn primary"
                      onClick={() => restoreEmail(selected.id)}
                    >
                      Restore
                    </button>
                    <button
                      className="btn danger"
                      onClick={() => permanentlyDelete(selected.id)}
                    >
                      Delete Permanently
                    </button>
                  </>
                )}

                {selected.folder !== "Trash" && (
                  <>
                    <button
                      className="btn primary"
                      disabled={!!loading}
                      onClick={() => callAI("summary")}
                    >
                      {loading === "summary" ? "Generating..." : "AI Summary"}
                    </button>
                    <button
                      className="btn primary"
                      disabled={!!loading}
                      onClick={() => callAI("reply")}
                    >
                      {loading === "reply" ? "Generating..." : "AI Reply"}
                    </button>
                  </>
                )}
              </div>

              {summary && (
                <div className="ai-box">
                  <h4>✨ AI Email Summary</h4>
                  <div className="ai-result">{summary}</div>
                </div>
              )}

              {reply && (
                <div className="ai-box">
                  <h4>✨ AI Suggested Reply</h4>
                  <div className="ai-result">{reply}</div>
                  {!reply.startsWith("Error:") &&
                    !reply.startsWith("Generating") && (
                      <button className="btn primary" onClick={useReply} style={{ marginTop: 12 }}>
                        Use This Reply
                      </button>
                    )}
                </div>
              )}
            </section>
          )}
        </main>
      </div>

      {showCompose && (
        <div className="modal-backdrop">
          <form className="modal" onSubmit={sendEmail}>
            <h2>Compose Email</h2>

            <label className="field-label">To</label>
            <input
              className="field"
              type="email"
              placeholder="recipient@example.com"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              required
            />

            <label className="field-label">Subject</label>
            <input
              className="field"
              placeholder="Enter email subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />

            <label className="field-label">Message</label>
            <textarea
              className="field"
              placeholder="Write your email..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />

            <div className="modal-actions">
              <button
                type="button"
                className="btn"
                onClick={() => setShowCompose(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn primary">
                Send Email
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
