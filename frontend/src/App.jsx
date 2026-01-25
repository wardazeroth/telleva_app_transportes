import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

// Páginas Cliente
import LoginPage from './pages/LoginPage';
import ClientMapPage from './pages/ClientMapPage';
import RegisterPage from './pages/RegisterPage';
import PrivateRoute from './components/PrivateRoute';

// Layouts y Páginas Admin
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminRoutes from './pages/admin/AdminRoutes';
import RouteCreator from './pages/admin/RouteCreator';
import AdminParaderos from './pages/admin/AdminParaderos';
import ParaderoCreator from './pages/admin/ParaderoCreator';
import AdminLineas from './pages/admin/AdminLineas';
import AdminTransportes from './pages/admin/AdminTransportes';
import AdminAsignaciones from './pages/admin/AdminAsignaciones';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster position="top-center" reverseOrder={false} />
        <Routes>
          {/* Rutas Públicas */}
          <Route path="/" element={<ClientMapPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Rutas de Admin (Protegidas) */}
          <Route 
            path="/admin" 
            element={
              <PrivateRoute requireAdmin={true}>
                <AdminLayout />
              </PrivateRoute>
            }
          > 
            <Route index element={<AdminDashboard />} />
            
            {/* Gestión de Rutas */}
            <Route path="rutas" element={<AdminRoutes />} />
            <Route path="rutas/nueva" element={<RouteCreator />} />
            <Route path="rutas/editar/:id" element={<RouteCreator />} />
            
            {/* Gestión de Paraderos */}
            <Route path="paraderos" element={<AdminParaderos />} />
            <Route path="paraderos/nuevo" element={<ParaderoCreator />} />
            <Route path="paraderos/editar/:id" element={<ParaderoCreator />} />

            {/* Gestión de Líneas */}
            <Route path="lineas" element={<AdminLineas />} />

            {/* Imágenes Lineas*/}
            <Route path="lineas/imagenes" element={<AdminLineas/>} />


            {/* Gestión de Transportes */}
            <Route path="transportes" element={<AdminTransportes />} />

            {/* Gestión de Asignaciones */}
            <Route path="programacion" element={<AdminAsignaciones />} />
          </Route>

        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;