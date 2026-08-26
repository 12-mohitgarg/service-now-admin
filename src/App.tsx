import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Categories } from './pages/Categories';
import { Subcategories } from './pages/Subcategories';
import { Providers } from './pages/Providers';
import { Customers } from './pages/Customers';
import { Payments } from './pages/Payments';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/subcategories" element={<Subcategories />} />
        <Route path="/providers" element={<Providers />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/payments" element={<Payments />} />
      </Route>
    </Routes>
  );
}

export default App;
