import { Route, Routes } from 'react-router-dom';
import { AppFooter } from '../components/app-footer';
import { GistList } from '../components/gist-list';
import { AuthProvider } from '../context/auth-context';
import Callback from './callback';
import { GistDetail } from './gist-detail';
import { PrivacyPolicy } from './privacy';
import { Home } from '../components/home';

export function App() {
  return (
    <main className="min-h-screen bg-white">
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/gists" element={<GistList />} />
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
