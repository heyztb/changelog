import { Link } from "@tanstack/react-router";
import { Scroll } from "lucide-react";

function Nav() {
  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center gap-6">
          <div className="flex items-center justify-center">
            <Link
              to="/"
              className="hover:text-primary transition-colors"
              activeProps={{
                className: "font-bold text-primary",
              }}
              activeOptions={{ exact: true }}
            >
              Build in public
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Nav;
