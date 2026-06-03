import React from 'react';
import BarOwnerDashboard from './BarOwnerDashboard';
import ArtistDashboard from './ArtistDashboard';
import ContractorDashboard from './ContractorDashboard';

export default function Dashboard({ user }) {
  const role = user?.role;

  // Use the new high-fidelity Home component for fans/clients
  if (role === 'bar_owner') return <BarOwnerDashboard user={user} />;
  if (role === 'artist') return <ArtistDashboard user={user} />;
  if (role === 'contractor') return <ContractorDashboard user={user} />;
  
  // As a fallback for any other role, use ContractorDashboard for now if they are clients/fans
  // (Alternatively can be Home.jsx, but replacing to show the new dashboard as default)
  return <ContractorDashboard user={user} />;
}