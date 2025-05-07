import React, { useEffect, useState } from 'react';
import { Modal, Button, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import axiosInstance from '../../utils/axiosInstance';

const UserTable = () => {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [openModal, setOpenModal] = useState(false);

    const fetchUsers = async () => {
        try {
            const response = await axiosInstance.get('/admin/users/');
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleEdit = (user) => {
        setSelectedUser(user);
        setOpenModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to deactivate this user?')) {
            try {
                await axiosInstance.delete(`/admin/users/${id}/`);
                setUsers(users.filter(user => user.id !== id));
            } catch (error) {
                console.error('Error deleting user:', error);
            }
        }
    };

    return (
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {users.map((user) => (
                <div
                    key={user.id}
                    className="bg-white p-5 shadow-md rounded-lg flex flex-col justify-between"
                >
                    <div>
                        <h2 className="text-lg font-semibold">{user.name}</h2>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <p className={`text-sm mt-1 ${user.is_active ? 'text-green-600' : 'text-red-600'}`}>
                            {user.is_active ? 'Active' : 'Inactive'}
                        </p>
                    </div>

                    <div className="mt-4 flex gap-3 justify-end">
                        <Button
                            variant="contained"
                            size="small"
                            onClick={() => handleEdit(user)}
                        >
                            Edit
                        </Button>
                        <Button
                            variant="contained"
                            color="error"
                            size="small"
                            onClick={() => handleDelete(user.id)}
                        >
                            Delete
                        </Button>
                    </div>
                </div>
            ))}

            {/* Global Modal for editing */}
            <EditUserModal
                user={selectedUser}
                open={openModal}
                onClose={() => setOpenModal(false)}
                onSave={fetchUsers}
            />
        </div>
    );
};

const EditUserModal = ({ user, open, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone_number: '',
        address: '',
        role: '',
        is_active: true,
    });

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                phone_number: user.phone_number || '',
                address: user.address || '',
                role: user.role || '',
                is_active: user.is_active ?? true,
            });
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async () => {
        try {
            await axiosInstance.put(`/admin/users/${user.id}/`, formData);
            onSave();
            onClose();
        } catch (error) {
            console.error('Error updating user:', error);
        }
    };

    return (
        <Modal open={open} onClose={onClose}>
            <div className="flex justify-center items-center min-h-screen bg-black bg-opacity-50">
                <div className="bg-white p-8 rounded-lg shadow-lg w-96">
                    <h2 className="text-xl font-semibold mb-4">Edit User</h2>

                    <div className="mb-4">
                        <TextField
                            label="Name"
                            variant="outlined"
                            fullWidth
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="mb-4">
                        <TextField
                            label="Email"
                            variant="outlined"
                            fullWidth
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="mb-4">
                        <TextField
                            label="Phone Number"
                            variant="outlined"
                            fullWidth
                            name="phone_number"
                            value={formData.phone_number}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="mb-4">
                        <TextField
                            label="Address"
                            variant="outlined"
                            fullWidth
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="mb-4">
                        <FormControl fullWidth>
                            <InputLabel>Role</InputLabel>
                            <Select
                                label="Role"
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                            >
                                <MenuItem value="user">User</MenuItem>
                                <MenuItem value="admin">Admin</MenuItem>
                                <MenuItem value="doctor">Doctor</MenuItem>
                            </Select>
                        </FormControl>
                    </div>

                    <div className="mb-4">
                        <FormControl fullWidth>
                            <InputLabel>Status</InputLabel>
                            <Select
                                label="Status"
                                name="is_active"
                                value={formData.is_active}
                                onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
                            >
                                <MenuItem value="true">Active</MenuItem>
                                <MenuItem value="false">Inactive</MenuItem>
                            </Select>
                        </FormControl>
                    </div>

                    <div className="flex justify-end space-x-4">
                        <Button variant="contained" color="primary" onClick={handleSubmit}>
                            Save
                        </Button>
                        <Button variant="outlined" color="secondary" onClick={onClose}>
                            Cancel
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default UserTable;
