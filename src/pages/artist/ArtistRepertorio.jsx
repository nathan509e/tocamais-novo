import React, { useState, useEffect } from 'react';
import {
  Music, Check, X, Search, FileText, Plus, Trash2
} from 'lucide-react';
import AppLayout from '../../components/shared/AppLayout';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../lib/AuthContext';
import { useTheme } from '../../lib/ThemeContext';

export default function ArtistRepertorio() {
  const { user, userProfile, refreshProfile } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Repertório state
  const [musicasRepertorio, setMusicasRepertorio] = useState([]);
  const [selectedMusicasIds, setSelectedMusicasIds] = useState([]);
  const [searchRepertorio, setSearchRepertorio] = useState('');
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [filterMinhas, setFilterMinhas] = useState(true);
  const [showCreateSetlistForm, setShowCreateSetlistForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editingSetlist, setEditingSetlist] = useState(null); // { id, name, musicas_ids, active } | null
  const [newSetlistName, setNewSetlistName] = useState('');
  const [newSetlistFileText, setNewSetlistFileText] = useState('');
  const [newSetlistFileName, setNewSetlistFileName] = useState('');
  const [newSetlistSongs, setNewSetlistSongs] = useState([]);
  const [newSetlistSearch, setNewSetlistSearch] = useState('');

  useEffect(() => {
    async function loadRepertorio() {
      const { data: musicas } = await supabase
        .from('musicas_repertorio')
        .select('*')
        .order('artista_nome', { ascending: true });
      if (musicas) setMusicasRepertorio(musicas);
    }
    loadRepertorio();
  }, []);

  useEffect(() => {
    if (userProfile?.selected_musicas_ids) {
      setSelectedMusicasIds(userProfile.selected_musicas_ids);
    }
  }, [userProfile]);

  const toggleMusica = (musicaId) => {
    setSaved(false);
    if (editingSetlist) {
      const musicas_ids = editingSetlist.musicas_ids.includes(musicaId)
        ? editingSetlist.musicas_ids.filter(id => id !== musicaId)
        : [...editingSetlist.musicas_ids, musicaId];
      setEditingSetlist({ ...editingSetlist, musicas_ids });
    } else {
      setSelectedMusicasIds(prev =>
        prev.includes(musicaId)
          ? prev.filter(id => id !== musicaId)
          : [...prev, musicaId]
      );
    }
  };

  const salvarRepertorio = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      if (editingSetlist) {
        const updatedSetlists = (userProfile?.setlists || []).map(s => {
          if (s.id === editingSetlist.id) {
            return editingSetlist;
          }
          return s;
        });
        const updates = { setlists: updatedSetlists };
        if (editingSetlist.active) {
          updates.selected_musicas_ids = editingSetlist.musicas_ids;
          setSelectedMusicasIds(editingSetlist.musicas_ids);
        }
        await supabase.from('artists').update(updates).eq('user_id', user.id);
        setEditingSetlist(null);
      } else {
        await supabase.from('artists').update({ selected_musicas_ids: selectedMusicasIds }).eq('user_id', user.id);
      }
    } catch (e) { console.error('Erro ao salvar:', e); }
    if (refreshProfile) refreshProfile();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const parseAndRegisterSongs = async (text) => {
    const parsed = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const parsedSongs = parsed.map(line => {
      let titulo = line;
      let artista_nome = 'Vários';
      const parts = line.split(/ - | – | — /);
      if (parts.length > 1) {
        titulo = parts[0].trim();
        artista_nome = parts[1].trim();
      } else {
        const parts2 = line.split(/\s{2,}/);
        if (parts2.length > 1) {
          titulo = parts2[0].trim();
          artista_nome = parts2[1].trim();
        }
      }
      return { titulo, artista_nome };
    });

    const { data: allGlobalSongs } = await supabase
      .from('musicas_repertorio')
      .select('id, titulo, artista_nome');

    const newSongIds = [];
    const songsToInsert = [];

    const uniqueParsedSongs = [];
    const seenTitles = new Set();
    for (const song of parsedSongs) {
      const cleanTitle = song.titulo.toLowerCase().trim();
      if (!seenTitles.has(cleanTitle)) {
        seenTitles.add(cleanTitle);
        uniqueParsedSongs.push(song);
      }
    }

    for (const song of uniqueParsedSongs) {
      const matched = allGlobalSongs?.find(s => 
        s.titulo.toLowerCase().trim() === song.titulo.toLowerCase().trim()
      );
      if (matched) {
        newSongIds.push(matched.id);
      } else {
        songsToInsert.push({
          titulo: song.titulo,
          artista_nome: song.artista_nome,
          duracao_seg: 180,
          genero: userProfile?.genre || 'Sertanejo'
        });
      }
    }

    if (songsToInsert.length > 0) {
      const { data: insertedSongs, error: insertError } = await supabase
        .from('musicas_repertorio')
        .insert(songsToInsert)
        .select('id');
      if (insertError) throw insertError;
      if (insertedSongs) {
        newSongIds.push(...insertedSongs.map(s => s.id));
      }
    }

    const { data: musicas } = await supabase
      .from('musicas_repertorio')
      .select('*')
      .order('artista_nome', { ascending: true });
    if (musicas) setMusicasRepertorio(musicas);

    return newSongIds;
  };

  const handleCreateSetlist = async () => {
    if (!newSetlistName.trim() || !user?.id) return;
    setIsProcessingFile(true);
    try {
      let musicasIds = [...newSetlistSongs];
      const updates = {};

      if (newSetlistFileText.trim()) {
        const newSongIds = await parseAndRegisterSongs(newSetlistFileText);
        musicasIds = Array.from(new Set([...musicasIds, ...newSongIds]));
        const updatedIds = Array.from(new Set([...selectedMusicasIds, ...newSongIds]));
        setSelectedMusicasIds(updatedIds);
        updates.selected_musicas_ids = updatedIds;
      }

      const newSetlist = {
        id: 'set-' + Date.now(),
        name: newSetlistName.trim(),
        musicas_ids: musicasIds,
        active: false
      };
      const updatedSetlists = [...(userProfile?.setlists || []), newSetlist];
      updates.setlists = updatedSetlists;
      
      await supabase.from('artists').update(updates).eq('user_id', user.id);
      setNewSetlistName('');
      setNewSetlistFileText('');
      setNewSetlistFileName('');
      setNewSetlistSongs([]);
      setNewSetlistSearch('');
      if (refreshProfile) refreshProfile();
    } catch (e) {
      console.error(e);
      alert('Erro ao criar setlist: ' + e.message);
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleDeleteSetlist = async (setlistId) => {
    if (!user?.id) return;
    const updatedSetlists = (userProfile?.setlists || []).filter(s => s.id !== setlistId);
    try {
      await supabase.from('artists').update({ setlists: updatedSetlists }).eq('user_id', user.id);
      if (editingSetlist?.id === setlistId) setEditingSetlist(null);
      if (refreshProfile) refreshProfile();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleSetlistActive = async (setlistId) => {
    if (!user?.id) return;
    let activeSetlistSongs = null;
    let nextActiveState = false;
    const updatedSetlists = (userProfile?.setlists || []).map(s => {
      if (s.id === setlistId) {
        const active = !s.active;
        nextActiveState = active;
        if (active) {
          activeSetlistSongs = s.musicas_ids || [];
        }
        return { ...s, active };
      }
      return { ...s, active: false };
    });

    try {
      const updates = { setlists: updatedSetlists };
      if (nextActiveState && activeSetlistSongs !== null) {
        updates.selected_musicas_ids = activeSetlistSongs;
        setSelectedMusicasIds(activeSetlistSongs);
      }
      await supabase.from('artists').update(updates).eq('user_id', user.id);
      if (refreshProfile) refreshProfile();
    } catch (e) {
      console.error(e);
    }
  };

  const handleImportPlaylistFromText = async (text) => {
    setIsProcessingFile(true);
    try {
      const newSongIds = await parseAndRegisterSongs(text);
      const updatedIds = Array.from(new Set([...selectedMusicasIds, ...newSongIds]));
      setSelectedMusicasIds(updatedIds);
      
      await supabase.from('artists').update({ selected_musicas_ids: updatedIds }).eq('user_id', user.id);
      if (refreshProfile) refreshProfile();

      alert(`Sucesso! Adicionei ${newSongIds.length} músicas ao seu repertório.`);
    } catch (err) {
      console.error('Erro na importação:', err);
      alert('Erro: ' + err.message);
    } finally {
      setIsProcessingFile(false);
    }
  };

  return (
    <AppLayout role="artist">
      <div className="space-y-6 pb-10">
        <div className="p-5 rounded-2xl bg-white/5 border border-white/5">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-4">Meu Repertório</h3>
          <p className="text-[10px] text-gray-400 mb-4">Selecione as músicas que você canta. Elas aparecerão no seu perfil público.</p>

          {/* Setlists Section */}
          <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">Minhas Setlists</h4>
                <p className="text-[10px] text-gray-500">Crie setlists nomeadas e ative uma delas para o show.</p>
              </div>
              <div className="flex items-center gap-2">
                {showCreateSetlistForm ? (
                  <div className="flex flex-col gap-2 w-full mt-2 p-3 bg-black/40 border border-white/10 rounded-xl">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-gray-400">Nome da Setlist</label>
                      <input
                        type="text"
                        placeholder="Nome da setlist..."
                        value={newSetlistName}
                        onChange={e => setNewSetlistName(e.target.value)}
                        className="bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-neon-purple/50"
                        autoFocus
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-gray-400">Enviar arquivo .txt (Opcional)</label>
                      <div className={`flex items-center justify-between gap-2 p-2 rounded-lg border border-dashed text-xs cursor-pointer relative transition-all ${
                        newSetlistFileName ? 'border-neon-purple bg-neon-purple/5' : 'border-white/10 bg-black/10 hover:border-white/20'
                      }`}>
                        <div className="flex items-center gap-2 text-[10px] text-gray-400">
                          <FileText className="w-3.5 h-3.5 text-neon-purple" />
                          <span>{newSetlistFileName || "Selecionar arquivo .txt"}</span>
                        </div>
                        <input
                          type="file"
                          accept=".txt"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              const text = await file.text();
                              setNewSetlistFileText(text);
                              setNewSetlistFileName(file.name);
                            } catch (err) {
                              alert('Erro ao ler arquivo: ' + err.message);
                            }
                            e.target.value = '';
                          }}
                        />
                        {newSetlistFileName && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              setNewSetlistFileText('');
                              setNewSetlistFileName('');
                            }}
                            className="text-gray-400 hover:text-white z-10"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end mt-1">
                      <button
                        onClick={async () => {
                          if (!newSetlistName.trim()) return;
                          await handleCreateSetlist();
                          setShowCreateSetlistForm(false);
                        }}
                        disabled={isProcessingFile}
                        className="px-3 py-1.5 bg-neon-purple hover:bg-neon-purple/80 text-white rounded-lg text-xs font-bold disabled:opacity-50"
                      >
                        {isProcessingFile ? 'Criando...' : 'Criar'}
                      </button>
                      <button
                        onClick={() => {
                          setShowCreateSetlistForm(false);
                          setNewSetlistFileText('');
                          setNewSetlistFileName('');
                        }}
                        className="px-2 py-1.5 bg-white/5 hover:bg-white/10 text-gray-400 rounded-lg text-xs font-bold"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => setShowImportModal(true)}
                      className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-neon-purple border border-neon-purple/30 rounded-lg text-xs font-bold flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Importar (.txt)
                    </button>
                    <button
                      onClick={() => setShowCreateSetlistForm(true)}
                      className="p-1.5 bg-neon-purple hover:bg-neon-purple/80 text-white rounded-lg text-xs font-bold flex items-center justify-center"
                      title="Criar Nova Setlist"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-2">
              {showCreateSetlistForm ? (
                <div className="space-y-3 p-3 bg-black/20 rounded-xl border border-white/5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/5">
                    <span className="text-[11px] font-bold text-neon-purple uppercase tracking-wider">
                      Selecione músicas do banco para a playlist ({newSetlistSongs.length} selecionadas):
                    </span>
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                      <input
                        type="text"
                        value={newSetlistSearch}
                        onChange={e => setNewSetlistSearch(e.target.value)}
                        placeholder="Filtrar músicas do banco..."
                        className="w-full pl-8 pr-3 py-1.5 bg-black/30 border border-white/10 rounded-lg text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-neon-purple/50"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                    {musicasRepertorio
                      .filter(m => !newSetlistSearch || m.titulo.toLowerCase().includes(newSetlistSearch.toLowerCase()) || m.artista_nome.toLowerCase().includes(newSetlistSearch.toLowerCase()))
                      .map(musica => {
                        const isSelected = newSetlistSongs.includes(musica.id);
                        return (
                          <button
                            key={musica.id}
                            type="button"
                            onClick={() => {
                              setNewSetlistSongs(prev =>
                                isSelected ? prev.filter(id => id !== musica.id) : [...prev, musica.id]
                              );
                            }}
                            className={`flex items-center gap-2.5 p-2 rounded-lg border text-left transition-all ${
                              isSelected
                                ? 'bg-neon-purple/10 border-neon-purple/40 text-white'
                                : 'bg-white/5 border-white/5 text-gray-400 hover:border-white/20'
                            }`}
                          >
                            <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all ${
                              isSelected ? 'bg-neon-purple border-neon-purple' : 'border-white/20'
                            }`}>
                              {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[11px] font-bold truncate">{musica.titulo}</p>
                              <p className="text-[9px] text-gray-500 truncate">{musica.artista_nome}</p>
                            </div>
                          </button>
                        );
                      })}
                  </div>
                </div>
              ) : (userProfile?.setlists || []).length === 0 ? (
                <p className="text-[10px] text-gray-500 italic text-center py-2">Você ainda não criou nenhuma setlist.</p>
              ) : (
                (userProfile.setlists).map(setlist => {
                  const isEditingThis = editingSetlist?.id === setlist.id;
                  return (
                    <div key={setlist.id} className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-white/5">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${setlist.active ? 'text-neon-green' : 'text-white'}`}>
                          {setlist.name}
                        </span>
                        <span className="text-[9px] text-gray-500">
                          ({setlist.musicas_ids?.length || 0} músicas)
                        </span>
                        {setlist.active && (
                          <span className="text-[8px] bg-neon-green/20 text-neon-green border border-neon-green/30 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">
                            Ativa no Show
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleSetlistActive(setlist.id)}
                          className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all border ${
                            setlist.active
                              ? 'bg-neon-green/20 border-neon-green/50 text-neon-green'
                              : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30'
                          }`}
                        >
                          {setlist.active ? 'Desativar' : 'Ativar'}
                        </button>
                        <button
                          onClick={() => {
                            if (isEditingThis) {
                              setEditingSetlist(null);
                            } else {
                              setEditingSetlist({ ...setlist });
                            }
                          }}
                          className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all border ${
                            isEditingThis
                              ? 'bg-neon-purple/20 border-neon-purple/50 text-neon-purple'
                              : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30'
                          }`}
                        >
                          {isEditingThis ? 'Cancelar' : 'Editar Músicas'}
                        </button>
                        <button
                          onClick={() => handleDeleteSetlist(setlist.id)}
                          className="p-1 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {editingSetlist && (
            <div className="mb-4 p-3 rounded-xl bg-neon-purple/10 border border-neon-purple/30 flex items-center justify-between">
              <p className="text-xs text-neon-purple font-bold">
                Modo Edição: Selecione as músicas da setlist "{editingSetlist.name}" abaixo
              </p>
              <button
                onClick={() => setEditingSetlist(null)}
                className="text-[10px] text-gray-400 hover:text-white uppercase tracking-wider font-bold"
              >
                Voltar ao Geral
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={searchRepertorio}
                onChange={e => setSearchRepertorio(e.target.value)}
                placeholder="Pesquisar música ou artista..."
                className="w-full pl-10 pr-4 py-2.5 bg-[#0F0926] border border-white/10 rounded-xl text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-neon-purple/50 transition-all"
              />
              {searchRepertorio && (
                <button onClick={() => setSearchRepertorio('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={() => setFilterMinhas(!filterMinhas)}
              className={`flex items-center gap-1.5 py-2.5 px-4 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all flex-shrink-0 ${
                filterMinhas
                  ? 'bg-neon-purple/20 border-neon-purple/50 text-neon-purple'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30'
              }`}
            >
              <Music className="w-3.5 h-3.5" />
              {editingSetlist ? 'Músicas na Setlist' : 'Minhas Músicas'}
              {(editingSetlist ? editingSetlist.musicas_ids.length : selectedMusicasIds.length) > 0 && (
                <span className="ml-1 text-[10px]">({editingSetlist ? editingSetlist.musicas_ids.length : selectedMusicasIds.length})</span>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {musicasRepertorio
              .filter(musica =>
                (!searchRepertorio || 
                musica.titulo.toLowerCase().includes(searchRepertorio.toLowerCase()) ||
                musica.artista_nome.toLowerCase().includes(searchRepertorio.toLowerCase())) &&
                (!filterMinhas || (editingSetlist ? editingSetlist.musicas_ids.includes(musica.id) : selectedMusicasIds.includes(musica.id)))
              )
              .map(musica => {
                const selected = editingSetlist
                  ? editingSetlist.musicas_ids.includes(musica.id)
                  : selectedMusicasIds.includes(musica.id);
                return (
                  <button
                    key={musica.id}
                    onClick={() => toggleMusica(musica.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      selected
                        ? 'bg-neon-green/10 border-neon-green/40 text-white'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      selected ? 'bg-neon-green border-neon-green' : 'border-white/20'
                    }`}>
                      {selected && <Check className="w-3.5 h-3.5 text-black" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate">{musica.titulo}</p>
                      <p className="text-[10px] text-gray-500">{musica.artista_nome} • {Math.floor(musica.duracao_seg / 60)}m{musica.duracao_seg % 60}s</p>
                    </div>
                  </button>
                );
              })}
          </div>

          <div className="mt-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">
                {editingSetlist
                  ? `${editingSetlist.musicas_ids.length} de ${musicasRepertorio.length} músicas na setlist`
                  : `${selectedMusicasIds.length} de ${musicasRepertorio.length} músicas selecionadas`
                }
              </span>
              {saved && (
                <span className="flex items-center gap-1 text-[10px] text-neon-green font-bold">
                  <Check className="w-3 h-3" />
                  Salvo com sucesso!
                </span>
              )}
            </div>
            <button
              onClick={salvarRepertorio}
              disabled={saving}
              className="py-2.5 px-6 rounded-xl bg-neon-green text-black text-xs font-black uppercase tracking-wider hover:shadow-[0_0_20px_rgba(57,255,106,0.3)] transition-all disabled:opacity-50"
            >
              {saving
                ? 'Salvando...'
                : editingSetlist
                  ? `Salvar Setlist "${editingSetlist.name}"`
                  : 'Salvar Repertório Geral'
              }
            </button>
          </div>
        </div>
      </div>

      {/* Import Playlist Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`relative rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 ${
            isDark ? 'bg-[#0f0a26] border border-white/10 text-white' : 'bg-white border border-gray-200 text-gray-900'
          }`}>
            <button
              onClick={() => {
                setShowImportModal(false);
                setImportText('');
              }}
              className={`absolute top-3 right-3 p-1 rounded-full ${
                isDark ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
              }`}
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Importar Playlist (Texto ou .txt)</h3>
              <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Cole o texto da sua playlist abaixo (uma música por linha, ex: <strong>Título - Artista</strong>) ou faça upload de um arquivo .txt.
              </p>
            </div>

            <textarea
              rows={6}
              placeholder="Exemplo:&#10;Ainda Ontem Chorei de Saudade - João Mineiro & Marciano&#10;Boate Azul - Bruno & Marrone"
              value={importText}
              onChange={e => setImportText(e.target.value)}
              className={`w-full p-3 rounded-xl border text-xs outline-none resize-none font-mono ${
                isDark 
                  ? 'bg-black/30 border-white/10 text-white placeholder:text-gray-600 focus:border-neon-purple/50' 
                  : 'bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-400 focus:border-neon-purple/50'
              }`}
            />

            <div className={`flex items-center justify-between gap-2 p-3 rounded-xl border border-dashed cursor-pointer relative transition-all ${
              isDark ? 'border-white/10 bg-black/10 hover:border-white/20' : 'border-gray-200 bg-gray-50 hover:border-gray-300'
            }`}>
              <div className="flex items-center gap-2 text-[10px] text-gray-400">
                <FileText className="w-4 h-4 text-neon-purple" />
                <span>Ou selecione um arquivo .txt da sua playlist</span>
              </div>
              <input
                type="file"
                accept=".txt"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const text = await file.text();
                    setImportText(text);
                  } catch (err) {
                    alert('Erro ao ler arquivo: ' + err.message);
                  }
                  e.target.value = '';
                }}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={async () => {
                  if (!importText.trim()) return;
                  await handleImportPlaylistFromText(importText);
                  setShowImportModal(false);
                  setImportText('');
                }}
                disabled={isProcessingFile}
                className="flex-1 py-2 px-4 bg-neon-purple hover:bg-neon-purple/80 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
              >
                {isProcessingFile ? 'Processando...' : 'Importar Músicas'}
              </button>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportText('');
                }}
                className={`py-2 px-4 rounded-xl text-xs font-bold ${
                  isDark ? 'bg-white/5 text-gray-300 hover:bg-white/10' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
