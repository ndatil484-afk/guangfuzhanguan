import { createHashRouter } from 'react-router-dom';
import GuangfuPage from '@/pages/GuangfuPage';
import ExamplesPage from '@/pages/ExamplesPage';
import PortraitShowcasePage from '@/pages/portraits/PortraitShowcasePage';
import NotFound from '@/pages/NotFound';

export const router = createHashRouter([
  {
    path: '/',
    element: <GuangfuPage />,
  },
  {
    path: '/examples',
    element: <ExamplesPage />,
  },
  {
    path: '/portraits',
    element: <PortraitShowcasePage />,
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);
