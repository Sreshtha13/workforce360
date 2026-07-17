import { OAuth2Client } from "google-auth-library";
import { env } from "./env";

let oauthClient: OAuth2Client | null = null;

export function getGoogleOAuthClient(): OAuth2Client | null {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    return null;
  }
  
  if (!oauthClient) {
    oauthClient = new OAuth2Client(
      env.GOOGLE_CLIENT_ID,
      env.GOOGLE_CLIENT_SECRET,
      env.GOOGLE_REDIRECT_URI,
    );
  }
  
  return oauthClient;
}

export function generateGoogleAuthUrl(): string | null {
  const client = getGoogleOAuthClient();
  if (!client) {
    return null;
  }
  
  return client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ],
  });
}

export type GoogleUserInfo = {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture?: string;
};

export async function verifyGoogleToken(
  code: string,
): Promise<GoogleUserInfo | null> {
  const client = getGoogleOAuthClient();
  if (!client) {
    return null;
  }
  
  try {
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);
    
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    if (!payload) {
      return null;
    }
    
    return {
      id: payload.sub,
      email: payload.email!,
      verified_email: payload.email_verified!,
      name: payload.name!,
      given_name: payload.given_name!,
      family_name: payload.family_name!,
      picture: payload.picture,
    };
  } catch (error) {
    console.error("Google OAuth verification failed:", error);
    return null;
  }
}
