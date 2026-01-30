import { useState } from 'react';
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

export default function UserAccountPage() {
    const [isEditMode, setIsEditMode] = useState(false);

    const [users, setUsers] = useState([
        { id: 1, loginId: 'admin', company: 'ADMIN' },
        { id: 2, loginId: 'user01', company: '모텍' },
        { id: 3, loginId: 'user02', company: '오토텍' }
    ]);

    const [open, setOpen] = useState(false);
    const [newUser, setNewUser] = useState({
        loginId: '',
        company: ''
    });

    const handleAddUser = () => {
        setUsers(prev => [
            ...prev,
            {
                id: Date.now(),
                ...newUser
            }
        ]);
        setNewUser({ loginId: '', company: '' });
        setOpen(false);
    };

    const handleDeleteUser = (id) => {
        setUsers(prev => prev.filter(u => u.id !== id));
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
                    {/* ✅ 사용자 추가 버튼 (수정 모드에서만) */}
                    {isEditMode && (
                        <Button
                            variant="contained"
                            sx={{ fontWeight: 'bold' }}
                            onClick={() => setOpen(true)}
                        >
                            사용자 추가
                        </Button>
                    )}
                    {/* ✅ 수정 / 수정 종료 버튼 (항상 표시) */}
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
                                    {user.loginId}
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
