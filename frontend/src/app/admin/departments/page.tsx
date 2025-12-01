import React from 'react';
import { fetchDepartments, type Department } from '@/lib/api/access';

export default async function DepartmentsPage() {
  const departments = await fetchDepartments().catch(() => []);
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Departments</h1>
      <div className="grid md:grid-cols-2 gap-4">
        {departments.map((d: Department) => (
          <div key={d.id} className="border rounded p-4">
            <h2 className="font-medium">{d.name}</h2>
            <p className="text-xs text-gray-500">{d.slug}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
