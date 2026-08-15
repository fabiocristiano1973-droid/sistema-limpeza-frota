import { NextRequest, NextResponse } from "next/server";
import { decodificarSessao, SESSION_COOKIE_NAME } from "@/lib/auth/session";

// Next.js 16 roda Proxy no runtime Node.js por padrão, então node:crypto
// (usado em session.ts) funciona normalmente aqui.

const ROTAS_PUBLICAS = ["/login"];
const ROTA_TROCAR_SENHA = "/trocar-senha";
const PREFIXOS_ADMIN = ["/cadastros"];
const PREFIXOS_GESTOR_OU_ADMIN = ["/dashboard"];

function comecaCom(pathname: string, prefixos: string[]): boolean {
  return prefixos.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (ROTAS_PUBLICAS.includes(pathname)) {
    return NextResponse.next();
  }

  const sessao = decodificarSessao(request.cookies.get(SESSION_COOKIE_NAME)?.value);

  if (!sessao) {
    const url = new URL("/login", request.url);
    return NextResponse.redirect(url);
  }

  // Senha provisória (definida na criação do usuário ou num reset feito por
  // admin): bloqueia qualquer outra tela até a troca ser concluída. Vem
  // antes das checagens de perfil de propósito — a exigência de troca
  // independe do que o usuário tentou acessar.
  if (sessao.deveTrocarSenha && pathname !== ROTA_TROCAR_SENHA) {
    return NextResponse.redirect(new URL(ROTA_TROCAR_SENHA, request.url));
  }

  if (comecaCom(pathname, PREFIXOS_ADMIN) && sessao.perfil !== "ADMIN") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (comecaCom(pathname, PREFIXOS_GESTOR_OU_ADMIN) && sessao.perfil === "INSPETOR") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
