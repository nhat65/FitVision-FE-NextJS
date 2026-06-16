"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, User, Ruler, Scale, Calendar } from "lucide-react";
import { getAccessToken } from "@/lib/auth-store";
import { toast } from "sonner";

interface ProfileForm {
  fullName: string;
  dayOfBirth: string;
  height: string;
  weight: string;
  fitnessGoal: string;
  fitnessLevel: "beginner" | "intermediate" | "advanced";
}

export default function CreateProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<ProfileForm>({
    fullName: "",
    dayOfBirth: "",
    height: "",
    weight: "",
    fitnessGoal: "",
    fitnessLevel: "beginner",
  });

  // Check if user is logged in
  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  const handleChange = (field: keyof ProfileForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = getAccessToken();
      if (!token) {
        toast.error("You are not logged in");
        router.push("/login");
        return;
      }

      // Tạo FormData
      const formData = new FormData();
      formData.append("fullName", form.fullName);
      formData.append("dayOfBirth", form.dayOfBirth);
      formData.append("height", form.height);
      formData.append("weight", form.weight);
      formData.append("fitnessGoal", form.fitnessGoal);
      formData.append("fitnessLevel", form.fitnessLevel);

      console.log("FormData gửi đi:");
      for (const [key, value] of formData.entries()) {
        console.log(key, ":", value);
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // KHÔNG cần set Content-Type khi dùng FormData (browser sẽ tự set boundary)
        },
        body: formData,
      });

      const responseText = await res.text();
      console.log("Status:", res.status);
      console.log("Response:", responseText);

      if (!res.ok) {
        let errorMsg = `Error ${res.status}`;
        try {
          const errorData = JSON.parse(responseText);
          errorMsg = errorData.message || errorData.error || errorMsg;
        } catch (e) {}
        throw new Error(errorMsg);
      }

      toast.success("Profile created successfully! Welcome to FitVision 💪");

      setTimeout(() => {
        router.push("/");
      }, 1500);

    } catch (error: any) {
      console.error("Submit error:", error);
      toast.error(error.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-6">
      <div className="w-full max-w-2xl">
        <Button
          variant="ghost"
          onClick={() => router.push("/")}
          className="mb-6 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <User className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-3xl">Complete Your Profile</CardTitle>
            <p className="text-muted-foreground mt-2">
              This information helps our AI Coach create the most suitable workout plan for you.
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={form.fullName}
                  onChange={(e) => handleChange("fullName", e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="dateOfBirth"
                    type="date"
                    className="pl-10"
                    value={form.dayOfBirth}
                    onChange={(e) => handleChange("dayOfBirth", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="height">Height (cm)</Label>
                  <div className="relative">
                    <Ruler className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="height"
                      type="number"
                      className="pl-10"
                      value={form.height}
                      onChange={(e) => handleChange("height", e.target.value)}
                      placeholder="170"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <div className="relative">
                    <Scale className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="weight"
                      type="number"
                      className="pl-10"
                      value={form.weight}
                      onChange={(e) => handleChange("weight", e.target.value)}
                      placeholder="65"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fitnessGoal">Main Fitness Goal</Label>
                <Select
                  value={form.fitnessGoal}
                  onValueChange={(v) => handleChange("fitnessGoal", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your goal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weight-loss">Weight Loss / Fat Loss</SelectItem>
                    <SelectItem value="muscle-gain">Muscle Gain / Bulking</SelectItem>
                    <SelectItem value="endurance">Improve Endurance</SelectItem>
                    <SelectItem value="flexibility">Flexibility & Health</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Fitness Level</Label>
                <Select
                  value={form.fitnessLevel}
                  onValueChange={(v: any) => handleChange("fitnessLevel", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base"
                disabled={loading}
              >
                {loading ? "Creating Profile..." : "Complete Profile & Start Journey"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}