from django.urls import path
from .views import (
    RegisterUserView,
    ActivationView,
    LoginView,
    LoginOTPVerifyView,  # ✅ Use this instead of VerifyOTP
    RoleBasedAccess,
    LogoutView,
    ResendActivationOTPView,
    ResendLoginOTPView,
    ForgotPasswordView,
    ResetPasswordView,
    
)

urlpatterns = [
    path("register/", RegisterUserView.as_view(), name="register"),
    path("activate/", ActivationView.as_view(), name="activate"),
    path("login/", LoginView.as_view(), name="login"),
    path("verify-login-otp/", LoginOTPVerifyView.as_view(), name="verify_login_otp"),  # ✅ Fixed
    path("role-access/", RoleBasedAccess.as_view(), name="role_access"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path('resend-activation-otp/', ResendActivationOTPView.as_view(), name='resend-activation-otp'),
    path("resend-login-otp/", ResendLoginOTPView.as_view(), name="resend_login_otp"),
    path("forgot-password/", ForgotPasswordView.as_view(), name="forgot_password"),
    path("reset-password/", ResetPasswordView.as_view(), name="reset_password"),
    

    # path("resend-activation/", ResendActivationLinkView.as_view(), name="resend_activation_link"),    
]
