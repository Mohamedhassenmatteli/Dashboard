import { NavLink } from "react-router-dom";

const Sidebar = () => {
  const links = [
    { name: "Insight", path: "/superadmin/insight" },
    { name: "Fleet Dashboard", path: "/superadmin/fleet" },
    { name: "Delivery Dashboard", path: "/superadmin/delivery" },
    { name: "Leave Dashboard", path: "/superadmin/leave" },
    { name: "Driver Performance", path: "/superadmin/driver" },
  ];

  return (
    <aside className="w-64 bg-white shadow h-screen">
      <div className="p-4 text-xl font-bold border-b">Super Admin</div>
      <nav className="flex flex-col p-4 space-y-2">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) =>
              `p-2 rounded hover:bg-blue-100 ${isActive ? "bg-blue-200 font-semibold" : ""}`
            }
          >
            {link.name}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
