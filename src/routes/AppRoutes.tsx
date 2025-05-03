import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { AnnouncementProvider } from '../contexts/AnnouncementContext';
import { ToastContainer } from 'react-toastify';
import { ThemeProvider } from '../components/ThemeProvider';
import 'react-toastify/dist/ReactToastify.css';

const AppRoutes = () => {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <AnnouncementProvider>
            <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="colored"
            />
            {/* Rest of your routes */}
          </AnnouncementProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
};

export default AppRoutes; 