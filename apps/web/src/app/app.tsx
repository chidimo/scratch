import { Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import Callback from './callback';
import { Gists } from './gists';
import { PrivacyPolicy } from './privacy';

export function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Gists />} />
        <Route path="/callback" element={<Callback />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
