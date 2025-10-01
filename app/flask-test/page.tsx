'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface User {
  id: number;
  name: string;
  email: string;
}

interface ApiResponse {
  users?: User[];
  count?: number;
  message?: string;
  status?: string;
}

export default function FlaskIntegration() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users');
      const data: ApiResponse = await response.json();
      
      if (data.users) {
        setUsers(data.users);
        setMessage(`Fetched ${data.count} users from Flask API`);
      } else {
        setMessage(data.message || 'No data received');
      }
    } catch (error) {
      setMessage('Error fetching users from Flask API');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const testHealth = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/health');
      const data: ApiResponse = await response.json();
      setMessage(`Health check: ${data.status}`);
    } catch (error) {
      setMessage('Error checking Flask API health');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const testPythonExample = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/python-example');
      const data: ApiResponse = await response.json();
      setMessage(data.message || 'Python example endpoint called');
    } catch (error) {
      setMessage('Error calling Python example endpoint');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Flask API Integration</CardTitle>
          <CardDescription>
            Test the Python Flask API integration with Next.js
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 flex-wrap">
            <Button 
              onClick={testHealth} 
              disabled={loading}
              variant="outline"
            >
              Test Health
            </Button>
            <Button 
              onClick={fetchUsers} 
              disabled={loading}
              variant="outline"
            >
              Fetch Users
            </Button>
            <Button 
              onClick={testPythonExample} 
              disabled={loading}
              variant="outline"
            >
              Python Example
            </Button>
          </div>
          
          {message && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-blue-800">{message}</p>
            </div>
          )}
          
          {users.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Users from Flask API:</h3>
              <div className="grid gap-3">
                {users.map((user) => (
                  <div key={user.id} className="p-3 border rounded-md bg-gray-50">
                    <p className="font-medium">{user.name}</p>
                    <p className="text-gray-600">{user.email}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
