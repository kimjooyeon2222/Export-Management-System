import { useState, useEffect } from 'react';
import { apiFetch } from 'api/apiFetch';

import {
    Box,
    Typography,
    Paper,
    Divider,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Checkbox,
    Select,
    MenuItem,
    Button
} from '@mui/material';

import { PERMISSION_PAGES } from './permissionPages';
import { useNavigate } from 'react-router-dom';
export default function UserManagementPage() {
    const API_BASE = import.meta.env.VITE_API_URL;
    const [users, setUsers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState('');
    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await apiFetch(`${API_BASE}/api/admin/users`);
            const list = await res.json();

            // 🔥 admin 제외
            const filtered = Array.isArray(list)
                ? list.filter(u => u.role !== 'admin')
                : [];

            setUsers(filtered);

            // 🔥 최초 사용자 자동 선택
            if (filtered.length > 0 && !selectedUserId) {
                setSelectedUserId(filtered[0].id);
            }

        } catch (e) {
            console.error('유저 목록 로딩 실패:', e);
            setUsers([]);
        }
    };

    const navigate = useNavigate();
    const actionBtnSx = {
        height: 40,
        px: 2,
        fontWeight: 700,          // ✅ bold 유지
        fontSize: 14,
        textTransform: 'none',
    };

    const handleToggleEditMode = () => {
        setIsEditMode(prev => !prev);
    };

    const [isEditMode, setIsEditMode] = useState(false);



    // ✅ 권한 상태
    const [permissions, setPermissions] = useState(() =>
        PERMISSION_PAGES.reduce((acc, page) => {
            acc[page.id] = {
                read: false,
                write: false,
                delete: false
            };
            return acc;
        }, {})
    );

    // 🔥 선택된 사용자 권한 불러오기
    useEffect(() => {
        if (!selectedUserId) return;

        (async () => {
            try {
                const res = await apiFetch(
                    `${API_BASE}/api/admin/users/${selectedUserId}/permissions`
                );
                const data = await res.json();

                const next = {};
                PERMISSION_PAGES.forEach(p => {
                    next[p.id] = data[p.id] || {
                        read: false,
                        write: false,
                        delete: false
                    };
                });

                setPermissions(next);
            } catch (e) {
                console.error('권한 로딩 실패:', e);
            }
        })();
    }, [selectedUserId]);


    const handleToggle = (pageId, type) => {
        setPermissions((prev) => ({
            ...prev,
            [pageId]: {
                ...prev[pageId],
                [type]: !prev[pageId][type]
            }
        }));
    };

    const handleSave = async () => {
        if (!selectedUserId) return;

        try {
            await apiFetch(
                `${API_BASE}/api/admin/users/${selectedUserId}/permissions`,
                {
                    method: 'POST',
                    body: JSON.stringify(permissions)
                }
            );
            alert('저장 완료');
            setIsEditMode(false); // 선택
        } catch (e) {
            console.error('권한 저장 실패:', e);
            alert('저장 실패');
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            {/* 제목 */}
            <Typography variant="h4" fontWeight="bold" gutterBottom>
                사용자 권한 관리
            </Typography>

            <Typography
                variant="body2"
                color="text.secondary"
                fontWeight="bold"
            >
                사용자별 업무 페이지 접근 권한을 설정합니다.
            </Typography>

            <Divider sx={{ my: 3 }} />

            {/* 사용자 선택 + 저장 버튼 */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'space-between',
                    mb: 3
                }}
            >
                <Box sx={{ maxWidth: 300 }}>
                    <Typography
                        variant="subtitle2"
                        fontWeight="bold"
                        sx={{ mb: 1 }}
                    >
                        사용자 선택
                    </Typography>

                    <Select
                        fullWidth
                        value={selectedUserId}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                        sx={{ fontWeight: 'bold' }}
                        MenuProps={{
                            PaperProps: {
                                sx: {
                                    ml: 0,
                                    pl: 0,
                                    maxHeight: 40 * 10,   // ⭐ 사용자 10명 기준
                                    overflowY: 'auto',   // ⭐ 넘치면 스크롤
                                },
                            },
                            anchorOrigin: {
                                vertical: 'bottom',
                                horizontal: 'left',
                            },
                            transformOrigin: {
                                vertical: 'top',
                                horizontal: 'left',
                            },
                        }}

                    >

                        {users.map((u) => (
                            <MenuItem
                                key={u.id}
                                value={u.id}
                                sx={{ fontWeight: 'bold' }}
                            >
                                {/* 🔥 company (role) */}
                                {u.user_name} ({u.company})

                            </MenuItem>
                        ))}
                    </Select>

                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                    {isEditMode && (
                        <>
                            <Button
                                variant="outlined"
                                color="secondary"
                                sx={{ fontWeight: 'bold', height: 40 }}
                                onClick={() => navigate('/admin/accounts')}
                            >
                                사용자 계정 관리
                            </Button>

                            <Button
                                variant="contained"
                                onClick={handleSave}
                                sx={{
                                    ...actionBtnSx,
                                    backgroundColor: '#1E3A8A',   // 남색 (navy)
                                    boxShadow: 'none',
                                    '&:hover': {
                                        backgroundColor: '#172554', // 더 진한 남색
                                        boxShadow: 'none',
                                    },
                                }}
                            >
                                저장
                            </Button>

                        </>
                    )}
                    <Button
                        variant="outlined"
                        onClick={handleToggleEditMode}
                        sx={{
                            borderColor: isEditMode ? 'grey.500' : 'primary.main',
                            color: isEditMode ? 'grey.700' : 'primary.main',
                            fontWeight: 'bold',
                            height: 40
                        }}
                    >
                        {isEditMode ? '수정 종료' : '수정'}
                    </Button>




                </Box>

            </Box>

            {/* 권한 테이블 */}
            <Paper sx={{ p: 2 }}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>
                                페이지
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                                읽기
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                                수정
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                                삭제
                            </TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {PERMISSION_PAGES.map((page) => (
                            <TableRow key={page.id} sx={{ height: 32 }}>
                                <TableCell sx={{ fontWeight: 'bold', py: 0.5 }}>
                                    {page.name}
                                </TableCell>

                                <TableCell align="center" sx={{ py: 0 }}>
                                    <Checkbox
                                        size="small"
                                        checked={permissions[page.id].read}
                                        disabled={!isEditMode}
                                        onChange={() => handleToggle(page.id, 'read')}
                                    />

                                </TableCell>

                                <TableCell align="center" sx={{ py: 0 }}>
                                    <Checkbox
                                        size="small"
                                        checked={permissions[page.id].write}
                                        disabled={!isEditMode}
                                        onChange={() => handleToggle(page.id, 'write')}
                                    />
                                </TableCell>

                                <TableCell align="center" sx={{ py: 0 }}>
                                    <Checkbox
                                        size="small"
                                        checked={permissions[page.id].delete}
                                        disabled={!isEditMode}
                                        onChange={() => handleToggle(page.id, 'delete')}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>

                </Table>
            </Paper>
        </Box>
    );
}
