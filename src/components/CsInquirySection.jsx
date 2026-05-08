import React, { useState, useEffect, useCallback } from 'react';
import { MessageSquare, ChevronDown, ChevronUp, Lock, Send, RefreshCw, CheckCircle, Clock } from 'lucide-react';
import apiClient from '../api/index';
import { useToastStore } from '../store/useToastStore';

const CATEGORIES = ['일반 문의', '서비스 오류', '결제/구독', '계정 문의', '건의사항', '신고/제재', '기타'];

const TEMPLATE = `[문의 기본 양식]

• 문의 유형: 
• 발생 일시: 
• 기기/환경: 

[문의 내용]
(구체적으로 작성해주세요)

[기대하는 처리 결과]
`;

const STATUS_CONFIG = {
  pending:  { label: '답변 대기', color: '#FF9B26', bg: '#FFF3E0', icon: <Clock size={11}/> },
  answered: { label: '답변 완료', color: '#00C48C', bg: '#E8F5E9', icon: <CheckCircle size={11}/> },
  closed:   { label: '처리 완료', color: '#8E8E93', bg: '#F5F5F5', icon: <CheckCircle size={11}/> },
};

export default function CsInquirySection({ user, isAdmin }) {
  const addToast = useToastStore(s => s.addToast);

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState(isAdmin ? 'list' : 'write'); // admin은 list 탭 기본

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [inquiries, setInquiries] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [replyInput, setReplyInput] = useState('');
  const [replyingId, setReplyingId] = useState(null);

  const [form, setForm] = useState({
    realName: user?.realName || '',
    nickname: user?.name || '',
    phone: user?.phone || '',
    category: '일반 문의',
    title: '',
    content: TEMPLATE,
  });

  // 사용자 정보 자동 반영
  useEffect(() => {
    if (user) setForm(f => ({
      ...f,
      realName: f.realName || user.realName || '',
      nickname: f.nickname || user.name || '',
      phone: f.phone || user.phone || '',
    }));
  }, [user]);

  const fetchInquiries = useCallback(async () => {
    if (!user?.email || user.id === 'GUEST') return;
    setLoading(true);
    try {
      const res = await apiClient.get('/api/cs/inquiries');
      setInquiries(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      if (err.response?.status !== 401) addToast('문의 목록 로드 실패', 'error');
    } finally { setLoading(false); }
  }, [user?.email, addToast]);

  // \u2705 REALTIME-FIX: list \ud0ed \uc5f4\ub9b0 \uc0c1\ud0dc\uc5d0\uc11c 60\ucd08 \ud3f4\ub9c1 \u2014 \uad00\ub9ac\uc790 \ub2f5\ubcc0 \uc2dc \uc790\ub3d9 \ubc18\uc601
  useEffect(() => {
    if (open && tab === 'list') {
      fetchInquiries();
      const id = setInterval(fetchInquiries, 60_000);
      return () => clearInterval(id);
    }
  }, [open, tab, fetchInquiries]);

  const handleSubmit = async () => {
    if (!user || user.id === 'GUEST') { addToast('로그인이 필요합니다.', 'error'); return; }
    if (!form.title.trim()) { addToast('제목을 입력해주세요.', 'error'); return; }
    if (!form.content.trim() || form.content.trim() === TEMPLATE.trim()) { addToast('문의 내용을 작성해주세요.', 'error'); return; }
    setSubmitting(true);
    try {
      const res = await apiClient.post('/api/cs/inquiry', form);
      addToast(res.data.message || '문의가 접수되었습니다.', 'success');
      setForm(f => ({ ...f, title: '', content: TEMPLATE }));
      setTab('list');
      fetchInquiries();
    } catch (err) {
      addToast(err.response?.data?.error || '문의 등록 실패', 'error');
    } finally { setSubmitting(false); }
  };

  const handleReply = async (id) => {
    if (!replyInput.trim()) { addToast('답변 내용을 입력해주세요.', 'error'); return; }
    try {
      await apiClient.put(`/api/cs/inquiry/${id}/reply`, { reply: replyInput });
      addToast('답변이 등록되었습니다.', 'success');
      setReplyInput(''); setReplyingId(null);
      fetchInquiries();
    } catch (err) {
      addToast(err.response?.data?.error || '답변 등록 실패', 'error');
    }
  };

  const inp = (field) => ({ value: form[field], onChange: e => setForm(f => ({ ...f, [field]: e.target.value })) });

  return (
    <div style={{ padding: '4px 16px 20px' }}>
      {/* 헤더 토글 */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{ background: 'linear-gradient(135deg, #0056D2 0%, #003fa3 100%)', borderRadius: open ? '18px 18px 0 0' : '18px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', transition: 'border-radius 0.25s' }}
      >
        <div style={{ width: '38px', height: '38px', background: 'rgba(255,255,255,0.15)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <MessageSquare size={20} color="#fff" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '13px', fontWeight: '900', color: '#fff' }}>1:1 고객센터 문의</div>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.65)', fontWeight: '600', marginTop: '1px' }}>
            🔒 비밀글 보호 · 빠른 답변 보장
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {inquiries.filter(i => i.status === 'answered').length > 0 && (
            <span style={{ background: '#00C48C', color: '#fff', fontSize: '9px', fontWeight: '900', padding: '2px 7px', borderRadius: '20px' }}>
              답변 {inquiries.filter(i => i.status === 'answered').length}건
            </span>
          )}
          {open ? <ChevronUp size={18} color="rgba(255,255,255,0.8)" /> : <ChevronDown size={18} color="rgba(255,255,255,0.8)" />}
        </div>
      </div>

      {/* 펼쳐지는 콘텐츠 */}
      {open && (
        <div style={{ background: '#fff', borderRadius: '0 0 18px 18px', border: '1px solid #E8EDF5', borderTop: 'none', overflow: 'hidden' }}>

          {/* 탭 — 마스터는 문의 작성 불필요 (AdminDashboard에서 전담 관리) */}
          <div style={{ display: 'flex', borderBottom: '1px solid #F0F2F7' }}>
            {(isAdmin ? ['list'] : ['write', 'list']).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '12px', background: 'none', border: 'none', fontSize: '12px', fontWeight: '900', color: tab === t ? '#0056D2' : '#AEAEB2', borderBottom: tab === t ? '2px solid #0056D2' : '2px solid transparent', cursor: 'pointer', transition: 'all 0.15s' }}>
                {t === 'write' ? '✏️ 문의 작성' : `📋 ${isAdmin ? '전체 문의' : '내 문의'}${inquiries.length > 0 ? ` (${inquiries.length})` : ''}`}
              </button>
            ))}
          </div>
          {isAdmin && (
            <div style={{ padding: '10px 14px', background: '#FFF8E1', borderBottom: '1px solid #FFE082', fontSize: '11px', color: '#F57F17', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
              ⚙️ 관리자 답변은 <strong>수익 대시보드 → 1:1 고객문의 관리</strong>에서 전담 처리합니다.
            </div>
          )}


          {/* 문의 작성 탭 */}
          {tab === 'write' && (
            <div style={{ padding: '16px' }}>
              {/* 비밀글 안내 */}
              <div style={{ background: '#F0F5FF', borderRadius: '12px', padding: '10px 14px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lock size={13} color="#0056D2" />
                <span style={{ fontSize: '11px', color: '#0056D2', fontWeight: '700' }}>이 문의는 작성자 본인과 관리자만 볼 수 있는 비밀글입니다.</span>
              </div>

              {/* 기본 정보 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <div>
                  <label style={labelStyle}>성함</label>
                  <input style={inputStyle} placeholder="홍길동" {...inp('realName')} />
                </div>
                <div>
                  <label style={labelStyle}>닉네임</label>
                  <input style={inputStyle} placeholder="앱 닉네임" {...inp('nickname')} />
                </div>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <label style={labelStyle}>연락처</label>
                <input style={inputStyle} placeholder="010-XXXX-XXXX" type="tel" {...inp('phone')} />
              </div>
              <div style={{ marginBottom: '8px' }}>
                <label style={labelStyle}>문의 유형</label>
                <select style={{ ...inputStyle, background: '#FAFAFA' }} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <label style={labelStyle}>제목 *</label>
                <input style={inputStyle} placeholder="문의 제목을 입력해주세요" {...inp('title')} maxLength={100} />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ ...labelStyle, display: 'flex', justifyContent: 'space-between' }}>
                  <span>문의 내용 *</span>
                  <span style={{ fontWeight: '600', color: '#AEAEB2' }}>{form.content.length}자</span>
                </label>
                <textarea
                  style={{ ...inputStyle, height: '180px', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
                  placeholder="기본 양식을 참고하여 작성해주세요"
                  {...inp('content')}
                />
              </div>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{ width: '100%', padding: '14px', background: submitting ? '#AEAEB2' : 'linear-gradient(135deg, #0056D2, #003fa3)', color: '#fff', border: 'none', borderRadius: '14px', fontSize: '14px', fontWeight: '900', cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' }}
              >
                <Send size={16} /> {submitting ? '제출 중...' : '문의 접수하기'}
              </button>
              <p style={{ fontSize: '10px', color: '#AEAEB2', textAlign: 'center', marginTop: '10px', fontWeight: '600' }}>
                ※ 영업일 기준 1~2일 내 답변 | 긴급 문의: 앱 내 알림 확인
              </p>
            </div>
          )}

          {/* 내 문의 목록 탭 */}
          {tab === 'list' && (
            <div style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', fontWeight: '900', color: '#1A1A2E' }}>
                  {isAdmin ? `전체 문의 (${inquiries.length}건)` : `내 문의 내역 (${inquiries.length}건)`}
                </span>
                <button onClick={fetchInquiries} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0056D2', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '800' }}>
                  <RefreshCw size={13} /> 새로고침
                </button>
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#AEAEB2', fontSize: '12px' }}>불러오는 중...</div>
              ) : inquiries.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#AEAEB2', fontSize: '12px', border: '1px dashed #E0E0E0', borderRadius: '12px' }}>
                  📭 등록된 문의가 없습니다.<br/>
                  <button onClick={() => setTab('write')} style={{ marginTop: '8px', background: 'none', border: 'none', color: '#0056D2', fontWeight: '800', cursor: 'pointer', fontSize: '12px' }}>첫 문의 작성하기 →</button>
                </div>
              ) : (
                inquiries.map(item => {
                  const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
                  const isExpanded = expandedId === item.id;
                  return (
                    <div key={item.id} style={{ border: `1px solid ${item.status === 'answered' ? '#C8F0E0' : '#F0F2F7'}`, borderRadius: '14px', marginBottom: '10px', overflow: 'hidden', transition: 'all 0.2s' }}>
                      {/* 항목 헤더 */}
                      <div onClick={() => setExpandedId(isExpanded ? null : item.id)} style={{ padding: '12px 14px', cursor: 'pointer', background: item.status === 'answered' ? '#F0FDF8' : '#FAFAFA', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '9px', background: '#E8F0FF', color: '#0056D2', padding: '2px 7px', borderRadius: '6px', fontWeight: '800' }}>{item.category}</span>
                            <span style={{ fontSize: '9px', background: cfg.bg, color: cfg.color, padding: '2px 7px', borderRadius: '6px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '3px' }}>{cfg.icon}{cfg.label}</span>
                            {isAdmin && <span style={{ fontSize: '9px', color: '#AEAEB2', fontWeight: '700' }}>{item.nickname || item.authorEmail}</span>}
                          </div>
                          <div style={{ fontSize: '13px', fontWeight: '900', color: '#1A1A2E' }}>{item.title}</div>
                          <div style={{ fontSize: '10px', color: '#AEAEB2', fontWeight: '600', marginTop: '3px' }}>
                            {new Date(item.createdAt).toLocaleDateString('ko-KR')} · {item.id}
                          </div>
                        </div>
                        {isExpanded ? <ChevronUp size={16} color="#AEAEB2" /> : <ChevronDown size={16} color="#AEAEB2" />}
                      </div>

                      {/* 펼쳐진 상세 */}
                      {isExpanded && (
                        <div style={{ padding: '14px', borderTop: '1px solid #F0F2F7' }}>
                          {/* 문의 내용 */}
                          <div style={{ background: '#F8F9FA', borderRadius: '10px', padding: '12px', marginBottom: '10px' }}>
                            <div style={{ fontSize: '10px', fontWeight: '800', color: '#0056D2', marginBottom: '6px' }}>📝 문의 내용</div>
                            <pre style={{ fontSize: '12px', color: '#444', fontFamily: 'inherit', whiteSpace: 'pre-wrap', margin: 0, lineHeight: 1.6 }}>{item.content}</pre>
                            {(item.realName || item.phone) && (
                              <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #E8EDF5', fontSize: '10px', color: '#8E8E93', fontWeight: '700' }}>
                                {item.realName && <span>성함: {item.realName} · </span>}
                                {item.phone && <span>연락처: {item.phone}</span>}
                              </div>
                            )}
                          </div>

                          {/* 답변 표시 */}
                          {item.reply && (
                            <div style={{ background: 'linear-gradient(135deg, #E8F5E9, #F1F8FF)', borderRadius: '10px', padding: '12px', marginBottom: '10px', border: '1px solid #C8F0E0' }}>
                              <div style={{ fontSize: '10px', fontWeight: '800', color: '#00C48C', marginBottom: '6px' }}>✅ 관리자 답변 · {new Date(item.repliedAt).toLocaleDateString('ko-KR')}</div>
                              <pre style={{ fontSize: '12px', color: '#1A1A2E', fontFamily: 'inherit', whiteSpace: 'pre-wrap', margin: 0, lineHeight: 1.6 }}>{item.reply}</pre>
                            </div>
                          )}

                          {/* 마스터 답변 입력 */}
                          {isAdmin && item.status !== 'answered' && (
                            <div>
                              {replyingId === item.id ? (
                                <div>
                                  <textarea
                                    value={replyInput}
                                    onChange={e => setReplyInput(e.target.value)}
                                    placeholder="답변 내용을 입력하세요..."
                                    style={{ width: '100%', minHeight: '100px', padding: '10px', borderRadius: '10px', border: '1px solid #D1D5DB', fontSize: '12px', fontFamily: 'inherit', lineHeight: 1.6, outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
                                  />
                                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                    <button onClick={() => handleReply(item.id)} style={{ flex: 1, padding: '10px', background: '#00C48C', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: '900', cursor: 'pointer' }}>답변 등록</button>
                                    <button onClick={() => { setReplyingId(null); setReplyInput(''); }} style={{ padding: '10px 14px', background: '#F5F5F5', border: 'none', borderRadius: '10px', fontSize: '12px', cursor: 'pointer' }}>취소</button>
                                  </div>
                                </div>
                              ) : (
                                <button onClick={() => setReplyingId(item.id)} style={{ width: '100%', padding: '10px', background: 'linear-gradient(135deg, #0056D2, #003fa3)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: '900', cursor: 'pointer' }}>
                                  💬 답변 작성하기
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const labelStyle = { fontSize: '10px', fontWeight: '800', color: '#6B7280', display: 'block', marginBottom: '4px', letterSpacing: '0.03em' };
const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #E5E7EB', fontSize: '13px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border 0.2s' };
