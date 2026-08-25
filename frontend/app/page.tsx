"use client";

import { FormEvent, useEffect, useState } from "react";

type Message = {
  id: number;
  text: string;
  createdAt: string;
};

type Health = { status: string; service: string; version: string };

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [backend, setBackend] = useState<Health | null>(null);
  const [text, setText] = useState("");
  const [status, setStatus] = useState("Loading messages…");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/messages/health")
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then(setBackend)
      .catch(() => setBackend(null));
    fetch("/api/messages")
      .then((response) => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then((data: Message[]) => {
        setMessages(data);
        setStatus("");
      })
      .catch(() => setStatus("Could not reach Spring Boot or Neon."));
  }, []);

  async function addMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setStatus("");

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!response.ok) throw new Error();

      const message: Message = await response.json();
      setMessages((current) => [message, ...current]);
      setText("");
      setStatus("Message saved in Neon.");
    } catch {
      setStatus("Message was not saved. Check the backend logs.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main>
      <section className="bench">
        <header>
          <p className="eyebrow">
            Vercel deployment demo · frontend v2 · {backend ? `${backend.version} online` : "backend offline"}
          </p>
          <h1>Send one message through the whole stack.</h1>
          <p className="intro">Reload after saving. If it stays, Next.js reached Spring Boot and Neon persisted it.</p>
        </header>

        <ol className="route" aria-label="Request route">
          <li>Next.js</li>
          <li>Spring Boot</li>
          <li>Neon</li>
        </ol>

        <form onSubmit={addMessage}>
          <label htmlFor="message">Message</label>
          <div className="controls">
            <input
              id="message"
              value={text}
              onChange={(event) => setText(event.target.value)}
              maxLength={200}
              placeholder="Hello from Vercel"
              required
            />
            <button disabled={saving}>{saving ? "Saving…" : "Save message"}</button>
          </div>
        </form>

        <p className="status" aria-live="polite">{status}</p>

        <div className="messages">
          <h2>Persisted messages</h2>
          {messages.length === 0 && !status ? (
            <p className="empty">No messages yet. Save the first one.</p>
          ) : (
            <ul>
              {messages.map((message) => (
                <li key={message.id}>
                  <span>{message.text}</span>
                  <time dateTime={message.createdAt}>{new Date(message.createdAt).toLocaleString()}</time>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
