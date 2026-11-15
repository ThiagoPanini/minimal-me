---
status: accepted
date: 2026-11-14
---

# Entrada do Autor por chave de acesso, com better-auth na web

Só o Autor entra no Minimal Me, para publicar em Frames & Fables; o Visitante não tem conta. Decidimos que o Autor entra com chave de acesso (passkey), sem senha, e que um link enviado por e-mail registra a chave num aparelho novo. Há uma conta só, configurada no servidor, sem cadastro, e o primeiro aparelho também nasce pelo link. A entrada roda na aplicação web, com o better-auth e os plugins de passkey e de magic link (com `disableSignUp`), e a API interna em Python confia num token curto que a web emite a cada chamada do Autor, como o JWT interno do life-under-control. O endereço da tela de entrar não tem link em nenhuma página pública, leva `noindex` e tem limite de tentativas. O e-mail do link sai pelo Resend.

## Considered Options

- **Auth.js v5 com o provedor de passkey**, o molde do life-under-control e do travelmanager: o projeto passou a fazer parte do Better Auth, e o provedor de passkey é "experimental and not yet recommended for production use" (authjs.dev, lido em 2026-11-14).
- **API em Python como autoridade**, como no travelmanager: deixaria a entrada inteira em Python, mas com a chave de acesso e o link por e-mail em código próprio, que é mais código de segurança para manter.
- **better-auth na web, com token curto para a API** (escolhida): a biblioteca do ethitorial, com plugins para chave de acesso e link por e-mail, e o token no padrão do life-under-control.

## Consequences

- É um desvio declarado da frota: nenhum projeto usa chave de acesso nem link por e-mail. A justificativa é o estado do Auth.js e o caso do Minimal Me, com Visitante anônimo e um só Autor (lacuna L4 da [consolidação do inventário](https://github.com/ThiagoPanini/minimal-me/issues/10)).
- As tabelas do better-auth ficam num banco próprio, dono delas. A API não as lê e continua dona única do DDL dela (ADR 0002).
- Perder todas as chaves se resolve pelo link por e-mail. Perder também o acesso ao e-mail fica fora do MVP e se resolve à mão no servidor.
- O e-mail do Autor é segredo de configuração e nunca entra no repositório.
- O Resend pede um domínio de envio, com registros na zona da Cloudflare. Sessão, recuperação, revogação de aparelho, limites e custo ficam na [pesquisa da entrada](https://github.com/ThiagoPanini/minimal-me/issues/37).
- O desenho da tela de entrar sai do [redesenho do publicador](https://github.com/ThiagoPanini/minimal-me/issues/39); o comportamento, desta decisão e da pesquisa.
