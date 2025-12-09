import { Link } from "@tanstack/react-router";
import { Scroll, SquareUserRound } from "lucide-react";

type NavProps = {
  fid: number;
};

const Nav: React.FC<NavProps> = ({ fid }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t bg-background z-10 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-stretch h-16">
        <Link
          to="/"
          aria-label="Home"
          className="flex-1 flex items-center justify-center hover:bg-accent transition-colors"
          activeProps={{
            className: "text-primary bg-accent",
          }}
          activeOptions={{ exact: true }}
        >
          <Scroll className="w-6 h-6" />
        </Link>
        <Link
          to={`/user/${fid}`}
          aria-label="Profile"
          className="flex-1 flex items-center justify-center hover:bg-accent transition-colors"
          activeProps={{
            className: "text-primary bg-accent",
          }}
          activeOptions={{ exact: true }}
        >
          <SquareUserRound className="w-6 h-6" />
        </Link>
      </div>
    </nav>
  );
};

export default Nav;
