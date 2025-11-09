import '../../styles/components_styles/auth/login.css';
import '../../styles/components_styles/news/News.css';
import '../../styles/components_styles/admin/Users.css';
import '../../styles/components_styles/news/Retrieval.css';
import '../../styles/components_styles/news/Createposts.css';
import '../../styles/components_styles/admin/AdminChat.css';
import '../../styles/components_styles/admin/Categories.css';
import '../../styles/components_styles/admin/Systemservices.css';
import '../../styles/components_styles/admin/Profile.css';
import '../../styles/components_styles/admin/Cache.css';

import '../../styles/Admin.css';
import AdminLayout from './AdminLayout';

export const metadata = {
  title: 'Daily Vaibe Admin Dashboard',
  description: 'Daily Vaibe news management',
};

export default function AdminSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayout>{children}</AdminLayout>;
}