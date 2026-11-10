Uma linha de texto que responde a uma ação sem destino, centrada no pé da tela.

- **Você fornece**: a mensagem, numa frase: o status, um ponto médio e o que ainda não está disponível. Exemplo: "Em desenvolvimento · Frames & Fables ainda não está disponível."
- **Quando usar**: quando alguém aciona o link de uma frente que ainda não abre. Não use para erro de formulário nem para confirmação de ação concluída sem antes desenhar esses casos.
- Fica fixo a 20px do pé da tela, respeita a área segura do aparelho e nunca passa da largura da tela menos 32px.
- Aparece e some por opacidade em 0,5s e fica 2,6s visível. Anuncie com `role="status"`.
- Fundo `aviso-fundo`, borda `selo-borda`, texto em `miudo`, cor `luz`. Sem ícone e sem botão de fechar.
