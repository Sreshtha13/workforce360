import type { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { authCookieOptions } from "../lib/cookies";
import { sendSuccess, sendError } from "../lib/response";
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
      
      res.cookie("accessToken", result.accessToken, authCookieOptions(15 * 60 * 1000));
      res.cookie("refreshToken", result.refreshToken, authCookieOptions(7 * 24 * 60 * 60 * 1000));
      
      sendSuccess(res, {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
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
      
      res.cookie("accessToken", result.accessToken, authCookieOptions(15 * 60 * 1000));
      res.cookie("refreshToken", result.refreshToken, authCookieOptions(7 * 24 * 60 * 60 * 1000));
      
      sendSuccess(res, {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
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
      
      const result = await this.authService.refreshAccessToken(refreshToken);
      
      res.cookie("accessToken", result.accessToken, authCookieOptions(15 * 60 * 1000));
      
      sendSuccess(res, {
        accessToken: result.accessToken,
      });
    } catch (error) {
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
      
      res.clearCookie("accessToken", { path: "/" });
      res.clearCookie("refreshToken", { path: "/" });
      
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
}
