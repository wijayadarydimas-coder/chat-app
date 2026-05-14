import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '@/constants/icons';
import { Overlay, ModalBox, IconBtn, Spinner, FocusInput, Avatar } from '@/components/ui/Shared';
import { ImageCropperModal } from './ProfileModals';

async function uploadFile(file, chatId = 'profile') {
  const form = new FormData();
  form.append('file', file);
  form.append('chatId', chatId);
  const res  = await fetch('/api/chat/upload', { method: 'POST', body: form });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload gagal');
  return data.fileUrl;
}

export function GroupSettingsModal({ show, onClose, group, currentUser, users, socket, onUpdated, onDeleted }) {
  const [name, setName] = useState('');
  const [photo, setPhoto] = useState('');
  const [onlyAdmins, setOnlyAdmins] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tab, setTab] = useState('info');
  const [cropSrc, setCropSrc] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const photoRef = useRef(null);

  useEffect(() => { if (group && show) { setName(group.name || ''); setPhoto(group.photo || ''); setOnlyAdmins(group.onlyAdmins || false); setTab('info'); } }, [group, show]);

  if (!show || !group) return null;

  const adminIds = (group.admins || []).map(a => (typeof a === 'object' ? a._id : a)?.toString());
  const isAdmin = adminIds.includes(currentUser?._id?.toString());
  const members = group.members || [];

  const handlePhotoFile = (e) => { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = ev => { setCropSrc(ev.target.result); setShowCropper(true); }; reader.readAsDataURL(file); e.target.value = ''; };
  const handleGroupCrop = async (croppedFile) => { setShowCropper(false); setUploading(true); try { const url = await uploadFile(croppedFile, group._id); setPhoto(url); } catch (e) { alert(e.message); } finally { setUploading(false); } };
  const handleSave = async () => { setSaving(true); try { const res = await fetch(`/api/group/${group._id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, photo, onlyAdmins }) }); const data = await res.json(); if (!res.ok) throw new Error(data.error); socket?.emit('group-updated', { groupId: group._id, ...data.group }); onUpdated(data.group); onClose(); } catch (e) { alert(e.message); } finally { setSaving(false); } };
  const handleDelete = async () => { if (!confirm(`Hapus grup "${group.name}"?`)) return; try { const res = await fetch(`/api/group/${group._id}`, { method: 'DELETE' }); const data = await res.json(); if (!res.ok) throw new Error(data.error); socket?.emit('group-deleted', { groupId: group._id }); onDeleted(group._id); onClose(); } catch (e) { alert(e.message); } };
  const handleToggleAdmin = async (mid) => { const isNow = adminIds.includes(mid.toString()); try { const res = await fetch(`/api/group/${group._id}/role`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: mid, role: isNow ? 'member' : 'admin' }) }); const data = await res.json(); if (!res.ok) throw new Error(data.error); onUpdated(data.group); } catch (e) { alert(e.message); } };
  const handleKick = async (mid) => { if (!confirm('Keluarkan member ini?')) return; try { const res = await fetch(`/api/group/${group._id}/members`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: mid }) }); const data = await res.json(); if (!res.ok) throw new Error(data.error); onUpdated(data.group); } catch (e) { alert(e.message); } };

  const tabStyle = t => ({ flex: 1, padding: '9px 0', fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', background: 'transparent', fontFamily: 'inherit', color: tab === t ? 'var(--accent)' : 'var(--text-muted)', borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent', transition: 'all .15s' });

  return (
    <>
      <Overlay onClose={onClose}>
        <ModalBox maxWidth={380}>
          <div style={{ padding: '18px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Pengaturan Grup</span>
            <IconBtn onClick={onClose}><Icon.Close /></IconBtn>
          </div>
          <div style={{ display: 'flex', margin: '12px 0 0', borderBottom: '1px solid var(--border)', padding: '0 20px' }}>
            <button style={tabStyle('info')} onClick={() => setTab('info')}>Info</button>
            <button style={tabStyle('members')} onClick={() => setTab('members')}>Member ({members.length})</button>
          </div>
          <div style={{ padding: 20 }}>
            {tab === 'info' && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 18 }}>
                  <div style={{ position: 'relative', cursor: isAdmin ? 'pointer' : 'default' }} onClick={() => isAdmin && !uploading && photoRef.current?.click()}>
                    <div style={{ width: 80, height: 80, borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '2px solid var(--border-accent)', background: '#1e2130', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                      {photo ? <img src={photo} alt="group" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setPhoto('')} /> : <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent)' }}>{(name || 'G').charAt(0).toUpperCase()}</span>}
                      {isAdmin && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', opacity: 0, transition: 'opacity 0.2s', borderRadius: 'var(--radius-sm)' }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                          {uploading ? <Spinner /> : <Icon.Camera />}
                        </div>
                      )}
                    </div>
                  </div>
                  {isAdmin && <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>Klik untuk ganti foto</span>}
                  <input ref={photoRef} type="file" accept="image/*" onChange={handlePhotoFile} style={{ display: 'none' }} />
                </div>
                {isAdmin ? <FocusInput label="Nama Grup" value={name} onChange={e => setName(e.target.value)} /> : <div style={{ textAlign: 'center', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>{group.name}</div>}
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14, padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
                  📅 Dibuat {group.createdAt ? new Date(group.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                  {group.createdBy ? ` oleh ${typeof group.createdBy === 'object' ? group.createdBy.username : (users.find(u => u._id === group.createdBy)?.username || 'Unknown')}` : ''}
                </div>
                {isAdmin && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', marginBottom: 18, cursor: 'pointer' }} onClick={() => setOnlyAdmins(v => !v)}>
                    <div><div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Hanya admin yang bisa kirim</div><div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Mode pengumuman</div></div>
                    <div style={{ width: 44, height: 24, borderRadius: 12, position: 'relative', background: onlyAdmins ? 'var(--accent)' : '#3a3f50', transition: 'background .2s', flexShrink: 0 }}>
                      <div style={{ position: 'absolute', top: 3, left: onlyAdmins ? 22 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
                    </div>
                  </div>
                )}
                {isAdmin && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: '10px', background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-sm)', color: '#0a0c10', fontWeight: 700, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>{saving ? <Spinner /> : <><Icon.Check /> Simpan</>}</button>
                    <button onClick={handleDelete} style={{ padding: '10px 14px', background: 'transparent', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--danger)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', cursor: 'pointer' }}><Icon.Trash /></button>
                  </div>
                )}
              </>
            )}
            {tab === 'members' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {members.map(m => {
                  const mid = (typeof m === 'object' ? m._id : m)?.toString();
                  const mData = typeof m === 'object' ? m : users.find(u => u._id?.toString() === mid);
                  if (!mData) return null;
                  const isMAdmin = adminIds.includes(mid);
                  const isCreator = (typeof group.createdBy === 'object' ? group.createdBy._id : group.createdBy)?.toString() === mid;
                  return (
                    <div key={mid} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-elevated)' }}>
                      <Avatar user={mData} size={36} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>{mData.username}{isCreator && <span style={{ color: 'var(--accent)' }}><Icon.Crown /></span>}</div>
                        <div style={{ fontSize: 11, color: isMAdmin ? 'var(--accent)' : 'var(--text-muted)' }}>{isMAdmin ? 'Admin' : 'Member'}</div>
                      </div>
                      {isAdmin && mid !== currentUser?._id?.toString() && (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => handleToggleAdmin(mid)} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border-accent)', background: 'transparent', color: 'var(--accent)', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>{isMAdmin ? '− Admin' : '+ Admin'}</button>
                          {!isCreator && <button onClick={() => handleKick(mid)} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--danger)', background: 'transparent', color: 'var(--danger)', cursor: 'pointer', fontFamily: 'inherit' }}>Kick</button>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </ModalBox>
      </Overlay>
      <ImageCropperModal show={showCropper} imageSrc={cropSrc} onCancel={() => setShowCropper(false)} onCrop={handleGroupCrop} />
    </>
  );
}

export function CreateGroupModal({ show, onClose, users, currentUser, onCreated }) {
  const [name, setName] = useState('');
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const filtered = users.filter(u => u._id !== currentUser?._id && u.username?.toLowerCase().includes(search.toLowerCase()));
  const toggle = id => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const handleCreate = async () => {
    if (!name.trim() || selected.length === 0) return; setLoading(true);
    try { const res = await fetch('/api/group/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, members: [...selected, currentUser._id] }) }); const data = await res.json(); if (!res.ok) throw new Error(data.error); onCreated(data.group); setName(''); setSelected([]); setSearch(''); onClose(); } catch (e) { alert(e.message); } finally { setLoading(false); }
  };
  if (!show) return null;
  return (
    <Overlay onClose={onClose}>
      <ModalBox maxWidth={380}>
        <div style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Grup Baru</span>
            <IconBtn onClick={onClose}><Icon.Close /></IconBtn>
          </div>
          <FocusInput label="Nama Grup" value={name} onChange={e => setName(e.target.value)} placeholder="Nama grup..." />
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Pilih Member</label>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari user..." style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-elevated)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box', marginBottom: 8, fontFamily: 'inherit' }} />
          {selected.length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>{selected.map(id => { const u = users.find(x => x._id === id); return u ? <span key={id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px 3px 4px', background: 'var(--accent-muted)', border: '1px solid var(--border-accent)', borderRadius: 20, fontSize: 12, color: 'var(--accent)' }}><Avatar user={u} size={16} />{u.username}<span style={{ cursor: 'pointer', display: 'flex', marginLeft: 2 }} onClick={() => toggle(id)}><Icon.X /></span></span> : null; })}</div>}
          <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 16 }}>
            {filtered.map(u => (
              <div key={u._id} onClick={() => toggle(u._id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', background: selected.includes(u._id) ? 'var(--accent-muted)' : 'transparent', transition: 'background .12s' }} onMouseEnter={e => { if (!selected.includes(u._id)) e.currentTarget.style.background = 'var(--bg-elevated)'; }} onMouseLeave={e => { if (!selected.includes(u._id)) e.currentTarget.style.background = 'transparent'; }}>
                <Avatar user={u} size={30} />
                <div style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{u.username}</div>
                <div style={{ width: 18, height: 18, borderRadius: '50%', borderWidth: 2, borderStyle: 'solid', borderColor: selected.includes(u._id) ? 'var(--accent)' : 'var(--border)', background: selected.includes(u._id) ? 'var(--accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {selected.includes(u._id) && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6L5 9L10 3" stroke="#0a0c10" strokeWidth="2.5" strokeLinecap="round"/></svg>}
                </div>
              </div>
            ))}
          </div>
          <button onClick={handleCreate} disabled={!name.trim() || selected.length === 0 || loading} style={{ width: '100%', padding: '11px', background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-sm)', color: '#0a0c10', fontWeight: 700, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: (!name.trim() || !selected.length) ? 0.5 : 1 }}>
            {loading ? <Spinner /> : `Buat Grup (${selected.length} member)`}
          </button>
        </div>
      </ModalBox>
    </Overlay>
  );
}
