import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { 
  Users, 
  Building2, 
  MapPin, 
  DollarSign, 
  Shield, 
  AlertTriangle,
  TrendingUp,
  Calendar
} from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}

function StatCard({ title, value, icon, trend, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {trend && (
            <div className={`flex items-center mt-2 text-sm ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              <TrendingUp className={`h-4 w-4 mr-1 ${!trend.isPositive ? 'rotate-180' : ''}`} />
              <span>{Math.abs(trend.value)}% from last month</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { state } = useApp();
  const { dashboardStats } = state;

  const recentActivities = [
    {
      id: 1,
      type: 'employee',
      message: 'New employee John Smith added to the system',
      time: '2 hours ago',
      icon: <Users className="h-4 w-4" />,
    },
    {
      id: 2,
      type: 'client',
      message: 'Client contract renewed for Downtown Mall',
      time: '4 hours ago',
      icon: <Building2 className="h-4 w-4" />,
    },
    {
      id: 3,
      type: 'alert',
      message: 'Security certificate expiring soon for 3 guards',
      time: '6 hours ago',
      icon: <AlertTriangle className="h-4 w-4" />,
    },
    {
      id: 4,
      type: 'site',
      message: 'New site location added: Corporate Plaza',
      time: '1 day ago',
      icon: <MapPin className="h-4 w-4" />,
    },
  ];

  const upcomingTasks = [
    {
      id: 1,
      task: 'Review monthly performance reports',
      dueDate: 'Today',
      priority: 'high',
    },
    {
      id: 2,
      task: 'Process payroll for guard staff',
      dueDate: 'Tomorrow',
      priority: 'high',
    },
    {
      id: 3,
      task: 'Client meeting: Metro Shopping Center',
      dueDate: 'Dec 15',
      priority: 'medium',
    },
    {
      id: 4,
      task: 'Update security protocols documentation',
      dueDate: 'Dec 18',
      priority: 'low',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Employees"
          value={dashboardStats.totalEmployees}
          icon={<Users className="h-6 w-6" />}
          trend={{ value: 12, isPositive: true }}
          color="blue"
        />
        <StatCard
          title="Active Guards"
          value={dashboardStats.activeGuards}
          icon={<Shield className="h-6 w-6" />}
          trend={{ value: 8, isPositive: true }}
          color="green"
        />
        <StatCard
          title="Total Clients"
          value={dashboardStats.totalClients}
          icon={<Building2 className="h-6 w-6" />}
          trend={{ value: 5, isPositive: true }}
          color="purple"
        />
        <StatCard
          title="Active Sites"
          value={dashboardStats.activeSites}
          icon={<MapPin className="h-6 w-6" />}
          trend={{ value: 3, isPositive: false }}
          color="yellow"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Monthly Revenue"
          value={`$${dashboardStats.monthlyRevenue.toLocaleString()}`}
          icon={<DollarSign className="h-6 w-6" />}
          trend={{ value: 15, isPositive: true }}
          color="green"
        />
        <StatCard
          title="Pending Incidents"
          value={dashboardStats.pendingIncidents}
          icon={<AlertTriangle className="h-6 w-6" />}
          color="red"
        />
        <StatCard
          title="Expiring Certifications"
          value={dashboardStats.expiringCertifications}
          icon={<Shield className="h-6 w-6" />}
          color="yellow"
        />
        <StatCard
          title="Upcoming Shifts"
          value={dashboardStats.upcomingShifts}
          icon={<Calendar className="h-6 w-6" />}
          color="blue"
        />
      </div>

      {/* Activity and Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="flex-shrink-0 p-2 bg-gray-100 rounded-lg">
                  {activity.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Tasks</h3>
          <div className="space-y-3">
            {upcomingTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{task.task}</p>
                  <p className="text-xs text-gray-500 mt-1">Due: {task.dueDate}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  task.priority === 'high' 
                    ? 'bg-red-100 text-red-800'
                    : task.priority === 'medium'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {task.priority}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}