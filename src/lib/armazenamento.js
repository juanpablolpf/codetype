// localStorage pode falhar (aba anônima, site bloqueado), então tudo passa por try/catch.
export const armazenamento = {
  ler(chave, padrao) {
    try {
      const valor = localStorage.getItem(chave)
      return valor === null ? padrao : valor
    } catch {
      return padrao
    }
  },
  salvar(chave, valor) {
    try {
      localStorage.setItem(chave, valor)
    } catch {
      // sem armazenamento, o recorde só não fica salvo
    }
  },
}
