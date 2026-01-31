import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Button,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import { apiFetch } from 'api/apiFetch';

const API_BASE = import.meta.env.VITE_API_URL;

export default function UserAccountPage() {
    const [isEditMode, setIsEditMode] = useState(false);
    const [users, setUsers] = useState([]);

    const [open, setOpen] = useState(false);
    const [newUser, setNewUser] = useState({
        loginId: '',
        company: '',
        password: ''
    });

    /* =========================
       사용자 목록 로드
    ========================= */
    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await apiFetch(`${API_BASE}/api/admin/users`);
            const list = await res.json();

            // 🔥 admin 계정 숨김
            const filtered = Array.isArray(list)
                ? list.filter(u => u.role !== 'admin')
                : [];

            setUsers(filtered);
        } catch (e) {
            console.error('유저 로딩 실패:', e);
            setUsers([]);
        }
    };

    /* =========================
       사용자 추가
    ========================= */
    const handleAddUser = async () => {
        if (!newUser.loginId || !newUser.password) {
            alert('Login ID와 비밀번호는 필수입니다.');
            return;
        }

        try {
            const res = await apiFetch(`${API_BASE}/api/admin/users`, {
                method: 'POST',
                body: JSON.stringify({
                    login_id: newUser.loginId,
                    company: newUser.company,
                    password: newUser.password,
                    role: 'user'
                })
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.error || '사용자 생성 실패');
                return;
            }

            setOpen(false);
            setNewUser({ loginId: '', company: '', password: '' });
            fetchUsers(); // 🔄 목록 갱신
        } catch (e) {
            console.error('유저 추가 실패:', e);
            alert('사용자 생성 중 오류 발생');
        }
    };

    /* =========================
       사용자 삭제
    ========================= */
    const handleDeleteUser = async (id) => {
        if (!window.confirm('정말 삭제하시겠습니까?')) return;

        try {
            await apiFetch(`${API_BASE}/api/admin/users/${id}`, {
                method: 'DELETE'
            });

            fetchUsers();
        } catch (e) {
            console.error('유저 삭제 실패:', e);
            alert('삭제 실패');
        }
    };

    return (
        <Box sx={{ p: 2 }}>
            {/* 제목 */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2
                }}
            >
                <Typography variant="h4" fontWeight="bold">
                    사용자 계정 관리
                </Typography>

                <Box sx={{ display: 'flex', gap: 1 }}>
                    {isEditMode && (
                        <Button
                            variant="contained"
                            sx={{ fontWeight: 'bold' }}
                            onClick={() => setOpen(true)}
                        >
                            사용자 추가
                        </Button>
                    )}

                    <Button
                        variant={isEditMode ? 'outlined' : 'contained'}
                        sx={{ fontWeight: 'bold' }}
                        onClick={() => setIsEditMode(prev => !prev)}
                    >
                        {isEditMode ? '수정 종료' : '수정'}
                    </Button>
                </Box>
            </Box>

            <Paper>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Login ID</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>회사</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                                삭제
                            </TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {users.map(user => (
                            <TableRow key={user.id}>
                                <TableCell sx={{ fontWeight: 'bold' }}>
                                    {user.login_id}
                                </TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>
                                    {user.company}
                                </TableCell>
                                <TableCell align="center">
                                    {isEditMode && (
                                        <Button
                                            color="error"
                                            size="small"
                                            sx={{ fontWeight: 'bold' }}
                                            onClick={() => handleDeleteUser(user.id)}
                                        >
                                            삭제
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Paper>

            {/* 사용자 추가 다이얼로그 */}
            <Dialog open={open} onClose={() => setOpen(false)}>
                <DialogTitle sx={{ fontWeight: 'bold' }}>
                    사용자 추가
                </DialogTitle>

                <DialogContent
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                        mt: 1
                    }}
                >
                    <TextField
                        label="Login ID"
                        value={newUser.loginId}
                        onChange={(e) =>
                            setNewUser(prev => ({ ...prev, loginId: e.target.value }))
                        }
                        InputLabelProps={{ sx: { fontWeight: 'bold' } }}
                        InputProps={{ sx: { fontWeight: 'bold' } }}
                    />

                    <TextField
                        label="회사"
                        value={newUser.company}
                        onChange={(e) =>
                            setNewUser(prev => ({ ...prev, company: e.target.value }))
                        }
                        InputLabelProps={{ sx: { fontWeight: 'bold' } }}
                        InputProps={{ sx: { fontWeight: 'bold' } }}
                    />

                    <TextField
                        label="비밀번호"
                        type="password"
                        value={newUser.password}
                        onChange={(e) =>
                            setNewUser(prev => ({ ...prev, password: e.target.value }))
                        }
                        InputLabelProps={{ sx: { fontWeight: 'bold' } }}
                        InputProps={{ sx: { fontWeight: 'bold' } }}
                    />
                </DialogContent>

                <DialogActions>
                    <Button sx={{ fontWeight: 'bold' }} onClick={() => setOpen(false)}>
                        취소
                    </Button>
                    <Button
                        variant="contained"
                        sx={{ fontWeight: 'bold' }}
                        onClick={handleAddUser}
                    >
                        추가
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
