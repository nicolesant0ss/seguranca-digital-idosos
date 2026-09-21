let botaoLeituraAtivo = null;

function falar(texto, botao) {
  if (!('speechSynthesis' in window)) {
    alert('Seu navegador não oferece suporte à leitura em voz alta.');
    return;
  }

  const estavaFalandoEsteBotao = botaoLeituraAtivo === botao && window.speechSynthesis.speaking;

  window.speechSynthesis.cancel();
  if (botaoLeituraAtivo && botaoLeituraAtivo.dataset.textoOriginal) {
    botaoLeituraAtivo.textContent = botaoLeituraAtivo.dataset.textoOriginal;
  }
  botaoLeituraAtivo = null;

  // Se o usuário clicou de novo no botão que já estava lendo, o clique serve só para parar
  if (estavaFalandoEsteBotao) {
    return;
  }

  if (!botao.dataset.textoOriginal) {
    botao.dataset.textoOriginal = botao.textContent;
  }
  botao.textContent = '⏹️ Parar leitura';
  botaoLeituraAtivo = botao;

  const utterance = new SpeechSynthesisUtterance(texto);
  utterance.lang = 'pt-BR';
  utterance.rate = 0.95;

  utterance.onend = () => {
    botao.textContent = botao.dataset.textoOriginal;
    if (botaoLeituraAtivo === botao) botaoLeituraAtivo = null;
  };
  utterance.onerror = () => {
    botao.textContent = botao.dataset.textoOriginal;
    if (botaoLeituraAtivo === botao) botaoLeituraAtivo = null;
  };

  window.speechSynthesis.speak(utterance);
}

function pararTodasLeituras() {
  window.speechSynthesis.cancel();
  document.querySelectorAll('.botao-ouvir').forEach(function (btn) {
    if (btn.dataset.textoOriginal) btn.textContent = btn.dataset.textoOriginal;
  });
  botaoLeituraAtivo = null;
}

// adiciona automaticamente um botão "Ouvir" no topo de cada seção
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('main#conteudo-principal > section').forEach(function (secao) {
    const texto = secao.textContent.trim().replace(/\s+/g, ' ');
    if (!texto) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'botao-ouvir';
    btn.textContent = '🔊 Ouvir esta seção';
    btn.addEventListener('click', function () {
      falar(texto, btn);
    });
    secao.insertBefore(btn, secao.firstChild);
  });
});
/*  Alternar entre Site e Quiz  */
function mostrarQuizApp() {
  pararTodasLeituras();
  document.getElementById('conteudo-principal').style.display = 'none';
  document.getElementById('quiz-app').style.display = 'block';
  window.scrollTo(0, 0);
}
function mostrarSite() {
  pararTodasLeituras();
  document.getElementById('quiz-app').style.display = 'none';
  document.getElementById('conteudo-principal').style.display = '';
  window.scrollTo(0, 0);
}
// Os links do menu levam de volta ao site antes de rolar até a seção
document.querySelectorAll('.navegacao a').forEach(function (link) {
  link.addEventListener('click', function () {
    if (document.getElementById('quiz-app').style.display === 'block') {
      mostrarSite();
    }
  });
});

/* Lógica do Quiz  */
const perguntas = [
  {
    imagem: "pergunta01.jpeg",
    imagemAlt: "Pergunta 1",
    pergunta: "O que você (vítima) deve fazer ao receber uma mensagem de um(a) desconhecido(a) puxando conversa?",
    opcoes: [
      { texto: "Aceitar conversar porque você se sente sozinho(a) ultimamente e quer fazer novos(as) amigos(as).", certa: false, explicacao: "Errado. Sentir-se sozinho(a) não significa que seja seguro conversar com um desconhecido. É importante verificar quem é a pessoa antes de criar confiança." },
      { texto: "Responder com simpatia contando todos os detalhes da sua rotina e da sua família.", certa: false, explicacao: "Errado. Contar detalhes da sua rotina e da sua família para alguém desconhecido pode revelar informações pessoais que podem ser usadas contra você." },
      { texto: "Desconfiar e verificar quem é a pessoa antes de dar atenção e passar contatos.", certa: true, explicacao: "Correto! A história mostra 3 sinais clássicos: declaração de amor muitorápida, pedido de dinheiro urgente euma emergência inventada (o projeto na Nigéria). Esse padrão é conhecido como Love Bombing seguido de pedido financeiro. ." }
    ]
  },
  {
    imagem: "pergunta02.jpeg" ,
    imagemAlt:"Pergunta 2" ,
    pergunta: "Por que o golpista prefere mudar a conversa para o WhatsApp?",
    opcoes: [
      { texto: "Porque o WhatsApp é o único aplicativo que existe no celular dele(a).", certa: false, explicacao: "Errado. O fato de a pessoa usar apenas o WhatsApp não explica por que ela quer falar com você por lá. A mudança pode ser uma tentativa de deixar a conversa mais privada." },
      { texto: "Porque lá é mais privado e fica mais fácil de isolar e enganar a vítima.", certa: true, explicacao: "Correto! Levar a conversa para um aplicativo mais particular pode facilitar o isolamento e a manipulação da vítima." },
      { texto: "Porque ele(a) quer apenas ver suas fotos antigas.", certa: false, explicacao: "Errado. Ver fotos antigas não é uma justificativa suficiente para insistir em levar a conversa para outro aplicativo." }
    ]
  },
  {
    imagem: "pergunta03.jpeg",
    imagemAlt:"pergunta 3",
    pergunta: "Toda foto bonita na internet significa que a pessoa realmente é quem diz ser?",
    opcoes: [
      { texto: "Sim, as pessoas só colocam fotos verdadeiras na internet.", certa: false, explicacao: "Errado. Fotos podem ser copiadas ou usadas por outras pessoas. Por isso, uma foto bonita não prova a identidade de alguém." },
      { texto: "Sim, porque a rede social verifica a identidade de todo mundo.", certa: false, explicacao: "Errado. Redes sociais não garantem que todos os perfis sejam de pessoas realmente quem dizem ser." },
      { texto: "Não, golpistas costumam roubar fotos de pessoas famosas ou perfis alheios para fingir ser quem não são.", certa: true, explicacao: "Exato! Qualquer pessoa pode copiar fotos da internet e criar um perfil falso. Nunca confie apenas na aparência do perfil." }
    ]
  },
  {
    imagem:"pergunta04.jpeg",
    imagemAlt: "pergunta 4",
    pergunta: "O que significa quando alguém que acabou de se conhecer na internet declara amor eterno muito rápido?",
    opcoes: [
      { texto: "É sinal de que ele(a) é muito romântico(a) e sincero(a).", certa: false, explicacao: "Errado. Ser romântico não significa declarar amor eterno poucos dias depois de conhecer alguém. A rapidez e o exagero podem ser sinais de manipulação." },
      { texto: "É perfeitamente normal em qualquer amizade virtual.", certa: false, explicacao: "Errado. Não é algo que possa ser considerado normal em qualquer amizade virtual. É importante observar quando o carinho é exagerado e acontece rápido demais." },
      { texto: "É um sinal forte de golpe; eles usam isso para te envolver emocionalmente bem rápido.", certa: true, explicacao: "Correto! O carinho exagerado logo no início pode ser usado para criar confiança e envolver a vítima emocionalmente." }
    ]
  },
  {
    imagem: "pergunta05.jpeg",
    imagemAlt:"Pergunta 5",
    pergunta: "Qual é a desculpa clássica que os golpistas usam para nunca marcar um encontro pessoal?",
    opcoes: [
      { texto: "Convidar para tomar um café na padaria amanhã cedo.", certa: false, explicacao: "Errado. Se a pessoa realmente pretende se encontrar, marcar um encontro próximo e seguro seria possível. Essa alternativa não explica uma desculpa para evitar encontros." },
      { texto: "Dizer que mora longe, que trabalha viajando ou que está prestando serviço militar no exterior.", certa: true, explicacao: "Muito bem! Golpistas podem inventar que moram longe, viajam muito ou estão trabalhando no exterior para evitar encontros presenciais." },
      { texto: "Dizer que está sem tempo por causa da rotina, mas que poderá marcar um encontro em breve.", certa: false, explicacao: "Errado. Dizer que está sem tempo pode ser uma desculpa, mas não é a mesma situação de fingir que mora longe ou está sempre viajando." }
    ]
  },
  {
    imagem:"pergunta06.jpeg",
    imagemAlt:"Pergunta 6",
    pergunta: "Qual é o objetivo do golpista ao pedir para guardar segredo sobre a relação?",
    opcoes: [
      { texto: "Afastar a vítima da família para que ninguém perceba o golpe e a alerte.", certa: true, explicacao: "Exatamente! Pedir segredo pode afastar a vítima de pessoas que poderiam perceber os sinais do golpe e ajudá-la." },
      { texto: "Proteger o romance de fofocas maldosas.", certa: false, explicacao: "Errado. Um relacionamento saudável não precisa ser escondido por medo de fofocas. Pedir segredo pode ser uma forma de impedir que outras pessoas percebam o que está acontecendo." },
      { texto: "Porque ele(a) é uma pessoa tímida.", certa: false, explicacao: "Errado. Ser tímido(a) não é uma justificativa suficiente para impedir que a vítima converse sobre a relação com familiares ou amigos." }
    ]
  },
  {
    imagem:"pergunta07.jpeg",
    imagemAlt:"Pergunta 7",
    pergunta: "O que caracteriza o golpe nessa hora?",
    opcoes: [
      { texto: "O desespero repentino, a história trágica e a pressão por um Pix imediato.", certa: true, explicacao: "Isso mesmo! Uma emergência repentina acompanhada de uma história trágica e pressão por dinheiro deve ser vista com muita desconfiança." },
      { texto: "A calma e a paciência dele(a) para esperar a resolução com tranquilidade.", certa: false, explicacao: "Errado. A calma e a paciência para esperar não são características de uma situação em que alguém está tentando pressionar a vítima a enviar dinheiro imediatamente." },
      { texto: "O envio de comprovantes bancários autenticados em cartório antes de qualquer pedido.", certa: false, explicacao: "Errado. Um comprovante ou documento apresentado pela própria pessoa não garante que a história seja verdadeira ou que o pedido seja legítimo." }
    ]
  },
  {
    imagem:"pergunta08.jpeg",
    imagemAlt:"Pergunta 8",
    pergunta: "Como agir diante de ameaças ou chantagens emocionais pedindo dinheiro?",
    opcoes: [
      { texto: "Fazer o Pix correndo para salvar a pessoa.", certa: false, explicacao: "Errado. Fazer um Pix sob pressão pode fazer você perder dinheiro antes de confirmar se a história é verdadeira." },
      { texto: "Pedir um empréstimo no banco para ajudar mais.", certa: false, explicacao: "Errado. Pedir um empréstimo aumenta o prejuízo caso o pedido seja um golpe. Primeiro é preciso verificar a situação, não conseguir mais dinheiro para enviar." },
      { texto: "Parar imediatamente, respirar fundo e não ceder à pressão emocional.", certa: true, explicacao: "Exato! A pressão serve apenas para paralisar. Nunca ceda ao medo provocado por estranhos(as)." }
    ]
  },
  {
    imagem:"pergunta09.jpeg",
    imagemAlt:"Pergunta 9",
    pergunta: "Qual é a atitude mais segura a se tomar quando alguém exige dinheiro com pressa na internet?",
    opcoes: [
      { texto: "Guardar o segredo e tentar resolver sozinho(a) para não preocupar ninguém.", certa: false, explicacao: "Errado. Guardar segredo e tentar resolver tudo sozinho(a) pode impedir que alguém de confiança perceba o golpe e ajude você a tomar uma decisão segura." },
      { texto: "Mandar uma pequena quantia só para testar se a pessoa está falando a verdade.", certa: false, explicacao: "Errado. Enviar uma pequena quantia ainda significa entregar dinheiro ao golpista e pode incentivar novos pedidos." },
      { texto: "Parar, não enviar nada e conversar com um(a) familiar ou amigo(a) de confiança.", certa: true, explicacao: "Perfeito! Pare, verifique, converse com alguém de confiança e só então tome uma decisão. Não envie dinheiro sob pressão." }
    ]
  },
  {
    imagem:"pergunta10.jpeg",
    imagemAlt:"Pergunta 10",
    pergunta: "O que deve ser feito imediatamente após perceber que se trata de um golpe?",
    opcoes: [
      { texto: "Continuar respondendo para ver até onde o(a) golpista vai.", certa: false, explicacao: "Errado. Continuar conversando pode dar ao golpista novas oportunidades para manipular você ou fazer outros pedidos." },
      { texto: "Bloquear o contato na mesma hora, denunciar o perfil e avisar os familiares.", certa: true, explicacao: "Isso mesmo! Bloquear, denunciar e avisar pessoas de confiança ajuda a interromper o golpe e evita novas tentativas." },
      { texto: "Deixar o número salvo caso a pessoa precise de ajuda no futuro.", certa: false, explicacao: "Errado Manter o contato salvo pode facilitar uma nova abordagem. Depois de identificar o golpe, é mais seguro interromper o contato." }
    ]
  }
];

let atual = 0;
let pontuacao = 0;
let historico = [];

const textoIntro = "Identifique o Golpe. Você vai ver algumas situações parecidas com conversas reais. Em cada uma, você escolhe entre três alternativas a atitude mais segura. São dez situações, uma de cada vez. Depois de responder, você recebe uma explicação. No final, você vê uma mensagem de conclusão. Pode refazer quantas vezes quiser.";

document.getElementById('botao-ouvir-intro').addEventListener('click', function () {
  falar(textoIntro, this);
});
document.getElementById('botao-ouvir-pergunta').addEventListener('click', function () {
  falar(this.dataset.texto || '', this);
});
document.getElementById('botao-ouvir-feedback').addEventListener('click', function () {
  falar(this.dataset.texto || '', this);
});
document.getElementById('botao-ouvir-resultado').addEventListener('click', function () {
  falar(this.dataset.texto || '', this);
});

function iniciarQuiz() {
  pararTodasLeituras();
  document.getElementById('tela-intro').style.display = 'none';
  document.getElementById('tela-quiz').style.display = 'block';
  atual = 0;
  pontuacao = 0;
  historico = [];
  mostrarPergunta();
}

function mostrarPergunta() {
  pararTodasLeituras();
  const p = perguntas[atual];
  document.getElementById('progresso-texto').textContent = `Pergunta ${atual + 1} de ${perguntas.length}`;
  document.getElementById('progresso-barra').style.width = `${((atual + 1) / perguntas.length) * 100}%`;

  const imagemEl = document.getElementById('imagem-hq');
  const cenaEl = document.getElementById('cena-personagem');

  let textoBase = '';
  if (p.imagem) {
    imagemEl.src = p.imagem;
    imagemEl.alt = p.imagemAlt || '';
    imagemEl.style.display = 'block';
    cenaEl.style.display = 'none';
    textoBase = p.imagemAlt || '';
  } else {
    imagemEl.style.display = 'none';
    cenaEl.style.display = 'flex';
    document.getElementById('texto-conversa').textContent = p.conversa;
    textoBase = p.conversa;
  }

  document.getElementById('texto-pergunta').textContent = p.pergunta;

  const botaoOuvirPergunta = document.getElementById('botao-ouvir-pergunta');
  const letras = ['A', 'B', 'C'];
  const textoAlternativas = p.opcoes.map((op, i) => `Alternativa ${letras[i]}: ${op.texto}`).join('. ');
  botaoOuvirPergunta.dataset.texto = textoBase + '. ' + p.pergunta + '. ' + textoAlternativas + '.';

  const botaoOuvirFeedback = document.getElementById('botao-ouvir-feedback');
  botaoOuvirFeedback.style.display = 'none';

  const container = document.getElementById('opcoes-container');
  container.innerHTML = '';
  p.opcoes.forEach((op, i) => {
    const btn = document.createElement('button');
    btn.className = 'opcao-quiz';
    btn.textContent = op.texto;
    btn.onclick = () => responder(i);
    container.appendChild(btn);
  });

  document.getElementById('feedback').className = 'feedback-quiz';
  document.getElementById('feedback').textContent = '';
  document.getElementById('botao-avancar').className = 'botao botao-primario botao-avancar';
}

function responder(indice) {
  const p = perguntas[atual];
  const botoes = document.querySelectorAll('.opcao-quiz');
  botoes.forEach(b => b.disabled = true);

  const escolhida = p.opcoes[indice];
  botoes[indice].classList.add(escolhida.certa ? 'certa' : 'errada');
  if (!escolhida.certa) {
    const indiceCerta = p.opcoes.findIndex(o => o.certa);
    botoes[indiceCerta].classList.add('certa');
  }

  const feedback = document.getElementById('feedback');
  feedback.classList.add('mostrar');
  feedback.classList.add(escolhida.certa ? 'acerto' : 'erro');
  feedback.textContent = escolhida.explicacao;

  if (escolhida.certa) pontuacao++;

  const botaoOuvirFeedback = document.getElementById('botao-ouvir-feedback');
  botaoOuvirFeedback.style.display = 'inline-flex';
  botaoOuvirFeedback.dataset.texto = feedback.textContent;
  botaoOuvirFeedback.dataset.textoOriginal = '🔊 Ouvir explicação';
  botaoOuvirFeedback.textContent = '🔊 Ouvir explicação';

  historico.push(escolhida.certa);
  document.getElementById('botao-avancar').classList.add('mostrar');
}

function proximaPergunta() {
  atual++;
  if (atual >= perguntas.length) {
    mostrarResultado();
  } else {
    mostrarPergunta();
  }
}

function mostrarResultado() {
  pararTodasLeituras();
  document.getElementById('tela-quiz').style.display = 'none';
  document.getElementById('tela-resultado').style.display = 'block';

  const pct = Math.round((pontuacao / perguntas.length) * 100);
  const textoVisivel = document.getElementById('texto-resultado').textContent;
  let textoResultadoFalado = `Parabéns, você concluiu o quiz! Você acertou ${pontuacao} de ${perguntas.length} perguntas, ou seja, ${pct} por cento. ` + textoVisivel + ' Informação e atenção são importantes para evitar golpes!';
  document.getElementById('botao-ouvir-resultado').dataset.texto = textoResultadoFalado;
}

function reiniciarQuiz() {
  pararTodasLeituras();
  document.getElementById('tela-resultado').style.display = 'none';
  document.getElementById('tela-intro').style.display = 'block';
}