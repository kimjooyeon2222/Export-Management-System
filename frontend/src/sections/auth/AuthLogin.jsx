import PropTypes from 'prop-types';
import React from 'react';
import { Link as RouterLink } from 'react-router-dom';

// material-ui
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party
import * as Yup from 'yup';
import { Formik } from 'formik';

// project imports
import IconButton from 'components/@extended/IconButton';
import AnimateButton from 'components/@extended/AnimateButton';

// assets
import EyeOutlined from '@ant-design/icons/EyeOutlined';
import EyeInvisibleOutlined from '@ant-design/icons/EyeInvisibleOutlined';

// ============================|| JWT - LOGIN ||============================ //

export default function AuthLogin({ isDemo = false }) {
  const handleLogin = async (values) => {
  const res = await fetch(
  `${import.meta.env.VITE_API_URL}/api/auth/login`,
  {
    method: "POST",
          headers: {
        "Content-Type": "application/json"  
      },
    body: JSON.stringify(values)
  }
);


  const data = await res.json();

  if (res.ok) {
    localStorage.setItem("access_token", data.access_token);
localStorage.setItem("role", data.role);

    window.location.href = "/";
  } else {
    alert("로그인 실패");
  }
};


  const [showPassword, setShowPassword] = React.useState(false);
  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  return (
    <>
      <Formik
  initialValues={{
    login_id: '',
    password: ''
  }}
  validationSchema={Yup.object({
    login_id: Yup.string().required('ID is required'),
    password: Yup.string().required('Password is required')
  })}
  onSubmit={handleLogin}
>

        {({ errors, handleBlur, handleChange, handleSubmit, touched, values }) => (

         <form noValidate onSubmit={handleSubmit}>

            <Grid container spacing={3}>
              <Grid size={12}>
                <Stack sx={{ gap: 1 }}>
                  <InputLabel htmlFor="login-id">Login ID</InputLabel>
<OutlinedInput
  id="login-id"
  type="text"
  value={values.login_id}
  name="login_id"
  onBlur={handleBlur}
  onChange={handleChange}
  placeholder="Enter ID"
  fullWidth
/>

                </Stack>
                {touched.login_id && errors.login_id && (
  <FormHelperText error>
    {errors.login_id}
  </FormHelperText>
)}

              </Grid>
              <Grid size={12}>
                <Stack sx={{ gap: 1 }}>
                  <InputLabel htmlFor="password-login">Password</InputLabel>
                  <OutlinedInput
                    fullWidth
                    error={Boolean(touched.password && errors.password)}
                    id="-password-login"
                    type={showPassword ? 'text' : 'password'}
                    value={values.password}
                    name="password"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleClickShowPassword}
                          onMouseDown={handleMouseDownPassword}
                          edge="end"
                          color="secondary"
                        >
                          {showPassword ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                        </IconButton>
                      </InputAdornment>
                    }
                    placeholder="Enter password"
                  />
                </Stack>
                {touched.password && errors.password && (
                  <FormHelperText error id="standard-weight-helper-text-password-login">
                    {errors.password}
                  </FormHelperText>
                )}
              </Grid>
             
              <Grid size={12}>
                <AnimateButton>
                  <Button
  fullWidth
  size="large"
  variant="contained"
  type="submit"
>
  Login
</Button>

                </AnimateButton>
              </Grid>
            </Grid>
          </form>
        )}
      </Formik>
    </>
  );
}

AuthLogin.propTypes = { isDemo: PropTypes.bool };
