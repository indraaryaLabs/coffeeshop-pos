import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest } from "next/server";

const { GET: authGET, POST: authPOST } = toNextJsHandler(auth);

export async function POST(req: NextRequest) {
	return authPOST(req);
}

export async function GET(req: NextRequest) {
	return authGET(req);
}
