import React from 'react';
import OrgManagement from './OrgManagement';
import CognivaNetwork from './CognivaNetwork';

export default function AdminWorkspace({ activeModule }) {
  return (
    <div className="w-full h-full bg-[#F8F9FA] min-h-screen">
      {activeModule === 'network' ? <CognivaNetwork /> : <OrgManagement activeModule={activeModule} />}
    </div>
  );
}
