import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

import {router} from './router';
import { RouterProvider } from 'react-router-dom';
import { UserProvider } from './context/UserContextFile.jsx';


const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <UserProvider>
      <RouterProvider router={router} />
    </UserProvider>
  </React.StrictMode>
);

