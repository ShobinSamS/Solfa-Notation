import { useEffect, useState } from 'react';
import { AppShell } from './components/AppShell';
import { ProjectProvider } from './context/ProjectContext';
import type { ChoirProject } from './types/project';
import { AboutPage } from './pages/AboutPage';
import { Dashboard } from './pages/Dashboard';
import { EditorPage } from './pages/EditorPage';
import { HelpPage } from './pages/HelpPage';
import { ProjectForm } from './pages/ProjectForm';
import { SplashScreen } from './pages/SplashScreen';

type Route =
  | { name: 'dashboard' }
  | { name: 'create' }
  | { name: 'edit'; project: ChoirProject }
  | { name: 'editor'; project: ChoirProject }
  | { name: 'about' }
  | { name: 'help' };

export default function App() {
  const [splash, setSplash] = useState(true);
  const [route, setRoute] = useState<Route>({ name: 'dashboard' });

  useEffect(() => {
    const handle = window.setTimeout(() => setSplash(false), 1900);
    return () => window.clearTimeout(handle);
  }, []);

  if (splash) return <SplashScreen />;

  return (
    <ProjectProvider>
      <AppShell compact={route.name === 'editor'}>
        {route.name === 'dashboard' && (
          <Dashboard
            onCreate={() => setRoute({ name: 'create' })}
            onEdit={(project) => setRoute({ name: 'edit', project })}
            onOpen={(project) => setRoute({ name: 'editor', project })}
            onAbout={() => setRoute({ name: 'about' })}
            onHelp={() => setRoute({ name: 'help' })}
          />
        )}
        {route.name === 'create' && (
          <ProjectForm onCancel={() => setRoute({ name: 'dashboard' })} onSaved={(project) => setRoute({ name: 'editor', project })} />
        )}
        {route.name === 'edit' && (
          <ProjectForm
            existing={route.project}
            onCancel={() => setRoute({ name: 'dashboard' })}
            onSaved={(project) => setRoute({ name: 'editor', project })}
          />
        )}
        {route.name === 'editor' && <EditorPage project={route.project} onBack={() => setRoute({ name: 'dashboard' })} />}
        {route.name === 'about' && <AboutPage onBack={() => setRoute({ name: 'dashboard' })} />}
        {route.name === 'help' && <HelpPage onBack={() => setRoute({ name: 'dashboard' })} />}
      </AppShell>
    </ProjectProvider>
  );
}
