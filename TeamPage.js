import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const TeamPage = () => {
  const { teamId } = useParams();
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({ title: '', description: '', assignee: '', dueDate: '' });

  useEffect(() => {
    const fetchTasks = async () => {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:3001/api/tasks?teamId=${teamId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(res.data);
    };
    fetchTasks();
  }, [teamId]);

  const addTask = async () => {
    const token = localStorage.getItem('token');
    const res = await axios.post('http://localhost:3001/api/tasks', { ...newTask, teamId }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setTasks([...tasks, res.data]);
    setNewTask({ title: '', description: '', assignee: '', dueDate: '' });
  };

  const updateTask = async (id, status) => {
    const token = localStorage.getItem('token');
    await axios.put(`http://localhost:3001/api/tasks/${id}`, { status }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setTasks(tasks.map(t => t._id === id ? { ...t, status } : t));
  };

  return (
    <div>
      <h1>Team Planner for {teamId}</h1>
      <div>
        <input placeholder="Title" value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} />
        <input placeholder="Description" value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} />
        <input placeholder="Assignee" value={newTask.assignee} onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })} />
        <input type="date" value={newTask.dueDate} onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })} />
        <button onClick={addTask}>Add Task</button>
      </div>
      {['To Do', 'In Progress', 'Done'].map(status => (
        <div key={status}>
          <h3>{status}</h3>
          {tasks.filter(t => t.status === status).map(task => (
            <div key={task._id} onClick={() => updateTask(task._id, status === 'To Do' ? 'In Progress' : 'Done')}>
              <p>{task.title} - {task.assignee}</p>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default TeamPage;