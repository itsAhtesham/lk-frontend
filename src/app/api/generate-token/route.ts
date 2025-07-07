import { NextRequest, NextResponse } from "next/server";
import { AccessToken, RoomServiceClient } from "livekit-server-sdk";
import { v4 as uuid } from "uuid";

const livekitUrl = process.env.LIVEKIT_URL!;
const livekitApi = process.env.LIVEKIT_API_KEY!;
const livekitApiSecret = process.env.LIVEKIT_API_SECRET!;

const createAccessToken = async (
  userInfo: { identity: string; name?: string },
  grant: any
) => {
  const token = new AccessToken(livekitApi, livekitApiSecret, userInfo);

  token.addGrant(grant);

  return await token.toJwt();
};

export async function GET(req: NextRequest) {
  try {
    if (!livekitUrl || !livekitApi || !livekitApiSecret) {
      throw new Error("LiveKit credentials are not set");
    }

    const userId = new URL(req.url).searchParams.get("userId");
    if (!userId) {
      throw new Error("User ID is required");
    }

    const roomName = uuid();
    const roomClient = new RoomServiceClient(
      livekitUrl,
      livekitApi,
      livekitApiSecret
    );

    const room = await roomClient.createRoom({
      name: roomName,
    });

    const grant = {
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canPublishData: true,
      canSubscribe: true,
      canUpdateOwnMetadata: true,
    };

    const token = await createAccessToken(
      { identity: userId, name: "test" },
      grant
    );

    return NextResponse.json({ token, roomName }, { status: 200 });
  } catch (error) {
    console.error("Error generating token:", error);
    return NextResponse.json(
      { error: "Failed to generate token" },
      { status: 500 }
    );
  }
}
