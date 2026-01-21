import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import { useTable } from 'react-table';

const AdminPage = () => {
  const [progress, setProgress] = useState({});
  const [reports, setReports] = useState([]);
  const [sortBy, setSortBy] = useState('team');
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      const progressRes = await axios.get('http://localhost:3001/api/progress', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProgress(progressRes.data);

      const reportsRes = await axios.get(`http://localhost:3001/api/user-reports?sortBy=${sortBy}&filter=${filter}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReports(reportsRes.data);
    };
    fetchData();
  }, [sortBy, filter]);

  const data = {
    labels: Object.keys(progress),
    datasets: [{ label: 'Avg Task Progress %', data: Object.values(progress) }]
  };

  const columns = [
    { Header: sortBy === 'team' ? 'Team ID' : 'User ID', accessor: '_id' },
    { Header: 'Avg Clock-In Hour', accessor: 'avgClockIn' },
    { Header: 'Avg Hours Worked', accessor: 'avgHours' }
  ];

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = useTable({ columns, data: reports });

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <Bar data={data} />
      <div>
        <select onChange={(e) => setSortBy(e.target.value)}>
          <option value="team">Sort by Team</option>
          <option value="employee">Sort by Employee</option>
        </select>
        <input placeholder="Filter (e.g., team1)" onChange={(e) => setFilter(e.target.value)} />
      </div>
      <table {...getTableProps()}>
        <thead>
          {headerGroups.map(headerGroup => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map(column => (
                <th {...column.getHeaderProps()}>{column.render('Header')}</th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map(row => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()}>
                {row.cells.map(cell => (
                  <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default AdminPage;
