"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  CheckCircle2,
  Mail,
  User,
  Zap,
  Lock,
  LogOut,
} from "lucide-react";
import { getAccessToken } from "@/lib/auth-store";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  height: number;
  weight: number;
  dateOfBirth?: string; // ← Thêm trường này
  fitnessLevel: "beginner" | "intermediate" | "advanced";
  fitnessGoal: "weight-loss" | "muscle-gain" | "endurance" | "flexibility";
  gender?: "male" | "female" | "other";
  createdAt?: string;
  updatedAt?: string;
  account: {
    email: string;
  };
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isHydrated, setIsHydrated] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    height: "",
    weight: "",
    dateOfBirth: "", // ← Thêm
    fitnessLevel: "",
    fitnessGoal: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Fetch profile từ API
  const fetchUserProfile = async () => {
    try {
      const token = getAccessToken();
      if (!token) {
        router.push("/login");
        return;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/profile`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!res.ok) throw new Error("Failed to fetch profile");

      const result = await res.json();
      const profile = result.data || result;
      
      setUser(profile);
      setFormData({
        name: profile.fullName || "",
        height: profile.height?.toString() || "",
        weight: profile.weight?.toString() || "",
        dateOfBirth: profile.dateOfBirth || "",
        fitnessLevel: profile.fitnessLevel || "",
        fitnessGoal: profile.fitnessGoal || "",
      });
    } catch (error) {
      console.error(error);
      setErrorMessage("Không thể tải thông tin profile");
    }
  };

  useEffect(() => {
    fetchUserProfile();
    setIsHydrated(true);
  }, [router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const token = getAccessToken();

      const formDatas = new FormData();
      formDatas.append("id", user?.id ?? "");
      formDatas.append("fullName", formData.name);
      formDatas.append("height", formData.height);
      formDatas.append("weight", formData.weight);
      formDatas.append("dateOfBirth", formData.dateOfBirth);
      formDatas.append("fitnessLevel", formData.fitnessLevel);
      formDatas.append("fitnessGoal", formData.fitnessGoal);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDatas,
      });

      if (!res.ok) throw new Error("Update failed");

      const result = await res.json();
      const updatedProfile = result.data || result;

      setUser(updatedProfile);
      setSuccessMessage("Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      setErrorMessage("Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ... (phần handleChangePassword và handleLogout giữ nguyên)

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrorMessage("New passwords do not match.");
      setIsLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setErrorMessage("New password must be at least 6 characters long.");
      setIsLoading(false);
      return;
    }

    try {
      const token = getAccessToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/change-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            currentPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword,
          }),
        },
      );

      if (!res.ok) throw new Error("Password change failed");

      setSuccessMessage("Password changed successfully!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      setErrorMessage("Current password is incorrect or update failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    // Xóa thêm các key khác nếu cần
    router.push("/login");
  };

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 pt-24 pb-12 w-full">
        <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
            <p className="mt-2 text-muted-foreground">
              Manage your account settings and personal information
            </p>
          </div>

          {successMessage && (
            <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/30 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <p className="text-green-600 text-sm">{successMessage}</p>
            </div>
          )}

          {errorMessage && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-red-600 text-sm">{errorMessage}</p>
            </div>
          )}

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Profile</span>
              </TabsTrigger>
              <TabsTrigger value="fitness" className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span className="hidden sm:inline">Fitness</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                <span className="hidden sm:inline">Security</span>
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                  <CardDescription>
                    Your account details and contact information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email" className="text-base">
                      Email Address
                    </Label>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/30 border border-border">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{user?.account?.email}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Email cannot be changed
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="Your name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      disabled={!isEditing}
                      className="bg-secondary/30"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          dateOfBirth: e.target.value,
                        })
                      }
                      disabled={!isEditing}
                      className="bg-secondary/30"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    {!isEditing ? (
                      <Button
                        onClick={() => setIsEditing(true)}
                        variant="default"
                      >
                        Edit Profile
                      </Button>
                    ) : (
                      <>
                        <Button
                          onClick={handleUpdateProfile}
                          disabled={isLoading}
                          className="flex-1"
                        >
                          {isLoading ? "Saving..." : "Save Changes"}
                        </Button>
                        <Button
                          onClick={() => {
                            setIsEditing(false);
                            if (user) {
                              setFormData({
                                name: user.name,
                                dateOfBirth: user.dateOfBirth || "",
                                height: user.height.toString(),
                                weight: user.weight.toString(),
                                fitnessLevel: user.fitnessLevel,
                                fitnessGoal: user.fitnessGoal,
                              });
                            }
                          }}
                          variant="outline"
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Fitness Tab */}
            <TabsContent value="fitness" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Fitness Profile</CardTitle>
                  <CardDescription>
                    Your fitness level and personal goals
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="height">Height (cm)</Label>
                      <Input
                        id="height"
                        type="number"
                        placeholder="170"
                        value={formData.height}
                        onChange={(e) =>
                          setFormData({ ...formData, height: e.target.value })
                        }
                        disabled={!isEditing}
                        className="bg-secondary/30"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="weight">Weight (kg)</Label>
                      <Input
                        id="weight"
                        type="number"
                        placeholder="70"
                        value={formData.weight}
                        onChange={(e) =>
                          setFormData({ ...formData, weight: e.target.value })
                        }
                        disabled={!isEditing}
                        className="bg-secondary/30"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="level">Fitness Level</Label>
                    <Select
                      value={formData.fitnessLevel}
                      onValueChange={(value) =>
                        setFormData({ ...formData, fitnessLevel: value })
                      }
                      disabled={!isEditing}
                    >
                      <SelectTrigger id="level" className="bg-secondary/30">
                        <SelectValue placeholder="Select your fitness level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">
                          Intermediate
                        </SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="goal">Fitness Goal</Label>
                    <Select
                      value={formData.fitnessGoal}
                      onValueChange={(value) =>
                        setFormData({ ...formData, fitnessGoal: value })
                      }
                      disabled={!isEditing}
                    >
                      <SelectTrigger id="goal" className="bg-secondary/30">
                        <SelectValue placeholder="Select your fitness goal" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weight-loss">Weight Loss</SelectItem>
                        <SelectItem value="muscle-gain">Muscle Gain</SelectItem>
                        <SelectItem value="endurance">Endurance</SelectItem>
                        <SelectItem value="flexibility">Flexibility</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-3 pt-4">
                    {!isEditing ? (
                      <Button
                        onClick={() => setIsEditing(true)}
                        variant="default"
                      >
                        Edit Fitness Profile
                      </Button>
                    ) : (
                      <>
                        <Button
                          onClick={handleUpdateProfile}
                          disabled={isLoading}
                          className="flex-1"
                        >
                          {isLoading ? "Saving..." : "Save Changes"}
                        </Button>
                        <Button
                          onClick={() => {
                            setIsEditing(false);
                            if (user) {
                              setFormData({
                                name: user.name,
                                dateOfBirth: user.dateOfBirth || "",
                                height: user.height.toString(),
                                weight: user.weight.toString(),
                                fitnessLevel: user.fitnessLevel,
                                fitnessGoal: user.fitnessGoal,
                              });
                            }
                          }}
                          variant="outline"
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>
                    Update your password to keep your account secure
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input
                        id="current-password"
                        type="password"
                        placeholder="Enter your current password"
                        value={passwordData.currentPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            currentPassword: e.target.value,
                          })
                        }
                        className="bg-secondary/30"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        placeholder="Enter your new password"
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            newPassword: e.target.value,
                          })
                        }
                        className="bg-secondary/30"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="confirm-password">Confirm Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="Confirm your new password"
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            confirmPassword: e.target.value,
                          })
                        }
                        className="bg-secondary/30"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full"
                    >
                      {isLoading ? "Updating..." : "Update Password"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="border-red-500/30 bg-red-500/5">
                <CardHeader>
                  <CardTitle className="text-red-600">Logout</CardTitle>
                  <CardDescription>Sign out from your account</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleLogout}
                    variant="destructive"
                    className="w-full flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout from All Devices
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}
