import { useState } from 'react';
import RoomList from '../components/RoomList';

export default function Home() {
  const [username, setUsername] = useState('');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12 px-4">
      <div className="container mx-auto">
        <RoomList username={username} setUsername={setUsername} />
      </div>
    </div>
  );
}