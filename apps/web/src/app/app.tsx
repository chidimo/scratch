import { Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import '../styles.css';
import Callback from './callback';
import Gists from './gists';

export function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Gists />} />
        <Route path="/callback" element={<Callback />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
