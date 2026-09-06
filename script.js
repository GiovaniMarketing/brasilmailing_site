const header = document.querySelector("[data-header]");
const menu = document.querySelector("[data-menu]");
const toggle = document.querySelector("[data-menu-toggle]");
const form = document.querySelector("[data-contact-form]");
const statusText = document.querySelector("[data-form-status]");
const pjForm = document.querySelector("[data-pj-form]");
const pjUf = document.querySelector("[data-pj-uf]");
const pjCidade = document.querySelector("[data-pj-cidade]");
const pjCnae = document.querySelector("[data-pj-cnae]");
const pjContato = document.querySelector("[data-pj-contato]");
const cnaeSearch = document.querySelector("[data-cnae-search]");
const cnaeResults = document.querySelector("[data-cnae-results]");
const cnaeSelected = document.querySelector("[data-cnae-selected]");
const cnaeStatus = document.querySelector("[data-cnae-status]");
const pjTotal = document.querySelector("[data-pj-total]");
const pjSummary = document.querySelector("[data-pj-summary]");
const pjUpdated = document.querySelector("[data-pj-updated]");
const pjWhatsapp = document.querySelector("[data-pj-whatsapp]");
const pjOrder = document.querySelector("[data-pj-order]");
const pjOrderText = document.querySelector("[data-pj-order-text]");
const pjCopy = document.querySelector("[data-pj-copy]");
let pjData = null;
let cnaeData = [];

function trackWhatsappLead(source) {
  if (typeof window.gtag !== "function") return;
  window.gtag("event", "whatsapp_click", {
    event_category: "lead",
    event_label: source,
  });
}

function updateHeader() {
  header.classList.toggle("is-scrolled", window.scrollY > 20);
}

toggle.addEventListener("click", () => {
  const isOpen = toggle.getAttribute("aria-expanded") === "true";
  toggle.setAttribute("aria-expanded", String(!isOpen));
  menu.classList.toggle("is-open", !isOpen);
  header.classList.toggle("is-open", !isOpen);
});

menu.addEventListener("click", (event) => {
  if (event.target.matches("a")) {
    toggle.setAttribute("aria-expanded", "false");
    menu.classList.remove("is-open");
    header.classList.remove("is-open");
  }
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!form.checkValidity()) {
    statusText.textContent = "Preencha os campos obrigatórios para enviar.";
    form.reportValidity();
    return;
  }

  const data = new FormData(form);
  const message = encodeURIComponent(
    `Olá, gostaria de solicitar um orçamento.\n\nNome: ${data.get("nome")}\nE-mail: ${data.get("email")}\nTelefone: ${data.get("telefone")}\nAssunto: ${data.get("assunto") || "Solicitação de orçamento"}\n\nMensagem: ${data.get("mensagem")}`
  );

  statusText.textContent = "Abrindo o WhatsApp para concluir o envio.";
  trackWhatsappLead("formulario_contato");
  window.location.href = `https://wa.me/5512981612085?text=${message}`;
});

document.querySelectorAll('a[href^="https://wa.me/5512981612085"]').forEach((link) => {
  link.addEventListener("click", () => {
    trackWhatsappLead(link.hasAttribute("data-pj-whatsapp") ? "levantamento_pj" : "botao_whatsapp");
  });
});

function formatNumber(value) {
  return new Intl.NumberFormat("pt-BR").format(value || 0);
}

function formatCurrency(value) {
  const number = Number(value || 0);
  if (!number) return "";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(number);
}

function setOptions(select, values, firstLabel) {
  select.innerHTML = "";
  const first = document.createElement("option");
  first.value = "";
  first.textContent = firstLabel;
  select.appendChild(first);
  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();
}

function splitMultiValues(value) {
  return normalizeText(value)
    .split(/[\n,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitUfValues(value) {
  return normalizeText(value)
    .split(/[^A-Z]+/)
    .map((item) => item.trim())
    .filter((item) => item.length === 2);
}

function splitCnaeValues(value) {
  return String(value || "")
    .split(/[\s,;]+/)
    .map((item) => item.replace(/\D+/g, "").slice(0, 2))
    .filter(Boolean);
}

function formatCnaeCode(value) {
  const digits = String(value || "").replace(/\D+/g, "");
  if (digits.length < 7) return "";
  return `${digits.slice(0, 4)}-${digits.slice(4, 5)}/${digits.slice(5, 7)}`;
}

function cleanCnaeCode(value) {
  return String(value || "").replace(/\D+/g, "").slice(0, 7);
}

function splitFullCnaeValues(value) {
  const matches = String(value || "").match(/\d{4}[-.\s]?\d[\/.\s]?\d{2}/g) || [];
  return [...new Set(matches.map(formatCnaeCode).filter(Boolean))];
}

function splitGeneratorCnaeValues(value) {
  return [...new Set(splitFullCnaeValues(value).map(cleanCnaeCode).filter((code) => code.length === 7))];
}

function formatList(values, emptyLabel = "Todos") {
  if (!values.length) return emptyLabel;
  if (values.length <= 4) return values.join(", ");
  return `${values.slice(0, 4).join(", ")} e mais ${values.length - 4}`;
}

function selectedContactLabel() {
  return pjContato.options[pjContato.selectedIndex]?.textContent || "Todos";
}

function getFormValue(data, key, emptyLabel = "A definir") {
  const value = String(data.get(key) || "").trim();
  return value || emptyLabel;
}

function getRangeValue(data, minKey, maxKey, label) {
  const min = String(data.get(minKey) || "").trim();
  const max = String(data.get(maxKey) || "").trim();
  if (min && max) return `${label}: de ${formatNumber(Number(min))} até ${formatNumber(Number(max))}`;
  if (min) return `${label}: a partir de ${formatNumber(Number(min))}`;
  if (max) return `${label}: até ${formatNumber(Number(max))}`;
  return `${label}: sem limite definido`;
}

function getMoneyRangeValue(data, minKey, maxKey, label) {
  const min = String(data.get(minKey) || "").trim();
  const max = String(data.get(maxKey) || "").trim();
  if (min && max) return `${label}: de ${formatCurrency(min)} até ${formatCurrency(max)}`;
  if (min) return `${label}: a partir de ${formatCurrency(min)}`;
  if (max) return `${label}: até ${formatCurrency(max)}`;
  return `${label}: sem limite definido`;
}

function getCheckedValues(data, key, emptyLabel = "Sem exigência específica") {
  const values = data.getAll(key).map((value) => String(value).trim()).filter(Boolean);
  return values.length ? values.join(", ") : emptyLabel;
}

function describeSelectedCnaes(data) {
  const codes = splitFullCnaeValues(data.get("cnae"));
  if (!codes.length) return "Sem CNAE completo selecionado";

  const byCode = new Map(cnaeData.map((row) => [row.codigo, row]));
  return codes
    .map((code) => {
      const description = byCode.get(code)?.descricao;
      return description ? `${code} - ${description}` : code;
    })
    .join("; ");
}

function describeGeneratorCnaes(data) {
  const codes = splitGeneratorCnaeValues(data.get("cnae"));
  return codes.length ? codes.join(", ") : "Sem CNAE completo selecionado";
}

function calculatePjVolume() {
  if (!pjData) return null;

  const contactKey = pjContato.value || "total";
  const ufValues = splitUfValues(pjUf.value);
  const cityValues = splitMultiValues(pjCidade.value);
  const cnaeValues = splitCnaeValues(pjCnae.value);
  const total = pjData.rows
    .filter((row) => !ufValues.length || ufValues.includes(row.uf))
    .filter((row) => !cityValues.length || cityValues.includes(normalizeText(row.cidade)))
    .filter((row) => !cnaeValues.length || cnaeValues.includes(row.cnae))
    .reduce((sum, row) => sum + (row[contactKey] || 0), 0);

  const filters = {
    uf: formatList(ufValues, "Todos"),
    cidade: formatList(cityValues, "Todas"),
    cnae: formatList(cnaeValues, "Todas"),
    contato: selectedContactLabel(),
  };

  return { total, filters };
}

function buildPjOrderText(result, data = new FormData()) {
  const details = getFormValue(data, "detalhes", "Sem observações adicionais");
  const quantity = getFormValue(data, "quantidade", "A definir");
  const rows = [
    "Pedido PJ preparado pelo site Brasil Mailing",
    "",
    `Cliente/campanha: ${getFormValue(data, "campanha")}`,
    "",
    "Critérios principais:",
    `UF: ${result.filters.uf}`,
    `Cidade: ${result.filters.cidade}`,
    `Bairros: ${getFormValue(data, "bairros", "Todos")}`,
    `CEP ou faixas: ${getFormValue(data, "ceps", "Todos")}`,
    `DDDs: ${getFormValue(data, "ddds", "Todos")}`,
    `Classe CNAE: ${result.filters.cnae}`,
    `CNAEs completos selecionados: ${describeSelectedCnaes(data)}`,
    `CNAEs para gravação no gerador: ${describeGeneratorCnaes(data)}`,
    `Segmentos/CNAEs específicos: ${getFormValue(data, "segmentos", "Sem detalhamento adicional")}`,
    `Tipo de contato: ${result.filters.contato}`,
    getRangeValue(data, "funcionarios_min", "funcionarios_max", "Funcionários"),
    getMoneyRangeValue(data, "faturamento_min", "faturamento_max", "Faturamento estimado"),
    `Situação cadastral: ${getFormValue(data, "situacao", "Todas")}`,
    `Perfil societário: ${getFormValue(data, "socios", "Sem exigência")}`,
    `Critérios do sócio: ${getFormValue(data, "criterios_socios", "Sem exigência específica")}`,
    "",
    "Preparação do pedido:",
    `Volume estimado nos critérios com consulta imediata: ${formatNumber(result.total)} registros`,
    `Quantidade desejada: ${quantity}`,
    `Dados obrigatórios: ${getCheckedValues(data, "obrigatorios")}`,
    `Formato de entrega: ${getFormValue(data, "formato", "Excel")}`,
    `Finalidade da ação: ${getFormValue(data, "finalidade")}`,
    `Observações adicionais: ${details}`,
  ];

  return rows.join("\n");
}

function buildEmptyFormData() {
  return pjForm ? new FormData(pjForm) : new FormData();
}

function buildPjOrderSummary(result) {
  return (
    `${result.filters.uf} / ${result.filters.cidade} / ` +
    `CNAE ${result.filters.cnae} / ${result.filters.contato}`
  );
}

function updatePjResult(result, data = buildEmptyFormData(), prepareOrder = false) {
  if (!result) {
    pjTotal.textContent = "--";
    pjSummary.textContent = "Informe os critérios para preparar o levantamento.";
    pjOrder.hidden = true;
    pjWhatsapp.classList.add("is-disabled");
    pjWhatsapp.href = "#";
    return;
  }

  pjTotal.textContent = formatNumber(result.total);
  pjSummary.textContent = buildPjOrderSummary(result);

  pjOrder.hidden = !prepareOrder;
  const orderText = buildPjOrderText(result, data);
  if (prepareOrder) {
    pjOrderText.textContent = orderText;
  } else {
    pjOrderText.textContent = "";
  }

  const message = encodeURIComponent(orderText);
  pjWhatsapp.href = `https://wa.me/5512981612085?text=${message}`;
  pjWhatsapp.classList.toggle("is-disabled", result.total <= 0 || !prepareOrder);
}

async function loadPjData() {
  if (!pjForm) return;
  try {
    const response = await fetch("data/pj_quantitativo.json", { cache: "no-store" });
    if (!response.ok) throw new Error("Arquivo de consulta indisponível.");
    pjData = await response.json();
    pjUpdated.textContent = `Atualizado em ${new Date(`${pjData.updatedAt}T00:00:00`).toLocaleDateString("pt-BR")}.`;
    updatePjResult(calculatePjVolume());
  } catch (error) {
    pjUpdated.textContent = "Consulta indisponível no momento.";
    pjSummary.textContent = "Entre em contato pelo WhatsApp para solicitar um levantamento.";
  }
}

function syncSelectedCnaes() {
  if (!cnaeSelected || !pjCnae) return;
  const codes = splitFullCnaeValues(pjCnae.value);
  if (!codes.length) {
    cnaeSelected.innerHTML = "";
    return;
  }

  cnaeSelected.innerHTML = codes
    .map((code) => `<span>${code}</span>`)
    .join("");
}

function addCnae(code) {
  const current = splitFullCnaeValues(pjCnae.value);
  if (!current.includes(code)) current.push(code);
  pjCnae.value = current.join("\n");
  syncSelectedCnaes();
  updatePjResult(calculatePjVolume(), buildEmptyFormData());
}

function renderCnaeResults() {
  if (!cnaeResults || !cnaeSearch) return;
  const term = normalizeText(cnaeSearch.value);
  if (!term || term.length < 2) {
    cnaeResults.innerHTML = "";
    return;
  }

  const matches = cnaeData
    .filter((row) => normalizeText(row.busca).includes(term))
    .slice(0, 12);

  cnaeResults.innerHTML = matches.length
    ? matches
        .map(
          (row) =>
            `<button type="button" data-cnae-add="${row.codigo}"><strong>${row.codigo}</strong><span>${row.descricao}</span></button>`
        )
        .join("")
    : "<p>Nenhum CNAE encontrado.</p>";
}

async function loadCnaeData() {
  if (!cnaeSearch) return;
  try {
    const response = await fetch("data/cnae.json", { cache: "no-store" });
    if (!response.ok) throw new Error("Tabela CNAE indisponível.");
    const data = await response.json();
    cnaeData = data.rows || [];
    cnaeStatus.textContent = `${formatNumber(cnaeData.length)} CNAEs disponíveis para seleção.`;
  } catch {
    cnaeStatus.textContent = "Tabela CNAE indisponível no momento.";
  }
}

if (pjForm) {
  pjForm.querySelectorAll("input, textarea, select").forEach((field) => {
    const refresh = () => updatePjResult(calculatePjVolume(), buildEmptyFormData());
    field.addEventListener("input", refresh);
    field.addEventListener("change", refresh);
  });
  pjCnae.addEventListener("input", syncSelectedCnaes);
  cnaeSearch?.addEventListener("input", renderCnaeResults);
  cnaeResults?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-cnae-add]");
    if (!button) return;
    addCnae(button.getAttribute("data-cnae-add"));
  });
  pjForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const result = calculatePjVolume();
    const data = new FormData(pjForm);
    updatePjResult(result, data, true);
    const total = result?.total || 0;
    pjForm.querySelector("[data-pj-status]").textContent = total
      ? `Pedido preparado com ${formatNumber(total)} registros estimados.`
      : "Nenhum volume encontrado para os filtros selecionados.";
  });
  pjCopy.addEventListener("click", async () => {
    if (!pjOrderText.textContent) return;
    try {
      await navigator.clipboard.writeText(pjOrderText.textContent);
      pjForm.querySelector("[data-pj-status]").textContent = "Pedido copiado.";
    } catch {
      pjForm.querySelector("[data-pj-status]").textContent = "Selecione o texto do pedido para copiar.";
    }
  });
  loadPjData();
  loadCnaeData();
}

window.addEventListener("scroll", updateHeader, { passive: true });
updateHeader();
