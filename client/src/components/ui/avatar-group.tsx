import { User } from "@shared/schema";
import { Avatar, AvatarFallback } from "./avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";

interface AvatarGroupProps {
  users: User[];
  limit?: number;
}

export function AvatarGroup({ users, limit = 3 }: AvatarGroupProps) {
  const displayUsers = users.slice(0, limit);
  const remaining = users.length - limit;

  return (
    <div className="flex -space-x-2">
      <TooltipProvider>
        {displayUsers.map((user, index) => {
          const initials = user.name
            ? `${user.name.split(" ")[0][0]}${
                user.name.split(" ")[1]?.[0] || ""
              }`
            : user.username?.substring(0, 2).toUpperCase() || "U";

          return (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <Avatar className="h-6 w-6 border-2 border-white">
                  <AvatarFallback className="text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <p>{user.name || user.username}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}

        {remaining > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Avatar className="h-6 w-6 border-2 border-white">
                <AvatarFallback className="text-xs bg-gray-200 text-gray-600">
                  +{remaining}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>
              <p>{remaining} more collaborator{remaining > 1 ? 's' : ''}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </TooltipProvider>
    </div>
  );
}
