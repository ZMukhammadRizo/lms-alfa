import React, { useEffect, useState } from 'react';
import supabase from '../../config/supabaseClient';

interface Role {
  id: string;
  name: string;
}

const Debug: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [insertStatus, setInsertStatus] = useState<string | null>(null);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setLoading(true);
        console.log('Fetching roles from Supabase...');
        const { data, error } = await supabase
          .from('roles')
          .select('*');

        console.log('Roles data received:', data);
        console.log('Roles error if any:', error);

        if (error) {
          throw error;
        }

        if (data) {
          setRoles(data);
        }
      } catch (error: any) {
        console.error('Error fetching roles:', error);
        setError(error.message || 'Unable to load roles');
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();
  }, []);

  const insertTestRoles = async () => {
    try {
      setInsertStatus('Inserting test roles...');
      
      const testRoles = [
        { id: '1', name: 'Admin' },
        { id: '2', name: 'Teacher' },
        { id: '3', name: 'Student' },
        { id: '4', name: 'Parent' }
      ];
      
      const { data, error } = await supabase
        .from('roles')
        .upsert(testRoles, { onConflict: 'id' })
        .select();
      
      if (error) {
        throw error;
      }
      
      setInsertStatus(`Successfully inserted test roles: ${data?.length} roles added/updated`);
      
      // Reload roles
      const { data: updatedRoles, error: fetchError } = await supabase
        .from('roles')
        .select('*');
        
      if (fetchError) {
        throw fetchError;
      }
      
      if (updatedRoles) {
        setRoles(updatedRoles);
      }
    } catch (error: any) {
      console.error('Error inserting test roles:', error);
      setInsertStatus(`Error inserting test roles: ${error.message}`);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Debug Roles</h1>
      
      {loading && <p>Loading roles...</p>}
      
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      
      {!loading && (
        <>
          <h2>Roles from Database:</h2>
          <pre>{JSON.stringify(roles, null, 2)}</pre>
          
          <h2>Roles Count: {roles.length}</h2>
          
          <ul>
            {roles.map(role => (
              <li key={role.id}>
                ID: {role.id} - Name: {role.name}
              </li>
            ))}
          </ul>
          
          <div style={{ marginTop: '20px' }}>
            <button 
              onClick={insertTestRoles}
              style={{ 
                padding: '10px 15px', 
                backgroundColor: '#0ea5e9', 
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Insert Test Roles
            </button>
            
            {insertStatus && (
              <p style={{ 
                marginTop: '10px',
                color: insertStatus.includes('Error') ? 'red' : 'green' 
              }}>
                {insertStatus}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Debug; 