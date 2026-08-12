import type { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { mfaService } from "../services/mfa.service";
import { authCookieOptions, clearAuthCookieOptions } from "../lib/cookies";
import { getAccessTokenMaxAgeMs, getRefreshTokenMaxAgeMs } from "../lib/token-expiry";
import { sendSuccess, sendError } from "../lib/response";
import { AppError } from "../lib/app-error";
import type {
  LoginInput,
  GoogleLoginInput,
  RefreshTokenInput,
  RequestPasswordResetInput,
  ResetPasswordInput,
} from "../schemas/auth.schema";

export class AuthController {
  private authService: AuthService;
  
  constructor() {
    this.authService = new AuthService();
  }

  private setSessionCookies(
    res: Response,
    tokens: { accessToken: string; refreshToken: string },
  ): void {
    res.cookie(
      "accessToken",
      tokens.accessToken,
      authCookieOptions(getAccessTokenMaxAgeMs()),
    );
    res.cookie(
      "refreshToken",
      tokens.refreshToken,
      authCookieOptions(getRefreshTokenMaxAgeMs()),
    );
  }

  private clearSessionCookies(res: Response): void {
    const options = clearAuthCookieOptions();
    res.clearCookie("accessToken", options);
    res.clearCookie("refreshToken", options);
  }
  
  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body as LoginInput;
      const ipAddress = req.ip;
      const userAgent = req.get("user-agent");
      
      const result = await this.authService.login(
        email,
        password,
        ipAddress,
        userAgent,
      );

      if ("mfaRequired" in result && result.mfaRequired) {
        sendSuccess(res, {
          mfaRequired: true,
          mfaSetupRequired: result.mfaSetupRequired,
          mfaToken: result.mfaToken,
          user: result.user,
        });
        return;
      }
      
      this.setSessionCookies(res, {
        accessToken: result.accessToken!,
        refreshToken: result.refreshToken!,
      });
      
      sendSuccess(res, { mfaRequired: false, user: result.user });
    } catch (error) {
      sendError(res, 401, {
        code: "LOGIN_FAILED",
        message: error instanceof Error ? error.message : "Login failed",
      });
    }
  };
  
  googleLogin = async (req: Request, res: Response): Promise<void> => {
    try {
      const { code } = req.body as GoogleLoginInput;
      const ipAddress = req.ip;
      const userAgent = req.get("user-agent");
      
      const result = await this.authService.googleLogin(
        code,
        ipAddress,
        userAgent,
      );

      if ("mfaRequired" in result && result.mfaRequired) {
        sendSuccess(res, {
          mfaRequired: true,
          mfaSetupRequired: result.mfaSetupRequired,
          mfaToken: result.mfaToken,
          user: result.user,
        });
        return;
      }
      
      this.setSessionCookies(res, {
        accessToken: result.accessToken!,
        refreshToken: result.refreshToken!,
      });
      
      sendSuccess(res, { mfaRequired: false, user: result.user });
    } catch (error) {
      sendError(res, 401, {
        code: "GOOGLE_LOGIN_FAILED",
        message: error instanceof Error ? error.message : "Google login failed",
      });
    }
  };
  
  refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const refreshToken =
        req.cookies?.refreshToken || (req.body as RefreshTokenInput).refreshToken;
      
      if (!refreshToken) {
        sendError(res, 400, {
          code: "MISSING_REFRESH_TOKEN",
          message: "Refresh token is required",
        });
        return;
      }
      
      const result = await this.authService.refreshSession(refreshToken);
      
      this.setSessionCookies(res, result);
      
      sendSuccess(res, { message: "Session refreshed" });
    } catch (error) {
      this.clearSessionCookies(res);
      sendError(res, 401, {
        code: "REFRESH_FAILED",
        message: error instanceof Error ? error.message : "Token refresh failed",
      });
    }
  };
  
  logout = async (req: Request, res: Response): Promise<void> => {
    try {
      const refreshToken = req.cookies?.refreshToken;
      
      if (refreshToken) {
        await this.authService.logout(refreshToken);
      }
      
      this.clearSessionCookies(res);
      
      sendSuccess(res, { message: "Logged out successfully" });
    } catch (error) {
      sendError(res, 500, {
        code: "LOGOUT_FAILED",
        message: error instanceof Error ? error.message : "Logout failed",
      });
    }
  };
  
  requestPasswordReset = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body as RequestPasswordResetInput;
      
      await this.authService.requestPasswordReset(email);
      
      sendSuccess(res, {
        message: "If the email exists, a password reset link has been sent",
      });
    } catch (error) {
      sendError(res, 500, {
        code: "PASSWORD_RESET_REQUEST_FAILED",
        message: error instanceof Error ? error.message : "Password reset request failed",
      });
    }
  };
  
  resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token, password } = req.body as ResetPasswordInput;
      
      await this.authService.resetPassword(token, password);
      
      sendSuccess(res, {
        message: "Password reset successfully",
      });
    } catch (error) {
      sendError(res, 400, {
        code: "PASSWORD_RESET_FAILED",
        message: error instanceof Error ? error.message : "Password reset failed",
      });
    }
  };
  
  getMe = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        sendError(res, 401, {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        });
        return;
      }
      
      const user = await this.authService.getMe(req.user.userId);
      
      sendSuccess(res, user);
    } catch (error) {
      sendError(res, 500, {
        code: "GET_ME_FAILED",
        message: error instanceof Error ? error.message : "Failed to get user info",
      });
    }
  };

  mfaVerify = async (req: Request, res: Response): Promise<void> => {
    try {
      const { mfaToken, code } = req.body as { mfaToken: string; code: string };
      const result = await mfaService.verifyChallenge(mfaToken, code, {
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });
      this.setSessionCookies(res, {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
      sendSuccess(res, { user: result.user, mfaRequired: false });
    } catch (error) {
      const status = error instanceof AppError ? error.statusCode : 401;
      sendError(res, status, {
        code: error instanceof AppError ? error.code : "MFA_VERIFY_FAILED",
        message: error instanceof Error ? error.message : "MFA verification failed",
      });
    }
  };

  mfaSetupChallenge = async (req: Request, res: Response): Promise<void> => {
    try {
      const { mfaToken } = req.body as { mfaToken: string };
      const data = await mfaService.setupChallenge(mfaToken);
      sendSuccess(res, data);
    } catch (error) {
      const status = error instanceof AppError ? error.statusCode : 400;
      sendError(res, status, {
        code: error instanceof AppError ? error.code : "MFA_SETUP_FAILED",
        message: error instanceof Error ? error.message : "MFA setup failed",
      });
    }
  };

  mfaEnableChallenge = async (req: Request, res: Response): Promise<void> => {
    try {
      const { mfaToken, code } = req.body as { mfaToken: string; code: string };
      const result = await mfaService.enableChallenge(mfaToken, code, {
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });
      this.setSessionCookies(res, {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
      sendSuccess(res, {
        enabled: result.enabled,
        backupCodes: result.backupCodes,
        user: result.user,
        mfaRequired: false,
      });
    } catch (error) {
      const status = error instanceof AppError ? error.statusCode : 400;
      sendError(res, status, {
        code: error instanceof AppError ? error.code : "MFA_ENABLE_FAILED",
        message: error instanceof Error ? error.message : "MFA enable failed",
      });
    }
  };

  mfaSetup = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = await mfaService.setup(req.user!.userId);
      sendSuccess(res, data);
    } catch (error) {
      const status = error instanceof AppError ? error.statusCode : 500;
      sendError(res, status, {
        code: error instanceof AppError ? error.code : "MFA_SETUP_FAILED",
        message: error instanceof Error ? error.message : "MFA setup failed",
      });
    }
  };

  mfaEnable = async (req: Request, res: Response): Promise<void> => {
    try {
      const { code } = req.body as { code: string };
      const data = await mfaService.enable(req.user!.userId, code);
      sendSuccess(res, data);
    } catch (error) {
      const status = error instanceof AppError ? error.statusCode : 400;
      sendError(res, status, {
        code: error instanceof AppError ? error.code : "MFA_ENABLE_FAILED",
        message: error instanceof Error ? error.message : "MFA enable failed",
      });
    }
  };

  mfaDisable = async (req: Request, res: Response): Promise<void> => {
    try {
      const { code } = req.body as { code: string };
      const data = await mfaService.disable(req.user!.userId, code);
      sendSuccess(res, data);
    } catch (error) {
      const status = error instanceof AppError ? error.statusCode : 400;
      sendError(res, status, {
        code: error instanceof AppError ? error.code : "MFA_DISABLE_FAILED",
        message: error instanceof Error ? error.message : "MFA disable failed",
      });
    }
  };

  mfaStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = await mfaService.getStatus(req.user!.userId);
      sendSuccess(res, data);
    } catch (error) {
      sendError(res, 500, {
        code: "MFA_STATUS_FAILED",
        message: error instanceof Error ? error.message : "Failed to get MFA status",
      });
    }
  };

  listDevices = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = await mfaService.listDevices(req.user!.userId);
      sendSuccess(res, data);
    } catch (error) {
      sendError(res, 500, {
        code: "DEVICES_LIST_FAILED",
        message: error instanceof Error ? error.message : "Failed to list devices",
      });
    }
  };

  revokeDevice = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = await mfaService.revokeDevice(req.user!.userId, req.params.id);
      sendSuccess(res, data);
    } catch (error) {
      const status = error instanceof AppError ? error.statusCode : 500;
      sendError(res, status, {
        code: error instanceof AppError ? error.code : "DEVICE_REVOKE_FAILED",
        message: error instanceof Error ? error.message : "Failed to revoke device",
      });
    }
  };
}
