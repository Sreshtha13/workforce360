"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, startOfWeek, endOfWeek, addWeeks } from "date-fns";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, ChevronLeft, ChevronRight, Clock } from "lucide-react";

export default function TimesheetsPage() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [isOpen, setIsOpen] = useState(false);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [hours, setHours] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");
  const [billable, setBillable] = useState(true);
  const queryClient = useQueryClient();

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });

  const { data: entries, isLoading } = useQuery({
    queryKey: ["timesheets", weekStart],
    queryFn: () => apiClient.timesheets.list({
      startDate: format(weekStart, "yyyy-MM-dd"),
      endDate: format(weekEnd, "yyyy-MM-dd"),
    }),
  });

  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: () => apiClient.pm.projects.list({}),
  });

  const createMutation = useMutation({
    mutationFn: () => apiClient.timesheets.create({
      date,
      hours: parseFloat(hours),
      description,
      projectId: projectId || undefined,
      billable,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timesheets"] });
      setIsOpen(false);
      resetForm();
    },
  });

  const resetForm = () => {
    setDate(format(new Date(), "yyyy-MM-dd"));
    setHours("");
    setDescription("");
    setProjectId("");
    setBillable(true);
  };

  const totalHours = entries?.reduce((sum, entry) => sum + Number(entry.hours), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Timesheets</h1>
          <p className="text-muted-foreground">Log your working hours</p>
        </div>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Log Time
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Log Time Entry</SheetTitle>
              <SheetDescription>Add a new timesheet entry</SheetDescription>
            </SheetHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Project (Optional)</Label>
                <Select value={projectId} onValueChange={setProjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {projects?.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Hours</Label>
                <Input
                  type="number"
                  step="0.25"
                  min="0"
                  max="24"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  placeholder="8.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What did you work on?"
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="billable"
                  checked={billable}
                  onCheckedChange={(checked) => setBillable(checked as boolean)}
                />
                <Label htmlFor="billable" className="text-sm font-normal cursor-pointer">
                  Billable
                </Label>
              </div>
              <Button
                onClick={() => createMutation.mutate()}
                disabled={!date || !hours || createMutation.isPending}
                className="w-full"
              >
                Log Time
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Week Navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentWeek(addWeeks(currentWeek, -1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <CardTitle>
              {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
            </CardTitle>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Weekly Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{totalHours.toFixed(2)} hours</div>
          <p className="text-sm text-muted-foreground mt-1">
            {entries?.length || 0} entries this week
          </p>
        </CardContent>
      </Card>

      {/* Timesheet Entries */}
      <Card>
        <CardHeader>
          <CardTitle>Time Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading...</div>
          ) : entries && entries.length > 0 ? (
            <div className="space-y-2">
              {entries.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{format(new Date(entry.date), "EEE, MMM d")}</p>
                      {entry.billable && (
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">Billable</span>
                      )}
                    </div>
                    {entry.project && (
                      <p className="text-sm text-muted-foreground">{entry.project.name}</p>
                    )}
                    {entry.description && (
                      <p className="text-sm text-muted-foreground">{entry.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{entry.hours}h</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No time entries for this week</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
