'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  Heart,
  MessageCircle,
  MessageSquare,
  Send,
  Share2,
  Trash2,
  UserCircle2,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { getCVsByUser } from '@/lib/firestore';
import type { CommunityComment, CommunityMessage, CV } from '@/lib/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

type RawDoc = Omit<CommunityMessage, 'id' | 'createdAt'> & {
  createdAt?: { toDate?: () => Date } | Date;
};

function normalizeDate(value: RawDoc['createdAt']): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (typeof value === 'object' && typeof (value as { toDate?: () => Date }).toDate === 'function')
    return (value as { toDate: () => Date }).toDate();
  return new Date();
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

// ─── Comment Panel ────────────────────────────────────────────────────────────

function CommentPanel({
  message,
  firebaseUser,
  isAdmin,
  onClose,
}: {
  message: CommunityMessage;
  firebaseUser: { uid: string; displayName?: string | null; photoURL?: string | null } | null;
  isAdmin: boolean;
  onClose: () => void;
}) {
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'community_messages', message.id, 'comments'),
      orderBy('createdAt', 'asc')
    );
    const unsub = onSnapshot(q, snap => {
      setComments(
        snap.docs.map(d => {
          const data = d.data() as Omit<CommunityComment, 'id' | 'createdAt'> & {
            createdAt?: { toDate?: () => Date } | Date;
          };
          return {
            id: d.id,
            messageId: message.id,
            uid: data.uid,
            userName: data.userName,
            userPhotoURL: data.userPhotoURL,
            text: data.text,
            createdAt: normalizeDate(data.createdAt as RawDoc['createdAt']),
          } as CommunityComment;
        })
      );
    });
    return () => unsub();
  }, [message.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments.length]);

  const sendComment = async () => {
    if (!firebaseUser || !text.trim()) return;
    setSending(true);
    try {
      await addDoc(collection(db, 'community_messages', message.id, 'comments'), {
        uid: firebaseUser.uid,
        userName: firebaseUser.displayName || 'Người dùng CVFlow',
        userPhotoURL: firebaseUser.photoURL || '',
        text: text.trim(),
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, 'community_messages', message.id), {
        commentCount: increment(1),
      });
      setText('');
    } catch {
      toast.error('Không gửi được bình luận');
    } finally {
      setSending(false);
    }
  };

  const deleteComment = async (commentId: string, commentUid: string) => {
    if (firebaseUser?.uid !== commentUid && !isAdmin) return;
    try {
      await deleteDoc(doc(db, 'community_messages', message.id, 'comments', commentId));
      await updateDoc(doc(db, 'community_messages', message.id), {
        commentCount: increment(-1),
      });
      toast.success('Đã xóa bình luận');
    } catch {
      toast.error('Không xóa được bình luận');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '20px 20px 0 0',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 -8px 40px rgba(99,102,241,0.18)',
          animation: 'slideUp 0.25s ease',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <p style={{ fontWeight: 700, fontSize: '0.97rem' }}>
            Bình luận về tin của {message.userName}
          </p>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Comment list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {comments.length === 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.87rem', textAlign: 'center', marginTop: '24px' }}>
              Chưa có bình luận nào. Hãy là người đầu tiên!
            </p>
          )}
          {comments.map(c => {
            const mine = c.uid === firebaseUser?.uid;
            const canDelete = mine || isAdmin;
            return (
              <div key={c.id} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                {c.userPhotoURL ? (
                  <img
                    src={c.userPhotoURL}
                    alt={c.userName}
                    style={{ width: '28px', height: '28px', borderRadius: '999px', flexShrink: 0, marginTop: '2px' }}
                  />
                ) : (
                  <UserCircle2 size={28} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: '2px' }} />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>{c.userName}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{formatTime(c.createdAt)}</span>
                    {isAdmin && !mine && (
                      <span
                        style={{
                          fontSize: '0.65rem',
                          background: 'rgba(239,68,68,0.12)',
                          color: '#ef4444',
                          padding: '1px 6px',
                          borderRadius: '99px',
                          fontWeight: 700,
                        }}
                      >
                        ADMIN
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      background: mine
                        ? 'linear-gradient(135deg, rgba(99,102,241,0.14), rgba(236,72,153,0.10))'
                        : 'var(--bg-secondary, rgba(0,0,0,0.04))',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      padding: '8px 12px',
                      fontSize: '0.88rem',
                      color: 'var(--text-primary)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '8px',
                    }}
                  >
                    <p style={{ flex: 1, whiteSpace: 'pre-wrap' }}>{c.text}</p>
                    {canDelete && (
                      <button
                        onClick={() => deleteComment(c.id, c.uid)}
                        title="Xóa bình luận"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#ef4444',
                          opacity: 0.6,
                          flexShrink: 0,
                          padding: '0',
                          marginTop: '1px',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                        onMouseLeave={e => (e.currentTarget.style.opacity = '0.6')}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px' }}>
          {firebaseUser ? (
            <>
              <input
                className="input"
                placeholder="Viết bình luận..."
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendComment();
                  }
                }}
                style={{ flex: 1, height: '40px' }}
                disabled={sending}
              />
              <button
                className="btn btn-primary"
                disabled={!text.trim() || sending}
                onClick={sendComment}
                style={{ padding: '8px 14px', minWidth: '40px' }}
              >
                <Send size={15} />
              </button>
            </>
          ) : (
            <Link href="/auth" className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }}>
              Đăng nhập để bình luận
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CommunityPage() {
  const { firebaseUser, loading, isAdmin } = useAuth();
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [myCvs, setMyCvs] = useState<CV[]>([]);
  const [text, setText] = useState('');
  const [selectedCvId, setSelectedCvId] = useState('');
  const [sending, setSending] = useState(false);
  const [commentTarget, setCommentTarget] = useState<CommunityMessage | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Real-time messages
  useEffect(() => {
    const q = query(
      collection(db, 'community_messages'),
      orderBy('createdAt', 'desc'),
      limit(120)
    );
    const unsub = onSnapshot(q, snapshot => {
      const next = snapshot.docs
        .map(d => {
          const data = d.data() as RawDoc;
          return {
            id: d.id,
            uid: data.uid,
            userName: data.userName,
            userEmail: data.userEmail,
            userPhotoURL: data.userPhotoURL,
            text: data.text,
            sharedCV: data.sharedCV,
            likes: data.likes || [],
            commentCount: data.commentCount || 0,
            createdAt: normalizeDate(data.createdAt),
          } as CommunityMessage;
        })
        .reverse();
      setMessages(next);
    });
    return () => unsub();
  }, []);

  // My CV list
  useEffect(() => {
    if (!firebaseUser) {
      setMyCvs([]);
      setSelectedCvId('');
      return;
    }
    getCVsByUser(firebaseUser.uid)
      .then(data => setMyCvs(data.filter(cv => cv.isPublic)))
      .catch(() => setMyCvs([]));
  }, [firebaseUser]);

  // Auto-scroll
  useEffect(() => {
    if (!scrollContainerRef.current) return;
    scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
  }, [messages.length]);

  const selectedCv = useMemo(
    () => myCvs.find(cv => cv.cvId === selectedCvId),
    [myCvs, selectedCvId]
  );

  const canSend = Boolean(firebaseUser && text.trim().length > 0 && !sending);

  // Send message
  const onSend = async () => {
    if (!firebaseUser) {
      toast.error('Bạn cần đăng nhập để nhắn tin');
      return;
    }
    const trimmed = text.trim();
    if (!trimmed) return;
    setSending(true);
    try {
      await addDoc(collection(db, 'community_messages'), {
        uid: firebaseUser.uid,
        userName: firebaseUser.displayName || 'Người dùng CVFlow',
        userEmail: firebaseUser.email || '',
        userPhotoURL: firebaseUser.photoURL || '',
        text: trimmed,
        sharedCV: selectedCv
          ? {
              cvId: selectedCv.cvId,
              shareSlug: selectedCv.shareSlug,
              title: selectedCv.title,
              targetJob: selectedCv.targetJob || '',
              templateId: selectedCv.templateId,
            }
          : null,
        likes: [],
        commentCount: 0,
        createdAt: serverTimestamp(),
      });
      setText('');
      setSelectedCvId('');
    } catch {
      toast.error('Không gửi được tin nhắn, vui lòng thử lại');
    } finally {
      setSending(false);
    }
  };

  // Toggle like
  const toggleLike = async (msg: CommunityMessage) => {
    if (!firebaseUser) {
      toast.error('Đăng nhập để like');
      return;
    }
    const uid = firebaseUser.uid;
    const liked = (msg.likes || []).includes(uid);
    try {
      await updateDoc(doc(db, 'community_messages', msg.id), {
        likes: liked ? arrayRemove(uid) : arrayUnion(uid),
      });
    } catch {
      toast.error('Không thể like tin nhắn');
    }
  };

  // Delete message
  const deleteMessage = async (msg: CommunityMessage) => {
    const canDelete = firebaseUser?.uid === msg.uid || isAdmin;
    if (!canDelete) return;
    if (!confirm('Xóa tin nhắn này?')) return;
    try {
      await deleteDoc(doc(db, 'community_messages', msg.id));
      toast.success('Đã xóa tin nhắn');
    } catch {
      toast.error('Không xóa được tin nhắn');
    }
  };

  return (
    <>
      <Navbar />

      <main style={{ paddingTop: '92px', minHeight: '100vh' }}>
        <section className="container" style={{ paddingBottom: '56px' }}>
          {/* Header */}
          <div className="card" style={{ padding: '18px 20px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'var(--gradient-primary)',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <MessageCircle size={20} color="white" />
              </div>
              <div>
                <h1 style={{ fontSize: '1.3rem', fontWeight: 800, lineHeight: 1.3 }}>
                  Group Chat CVFlow
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
                  Thảo luận CV và chia sẻ CV công khai với cộng đồng.
                </p>
              </div>
            </div>
          </div>

          <div
            style={{ display: 'grid', gridTemplateColumns: '1.9fr 1fr', gap: '16px' }}
            className="community-grid"
          >
            {/* Chat area */}
            <div className="card" style={{ overflow: 'hidden' }}>
              <div
                ref={scrollContainerRef}
                style={{
                  height: '62vh',
                  minHeight: '420px',
                  overflowY: 'auto',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  background:
                    'radial-gradient(circle at top right, rgba(99,102,241,0.06), transparent 48%)',
                }}
              >
                {messages.length === 0 && (
                  <div
                    style={{
                      margin: 'auto',
                      textAlign: 'center',
                      color: 'var(--text-muted)',
                      maxWidth: '320px',
                    }}
                  >
                    <p style={{ fontWeight: 700, marginBottom: '6px' }}>Chưa có tin nhắn nào</p>
                    <p style={{ fontSize: '0.9rem' }}>
                      Hãy bắt đầu cuộc thảo luận đầu tiên về CV của bạn.
                    </p>
                  </div>
                )}

                {messages.map(message => {
                  const mine = message.uid === firebaseUser?.uid;
                  const canDelete = mine || isAdmin;
                  const likedByMe = (message.likes || []).includes(firebaseUser?.uid || '');
                  const likeCount = (message.likes || []).length;
                  const sharedLink = message.sharedCV
                    ? `/cv/${message.sharedCV.shareSlug}/view`
                    : '';

                  return (
                    <div
                      key={message.id}
                      style={{
                        alignSelf: mine ? 'flex-end' : 'flex-start',
                        maxWidth: '85%',
                        width: 'fit-content',
                      }}
                    >
                      {/* Author row */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '6px',
                          justifyContent: mine ? 'flex-end' : 'flex-start',
                        }}
                      >
                        {message.userPhotoURL ? (
                          <img
                            src={message.userPhotoURL}
                            alt={message.userName}
                            style={{ width: '24px', height: '24px', borderRadius: '999px' }}
                          />
                        ) : (
                          <UserCircle2 size={18} color="var(--text-muted)" />
                        )}
                        <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                          {message.userName}
                        </span>
                        {isAdmin && !mine && (
                          <span
                            style={{
                              fontSize: '0.62rem',
                              background: 'rgba(239,68,68,0.12)',
                              color: '#ef4444',
                              padding: '1px 5px',
                              borderRadius: '99px',
                              fontWeight: 700,
                            }}
                          >
                            ADMIN VIEW
                          </span>
                        )}
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {formatTime(message.createdAt)}
                        </span>
                      </div>

                      {/* Bubble */}
                      <div
                        style={{
                          padding: '10px 12px',
                          borderRadius: '14px',
                          border: '1px solid var(--border)',
                          background: mine
                            ? 'linear-gradient(135deg, rgba(99,102,241,0.16), rgba(236,72,153,0.12))'
                            : 'var(--bg-card)',
                          color: 'var(--text-primary)',
                          boxShadow: 'var(--shadow-sm)',
                          position: 'relative',
                        }}
                      >
                        <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.92rem' }}>{message.text}</p>

                        {/* Shared CV */}
                        {message.sharedCV && (
                          <div
                            style={{
                              marginTop: '8px',
                              borderTop: '1px dashed var(--border)',
                              paddingTop: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '8px',
                              flexWrap: 'wrap',
                            }}
                          >
                            <div>
                              <p style={{ fontWeight: 700, fontSize: '0.83rem' }}>
                                {message.sharedCV.title}
                              </p>
                              {message.sharedCV.targetJob && (
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                  {message.sharedCV.targetJob}
                                </p>
                              )}
                            </div>
                            <Link href={sharedLink} target="_blank" className="btn btn-outline btn-sm">
                              Xem CV
                            </Link>
                          </div>
                        )}

                        {/* Action bar */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            marginTop: '8px',
                            paddingTop: '6px',
                            borderTop: '1px solid var(--border)',
                            justifyContent: 'flex-end',
                          }}
                        >
                          {/* Like */}
                          <button
                            onClick={() => toggleLike(message)}
                            title={likedByMe ? 'Bỏ like' : 'Like'}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              color: likedByMe ? '#ef4444' : 'var(--text-muted)',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              padding: '2px 6px',
                              borderRadius: '8px',
                              transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = 'rgba(239,68,68,0.08)';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = 'none';
                            }}
                          >
                            <Heart
                              size={13}
                              fill={likedByMe ? '#ef4444' : 'none'}
                              color={likedByMe ? '#ef4444' : 'var(--text-muted)'}
                            />
                            {likeCount > 0 && likeCount}
                          </button>

                          {/* Comment */}
                          <button
                            onClick={() => setCommentTarget(message)}
                            title="Bình luận"
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              color: 'var(--text-muted)',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              padding: '2px 6px',
                              borderRadius: '8px',
                              transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = 'rgba(99,102,241,0.08)';
                              e.currentTarget.style.color = 'var(--primary)';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = 'none';
                              e.currentTarget.style.color = 'var(--text-muted)';
                            }}
                          >
                            <MessageSquare size={13} />
                            {(message.commentCount || 0) > 0 && message.commentCount}
                          </button>

                          {/* Delete */}
                          {canDelete && (
                            <button
                              onClick={() => deleteMessage(message)}
                              title={isAdmin && !mine ? 'Xóa (Admin)' : 'Xóa tin nhắn'}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                color: 'var(--text-muted)',
                                fontSize: '0.75rem',
                                padding: '2px 6px',
                                borderRadius: '8px',
                                transition: 'all 0.15s',
                              }}
                              onMouseEnter={e => {
                                e.currentTarget.style.background = 'rgba(239,68,68,0.08)';
                                e.currentTarget.style.color = '#ef4444';
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.background = 'none';
                                e.currentTarget.style.color = 'var(--text-muted)';
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Text input */}
              <div style={{ borderTop: '1px solid var(--border)', padding: '12px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <textarea
                    className="input"
                    rows={2}
                    placeholder={
                      loading
                        ? 'Đang kiểm tra tài khoản...'
                        : firebaseUser
                          ? 'Nhập tin nhắn thảo luận CV...'
                          : 'Đăng nhập để tham gia chat'
                    }
                    disabled={!firebaseUser || sending}
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        onSend();
                      }
                    }}
                    style={{ resize: 'vertical', minHeight: '64px' }}
                  />
                  <button
                    className="btn btn-primary"
                    disabled={!canSend}
                    onClick={onSend}
                    style={{ minWidth: '48px', padding: '10px 14px' }}
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <aside className="card" style={{ padding: '16px', height: 'fit-content' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '6px' }}>
                Chia sẻ CV vào chat
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.87rem', marginBottom: '12px' }}>
                Chọn một CV đã bật công khai để đính kèm vào tin nhắn.
              </p>

              {!firebaseUser ? (
                <Link href="/auth" className="btn btn-primary" style={{ width: '100%' }}>
                  Đăng nhập để chia sẻ
                </Link>
              ) : (
                <>
                  <select
                    className="input"
                    value={selectedCvId}
                    onChange={e => setSelectedCvId(e.target.value)}
                    style={{ marginBottom: '10px' }}
                  >
                    <option value="">Không đính kèm CV</option>
                    {myCvs.map(cv => (
                      <option key={cv.cvId} value={cv.cvId}>
                        {cv.title}
                      </option>
                    ))}
                  </select>

                  {selectedCv && (
                    <div
                      style={{
                        border: '1px solid var(--border)',
                        borderRadius: '12px',
                        padding: '10px',
                        background: 'rgba(99,102,241,0.06)',
                        marginBottom: '10px',
                      }}
                    >
                      <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{selectedCv.title}</p>
                      {selectedCv.targetJob && (
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {selectedCv.targetJob}
                        </p>
                      )}
                      <Link
                        href={`/cv/${selectedCv.shareSlug}/view`}
                        target="_blank"
                        className="btn btn-secondary btn-sm"
                        style={{ marginTop: '8px' }}
                      >
                        <Share2 size={14} />
                        Xem link CV
                      </Link>
                    </div>
                  )}

                  {firebaseUser && myCvs.length === 0 && (
                    <div
                      style={{
                        border: '1px dashed var(--border)',
                        borderRadius: '12px',
                        padding: '10px',
                        color: 'var(--text-secondary)',
                        fontSize: '0.84rem',
                      }}
                    >
                      Chưa có CV công khai để chia sẻ. Vào mục CV của tôi và bật chia sẻ trước.
                    </div>
                  )}
                </>
              )}

              {/* Admin tip */}
              {isAdmin && (
                <div
                  style={{
                    marginTop: '14px',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: 'rgba(239,68,68,0.06)',
                    border: '1px solid rgba(239,68,68,0.18)',
                    fontSize: '0.8rem',
                    color: '#ef4444',
                    fontWeight: 600,
                  }}
                >
                  🛡️ Admin: Bạn có thể xóa bất kỳ tin nhắn và bình luận nào.
                </div>
              )}
            </aside>
          </div>
        </section>
      </main>

      <Footer />

      {/* Comment Panel */}
      {commentTarget && (
        <CommentPanel
          message={commentTarget}
          firebaseUser={firebaseUser}
          isAdmin={isAdmin}
          onClose={() => setCommentTarget(null)}
        />
      )}

      <style jsx>{`
        @media (max-width: 1024px) {
          .community-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @keyframes slideUp {
          from { transform: translateY(40px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </>
  );
}
