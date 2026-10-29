"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isAdmin, getCurrentUser } from "@/lib/user-store";
import {
  Trash2,
  Eye,
  Search,
  Loader2,
  RefreshCw,
  User,
  ShieldCheck,
  Calendar,
  Activity,
  Flame,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  useUsers,
  useDeleteUser,
  type UserItem,
} from "@/hooks/useUsers";

export default function UsersManagement() {
  const router = useRouter();

  // TanStack Query Hooks
  const {
    data: users = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useUsers();

  const deleteUserMutation = useDeleteUser();

  // Local UI States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);

  // Kiểm tra quyền Admin
  useEffect(() => {
    const user = getCurrentUser();
    if (!user || !isAdmin()) {
      router.push("/login");
    }
  }, [router]);

  // Tìm kiếm
  const filteredUsers = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return users;
    return users.filter(
      (user) =>
        (user.fullName || "").toLowerCase().includes(term) ||
        (user.email || "").toLowerCase().includes(term) ||
        (user.fitnessGoal || "").toLowerCase().includes(term) ||
        (user.fitnessLevel || "").toLowerCase().includes(term)
    );
  }, [users, searchTerm]);

  // Xóa user
  const handleDeleteUser = async (user: UserItem) => {
    const displayName = user.fullName || user.email || "this user";
    if (!confirm(`Are you sure you want to delete ${displayName}?`)) return;

    try {
      await deleteUserMutation.mutateAsync(user.id);
      toast.success("User deleted successfully");
      if (selectedUser?.id === user.id) {
        setSelectedUser(null);
      }
    } catch (err: any) {
      console.error("Error deleting user:", err);
      toast.error(err.message || "Failed to delete user");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading users...</p>
        </div>
      </div>
    );
  }

  if (isError && users.length === 0) {
    return (
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <main className="flex-1">
          <div className="p-8">
            <Card className="p-8 text-center max-w-lg mx-auto mt-20">
              <h2 className="text-2xl font-bold mb-4">Unable to Load Users</h2>
              <p className="text-muted-foreground mb-6">
                {(error as Error)?.message || "Failed to load users from server."}
              </p>
              <Button onClick={() => refetch()} className="flex items-center gap-2 mx-auto">
                <RefreshCw className="w-4 h-4" /> Try Again
              </Button>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />

      <main className="flex-1">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Users Management</h1>
            <p className="text-muted-foreground mt-2">
              Manage all member profiles, account roles and training activity
            </p>
          </div>

          {/* Search Bar */}
          <Card className="p-4 mb-6">
            <div className="flex items-center gap-3">
              <Search className="w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, fitness goal or level..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <p className="text-sm text-muted-foreground whitespace-nowrap">
                {filteredUsers.length} / {users.length} users
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isFetching}
                className="flex items-center gap-1.5"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>
          </Card>

          {/* Users Table */}
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Fitness Goal</TableHead>
                  <TableHead>Sessions</TableHead>
                  <TableHead>Current Program</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <p className="font-semibold">{user.fullName || "N/A"}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${
                            user.account?.role === "admin"
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300"
                          }`}
                        >
                          {user.account?.role || "user"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {user.fitnessGoal ? (
                          <span className="px-2 py-0.5 rounded bg-muted text-xs capitalize">
                            {user.fitnessGoal.replace("-", " ")}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {user.workoutsSessions || 0}
                      </TableCell>
                      <TableCell>
                        {user.currentProgram ? (
                          <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                            {user.currentProgram}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.lastActive
                          ? new Date(user.lastActive).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedUser(user)}
                            title="View user details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteUser(user)}
                            disabled={deleteUserMutation.isPending}
                            title="Delete user"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>

          {/* User Details Modal */}
          {selectedUser && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <Card className="w-full max-w-lg">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6 pb-2 border-b border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {selectedUser.fullName
                          ? selectedUser.fullName.charAt(0).toUpperCase()
                          : "U"}
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">
                          {selectedUser.fullName}
                        </h2>
                        <p className="text-xs text-muted-foreground">
                          {selectedUser.email}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedUser(null)}
                      className="h-8 w-8 p-0"
                    >
                      ✕
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {/* User ID */}
                    <div className="bg-muted/40 p-2.5 rounded-md">
                      <p className="text-xs text-muted-foreground uppercase font-semibold">
                        Account ID
                      </p>
                      <p className="font-mono text-xs mt-0.5">{selectedUser.id}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">
                          Role
                        </p>
                        <span
                          className={`inline-block mt-1 px-2.5 py-0.5 rounded text-xs font-semibold uppercase ${
                            selectedUser.account?.role === "admin"
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300"
                          }`}
                        >
                          {selectedUser.account?.role || "user"}
                        </span>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground font-medium">
                          Fitness Level
                        </p>
                        <p className="font-semibold text-sm capitalize mt-1">
                          {selectedUser.fitnessLevel || "Not set"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">
                          Height / Weight
                        </p>
                        <p className="font-semibold text-sm mt-1">
                          {selectedUser.height ? `${selectedUser.height} cm` : "-"} /{" "}
                          {selectedUser.weight ? `${selectedUser.weight} kg` : "-"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground font-medium">
                          Fitness Goal
                        </p>
                        <p className="font-semibold text-sm capitalize mt-1">
                          {selectedUser.fitnessGoal
                            ? selectedUser.fitnessGoal.replace("-", " ")
                            : "Not set"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">
                          Workout Sessions
                        </p>
                        <p className="font-semibold text-sm mt-1">
                          {selectedUser.workoutsSessions || 0} sessions
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground font-medium">
                          Current Program
                        </p>
                        <p className="font-semibold text-sm mt-1">
                          {selectedUser.currentProgram || "No active program"}
                        </p>
                      </div>
                    </div>

                    {selectedUser.lastActive && (
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">
                          Last Active
                        </p>
                        <p className="font-semibold text-sm mt-1">
                          {new Date(selectedUser.lastActive).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 mt-6 pt-4 border-t border-border">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setSelectedUser(null)}
                    >
                      Close
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => {
                        handleDeleteUser(selectedUser);
                      }}
                      disabled={deleteUserMutation.isPending}
                    >
                      Delete User
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
