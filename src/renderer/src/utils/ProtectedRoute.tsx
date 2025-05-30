// src/routes/ProtectedRoute.tsx
import { useAuth } from '@renderer/context/AuthContext';
import { JSX } from 'react';
import { Navigate } from 'react-router-dom'; // Adjust the import path as necessary

export const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    const { isAuthenticated } = useAuth();

    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return children;
};
