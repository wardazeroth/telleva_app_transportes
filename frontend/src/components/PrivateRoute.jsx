import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const PrivateRoute = ({ children, requireAdmin = false }) => {
    const { user } = useContext(AuthContext);

    if (!user) {
        return <Navigate to="/login" />;
    }

    if (requireAdmin && user.rol !== 'admin' && !user.is_staff) {
        return <Navigate to="/" />;
    }

    return children;
};

export default PrivateRoute;