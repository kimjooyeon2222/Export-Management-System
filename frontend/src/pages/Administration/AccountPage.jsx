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
    const handleClose = () => {
        setOpen(false);
        setNewUser({
            loginId: '',
            user_name: '',
            phone: '',
            email: '',
            biz_no: '',
            company: '',
            password: ''
        });
    };

    const [editingUsers, setEditingUsers] = useState({});

    const [isEditMode, setIsEditMode] = useState(false);

    const [users, setUsers] = useState([]);

    const [open, setOpen] = useState(false);
    const [newUser, setNewUser] = useState({
        loginId: '',
        user_name: '',
        phone: '',
        email: '',
        biz_no: '',
        company: '',
        password: ''
    });

    useEffect(() => {
        if (isEditMode) {
            const map = {};
            users.forEach(u => {
                map[u.id] = {
                    login_id: u.login_id,
                    user_name: u.user_name || '',
                    phone: u.phone || '',
                    email: u.email || '',
                    biz_no: u.biz_no || '',
                    company: u.company,
                    password: ''
                };
            });
            setEditingUsers(map);
        } else {
            setEditingUsers({});
        }
    }, [isEditMode, users]);


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
    const handleUpdateUser = async (userId) => {
        const payload = editingUsers[userId];

        try {
            const res = await apiFetch(
                `${API_BASE}/api/admin/users/${userId}`,
                {
                    method: 'PUT',
                    body: JSON.stringify(payload)
                }
            );

            const data = await res.json();
            if (!res.ok) {
                alert(data.error || '수정 실패');
                return;
            }
            alert('저장 완료');
            fetchUsers(); // 🔄 갱신
        } catch (e) {
            console.error('유저 수정 실패:', e);
            alert('사용자 수정 오류');
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
                    user_name: newUser.user_name,
                    phone: newUser.phone,
                    email: newUser.email,
                    biz_no: newUser.biz_no,
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
            setNewUser({
                loginId: '',
                user_name: '',
                phone: '',
                email: '',
                biz_no: '',
                company: '',
                password: ''
            });

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
                            <TableCell sx={{ fontWeight: 'bold' }}>사용자명</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>휴대전화</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>이메일</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>회사</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>사업자번호</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>비밀번호</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                                저장
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                                삭제
                            </TableCell>
                        </TableRow>
                    </TableHead>


                    <TableBody>
                        {users.map(user => (
                            <TableRow key={user.id}>
                                <TableCell sx={{ fontWeight: 'bold' }}>
                                    {isEditMode ? (
                                        <TextField
                                            size="small"
                                            value={editingUsers[user.id]?.login_id || ''}
                                            onChange={(e) =>
                                                setEditingUsers(prev => ({
                                                    ...prev,
                                                    [user.id]: {
                                                        ...prev[user.id],
                                                        login_id: e.target.value
                                                    }
                                                }))
                                            }
                                        />
                                    ) : (
                                        user.login_id
                                    )}
                                </TableCell>

                                <TableCell sx={{ fontWeight: 'bold' }}>
                                    {isEditMode ? (
                                        <TextField
                                            size="small"
                                            value={editingUsers[user.id]?.user_name || ''}
                                            onChange={(e) =>
                                                setEditingUsers(prev => ({
                                                    ...prev,
                                                    [user.id]: {
                                                        ...prev[user.id],
                                                        user_name: e.target.value
                                                    }
                                                }))
                                            }
                                        />
                                    ) : (
                                        user.user_name
                                    )}
                                </TableCell>

                                <TableCell sx={{ fontWeight: 'bold' }}>
                                    {isEditMode ? (
                                        <TextField
                                            size="small"
                                            value={editingUsers[user.id]?.phone || ''}
                                            onChange={(e) =>
                                                setEditingUsers(prev => ({
                                                    ...prev,
                                                    [user.id]: {
                                                        ...prev[user.id],
                                                        phone: e.target.value
                                                    }
                                                }))
                                            }
                                        />
                                    ) : (
                                        user.phone
                                    )}
                                </TableCell>

                                <TableCell sx={{ fontWeight: 'bold' }}>
                                    {isEditMode ? (
                                        <TextField
                                            size="small"
                                            value={editingUsers[user.id]?.email || ''}
                                            onChange={(e) =>
                                                setEditingUsers(prev => ({
                                                    ...prev,
                                                    [user.id]: {
                                                        ...prev[user.id],
                                                        email: e.target.value
                                                    }
                                                }))
                                            }
                                        />
                                    ) : (
                                        user.email
                                    )}
                                </TableCell>

                                <TableCell sx={{ fontWeight: 'bold' }}>
                                    {isEditMode ? (
                                        <TextField
                                            size="small"
                                            value={editingUsers[user.id]?.company || ''}
                                            onChange={(e) =>
                                                setEditingUsers(prev => ({
                                                    ...prev,
                                                    [user.id]: {
                                                        ...prev[user.id],
                                                        company: e.target.value
                                                    }
                                                }))
                                            }
                                        />
                                    ) : (
                                        user.company
                                    )}
                                </TableCell>

                                <TableCell sx={{ fontWeight: 'bold' }}>
                                    {isEditMode ? (
                                        <TextField
                                            size="small"
                                            value={editingUsers[user.id]?.biz_no || ''}
                                            onChange={(e) =>
                                                setEditingUsers(prev => ({
                                                    ...prev,
                                                    [user.id]: {
                                                        ...prev[user.id],
                                                        biz_no: e.target.value
                                                    }
                                                }))
                                            }
                                        />
                                    ) : (
                                        user.biz_no
                                    )}
                                </TableCell>

                                <TableCell>
                                    {isEditMode && (
                                        <TextField
                                            size="small"
                                            type="password"
                                            placeholder="변경 시 입력"
                                            value={editingUsers[user.id]?.password || ''}
                                            onChange={(e) =>
                                                setEditingUsers(prev => ({
                                                    ...prev,
                                                    [user.id]: {
                                                        ...prev[user.id],
                                                        password: e.target.value
                                                    }
                                                }))
                                            }
                                        />
                                    )}
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
                                <TableCell align="center">
                                    {isEditMode && (
                                        <Button
                                            size="small"
                                            variant="contained"
                                            sx={{ fontWeight: 'bold' }}
                                            onClick={() => handleUpdateUser(user.id)}
                                        >
                                            저장
                                        </Button>
                                    )}
                                </TableCell>

                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Paper>

            {/* 사용자 추가 다이얼로그 */}
            <Dialog open={open} onClose={handleClose}>

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
                    />

                    <TextField
                        label="사용자명"
                        value={newUser.user_name}
                        onChange={(e) =>
                            setNewUser(prev => ({ ...prev, user_name: e.target.value }))
                        }
                    />

                    <TextField
                        label="휴대전화"
                        value={newUser.phone}
                        onChange={(e) =>
                            setNewUser(prev => ({ ...prev, phone: e.target.value }))
                        }
                    />

                    <TextField
                        label="이메일"
                        value={newUser.email}
                        onChange={(e) =>
                            setNewUser(prev => ({ ...prev, email: e.target.value }))
                        }
                    />

                    <TextField
                        label="사업자번호"
                        value={newUser.biz_no}
                        onChange={(e) =>
                            setNewUser(prev => ({ ...prev, biz_no: e.target.value }))
                        }
                    />

                    <TextField
                        label="회사"
                        value={newUser.company}
                        onChange={(e) =>
                            setNewUser(prev => ({ ...prev, company: e.target.value }))
                        }
                    />

                    <TextField
                        label="비밀번호"
                        type="password"
                        value={newUser.password}
                        onChange={(e) =>
                            setNewUser(prev => ({ ...prev, password: e.target.value }))
                        }
                    />
                </DialogContent>


                <DialogActions>
                    <Button sx={{ fontWeight: 'bold' }} onClick={handleClose}>
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
