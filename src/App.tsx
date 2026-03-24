import { Fragment, Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { appRoutes } from './app/routes';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Router>
      <Layout>
        <Suspense
          fallback={
            <div className="flex min-h-[60vh] items-center justify-center">
              <div className="glass-card px-6 py-4 text-sm font-medium text-white/70">
                Đang tải giao diện...
              </div>
            </div>
          }
        >
          <Routes>
            {appRoutes.map((route) => {
              const RouteComponent = route.component;

              return (
                <Fragment key={route.path}>
                  <Route path={route.path} element={<RouteComponent />} />
                </Fragment>
              );
            })}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Layout>
    </Router>
  );
}
