import PropTypes from 'prop-types';
import { useRef, useState } from 'react';

// material-ui
import ButtonBase from '@mui/material/ButtonBase';
import CardContent from '@mui/material/CardContent';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

// project imports
import Avatar from 'components/@extended/Avatar';
import MainCard from 'components/MainCard';
import Transitions from 'components/@extended/Transitions';

// assets
import LogoutOutlined from '@ant-design/icons/LogoutOutlined';
import avatargroup from 'assets/images/users/avatar-group.png';
import avatar1 from 'assets/images/users/avatar-1.png'; 

// ==============================|| HEADER CONTENT - PROFILE ||============================== //

export default function Profile() {
  const anchorRef = useRef(null);
  const [open, setOpen] = useState(false);

const role = localStorage.getItem('role');   // admin | user

const isAdmin = role === 'admin';
const displayName = isAdmin ? '관리자' : '사용자';
const displayRole = isAdmin ? 'Administrator' : 'User';
const avatarSrc = isAdmin ? avatargroup : avatar1;

  const handleToggle = () => {
    setOpen((prev) => !prev);
  };

  const handleClose = (event) => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) return;
    setOpen(false);
  };

  // 🔥 로그아웃 로직
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('role');
    window.location.href = '/login';
  };

  return (
    <Box sx={{ flexShrink: 0, ml: 0.75 }}>
      <ButtonBase
        ref={anchorRef}
        onClick={handleToggle}
        sx={{
          p: 0.25,
          borderRadius: 1,
          '&:hover': { bgcolor: 'secondary.lighter' }
        }}
      >
        <Stack direction="row" sx={{ gap: 1.25, alignItems: 'center', p: 0.5 }}>
          <Avatar alt="profile user" src={avatarSrc} size="sm" />
          <Typography variant="subtitle1">{displayName}</Typography>

        </Stack>
      </ButtonBase>

      <Popper
        placement="bottom-end"
        open={open}
        anchorEl={anchorRef.current}
        transition
        disablePortal
      >
        {({ TransitionProps }) => (
          <Transitions type="grow" position="top-right" in={open} {...TransitionProps}>
            <Paper sx={{ width: 220 }}>
              <ClickAwayListener onClickAway={handleClose}>
                <MainCard content={false} elevation={0}>
                  <CardContent>
                    <Grid container direction="column" spacing={2}>
                      <Grid>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Avatar src={avatarSrc} />
                          <Stack>
                              <Typography variant="h6">{displayName}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {displayRole}
                            </Typography>
                          </Stack>
                        </Stack>
                      </Grid>

                      <Grid>
                        <Button
                          fullWidth
                          color="error"
                          variant="outlined"
                          startIcon={<LogoutOutlined />}
                          onClick={handleLogout}
                        >
                          Logout
                        </Button>
                      </Grid>
                    </Grid>
                  </CardContent>
                </MainCard>
              </ClickAwayListener>
            </Paper>
          </Transitions>
        )}
      </Popper>
    </Box>
  );
}

Profile.propTypes = {};
