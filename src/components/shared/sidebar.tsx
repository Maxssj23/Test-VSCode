import Link from 'next/link';
import { Home, ShoppingCart, Receipt, List, BarChart, ScrollText, Settings } from 'lucide-react';

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/groceries', icon: ShoppingCart, label: 'Groceries' },
  { href: '/inventory', icon: List, label: 'Inventory' },
  { href: '/purchases', icon: Receipt, label: 'Purchases' },
  { href: '/bills', icon: Receipt, label: 'Bills' },
  { href: '/shopping-list', icon: List, label: 'Shopping List' },
  { href: '/analytics', icon: BarChart, label: 'Budget & Analytics' },
  { href: '/audit-log', icon: ScrollText, label: 'Audit Log' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

const Sidebar = () => {
  return (
    <aside className="w-64 bg-gray-800 text-white p-4 hidden md:block">
      <nav>
        <ul>
          {navItems.map((item) => (
            <li key={item.href} className="mb-2">
              <Link href={item.href} className="flex items-center p-2 rounded-md hover:bg-gray-700">
                <item.icon className="mr-3 h-5 w-5" />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
