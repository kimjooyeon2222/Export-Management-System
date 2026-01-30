import { useState } from 'react';
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

export default function UserManagementPage() {
    // ✅ 임시 사용자 목록 (나중에 API로 대체)
    const users = [
        { id: 1, loginId: 'admin', company: 'ADMIN' },
        { id: 2, loginId: 'user01', company: '모텍' },
        { id: 3, loginId: 'user02', company: '오토텍' }
    ];

    const [selectedUserId, setSelectedUserId] = useState(users[0].id);

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

    const handleToggle = (pageId, type) => {
        setPermissions((prev) => ({
            ...prev,
            [pageId]: {
                ...prev[pageId],
                [type]: !prev[pageId][type]
            }
        }));
    };

    const handleSave = () => {
        console.log('SAVE', {
            userId: selectedUserId,
            permissions
        });
        // 👉 나중에 API 연결
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
                    >
                        {users.map((u) => (
                            <MenuItem
                                key={u.id}
                                value={u.id}
                                sx={{ fontWeight: 'bold' }}
                            >
                                {u.loginId} ({u.company})
                            </MenuItem>
                        ))}
                    </Select>
                </Box>

                <Button
                    variant="contained"
                    onClick={handleSave}
                    sx={{
                        fontWeight: 'bold',
                        height: 40
                    }}
                >
                    저장
                </Button>
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
                                        onChange={() => handleToggle(page.id, 'read')}
                                    />
                                </TableCell>

                                <TableCell align="center" sx={{ py: 0 }}>
                                    <Checkbox
                                        size="small"
                                        checked={permissions[page.id].write}
                                        onChange={() => handleToggle(page.id, 'write')}
                                    />
                                </TableCell>

                                <TableCell align="center" sx={{ py: 0 }}>
                                    <Checkbox
                                        size="small"
                                        checked={permissions[page.id].delete}
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
