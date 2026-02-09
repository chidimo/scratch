import { Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../context/auth-context';
import Callback from './callback';
import { GistDetail } from './gist-detail';
import { Gists } from './gists';
import { PrivacyPolicy } from './privacy';
import { AppFooter } from '../components/app-footer';

export function App() {
  return (
    <main className="min-h-screen bg-white">
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Gists />} />
          <Route path="/gists/:gistId" element={<GistDetail />} />
          <Route path="/callback" element={<Callback />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
        </Routes>
      </AuthProvider>
      <AppFooter />
    </main>
  );
}

export default App;
