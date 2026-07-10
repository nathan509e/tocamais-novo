import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { useTheme } from '../../lib/ThemeContext';
import { supabase } from '../../lib/supabaseClient';
import AppLayout from '../../components/shared/AppLayout';
import { 
  Users, Search, Shield, Trash2, CheckCircle, Crown, Star, 
  MapPin, Mail, Award, X, ChevronRight 
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [usersList, setUsersList] = useState([]);
  const [artistsList, setArtistsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load all users
      const { data: usersData } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      // Load all artist profiles to match PRO/Verified status
      const { data: artistsData } = await supabase
        .from('artists')
        .select('*');

      setUsersList(usersData || []);
      setArtistsList(artistsData || []);
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Tem certeza que deseja excluir esta conta permanentemente? Isso apagará todos os dados associados.')) return;
    try {
      const { error } = await supabase.from('users').delete().eq('id', userId);
      if (error) throw error;
      setUsersList(prev => prev.filter(u => u.id !== userId));
      if (selectedUser?.id === userId) setSelectedUser(null);
      alert('Usuário excluído com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir usuário: ' + err.message);
    }
  };

  const handleTogglePro = async (userId, currentPro) => {
    try {
      const { error } = await supabase
        .from('artists')
        .update({ is_pro: !currentPro })
        .eq('user_id', userId);
      if (error) throw error;
      
      setArtistsList(prev => prev.map(a => a.user_id === userId ? { ...a, is_pro: !currentPro } : a));
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser(prev => ({
          ...prev,
          artistProfile: { ...prev.artistProfile, is_pro: !currentPro }
        }));
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao atualizar status PRO: ' + err.message);
    }
  };

  const handleToggleVerified = async (userId, currentVerified) => {
    try {
      const { error } = await supabase
        .from('artists')
        .update({ verified: !currentVerified })
        .eq('user_id', userId);
      if (error) throw error;
      
      setArtistsList(prev => prev.map(a => a.user_id === userId ? { ...a, verified: !currentVerified } : a));
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser(prev => ({
          ...prev,
          artistProfile: { ...prev.artistProfile, verified: !currentVerified }
        }));
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao atualizar status verificado: ' + err.message);
    }
  };

  // Filter users based on query and role filter
  const filteredUsers = usersList.filter(u => {
    const matchesSearch = searchQuery === '' || 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getArtistProfile = (userId) => artistsList.find(a => a.user_id === userId);

  const stats = {
    total: usersList.length,
    artists: usersList.filter(u => u.role === 'artist').length,
    venues: usersList.filter(u => u.role === 'venue').length,
    contractors: usersList.filter(u => u.role === 'contractor').length,
  };

  return (
    <AppLayout role="admin">
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-neon-purple/20 rounded-2xl">
            <Shield className="w-6 h-6 text-neon-purple animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Painel de Gestão Admin</h1>
            <p className="text-xs text-gray-400">Gerencie usuários, status PRO, verificações e contas do aplicativo.</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Usuários', value: stats.total, color: 'text-white' },
            { label: 'Artistas', value: stats.artists, color: 'text-neon-purple' },
            { label: 'Casas de Show', value: stats.venues, color: 'text-neon-green' },
            { label: 'Contratantes', value: stats.contractors, color: 'text-yellow-400' },
          ].map((s, i) => (
            <div key={i} className={`p-4 rounded-2xl bg-white/5 border border-white/5 text-center`}>
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filter and Search */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#0f0a26] border border-white/10 rounded-xl text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-neon-purple/50"
            />
          </div>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="px-4 py-2.5 bg-[#0f0a26] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-neon-purple/50"
          >
            <option value="all">Todos os Papéis</option>
            <option value="artist">Artistas</option>
            <option value="venue">Casas de Show</option>
            <option value="contractor">Contratantes</option>
            <option value="admin">Administradores</option>
          </select>
        </div>

        {/* Main Content Layout */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* User List Panel */}
          <div className="lg:col-span-2 space-y-3">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Lista de Contas</h3>
              {loading ? (
                <p className="text-xs text-gray-500 text-center py-8">Carregando dados...</p>
              ) : filteredUsers.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-8">Nenhum usuário encontrado.</p>
              ) : (
                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                  {filteredUsers.map(u => {
                    const artistProfile = getArtistProfile(u.id);
                    return (
                      <div 
                        key={u.id}
                        onClick={() => setSelectedUser({ ...u, artistProfile })}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                          selectedUser?.id === u.id
                            ? 'bg-neon-purple/10 border-neon-purple/50'
                            : 'bg-black/20 border-white/5 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img 
                            src={u.avatar_url || 'https://ui-avatars.com/api/?name=' + u.name + '&background=7B2EFF&color=fff'} 
                            alt="Avatar" 
                            className="w-10 h-10 rounded-xl object-cover"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-bold text-white truncate">{u.name}</p>
                              {artistProfile?.verified && <CheckCircle className="w-3.5 h-3.5 text-neon-purple" />}
                              {artistProfile?.is_pro && <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
                            </div>
                            <p className="text-[10px] text-gray-500 truncate">{u.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-[9px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                            u.role === 'artist' 
                              ? 'bg-neon-purple/20 text-neon-purple' 
                              : u.role === 'venue' 
                                ? 'bg-neon-green/20 text-neon-green' 
                                : u.role === 'admin'
                                  ? 'bg-red-500/20 text-red-400'
                                  : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {u.role}
                          </span>
                          <ChevronRight className="w-4 h-4 text-gray-500" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* User Details Sidebar */}
          <div>
            {selectedUser ? (
              <div className="p-5 bg-white/5 rounded-2xl border border-white/5 space-y-5 sticky top-24">
                <div className="flex items-start justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">Ficha do Usuário</h3>
                  <button onClick={() => setSelectedUser(null)} className="p-1 rounded-lg hover:bg-white/10">
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>

                <div className="text-center space-y-2 border-b border-white/5 pb-4">
                  <img 
                    src={selectedUser.avatar_url || 'https://ui-avatars.com/api/?name=' + selectedUser.name + '&background=7B2EFF&color=fff'} 
                    alt="Avatar" 
                    className="w-20 h-20 rounded-2xl object-cover mx-auto border-2 border-white/10"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-white">{selectedUser.name}</h4>
                    <p className="text-[10px] text-gray-500 font-mono mt-0.5">{selectedUser.id}</p>
                  </div>
                </div>

                <div className="space-y-3.5 text-xs text-gray-300">
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-bold">Email:</span>
                    <span className="text-white font-medium">{selectedUser.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-bold">Papel:</span>
                    <span className="text-white font-medium capitalize">{selectedUser.role}</span>
                  </div>

                  {selectedUser.role === 'artist' && selectedUser.artistProfile && (
                    <div className="border-t border-white/5 pt-4 space-y-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Perfil de Artista</p>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-500 font-bold">Nome Artístico:</span>
                        <span className="text-white">{selectedUser.artistProfile.artistic_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 font-bold">Gênero:</span>
                        <span className="text-white">{selectedUser.artistProfile.genre}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 font-bold">Cidade:</span>
                        <span className="text-white">{selectedUser.artistProfile.city}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 font-bold">Wallet ID Asaas:</span>
                        <span className="text-white font-mono text-[10px]">{selectedUser.artistProfile.asaas_wallet_id || 'Não cadastrado'}</span>
                      </div>

                      {/* Management Toggles */}
                      <div className="space-y-2 pt-2">
                        <button
                          onClick={() => handleTogglePro(selectedUser.id, selectedUser.artistProfile.is_pro)}
                          className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all ${
                            selectedUser.artistProfile.is_pro
                              ? 'bg-amber-400/20 border-amber-400/40 text-amber-400'
                              : 'bg-white/5 border-white/10 text-gray-300 hover:border-white/20'
                          }`}
                        >
                          <Crown className="w-4 h-4" />
                          {selectedUser.artistProfile.is_pro ? 'Remover Status PRO' : 'Tornar Artista PRO'}
                        </button>

                        <button
                          onClick={() => handleToggleVerified(selectedUser.id, selectedUser.artistProfile.verified)}
                          className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all ${
                            selectedUser.artistProfile.verified
                              ? 'bg-neon-purple/20 border-neon-purple/40 text-neon-purple'
                              : 'bg-white/5 border-white/10 text-gray-300 hover:border-white/20'
                          }`}
                        >
                          <CheckCircle className="w-4 h-4" />
                          {selectedUser.artistProfile.verified ? 'Remover Selo Verificado' : 'Atribuir Selo Verificado'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-white/5 pt-4">
                  <button
                    onClick={() => handleDeleteUser(selectedUser.id)}
                    className="w-full py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-bold text-xs flex items-center justify-center gap-2 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                    Excluir Conta Permanentemente
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 bg-white/5 rounded-2xl border border-white/5 text-center text-gray-500 sticky top-24 italic text-xs">
                Selecione um usuário para visualizar a ficha e gerenciar a conta.
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
