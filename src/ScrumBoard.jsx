import { useEffect, useState } from 'react';
import { db } from './firebase';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc
} from 'firebase/firestore';

const roles = ['UX', 'Frontend', 'Backend'];

export default function ScrumBoard() {
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [newMember, setNewMember] = useState('');
  const [memberRole, setMemberRole] = useState('UX');
  const [newTask, setNewTask] = useState('');
  const [taskCategory, setTaskCategory] = useState('UX');

  const [filterCategory, setFilterCategory] = useState('');
  const [filterMember, setFilterMember] = useState('');
  const [sortOption, setSortOption] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const membersSnapshot = await getDocs(collection(db, 'members'));
      const tasksSnapshot = await getDocs(collection(db, 'assignments'));

      setMembers(membersSnapshot.docs.map(doc => doc.data()));
      setTasks(tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    fetchData();
  }, []);

  const addMember = async () => {
    if (!newMember) return alert('Fyll i namn');
    try {
      await addDoc(collection(db, 'members'), {
        name: newMember,
        role: memberRole
      });
      setMembers([...members, { name: newMember, role: memberRole }]);
      setNewMember('');
    } catch (error) {
      alert('Kunde inte spara medlem');
    }
  };

  const addTask = async () => {
    if (!newTask) return alert('Fyll i uppgiftstitel');
    try {
      const docRef = await addDoc(collection(db, 'assignments'), {
        title: newTask,
        category: taskCategory,
        timestamp: new Date().toISOString(),
        status: 'new',
        assignedTo: null
      });
      setTasks([...tasks, {
        id: docRef.id,
        title: newTask,
        category: taskCategory,
        timestamp: new Date().toISOString(),
        status: 'new',
        assignedTo: null
      }]);
      setNewTask('');
    } catch (error) {
      alert('Kunde inte spara uppgift');
    }
  };

  const assignTask = async (taskId, member) => {
    const taskRef = doc(db, 'assignments', taskId);
    try {
      await updateDoc(taskRef, {
        assignedTo: member.name,
        status: 'in progress'
      });
      setTasks(tasks.map(task =>
        task.id === taskId ? { ...task, assignedTo: member.name, status: 'in progress' } : task
      ));
    } catch (error) {
      alert('Kunde inte tilldela uppgift');
    }
  };

  const finishTask = async (taskId) => {
    const taskRef = doc(db, 'assignments', taskId);
    try {
      await updateDoc(taskRef, {
        status: 'finished'
      });
      setTasks(tasks.map(task =>
        task.id === taskId ? { ...task, status: 'finished' } : task
      ));
    } catch (error) {
      alert('Kunde inte markera uppgift som klar');
    }
  };

  const deleteTask = async (taskId) => {
    const taskRef = doc(db, 'assignments', taskId);
    try {
      await deleteDoc(taskRef);
      setTasks(tasks.filter(task => task.id !== taskId));
    } catch (error) {
      alert('Kunde inte radera uppgift');
    }
  };

  const applyFiltersAndSort = (tasks, status) => {
    let filtered = tasks.filter(task => task.status === status);

    if (filterCategory) {
      filtered = filtered.filter(task => task.category === filterCategory);
    }

    if (filterMember) {
      filtered = filtered.filter(task => task.assignedTo === filterMember);
    }

    if (sortOption === 'timestampAsc') {
      filtered.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    } else if (sortOption === 'timestampDesc') {
      filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } else if (sortOption === 'titleAsc') {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortOption === 'titleDesc') {
      filtered.sort((a, b) => b.title.localeCompare(a.title));
    }

    return filtered;
  };

  const renderTasks = (status) => (
    applyFiltersAndSort(tasks, status).map(task => (
      <div key={task.id} className="border p-4 mb-2 rounded bg-white">
        <p><strong>Task:</strong> {task.title}</p>
        <p><strong>Timestamp:</strong> {new Date(task.timestamp).toLocaleString()}</p>
        <p><strong>Category:</strong> {task.category}</p>
        {status === 'new' && (
          <select onChange={(e) => assignTask(task.id, members.find(m => m.name === e.target.value))} className="border p-2 w-full">
            <option>Välj medlem</option>
            {members.filter(m => m.role === task.category).map(m => (
              <option key={m.name} value={m.name}>{m.name}</option>
            ))}
          </select>
        )}
        {status === 'in progress' && (
          <>
            <p><strong>Assigned To:</strong> {task.assignedTo}</p>
            <button onClick={() => finishTask(task.id)} className="bg-green-500 text-white px-4 py-2 mt-2 rounded">Mark as Finished</button>
          </>
        )}
        {status === 'finished' && (
          <>
            <p><strong>Assigned To:</strong> {task.assignedTo}</p>
            <button onClick={() => deleteTask(task.id)} className="bg-red-500 text-white px-4 py-2 mt-2 rounded">Delete</button>
          </>
        )}
      </div>
    ))
  );

  return (
    <div className="p-4 grid gap-6">
      <div className="border p-4 space-y-2 bg-white rounded">
        <h2 className="text-xl font-bold">Add Team Member</h2>
        <input placeholder="Name" value={newMember} onChange={e => setNewMember(e.target.value)} className="border p-2 w-full" />
        <select onChange={e => setMemberRole(e.target.value)} value={memberRole} className="border p-2 w-full">
          {roles.map(role => <option key={role} value={role}>{role}</option>)}
        </select>
        <button onClick={addMember} className="bg-blue-500 text-white px-4 py-2 rounded">Add Member</button>
      </div>

      <div className="border p-4 space-y-2 bg-white rounded">
        <h2 className="text-xl font-bold">Add Task</h2>
        <input placeholder="Task title" value={newTask} onChange={e => setNewTask(e.target.value)} className="border p-2 w-full" />
        <select onChange={e => setTaskCategory(e.target.value)} value={taskCategory} className="border p-2 w-full">
          {roles.map(role => <option key={role} value={role}>{role}</option>)}
        </select>
        <button onClick={addTask} className="bg-blue-500 text-white px-4 py-2 rounded">Add Task</button>
      </div>

      <div className="border p-4 space-y-2 bg-white rounded">
        <h2 className="text-xl font-bold">Filter & Sort (In Progress Tasks)</h2>
        <select onChange={e => setFilterCategory(e.target.value)} value={filterCategory} className="border p-2 w-full">
          <option value="">All Categories</option>
          {roles.map(role => <option key={role} value={role}>{role}</option>)}
        </select>
        <select onChange={e => setFilterMember(e.target.value)} value={filterMember} className="border p-2 w-full">
          <option value="">All Members</option>
          {members.map(member => <option key={member.name} value={member.name}>{member.name}</option>)}
        </select>
        <select onChange={e => setSortOption(e.target.value)} value={sortOption} className="border p-2 w-full">
          <option value="">No Sort</option>
          <option value="timestampAsc">Timestamp: Oldest to Newest</option>
          <option value="timestampDesc">Timestamp: Newest to Oldest</option>
          <option value="titleAsc">Title: A to Z</option>
          <option value="titleDesc">Title: Z to A</option>
        </select>
      </div>

      <div>
        <h2 className="text-2xl font-bold">Tasks - New</h2>
        {renderTasks('new')}
      </div>
      <div>
        <h2 className="text-2xl font-bold">Tasks - In Progress</h2>
        {renderTasks('in progress')}
      </div>
      <div>
        <h2 className="text-2xl font-bold">Tasks - Finished</h2>
        {renderTasks('finished')}
      </div>
    </div>
  );
}
