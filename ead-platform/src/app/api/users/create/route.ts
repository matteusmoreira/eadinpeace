import { clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password, firstName, lastName } = body;

        if (!email || !password || !firstName || !lastName) {
            return NextResponse.json(
                { error: "Campos obrigatórios: email, password, firstName, lastName" },
                { status: 400 }
            );
        }

        // Criar usuário no Clerk com senha (sem verificação de email)
        const clerk = await clerkClient();
        const user = await clerk.users.createUser({
            emailAddress: [email],
            password: password,
            firstName: firstName,
            lastName: lastName,
            skipPasswordChecks: true, // Permite senhas mais simples
            skipPasswordRequirement: false,
        });

        return NextResponse.json({
            success: true,
            clerkId: user.id,
            email: user.emailAddresses[0]?.emailAddress,
        });
    } catch (error: any) {
        console.error("Erro ao criar usuário no Clerk:", error);

        // Tratar erros específicos do Clerk
        if (error.errors) {
            const clerkErrors = error.errors.map((e: any) => e.message).join(", ");
            return NextResponse.json(
                { error: clerkErrors },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: error.message || "Erro ao criar usuário" },
            { status: 500 }
        );
    }
}
