"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar as CalendarIcon, CheckCircle, XCircle } from "lucide-react";
import { AttendanceStatus } from "@/types/attendance";

export default function AttendancePage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const queryClient = useQueryClient();

  const { data: todayAttendance, isLoading: todayLoading } = useQuery({
    queryKey: ["attendance", "today"],
    queryFn: () => apiClient.attendance.getToday(),
  });

  const { data: monthRecords, isLoading: monthLoading } = useQuery({
    queryKey: ["attendance", "month", selectedDate],
    queryFn: () => {
      const startDate = format(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1), "yyyy-MM-dd");
      const endDate = format(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0), "yyyy-MM-dd");
      return apiClient.attendance.list({ startDate, endDate });
    },
  });

  const checkInMutation = useMutation({
    mutationFn: () => apiClient.attendance.checkIn({
      date: format(new Date(), "yyyy-MM-dd"),
      checkIn: new Date().toISOString(),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: () => {
      if (!todayAttendance?.id) throw new Error("No check-in found");
      return apiClient.attendance.checkOut({
        id: todayAttendance.id,
        checkOut: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
  });

  const getStatusColor = (status: AttendanceStatus) => {
    const colors = {
      [AttendanceStatus.PRESENT]: "bg-green-500",
      [AttendanceStatus.ABSENT]: "bg-red-500",
      [AttendanceStatus.HALF_DAY]: "bg-yellow-500",
      [AttendanceStatus.LATE]: "bg-orange-500",
      [AttendanceStatus.ON_LEAVE]: "bg-blue-500",
      [AttendanceStatus.HOLIDAY]: "bg-purple-500",
      [AttendanceStatus.WEEKEND]: "bg-gray-500",
    };
    return colors[status] || "bg-gray-500";
  };

  const stats = monthRecords ? {
    present: monthRecords.filter(r => r.status === AttendanceStatus.PRESENT).length,
    absent: monthRecords.filter(r => r.status === AttendanceStatus.ABSENT).length,
    late: monthRecords.filter(r => r.status === AttendanceStatus.LATE).length,
    onLeave: monthRecords.filter(r => r.status === AttendanceStatus.ON_LEAVE).length,
  } : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Attendance</h1>
        <p className="text-muted-foreground">Track your daily attendance and working hours</p>
      </div>

      {/* Today's Attendance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Today's Attendance
          </CardTitle>
          <CardDescription>{format(new Date(), "EEEE, MMMM d, yyyy")}</CardDescription>
        </CardHeader>
        <CardContent>
          {todayLoading ? (
            <div>Loading...</div>
          ) : todayAttendance ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Check In</p>
                  <p className="text-2xl font-bold">{todayAttendance.checkIn ? format(new Date(todayAttendance.checkIn), "hh:mm a") : "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Check Out</p>
                  <p className="text-2xl font-bold">{todayAttendance.checkOut ? format(new Date(todayAttendance.checkOut), "hh:mm a") : "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Hours</p>
                  <p className="text-2xl font-bold">{todayAttendance.hours || "—"}</p>
                </div>
                <Badge className={getStatusColor(todayAttendance.status)}>
                  {todayAttendance.status}
                </Badge>
              </div>
              {!todayAttendance.checkOut && (
                <Button
                  onClick={() => checkOutMutation.mutate()}
                  disabled={checkOutMutation.isPending}
                  variant="outline"
                  className="w-full"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Check Out
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-muted-foreground">You haven't checked in today</p>
              <Button
                onClick={() => checkInMutation.mutate()}
                disabled={checkInMutation.isPending}
                className="w-full"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Check In Now
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Statistics */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Present</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.present}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Absent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.absent}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Late</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.late}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">On Leave</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.onLeave}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Calendar View */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Monthly Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            className="rounded-md border"
          />
        </CardContent>
      </Card>
    </div>
  );
}
